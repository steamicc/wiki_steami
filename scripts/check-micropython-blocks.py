#!/usr/bin/env python3
"""
Vérifie les blocs MicroPython exécutables des pages du wiki : ceux qui reçoivent
le bouton « Essayer sur la carte » du plugin plugins/remark-micropython-run.js.

Les blocs sont listés par scripts/blocs-micropython.mjs, qui analyse les pages
comme le build (même analyse Markdown/MDX, mêmes plugins remark) et rapporte la
décision du plugin : le CI vérifie exactement les blocs qui ont un bouton, y
compris dans une citation, une liste ou avec un meta séparé par une tabulation.
Une page que le plugin refuse (fichier annexe absent, hors de .external/, deux
fichiers de même nom…) est une erreur.

Pour chaque bloc exécutable :
1. le programme est du Python valide (ast.parse) ;
2. il n'importe aucun driver non gelé dans le firmware (sinon l'essai échoue sur
   la carte : cas d'un `run` explicite) ;
3. s'il est destructif, il porte `confirm="…"`. Destructif : il appelle une
   opération qui écrit ou efface un stockage persistant de la carte (voir
   ECRITURES), quelle que soit l'origine du bloc (en ligne, `file=`) ; ou c'est
   un exemple de la bibliothèque listé dans scripts/micropython-exemples-destructifs.txt
   (ajouts explicites pour ce que la détection manquerait).

Chaque ligne de cette liste doit désigner au moins un exemple de la bibliothèque.

Usage :
    python3 scripts/check-micropython-blocks.py [--racine DIR] [--pages DIR]
                                                [--destructifs PATH]
"""

import argparse
import ast
import json
import re
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DESTRUCTIFS_DEFAUT = Path(__file__).resolve().parent / "micropython-exemples-destructifs.txt"
LISTEUR = Path(__file__).resolve().parent / "blocs-micropython.mjs"
DOSSIER_LIB = ".external/micropython-steami-lib/lib"
EXEMPLE_LIB = re.compile(r"^\.external/micropython-steami-lib/lib/([^/]+/examples/[^/]+\.py)$")

def blocs_publies(pages, racine):
    """Blocs python des pages, avec la décision du plugin (voir scripts/blocs-micropython.mjs)."""
    entree = json.dumps(
        {"racine": str(racine), "pages": [{"chemin": str(c), "texte": t} for c, t in pages.items()]}
    )
    sortie = subprocess.run(
        ["node", str(LISTEUR)], input=entree, capture_output=True, text=True, encoding="utf-8"
    )
    if sortie.returncode != 0:
        raise RuntimeError(f"{LISTEUR.name} a échoué :\n{sortie.stderr}")
    return json.loads(sortie.stdout)


def modules_non_geles(lib):
    """Noms importables des drivers marqués .not-frozen (comme le plugin)."""
    modules = set()
    for driver in sorted(Path(lib).iterdir()):
        if not driver.is_dir() or not (driver / ".not-frozen").exists():
            continue
        noms = [
            e.name
            for e in driver.iterdir()
            if e.is_dir() and (e / "__init__.py").exists()
        ] + [
            e.stem
            for e in driver.iterdir()
            if e.is_file() and e.suffix == ".py" and e.name != "manifest.py"
        ]
        modules.update(noms or [driver.name.replace("-", "_")])
    return modules


def modules_importes(arbre):
    modules = set()
    for noeud in ast.walk(arbre):
        if isinstance(noeud, ast.Import):
            modules.update(alias.name.split(".")[0] for alias in noeud.names)
        elif isinstance(noeud, ast.ImportFrom) and noeud.level == 0 and noeud.module:
            modules.add(noeud.module.split(".")[0])
    return modules


def _motif(glob):
    return re.compile(
        "^" + "".join("[^/]*" if c == "*" else "[^/]" if c == "?" else re.escape(c) for c in glob) + "$"
    )


# Opérations qui écrivent ou effacent un stockage persistant de la carte
# (API de la bibliothèque au tag épinglé) :
# - DaplinkFlash (flash externe du DAPLink) : write, write_line, clear_flash ;
# - DaplinkBridge (zone de configuration du DAPLink) : write_config, clear_config ;
# - SteamiConfig : save (les set_* ne modifient que la copie en RAM).
ECRITURES = {
    "DaplinkFlash": {"write", "write_line", "clear_flash"},
    "DaplinkBridge": {"write_config", "clear_config"},
    "SteamiConfig": {"save"},
}
# Noms propres à ces opérations : détectés quel que soit l'objet, et aussi
# comme fonctions (config_zone.py les réécrit en I2C brut).
NOMS_SANS_AMBIGUITE = {"write_line", "clear_flash", "write_config", "clear_config"}


def _type_de(expression, types):
    """Classe de stockage d'une expression (variable typée, constructeur, .config), ou None."""
    if isinstance(expression, ast.Name):
        return types.get(expression.id)
    if isinstance(expression, ast.Call):
        fonction = expression.func
        nom = fonction.id if isinstance(fonction, ast.Name) else getattr(fonction, "attr", None)
        if nom == "config":
            return "SteamiConfig"  # Steami().config() rend la SteamiConfig de la carte
        return nom if nom in ECRITURES else None
    return None


def operations_persistantes(arbre):
    """Appels qui écrivent ou effacent un stockage persistant, « texte() (ligne N) », dans l'ordre."""
    types = {}
    for noeud in ast.walk(arbre):
        if isinstance(noeud, ast.Assign):
            genre = _type_de(noeud.value, types)
            if genre:
                for cible in noeud.targets:
                    if isinstance(cible, ast.Name):
                        types[cible.id] = genre
    operations = []
    for noeud in ast.walk(arbre):
        if not isinstance(noeud, ast.Call):
            continue
        fonction = noeud.func
        if isinstance(fonction, ast.Name):
            trouve = fonction.id in NOMS_SANS_AMBIGUITE
        elif isinstance(fonction, ast.Attribute):
            genre = _type_de(fonction.value, types)
            trouve = fonction.attr in NOMS_SANS_AMBIGUITE or (
                genre is not None and fonction.attr in ECRITURES[genre]
            )
        else:
            trouve = False
        if trouve:
            operations.append((noeud.lineno, f"{ast.unparse(fonction)}() (ligne {noeud.lineno})"))
    return [texte for _, texte in sorted(operations)]


def exemples_destructifs_detectes(lib):
    """{"<driver>/examples/<nom>.py": première opération persistante} pour les exemples de la lib."""
    resultat = {}
    for exemple in sorted(Path(lib).glob("*/examples/*.py")):
        try:
            operations = operations_persistantes(ast.parse(exemple.read_text(encoding="utf-8")))
        except SyntaxError:
            continue
        if operations:
            resultat[str(exemple.relative_to(lib))] = operations[0]
    return resultat


def destructifs_sans_exemple(motifs, lib):
    """Lignes de la liste des destructifs qui ne désignent aucun exemple (renommé, retiré)."""
    return [motif for motif in motifs if not any(Path(lib).glob(motif))]


def lire_destructifs(chemin):
    lignes = Path(chemin).read_text(encoding="utf-8").splitlines()
    return [ligne.strip() for ligne in lignes if ligne.strip() and not ligne.strip().startswith("#")]


def verifier(pages, racine, non_geles, destructifs, executables=None):
    """Erreurs des blocs exécutables ; `executables` (liste) reçoit leur position."""
    motifs = [(glob, _motif(glob)) for glob in destructifs]
    erreurs = []
    for bloc in blocs_publies(pages, racine):
        if "erreur" in bloc:
            erreurs.append(f"{bloc['page']} : {bloc['erreur']}")
            continue
        if not bloc["bouton"]:
            continue
        ou = f"{bloc['page']}:{bloc['ligne']}"
        m = EXEMPLE_LIB.match(bloc["source"] or "")
        exemple = m.group(1) if m else None
        if executables is not None:
            executables.append(ou + (f" ({exemple})" if exemple else ""))
        try:
            arbre = ast.parse(bloc["code"])
        except SyntaxError as e:
            erreurs.append(f"{ou} : erreur de syntaxe Python ligne {e.lineno} du bloc : {e.msg}")
            continue

        non_gele = sorted(modules_importes(arbre) & non_geles)
        if non_gele:
            erreurs.append(
                f"{ou} : bloc exécutable qui importe un driver non gelé dans le firmware "
                f"({', '.join(non_gele)}) : retirer `run`"
            )

        if not bloc["confirmation"]:
            operations = operations_persistantes(arbre)
            raison = f"appelle {operations[0]}" if operations else None
            if raison is None and exemple:
                raison = next((f"liste : {glob}" for glob, motif in motifs if motif.match(exemple)), None)
            if raison:
                nom = exemple or "bloc"
                erreurs.append(
                    f"{ou} : {nom} modifie la carte durablement ({raison}) : "
                    'porter confirm="<ce qui sera modifié>" (ou norun)'
                )
    return erreurs


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--racine", type=Path, default=RACINE)
    parser.add_argument("--pages", type=Path, default=None, help="dossier des pages (défaut : <racine>/docs)")
    parser.add_argument("--destructifs", type=Path, default=DESTRUCTIFS_DEFAUT)
    args = parser.parse_args(argv)

    racine = args.racine
    lib = racine / DOSSIER_LIB
    if not lib.is_dir():
        print(f"Bibliothèque absente ({lib}) : lancer « npm run prebuild ».")
        return 1
    pages_dir = args.pages or racine / "docs"
    pages = {
        p.relative_to(racine) if p.is_relative_to(racine) else p: p.read_text(encoding="utf-8")
        for p in sorted(pages_dir.rglob("*.md*"))
        if p.suffix in (".md", ".mdx")
    }
    destructifs = lire_destructifs(args.destructifs)
    executables = []
    erreurs = verifier(pages, racine, modules_non_geles(lib), destructifs, executables)
    erreurs += [
        f"{args.destructifs.name} : « {motif} » ne désigne aucun exemple de la bibliothèque"
        for motif in destructifs_sans_exemple(destructifs, lib)
    ]
    print(f"{len(pages)} pages vérifiées, {len(executables)} bloc(s) exécutable(s) :")
    for position in executables:
        print(f"  {position}")
    if erreurs:
        print(f"\n{len(erreurs)} erreur(s) :\n")
        for erreur in erreurs:
            print(f"  {erreur}")
        return 1
    print("Blocs MicroPython exécutables valides.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
