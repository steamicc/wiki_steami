#!/usr/bin/env python3
"""
Remplace dans les pages du wiki les croquis Arduino écrits en ligne qui sont
publiés dans arduino-steami-sample par leur inclusion et le bouton Téléverser.

Lancé par .github/workflows/suivre-croquis-sample.yml dans la PR qui épingle
une nouvelle release du sample, avec un clone du sample à ce tag. Pour chaque
bloc `sample=GROUPE/Nom` (croquis_en_ligne.py) dont examples/GROUPE/Nom/Nom.ino
existe dans ce clone, le bloc, du délimiteur ouvrant au délimiteur fermant,
devient :

    ```cpp file=.external/arduino-steami-sample/examples/GROUPE/Nom/Nom.ino

    ```

    <EssayerExemple id="GROUPE/Nom" source="sample" />

avec l'indentation du délimiteur ouvrant (bloc dans un onglet <Release>) et les
fins de ligne de la page (CRLF gardé), suivi d'une ligne vide si du texte
suivait directement le bloc. Le reste de la meta du bloc (title="…",
showLineNumbers, {1-3}…) est recopié après `file=`, sans le jeton `sample=`. Une page convertie reçoit, si elle ne l'a pas,
l'import d'EssayerExemple : à la fin du groupe d'imports qui suit le
frontmatter, sinon juste après le frontmatter, sinon en tête de page.

Le reste de la page est gardé octet pour octet. Ne sont pas convertis : un bloc
dont le croquis n'est pas (encore) dans le sample, un bloc `norun`, un id mal
formé ou d'un groupe inconnu, un bloc non fermé, et un id déjà converti plus
haut (doublon : check-inline-sketches.py le signale). Un deuxième passage ne
change rien : un bloc converti a `file=` et n'est plus un croquis en ligne.

Si le croquis publié (sans son en-tête « // Croquis de la page du wiki … »)
diffère du code du bloc, le bloc est converti quand même et un avertissement
le signale (annotation sous GitHub Actions) : la page affiche désormais le
croquis publié. Trois causes possibles : croquis corrigé dans la PR du sample
(voulu), bloc modifié dans le wiki après la fusion de cette PR (le robot ne
reporte pas la modification : elle serait perdue), ou nom déjà pris par un
autre croquis. L'id est aussi écrit dans la sortie `differents=` : le workflow
le cite dans le corps de la PR et l'ouvre en brouillon, sans fusion
automatique, pour qu'un humain vérifie le diff.

Un id converti est retiré de scripts/exemples-arduino-sample-a-documenter.txt
s'il y figure (check-arduino-examples.py refuse un croquis à la fois utilisé
et en attente) ; les autres lignes de la liste restent telles quelles.

--sortie-github (en général $GITHUB_OUTPUT) reçoit `convertis=<ids>` et
`differents=<ids>` (convertis dont le croquis publié diffère du bloc), séparés
par des espaces, vides s'il n'y en a pas.

Usage :
    python3 scripts/convertir-croquis.py SAMPLE [--pages DIR]
        [--attente-sample PATH] [--sortie-github PATH]
"""

import argparse
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from croquis_en_ligne import (
    CLOTURE,
    GROUPES,
    MOTIF_ID,
    blocs_de_texte,
    lister_pages,
    meme_code,
    meta_sans_sample,
)

RACINE = Path(__file__).resolve().parent.parent
PAGES_DEFAUT = RACINE / "docs"
ATTENTE_SAMPLE_DEFAUT = RACINE / "scripts" / "exemples-arduino-sample-a-documenter.txt"
DOSSIER_INCLUSION = ".external/arduino-steami-sample/examples"
IMPORT = "import EssayerExemple from '@site/src/components/EssayerExemple';"
DEJA_IMPORTE = re.compile(r"^import\s.*\bEssayerExemple\b")
FIN_DE_LIGNE = re.compile(r"(\r\n|\r|\n)$")


def fin_de_ligne(ligne, defaut="\n"):
    """Fin de ligne de `ligne` (lue avec keepends), `defaut` si elle n'en a pas."""
    m = FIN_DE_LIGNE.search(ligne)
    return m.group(1) if m else defaut


def sans_fin(ligne):
    return FIN_DE_LIGNE.sub("", ligne)


def est_vide(ligne):
    return not ligne.strip()


def ids_publies(sample):
    """Ids GROUPE/Nom des croquis examples/GROUPE/Nom/Nom.ino du clone du sample."""
    exemples = Path(sample) / "examples"
    return {
        f"{groupe.name}/{nom.name}"
        for groupe in exemples.iterdir()
        if groupe.is_dir()
        for nom in groupe.iterdir()
        if (nom / f"{nom.name}.ino").is_file()
    }


def _ferme(lignes, bloc):
    """Le bloc se termine par un vrai délimiteur fermant (pas la fin de la page)."""
    if bloc.ligne_fin <= bloc.ligne_debut:
        return False
    ouvrant = CLOTURE.match(lignes[bloc.ligne_debut - 1].lstrip())
    fermant = CLOTURE.match(sans_fin(lignes[bloc.ligne_fin - 1]).lstrip())
    return bool(
        ouvrant
        and fermant
        and fermant.group(1)[0] == ouvrant.group(1)[0]
        and len(fermant.group(1)) >= len(ouvrant.group(1))
        and not fermant.group(2).strip()
    )


def _inclusion(ident, meta, ouvrant, fermant, suivante):
    """Lignes qui remplacent le bloc. `meta` : meta du bloc ; `suivante` :
    ligne après le bloc, ou None."""
    groupe, nom = ident.split("/")
    indent = ouvrant[: len(ouvrant) - len(ouvrant.lstrip())]
    eol = fin_de_ligne(ouvrant)
    # title=, showLineNumbers… : remark-code-file.js les garde après file=.
    reste = meta_sans_sample(meta)
    reste = f" {reste}" if reste else ""
    lignes = [
        f"{indent}```cpp file={DOSSIER_INCLUSION}/{groupe}/{nom}/{nom}.ino{reste}{eol}",
        eol,
        f"{indent}```{eol}",
        eol,
        # Dernière ligne : fin de ligne du délimiteur fermant (aucune en fin de page).
        f'{indent}<EssayerExemple id="{ident}" source="sample" />{fin_de_ligne(fermant, "")}',
    ]
    if suivante is not None and not est_vide(suivante):
        # Sans ligne vide, MDX lirait la balise et le texte suivant comme un paragraphe.
        lignes.append(eol)
    return lignes


def _ajouter_import(lignes):
    """Lignes de la page avec l'import d'EssayerExemple, s'il manque."""
    if any(DEJA_IMPORTE.match(l) for l in lignes):
        return lignes
    debut = 0
    if lignes and sans_fin(lignes[0]).lstrip("\ufeff").strip() == "---":
        fin_fm = next(
            (i for i in range(1, len(lignes)) if sans_fin(lignes[i]).strip() == "---"), None
        )
        if fin_fm is not None:
            debut = fin_fm + 1
    eol = fin_de_ligne(lignes[debut - 1]) if debut else fin_de_ligne(lignes[0])
    # Groupe d'imports qui suit le frontmatter : l'import s'ajoute à sa fin
    # (avant la première ligne vide, ce qui garde entiers les imports sur
    # plusieurs lignes).
    i = debut
    while i < len(lignes) and est_vide(lignes[i]):
        i += 1
    if i < len(lignes) and lignes[i].startswith("import "):
        while i < len(lignes) and not est_vide(lignes[i]):
            i += 1
        precedente = lignes[i - 1]
        if not FIN_DE_LIGNE.search(precedente):
            lignes = lignes[: i - 1] + [precedente + eol] + lignes[i - 1 :][1:]
        return lignes[:i] + [IMPORT + eol] + lignes[i:]
    nouvelles = [IMPORT + eol]
    if debut:
        nouvelles.insert(0, eol)  # ligne vide après le frontmatter
    if debut < len(lignes) and not est_vide(lignes[debut]):
        nouvelles.append(eol)
    return lignes[:debut] + nouvelles + lignes[debut:]


def convertir_texte(texte, publies, deja_convertis=None, avertir=None):
    """(nouveau texte, ids convertis dans l'ordre de la page).

    publies : ids publiés dans le sample au nouveau tag ; deja_convertis : ids
    convertis dans les pages précédentes (doublons), complété par la fonction.
    """
    deja_convertis = set() if deja_convertis is None else deja_convertis
    lignes = texte.splitlines(keepends=True)
    a_convertir = []
    for b in blocs_de_texte(texte, ""):
        ident = b.id_sample
        if ident is None or ident not in publies:
            continue
        if b.norun or not MOTIF_ID.match(ident) or ident.split("/", 1)[0] not in GROUPES:
            continue
        if not _ferme(lignes, b):
            if avertir:
                avertir(b, f"bloc sample={ident} non fermé : non converti")
            continue
        if ident in deja_convertis:
            if avertir:
                avertir(b, f"sample={ident} déjà converti plus haut : doublon non converti")
            continue
        deja_convertis.add(ident)
        a_convertir.append(b)
    if not a_convertir:
        return texte, []
    # De la fin vers le début : les numéros de ligne des blocs restants tiennent.
    for b in reversed(a_convertir):
        suivante = lignes[b.ligne_fin] if b.ligne_fin < len(lignes) else None
        remplacement = _inclusion(
            b.id_sample, b.meta, lignes[b.ligne_debut - 1], lignes[b.ligne_fin - 1], suivante
        )
        lignes[b.ligne_debut - 1 : b.ligne_fin] = remplacement
    lignes = _ajouter_import(lignes)
    return "".join(lignes), [b.id_sample for b in a_convertir]


def _lire(chemin):
    # Octets décodés tels quels : pas de conversion des fins de ligne.
    return chemin.read_bytes().decode("utf-8")


def _ecrire(chemin, texte):
    chemin.write_bytes(texte.encode("utf-8"))


def _affiche(chemin):
    try:
        return chemin.resolve().relative_to(RACINE)
    except ValueError:
        return chemin


def fichier_publie(sample, ident):
    """Texte du croquis publié, en-tête compris."""
    groupe, nom = ident.split("/")
    return _lire(Path(sample) / "examples" / groupe / nom / f"{nom}.ino")


def retirer_de_l_attente(chemin, ids):
    """Retire les ids de la liste d'attente, sans toucher aux autres lignes."""
    if not ids or not chemin.is_file():
        return []
    lignes = _lire(chemin).splitlines(keepends=True)
    gardees = [l for l in lignes if l.strip() not in ids]
    if len(gardees) == len(lignes):
        return []
    _ecrire(chemin, "".join(gardees))
    return sorted({l.strip() for l in lignes} & set(ids))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("sample", type=Path, help="clone d'arduino-steami-sample au nouveau tag")
    parser.add_argument("--pages", type=Path, default=PAGES_DEFAUT)
    parser.add_argument("--attente-sample", type=Path, default=ATTENTE_SAMPLE_DEFAUT)
    parser.add_argument("--sortie-github", type=Path)
    args = parser.parse_args(argv)
    actions = os.environ.get("GITHUB_ACTIONS") == "true"

    if not (args.sample / "examples").is_dir():
        print(
            f"Erreur : {args.sample / 'examples'} introuvable : donner le clone "
            "d'arduino-steami-sample au tag de la release à épingler",
            file=sys.stderr,
        )
        return 2
    publies = ids_publies(args.sample)

    convertis = []
    differents = []
    deja = set()
    for page in lister_pages(args.pages):
        affiche = _affiche(page)

        def avertir(b, message, affiche=affiche):
            print(f"Attention : {affiche}:{b.ligne_debut} : {message}")

        texte = _lire(page)
        avant = {b.id_sample: b for b in reversed(blocs_de_texte(texte, affiche))}
        nouveau, ids = convertir_texte(texte, publies, deja, avertir)
        for ident in ids:
            # Croquis corrigé dans la PR du sample, bloc modifié dans le wiki
            # après la fusion de cette PR, ou nom déjà pris par un autre croquis :
            # converti quand même, mais signalé pour la relecture.
            b = avant[ident]
            if not meme_code(fichier_publie(args.sample, ident), b.code):
                differents.append(ident)
                message = (
                    f"le croquis publié {ident} diffère du bloc de la page : "
                    "la page affiche désormais celui du sample, vérifier le diff "
                    "(une modification faite dans la page après la fusion de la PR "
                    "du sample est perdue : la reporter dans arduino-steami-sample)"
                )
                avertir(b, message)
                if actions:
                    print(f"::warning file={affiche},line={b.ligne_debut}::{message}")
        if ids:
            _ecrire(page, nouveau)
            for ident in ids:
                print(f"Converti : {affiche} sample={ident}")
            convertis += ids
        for b in blocs_de_texte(nouveau, affiche):
            if b.id_sample is not None and b.id_sample not in publies and not b.norun:
                print(f"Pas encore dans le sample : {affiche}:{b.ligne_debut} sample={b.id_sample}")

    for ident in retirer_de_l_attente(args.attente_sample, set(convertis)):
        print(f"Retiré de {_affiche(args.attente_sample)} : {ident}")

    print(f"{len(convertis)} croquis converti(s) en inclusion.")
    if args.sortie_github:
        with args.sortie_github.open("a", encoding="utf-8") as sortie:
            sortie.write(f"convertis={' '.join(convertis)}\n")
            sortie.write(f"differents={' '.join(differents)}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
