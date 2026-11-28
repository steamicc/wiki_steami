"""Contrôles de l'étape de fermeture des PR dépassées de suivre-micropython.yml."""

import unittest
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows" / "suivre-micropython.yml"


def flux():
    return yaml.safe_load(FLUX.read_text(encoding="utf-8"))


def code():
    """Scripts (run), conditions (if) et paramètres (env) des étapes, sans les
    commentaires : une garde ne compte que si elle est exécutée."""
    job = flux()["jobs"]["suivre"]
    morceaux = []
    for etape in job["steps"]:
        morceaux.append(str(etape.get("if", "")))
        morceaux.append(str(etape.get("env", "")))
        for ligne in etape.get("run", "").splitlines():
            if not ligne.lstrip().startswith("#"):
                morceaux.append(ligne)
    return "\n".join(morceaux)


class TestSuivreMicropython(unittest.TestCase):
    def test_pr_depassees_fermees_par_le_robot_seulement(self):
        c = code()
        self.assertIn("Superseded by #", c)
        self.assertIn("gh pr close", c)
        self.assertIn("--delete-branch", c)
        self.assertIn('startswith("chore/micropython-")', c)
        self.assertIn(".headRefName != $branche", c)
        self.assertIn("(.isCrossRepository | not)", c)
        self.assertIn('.author.login == $a1 or .author.login == $a2', c)
        self.assertIn("app/$APP_SLUG", c)
        self.assertNotIn("--author", c)

    def test_pr_depassees_fermees_aussi_si_la_version_est_deja_epinglee(self):
        c = code()
        self.assertIn("is already pinned.", c)
        self.assertIn("a_jour=true", c)
        self.assertIn("steps.comparaison.outputs.a_jour == 'true'", c)

    def test_branche_exposee_pour_une_pr_deja_ouverte(self):
        self.assertGreaterEqual(code().count('echo "branche=$branche"'), 2)


if __name__ == "__main__":
    unittest.main()
