#!/usr/bin/env python3
"""
Réduit le poids d'une image du wiki sans changer son format ni son nom, pour
que les liens restent valides (issue https://github.com/steamicc/wiki_steami/issues/71).

| Format      | Traitement                                                      |
| ----------- | --------------------------------------------------------------- |
| PNG         | palette de 256 couleurs avec tramage (libimagequant)            |
| JPEG        | réencodage progressif, qualité 85, sans métadonnées EXIF        |
| WebP        | réencodage, qualité 85                                          |
| SVG         | images PNG ou JPEG intégrées en base64 traitées comme ci-dessus |

Avec --max-width, une image plus large est d'abord réduite à cette largeur
(proportions conservées). Viser deux fois la largeur d'affichage réelle pour
les écrans haute densité. Les images intégrées dans un SVG ne sont jamais
redimensionnées.

Avec --svg-jpeg COULEUR, les images intégrées d'un SVG sont posées sur
COULEUR puis intégrées en JPEG (qualité --quality, couleurs non
sous-échantillonnées, 4:4:4, pour garder nettes les pistes et les
inscriptions fines). Une photo en JPEG pèse bien moins qu'en PNG, même en
palette, mais perd sa transparence : n'utiliser cette option que si le SVG
dessine, sous toute l'image, un fond opaque de cette couleur (rectangle de
fond d'un schéma Inkscape, par exemple), sinon le fond change à l'écran.
Seul le contenu du SVG change : son nom et son format restent les mêmes.

Garde-fous :
- le fichier n'est réécrit que s'il devient plus léger ;
- un résultat dont le PSNR (rapport signal sur bruit, image posée sur fond
  blanc puis sur fond noir, valeur la plus basse retenue) tombe sous
  --min-psnr est refusé. Le PSNR est mesuré par rapport à l'image après
  redimensionnement éventuel. Le tramage d'une palette ajoute un bruit fin
  qui fait baisser le PSNR sans se voir : vers 33 dB sur une photo de circuit
  imprimé très détaillée, aucune différence n'est visible à 200 %. Le seuil
  par défaut, 32 dB, ne bloque donc qu'une vraie dégradation ; comparer
  quand même l'image avant et après à l'œil.

La palette PNG utilise libimagequant, la bibliothèque de pngquant : soit
Pillow compilé avec libimagequant (paquet python3-pil d'Ubuntu, qui dépend
de libimagequant0), soit la commande pngquant. Sans l'un ni l'autre, seule
l'option --lossless reste possible pour un PNG.

Usage :
    python3 scripts/optimize-image.py [options] FICHIER [FICHIER ...]

Options :
    --max-width N   réduit à N pixels de large une image plus large
    --lossless      PNG : recompresse sans palette (aucune perte, gain faible)
    --quality Q     qualité JPEG et WebP (85 par défaut)
    --svg-jpeg COULEUR
                    SVG : images intégrées posées sur COULEUR (#fffffc, white…)
                    et intégrées en JPEG
    --min-psnr DB   PSNR minimal accepté en dB (32 par défaut)
    --dry-run       affiche le résultat sans réécrire les fichiers

Code de sortie : 0 si tout s'est bien passé, 1 si un fichier n'a pas pu être
traité (format inconnu, perte trop forte, outil manquant).
"""

import argparse
import base64
import io
import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageColor, ImageOps, ImageStat, features
except ImportError:  # pragma: no cover - message pour l'utilisateur
    sys.exit("Pillow est requis : installer python3-pil (apt) ou pillow (pip).")

QUALITE_DEFAUT = 85
PSNR_MIN_DEFAUT = 32.0

# Attribut href (ou xlink:href) d'une image intégrée dans un SVG.
DATA_URI = re.compile(
    r'(href=")data:image/(png|jpeg|jpg);base64,([^"]+)(")', re.IGNORECASE
)


class ErreurOptimisation(Exception):
    """Fichier impossible à optimiser sans perte visible ou sans outil."""


def taille_lisible(octets):
    if octets >= 1024 * 1024:
        return f"{octets / (1024 * 1024):.2f} Mo"
    return f"{octets / 1024:.0f} Ko"


def psnr(reference, candidat):
    """PSNR en dB entre deux images de même taille, sur fonds blanc et noir.

    Les deux images sont posées sur un fond opaque pour que la couleur des
    pixels transparents, invisible, ne compte pas. La valeur la plus basse des
    deux fonds est rendue ; inf si les images sont identiques.
    """
    pires = []
    for fond in ((255, 255, 255, 255), (0, 0, 0, 255)):
        a = Image.alpha_composite(
            Image.new("RGBA", reference.size, fond), reference.convert("RGBA")
        ).convert("RGB")
        b = Image.alpha_composite(
            Image.new("RGBA", candidat.size, fond), candidat.convert("RGBA")
        ).convert("RGB")
        carres = ImageStat.Stat(ImageChops.difference(a, b)).sum2
        mse = sum(carres) / (3 * a.size[0] * a.size[1])
        pires.append(math.inf if mse == 0 else 10 * math.log10(255**2 / mse))
    return min(pires)


def redimensionner(image, largeur_max):
    if not largeur_max or image.width <= largeur_max:
        return image
    hauteur = round(image.height * largeur_max / image.width)
    return image.resize((largeur_max, hauteur), Image.Resampling.LANCZOS)


def palette_png(image):
    """Image en palette de 256 couleurs avec tramage, via libimagequant."""
    if features.check("libimagequant"):
        return image.quantize(
            colors=256,
            method=Image.Quantize.LIBIMAGEQUANT,
            dither=Image.Dither.FLOYDSTEINBERG,
        )
    pngquant = shutil.which("pngquant")
    if not pngquant:
        raise ErreurOptimisation(
            "palette PNG impossible : ni Pillow avec libimagequant ni pngquant "
            "(installer pngquant ou python3-pil, ou utiliser --lossless)"
        )
    tampon = io.BytesIO()
    image.save(tampon, "PNG")
    resultat = subprocess.run(
        [pngquant, "256", "--speed", "1", "-"],
        input=tampon.getvalue(),
        capture_output=True,
        check=True,
    )
    palette = Image.open(io.BytesIO(resultat.stdout))
    palette.load()
    return palette


def encoder(image, format_, options, icc=None, couleurs_completes=False):
    """Rend (octets, image décodée) de l'image réencodée dans son format.

    couleurs_completes : JPEG sans sous-échantillonnage des couleurs (4:4:4).
    """
    tampon = io.BytesIO()
    if format_ == "PNG":
        if options.lossless:
            sortie = image
        else:
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA")
            sortie = palette_png(image)
        sortie.save(tampon, "PNG", optimize=True, icc_profile=icc)
    elif format_ == "JPEG":
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        reglages = {"subsampling": 0} if couleurs_completes else {}
        image.save(
            tampon,
            "JPEG",
            quality=options.quality,
            optimize=True,
            progressive=True,
            icc_profile=icc,
            **reglages,
        )
    elif format_ == "WEBP":
        image.save(tampon, "WEBP", quality=options.quality, method=6, icc_profile=icc)
    else:
        raise ErreurOptimisation(f"format {format_} non pris en charge")
    donnees = tampon.getvalue()
    decodee = Image.open(io.BytesIO(donnees))
    decodee.load()
    return donnees, decodee


def optimiser_raster(donnees, options, largeur_max=None):
    """Rend (octets optimisés, PSNR) d'une image PNG, JPEG ou WebP.

    Le PSNR compare l'image réencodée à l'image redimensionnée (et, pour un
    JPEG, redressée selon son orientation EXIF, qui n'est pas conservée).
    """
    image = Image.open(io.BytesIO(donnees))
    format_ = image.format
    icc = image.info.get("icc_profile")
    image.load()
    if format_ == "JPEG":
        image = ImageOps.exif_transpose(image)
    image = redimensionner(image, largeur_max)
    nouvelles, decodee = encoder(image, format_, options, icc)
    qualite = psnr(image, decodee)
    if qualite < options.min_psnr:
        raise ErreurOptimisation(
            f"perte trop visible (PSNR {qualite:.1f} dB < {options.min_psnr} dB)"
        )
    return nouvelles, qualite


def aplatir_en_jpeg(donnees, fond, options):
    """Rend (octets JPEG, PSNR) d'une image posée sur la couleur fond.

    Le PSNR compare le JPEG à l'image posée sur ce fond, c'est-à-dire à ce
    que le SVG affiche quand il dessine ce fond sous l'image.
    """
    image = Image.open(io.BytesIO(donnees))
    icc = image.info.get("icc_profile")
    image.load()
    image = ImageOps.exif_transpose(image)
    aplatie = Image.alpha_composite(
        Image.new("RGBA", image.size, (*fond, 255)), image.convert("RGBA")
    ).convert("RGB")
    nouvelles, decodee = encoder(aplatie, "JPEG", options, icc, couleurs_completes=True)
    qualite = psnr(aplatie, decodee)
    if qualite < options.min_psnr:
        raise ErreurOptimisation(
            f"perte trop visible (PSNR {qualite:.1f} dB < {options.min_psnr} dB)"
        )
    return nouvelles, qualite


def optimiser_svg(texte, options):
    """Rend (texte, PSNR le plus bas) d'un SVG aux images intégrées optimisées."""
    psnrs = []

    def remplacer(m):
        brutes = base64.b64decode(re.sub(r"\s", "", m.group(3)))
        if options.svg_jpeg:
            nouvelles, qualite = aplatir_en_jpeg(brutes, options.svg_jpeg, options)
            mime = "jpeg"
        else:
            nouvelles, qualite = optimiser_raster(brutes, options)
            mime = "png" if m.group(2).lower() == "png" else "jpeg"
        if len(nouvelles) >= len(brutes):
            return m.group(0)
        psnrs.append(qualite)
        codees = base64.b64encode(nouvelles).decode("ascii")
        return f"{m.group(1)}data:image/{mime};base64,{codees}{m.group(4)}"

    nouveau = DATA_URI.sub(remplacer, texte)
    return nouveau, (min(psnrs) if psnrs else None)


def optimiser_fichier(chemin, options):
    """Optimise un fichier ; rend (taille avant, taille après, PSNR)."""
    avant = chemin.stat().st_size
    if chemin.suffix.lower() == ".svg":
        texte, qualite = optimiser_svg(chemin.read_text(encoding="utf-8"), options)
        nouvelles = texte.encode("utf-8")
    elif options.svg_jpeg:
        raise ErreurOptimisation("--svg-jpeg ne s'applique qu'à un fichier SVG")
    else:
        nouvelles, qualite = optimiser_raster(
            chemin.read_bytes(), options, options.max_width
        )
    if len(nouvelles) >= avant:
        return avant, avant, None
    if not options.dry_run:
        # Écriture dans un fichier voisin puis renommage : un arrêt en cours
        # de route ne laisse pas d'image tronquée. Le fichier temporaire est
        # créé en 0600 : lui redonner les droits de l'original.
        with tempfile.NamedTemporaryFile(
            dir=chemin.parent, prefix=".optimize-", delete=False
        ) as temporaire:
            temporaire.write(nouvelles)
        shutil.copymode(chemin, temporaire.name)
        Path(temporaire.name).replace(chemin)
    return avant, len(nouvelles), qualite


def couleur(texte):
    """Couleur (r, g, b) lue dans une notation CSS : #fffffc, white…"""
    try:
        return ImageColor.getrgb(texte)[:3]
    except ValueError as e:
        raise argparse.ArgumentTypeError(f"couleur inconnue : {texte}") from e


def analyser_arguments(argv):
    parser = argparse.ArgumentParser(
        description="Réduit le poids d'images PNG, JPEG, WebP ou SVG."
    )
    parser.add_argument("fichiers", nargs="+", type=Path)
    parser.add_argument("--max-width", type=int, default=None)
    parser.add_argument("--lossless", action="store_true")
    parser.add_argument("--quality", type=int, default=QUALITE_DEFAUT)
    parser.add_argument("--svg-jpeg", metavar="COULEUR", type=couleur, default=None)
    parser.add_argument("--min-psnr", type=float, default=PSNR_MIN_DEFAUT)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv=None):
    options = analyser_arguments(argv)
    echecs = 0
    for chemin in options.fichiers:
        try:
            avant, apres, qualite = optimiser_fichier(chemin, options)
        except (ErreurOptimisation, OSError, subprocess.CalledProcessError) as e:
            print(f"{chemin} : non modifié, {e}", file=sys.stderr)
            echecs += 1
            continue
        if apres == avant:
            print(f"{chemin} : {taille_lisible(avant)}, déjà optimisé")
            continue
        gain = 100 * (avant - apres) / avant
        mesure = (
            "" if qualite is None or math.isinf(qualite) else f", PSNR {qualite:.1f} dB"
        )
        prefixe = "(essai) " if options.dry_run else ""
        print(
            f"{prefixe}{chemin} : {taille_lisible(avant)} -> "
            f"{taille_lisible(apres)} (-{gain:.0f} %{mesure})"
        )
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
