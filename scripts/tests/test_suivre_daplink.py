"""Contrôles du workflow suivre-daplink.yml (jumeau de suivre-micropython.yml)."""

import re
import shutil
import subprocess
import unittest
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows" / "suivre-daplink.yml"
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


class TestSuivreDaplink(unittest.TestCase):
    def test_declencheurs_et_concurrence(self):
        f = flux()
        self.assertEqual(set(f[True]), {"schedule", "workflow_dispatch"})  # PyYAML lit « on » comme True
        self.assertEqual(f["concurrency"], {"group": "suivre-daplink", "cancel-in-progress": False})
        self.assertEqual(f["jobs"]["suivre"]["if"], "github.repository == 'steamicc/wiki_steami'")

    def test_jeton_de_l_app_sous_la_forme_commune(self):
        t = texte()
        self.assertIn(
            "actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0", t
        )
        self.assertIn("client-id: ${{ secrets.RELEASE_APP_ID }}", t)
        self.assertNotIn("app-id:", t.replace("client-id:", ""))

    def test_asset_et_digest_controles(self):
        c = code()
        self.assertIn("stm32f103xb_steami32_if_crc.bin", c)
        self.assertIn("sha256:", c)
        self.assertIn("sha256sum", c)
        # Digest GitHub obligatoire : vide -> erreur (le modèle le traitait en option).
        self.assertIn('[ -z "$empreinte" ]', c)
        self.assertIn('[ "$EMPREINTE" != "sha256:$sha" ]', c)

    def test_format_de_release_et_message_de_comparaison(self):
        c = code()
        self.assertIn(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+$", c)
        self.assertIn("Version épinglée : $actuel ; dernière release DAPLink : $derniere", c)

    def test_fusion_automatique_seulement_si_build_exige(self):
        c = code()
        self.assertIn('.context == "build"', c)
        self.assertIn("gh pr merge", c)

    def test_prs_identifiees_par_numero_et_auteur(self):
        c = code()
        self.assertNotIn("--author", c)
        self.assertIn("isCrossRepository", c)
        self.assertIn("app/$APP_SLUG", c)

    def test_pr_dépassées_fermees_par_le_robot_seulement(self):
        c = code()
        self.assertIn("Superseded by #", c)
        self.assertIn("gh pr close", c)
        self.assertIn('startswith("chore/daplink-")', c)
        self.assertIn('.headRefName != $branche', c)

    def test_branche_conforme(self):
        self.assertIn('chore/daplink-${derniere//./-}', code())
        motif = regle_de_branche()
        if motif is None:
            self.skipTest("node absent")
        self.assertRegex("chore/daplink-2026-11-25-3", motif)


if __name__ == "__main__":
    unittest.main()
