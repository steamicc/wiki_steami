#!/usr/bin/env python3
"""
Vérifie la cohérence entre les pages d'exemples Arduino du wiki et les
exemples publiés (index.json).

Règles :
1. un <EssayerExemple id="X" /> doit exister dans l'index ;
2. il doit suivre, dans la même section, un titre `## <nom> {#<nom en minuscules>}` ;
3. chaque id de l'index est documenté ou en attente ;
4. un id documenté ne doit plus être en attente ;
5. un id en attente doit exister dans l'index.

Usage :
    python3 scripts/check-arduino-examples.py [--index PATH] [--pages DIR] [--attente PATH]
"""

import argparse
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
INDEX_DEFAUT = RACINE / "static" / "exemples-arduino" / "index.json"
PAGES_DEFAUT = RACINE / "docs" / "software" / "arduino" / "exemples"
ATTENTE_DEFAUT = Path(__file__).resolve().parent / "exemples-arduino-a-documenter.txt"

TITRE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
BALISE = re.compile(r"<EssayerExemple\b[^>]*?\bid=(?:\"([^\"]*)\"|'([^']*)')[^>]*>")


def _ids_de_page(texte):
    """Retourne (id, titre_de_section) pour chaque balise de la page."""
    resultat = []
    titre = None
    en_code = False
    for ligne in texte.splitlines():
        if ligne.lstrip().startswith("```"):
            en_code = not en_code
            continue
        if en_code:
            continue
        m = TITRE.match(ligne)
        if m:
            titre = m.group(2)
            continue
        for b in BALISE.finditer(ligne):
            resultat.append((b.group(1) or b.group(2), titre))
    return resultat


def verifier(index_ids, pages, attente):
    erreurs = []
    documentes = set()
    attente_set = set(attente)

    for chemin, texte in pages.items():
        for ident, titre in _ids_de_page(texte):
            documentes.add(ident)
            if ident not in index_ids:
                erreurs.append(f"{chemin} : l'id « {ident} » n'existe pas dans l'index des exemples")
                continue
            nom = ident.split("/")[-1]
            attendu = f"{nom} {{#{nom.lower()}}}"
            if titre is None or not re.search(r"\{#[^}]*\}", titre):
                erreurs.append(
                    f"{chemin} : l'exemple « {ident} » n'est pas précédé d'un titre « ## {attendu} » "
                    "(ancre manquante)"
                )
            elif titre != attendu:
                erreurs.append(
                    f"{chemin} : l'exemple « {ident} » a le titre « ## {titre} », "
                    f"attendu « ## {attendu} »"
                )

    for ident in sorted(index_ids - documentes - attente_set):
        erreurs.append(
            f"l'exemple « {ident} » n'est ni documenté dans une page ni listé comme à documenter"
        )
    for ident in sorted(documentes & attente_set):
        erreurs.append(
            f"l'exemple « {ident} » est documenté : le retirer de la liste des exemples à documenter"
        )
    for ident in sorted(attente_set - index_ids):
        erreurs.append(f"l'id « {ident} » de la liste des exemples à documenter n'existe pas dans l'index")
    return erreurs


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--index", type=Path, default=INDEX_DEFAUT)
    parser.add_argument("--pages", type=Path, default=PAGES_DEFAUT)
    parser.add_argument("--attente", type=Path, default=ATTENTE_DEFAUT)
    args = parser.parse_args(argv)

    if not args.index.is_file():
        print(
            "Erreur : index des exemples introuvable : lancer npm run build ou npm run prebuild",
            file=sys.stderr,
        )
        return 1

    index = json.loads(args.index.read_text(encoding="utf-8"))
    index_ids = {e["id"] for e in index["exemples"]}
    pages = {
        p: p.read_text(encoding="utf-8") for p in sorted(args.pages.glob("*.md"))
    } if args.pages.is_dir() else {}
    attente = []
    if args.attente.is_file():
        attente = [
            l.strip() for l in args.attente.read_text(encoding="utf-8").splitlines() if l.strip()
        ]

    erreurs = verifier(index_ids, pages, attente)
    if erreurs:
        for e in erreurs:
            print(f"Erreur : {e}", file=sys.stderr)
        print(f"\n{len(erreurs)} erreur(s) de cohérence.", file=sys.stderr)
        return 1
    print(f"OK : {len(index_ids)} exemples, {len(pages)} page(s), {len(attente)} en attente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
