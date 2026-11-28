#!/usr/bin/env python3
"""
Vérifie la taille des fichiers ajoutés ou modifiés par une PR, pour éviter
qu'une image non compressée, un PDF lourd ou un binaire n'alourdisse le dépôt
(issue https://github.com/steamicc/wiki_steami/issues/76).

Seuils (1 Ko = 1024 octets) :

| Fichiers                                  | Avertissement | Erreur   |
| ----------------------------------------- | ------------- | -------- |
| images (.png .jpg .jpeg .gif .webp .svg)  | > 500 Ko      | > 2 Mo   |
| PDF                                       | > 1 Mo        | > 2 Mo   |
| autres fichiers                           | —             | > 1 Mo   |

La taille mesurée est celle du fichier dans le commit vérifié (HEAD), pas
celle du dossier de travail.

Les fichiers déjà présents qui dépassent un seuil d'erreur sont listés dans
scripts/tailles-fichiers-exceptions.txt, avec une taille plafond : un fichier
listé ne lève qu'un avertissement tant qu'il reste sous son plafond, et une
erreur s'il le dépasse. Une exception dont le fichier n'existe plus est
signalée (avertissement) pour être retirée.

Usage :
    python3 scripts/check-file-sizes.py [--base REF] [--all] [--exceptions PATH]

--base REF  vérifie les fichiers ajoutés, modifiés ou renommés entre la base
            commune de REF et HEAD (REF...HEAD) ; origin/main par défaut.
--all       vérifie tous les fichiers suivis de HEAD (contrôle complet).

Code de sortie : 0 sans erreur, 1 si au moins un fichier dépasse un seuil
d'erreur, 2 si la commande git échoue.
"""

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
EXCEPTIONS_DEFAUT = Path(__file__).resolve().parent / "tailles-fichiers-exceptions.txt"

KO = 1024
MO = 1024 * KO

IMAGES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}

# (avertissement, erreur) en octets ; None : pas de seuil.
SEUILS = {
    "image": (500 * KO, 2 * MO),
    "pdf": (1 * MO, 2 * MO),
    "autre": (None, 1 * MO),
}


def categorie(chemin):
    extension = Path(chemin).suffix.lower()
    if extension in IMAGES:
        return "image"
    if extension == ".pdf":
        return "pdf"
    return "autre"


def lire_taille(texte):
    """Convertit « 4.5M », « 800K » ou « 123456 » en octets."""
    m = re.fullmatch(r"(\d+(?:\.\d+)?)([KkMm]?)", texte.strip())
    if not m:
        raise ValueError(f"taille illisible : {texte!r}")
    valeur = float(m.group(1))
    unite = m.group(2).upper()
    facteur = {"": 1, "K": KO, "M": MO}[unite]
    return int(valeur * facteur)


def lire_exceptions(texte):
    """Lit les lignes « chemin taille_max  # commentaire » ; renvoie {chemin: plafond}."""
    exceptions = {}
    for numero, ligne in enumerate(texte.splitlines(), start=1):
        ligne = ligne.split("#", 1)[0].strip()
        if not ligne:
            continue
        morceaux = ligne.split()
        if len(morceaux) != 2:
            raise ValueError(f"ligne {numero} : attendu « chemin taille_max », lu {ligne!r}")
        chemin, plafond = morceaux
        try:
            exceptions[chemin] = lire_taille(plafond)
        except ValueError as e:
            raise ValueError(f"ligne {numero} : {e}") from None
    return exceptions


def humain(octets):
    if octets >= MO:
        return f"{octets / MO:.2f} Mo"
    if octets >= KO:
        return f"{octets / KO:.0f} Ko"
    return f"{octets} o"


def classer(chemin, taille, exceptions):
    """Renvoie (niveau, message) avec niveau dans {None, "warning", "error"}."""
    avertissement, erreur = SEUILS[categorie(chemin)]
    if chemin in exceptions:
        plafond = exceptions[chemin]
        if taille > plafond:
            return (
                "error",
                (
                    f"{humain(taille)} dépasse le plafond de son exception ({humain(plafond)}) : "
                    "compresser le fichier ou, si la taille est justifiée, relever le plafond "
                    "dans scripts/tailles-fichiers-exceptions.txt"
                ),
            )
        if erreur is not None and taille > erreur:
            return (
                "warning",
                (
                    f"{humain(taille)}, au-delà du seuil de {humain(erreur)}, "
                    f"toléré par exception (plafond {humain(plafond)})"
                ),
            )
    elif erreur is not None and taille > erreur:
        return (
            "error",
            (
                f"{humain(taille)} dépasse le seuil de {humain(erreur)} : compresser le fichier "
                "(ou le redimensionner), ou l'héberger hors du dépôt"
            ),
        )
    if avertissement is not None and taille > avertissement:
        return ("warning", f"{humain(taille)} dépasse {humain(avertissement)} : penser à le compresser")
    return (None, "")


def git(*args):
    resultat = subprocess.run(
        ["git", *args], cwd=RACINE, capture_output=True, text=True, check=False
    )
    if resultat.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} : {resultat.stderr.strip()}")
    return resultat.stdout


def tailles_head():
    """{chemin: taille} des fichiers suivis de HEAD (les sous-modules sont ignorés)."""
    tailles = {}
    for entree in git("ls-tree", "-r", "-l", "-z", "HEAD").split("\0"):
        if not entree:
            continue
        meta, chemin = entree.split("\t", 1)
        _mode, type_objet, _objet, taille = meta.split()
        if type_objet == "blob":
            tailles[chemin] = int(taille)
    return tailles


def fichiers_modifies(base):
    sortie = git("diff", "--name-only", "-z", "--diff-filter=AM", "--no-renames", f"{base}...HEAD")
    return [chemin for chemin in sortie.split("\0") if chemin]


def annoncer(niveau, chemin, message):
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print(f"::{niveau} file={chemin}::{chemin} : {message}")
    else:
        etiquette = "ERREUR" if niveau == "error" else "AVERTISSEMENT"
        print(f"{etiquette} {chemin} : {message}")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Vérifie la taille des fichiers du dépôt.")
    parser.add_argument("--base", default="origin/main", help="référence de comparaison")
    parser.add_argument("--all", action="store_true", help="vérifier tous les fichiers suivis")
    parser.add_argument("--exceptions", type=Path, default=EXCEPTIONS_DEFAUT)
    args = parser.parse_args(argv)

    try:
        exceptions = lire_exceptions(args.exceptions.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print(f"ERREUR {args.exceptions} : {e}")
        return 2

    try:
        tailles = tailles_head()
        if args.all:
            chemins = sorted(tailles)
        else:
            chemins = [c for c in fichiers_modifies(args.base) if c in tailles]
    except RuntimeError as e:
        print(f"ERREUR {e}")
        return 2

    erreurs = avertissements = 0
    for chemin in chemins:
        niveau, message = classer(chemin, tailles[chemin], exceptions)
        if niveau is None:
            continue
        annoncer(niveau, chemin, message)
        if niveau == "error":
            erreurs += 1
        else:
            avertissements += 1

    if args.all:
        for chemin in sorted(set(exceptions) - set(tailles)):
            annoncer("warning", chemin, "exception sans fichier : la retirer de la liste")
            avertissements += 1

    portee = "fichiers suivis" if args.all else f"fichiers ajoutés ou modifiés depuis {args.base}"
    print(
        f"{len(chemins)} {portee} vérifiés : {erreurs} erreur(s), "
        f"{avertissements} avertissement(s)."
    )
    return 1 if erreurs else 0


if __name__ == "__main__":
    sys.exit(main())
