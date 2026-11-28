"""PR du robot de suivre-exemples-arduino.yml et de suivre-croquis-sample.yml :
fermeture des PR dépassées et reconstruction d'une PR en conflit avec main.

Les étapes sont exécutées pour de vrai (bash), avec un faux `gh`
(faux_gh.py) qui simule les PR du dépôt et note chaque appel."""

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
FAUX_GH = Path(__file__).resolve().parent / "faux_gh.py"
ROBOT = "semantic-release-updater"

# workflow -> (préfixe des branches, fichier d'épinglage)
WORKFLOWS = {
    "suivre-exemples-arduino.yml": ("chore/exemples-arduino-", "exemples-arduino.json"),
    "suivre-croquis-sample.yml": ("chore/croquis-sample-", "exemples-arduino-sample.json"),
}
FERMETURE = "Ferme les PR des releases dépassées"
FERMETURE_A_JOUR = "Ferme les PR des releases dépassées (release déjà épinglée)"
RECONSTRUCTION = "Signale la reconstruction de la branche"


def etapes(nom):
    return yaml.safe_load((FLUX / nom).read_text(encoding="utf-8"))["jobs"]["suivre"]["steps"]


def etape(nom, titre):
    for e in etapes(nom):
        if e.get("name") == titre:
            return e
    raise AssertionError(f"{nom} : étape « {titre} » introuvable")


def code(nom):
    """Scripts (run) et conditions (if), sans les lignes de commentaire."""
    morceaux = []
    for e in etapes(nom):
        morceaux.append(str(e.get("if", "")))
        for ligne in e.get("run", "").splitlines():
            if not ligne.lstrip().startswith("#"):
                morceaux.append(ligne)
    return "\n".join(morceaux)


def executable(chemin, contenu):
    chemin.write_text(contenu, encoding="utf-8")
    chemin.chmod(chemin.stat().st_mode | stat.S_IEXEC)


def pr(numero, branche, auteur=f"app/{ROBOT}", etat="OPEN", fork=False, mergeable="MERGEABLE",
       commits=None, brouillon=False, fusion_auto=True):
    if commits is None:
        commits = [f"{ROBOT}[bot]"]
    return {
        "number": numero,
        "state": etat,
        "headRefName": branche,
        "isCrossRepository": fork,
        "author": {"login": auteur},
        "mergeable": mergeable,
        "headRefOid": f"tete{numero}",
        "isDraft": brouillon,
        "autoMergeRequest": {"mergeMethod": "SQUASH"} if fusion_auto else None,
        "commits": [{"sha": f"c{numero}{i}", "author": {"login": a} if a else None}
                    for i, a in enumerate(commits)],
    }


class Bac:
    """Répertoire de travail, faux gh/sleep/curl et exécution d'une étape."""

    def __init__(self, test):
        self.dir = Path(tempfile.mkdtemp())
        test.addCleanup(shutil.rmtree, self.dir, True)
        self.bin = self.dir / "bin"
        self.bin.mkdir()
        self.travail = self.dir / "travail"
        self.travail.mkdir()
        executable(self.bin / "gh", f'#!/bin/sh\nexec python3 "{FAUX_GH}" "$@"\n')
        executable(self.bin / "sleep", "#!/bin/sh\nexit 0\n")
        # curl -fL ... -o <fichier> <url> : écrit un contenu fixe.
        executable(self.bin / "curl", '#!/bin/sh\nwhile [ "$1" != "-o" ]; do shift; done\n'
                                      'printf archive > "$2"\n')
        self.etat = self.dir / "etat.json"
        self.journal = self.dir / "journal.jsonl"
        self.sortie = self.dir / "sortie.txt"

    def lancer(self, script, env, etat):
        self.etat.write_text(json.dumps(etat), encoding="utf-8")
        self.sortie.write_text("", encoding="utf-8")
        if self.journal.exists():
            self.journal.unlink()
        vide = self.dir / "gitconfig"
        vide.write_text("", encoding="utf-8")
        tout = {
            "PATH": f"{self.bin}:{os.environ['PATH']}",
            "HOME": str(self.dir),
            "GIT_CONFIG_GLOBAL": str(vide),
            "GIT_CONFIG_NOSYSTEM": "1",
            "FAUX_GH": str(self.etat),
            "FAUX_GH_LOG": str(self.journal),
            "GITHUB_OUTPUT": str(self.sortie),
            "GITHUB_REPOSITORY": "steamicc/wiki_steami",
            "RUNNER_TEMP": str(self.dir),
            "GH_TOKEN": "jeton",
            "APP_SLUG": ROBOT,
        }
        tout.update(env)
        res = subprocess.run(["bash", "-e", "-c", script], cwd=self.travail, env=tout,
                             capture_output=True, text=True)
        sorties = {}
        for ligne in self.sortie.read_text(encoding="utf-8").splitlines():
            if "=" in ligne:
                cle, valeur = ligne.split("=", 1)
                sorties[cle] = valeur
        appels = []
        if self.journal.exists():
            appels = [json.loads(l) for l in self.journal.read_text(encoding="utf-8").splitlines()]
        return res, sorties, appels


def release(tag):
    archive = f"steami-exemples-{tag}.zip"
    return {"tag_name": tag, "assets": [{"name": archive, "digest": "sha256:abc"}]}


class TestComparaison(unittest.TestCase):
    """Étape « Compare la dernière release à la version épinglée » : PR déjà ouverte."""

    def comparer(self, nom, prs, epinglee="v0.1.0", derniere="v0.3.0"):
        prefixe, fichier = WORKFLOWS[nom]
        bac = Bac(self)
        (bac.travail / fichier).write_text(json.dumps({"version": epinglee, "sha256": "x"}),
                                           encoding="utf-8")
        script = etape(nom, "Compare la dernière release à la version épinglée")["run"]
        return bac.lancer(script, {}, {"release": release(derniere), "prs": prs})

    def test_pr_du_robot_en_conflit_reconstruite_depuis_main(self):
        for nom, (prefixe, _) in WORKFLOWS.items():
            with self.subTest(nom):
                branche = f"{prefixe}v0-3-0"
                res, s, _ = self.comparer(nom, [pr(20, branche, mergeable=["UNKNOWN", "CONFLICTING"])])
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertEqual(s.get("nouvelle"), "true")
                self.assertEqual(s.get("pousser"), "true")
                self.assertEqual(s.get("ouvrir"), "false")
                self.assertEqual(s.get("reconstruire"), "true")
                self.assertEqual(s.get("tete"), "tete20")
                self.assertEqual(s.get("pr"), "20")
                self.assertEqual(s.get("branche"), branche)
                self.assertEqual(s.get("derniere"), "v0.3.0")
                self.assertEqual(s.get("actuel"), "v0.1.0")
                self.assertEqual(s.get("archive"), "steami-exemples-v0.3.0.zip")
                self.assertEqual(s.get("empreinte"), "sha256:abc")
                self.assertIn("::warning::", res.stdout)

    def test_pr_en_conflit_avec_un_commit_humain_laissee_aux_humains(self):
        for nom, (prefixe, _) in WORKFLOWS.items():
            for etranger in ("nedseb", None):
                with self.subTest(nom, auteur=etranger):
                    branche = f"{prefixe}v0-3-0"
                    res, s, _ = self.comparer(nom, [pr(20, branche, mergeable="CONFLICTING",
                                                       commits=[f"{ROBOT}[bot]", etranger])])
                    self.assertEqual(res.returncode, 0, res.stderr)
                    self.assertEqual(s.get("pousser"), "false")
                    self.assertNotEqual(s.get("reconstruire"), "true")
                    self.assertEqual(s.get("pr"), "20")
                    self.assertEqual(s.get("branche"), branche)
                    self.assertIn("::warning::", res.stdout)
                    self.assertIn("à la main", res.stdout)

    def test_pr_sans_conflit_reprise_telle_quelle(self):
        for nom, (prefixe, _) in WORKFLOWS.items():
            with self.subTest(nom):
                branche = f"{prefixe}v0-3-0"
                res, s, appels = self.comparer(nom, [pr(20, branche)])
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertEqual(s.get("pousser"), "false")
                self.assertEqual(s.get("ouvrir"), "false")
                self.assertEqual(s.get("pr"), "20")
                self.assertEqual(s.get("branche"), branche)
                self.assertNotEqual(s.get("reconstruire"), "true")
                self.assertFalse(any(a[0] == "api" and a[1].endswith("/commits") for a in appels))

    def test_release_deja_epinglee_signalee(self):
        for nom in WORKFLOWS:
            with self.subTest(nom):
                res, s, _ = self.comparer(nom, [], epinglee="v0.3.0", derniere="v0.3.0")
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertEqual(s.get("nouvelle"), "false")
                self.assertEqual(s.get("a_jour"), "true")
                self.assertEqual(s.get("epinglee"), "v0.3.0")


class TestFermeture(unittest.TestCase):
    """Fermeture des PR dépassées : App, même dépôt, préfixe, pas la branche courante."""

    def prs(self, prefixe, autre):
        return [
            pr(10, f"{prefixe}v0-2-0"),                                   # fermée, branche supprimée
            pr(11, f"{prefixe}v0-3-0"),                                   # la PR courante
            pr(12, f"{prefixe}v0-1-9", auteur="nedseb"),                  # humaine
            pr(13, f"{prefixe}v0-1-8", fork=True),                        # fork
            pr(14, f"{autre}v9-9-9"),                                     # autre robot
            pr(15, f"{prefixe}v0-1-7", etat="CLOSED"),                    # déjà fermée
            pr(16, f"{prefixe}v0-1-6", auteur=f"{ROBOT}[bot]",
               commits=[f"{ROBOT}[bot]", "nedseb"]),                      # commit humain
        ]

    def fermetures(self, appels):
        return [a for a in appels if a[:2] == ["pr", "close"]]

    def test_ferme_les_pr_depassees_du_robot_seulement(self):
        for nom, (prefixe, _) in WORKFLOWS.items():
            autre = "chore/daplink-"
            with self.subTest(nom):
                bac = Bac(self)
                script = etape(nom, FERMETURE)["run"]
                res, _, appels = bac.lancer(script, {"PR": "11", "BRANCHE": f"{prefixe}v0-3-0"},
                                            {"prs": self.prs(prefixe, autre)})
                self.assertEqual(res.returncode, 0, res.stderr)
                f = self.fermetures(appels)
                self.assertEqual([a[2] for a in f], ["10", "16"])
                self.assertEqual(f[0], ["pr", "close", "10", "--delete-branch",
                                        "--comment", "Superseded by #11."])
                # Commits ajoutés à la main : la branche est gardée.
                self.assertNotIn("--delete-branch", f[1])
                self.assertTrue(f[1][f[1].index("--comment") + 1].startswith("Superseded by #11."))
                self.assertIn("::warning::", res.stdout)
                self.assertFalse(any("--author" in a for a in appels))

    def test_ferme_tout_si_la_release_est_deja_epinglee(self):
        for nom, (prefixe, _) in WORKFLOWS.items():
            with self.subTest(nom):
                bac = Bac(self)
                script = etape(nom, FERMETURE_A_JOUR)["run"]
                res, _, appels = bac.lancer(script, {"EPINGLEE": "v0.3.0"},
                                            {"prs": self.prs(prefixe, "chore/daplink-")})
                self.assertEqual(res.returncode, 0, res.stderr)
                f = self.fermetures(appels)
                self.assertEqual([a[2] for a in f], ["10", "11", "16"])
                self.assertEqual(f[0], ["pr", "close", "10", "--delete-branch", "--comment",
                                        "Superseded: v0.3.0 is already pinned."])
                self.assertNotIn("--delete-branch", f[2])

    def test_conditions_des_etapes(self):
        for nom in WORKFLOWS:
            with self.subTest(nom):
                self.assertEqual(etape(nom, FERMETURE)["if"], "steps.comparaison.outputs.nouvelle == 'true'")
                self.assertEqual(etape(nom, FERMETURE_A_JOUR)["if"],
                                 "steps.comparaison.outputs.a_jour == 'true'")
                env = etape(nom, FERMETURE)["env"]
                self.assertEqual(env["PR"], "${{ steps.ouverture.outputs.pr || steps.comparaison.outputs.pr }}")
                self.assertEqual(env["BRANCHE"], "${{ steps.comparaison.outputs.branche }}")

    def test_avant_la_fusion_automatique(self):
        for nom in WORKFLOWS:
            with self.subTest(nom):
                titres = [e.get("name") for e in etapes(nom)]
                fusion = titres.index("Active la fusion automatique")
                self.assertLess(titres.index(FERMETURE), fusion)
                self.assertLess(titres.index(RECONSTRUCTION), fusion)


class TestReconstruction(unittest.TestCase):
    """Branche d'une PR en conflit reconstruite depuis main, poussée avec un bail."""

    def git(self, *args, cwd):
        env = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1",
               "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t",
               "GIT_COMMITTER_EMAIL": "t@t"}
        return subprocess.run(["git", *args], cwd=cwd, env=env, capture_output=True, text=True,
                              check=True).stdout.strip()

    def depot(self, bac, fichier, branche):
        """origin : main en conflit avec la branche du robot ; travail : clone de main."""
        origine = bac.dir / "origine.git"
        self.git("init", "-q", "--bare", "-b", "main", str(origine), cwd=bac.dir)
        graine = bac.dir / "graine"
        self.git("clone", "-q", str(origine), str(graine), cwd=bac.dir)
        (graine / fichier).write_text('{"version": "v0.1.0"}\n', encoding="utf-8")
        self.git("add", ".", cwd=graine)
        self.git("commit", "-qm", "base", cwd=graine)
        self.git("push", "-q", "origin", "HEAD:main", cwd=graine)
        self.git("switch", "-qc", branche, cwd=graine)
        (graine / fichier).write_text('{"version": "v0.3.0"}\n', encoding="utf-8")
        self.git("commit", "-qam", "robot", cwd=graine)
        self.git("push", "-q", "origin", branche, cwd=graine)
        self.git("switch", "-q", "main", cwd=graine)
        (graine / fichier).write_text('{"version": "v0.2.0"}\n', encoding="utf-8")
        self.git("commit", "-qam", "autre epinglage", cwd=graine)
        self.git("push", "-q", "origin", "main", cwd=graine)
        shutil.rmtree(bac.travail)
        self.git("clone", "-q", str(origine), str(bac.travail), cwd=bac.dir)
        return origine, self.git("rev-parse", f"origin/{branche}", cwd=bac.travail)

    def pousser(self, tete):
        nom = "suivre-exemples-arduino.yml"
        prefixe, fichier = WORKFLOWS[nom]
        branche = f"{prefixe}v0-3-0"
        bac = Bac(self)
        origine, ancienne = self.depot(bac, fichier, branche)
        script = etape(nom, "Crée la branche et épingle la nouvelle archive")["run"]
        env = {"DERNIERE": "v0.3.0", "ARCHIVE": "steami-exemples-v0.3.0.zip", "EMPREINTE": "",
               "BRANCHE": branche, "RECONSTRUIRE": "true", "TETE": tete or ancienne}
        res, _, _ = bac.lancer(script, env, {"prs": []})
        return res, origine, branche, ancienne

    def test_branche_reconstruite_sur_main(self):
        res, origine, branche, ancienne = self.pousser(None)
        self.assertEqual(res.returncode, 0, res.stderr)
        nouvelle = self.git("rev-parse", branche, cwd=origine)
        self.assertNotEqual(nouvelle, ancienne)
        self.assertEqual(self.git("rev-parse", f"{branche}^", cwd=origine),
                         self.git("rev-parse", "main", cwd=origine))
        self.assertIn('"version": "v0.3.0"', self.git("show", f"{branche}:exemples-arduino.json",
                                                      cwd=origine))

    def test_bail_refuse_une_branche_modifiee_entre_temps(self):
        res, origine, branche, ancienne = self.pousser("0" * 40)
        self.assertNotEqual(res.returncode, 0)
        self.assertEqual(self.git("rev-parse", branche, cwd=origine), ancienne)

    def test_meme_poussee_dans_les_deux_workflows(self):
        for nom in WORKFLOWS:
            with self.subTest(nom):
                c = code(nom)
                self.assertIn('git push --force-with-lease="refs/heads/$BRANCHE:$TETE" origin "$BRANCHE"', c)
                self.assertIn('git push origin "$BRANCHE"', c)
                titre = [e["name"] for e in etapes(nom) if e.get("name", "").startswith("Crée la branche")][0]
                env = etape(nom, titre)["env"]
                self.assertEqual(env["RECONSTRUIRE"], "${{ steps.comparaison.outputs.reconstruire }}")
                self.assertEqual(env["TETE"], "${{ steps.comparaison.outputs.tete }}")

    def signaler(self, nom, env, prs):
        bac = Bac(self)
        return bac.lancer(etape(nom, RECONSTRUCTION)["run"], env, {"prs": prs})

    def test_reconstruction_signalee_sur_la_pr(self):
        for nom, (prefixe, _) in WORKFLOWS.items():
            with self.subTest(nom):
                self.assertEqual(etape(nom, RECONSTRUCTION)["if"],
                                 "steps.comparaison.outputs.reconstruire == 'true'")
                res, _, appels = self.signaler(nom, {"PR": "20", "DIFFERENTS": ""},
                                               [pr(20, f"{prefixe}v0-3-0")])
                self.assertEqual(res.returncode, 0, res.stderr)
                commentaires = [a for a in appels if a[:2] == ["pr", "comment"]]
                self.assertEqual(len(commentaires), 1)
                self.assertEqual(commentaires[0][2], "20")
                self.assertFalse(any(a[:2] in (["pr", "ready"], ["pr", "merge"]) for a in appels))

    def test_croquis_differents_apres_reconstruction_pr_en_brouillon(self):
        nom = "suivre-croquis-sample.yml"
        prefixe, _ = WORKFLOWS[nom]
        env = etape(nom, RECONSTRUCTION)["env"]
        self.assertEqual(env["DIFFERENTS"], "${{ steps.epinglage.outputs.differents }}")
        res, _, appels = self.signaler(nom, {"PR": "20", "DIFFERENTS": "G/N H/M"},
                                       [pr(20, f"{prefixe}v0-3-0")])
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn(["pr", "merge", "20", "--disable-auto"], appels)
        self.assertIn(["pr", "ready", "20", "--undo"], appels)
        commentaire = next(a for a in appels if a[:2] == ["pr", "comment"])
        corps = commentaire[commentaire.index("--body") + 1]
        self.assertIn("`G/N`", corps)
        self.assertIn("`H/M`", corps)
        self.assertLess(appels.index(["pr", "merge", "20", "--disable-auto"]),
                        appels.index(["pr", "ready", "20", "--undo"]))


if __name__ == "__main__":
    unittest.main()
