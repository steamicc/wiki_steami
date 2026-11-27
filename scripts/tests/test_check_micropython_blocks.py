import contextlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]


def charger(nom, fichier):
    spec = importlib.util.spec_from_file_location(nom, SCRIPTS / fichier)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


check = charger("check_micropython_blocks", "check-micropython-blocks.py")
validate = charger("validate_code_examples", "validate-code-examples.py")

LIB = ".external/micropython-steami-lib/lib"
PAGE = Path("docs/software/essai.md")
DESTRUCTIFS = ["steami_config/examples/calibrate_*.py", "daplink_flash/examples/erase_flash.py"]


def bloc(meta, code=""):
    return f"Texte.\n\n```python {meta}\n{code}```\n"


class Racine:
    """Petite copie de la bibliothèque dans un dossier temporaire."""

    def __enter__(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.racine = Path(self._tmp.name)
        self.ecrire(f"{LIB}/hts221/.not-frozen", "Not frozen.\n")
        self.ecrire(f"{LIB}/hts221/hts221/__init__.py", "")
        self.ecrire(f"{LIB}/hts221/examples/humidity.py", "from hts221 import HTS221\n")
        self.ecrire(f"{LIB}/gc9a01/.not-frozen", "Not frozen.\n")
        self.ecrire(f"{LIB}/ism330dl/ism330dl/__init__.py", "")
        self.ecrire(f"{LIB}/ism330dl/examples/basic_read.py", "from ism330dl import ISM330DL\n")
        self.ecrire(f"{LIB}/wsen-pads/wsen_pads/__init__.py", "")
        self.ecrire(
            f"{LIB}/wsen-pads/examples/station_env.py",
            "from wsen_pads import WSEN_PADS\nfrom hts221 import (\n    HTS221,\n)\n",
        )
        self.ecrire(f"{LIB}/steami_config/steami_config/__init__.py", "")
        self.ecrire(
            f"{LIB}/steami_config/examples/calibrate_magnetometer.py",
            "from steami_config import SteamiConfig\n",
        )
        self.ecrire(
            f"{LIB}/steami_config/examples/calibrate_temperature.py",
            "from hts221 import HTS221\n",
        )
        self.ecrire(".external/samples/pins.py", "LED = 1\n")
        return self

    def __exit__(self, *exc):
        self._tmp.cleanup()

    def ecrire(self, relatif, contenu):
        chemin = self.racine / relatif
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_text(contenu, encoding="utf-8")

    def verifier(self, texte):
        non_geles = check.modules_non_geles(self.racine / LIB)
        return check.verifier({PAGE: texte}, self.racine, non_geles, DESTRUCTIFS)


class TestVerifier(unittest.TestCase):
    def test_bloc_valide(self):
        with Racine() as r:
            self.assertEqual(r.verifier(bloc("run", "print(1)\n")), [])

    def test_syntaxe_invalide_signalee(self):
        with Racine() as r:
            erreurs = r.verifier(bloc("run", "print(1\n"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("essai.md:3", erreurs[0])
            self.assertIn("syntaxe", erreurs[0])

    def test_bloc_sans_marque_ignore(self):
        with Racine() as r:
            self.assertEqual(r.verifier(bloc("", "print(1\n")), [])

    def test_norun_ignore(self):
        with Racine() as r:
            self.assertEqual(r.verifier(bloc("run norun", "print(1\n")), [])

    def test_fichier_annexe_absent_signale(self):
        with Racine() as r:
            erreurs = r.verifier(bloc("run files=.external/samples/pins.py,.external/samples/mesh.py", "x = 1\n"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn(".external/samples/mesh.py", erreurs[0])

    def test_fichier_annexe_hors_external_signale(self):
        with Racine() as r:
            for chemin in ("docs/x.py", "/etc/passwd", ".external/../x.py"):
                erreurs = r.verifier(bloc(f"run files={chemin}", "x = 1\n"))
                self.assertEqual(len(erreurs), 1, chemin)

    def test_fichiers_annexes_de_meme_nom_signales(self):
        with Racine() as r:
            r.ecrire(".external/autre/pins.py", "")
            erreurs = r.verifier(bloc("run files=.external/samples/pins.py,.external/autre/pins.py", "x = 1\n"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("pins.py", erreurs[0])

    def test_exemple_destructif_sans_confirm_signale(self):
        with Racine() as r:
            erreurs = r.verifier(bloc(f"file={LIB}/steami_config/examples/calibrate_magnetometer.py"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("confirm", erreurs[0])
            self.assertIn("calibrate_magnetometer.py", erreurs[0])

    def test_exemple_destructif_avec_confirm_ok(self):
        with Racine() as r:
            meta = f'file={LIB}/steami_config/examples/calibrate_magnetometer.py confirm="Écrit la calibration"'
            self.assertEqual(r.verifier(bloc(meta)), [])

    def test_exemple_destructif_sans_bouton_ok(self):
        with Racine() as r:
            meta = f"file={LIB}/steami_config/examples/calibrate_magnetometer.py norun"
            self.assertEqual(r.verifier(bloc(meta)), [])
            # Sans bouton (hts221 non gelé) : pas de confirm demandé.
            self.assertEqual(r.verifier(bloc(f"file={LIB}/steami_config/examples/calibrate_temperature.py")), [])

    def test_exemple_non_gele_sans_bouton_ok(self):
        with Racine() as r:
            for exemple in ("hts221/examples/humidity.py", "wsen-pads/examples/station_env.py"):
                self.assertEqual(r.verifier(bloc(f"file={LIB}/{exemple}")), [], exemple)

    def test_import_non_gele_dans_un_bloc_run_signale(self):
        with Racine() as r:
            erreurs = r.verifier(bloc(f"run file={LIB}/hts221/examples/humidity.py"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("hts221", erreurs[0])
            erreurs = r.verifier(bloc("run", "import gc9a01.device\n"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("gc9a01", erreurs[0])

    def test_exemple_gele_ok(self):
        with Racine() as r:
            self.assertEqual(r.verifier(bloc(f"file={LIB}/ism330dl/examples/basic_read.py")), [])

    def test_fichier_inclus_absent_signale(self):
        with Racine() as r:
            erreurs = r.verifier(bloc(f"file={LIB}/ism330dl/examples/absent.py"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("absent.py", erreurs[0])

    def test_modules_non_geles(self):
        with Racine() as r:
            self.assertEqual(check.modules_non_geles(r.racine / LIB), {"hts221", "gc9a01"})


class TestDestructifs(unittest.TestCase):
    """Détection des exemples qui écrivent ou effacent un stockage persistant de la carte."""

    ENTETE = (
        "from machine import I2C\n"
        "from daplink_bridge import DaplinkBridge\n"
        "from daplink_flash import DaplinkFlash\n"
        "from steami_config import SteamiConfig\n"
        "from steami import Steami\n"
        "i2c = I2C(1)\n"
        "bridge = DaplinkBridge(i2c)\n"
        "flash = DaplinkFlash(bridge)\n"
        "config = SteamiConfig(bridge)\n"
    )

    def detecter(self, code):
        import ast

        return check.operations_persistantes(ast.parse(self.ENTETE + code))

    def test_ecritures_detectees(self):
        cas = {
            'flash.set_filename("A", "CSV")\nflash.write("x")\n': "flash.write",
            'flash.write_line("x")\n': "flash.write_line",
            "flash.clear_flash()\n": "flash.clear_flash",
            'DaplinkFlash(bridge).write("x")\n': "DaplinkFlash(bridge).write",
            "bridge.clear_config()\n": "bridge.clear_config",
            'bridge.write_config(b"x")\n': "bridge.write_config",
            'config.set_temperature_calibration("x", gain=1.0)\nconfig.save()\n': "config.save",
            # Steami.config() : méthode qui rend la SteamiConfig de la carte (v0.29.0).
            "Steami().config().save()\n": "Steami().config().save",
            "cfg = Steami().config()\ncfg.save()\n": "cfg.save",
            "board = Steami()\ncfg = board.config()\ncfg.save()\n": "cfg.save",
            # config_zone.py : fonctions locales qui parlent au DAPLink en I2C brut.
            "def clear_config():\n    i2c.writeto(0x3B, bytearray([0x32]))\nclear_config()\n": "clear_config",
        }
        for code, appel in cas.items():
            operations = self.detecter(code)
            self.assertTrue(operations, code)
            self.assertIn(f"{appel}()", operations[0], code)

    def test_lectures_non_detectees(self):
        code = (
            "config.load()\n"
            'print(config.board_name, config.get_temperature_calibration("hts221"))\n'
            'config.set_boot_count(3)  # en RAM seulement, sans save()\n'
            "print(bridge.read_config(), bridge.device_id())\n"
            "print(flash.get_filename(), flash.read(), flash.read_sector(0))\n"
            "from machine import UART\n"
            'UART(1).write(b"x")\n'
            "screen.save()\n"
        )
        self.assertEqual(self.detecter(code), [])

    def test_exemple_detecte_sans_confirm_signale(self):
        with Racine() as r:
            r.ecrire(f"{LIB}/daplink_flash/daplink_flash/__init__.py", "")
            r.ecrire(
                f"{LIB}/daplink_flash/examples/logger.py",
                "from daplink_flash import DaplinkFlash\nflash = DaplinkFlash(None)\nflash.write_line('x')\n",
            )
            erreurs = r.verifier(bloc(f"file={LIB}/daplink_flash/examples/logger.py"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("flash.write_line()", erreurs[0])
            self.assertIn("confirm", erreurs[0])
            meta = f'file={LIB}/daplink_flash/examples/logger.py confirm="Efface la flash externe"'
            self.assertEqual(r.verifier(bloc(meta)), [])

    def test_ligne_de_liste_sans_exemple_signalee(self):
        with Racine() as r:
            erreurs = check.destructifs_sans_exemple(["daplink_flash/examples/disparu.py"], r.racine / LIB)
            self.assertEqual(erreurs, ["daplink_flash/examples/disparu.py"])
            self.assertEqual(
                check.destructifs_sans_exemple(["steami_config/examples/calibrate_*.py"], r.racine / LIB), []
            )


CLONE = SCRIPTS.parent / LIB
ATTENDUS_V0_29_0 = {
    "bme280/examples/weather_station.py",
    "daplink_flash/examples/config_zone.py",
    "daplink_flash/examples/erase_flash.py",
    "daplink_flash/examples/sensor_log.py",
    "daplink_flash/examples/write_csv.py",
    "lis2mdl/examples/field_logger.py",
    "steami_config/examples/boot_counter.py",
    "steami_config/examples/calibrate_accelerometer.py",
    "steami_config/examples/calibrate_magnetometer.py",
    "steami_config/examples/calibrate_temperature.py",
    "steami_config/examples/populate_demo_config.py",
    "wsen-hids/examples/data_logger.py",
    "wsen-pads/examples/weather_station.py",
}


@unittest.skipUnless((CLONE / "steami_config").is_dir(), "bibliothèque non clonée (npm run prebuild)")
class TestDestructifsDuClone(unittest.TestCase):
    """Au tag épinglé : la détection trouve tous les exemples destructifs connus, et la liste est d'accord."""

    def test_detection_sur_le_clone(self):
        self.assertEqual(set(check.exemples_destructifs_detectes(CLONE)), ATTENDUS_V0_29_0)

    def test_liste_d_accord_avec_la_detection(self):
        motifs = check.lire_destructifs(check.DESTRUCTIFS_DEFAUT)
        listes = {
            str(f.relative_to(CLONE))
            for motif in motifs
            for f in CLONE.glob(motif)
        }
        self.assertEqual(listes, ATTENDUS_V0_29_0)


class TestBlocsExecutablesHorsBibliotheque(unittest.TestCase):
    """Tout bloc exécutable qui modifie la carte durablement demande confirm, quelle que soit son origine."""

    def test_bloc_run_destructif_sans_confirm_signale(self):
        with Racine() as r:
            code = "from daplink_flash import DaplinkFlash\nflash = DaplinkFlash(None)\nflash.clear_flash()\n"
            erreurs = r.verifier(bloc("run", code))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("flash.clear_flash()", erreurs[0])
            self.assertIn("confirm", erreurs[0])
            self.assertEqual(r.verifier(bloc('run confirm="Efface la flash externe"', code)), [])

    def test_bloc_file_hors_lib_destructif_sans_confirm_signale(self):
        with Racine() as r:
            r.ecrire(
                ".external/samples/logger.py",
                "from steami import Steami\nSteami().config().save()\n",
            )
            erreurs = r.verifier(bloc("run file=.external/samples/logger.py"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("save()", erreurs[0])

    def test_bloc_non_executable_destructif_ignore(self):
        with Racine() as r:
            self.assertEqual(r.verifier(bloc("", "flash.clear_flash()\n")), [])


class TestMemesBlocsQueLePlugin(unittest.TestCase):
    """Le CI voit les blocs que le plugin munit d'un bouton, où qu'ils soient dans la page."""

    def test_bloc_dans_une_citation(self):
        with Racine() as r:
            erreurs = r.verifier("Texte.\n\n> ```python run\n> print(1\n> ```\n")
            self.assertEqual(len(erreurs), 1)
            self.assertIn("essai.md:3", erreurs[0])

    def test_meta_separe_par_une_tabulation(self):
        with Racine() as r:
            erreurs = r.verifier("Texte.\n\n```python\trun\nprint(1\n```\n")
            self.assertEqual(len(erreurs), 1)

    def test_bloc_sur_la_ligne_d_un_element_de_liste(self):
        with Racine() as r:
            erreurs = r.verifier("Texte.\n\n1. ```python run\n   print(1\n   ```\n")
            self.assertEqual(len(erreurs), 1)

    def test_bloc_dans_une_liste_indentee(self):
        with Racine() as r:
            erreurs = r.verifier("1. Lancer :\n\n   ```python run\n   print(1\n   ```\n")
            self.assertEqual(len(erreurs), 1)
            self.assertIn("essai.md:3", erreurs[0])

    def test_bloc_cite_dans_un_autre_bloc_ignore(self):
        with Racine() as r:
            self.assertEqual(r.verifier("````md\n```python run\nprint(1\n```\n````\n"), [])

    def test_page_refusee_par_le_plugin_signalee(self):
        with Racine() as r:
            erreurs = r.verifier(bloc("run files=docs/x.py", "x = 1\n"))
            self.assertEqual(len(erreurs), 1)
            self.assertIn("docs/x.py", erreurs[0])

    def test_exemple_destructif_dans_une_citation(self):
        with Racine() as r:
            meta = f"file={LIB}/steami_config/examples/calibrate_magnetometer.py"
            erreurs = r.verifier(f"Texte.\n\n> ```python {meta}\n>\n> ```\n")
            self.assertEqual(len(erreurs), 1)
            self.assertIn("confirm", erreurs[0])
            meta += ' confirm="Écrit la calibration"'
            self.assertEqual(r.verifier(f"Texte.\n\n> ```python {meta}\n>\n> ```\n"), [])


class TestMain(unittest.TestCase):
    def test_bibliotheque_absente(self):
        with tempfile.TemporaryDirectory() as tmp:
            sortie = io.StringIO()
            with contextlib.redirect_stdout(sortie), contextlib.redirect_stderr(sortie):
                code = check.main(["--racine", tmp])
            self.assertEqual(code, 1)
            self.assertIn("npm run prebuild", sortie.getvalue())


class TestValidateCodeExamples(unittest.TestCase):
    def test_bloc_python_run_reconnu(self):
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "page.md"
            page.write_text(
                "```python run\nprint(1)\n```\n\n"
                '```python title="essai.py"\nprint(2)\n```\n\n'
                "```python file=.external/x.py\n\n```\n",
                encoding="utf-8",
            )
            blocs = validate.extract_python_blocks(page)
            self.assertEqual([code for code, _ in blocs], ["print(1)", "print(2)"])
            self.assertEqual([ligne for _, ligne in blocs], [1, 5])


if __name__ == "__main__":
    unittest.main()
