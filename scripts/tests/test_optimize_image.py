import base64
import contextlib
import importlib.util
import io
import random
import tempfile
import unittest
from pathlib import Path
from unittest import mock

try:
    from PIL import Image, features
except ImportError:  # Pillow absent : tests ignorés
    Image = None

SCRIPT = Path(__file__).resolve().parents[1] / "optimize-image.py"

if Image is not None:
    spec = importlib.util.spec_from_file_location("optimize_image", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    PALETTE = features.check("libimagequant")
else:
    module = None
    PALETTE = False


def photo(largeur=200, hauteur=150):
    """Image RGBA en dégradé bruité, mal compressée en PNG 32 bits."""
    rng = random.Random(1)
    image = Image.new("RGBA", (largeur, hauteur))
    image.putdata(
        [
            (
                (x * 255) // largeur,
                (y * 255) // hauteur,
                min(255, 128 + rng.randint(-6, 6)),
                0 if x < 10 else 255,
            )
            for y in range(hauteur)
            for x in range(largeur)
        ]
    )
    return image


def octets_png(image):
    tampon = io.BytesIO()
    image.save(tampon, "PNG")
    return tampon.getvalue()


def lancer(*argv):
    sortie, erreurs = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(sortie), contextlib.redirect_stderr(erreurs):
        code = module.main([str(a) for a in argv])
    return code, sortie.getvalue(), erreurs.getvalue()


@unittest.skipIf(Image is None, "Pillow absent")
class TestPsnr(unittest.TestCase):
    def test_images_identiques(self):
        image = photo(20, 20)
        self.assertEqual(module.psnr(image, image.copy()), float("inf"))

    def test_pixels_transparents_ignores(self):
        a = Image.new("RGBA", (4, 4), (255, 0, 0, 0))
        b = Image.new("RGBA", (4, 4), (0, 0, 255, 0))
        self.assertEqual(module.psnr(a, b), float("inf"))

    def test_difference_mesuree(self):
        a = Image.new("RGB", (4, 4), (100, 100, 100))
        b = Image.new("RGB", (4, 4), (110, 100, 100))
        self.assertLess(module.psnr(a, b), 40)


@unittest.skipIf(Image is None, "Pillow absent")
class TestRedimensionner(unittest.TestCase):
    def test_reduit_en_gardant_les_proportions(self):
        image = module.redimensionner(Image.new("RGB", (400, 300)), 100)
        self.assertEqual(image.size, (100, 75))

    def test_image_plus_etroite_inchangee(self):
        image = Image.new("RGB", (80, 60))
        self.assertIs(module.redimensionner(image, 100), image)
        self.assertIs(module.redimensionner(image, None), image)


@unittest.skipIf(Image is None, "Pillow absent")
class TestFichiers(unittest.TestCase):
    def setUp(self):
        self.dossier = tempfile.TemporaryDirectory()
        self.addCleanup(self.dossier.cleanup)
        self.racine = Path(self.dossier.name)

    @unittest.skipUnless(PALETTE, "Pillow sans libimagequant")
    def test_png_allege_meme_taille_en_pixels(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        avant = chemin.stat().st_size
        code, sortie, _ = lancer(chemin)
        self.assertEqual(code, 0)
        self.assertLess(chemin.stat().st_size, avant)
        with Image.open(chemin) as image:
            self.assertEqual(image.size, (200, 150))
            self.assertEqual(image.mode, "P")
        self.assertIn("PSNR", sortie)

    @unittest.skipUnless(PALETTE, "Pillow sans libimagequant")
    def test_largeur_max(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        code, _, _ = lancer("--max-width", 100, chemin)
        self.assertEqual(code, 0)
        with Image.open(chemin) as image:
            self.assertEqual(image.size, (100, 75))

    @unittest.skipUnless(PALETTE, "Pillow sans libimagequant")
    def test_essai_sans_ecriture(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        contenu = chemin.read_bytes()
        code, sortie, _ = lancer("--dry-run", chemin)
        self.assertEqual(code, 0)
        self.assertEqual(chemin.read_bytes(), contenu)
        self.assertIn("(essai)", sortie)

    @unittest.skipUnless(PALETTE, "Pillow sans libimagequant")
    def test_perte_trop_forte_refusee(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        contenu = chemin.read_bytes()
        code, _, erreurs = lancer("--min-psnr", 99, chemin)
        self.assertEqual(code, 1)
        self.assertEqual(chemin.read_bytes(), contenu)
        self.assertIn("perte trop visible", erreurs)

    @unittest.skipUnless(PALETTE, "Pillow sans libimagequant")
    def test_droits_conserves(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        chemin.chmod(0o644)
        code, _, _ = lancer(chemin)
        self.assertEqual(code, 0)
        self.assertEqual(chemin.stat().st_mode & 0o777, 0o644)
        self.assertEqual(list(self.racine.glob(".optimize-*")), [])

    def test_fichier_deja_optimise_inchange(self):
        chemin = self.racine / "uni.png"
        Image.new("P", (16, 16)).save(chemin, optimize=True)
        contenu = chemin.read_bytes()
        code, sortie, _ = lancer("--lossless", chemin)
        self.assertEqual(code, 0)
        self.assertEqual(chemin.read_bytes(), contenu)
        self.assertIn("déjà optimisé", sortie)

    def test_jpeg_reencode(self):
        chemin = self.racine / "photo.jpg"
        photo().convert("RGB").save(chemin, quality=100, subsampling=0)
        avant = chemin.stat().st_size
        code, _, _ = lancer(chemin)
        self.assertEqual(code, 0)
        self.assertLess(chemin.stat().st_size, avant)
        with Image.open(chemin) as image:
            self.assertEqual(image.format, "JPEG")

    @unittest.skipUnless(PALETTE, "Pillow sans libimagequant")
    def test_svg_image_integree(self):
        donnees = base64.b64encode(octets_png(photo())).decode("ascii")
        chemin = self.racine / "schema.svg"
        chemin.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" '
            'xmlns:xlink="http://www.w3.org/1999/xlink">'
            f'<image width="20" height="15" xlink:href="data:image/png;base64,{donnees}" />'
            "<text>GND</text></svg>",
            encoding="utf-8",
        )
        avant = chemin.stat().st_size
        code, _, _ = lancer(chemin)
        self.assertEqual(code, 0)
        texte = chemin.read_text(encoding="utf-8")
        self.assertLess(len(texte), avant)
        self.assertIn("<text>GND</text>", texte)
        integree = texte.split("base64,")[1].split('"')[0]
        with Image.open(io.BytesIO(base64.b64decode(integree))) as image:
            self.assertEqual(image.size, (200, 150))

    def ecrire_svg(self, image):
        donnees = base64.b64encode(octets_png(image)).decode("ascii")
        chemin = self.racine / "schema.svg"
        chemin.write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" '
            'xmlns:xlink="http://www.w3.org/1999/xlink">'
            '<rect width="30" height="20" style="fill:#fffffc" />'
            f'<image width="20" height="15" xlink:href="data:image/png;base64,{donnees}" />'
            "<text>GND</text></svg>",
            encoding="utf-8",
        )
        return chemin

    def test_svg_jpeg_aplatit_sur_le_fond(self):
        chemin = self.ecrire_svg(photo())
        avant = chemin.stat().st_size
        code, sortie, _ = lancer("--svg-jpeg", "#fffffc", chemin)
        self.assertEqual(code, 0)
        texte = chemin.read_text(encoding="utf-8")
        self.assertLess(len(texte), avant)
        self.assertIn('style="fill:#fffffc"', texte)
        self.assertIn("<text>GND</text>", texte)
        self.assertNotIn("data:image/png", texte)
        self.assertIn("PSNR", sortie)
        integree = texte.split("data:image/jpeg;base64,")[1].split('"')[0]
        with Image.open(io.BytesIO(base64.b64decode(integree))) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(image.size, (200, 150))
            # Colonnes transparentes de photo() : couleur du fond.
            r, g, b = image.convert("RGB").getpixel((2, 75))
        self.assertTrue(
            all(abs(v - c) <= 3 for v, c in zip((r, g, b), (255, 255, 252)))
        )

    def test_svg_jpeg_perte_trop_forte_refusee(self):
        chemin = self.ecrire_svg(photo())
        contenu = chemin.read_bytes()
        code, _, erreurs = lancer("--svg-jpeg", "white", "--min-psnr", 99, chemin)
        self.assertEqual(code, 1)
        self.assertEqual(chemin.read_bytes(), contenu)
        self.assertIn("perte trop visible", erreurs)

    def test_svg_jpeg_refuse_hors_svg(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        contenu = chemin.read_bytes()
        code, _, erreurs = lancer("--svg-jpeg", "white", chemin)
        self.assertEqual(code, 1)
        self.assertEqual(chemin.read_bytes(), contenu)
        self.assertIn("SVG", erreurs)

    def test_svg_jpeg_couleur_inconnue(self):
        with (
            contextlib.redirect_stderr(io.StringIO()),
            self.assertRaises(SystemExit),
        ):
            module.main(["--svg-jpeg", "pas-une-couleur", "schema.svg"])

    def test_sans_outil_de_palette(self):
        chemin = self.racine / "photo.png"
        photo().save(chemin)
        contenu = chemin.read_bytes()
        with (
            mock.patch.object(module.features, "check", return_value=False),
            mock.patch.object(module.shutil, "which", return_value=None),
        ):
            code, _, erreurs = lancer(chemin)
        self.assertEqual(code, 1)
        self.assertEqual(chemin.read_bytes(), contenu)
        self.assertIn("pngquant", erreurs)

    def test_format_non_pris_en_charge(self):
        chemin = self.racine / "anim.gif"
        Image.new("P", (8, 8)).save(chemin)
        code, _, erreurs = lancer(chemin)
        self.assertEqual(code, 1)
        self.assertIn("GIF", erreurs)


if __name__ == "__main__":
    unittest.main()
