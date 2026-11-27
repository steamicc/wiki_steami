"""
Croquis Arduino écrits en ligne dans les pages du wiki : repérage des blocs de
code et lecture de leur marquage.

Un bloc en ligne est un bloc de code délimité (``` ou ~~~) dans un langage de
croquis (cpp, c++, ino, arduino) sans `file=` dans sa meta. Il est « complet »
s'il contient `setup(` et `loop(` : c'est alors un croquis qui doit porter dans
sa meta soit `sample=GROUPE/Nom` (à reprendre dans arduino-steami-sample), soit
`norun` (fragment pédagogique, src/main.cpp PlatformIO, croquis volontairement
incomplet). Ces marques ne changent pas l'affichage du bloc.

Module commun au lint (check-inline-sketches.py), au robot qui ajoute les
croquis au sample et à la conversion des blocs en inclusions.
"""

import re
from dataclasses import dataclass
from pathlib import Path

# Langages d'un bloc de code tenu pour un croquis Arduino.
LANGAGES_CROQUIS = ("cpp", "c++", "ino", "arduino")
# Groupes de croquis d'arduino-steami-sample (examples/<GROUPE>/<Nom>/<Nom>.ino).
GROUPES = ("CAPTEURS", "ECRAN", "PREMIERS", "CARTE", "BOUTONS", "BUZZER")
# Forme d'un id de croquis, la même que celle des index d'exemples.
MOTIF_ID = re.compile(r"^[A-Z0-9_-]+/[A-Za-z0-9_]+$")

# Délimiteur de bloc de code : au moins trois ` ou trois ~ (CommonMark).
CLOTURE = re.compile(r"^(`{3,}|~{3,})(.*)$")
# Jetons de la meta : clé=valeur (valeur entre guillemets possible), texte
# entre guillemets ou mot seul. Un `norun` dans un titre n'est pas une marque.
JETON = re.compile(r"""([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S*))|"[^"]*"|'[^']*'|(\S+)""")
SETUP = re.compile(r"\bsetup\s*\(")
LOOP = re.compile(r"\bloop\s*\(")


@dataclass(frozen=True)
class Bloc:
    """Bloc de croquis en ligne.

    fichier : chemin de la page (relatif à la racine du dépôt pour blocs()) ;
    ligne_debut, ligne_fin : lignes (à partir de 1) des délimiteurs ouvrant et
    fermant (dernière ligne de la page pour un bloc non fermé) ;
    meta : texte qui suit le langage sur la ligne ouvrante ;
    code : contenu du bloc, indentation du délimiteur retirée, lignes en \\n
    et \\n final ;
    id_sample : valeur de `sample=` (telle quelle, éventuellement vide), sinon None ;
    norun : marque `norun` présente.
    """

    fichier: Path
    ligne_debut: int
    ligne_fin: int
    meta: str
    code: str
    id_sample: str | None
    norun: bool
    langage: str = "cpp"

    @property
    def complet(self):
        return bool(SETUP.search(self.code) and LOOP.search(self.code))


def lire_meta(meta):
    """(id_sample, norun, file présent) d'une meta de bloc."""
    id_sample = None
    norun = False
    fichier = False
    for m in JETON.finditer(meta):
        cle, mot = m.group(1), m.group(5)
        if cle == "sample" and id_sample is None:
            id_sample = next((g for g in m.group(2, 3, 4) if g is not None), "")
        elif cle == "file":
            fichier = True
        elif mot == "norun":
            norun = True
    return id_sample, norun, fichier


def _desindenter(ligne, indent):
    """Retire au plus `indent` espaces en tête de ligne."""
    retrait = len(ligne) - len(ligne.lstrip(" "))
    return ligne[min(retrait, indent):]


def blocs_de_texte(texte, fichier):
    """Blocs de croquis en ligne d'une page, dans l'ordre."""
    resultat = []
    lignes = texte.splitlines()
    ouvert = None  # (délimiteur, indentation, ligne, langage, meta, lignes de code)
    for numero, ligne in enumerate(lignes, start=1):
        m = CLOTURE.match(ligne.lstrip())
        if ouvert is None:
            # Un délimiteur ``` ouvrant ne peut pas contenir de ` dans son info.
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                info = m.group(2).strip()
                langage, _, meta = info.partition(" ")
                indent = len(ligne) - len(ligne.lstrip(" "))
                ouvert = (m.group(1), indent, numero, langage.lower(), meta.strip(), [])
            continue
        cloture, indent, debut, langage, meta, code = ouvert
        # Le bloc ne se ferme que sur le même caractère, au moins aussi long,
        # sans rien après : un ```` peut contenir des lignes ```.
        if (
            m
            and m.group(1)[0] == cloture[0]
            and len(m.group(1)) >= len(cloture)
            and not m.group(2).strip()
        ):
            _ajouter(resultat, fichier, debut, numero, langage, meta, code)
            ouvert = None
        else:
            code.append(_desindenter(ligne, indent))
    if ouvert is not None:
        _, _, debut, langage, meta, code = ouvert
        _ajouter(resultat, fichier, debut, len(lignes), langage, meta, code)
    return resultat


def _ajouter(resultat, fichier, debut, fin, langage, meta, code):
    if langage not in LANGAGES_CROQUIS:
        return
    id_sample, norun, inclusion = lire_meta(meta)
    if inclusion:
        return
    texte = "".join(f"{l}\n" for l in code)
    resultat.append(Bloc(Path(fichier), debut, fin, meta, texte, id_sample, norun, langage))


def lister_pages(dossier):
    """Pages *.md et *.mdx du dossier et de ses sous-dossiers, triées."""
    dossier = Path(dossier)
    if not dossier.is_dir():
        return []
    return sorted(p for p in dossier.rglob("*") if p.suffix in (".md", ".mdx") and p.is_file())


def blocs(docs_dir, racine=None):
    """Blocs de croquis en ligne de toutes les pages de docs_dir.

    Le chemin de chaque page est relatif à `racine` (par défaut le parent de
    docs_dir, la racine du dépôt pour docs/).
    """
    docs_dir = Path(docs_dir)
    racine = Path(racine) if racine is not None else docs_dir.parent
    resultat = []
    for page in lister_pages(docs_dir):
        texte = page.read_text(encoding="utf-8")
        resultat += blocs_de_texte(texte, page.relative_to(racine))
    return resultat
