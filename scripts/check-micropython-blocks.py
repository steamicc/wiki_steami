#!/usr/bin/env python3
"""
Vérifie les blocs MicroPython exécutables des pages du wiki (ceux qui reçoivent
le bouton « Essayer sur la carte » du plugin plugins/remark-micropython-run.js,
dont ce script reprend les règles).

Un bloc ```python est exécutable s'il porte `run`, ou s'il inclut un exemple de
la bibliothèque (`file=.external/micropython-steami-lib/lib/<driver>/examples/…`)
dont aucun import ne vise un driver marqué `.not-frozen` ; `norun` l'emporte.

Pour chaque bloc exécutable :
1. le programme est du Python valide (ast.parse) ;
2. ses fichiers annexes (`files=a.py,b.py`) sont sous .external/ et existent,
   sans deux fichiers de même nom ;
3. il n'importe aucun driver non gelé dans le firmware (sinon l'essai échoue sur
   la carte : vaut pour un `run` explicite) ;
4. un exemple de la bibliothèque destructif porte `confirm="…"`. Destructif :
   il appelle une opération qui écrit ou efface un stockage persistant de la
   carte (voir ECRITURES), ou il est dans scripts/micropython-exemples-destructifs.txt
   (ajouts explicites pour ce que la détection manquerait).

Chaque ligne de cette liste doit désigner au moins un exemple de la bibliothèque.

Usage :
    python3 scripts/check-micropython-blocks.py [--racine DIR] [--pages DIR]
                                                [--destructifs PATH]
"""

import argparse
import ast
import posixpath
import re
import sys
from dataclasses import dataclass
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DESTRUCTIFS_DEFAUT = Path(__file__).resolve().parent / "micropython-exemples-destructifs.txt"
DOSSIER_LIB = ".external/micropython-steami-lib/lib"
EXEMPLE_LIB = re.compile(r"^\.external/micropython-steami-lib/lib/([^/]+/examples/[^/]+\.py)$")

# Mêmes jetons que le plugin : clé=valeur (valeur entre guillemets possible) ou mot seul.
JETON = re.compile(r"""([A-Za-z_][\w-]*)=(?:"([^"]*)"|'([^']*)'|(\S+))|\S+""")
OUVERTURE = re.compile(r"^( *)(`{3,}|~{3,})(.*)$")


def lire_meta(meta):
    resultat = {"run": False, "norun": False, "confirm": None, "files": None, "file": None}
    for m in JETON.finditer(meta or ""):
        jeton, cle = m.group(0), m.group(1)
        valeur = next((g for g in m.groups()[1:] if g is not None), None)
        if jeton == "run":
            resultat["run"] = True
        elif jeton == "norun":
            resultat["norun"] = True
        elif cle == "confirm":
            resultat["confirm"] = valeur
        elif cle == "files":
            resultat["files"] = [f for f in valeur.split(",") if f]
        elif cle == "file":
            resultat["file"] = valeur
    return resultat


@dataclass
class Bloc:
    ligne: int
    langage: str
    meta: str
    code: str


def blocs(texte):
    """Blocs de code délimités (``` ou ~~~) d'une page, dans l'ordre."""
    resultat = []
    lignes = texte.splitlines()
    i = 0
    while i < len(lignes):
        m = OUVERTURE.match(lignes[i])
        if not m or (m.group(2)[0] == "`" and "`" in m.group(3)):
            i += 1
            continue
        retrait, cloture, info = len(m.group(1)), m.group(2), m.group(3).strip()
        fin = re.compile(r"^ *" + re.escape(cloture[0]) + "{" + str(len(cloture)) + r",}\s*$")
        contenu = []
        j = i + 1
        while j < len(lignes) and not fin.match(lignes[j]):
            ligne = lignes[j]
            enleve = len(ligne) - len(ligne.lstrip(" "))
            contenu.append(ligne[min(retrait, enleve):])
            j += 1
        langage, _, meta = info.partition(" ")
        code = "".join(f"{ligne}\n" for ligne in contenu)
        resultat.append(Bloc(i + 1, langage, meta.strip(), code))
        i = j + 1
    return resultat


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


def chemin_autorise(chemin):
    """Chemin normalisé sous .external/, ou None (mêmes règles que remark-code-file)."""
    if chemin.startswith("/"):
        return None
    normalise = posixpath.normpath(chemin)
    if normalise.startswith("..") or not normalise.startswith(".external/"):
        return None
    return normalise


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
        return nom if nom in ECRITURES else None
    if isinstance(expression, ast.Attribute) and expression.attr == "config":
        return "SteamiConfig"  # Steami().config
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
    racine = Path(racine)
    motifs = [(glob, _motif(glob)) for glob in destructifs]
    erreurs = []
    for chemin_page, texte in pages.items():
        for bloc in blocs(texte):
            if bloc.langage != "python":
                continue
            ou = f"{chemin_page}:{bloc.ligne}"
            meta = lire_meta(bloc.meta)
            if meta["norun"]:
                continue

            code = bloc.code
            exemple = None
            if meta["file"]:
                inclus = chemin_autorise(meta["file"])
                if inclus is None or not (racine / inclus).is_file():
                    erreurs.append(f"{ou} : fichier inclus introuvable ou interdit : {meta['file']}")
                    continue
                code = (racine / inclus).read_text(encoding="utf-8")
                m = EXEMPLE_LIB.match(inclus)
                exemple = m.group(1) if m else None
            if not meta["run"] and exemple is None:
                continue

            if executables is not None:
                executables.append(f"{ou}" + (f" ({exemple})" if exemple else ""))
            try:
                arbre = ast.parse(code)
            except SyntaxError as e:
                erreurs.append(f"{ou} : erreur de syntaxe Python ligne {e.lineno} du bloc : {e.msg}")
                continue

            non_gele = sorted(modules_importes(arbre) & non_geles)
            if non_gele:
                if not meta["run"]:
                    if executables is not None:
                        executables.pop()  # exemple de la lib sans bouton : rien à vérifier
                    continue
                erreurs.append(
                    f"{ou} : bloc exécutable qui importe un driver non gelé dans le firmware "
                    f"({', '.join(non_gele)}) : retirer `run`"
                )

            if meta["files"]:
                vus = set()
                for annexe in meta["files"]:
                    normalise = chemin_autorise(annexe)
                    if normalise is None:
                        erreurs.append(f"{ou} : fichier annexe hors de .external/ : {annexe}")
                        continue
                    if not (racine / normalise).is_file():
                        erreurs.append(f"{ou} : fichier annexe introuvable : {annexe}")
                    nom = posixpath.basename(normalise)
                    if nom in vus:
                        erreurs.append(f"{ou} : deux fichiers annexes s'appellent {nom}")
                    vus.add(nom)

            if exemple and not meta["confirm"]:
                operations = operations_persistantes(arbre)
                raison = next((f"liste : {glob}" for glob, motif in motifs if motif.match(exemple)), None)
                if operations:
                    raison = f"appelle {operations[0]}"
                if raison:
                    erreurs.append(
                        f"{ou} : l'exemple destructif {exemple} ({raison}) "
                        'doit porter confirm="<ce qui sera modifié>" (ou norun)'
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
