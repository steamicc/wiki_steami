#!/usr/bin/env python3
"""
Vérifie la cohérence entre les pages d'exemples Arduino du wiki et les
exemples publiés (index.json).

Toutes les pages du dossier docs/ (*.md et *.mdx, sous-dossiers compris) sont
lues, pas seulement celles de docs/software/arduino/exemples/ : une balise
placée sur n'importe quelle page est vérifiée. Les balises situées dans un bloc
de code délimité (``` ou ~~~) sont ignorées.

Règles :
1. un <EssayerExemple id="X" /> doit exister dans l'index ;
2. il doit suivre, dans la même section, un titre `## <nom> {#<nom en minuscules>}` ;
3. chaque id de l'index est documenté ou en attente ;
4. un id documenté ne doit plus être en attente ;
5. un id en attente doit exister dans l'index.

Avant tout, la version de l'index doit être celle épinglée dans
exemples-arduino.json : sinon l'index est périmé (npm run prebuild).

Usage :
    python3 scripts/check-arduino-examples.py [--index PATH] [--pages DIR] [--attente PATH]
                                              [--epingle PATH]

--pages désigne le dossier parcouru récursivement (docs/ par défaut).
"""

import argparse
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
INDEX_DEFAUT = RACINE / "static" / "exemples-arduino" / "index.json"
PAGES_DEFAUT = RACINE / "docs"
ATTENTE_DEFAUT = Path(__file__).resolve().parent / "exemples-arduino-a-documenter.txt"
EPINGLE_DEFAUT = RACINE / "exemples-arduino.json"

TITRE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
# Délimiteur de bloc de code : au moins trois ` ou trois ~ (CommonMark).
CLOTURE = re.compile(r"^(`{3,}|~{3,})(.*)$")
BALISE = re.compile(r"<EssayerExemple\b[^>]*?\bid=(?:\"([^\"]*)\"|'([^']*)')[^>]*>")


def _ids_de_page(texte):
    """Retourne (id, titre_de_section) pour chaque balise de la page."""
    resultat = []
    titre = None
    cloture = None  # délimiteur du bloc de code ouvert, sinon None
    for ligne in texte.splitlines():
        m = CLOTURE.match(ligne.lstrip())
        if cloture is None:
            # Un délimiteur ``` ouvrant ne peut pas contenir de ` dans son info.
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                cloture = m.group(1)
                continue
        else:
            # Le bloc ne se ferme que sur le même caractère, au moins aussi
            # long, sans rien après : un ```` peut contenir des lignes ```.
            if (
                m
                and m.group(1)[0] == cloture[0]
                and len(m.group(1)) >= len(cloture)
                and not m.group(2).strip()
            ):
                cloture = None
            continue
        m = TITRE.match(ligne)
        if m:
            niveau = len(m.group(1))
            if niveau == 1:
                titre = None
            elif niveau == 2:
                titre = m.group(2)
            continue
        for b in BALISE.finditer(ligne):
            resultat.append((b.group(1) or b.group(2), titre))
    return resultat


def lister_pages(dossier):
    """Pages *.md et *.mdx du dossier et de ses sous-dossiers, triées."""
    if not dossier.is_dir():
        return []
    return sorted(
        p for p in dossier.rglob("*") if p.suffix in (".md", ".mdx") and p.is_file()
    )


def chemin_affiche(chemin):
    """Chemin relatif à la racine du dépôt, sinon au dossier courant, sinon tel quel."""
    chemin = chemin.resolve()
    for base in (RACINE, Path.cwd().resolve()):
        try:
            return chemin.relative_to(base)
        except ValueError:
            pass
    return chemin


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


def verifier_version(version_index, version_epinglee):
    """Message d'erreur si l'index n'est pas celui de la version épinglée, sinon None."""
    if version_index == version_epinglee:
        return None
    return (
        f"index des exemples périmé ({version_index}, version épinglée {version_epinglee}) : "
        "relancer npm run prebuild"
    )


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--index", type=Path, default=INDEX_DEFAUT)
    parser.add_argument("--pages", type=Path, default=PAGES_DEFAUT)
    parser.add_argument("--attente", type=Path, default=ATTENTE_DEFAUT)
    parser.add_argument("--epingle", type=Path, default=EPINGLE_DEFAUT)
    args = parser.parse_args(argv)

    if not args.index.is_file():
        print(
            "Erreur : index des exemples introuvable : lancer npm run build ou npm run prebuild",
            file=sys.stderr,
        )
        return 1

    index = json.loads(args.index.read_text(encoding="utf-8"))
    if args.epingle.is_file():
        epinglee = json.loads(args.epingle.read_text(encoding="utf-8")).get("version")
        erreur = verifier_version(index.get("version"), epinglee)
        if erreur:
            print(f"Erreur : {erreur}", file=sys.stderr)
            return 1
    index_ids = {e["id"] for e in index["exemples"]}
    pages = {chemin_affiche(p): p.read_text(encoding="utf-8") for p in lister_pages(args.pages)}
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
