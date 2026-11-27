import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "check-arduino-examples.py"
spec = importlib.util.spec_from_file_location("check_arduino_examples", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
verifier = module.verifier

PAGE = Path("docs/software/arduino/exemples/vl53l1x.md")
ID = "VL53L1X/GestureDetection"


def page(titre="## GestureDetection {#gesturedetection}", ident=ID):
    return f'{titre}\n\nTexte.\n\n<EssayerExemple id="{ident}" />\n'


class TestVerifier(unittest.TestCase):
    def test_all_documented_ok(self):
        self.assertEqual(verifier({ID}, {PAGE: page()}, []), [])

    def test_unknown_id(self):
        erreurs = verifier({ID}, {PAGE: page(ident="VL53L1X/Inconnu")}, [ID])
        self.assertTrue(any("VL53L1X/Inconnu" in e for e in erreurs))

    def test_missing_anchor(self):
        erreurs = verifier({ID}, {PAGE: page(titre="## GestureDetection")}, [])
        self.assertTrue(any(ID in e for e in erreurs))

    def test_wrong_anchor(self):
        erreurs = verifier({ID}, {PAGE: page(titre="## GestureDetection {#GestureDetection}")}, [])
        self.assertTrue(any(ID in e and "gesturedetection" in e for e in erreurs))

    def test_snake_case_anchor_kept(self):
        ident = "APDS9960/ambient_light"
        texte = page(titre="## ambient_light {#ambient_light}", ident=ident)
        self.assertEqual(verifier({ident}, {PAGE: texte}, []), [])

    def test_undocumented_not_waiting(self):
        erreurs = verifier({ID, "X/Autre"}, {PAGE: page()}, [])
        self.assertTrue(any("X/Autre" in e for e in erreurs))

    def test_documented_still_waiting(self):
        erreurs = verifier({ID}, {PAGE: page()}, [ID])
        self.assertTrue(any(ID in e for e in erreurs))

    def test_waiting_unknown_id(self):
        erreurs = verifier({ID}, {PAGE: page()}, ["Z/Fantome"])
        self.assertTrue(any("Z/Fantome" in e for e in erreurs))

    def test_single_quotes_accepted(self):
        texte = page().replace(f'"{ID}"', f"'{ID}'")
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_subheading_inside_section_ok(self):
        texte = (
            "## GestureDetection {#gesturedetection}\n\n### Comment ça marche\n\n"
            f'Texte.\n\n<EssayerExemple id="{ID}" />\n'
        )
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_anchor_on_wrong_level(self):
        texte = page(titre="### GestureDetection {#gesturedetection}")
        erreurs = verifier({ID}, {PAGE: texte}, [])
        self.assertTrue(any(ID in e for e in erreurs))


    def test_tag_in_tilde_fence_ignored(self):
        texte = page() + '\n~~~mdx\n<EssayerExemple id="VL53L1X/Inconnu" />\n~~~\n'
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_tag_in_long_fence_with_inner_fence_ignored(self):
        texte = page() + (
            '\n````md\n```mdx\n<EssayerExemple id="VL53L1X/Inconnu" />\n```\n````\n'
        )
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_tilde_does_not_close_backtick_fence(self):
        texte = page() + '\n```\n~~~\n<EssayerExemple id="VL53L1X/Inconnu" />\n```\n'
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_fence_with_info_does_not_close(self):
        texte = page() + '\n```\n```cpp\n<EssayerExemple id="VL53L1X/Inconnu" />\n```\n'
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_tag_after_closed_fence_checked(self):
        texte = "```cpp\nvoid setup() {}\n```\n\n" + page(ident="VL53L1X/Inconnu")
        erreurs = verifier({ID}, {PAGE: texte}, [ID])
        self.assertTrue(any("VL53L1X/Inconnu" in e for e in erreurs))


class TestPages(unittest.TestCase):
    """Parcours récursif du dossier des pages par main()."""

    def lancer(self, ecrire_pages, ids=(ID,)):
        with tempfile.TemporaryDirectory() as dossier:
            dossier = Path(dossier)
            index = dossier / "index.json"
            index.write_text(
                json.dumps({"version": "v1", "exemples": [{"id": i} for i in ids]}),
                encoding="utf-8",
            )
            pages = dossier / "docs"
            pages.mkdir()
            ecrire_pages(pages)
            args = ["--index", str(index), "--pages", str(pages)]
            args += ["--epingle", str(dossier / "absente.json")]
            args += ["--attente", str(dossier / "absente.txt")]
            sortie, erreurs = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(sortie), contextlib.redirect_stderr(erreurs):
                code = module.main(args)
            return code, sortie.getvalue(), erreurs.getvalue()

    def test_subfolder_page_scanned(self):
        def ecrire(pages):
            sous = pages / "software" / "arduino" / "exemples" / "capteurs"
            sous.mkdir(parents=True)
            (sous / "vl53l1x.md").write_text(page(), encoding="utf-8")

        code, sortie, erreurs = self.lancer(ecrire)
        self.assertEqual(code, 0, erreurs)
        self.assertIn("1 page(s)", sortie)

    def test_mdx_page_scanned(self):
        def ecrire(pages):
            (pages / "vl53l1x.mdx").write_text(page(), encoding="utf-8")

        code, sortie, erreurs = self.lancer(ecrire)
        self.assertEqual(code, 0, erreurs)
        self.assertIn("1 page(s)", sortie)

    def test_bad_id_outside_examples_reported(self):
        def ecrire(pages):
            exemples = pages / "software" / "arduino" / "exemples"
            exemples.mkdir(parents=True)
            (exemples / "vl53l1x.md").write_text(page(), encoding="utf-8")
            autre = pages / "software" / "arduino" / "capteurs.md"
            autre.write_text(page(ident="VL53L1X/Inconnu"), encoding="utf-8")

        code, _, erreurs = self.lancer(ecrire)
        self.assertEqual(code, 1)
        self.assertIn("capteurs.md", erreurs)
        self.assertIn("VL53L1X/Inconnu", erreurs)

    def test_other_files_ignored(self):
        def ecrire(pages):
            (pages / "vl53l1x.md").write_text(page(), encoding="utf-8")
            (pages / "notes.txt").write_text(page(ident="VL53L1X/Inconnu"), encoding="utf-8")
            (pages / "dossier.md").mkdir()

        code, sortie, erreurs = self.lancer(ecrire)
        self.assertEqual(code, 0, erreurs)
        self.assertIn("1 page(s)", sortie)


class TestVersion(unittest.TestCase):
    def test_same_version_ok(self):
        self.assertIsNone(module.verifier_version("v0.37.0", "v0.37.0"))

    def test_stale_index(self):
        erreur = module.verifier_version("v0.36.2", "v0.37.0")
        self.assertIn("index des exemples périmé", erreur)
        self.assertIn("relancer npm run prebuild", erreur)
        self.assertIn("v0.36.2", erreur)
        self.assertIn("v0.37.0", erreur)

    def test_main_stops_on_stale_index(self):
        with tempfile.TemporaryDirectory() as dossier:
            dossier = Path(dossier)
            index = dossier / "index.json"
            index.write_text(
                json.dumps({"version": "v0.36.2", "exemples": [{"id": ID}]}), encoding="utf-8"
            )
            epingle = dossier / "exemples-arduino.json"
            epingle.write_text(json.dumps({"version": "v0.37.0"}), encoding="utf-8")
            pages = dossier / "pages"
            pages.mkdir()
            (pages / "vl53l1x.md").write_text(page(), encoding="utf-8")
            args = ["--index", str(index), "--pages", str(pages), "--epingle", str(epingle)]
            args += ["--attente", str(dossier / "absente.txt")]
            sortie = io.StringIO()
            with contextlib.redirect_stderr(sortie):
                self.assertEqual(module.main(args), 1)
            self.assertIn("relancer npm run prebuild", sortie.getvalue())

            epingle.write_text(json.dumps({"version": "v0.36.2"}), encoding="utf-8")
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(module.main(args), 0)


if __name__ == "__main__":
    unittest.main()
