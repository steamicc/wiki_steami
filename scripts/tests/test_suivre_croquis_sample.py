"""Contrôles du workflow suivre-croquis-sample.yml (jumeau de suivre-exemples-arduino.yml)."""

import re
import shutil
import subprocess
import unittest
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows" / "suivre-croquis-sample.yml"
JUMEAU = RACINE / ".github" / "workflows" / "suivre-exemples-arduino.yml"
NOMS_BRANCHE = RACINE / ".validate-branch-namerc.js"


def texte():
    return FLUX.read_text(encoding="utf-8")


def flux():
    return yaml.safe_load(texte())


def code():
    """Scripts (run), conditions (if) et paramètres (with) des étapes, sans les
    commentaires YAML ni les lignes de commentaire shell : une garde ne compte
    que si elle est exécutée, pas si elle est seulement citée dans un commentaire."""
    job = flux()["jobs"]["suivre"]
    morceaux = [str(job.get("if", ""))]
    for etape in job["steps"]:
        morceaux.append(str(etape.get("if", "")))
        morceaux.append(str(etape.get("with", "")))
        for ligne in etape.get("run", "").splitlines():
            if not ligne.lstrip().startswith("#"):
                morceaux.append(ligne)
    return "\n".join(morceaux)


def regle_de_branche():
    """Motif de .validate-branch-namerc.js, lu par node (None sans node)."""
    node = shutil.which("node")
    if node is None:
        return None
    sortie = subprocess.run(
        [node, "-e", "process.stdout.write(require(process.argv[1]).pattern)", str(NOMS_BRANCHE)],
        capture_output=True, text=True, check=True,
    ).stdout
    return re.compile(sortie)


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
        regle = regle_de_branche()
        if regle is None:
            self.skipTest("node absent : règle de .validate-branch-namerc.js non lue")
        self.assertTrue(regle.match("chore/croquis-sample-v1-2-3"))
        self.assertFalse(regle.match("chore/croquis-sample-v1.2.3"))

    def test_titres_et_commit_en_francais_conventionnel(self):
        t = texte()
        self.assertIn("chore(configs): croquis du sample $DERNIERE", t)
        self.assertNotIn("exemples Arduino $DERNIERE", t)

    def test_les_gardes_en_commentaire_ne_comptent_pas(self):
        # code() ignore les commentaires : la garde doit y figurer hors commentaire.
        self.assertNotIn("# Garde-fou", code())
        self.assertIn("isCrossRepository", code())

    def test_conversion_des_croquis_avant_le_commit(self):
        # Ancien point d'extension de la tâche 9, rempli par la tâche 14
        # (détails dans test_croquis_en_ligne.TestFluxConversion).
        t = code()
        conversion = t.index("python3 scripts/convertir-croquis.py")
        self.assertLess(conversion, t.index("git commit -m"))
        self.assertGreater(conversion, t.index("> exemples-arduino-sample.json"))

    def test_memes_controles_que_le_jumeau(self):
        t = code()
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
