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


def SANS_SAMPLE(dossier):
    """Arguments qui coupent la source sample (index et épinglage absents)."""
    return [
        "--index-sample", str(dossier / "sample-absent.json"),
        "--epingle-sample", str(dossier / "sample-epingle-absent.json"),
        "--attente-sample", str(dossier / "sample-absente.txt"),
    ]


SID = "CAPTEURS/Distance"
FICHIER = ".external/arduino-steami-sample/examples/CAPTEURS/Distance/Distance.ino"


def bloc(chemin=FICHIER, indent=""):
    return f"{indent}```cpp file={chemin}\n{indent}```\n"


def page_sample(titre="## Distance", ident=SID, chemin=FICHIER):
    return f'{titre}\n\nTexte.\n\n{bloc(chemin)}\n<EssayerExemple id="{ident}" source="sample" />\n'


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
            args += SANS_SAMPLE(dossier)
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
            args += SANS_SAMPLE(dossier)
            sortie = io.StringIO()
            with contextlib.redirect_stderr(sortie):
                self.assertEqual(module.main(args), 1)
            self.assertIn("relancer npm run prebuild", sortie.getvalue())

            epingle.write_text(json.dumps({"version": "v0.36.2"}), encoding="utf-8")
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(module.main(args), 0)


class TestSourceBibliothequeInchangee(unittest.TestCase):
    """Les balises source="sample" ne comptent pas pour la bibliothèque."""

    def test_sample_tag_ignored_by_library(self):
        texte = page() + "\n" + page_sample()
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_sample_tag_does_not_document_library_id(self):
        texte = page_sample(ident=ID, chemin=FICHIER)
        erreurs = verifier({ID}, {PAGE: texte}, [])
        self.assertTrue(any(ID in e and "ni documenté" in e for e in erreurs))

    def test_explicit_library_source_counts(self):
        texte = page().replace("/>", 'source="bibliotheque" />')
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])

    def test_library_messages_unchanged(self):
        texte = page(titre="## GestureDetection") + "\n" + page_sample()
        self.assertEqual(
            verifier({ID}, {PAGE: texte}, []),
            verifier({ID}, {PAGE: page(titre="## GestureDetection")}, []),
        )


class TestSample(unittest.TestCase):
    verifier_sample = staticmethod(lambda *a: module.verifier_sample(*a))

    def test_documented_ok(self):
        self.assertEqual(self.verifier_sample({SID}, {PAGE: page_sample()}, []), [])

    def test_no_title_rule(self):
        # (c) : section sans ancre, plusieurs croquis dans la même section.
        autre = ".external/arduino-steami-sample/examples/CAPTEURS/Boussole/Boussole.ino"
        texte = (
            "## Capteurs du guide\n\n"
            + bloc()
            + f'\n<EssayerExemple id="{SID}" source="sample" />\n\n'
            + bloc(autre)
            + '\n<EssayerExemple id="CAPTEURS/Boussole" source="sample" />\n'
        )
        ids = {SID, "CAPTEURS/Boussole"}
        self.assertEqual(self.verifier_sample(ids, {PAGE: texte}, []), [])

    def test_unknown_id(self):
        texte = page_sample(ident="CAPTEURS/Inconnu")
        erreurs = self.verifier_sample({SID}, {PAGE: texte}, [SID])
        self.assertTrue(any("CAPTEURS/Inconnu" in e and "arduino-steami-sample" in e for e in erreurs))

    def test_undocumented_not_waiting(self):
        # (a)
        erreurs = self.verifier_sample({SID, "ECRAN/EcranBonjour"}, {PAGE: page_sample()}, [])
        self.assertTrue(any("ECRAN/EcranBonjour" in e for e in erreurs))

    def test_waiting_ok(self):
        ids = {SID, "ECRAN/EcranBonjour"}
        self.assertEqual(self.verifier_sample(ids, {PAGE: page_sample()}, ["ECRAN/EcranBonjour"]), [])

    def test_documented_still_waiting(self):
        erreurs = self.verifier_sample({SID}, {PAGE: page_sample()}, [SID])
        self.assertTrue(any(SID in e and "retirer" in e for e in erreurs))

    def test_waiting_unknown_id(self):
        erreurs = self.verifier_sample({SID}, {PAGE: page_sample()}, ["Z/Fantome"])
        self.assertTrue(any("Z/Fantome" in e for e in erreurs))

    def test_library_tag_does_not_document_sample_id(self):
        texte = page(ident=SID)
        erreurs = self.verifier_sample({SID}, {PAGE: texte}, [])
        self.assertTrue(any(SID in e and "ni utilisé" in e for e in erreurs))

    def test_missing_file_block(self):
        # (b)
        texte = f'## Distance\n\nTexte.\n\n<EssayerExemple id="{SID}" source="sample" />\n'
        erreurs = self.verifier_sample({SID}, {PAGE: texte}, [])
        self.assertTrue(any(SID in e and FICHIER in e for e in erreurs), erreurs)

    def test_file_block_of_other_sketch(self):
        autre = ".external/arduino-steami-sample/examples/CAPTEURS/Boussole/Boussole.ino"
        erreurs = self.verifier_sample({SID}, {PAGE: page_sample(chemin=autre)}, [])
        self.assertTrue(any(SID in e and FICHIER in e and autre in e for e in erreurs), erreurs)

    def test_file_block_in_previous_section(self):
        texte = "## Avant\n\n" + bloc() + f'\n## Distance\n\n<EssayerExemple id="{SID}" source="sample" />\n'
        erreurs = self.verifier_sample({SID}, {PAGE: texte}, [])
        self.assertTrue(any(SID in e and FICHIER in e for e in erreurs), erreurs)

    def test_file_block_after_tag(self):
        texte = f'## Distance\n\n<EssayerExemple id="{SID}" source="sample" />\n\n' + bloc()
        erreurs = self.verifier_sample({SID}, {PAGE: texte}, [])
        self.assertTrue(any(SID in e and FICHIER in e for e in erreurs), erreurs)

    def test_library_file_block_not_counted(self):
        lib = ".external/arduino-steami-lib/examples/CAPTEURS/Distance/Distance.ino"
        erreurs = self.verifier_sample({SID}, {PAGE: page_sample(chemin=lib)}, [])
        self.assertTrue(any(SID in e and FICHIER in e for e in erreurs), erreurs)

    def test_subheading_keeps_file_block(self):
        texte = "## Distance\n\n" + bloc() + f'\n### Essai\n\n<EssayerExemple id="{SID}" source="sample" />\n'
        self.assertEqual(self.verifier_sample({SID}, {PAGE: texte}, []), [])

    def test_output_block_between_ok(self):
        texte = (
            "## Distance\n\n" + bloc() + "\nSortie :\n\n```text\n123 mm\n```\n\n"
            f'<EssayerExemple id="{SID}" source="sample" />\n'
        )
        self.assertEqual(self.verifier_sample({SID}, {PAGE: texte}, []), [])

    def test_release_tabs(self):
        v1c = ".external/arduino-steami-sample/examples/ECRAN/EcranDriverGc9a01/EcranDriverGc9a01.ino"
        v1b = ".external/arduino-steami-sample/examples/ECRAN/EcranDriverSsd1327/EcranDriverSsd1327.ino"
        texte = (
            "## Écran\n\n<Release>\n  <TabItem value=\"v1c\">\n\n"
            + bloc(v1c, indent="  ")
            + '\n  <EssayerExemple id="ECRAN/EcranDriverGc9a01" source="sample" />\n\n'
            "  </TabItem>\n  <TabItem value=\"v1b\">\n\n"
            + bloc(v1b, indent="  ")
            + "\n  <EssayerExemple id='ECRAN/EcranDriverSsd1327' source='sample' />\n\n"
            "  </TabItem>\n</Release>\n"
        )
        ids = {"ECRAN/EcranDriverGc9a01", "ECRAN/EcranDriverSsd1327"}
        self.assertEqual(self.verifier_sample(ids, {PAGE: texte}, []), [])

    def test_source_before_id(self):
        texte = page_sample().replace(f'id="{SID}" source="sample"', f'source="sample" id="{SID}"')
        self.assertEqual(self.verifier_sample({SID}, {PAGE: texte}, []), [])

    def test_tag_in_fence_ignored(self):
        texte = page_sample() + '\n```mdx\n<EssayerExemple id="CAPTEURS/Inconnu" source="sample" />\n```\n'
        self.assertEqual(self.verifier_sample({SID}, {PAGE: texte}, []), [])


class TestSourceInconnue(unittest.TestCase):
    def test_unknown_source_reported(self):
        texte = page().replace("/>", 'source="autre" />')
        erreurs = module.verifier_sources({PAGE: texte})
        self.assertTrue(any("autre" in e and ID in e for e in erreurs), erreurs)

    def test_known_sources_ok(self):
        texte = page() + "\n" + page_sample()
        self.assertEqual(module.verifier_sources({PAGE: texte}), [])


class TestMainSample(unittest.TestCase):
    """Source sample dans main() : index absent, règle 0, erreurs."""

    def lancer(self, texte, sample_ids=None, version="v1.0.0", epinglee=None, attente=None):
        with tempfile.TemporaryDirectory() as dossier:
            dossier = Path(dossier)
            index = dossier / "index.json"
            index.write_text(json.dumps({"version": "v1", "exemples": [{"id": ID}]}), encoding="utf-8")
            pages = dossier / "docs"
            pages.mkdir()
            (pages / "page.md").write_text(texte, encoding="utf-8")
            index_sample = dossier / "sample" / "index.json"
            if sample_ids is not None:
                index_sample.parent.mkdir()
                index_sample.write_text(
                    json.dumps({"version": version, "exemples": [{"id": i} for i in sample_ids]}),
                    encoding="utf-8",
                )
            epingle_sample = dossier / "exemples-arduino-sample.json"
            if epinglee is not None:
                epingle_sample.write_text(json.dumps({"version": epinglee}), encoding="utf-8")
            attente_sample = dossier / "attente-sample.txt"
            if attente is not None:
                attente_sample.write_text("".join(f"{i}\n" for i in attente), encoding="utf-8")
            args = ["--index", str(index), "--pages", str(pages)]
            args += ["--epingle", str(dossier / "absente.json")]
            args += ["--attente", str(dossier / "absente.txt")]
            args += ["--index-sample", str(index_sample), "--epingle-sample", str(epingle_sample)]
            args += ["--attente-sample", str(attente_sample)]
            sortie, erreurs = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(sortie), contextlib.redirect_stderr(erreurs):
                code = module.main(args)
            return code, sortie.getvalue(), erreurs.getvalue()

    def test_index_absent_skipped(self):
        code, sortie, erreurs = self.lancer(page())
        self.assertEqual(code, 0, erreurs)
        self.assertIn("arduino-steami-sample", sortie)
        self.assertIn("sautée", sortie)

    def test_index_absent_but_pinned(self):
        code, _, erreurs = self.lancer(page(), epinglee="v1.0.0")
        self.assertEqual(code, 1)
        self.assertIn("npm run prebuild", erreurs)

    def test_sample_ok(self):
        texte = page() + "\n" + page_sample()
        code, sortie, erreurs = self.lancer(
            texte, sample_ids=[SID, "BUZZER/Melodie"], epinglee="v1.0.0", attente=["BUZZER/Melodie"]
        )
        self.assertEqual(code, 0, erreurs)
        self.assertIn("2 croquis", sortie)
        self.assertIn("1 en attente", sortie)

    def test_stale_sample_index(self):
        # (d)
        code, _, erreurs = self.lancer(page(), sample_ids=[SID], version="v1.0.0", epinglee="v1.1.0")
        self.assertEqual(code, 1)
        self.assertIn("arduino-steami-sample", erreurs)
        self.assertIn("v1.0.0", erreurs)
        self.assertIn("v1.1.0", erreurs)
        self.assertIn("relancer npm run prebuild", erreurs)

    def test_sample_error_reported(self):
        code, _, erreurs = self.lancer(page(), sample_ids=[SID], epinglee="v1.0.0")
        self.assertEqual(code, 1)
        self.assertIn(SID, erreurs)

    def test_library_and_sample_errors_together(self):
        texte = page(ident="VL53L1X/Inconnu")
        code, _, erreurs = self.lancer(texte, sample_ids=[SID], epinglee="v1.0.0")
        self.assertEqual(code, 1)
        self.assertIn("VL53L1X/Inconnu", erreurs)
        self.assertIn(SID, erreurs)

    def test_unknown_source_fails(self):
        texte = page() + '\n<EssayerExemple id="X/Y" source="autre" />\n'
        code, _, erreurs = self.lancer(texte)
        self.assertEqual(code, 1)
        self.assertIn("autre", erreurs)


class TestListeAttenteSample(unittest.TestCase):
    """La liste d'attente réelle du sample : ids valides, groupes connus, sans doublon."""

    def test_real_list(self):
        chemin = SCRIPT.parent / "exemples-arduino-sample-a-documenter.txt"
        lignes = [l.strip() for l in chemin.read_text(encoding="utf-8").splitlines() if l.strip()]
        self.assertTrue(lignes)
        self.assertEqual(len(lignes), len(set(lignes)))
        groupes = {"CAPTEURS", "ECRAN", "PREMIERS", "CARTE", "BOUTONS", "BUZZER"}
        for ident in lignes:
            self.assertRegex(ident, r"^[A-Z0-9_-]+/[A-Za-z0-9_]+$")
            self.assertIn(ident.split("/")[0], groupes)


if __name__ == "__main__":
    unittest.main()
