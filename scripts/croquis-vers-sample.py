#!/usr/bin/env python3
"""
Prépare la branche du robot qui ajoute à arduino-steami-sample les croquis
Arduino écrits en ligne dans les pages du wiki et marqués `sample=GROUPE/Nom`.

Lancé par .github/workflows/croquis-vers-sample.yml après une fusion sur main
qui touche docs/, dans un clone d'arduino-steami-sample (origin/main, la
branche distante du robot si elle existe, et les tags). Le script ne pousse
rien et n'ouvre aucune PR : il prépare la branche locale `wiki/croquis`, puis
le workflow la pousse et ouvre (ou met à jour) l'unique PR du robot.

1. Il vérifie les pages comme `npm run lint:inline-sketches` (mêmes règles,
   tag épinglé dans exemples-arduino-sample.json) : s'il y a une erreur, il
   s'arrête sans rien préparer.
2. Il part de la branche distante `wiki/croquis` avec `--reprendre` (une PR
   du robot est ouverte : elle est mise à jour, jamais doublée), sinon de
   origin/main (aucune PR ouverte : l'ancienne branche, d'une PR fusionnée ou
   fermée, est remplacée).
3. Pour chaque bloc `sample=` en attente, dans l'ordre des pages, il écrit
   examples/<GROUPE>/<Nom>/<Nom>.ino = en-tête « // Croquis de la page du
   wiki « <titre> (<page>) ». », ligne vide, code du bloc :
   - croquis déjà sur origin/main du sample (fusionné, en attente de release) :
     ignoré, jamais remplacé ; si son code diffère du bloc (bloc modifié dans
     le wiki après la fusion de la PR du robot, ou nom pris par un autre
     croquis), avertissement : la PR d'épinglage remplacera le bloc par le
     croquis de main, la modification de la page est à reporter à la main
     dans arduino-steami-sample ;
   - fichier absent de la branche : un commit `feat(<groupe>): Add <Nom> from
     the wiki.` ;
   - fichier identique : rien (rejeu sans doublon) ;
   - page modifiée depuis le dernier commit du robot pour ce croquis : un
     commit `feat(<groupe>): Update <Nom> from the wiki.` ;
   - page inchangée mais fichier corrigé à la main dans la PR : rien (la
     correction est gardée).
4. Il annonce les croquis de la branche qui ne sont plus marqués dans le wiki
   (le robot ne retire rien de la PR) : avertissement, et ligne du corps de
   la PR, que le workflow met à jour même sans commit à pousser.

Sorties (--sortie-github, en général $GITHUB_OUTPUT) :
  pousser=true|false  la branche locale a des commits à pousser ;
  croquis=<ids>       croquis ajoutés ou modifiés par la branche par rapport à
                      main, séparés par des espaces (pour le corps de la PR).
--corps écrit le corps (en anglais, comme le dépôt sample) de la PR.

Usage :
    python3 scripts/croquis-vers-sample.py --sample DIR [--reprendre]
        [--pages DIR] [--epingle-sample PATH] [--sortie-github PATH] [--corps PATH]
"""

import argparse
import importlib.util
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from croquis_en_ligne import CLOTURE, blocs, meme_code

RACINE = Path(__file__).resolve().parent.parent
PAGES_DEFAUT = RACINE / "docs"
EPINGLE_SAMPLE_DEFAUT = RACINE / "exemples-arduino-sample.json"
BRANCHE = "wiki/croquis"
WIKI = "https://github.com/steamicc/wiki_steami"
MAIN = "origin/main"

_spec = importlib.util.spec_from_file_location(
    "check_inline_sketches", Path(__file__).resolve().parent / "check-inline-sketches.py"
)
check = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(check)


class ErreurRobot(Exception):
    pass


def entete(titre, chemin):
    """En-tête des croquis du wiki dans le sample (retiré à l'affichage par
    plugins/remark-code-file.js), suivi d'une ligne vide."""
    return f"// Croquis de la page du wiki « {titre} ({chemin}) ».\n\n"


def _sans_guillemets(valeur):
    if len(valeur) >= 2 and valeur[0] == valeur[-1] == '"':
        return valeur[1:-1].replace('\\"', '"')
    if len(valeur) >= 2 and valeur[0] == valeur[-1] == "'":
        return valeur[1:-1].replace("''", "'")
    return valeur


def _titre_du_frontmatter(lignes):
    """(`title` du frontmatter ou None, indice de la première ligne après lui)."""
    if not lignes or lignes[0].strip() != "---":
        return None, 0
    fin = next((i for i, l in enumerate(lignes[1:], 1) if l.strip() == "---"), None)
    if fin is None:
        return None, 0
    for ligne in lignes[1:fin]:
        if ligne.startswith("title:") and ligne[len("title:"):].strip():
            return _sans_guillemets(ligne[len("title:"):].strip()), fin + 1
    return None, fin + 1


def _ferme(m, cloture):
    """La ligne m (CLOTURE) ferme-t-elle le bloc ouvert par `cloture` ?"""
    return bool(m) and m.group(1)[0] == cloture[0] and len(m.group(1)) >= len(cloture) and not m.group(2).strip()


def _premier_titre(lignes):
    """Texte du premier titre `# ` hors bloc de code, None sinon."""
    cloture = None
    for ligne in lignes:
        m = CLOTURE.match(ligne.lstrip())
        if cloture is not None:
            cloture = None if _ferme(m, cloture) else cloture
        elif m:
            cloture = m.group(1)
        elif ligne.startswith("# ") and ligne[2:].strip():
            # Séquence fermante facultative (« # Titre # »), précédée d'une espace.
            return re.sub(r"\s#+$", "", ligne[2:].strip())
    return None


def titre_de_page(texte, defaut):
    """`title` du frontmatter, sinon premier titre `#` hors bloc de code."""
    lignes = texte.splitlines()
    titre, debut = _titre_du_frontmatter(lignes)
    return titre or _premier_titre(lignes[debut:]) or defaut


def chemin_croquis(ident):
    groupe, nom = ident.split("/", 1)
    return f"examples/{groupe}/{nom}/{nom}.ino"


def ident_de_chemin(chemin):
    """GROUPE/Nom pour examples/GROUPE/Nom/Nom.ino, None sinon."""
    parties = chemin.split("/")
    if len(parties) == 4 and parties[0] == "examples" and parties[3] == f"{parties[2]}.ino":
        return f"{parties[1]}/{parties[2]}"
    return None


def sujets(ident):
    """(sujet d'ajout, sujet de mise à jour) des commits du robot pour un croquis."""
    groupe, nom = ident.split("/", 1)
    return (
        f"feat({groupe.lower()}): Add {nom} from the wiki.",
        f"feat({groupe.lower()}): Update {nom} from the wiki.",
    )


def git(depot, *args, check=True):
    r = subprocess.run(
        ["git", "-C", str(depot), *args], capture_output=True, text=True, check=False
    )
    if check and r.returncode != 0:
        raise ErreurRobot(f"git {' '.join(args)} : {r.stderr.strip() or r.stdout.strip()}")
    return r


def ref_existe(depot, ref):
    return git(depot, "rev-parse", "-q", "--verify", f"{ref}^{{commit}}", check=False).returncode == 0


def ids_a(depot, ref):
    """Ids des croquis examples/GROUPE/Nom/Nom.ino au commit `ref`."""
    sortie = git(depot, "ls-tree", "-r", "--name-only", ref, "--", "examples").stdout
    return {i for i in map(ident_de_chemin, sortie.splitlines()) if i}


def contenu_a(depot, ref, chemin):
    r = subprocess.run(
        ["git", "-C", str(depot), "show", f"{ref}:{chemin}"], capture_output=True, check=False
    )
    return r.stdout.decode("utf-8") if r.returncode == 0 else None


def dernier_ecrit_par_le_robot(depot, ident):
    """Contenu du croquis au dernier commit du robot qui l'a écrit, None sinon."""
    chemin = chemin_croquis(ident)
    sortie = git(depot, "log", "--format=%H%x09%s", "HEAD", "--", chemin).stdout
    for ligne in sortie.splitlines():
        sha, _, sujet = ligne.partition("\t")
        if sujet in sujets(ident):
            return contenu_a(depot, sha, chemin)
    return None


def croquis_de_la_branche(depot):
    """Ids que la branche ajoute ou modifie par rapport à origin/main, dans
    l'ordre de leur premier commit."""
    differents = set(git(depot, "diff", "--name-only", MAIN, "HEAD", "--", "examples").stdout.splitlines())
    ordre = []
    sortie = git(depot, "log", "--reverse", "--format=", "--name-only", f"{MAIN}..HEAD").stdout
    for chemin in sortie.splitlines():
        ident = ident_de_chemin(chemin)
        if chemin in differents and ident and ident not in ordre:
            ordre.append(ident)
    return ordre


def corps_de_pr(croquis, pages):
    lignes = [
        f"Sketches written in the pages of the [STeaMi wiki]({WIKI}) and marked "
        "`sample=GROUP/Name`, added by the wiki robot "
        f"([croquis-vers-sample.yml]({WIKI}/blob/main/.github/workflows/croquis-vers-sample.yml)).",
        "",
        "| Sketch | Wiki page |",
        "| --- | --- |",
    ]
    for ident in croquis:
        if ident in pages:
            fichier, titre = pages[ident]
            page = f"[{titre}]({WIKI}/blob/main/{fichier})"
        else:
            page = "no longer marked `sample=` in the wiki"
        lignes.append(f"| `{ident}` | {page} |")
    lignes += [
        "",
        "The CI compiles them. Fix a sketch on this branch if needed, then merge "
        "(squash): the title of this pull request is the release commit. After the "
        "release, the pull request of the wiki that pins the new version replaces "
        "each inline block by the published sketch, fixes included.",
        "",
        "The robot never merges. When a sketch changes in its wiki page, the robot "
        "adds a commit to this pull request; a sketch fixed here is kept as long "
        "as its wiki page does not change. Closing this pull request does not drop "
        "a sketch: mark its block `norun` in the wiki page instead, or the robot "
        "opens a new pull request at the next change of the wiki pages.",
    ]
    return "\n".join(lignes) + "\n"


def _avertir(message, actions):
    print(f"::warning::{message}" if actions else f"Attention : {message}")


def _ids_au_tag(depot, version):
    """Ids du sample au tag épinglé (vide si le sample n'est pas épinglé)."""
    if version is None:
        return set()
    if not ref_existe(depot, f"refs/tags/{version}"):
        raise ErreurRobot(
            f"tag {version} (exemples-arduino-sample.json) introuvable dans le clone {depot} : "
            "cloner arduino-steami-sample avec ses tags"
        )
    return ids_a(depot, f"refs/tags/{version}")


def _partir_de(depot, reprendre):
    """Crée la branche locale du robot ; renvoie le commit dont elle part."""
    distante = f"origin/{BRANCHE}"
    if reprendre and not ref_existe(depot, distante):
        raise ErreurRobot(f"--reprendre : branche {distante} introuvable dans le clone")
    base = distante if reprendre else MAIN
    git(depot, "switch", "-q", "--no-track", "-C", BRANCHE, base)
    return base


def _ecrire(depot, ident, contenu):
    """Commit du croquis sur la branche s'il le faut ; renvoie ce qui a été fait."""
    chemin = chemin_croquis(ident)
    actuel = contenu_a(depot, "HEAD", chemin)
    ajout, maj = sujets(ident)
    if actuel == contenu:
        return f"déjà à jour sur la branche {BRANCHE}."
    if actuel is not None and dernier_ecrit_par_le_robot(depot, ident) == contenu:
        return f"page inchangée, croquis corrigé sur la branche {BRANCHE} : gardé."
    sujet = ajout if actuel is None else maj
    fichier = depot / chemin
    fichier.parent.mkdir(parents=True, exist_ok=True)
    fichier.write_bytes(contenu.encode("utf-8"))
    git(depot, "add", "--", chemin)
    git(depot, "commit", "-q", "-m", sujet, "--", chemin)
    return sujet


def preparer(depot, liste_blocs, version, reprendre, racine, actions=False):
    """Prépare la branche locale ; renvoie (pousser, croquis, pages).

    racine : dossier auquel les chemins des pages des blocs sont relatifs.
    """
    if not ref_existe(depot, MAIN):
        raise ErreurRobot(f"{MAIN} introuvable dans {depot} : cloner arduino-steami-sample")
    erreurs, attente = check.verifier(liste_blocs, _ids_au_tag(depot, version), version)
    if erreurs:
        raise ErreurRobot(
            "\n".join(str(e) for e in erreurs)
            + "\nCorriger d'abord les pages (npm run lint:inline-sketches) : le robot n'a rien préparé."
        )
    base = _partir_de(depot, reprendre)

    ids_main = ids_a(depot, MAIN)
    pages = {}
    titres = {}
    for b in attente:
        ident = b.id_sample
        page = Path(b.fichier).as_posix()
        if page not in titres:
            texte = (Path(racine) / b.fichier).read_text(encoding="utf-8")
            titres[page] = titre_de_page(texte, Path(page).stem)
        pages[ident] = (page, titres[page])
        if ident in ids_main:
            print(f"{ident} : déjà sur main d'arduino-steami-sample (publié à la prochaine release), ignoré.")
            if not meme_code(contenu_a(depot, MAIN, chemin_croquis(ident)) or "", b.code):
                _avertir(
                    f"{page}:{b.ligne_debut} : le bloc sample={ident} diffère du croquis "
                    "déjà sur main d'arduino-steami-sample (bloc modifié après la fusion "
                    "de la PR du robot, ou nom pris par un autre croquis). Le robot ne le "
                    "remplace pas : la PR d'épinglage de la prochaine release remettra "
                    "dans la page le croquis de main. Reporter la modification par une PR "
                    "dans arduino-steami-sample, ou choisir un autre nom.",
                    actions,
                )
        else:
            print(f"{ident} : {_ecrire(depot, ident, entete(titres[page], page) + b.code)}")

    croquis = croquis_de_la_branche(depot)
    for ident in croquis:
        if ident not in pages:
            _avertir(
                f"{ident} est sur la branche {BRANCHE} mais n'est plus marqué sample= dans le wiki : "
                "le retirer de la PR d'arduino-steami-sample à la main s'il ne doit pas être publié.",
                actions,
            )
    pousser = git(depot, "rev-parse", "HEAD").stdout != git(depot, "rev-parse", base).stdout
    return pousser, croquis, pages


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--sample", type=Path, required=True, help="clone d'arduino-steami-sample")
    parser.add_argument("--reprendre", action="store_true",
                        help=f"continuer la branche distante {BRANCHE} (PR du robot ouverte)")
    parser.add_argument("--pages", type=Path, default=PAGES_DEFAUT)
    parser.add_argument("--epingle-sample", type=Path, default=EPINGLE_SAMPLE_DEFAUT)
    parser.add_argument("--sortie-github", type=Path)
    parser.add_argument("--corps", type=Path)
    args = parser.parse_args(argv)
    actions = os.environ.get("GITHUB_ACTIONS") == "true"

    version = check.version_epinglee(args.epingle_sample)
    try:
        pousser, croquis, pages = preparer(
            args.sample, blocs(args.pages), version, args.reprendre, args.pages.parent, actions
        )
    except ErreurRobot as e:
        for ligne in str(e).splitlines():
            print(f"::error::{ligne}" if actions else f"Erreur : {ligne}", file=sys.stderr)
        return 1

    if args.sortie_github:
        with args.sortie_github.open("a", encoding="utf-8") as f:
            f.write(f"pousser={'true' if pousser else 'false'}\n")
            f.write(f"croquis={' '.join(croquis)}\n")
    if args.corps:
        args.corps.write_text(corps_de_pr(croquis, pages), encoding="utf-8")
    etat = "à pousser" if pousser else "rien à pousser"
    print(f"Branche {BRANCHE} : {etat} ; croquis de la PR : {' '.join(croquis) or 'aucun'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
