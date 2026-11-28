#!/usr/bin/env python3
"""Faux `gh` pour exécuter les étapes des workflows suivre-* hors de GitHub.

Lit l'état simulé dans le fichier JSON $FAUX_GH :
  {"release": {...}, "prs": [{"number", "state", "headRefName",
   "isCrossRepository", "author": {"login"}, "mergeable" (chaîne ou liste
   lue dans l'ordre des appels), "headRefOid", "isDraft", "autoMergeRequest",
   "commits": [{"sha", "author": {"login"}}]}],
   pour la garde commune .github/scripts/garde-fusion-auto.sh :
   "depot" (repos/<r>), "regles" (rules/branches/<b>), "rulesets" ({id: ...}),
   "check_runs" (commits/<sha>/check-runs), "jobs" ({id: ...})}
et note chaque appel (une ligne JSON par appel) dans $FAUX_GH_LOG.
"pr create" répond par l'URL de la PR "numero_cree" (99 par défaut).
"""

import json
import os
import subprocess
import sys


def sortir(valeur, jq):
    texte = json.dumps(valeur)
    if jq is None:
        print(texte)
        return
    res = subprocess.run(["jq", "-r", jq], input=texte, capture_output=True, text=True, check=True)
    sys.stdout.write(res.stdout)


def option(args, nom, defaut=None):
    if nom in args:
        return args[args.index(nom) + 1]
    return defaut


def projeter(pr, champs, appels):
    vu = {}
    for champ in champs.split(","):
        valeur = pr.get(champ)
        if champ == "mergeable" and isinstance(valeur, list):
            # Valeur suivante à chaque lecture (UNKNOWN puis la vraie valeur).
            deja = sum(
                1
                for a in appels
                if a[:3] == ["pr", "view", str(pr["number"])] and "mergeable" in " ".join(a)
            )
            valeur = valeur[min(deja, len(valeur) - 1)]
        vu[champ] = valeur
    return vu


def main():
    args = sys.argv[1:]
    etat = json.loads(open(os.environ["FAUX_GH"], encoding="utf-8").read())
    journal = os.environ["FAUX_GH_LOG"]
    appels = []
    if os.path.exists(journal):
        appels = [json.loads(l) for l in open(journal, encoding="utf-8") if l.strip()]
    with open(journal, "a", encoding="utf-8") as f:
        f.write(json.dumps(args) + "\n")
    jq = option(args, "--jq")
    prs = etat.get("prs", [])

    if args[0] == "api":
        # Le chemin est le premier argument qui n'est pas une option (--paginate avant ou après).
        chemin = next(a for a in args[1:] if not a.startswith("-"))
        chemin = chemin.split("?")[0]
        morceaux = chemin.split("/")
        if len(morceaux) == 3 and morceaux[0] == "repos":
            return sortir(etat.get("depot", {"default_branch": "main"}), jq)
        if "/rules/branches/" in chemin:
            return sortir(etat.get("regles", []), jq)
        if "/rulesets/" in chemin:
            ruleset = etat.get("rulesets", {}).get(morceaux[-1])
            if ruleset is None:
                sys.exit(f"faux gh : ruleset inconnu {chemin}")
            return sortir(ruleset, jq)
        if chemin.endswith("/check-runs"):
            return sortir({"check_runs": etat.get("check_runs", [])}, jq)
        if "/actions/jobs/" in chemin:
            return sortir(etat.get("jobs", {})[morceaux[-1]], jq)
        if chemin.endswith("/releases/latest"):
            return sortir(etat["release"], jq)
        if chemin.startswith("users/"):
            return sortir({"id": 1}, jq)
        if "/pulls/" in chemin and chemin.endswith("/commits"):
            n = int(chemin.split("/")[-2])
            pr = next(p for p in prs if p["number"] == n)
            return sortir(pr.get("commits", []), jq)
        sys.exit(f"faux gh : chemin d'API inconnu {chemin}")

    if args[:2] == ["pr", "list"]:
        etat_pr = option(args, "--state", "open").upper()
        tete = option(args, "--head")
        liste = [
            p
            for p in prs
            if (etat_pr == "ALL" or p["state"] == etat_pr) and (tete is None or p["headRefName"] == tete)
        ]
        champs = option(args, "--json")
        return sortir([projeter(p, champs, appels) for p in liste], jq)

    if args[:2] == ["pr", "view"]:
        n = int(args[2])
        pr = next(p for p in prs if p["number"] == n)
        return sortir(projeter(pr, option(args, "--json"), appels), jq)

    if args[0] == "pr" and args[1] in {"close", "comment", "merge", "ready", "edit"}:
        return None

    if args[:2] == ["pr", "create"]:
        print(f"https://github.com/steamicc/wiki_steami/pull/{etat.get('numero_cree', 99)}")
        return None

    if args[:2] == ["run", "rerun"]:
        return None

    sys.exit(f"faux gh : commande inconnue {args}")


if __name__ == "__main__":
    main()
