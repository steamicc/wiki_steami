#!/usr/bin/env python3
"""
Ajoute à la liste des exemples Arduino à documenter les nouveaux exemples de l'index.

Lancé par le robot suivre-exemples-arduino.yml dans la PR d'une nouvelle
release du paquet : chaque id de l'index (index.json de l'archive des exemples)
qui n'est ni documenté dans une page (<EssayerExemple id="X" />, source
bibliothèque, dans docs/) ni déjà en attente est ajouté à la fin de
scripts/exemples-arduino-a-documenter.txt, par ordre alphabétique. Les lignes
déjà présentes restent telles quelles.

La règle 3 de check-arduino-examples.py (chaque id de l'index est documenté ou
en attente) ne bloque donc plus la PR du robot. Les autres règles restent
bloquantes : un exemple retiré ou renommé encore cité dans une page ou dans la
liste fait toujours échouer la vérification, et un humain corrige la page.

--sortie-github (en général $GITHUB_OUTPUT) reçoit `ajoutes=<ids>`, séparés par
des espaces, vide s'il n'y en a pas : le workflow les cite dans le corps de la PR.

Usage :
    python3 scripts/completer-attente-arduino.py [--index PATH] [--pages DIR]
        [--attente PATH] [--sortie-github PATH]
"""

import argparse
import importlib.util
import json
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def _charger_check():
    spec = importlib.util.spec_from_file_location(
        "check_arduino_examples", SCRIPTS / "check-arduino-examples.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check = _charger_check()


def nouveaux_exemples(index_ids, pages, attente):
    """Ids de l'index ni documentés (source bibliothèque) ni en attente, triés."""
    documentes = set()
    for texte in pages.values():
        for ident, _, _ in check._ids_de_page(texte, check.BIBLIOTHEQUE):
            documentes.add(ident)
    return sorted(set(index_ids) - documentes - set(attente))


def ajouter_a_l_attente(chemin, ids):
    """Ajoute les ids à la fin de la liste, sans toucher aux lignes présentes."""
    if not ids:
        return
    texte = chemin.read_text(encoding="utf-8") if chemin.is_file() else ""
    if texte and not texte.endswith("\n"):
        texte += "\n"
    texte += "".join(f"{ident}\n" for ident in ids)
    chemin.write_text(texte, encoding="utf-8")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("--index", type=Path, default=check.INDEX_DEFAUT)
    parser.add_argument("--pages", type=Path, default=check.PAGES_DEFAUT)
    parser.add_argument("--attente", type=Path, default=check.ATTENTE_DEFAUT)
    parser.add_argument("--sortie-github", type=Path)
    args = parser.parse_args(argv)

    try:
        index = json.loads(args.index.read_text(encoding="utf-8"))
        index_ids = {e["id"] for e in index["exemples"]}
    except (OSError, ValueError, KeyError, TypeError) as erreur:
        print(f"Erreur : index des exemples illisible ({args.index}) : {erreur}", file=sys.stderr)
        return 1
    pages = {p: p.read_text(encoding="utf-8") for p in check.lister_pages(args.pages)}
    ajoutes = nouveaux_exemples(index_ids, pages, check.lire_attente(args.attente))
    ajouter_a_l_attente(args.attente, ajoutes)

    for ident in ajoutes:
        print(f"Ajouté à {check.chemin_affiche(args.attente)} : {ident}")
    print(f"{len(ajoutes)} nouvel(s) exemple(s) mis en attente de documentation.")
    if args.sortie_github:
        with args.sortie_github.open("a", encoding="utf-8") as sortie:
            sortie.write(f"ajoutes={' '.join(ajoutes)}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
