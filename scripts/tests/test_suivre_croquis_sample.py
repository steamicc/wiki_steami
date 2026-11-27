"""Contrôles du workflow suivre-croquis-sample.yml (jumeau de suivre-exemples-arduino.yml)."""

import re
import unittest
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows" / "suivre-croquis-sample.yml"
JUMEAU = RACINE / ".github" / "workflows" / "suivre-exemples-arduino.yml"
BRANCHE_OK = re.compile(r"^(chore|feat|fix|docs|ci|refactor)\/([a-z0-9]+-)*[a-z0-9]+$")


def texte():
    return FLUX.read_text(encoding="utf-8")


def flux():
    return yaml.safe_load(texte())


class TestSuivreCroquisSample(unittest.TestCase):
    def test_le_workflow_existe_et_est_du_yaml_valide(self):
        self.assertTrue(FLUX.is_file())
        self.assertEqual(flux()["name"], "suivre-croquis-sample")

    def test_cible_le_depot_sample_et_son_fichier_d_epinglage(self):
        t = texte()
        self.assertIn("repos/steamicc/arduino-steami-sample/releases/latest", t)
        self.assertIn("releases/download/$DERNIERE/$ARCHIVE", t)
        self.assertIn("steamicc/arduino-steami-sample/releases/download", t)
        self.assertIn("exemples-arduino-sample.json", t)
        # Aucune trace du paquet ni du fichier d'épinglage du jumeau.
        self.assertNotIn("steamicc/arduino-steami/", t)
        self.assertIsNone(re.search(r"exemples-arduino\.json", t))

    def test_branche_conforme_a_la_regle_du_depot(self):
        t = texte()
        self.assertIn('branche="chore/croquis-sample-${derniere//./-}"', t)
        self.assertTrue(BRANCHE_OK.match("chore/croquis-sample-v1-2-3"))

    def test_titres_et_commit_en_francais_conventionnel(self):
        t = texte()
        self.assertIn("chore(configs): croquis du sample $DERNIERE", t)
        self.assertNotIn("exemples Arduino $DERNIERE", t)

    def test_point_d_extension_avant_le_commit(self):
        t = texte()
        marque = "point d'extension : conversion des croquis en ligne (tâche 14)"
        self.assertIn(marque, t)
        self.assertLess(t.index(marque), t.index("git commit -m"))
        self.assertGreater(t.index(marque), t.index("> exemples-arduino-sample.json"))

    def test_memes_controles_que_le_jumeau(self):
        t = texte()
        for garde in (
            "isCrossRepository",
            "sha256:$sha",
            'git push origin "$BRANCHE"',
            'gh pr merge "$PR" --auto --squash',
            "required_status_checks",
            "github.repository == 'steamicc/wiki_steami'",
            "RELEASE_APP_SECRET",
        ):
            with self.subTest(garde=garde):
                self.assertIn(garde, t)

    def test_concurrence_distincte_de_celle_du_jumeau(self):
        f = flux()
        j = yaml.safe_load(JUMEAU.read_text(encoding="utf-8"))
        self.assertNotEqual(f["concurrency"]["group"], j["concurrency"]["group"])
        # PyYAML lit « on » comme True.
        self.assertIn("workflow_dispatch", f[True])
        self.assertIn("schedule", f[True])

    def test_le_corps_de_pr_renvoie_a_la_verification_des_exemples(self):
        t = texte()
        self.assertIn("La vérification \\`lint:arduino-examples\\` (build.yml) nomme chaque nouveau croquis", t)
        self.assertIn("scripts/exemples-arduino-sample-a-documenter.txt", t)
        self.assertIn('<EssayerExemple id="G/N" source="sample" />', t)
        self.assertIn("file=.external/arduino-steami-sample/examples/G/N/N.ino", t)
        self.assertNotIn("si le build échoue, il nomme les croquis en cause", t)


if __name__ == "__main__":
    unittest.main()
