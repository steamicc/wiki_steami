"""Garde commune de fusion automatique (.github/scripts/garde-fusion-auto.sh)
et son appel par les robots du wiki.

Le script est copié à l'identique dans chaque dépôt steamicc qui a un robot :
son empreinte doit rester celle de la source commune. Pour le changer, modifier
la source commune, la recopier dans chaque dépôt, puis mettre à jour REFERENCE."""

import hashlib
import json
import os
import shutil
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows"
GARDE = RACINE / ".github" / "scripts" / "garde-fusion-auto.sh"
FAUX_GH = Path(__file__).resolve().parent / "faux_gh.py"
REFERENCE = "661489204d121fe3a25dbeb533fab7123f77001dda9f138bc6a157506b983324"
ROBOT = "semantic-release-updater"
JETON = "actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0"
FUSION = "Active la fusion automatique"

# workflow -> (job, dépôt de la PR, appel attendu, condition de l'étape, dépôts du jeton)
ROBOTS = {
    "suivre-micropython.yml": (
        "suivre", "steamicc/wiki_steami",
        'bash .github/scripts/garde-fusion-auto.sh "$GITHUB_REPOSITORY" "$PR" "$APP_SLUG" build',
        "steps.comparaison.outputs.nouvelle == 'true'", "wiki_steami",
    ),
    "suivre-daplink.yml": (
        "suivre", "steamicc/wiki_steami",
        'bash .github/scripts/garde-fusion-auto.sh "$GITHUB_REPOSITORY" "$PR" "$APP_SLUG" build',
        "steps.comparaison.outputs.nouvelle == 'true'", "wiki_steami",
    ),
    "suivre-exemples-arduino.yml": (
        "suivre", "steamicc/wiki_steami",
        'bash .github/scripts/garde-fusion-auto.sh "$GITHUB_REPOSITORY" "$PR" "$APP_SLUG" build',
        "steps.comparaison.outputs.nouvelle == 'true'", "wiki_steami",
    ),
    "suivre-croquis-sample.yml": (
        "suivre", "steamicc/wiki_steami",
        'bash .github/scripts/garde-fusion-auto.sh "$GITHUB_REPOSITORY" "$PR" "$APP_SLUG" build',
        "steps.comparaison.outputs.nouvelle == 'true'", "wiki_steami",
    ),
    # Ce robot ouvre sa PR dans le dépôt sample : la garde lit les règles de ce dépôt.
    "croquis-vers-sample.yml": (
        "croquis", "steamicc/arduino-steami-sample",
        'bash .github/scripts/garde-fusion-auto.sh steamicc/arduino-steami-sample "$PR" "$APP_SLUG" compile',
        "${{ !inputs.essai && (steps.preparation.outputs.pousser == 'true' || steps.pr.outputs.pr != '') }}",
        "arduino-steami-sample",
    ),
}
# Robots lancés aussi par la release de leur dépôt amont.
AMONT = {
    "suivre-micropython.yml": "steamicc/micropython-steami-lib",
    "suivre-exemples-arduino.yml": "steamicc/arduino-steami-lib",
    "suivre-croquis-sample.yml": "steamicc/arduino-steami-sample",
    "suivre-daplink.yml": "dépôt DAPLink",
}


def flux(nom):
    return yaml.safe_load((FLUX / nom).read_text(encoding="utf-8"))


def etapes(nom):
    job = ROBOTS[nom][0]
    return flux(nom)["jobs"][job]["steps"]


def etape(nom, titre):
    (e,) = [e for e in etapes(nom) if e.get("name") == titre]
    return e


def code(nom):
    """Scripts (run) des étapes, sans les lignes de commentaire."""
    lignes = []
    for e in etapes(nom):
        lignes += [l for l in e.get("run", "").splitlines() if not l.lstrip().startswith("#")]
    return "\n".join(lignes)


class TestCopieDeLaGarde(unittest.TestCase):
    def test_empreinte_de_la_source_commune(self):
        empreinte = hashlib.sha256(GARDE.read_bytes()).hexdigest()
        self.assertEqual(
            empreinte, REFERENCE,
            "garde-fusion-auto.sh a été modifié dans ce dépôt : modifier la source commune, "
            "la recopier à l'identique dans chaque dépôt, puis mettre à jour REFERENCE.",
        )

    def test_executable(self):
        self.assertEqual(stat.S_IMODE(GARDE.stat().st_mode), 0o755)
        suivi = subprocess.run(["git", "ls-files", "-s", str(GARDE)], cwd=RACINE,
                               capture_output=True, text=True, check=False).stdout
        if suivi:
            self.assertTrue(suivi.startswith("100755 "), suivi)


class TestAppelDesRobots(unittest.TestCase):
    def test_chaque_robot_appelle_la_garde(self):
        for nom, (_, _, appel, condition, _) in ROBOTS.items():
            with self.subTest(nom):
                e = etape(nom, FUSION)
                self.assertEqual(e["run"].strip(), appel)
                self.assertEqual(e["if"], condition)
                self.assertEqual(e["env"]["GH_TOKEN"], "${{ steps.app.outputs.token }}")
                self.assertEqual(e["env"]["APP_SLUG"], "${{ steps.app.outputs.app-slug }}")
                self.assertIn("PR", e["env"])

    def test_plus_de_garde_en_ligne(self):
        for nom in ROBOTS:
            with self.subTest(nom):
                c = code(nom)
                self.assertNotIn("--auto --squash", c)
                self.assertNotIn("current_user_can_bypass", c)
                self.assertNotIn("rules/branches/main", c)
                self.assertEqual(c.count("garde-fusion-auto.sh"), 1)

    def test_jeton_de_l_app_sous_la_forme_commune(self):
        for nom, (_, _, _, _, depots) in ROBOTS.items():
            with self.subTest(nom):
                texte = (FLUX / nom).read_text(encoding="utf-8")
                self.assertNotIn("app-id:", texte.replace("client-id:", ""))
                (app,) = [e for e in etapes(nom) if "create-github-app-token" in e.get("uses", "")]
                self.assertIn(f"uses: {JETON}", texte)
                self.assertEqual(app["with"]["client-id"], "${{ secrets.RELEASE_APP_ID }}")
                self.assertEqual(app["with"]["private-key"], "${{ secrets.RELEASE_APP_SECRET }}")
                self.assertEqual(app["with"]["owner"], "${{ github.repository_owner }}")
                self.assertEqual(app["with"]["repositories"], depots)
                # La garde relance une fois un check exigé rouge (gh run rerun).
                self.assertEqual(app["with"]["permission-actions"], "write")
                self.assertEqual(app["with"]["permission-contents"], "write")
                self.assertEqual(app["with"]["permission-pull-requests"], "write")

    def test_en_tete_cite_le_lancement_par_l_amont(self):
        for nom, amont in AMONT.items():
            with self.subTest(nom):
                tete = (FLUX / nom).read_text(encoding="utf-8").split("\nname:")[0]
                plat = " ".join(l.lstrip("# ").strip() for l in tete.splitlines())
                self.assertIn("Une fois par jour, à la demande et après chaque release", plat)
                self.assertIn("(déclenché par ", plat)
                self.assertIn(amont, plat.split("(déclenché par ", 1)[1].split(")", 1)[0])


def executable(chemin, contenu):
    chemin.write_text(contenu, encoding="utf-8")
    chemin.chmod(chemin.stat().st_mode | stat.S_IEXEC)


class TestGardeExecutee(unittest.TestCase):
    """L'étape de chaque robot, exécutée avec un faux gh."""

    def lancer(self, nom, etat_pr, check_runs=None, jobs=None):
        _, depot, _, _, _ = ROBOTS[nom]
        contexte = "compile" if depot.endswith("sample") else "build"
        d = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, d, True)
        (d / "bin").mkdir()
        executable(d / "bin" / "gh", f'#!/bin/sh\nexec python3 "{FAUX_GH}" "$@"\n')
        travail = d / "travail"
        (travail / ".github" / "scripts").mkdir(parents=True)
        shutil.copy2(GARDE, travail / ".github" / "scripts" / GARDE.name)
        etat = {
            "prs": [{"number": 20, "state": "OPEN", "headRefName": "x", "isCrossRepository": False,
                     "author": {"login": f"app/{ROBOT}"}, "isDraft": False, "labels": [],
                     "autoMergeRequest": None, "headRefOid": "a" * 40, **etat_pr}],
            "depot": {"default_branch": "main"},
            "regles": [{"type": "required_status_checks", "ruleset_source_type": "Repository",
                        "ruleset_id": 7,
                        "parameters": {"required_status_checks": [{"context": contexte}]}}],
            "rulesets": {"7": {"current_user_can_bypass": "never"}},
            "check_runs": check_runs or [],
            "jobs": jobs or {},
        }
        (d / "etat.json").write_text(json.dumps(etat), encoding="utf-8")
        env = {
            "PATH": f"{d / 'bin'}:{os.environ['PATH']}",
            "HOME": str(d),
            "FAUX_GH": str(d / "etat.json"),
            "FAUX_GH_LOG": str(d / "journal.jsonl"),
            "GITHUB_REPOSITORY": "steamicc/wiki_steami",
            "GH_TOKEN": "jeton",
            "APP_SLUG": ROBOT,
            "PR": "20",
        }
        res = subprocess.run(["bash", "-e", "-c", etape(nom, FUSION)["run"]], cwd=travail, env=env,
                             capture_output=True, text=True)
        journal = d / "journal.jsonl"
        appels = [json.loads(l) for l in journal.read_text(encoding="utf-8").splitlines()] \
            if journal.exists() else []
        return res, appels, depot

    def test_fusion_auto_activee_sur_le_bon_depot(self):
        for nom in ROBOTS:
            with self.subTest(nom):
                res, appels, depot = self.lancer(nom, {})
                self.assertEqual(res.returncode, 0, res.stdout + res.stderr)
                self.assertIn(["pr", "merge", "20", "-R", depot, "--auto", "--squash"], appels)
                self.assertIn(["api", f"repos/{depot}/rules/branches/main?per_page=100"], appels)

    def test_brouillon_laisse_aux_humains(self):
        for nom in ROBOTS:
            with self.subTest(nom):
                res, appels, _ = self.lancer(nom, {"isDraft": True})
                self.assertEqual(res.returncode, 0, res.stdout + res.stderr)
                self.assertFalse(any(a[:2] == ["pr", "merge"] for a in appels))

    def test_check_rouge_relance_une_fois(self):
        for nom in ROBOTS:
            with self.subTest(nom):
                _, depot, _, _, _ = ROBOTS[nom]
                contexte = "compile" if depot.endswith("sample") else "build"
                res, appels, depot = self.lancer(
                    nom, {"autoMergeRequest": {"mergeMethod": "SQUASH"}},
                    check_runs=[{"id": 5, "name": contexte, "status": "completed",
                                 "conclusion": "failure"}],
                    jobs={"5": {"run_id": 77, "run_attempt": 1}},
                )
                self.assertEqual(res.returncode, 0, res.stdout + res.stderr)
                self.assertIn(["run", "rerun", "77", "--failed", "-R", depot], appels)
                self.assertIn("::warning::", res.stdout)

    def test_auteur_etranger_fait_echouer_le_robot(self):
        for nom in ROBOTS:
            with self.subTest(nom):
                res, appels, _ = self.lancer(nom, {"author": {"login": "nedseb"}})
                self.assertEqual(res.returncode, 1)
                self.assertIn("::error::", res.stdout)
                self.assertFalse(any(a[:2] == ["pr", "merge"] for a in appels))


if __name__ == "__main__":
    unittest.main()
