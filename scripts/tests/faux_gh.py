#!/usr/bin/env python3
"""Faux `gh` pour exécuter les étapes des workflows suivre-* hors de GitHub.

Lit l'état simulé dans le fichier JSON $FAUX_GH :
  {"release": {...}, "prs": [{"number", "state", "headRefName",
   "isCrossRepository", "author": {"login"}, "mergeable" (chaîne ou liste
   lue dans l'ordre des appels), "headRefOid", "isDraft", "autoMergeRequest",
   "commits": [{"sha", "author": {"login"}}]}]}
et note chaque appel (une ligne JSON par appel) dans $FAUX_GH_LOG.
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
        chemin = args[1]
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

    sys.exit(f"faux gh : commande inconnue {args}")


if __name__ == "__main__":
    main()
