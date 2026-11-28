import contextlib
import importlib.util
import io
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).resolve().parents[1] / "check-file-sizes.py"
spec = importlib.util.spec_from_file_location("check_file_sizes", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

KO = module.KO
MO = module.MO


class TestLireTaille(unittest.TestCase):
    def test_unites(self):
        self.assertEqual(module.lire_taille("123"), 123)
        self.assertEqual(module.lire_taille("800K"), 800 * KO)
        self.assertEqual(module.lire_taille("2M"), 2 * MO)
        self.assertEqual(module.lire_taille("4.5m"), int(4.5 * MO))

    def test_illisible(self):
        with self.assertRaises(ValueError):
            module.lire_taille("2 Mo")


class TestLireExceptions(unittest.TestCase):
    def test_commentaires_et_lignes_vides(self):
        texte = "# titre\n\nstatic/a.png 3M  # 2,9 Mo\npackage-lock.json 2M\n"
        self.assertEqual(
            module.lire_exceptions(texte),
            {"static/a.png": 3 * MO, "package-lock.json": 2 * MO},
        )

    def test_ligne_invalide(self):
        with self.assertRaisesRegex(ValueError, "ligne 2"):
            module.lire_exceptions("a.png 1M\nb.png\n")

    def test_fichier_du_depot_lisible(self):
        texte = module.EXCEPTIONS_DEFAUT.read_text(encoding="utf-8")
        self.assertTrue(module.lire_exceptions(texte))


class TestClasser(unittest.TestCase):
    def test_petite_image(self):
        self.assertEqual(module.classer("img/a.png", 100 * KO, {}), (None, ""))

    def test_image_avertissement(self):
        niveau, _ = module.classer("img/a.PNG", 600 * KO, {})
        self.assertEqual(niveau, "warning")

    def test_image_erreur(self):
        niveau, message = module.classer("img/a.jpg", 3 * MO, {})
        self.assertEqual(niveau, "error")
        self.assertIn("2.00 Mo", message)

    def test_svg_compte_comme_image(self):
        self.assertEqual(module.classer("img/a.svg", 3 * MO, {})[0], "error")

    def test_pdf(self):
        self.assertEqual(module.classer("docs/a.pdf", 900 * KO, {})[0], None)
        self.assertEqual(module.classer("docs/a.pdf", 1500 * KO, {})[0], "warning")
        self.assertEqual(module.classer("docs/a.pdf", 3 * MO, {})[0], "error")

    def test_autre_fichier(self):
        self.assertEqual(module.classer("a.bin", 900 * KO, {})[0], None)
        self.assertEqual(module.classer("a.bin", 1500 * KO, {})[0], "error")

    def test_exception_sous_plafond(self):
        niveau, message = module.classer("img/a.png", 3 * MO, {"img/a.png": 4 * MO})
        self.assertEqual(niveau, "warning")
        self.assertIn("exception", message)

    def test_exception_sous_le_seuil_erreur(self):
        niveau, _ = module.classer("package-lock.json", 900 * KO, {"package-lock.json": 2 * MO})
        self.assertIsNone(niveau)

    def test_exception_depassee(self):
        niveau, message = module.classer("img/a.png", 5 * MO, {"img/a.png": 4 * MO})
        self.assertEqual(niveau, "error")
        self.assertIn("plafond", message)


def git(depot, *args):
    subprocess.run(
        [
            "git",
            "-c", "user.name=t",
            "-c", "user.email=t@example.invalid",
            "-c", "commit.gpgsign=false",
            "-c", "core.hooksPath=/dev/null",
            *args,
        ],
        cwd=depot,
        check=True,
        capture_output=True,
    )


class TestDepot(unittest.TestCase):
    """Lance main() sur un dépôt git temporaire."""

    def setUp(self):
        self.dossier = tempfile.TemporaryDirectory()
        self.depot = Path(self.dossier.name)
        git(self.depot, "init", "-q", "-b", "main")
        (self.depot / "ancien.png").write_bytes(b"\0" * (3 * MO))
        (self.depot / "petit.md").write_text("texte\n")
        git(self.depot, "add", ".")
        git(self.depot, "commit", "-q", "-m", "base")
        git(self.depot, "switch", "-q", "-c", "pr")
        self.exceptions = self.depot / "exceptions.txt"
        self.exceptions.write_text("")

    def tearDown(self):
        self.dossier.cleanup()

    def lancer(self, *args):
        sortie = io.StringIO()
        with mock.patch.object(module, "RACINE", self.depot), mock.patch.dict(
            "os.environ", {"GITHUB_ACTIONS": ""}
        ), contextlib.redirect_stdout(sortie):
            code = module.main([*args, "--exceptions", str(self.exceptions)])
        return code, sortie.getvalue()

    def commit(self, nom, taille):
        (self.depot / nom).write_bytes(b"\0" * taille)
        git(self.depot, "add", nom)
        git(self.depot, "commit", "-q", "-m", nom)

    def test_fichier_ancien_non_verifie(self):
        self.commit("nouveau.png", 10 * KO)
        code, sortie = self.lancer("--base", "main")
        self.assertEqual(code, 0)
        self.assertNotIn("ancien.png", sortie)

    def test_fichier_ajoute_trop_gros(self):
        self.commit("lourd.png", 3 * MO)
        code, sortie = self.lancer("--base", "main")
        self.assertEqual(code, 1)
        self.assertIn("ERREUR lourd.png", sortie)

    def test_fichier_modifie_trop_gros(self):
        self.commit("petit.md", 2 * MO)
        code, sortie = self.lancer("--base", "main")
        self.assertEqual(code, 1)
        self.assertIn("ERREUR petit.md", sortie)

    def test_fichier_supprime_ignore(self):
        git(self.depot, "rm", "-q", "ancien.png")
        git(self.depot, "commit", "-q", "-m", "suppression")
        code, _ = self.lancer("--base", "main")
        self.assertEqual(code, 0)

    def test_tout_le_depot_avec_exception(self):
        code, _ = self.lancer("--all")
        self.assertEqual(code, 1)
        self.exceptions.write_text("ancien.png 4M\ndisparu.png 1M\n")
        code, sortie = self.lancer("--all")
        self.assertEqual(code, 0)
        self.assertIn("AVERTISSEMENT ancien.png", sortie)
        self.assertIn("AVERTISSEMENT disparu.png", sortie)

    def test_annotations_github(self):
        self.commit("lourd.png", 3 * MO)
        sortie = io.StringIO()
        with mock.patch.object(module, "RACINE", self.depot), mock.patch.dict(
            "os.environ", {"GITHUB_ACTIONS": "true"}
        ), contextlib.redirect_stdout(sortie):
            module.main(["--base", "main", "--exceptions", str(self.exceptions)])
        self.assertIn("::error file=lourd.png::", sortie.getvalue())

    def test_reference_inconnue(self):
        code, _ = self.lancer("--base", "inconnue")
        self.assertEqual(code, 2)


if __name__ == "__main__":
    unittest.main()
