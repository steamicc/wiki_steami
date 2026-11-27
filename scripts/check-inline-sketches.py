#!/usr/bin/env python3
"""
Vérifie le marquage des croquis Arduino écrits en ligne dans les pages du wiki.

Un bloc de code cpp (ou c++, ino, arduino) sans `file=` qui contient `setup(` et
`loop(` est un croquis complet. Il doit porter dans sa meta :

- `sample=GROUPE/Nom` : après la fusion de la page, un robot l'ajoute à
  arduino-steami-sample (examples/GROUPE/Nom/Nom.ino), puis la PR qui épingle
  la version suivante du sample remplace le bloc par l'inclusion du croquis et
  le bouton Téléverser ;
- ou `norun` : fragment pédagogique, src/main.cpp PlatformIO, croquis
  volontairement incomplet, qui n'a pas à être repris.

Erreurs (code de sortie 1) :
1. croquis complet sans `sample=` ni `norun` ;
2. `sample=` et `norun` sur le même bloc ;
3. `sample=` sur un bloc qui n'est pas un croquis complet ;
4. `sample=` mal formé (GROUPE/Nom, /^[A-Z0-9_-]+\\/[A-Za-z0-9_]+$/) ;
5. groupe hors de la liste (CAPTEURS, ECRAN, PREMIERS, CARTE, BOUTONS, BUZZER) ;
6. même id marqué deux fois dans le wiki ;
7. id déjà présent dans arduino-steami-sample au tag épinglé : le robot ne fait
   qu'ajouter, il ne remplace jamais un croquis publié.

Chaque bloc `sample=` valide est annoncé, sans échec : il attend le robot.
Sous GitHub Actions, erreurs et annonces sont aussi écrites en annotations.

Le contrôle 7 lit le clone .external/arduino-steami-sample, qui doit être au
tag épinglé dans exemples-arduino-sample.json (npm run prebuild). Tant que le
sample n'est pas épinglé, ce contrôle est sauté.

Usage :
    python3 scripts/check-inline-sketches.py [--pages DIR] [--sample DIR] [--epingle-sample PATH]
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from croquis_en_ligne import GROUPES, MOTIF_ID, blocs

RACINE = Path(__file__).resolve().parent.parent
PAGES_DEFAUT = RACINE / "docs"
SAMPLE_DEFAUT = RACINE / ".external" / "arduino-steami-sample"
EPINGLE_SAMPLE_DEFAUT = RACINE / "exemples-arduino-sample.json"
DEPOT_SAMPLE = "https://github.com/steamicc/arduino-steami-sample"


class Erreur(str):
    """Message d'erreur qui garde la page et la ligne pour l'annotation."""

    def __new__(cls, fichier, ligne, message):
        objet = super().__new__(cls, f"{fichier}:{ligne} : {message}")
        objet.fichier = fichier
        objet.ligne = ligne
        return objet


def fichier_sample(ident):
    groupe, nom = ident.split("/", 1)
    return f".external/arduino-steami-sample/examples/{groupe}/{nom}/{nom}.ino"


def verifier(liste_blocs, ids_au_tag, tag=None):
    """(erreurs, blocs en attente du robot) pour les blocs donnés.

    ids_au_tag : ids GROUPE/Nom des croquis d'arduino-steami-sample au tag épinglé.
    """
    erreurs = []
    attente = []
    vus = {}
    groupes = ", ".join(GROUPES)
    au_tag = f" ({tag})" if tag else ""
    for b in liste_blocs:
        def erreur(message, b=b):
            erreurs.append(Erreur(b.fichier, b.ligne_debut, message))

        ident = b.id_sample
        if ident is None:
            if b.complet and not b.norun:
                erreur(
                    "croquis Arduino complet (« setup( » et « loop( ») écrit en ligne sans marque : "
                    f"ajouter à la ligne ```{b.langage} soit `sample=GROUPE/Nom` "
                    f"(groupes : {groupes}) pour que le robot le reprenne dans "
                    "arduino-steami-sample, soit `norun` s'il ne doit pas être repris "
                    "(fragment, src/main.cpp, croquis incomplet)"
                )
            continue
        if b.norun:
            erreur(
                f"`sample={ident}` et `norun` sur le même bloc : garder `sample=` pour reprendre "
                "le croquis dans arduino-steami-sample, ou `norun` pour ne pas le reprendre"
            )
            continue
        if not b.complet:
            erreur(
                f"`sample={ident}` sur un bloc qui n'est pas un croquis complet (« setup( » et « loop( ») : "
                "compléter le croquis ou retirer `sample=`"
            )
            continue
        if not MOTIF_ID.match(ident):
            erreur(
                f"`sample={ident}` mal formé : attendu `sample=GROUPE/Nom` (GROUPE parmi {groupes} ; "
                "Nom en lettres, chiffres et _, sans tiret ni espace ; "
                "par exemple `sample=PREMIERS/ClignoterLed`)"
            )
            continue
        groupe = ident.split("/", 1)[0]
        if groupe not in GROUPES:
            erreur(f"groupe « {groupe} » inconnu dans `sample={ident}` : choisir parmi {groupes}")
            continue
        if ident in vus:
            erreur(
                f"le croquis « {ident} » est déjà marqué en {vus[ident]} : "
                "un même `sample=` ne sert qu'une fois, choisir un autre Nom"
            )
            continue
        vus[ident] = f"{b.fichier}:{b.ligne_debut}"
        if ident in ids_au_tag:
            erreur(
                f"le croquis « {ident} » existe déjà dans arduino-steami-sample au tag épinglé{au_tag} : "
                f"l'inclure par ```cpp file={fichier_sample(ident)} suivi de "
                f'<EssayerExemple id="{ident}" source="sample" />, ou choisir un autre Nom ; '
                f"pour modifier le croquis publié, ouvrir une PR dans {DEPOT_SAMPLE} "
                "(le robot n'ajoute que des croquis nouveaux)"
            )
            continue
        attente.append(b)
    return erreurs, attente


def version_epinglee(chemin):
    """Version du fichier d'épinglage, None s'il est absent."""
    if not chemin.is_file():
        return None
    return json.loads(chemin.read_text(encoding="utf-8")).get("version")


def tag_du_clone(dossier):
    """Tag exact du commit extrait dans le clone, None sinon."""
    r = subprocess.run(
        ["git", "-C", str(dossier), "describe", "--tags", "--exact-match"],
        capture_output=True,
        text=True,
        check=False,
    )
    return r.stdout.strip() if r.returncode == 0 else None


def ids_du_sample(dossier):
    """Ids GROUPE/Nom des croquis examples/GROUPE/Nom/Nom.ino du clone."""
    exemples = dossier / "examples"
    if not exemples.is_dir():
        return set()
    return {
        f"{groupe.name}/{nom.name}"
        for groupe in exemples.iterdir()
        if groupe.is_dir()
        for nom in groupe.iterdir()
        if (nom / f"{nom.name}.ino").is_file()
    }


def _annotation(niveau, fichier, ligne, message):
    message = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    return f"::{niveau} file={fichier},line={ligne}::{message}"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--pages", type=Path, default=PAGES_DEFAUT)
    parser.add_argument("--sample", type=Path, default=SAMPLE_DEFAUT)
    parser.add_argument("--epingle-sample", type=Path, default=EPINGLE_SAMPLE_DEFAUT)
    args = parser.parse_args(argv)
    actions = os.environ.get("GITHUB_ACTIONS") == "true"

    liste = blocs(args.pages)
    erreurs_globales = []
    bilans = []
    ids_au_tag = set()
    version = version_epinglee(args.epingle_sample)
    if version is None:
        bilans.append(
            "arduino-steami-sample non épinglé : contrôle des croquis déjà publiés sauté."
        )
    elif not args.sample.is_dir():
        erreurs_globales.append(
            f"clone d'arduino-steami-sample introuvable ({args.sample}) : lancer npm run prebuild"
        )
    else:
        tag = tag_du_clone(args.sample)
        if tag != version:
            erreurs_globales.append(
                f"clone d'arduino-steami-sample au tag {tag or '?'}, version épinglée {version} : "
                "relancer npm run prebuild"
            )
        else:
            ids_au_tag = ids_du_sample(args.sample)

    erreurs, attente = verifier(liste, ids_au_tag, version)

    for b in attente:
        print(f"En attente du robot : {b.fichier}:{b.ligne_debut} sample={b.id_sample}")
        if actions:
            print(
                _annotation(
                    "notice",
                    b.fichier,
                    b.ligne_debut,
                    f"Croquis sample={b.id_sample} : le robot l'ajoutera à "
                    "arduino-steami-sample après la fusion, puis la PR d'épinglage "
                    "le remplacera par son inclusion.",
                )
            )

    if erreurs_globales or erreurs:
        for e in erreurs_globales:
            print(f"Erreur : {e}", file=sys.stderr)
        for e in erreurs:
            print(f"Erreur : {e}", file=sys.stderr)
            if actions:
                print(_annotation("error", e.fichier, e.ligne, str(e)))
        print(
            f"\n{len(erreurs_globales) + len(erreurs)} erreur(s) dans les croquis en ligne.",
            file=sys.stderr,
        )
        return 1

    complets = [b for b in liste if b.complet]
    marques_sample = sum(1 for b in complets if b.id_sample is not None)
    marques_norun = sum(1 for b in complets if b.norun)
    for bilan in bilans:
        print(bilan)
    print(
        f"OK : {len(complets)} croquis complet(s) en ligne ({marques_sample} sample=, "
        f"{marques_norun} norun), {len(attente)} en attente du robot."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
