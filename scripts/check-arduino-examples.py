#!/usr/bin/env python3
"""
Vérifie la cohérence entre les pages d'exemples Arduino du wiki et les
exemples publiés (index.json), pour deux sources :

- la bibliothèque arduino-steami-lib (<EssayerExemple id="X" />, ou
  source="bibliotheque") ;
- le dépôt arduino-steami-sample (<EssayerExemple id="X" source="sample" />).

Toutes les pages du dossier docs/ (*.md et *.mdx, sous-dossiers compris) sont
lues, pas seulement celles de docs/software/arduino/exemples/ : une balise
placée sur n'importe quelle page est vérifiée. Les balises situées dans un bloc
de code délimité (``` ou ~~~) sont ignorées.

Règles de la bibliothèque :
1. un <EssayerExemple id="X" /> doit exister dans l'index ;
2. il doit suivre, dans la même section, un titre `## <nom> {#<nom en minuscules>}` ;
3. chaque id de l'index est documenté ou en attente ;
4. un id documenté ne doit plus être en attente ;
5. un id en attente doit exister dans l'index.

Règles du sample : 1, 3, 4 et 5 avec son index et sa liste d'attente ; la
règle 2 ne s'applique pas (une section peut regrouper plusieurs croquis). À la
place, le dernier bloc `file=.external/arduino-steami-sample/...` qui précède
la balise dans la même section doit inclure le même croquis
(examples/GROUPE/Nom/Nom.ino).

Une balise dont la source n'est ni « bibliotheque » ni « sample » est refusée.

Avant tout, la version de chaque index doit être celle épinglée
(exemples-arduino.json, exemples-arduino-sample.json) : sinon l'index est
périmé (npm run prebuild). Tant que le sample n'est ni épinglé ni récupéré,
sa vérification est sautée.

Usage :
    python3 scripts/check-arduino-examples.py [--index PATH] [--pages DIR] [--attente PATH]
                                              [--epingle PATH] [--index-sample PATH]
                                              [--attente-sample PATH] [--epingle-sample PATH]

--pages désigne le dossier parcouru récursivement (docs/ par défaut).
"""

import argparse
import json
import posixpath
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
INDEX_DEFAUT = RACINE / "static" / "exemples-arduino" / "index.json"
PAGES_DEFAUT = RACINE / "docs"
ATTENTE_DEFAUT = Path(__file__).resolve().parent / "exemples-arduino-a-documenter.txt"
EPINGLE_DEFAUT = RACINE / "exemples-arduino.json"
INDEX_SAMPLE_DEFAUT = RACINE / "static" / "exemples-arduino-sample" / "index.json"
ATTENTE_SAMPLE_DEFAUT = Path(__file__).resolve().parent / "exemples-arduino-sample-a-documenter.txt"
EPINGLE_SAMPLE_DEFAUT = RACINE / "exemples-arduino-sample.json"

BIBLIOTHEQUE = "bibliotheque"
SAMPLE = "sample"
SOURCES = (BIBLIOTHEQUE, SAMPLE)
DOSSIER_SAMPLE = ".external/arduino-steami-sample/"

TITRE = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
# Délimiteur de bloc de code : au moins trois ` ou trois ~ (CommonMark).
CLOTURE = re.compile(r"^(`{3,}|~{3,})(.*)$")
BALISE = re.compile(r"<EssayerExemple\b[^>]*?\bid=(?:\"([^\"]*)\"|'([^']*)')[^>]*>")
SOURCE = re.compile(r"\bsource=(?:\"([^\"]*)\"|'([^']*)'|([^\s/>]+))")
FICHIER = re.compile(r"(?:^|\s)file=(\S+)")


def _balises_de_page(texte):
    """Retourne (id, source, titre_de_section, dernier_fichier_sample) pour
    chaque balise de la page.

    dernier_fichier_sample : chemin du dernier bloc `file=` du sample vu dans
    la section (titre de niveau 1 ou 2) avant la balise, sinon None.
    """
    resultat = []
    titre = None
    fichier_sample = None
    cloture = None  # délimiteur du bloc de code ouvert, sinon None
    for ligne in texte.splitlines():
        m = CLOTURE.match(ligne.lstrip())
        if cloture is None:
            # Un délimiteur ``` ouvrant ne peut pas contenir de ` dans son info.
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                cloture = m.group(1)
                f = FICHIER.search(m.group(2))
                if f:
                    chemin = posixpath.normpath(f.group(1))
                    if chemin.startswith(DOSSIER_SAMPLE):
                        fichier_sample = chemin
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
                fichier_sample = None
            elif niveau == 2:
                titre = m.group(2)
                fichier_sample = None
            continue
        for b in BALISE.finditer(ligne):
            s = SOURCE.search(b.group(0))
            source = BIBLIOTHEQUE
            if s:
                source = next(g for g in s.groups() if g is not None)
            resultat.append((b.group(1) or b.group(2), source, titre, fichier_sample))
    return resultat


def _ids_de_page(texte, source=BIBLIOTHEQUE):
    """Retourne (id, titre_de_section, dernier_fichier_sample) des balises de la source."""
    return [(i, t, f) for i, s, t, f in _balises_de_page(texte) if s == source]


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
    """Règles 1 à 5 pour la source bibliothèque."""
    erreurs = []
    documentes = set()
    attente_set = set(attente)

    for chemin, texte in pages.items():
        for ident, titre, _ in _ids_de_page(texte, BIBLIOTHEQUE):
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


def fichier_sample(ident):
    """Chemin du croquis GROUPE/Nom dans le clone du sample."""
    groupe, nom = ident.split("/", 1)
    return f"{DOSSIER_SAMPLE}examples/{groupe}/{nom}/{nom}.ino"


def verifier_sample(index_ids, pages, attente):
    """Règles 1, 3, 4, 5 et bloc file= pour la source sample (pas de règle 2)."""
    erreurs = []
    utilises = set()
    attente_set = set(attente)
    liste = "scripts/exemples-arduino-sample-a-documenter.txt"

    for chemin, texte in pages.items():
        for ident, _, trouve in _ids_de_page(texte, SAMPLE):
            utilises.add(ident)
            if ident not in index_ids:
                erreurs.append(
                    f"{chemin} : le croquis « {ident} » n'existe pas dans l'index "
                    "d'arduino-steami-sample"
                )
                continue
            attendu = fichier_sample(ident)
            if trouve is None:
                erreurs.append(
                    f"{chemin} : le croquis « {ident} » (source=\"sample\") n'est pas précédé, "
                    f"dans sa section, d'un bloc de code `file={attendu}`"
                )
            elif trouve != attendu:
                erreurs.append(
                    f"{chemin} : le croquis « {ident} » (source=\"sample\") suit le bloc "
                    f"`file={trouve}`, attendu `file={attendu}`"
                )

    for ident in sorted(index_ids - utilises - attente_set):
        erreurs.append(
            f"le croquis « {ident} » d'arduino-steami-sample n'est ni utilisé dans une page "
            f"(<EssayerExemple source=\"sample\">) ni listé dans {liste}"
        )
    for ident in sorted(utilises & attente_set):
        erreurs.append(
            f"le croquis « {ident} » d'arduino-steami-sample est utilisé dans une page : "
            f"le retirer de {liste}"
        )
    for ident in sorted(attente_set - index_ids):
        erreurs.append(
            f"l'id « {ident} » de {liste} n'existe pas dans l'index d'arduino-steami-sample"
        )
    return erreurs


def verifier_sources(pages):
    """Erreurs pour les balises dont la source est inconnue."""
    erreurs = []
    for chemin, texte in pages.items():
        for ident, source, _, _ in _balises_de_page(texte):
            if source not in SOURCES:
                erreurs.append(
                    f"{chemin} : l'exemple « {ident} » a la source inconnue « {source} » "
                    f"(attendu : {' ou '.join(SOURCES)})"
                )
    return erreurs


def verifier_version(version_index, version_epinglee, nom="index des exemples"):
    """Message d'erreur si l'index n'est pas celui de la version épinglée, sinon None."""
    if version_index == version_epinglee:
        return None
    return (
        f"{nom} périmé ({version_index}, version épinglée {version_epinglee}) : "
        "relancer npm run prebuild"
    )


def lire_attente(chemin):
    if not chemin.is_file():
        return []
    return [l.strip() for l in chemin.read_text(encoding="utf-8").splitlines() if l.strip()]


def version_epinglee(chemin):
    """Version du fichier d'épinglage, None s'il est absent."""
    if not chemin.is_file():
        return None
    return json.loads(chemin.read_text(encoding="utf-8")).get("version")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--index", type=Path, default=INDEX_DEFAUT)
    parser.add_argument("--pages", type=Path, default=PAGES_DEFAUT)
    parser.add_argument("--attente", type=Path, default=ATTENTE_DEFAUT)
    parser.add_argument("--epingle", type=Path, default=EPINGLE_DEFAUT)
    parser.add_argument("--index-sample", type=Path, default=INDEX_SAMPLE_DEFAUT)
    parser.add_argument("--attente-sample", type=Path, default=ATTENTE_SAMPLE_DEFAUT)
    parser.add_argument("--epingle-sample", type=Path, default=EPINGLE_SAMPLE_DEFAUT)
    args = parser.parse_args(argv)

    if not args.index.is_file():
        print(
            "Erreur : index des exemples introuvable : lancer npm run build ou npm run prebuild",
            file=sys.stderr,
        )
        return 1

    index = json.loads(args.index.read_text(encoding="utf-8"))
    if args.epingle.is_file():
        erreur = verifier_version(index.get("version"), version_epinglee(args.epingle))
        if erreur:
            print(f"Erreur : {erreur}", file=sys.stderr)
            return 1
    index_ids = {e["id"] for e in index["exemples"]}
    pages = {chemin_affiche(p): p.read_text(encoding="utf-8") for p in lister_pages(args.pages)}
    attente = lire_attente(args.attente)

    erreurs = verifier(index_ids, pages, attente)
    erreurs += verifier_sources(pages)
    bilans = [f"OK : {len(index_ids)} exemples, {len(pages)} page(s), {len(attente)} en attente."]

    # Source sample : sautée tant qu'elle n'est ni épinglée ni récupérée.
    epinglee_sample = version_epinglee(args.epingle_sample)
    if not args.index_sample.is_file():
        if epinglee_sample is None:
            bilans.append(
                "Croquis d'arduino-steami-sample : index absent et version non épinglée, "
                "vérification sautée."
            )
        else:
            erreurs.append(
                "index des croquis d'arduino-steami-sample introuvable : "
                "lancer npm run build ou npm run prebuild"
            )
    else:
        index_sample = json.loads(args.index_sample.read_text(encoding="utf-8"))
        erreur = None
        if epinglee_sample is not None:
            erreur = verifier_version(
                index_sample.get("version"),
                epinglee_sample,
                "index des croquis d'arduino-steami-sample",
            )
        if erreur:
            erreurs.append(erreur)
        else:
            ids_sample = {e["id"] for e in index_sample["exemples"]}
            attente_sample = lire_attente(args.attente_sample)
            erreurs += verifier_sample(ids_sample, pages, attente_sample)
            bilans.append(
                f"OK : {len(ids_sample)} croquis d'arduino-steami-sample, "
                f"{len(attente_sample)} en attente."
            )

    if erreurs:
        for e in erreurs:
            print(f"Erreur : {e}", file=sys.stderr)
        print(f"\n{len(erreurs)} erreur(s) de cohérence.", file=sys.stderr)
        return 1
    for bilan in bilans:
        print(bilan)
    return 0


if __name__ == "__main__":
    sys.exit(main())
