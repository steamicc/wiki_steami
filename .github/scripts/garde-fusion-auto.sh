#!/usr/bin/env bash
# Garde commune de fusion automatique des PR ouvertes par les robots steamicc.
#
# Usage : garde-fusion-auto.sh <owner/repo> <numéro-de-PR> <slug-de-l-App> <contexte-exigé>...
# Environnement : GH_TOKEN, le jeton de l'App (actions/create-github-app-token).
#
# Ordre des contrôles :
#   1. numéro de PR numérique ;
#   2. PR venue du dépôt lui-même, jamais d'un fork ;
#   3. auteur « app/<slug> » ou « <slug>[bot] » ;
#   4. chaque contexte donné est exigé sur la branche par défaut (lue sur le dépôt) ;
#   5. current_user_can_bypass vaut « never » sur chaque ruleset qui porte des checks ;
#   6. PR ouverte, hors brouillon, sans l'étiquette « garder-ouverte » ;
#   7. fusion auto déjà activée : lecture des checks exigés sur le SHA de tête,
#      une seule relance d'un check rouge, puis échec du run ;
#   8. sinon : gh pr merge --auto --squash.
#
# Codes de sortie :
#   0  décision prise : fusion auto activée, déjà activée, checks relancés, ou PR
#      laissée à un humain (::warning:: ou ::notice:: qui dit pourquoi) ;
#   1  anomalie à examiner (::error::) : fork, auteur étranger, API illisible,
#      check encore rouge après une relance, activation refusée par GitHub ;
#   2  appel incorrect (arguments, GH_TOKEN absent).
#
# Ce fichier est copié à l'identique dans plusieurs dépôts steamicc, et un test
# de chaque dépôt compare son sha256 à une référence. Ne pas le modifier dans un
# seul dépôt : modifier la source commune, recopier partout, mettre à jour les
# références.
set -euo pipefail

usage() {
  echo "::error::Usage : garde-fusion-auto.sh <owner/repo> <numéro-de-PR> <slug-de-l-App> <contexte-exigé>... (GH_TOKEN dans l'environnement)"
  exit 2
}

[ "$#" -ge 4 ] || usage
REPO=$1
PR=$2
SLUG=$3
shift 3
CONTEXTES=("$@")
[[ "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || usage
[[ "$SLUG" =~ ^[A-Za-z0-9_.-]+$ ]] || usage
for contexte in "${CONTEXTES[@]}"; do
  [ -n "$contexte" ] || usage
done
if [ -z "${GH_TOKEN:-}" ]; then
  echo "::error::GH_TOKEN est vide : la garde a besoin du jeton de l'App."
  exit 2
fi

# PR laissée à un humain, avec la raison.
refuser() {
  echo "::warning::PR #$PR de $REPO : fusion automatique non activée, $1"
  exit 0
}
# Rien à faire, par choix d'un humain.
laisser() {
  echo "::notice::PR #$PR de $REPO : $1"
  exit 0
}
# Anomalie : le run du robot passe au rouge pour que quelqu'un le voie.
echouer() {
  echo "::error::PR #$PR de $REPO : $1"
  exit 1
}
# lire <variable> <arguments de gh api>... : met la réponse JSON dans <variable>.
depot="" regles="" pages="" job=""
lire() {
  local __variable=$1 __json
  shift
  if ! __json=$(gh api "$@" </dev/null); then
    echouer "lecture impossible de l'API GitHub (gh api $*)."
  fi
  printf -v "$__variable" '%s' "$__json"
}

# 1. Numéro de PR.
if ! [[ "$PR" =~ ^[1-9][0-9]*$ ]]; then
  echo "::warning::Numéro de PR invalide (« $PR ») pour $REPO : fusion automatique non activée."
  exit 0
fi

if ! etat=$(gh pr view "$PR" -R "$REPO" \
  --json isCrossRepository,author,isDraft,labels,autoMergeRequest,state,headRefOid </dev/null); then
  echouer "lecture de la PR impossible (gh pr view)."
fi

# 2. Jamais de fusion automatique pour une PR venue d'un fork.
if ! jq -e '.isCrossRepository == false' <<<"$etat" >/dev/null; then
  echouer "la PR vient d'un fork (ou son origine est inconnue) : fusion automatique refusée."
fi
echo "PR #$PR : ouverte depuis $REPO, pas depuis un fork."

# 3. Seul le robot peut voir sa PR fusionnée automatiquement.
auteur=$(jq -r '.author.login // ""' <<<"$etat")
if [ "$auteur" != "app/$SLUG" ] && [ "$auteur" != "${SLUG}[bot]" ]; then
  echouer "ouverte par « $auteur », pas par le robot $SLUG : fusion automatique refusée."
fi
echo "PR #$PR : auteur « $auteur » reconnu comme le robot $SLUG."

# 4. Sans check exigé, « gh pr merge --auto » fusionnerait tout de suite, même
#    avec une CI rouge. La branche par défaut est lue sur le dépôt.
lire depot "repos/$REPO"
branche=$(jq -r '.default_branch // ""' <<<"$depot")
[ -n "$branche" ] || echouer "branche par défaut de $REPO introuvable."
lire regles "repos/$REPO/rules/branches/$branche?per_page=100"
jq -e 'type == "array"' <<<"$regles" >/dev/null ||
  echouer "réponse inattendue pour les règles de $branche."
manquants=""
for contexte in "${CONTEXTES[@]}"; do
  if ! jq -e --arg c "$contexte" \
    'any(.[]; .type == "required_status_checks"
              and any(.parameters.required_status_checks[]?; .context == $c))' \
    <<<"$regles" >/dev/null; then
    manquants="$manquants « $contexte »"
  fi
done
if [ -n "$manquants" ]; then
  refuser "car aucune règle de $branche n'exige$manquants. Ajouter ces checks au ruleset « CI verte avant fusion » de $branche (Settings > Rules > Rulesets), sinon la PR serait fusionnée même avec une CI rouge. En attendant, fusionner la PR à la main une fois la CI au vert."
fi
echo "PR #$PR : checks exigés sur $branche :$(printf ' « %s »' "${CONTEXTES[@]}")."

# 5. Seuls les rulesets qui portent des checks comptent (jamais le ruleset
#    d'organisation Default_Ruleset, que l'App contourne légitimement). Si
#    l'acteur du jeton peut les contourner, ou si on ne peut pas le savoir,
#    GitHub fusionnerait sans attendre la CI.
mapfile -t rulesets < <(jq -r '[.[] | select(.type == "required_status_checks")
  | "\(.ruleset_source_type) \(.ruleset_id)"] | unique | .[]' <<<"$regles")
for ligne in "${rulesets[@]}"; do
  source=${ligne%% *}
  id=${ligne#* }
  if [ "$source" != Repository ] || ! [[ "$id" =~ ^[0-9]+$ ]]; then
    refuser "car des checks exigés viennent du ruleset $id (source $source), dont le contournement n'est pas vérifiable avec le jeton du dépôt. Porter ces checks par un ruleset du dépôt, ou fusionner la PR à la main."
  fi
  if ruleset=$(gh api "repos/$REPO/rulesets/$id" </dev/null); then
    contournement=$(jq -r '.current_user_can_bypass // "absent"' <<<"$ruleset")
  else
    contournement=illisible
  fi
  if [ "$contournement" != never ]; then
    refuser "car l'acteur du jeton peut contourner le ruleset $id (current_user_can_bypass : $contournement) : GitHub fusionnerait sans attendre la CI. Retirer les acteurs de contournement de ce ruleset, ou fusionner la PR à la main une fois la CI au vert."
  fi
  echo "PR #$PR : ruleset $id sans contournement possible (never)."
done

# 6. Choix d'un humain.
etat_pr=$(jq -r '.state // ""' <<<"$etat")
if [ "$etat_pr" != OPEN ]; then
  laisser "PR dans l'état « $etat_pr », rien à faire."
fi
if jq -e '.isDraft == true' <<<"$etat" >/dev/null; then
  laisser "PR en brouillon, fusion automatique laissée désactivée."
fi
if jq -e 'any(.labels[]?; .name == "garder-ouverte")' <<<"$etat" >/dev/null; then
  laisser "étiquette « garder-ouverte », fusion automatique laissée désactivée : à fusionner à la main."
fi

# 7. Fusion auto déjà activée : une PR dont un check exigé est rouge resterait
#    bloquée sans signal. Une relance, puis échec du run du robot.
if jq -e '.autoMergeRequest != null' <<<"$etat" >/dev/null; then
  sha=$(jq -r '.headRefOid // ""' <<<"$etat")
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || echouer "SHA de tête introuvable."
  lire pages --paginate "repos/$REPO/commits/$sha/check-runs?per_page=100"
  checks=$(jq -s '[.[].check_runs[]?]' <<<"$pages")
  en_cours=""
  rouges=()
  for contexte in "${CONTEXTES[@]}"; do
    check=$(jq -c --arg c "$contexte" \
      '[.[] | select(.name == $c)] | max_by(.id) // empty' <<<"$checks")
    if [ -z "$check" ]; then
      en_cours="$en_cours « $contexte » (pas encore lancé)"
      continue
    fi
    statut=$(jq -r '.status' <<<"$check")
    conclusion=$(jq -r '.conclusion // ""' <<<"$check")
    if [ "$statut" != completed ]; then
      en_cours="$en_cours « $contexte » ($statut)"
    else
      case "$conclusion" in
        failure | cancelled | timed_out)
          rouges+=("$(jq -r '.id' <<<"$check") $contexte")
          ;;
      esac
    fi
  done

  if [ "${#rouges[@]}" -gt 0 ]; then
    a_relancer=()
    deja=""
    for rouge in "${rouges[@]}"; do
      id_check=${rouge%% *}
      contexte=${rouge#* }
      lire job "repos/$REPO/actions/jobs/$id_check"
      run_id=$(jq -r '.run_id // ""' <<<"$job")
      tentative=$(jq -r '.run_attempt // ""' <<<"$job")
      [[ "$run_id" =~ ^[0-9]+$ ]] || echouer "run du check « $contexte » introuvable."
      if [ "$tentative" = 1 ]; then
        case " ${a_relancer[*]} " in
          *" $run_id "*) ;;
          *) a_relancer+=("$run_id") ;;
        esac
      else
        deja="$deja « $contexte » (run $run_id, tentative $tentative)"
      fi
    done
    if [ -n "$deja" ]; then
      echouer "fusion automatique activée, mais check(s) exigé(s) encore rouge(s) après une relance :$deja. La PR reste bloquée : corriger la cause, ou la fermer."
    fi
    for run_id in "${a_relancer[@]}"; do
      if ! gh run rerun "$run_id" --failed -R "$REPO" </dev/null; then
        echouer "relance impossible du run $run_id (gh run rerun --failed)."
      fi
    done
    echo "::warning::PR #$PR de $REPO : check(s) exigé(s) rouge(s), run(s)$(printf ' %s' "${a_relancer[@]}") relancé(s) une fois. S'ils échouent encore, le robot passera au rouge."
    exit 0
  fi
  if [ -n "$en_cours" ]; then
    echo "PR #$PR : fusion automatique déjà activée, checks exigés en cours :$en_cours."
    exit 0
  fi
  echo "PR #$PR : fusion automatique déjà activée, checks exigés au vert ; GitHub fusionnera la PR."
  exit 0
fi

# 8. Activation.
if ! gh pr merge "$PR" -R "$REPO" --auto --squash </dev/null; then
  echouer "impossible d'activer la fusion automatique. Vérifier « Allow auto-merge » et « Allow squash merging » (Settings > General > Pull Requests), et que l'App a Contents et Pull requests en écriture."
fi
echo "PR #$PR : fusion automatique (squash) activée, la PR sera fusionnée dès que la CI sera au vert."
