"""PR des robots suivre-exemples-arduino.yml, suivre-croquis-sample.yml,
suivre-micropython.yml et suivre-daplink.yml : fermeture des PR dépassées,
reconstruction d'une PR en conflit avec main, et, pour les exemples Arduino,
liste d'attente complétée et version de la page PlatformIO réécrite.

Les étapes sont exécutées pour de vrai (bash), avec un faux `gh`
(faux_gh.py) qui simule les PR du dépôt et note chaque appel."""

import hashlib
import json
import os
import shutil
import stat
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows"
FAUX_GH = Path(__file__).resolve().parent / "faux_gh.py"
ROBOT = "semantic-release-updater"
# Contenu écrit par le faux curl quand aucun fichier n'est fourni.
TELECHARGE = b"archive"

# Ce qui change d'un robot à l'autre.
ROBOTS = {
    "suivre-exemples-arduino.yml": {
        "prefixe": "chore/exemples-arduino-",
        "fichier": "exemples-arduino.json",
        "cle": "version",
        "epinglee": "v0.1.0",
        "derniere": "v0.3.0",
        "suffixe": "v0-3-0",
        "asset": "steami-exemples-v0.3.0.zip",
        "sortie_asset": "archive",
        "epinglage": "Crée la branche et épingle la nouvelle archive",
        "fermeture": "Ferme les PR des releases dépassées",
        "fermeture_a_jour": "Ferme les PR des releases dépassées (release déjà épinglée)",
    },
    "suivre-croquis-sample.yml": {
        "prefixe": "chore/croquis-sample-",
        "fichier": "exemples-arduino-sample.json",
        "cle": "version",
        "epinglee": "v0.1.0",
        "derniere": "v0.3.0",
        "suffixe": "v0-3-0",
        "asset": "steami-exemples-v0.3.0.zip",
        "sortie_asset": "archive",
        "epinglage": "Crée la branche et épingle la nouvelle archive",
        "fermeture": "Ferme les PR des releases dépassées",
        "fermeture_a_jour": "Ferme les PR des releases dépassées (release déjà épinglée)",
    },
    "suivre-micropython.yml": {
        "prefixe": "chore/micropython-",
        "fichier": "micropython.json",
        "cle": "version",
        "epinglee": "v0.1.0",
        "derniere": "v0.3.0",
        "suffixe": "v0-3-0",
        "asset": "steami-micropython-firmware-v0.3.0.bin",
        "sortie_asset": "binaire",
        "epinglage": "Crée la branche et épingle le nouveau firmware",
        "fermeture": "Ferme les PR des versions dépassées",
        "fermeture_a_jour": "Ferme les PR des versions dépassées (version déjà épinglée)",
    },
    "suivre-daplink.yml": {
        "prefixe": "chore/daplink-",
        "fichier": "daplink.json",
        "cle": "release",
        "epinglee": "2026-11-01.1",
        "derniere": "2026-11-25.3",
        "suffixe": "2026-11-25-3",
        "asset": "stm32f103xb_steami32_if_crc.bin",
        "sortie_asset": "binaire",
        "epinglage": "Crée la branche et épingle le nouveau firmware",
        "fermeture": "Ferme les PR des releases dépassées",
        "fermeture_a_jour": None,
    },
}
# Le robot du sample clone arduino-steami-sample pendant l'épinglage (réseau) :
# son étape d'épinglage n'est pas exécutée ici (voir test_croquis_en_ligne).
SANS_RESEAU = [n for n in ROBOTS if n != "suivre-croquis-sample.yml"]
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
        # curl -fL ... -o <fichier> <url> : copie $FAUX_TELECHARGEMENT s'il est
        # donné, sinon écrit un contenu fixe.
        executable(self.bin / "curl", '#!/bin/sh\nwhile [ "$1" != "-o" ]; do shift; done\n'
                                      'if [ -n "$FAUX_TELECHARGEMENT" ]; then\n'
                                      '  cp "$FAUX_TELECHARGEMENT" "$2"\n'
                                      'else\n'
                                      '  printf archive > "$2"\n'
                                      'fi\n')
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


def release(robot):
    return {"tag_name": robot["derniere"], "assets": [{"name": robot["asset"], "digest": "sha256:abc"}]}


class TestComparaison(unittest.TestCase):
    """Étape « Compare la dernière release à la version épinglée » : PR déjà ouverte."""

    def comparer(self, nom, prs, epinglee=None, derniere=None):
        robot = dict(ROBOTS[nom])
        robot["epinglee"] = epinglee or robot["epinglee"]
        robot["derniere"] = derniere or robot["derniere"]
        bac = Bac(self)
        (bac.travail / robot["fichier"]).write_text(
            json.dumps({robot["cle"]: robot["epinglee"], "sha256": "x"}), encoding="utf-8")
        script = etape(nom, "Compare la dernière release à la version épinglée")["run"]
        return bac.lancer(script, {}, {"release": release(robot), "prs": prs})

    def test_pr_du_robot_en_conflit_reconstruite_depuis_main(self):
        for nom, robot in ROBOTS.items():
            with self.subTest(nom):
                branche = robot["prefixe"] + robot["suffixe"]
                res, s, _ = self.comparer(nom, [pr(20, branche, mergeable=["UNKNOWN", "CONFLICTING"])])
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertEqual(s.get("nouvelle"), "true")
                self.assertEqual(s.get("pousser"), "true")
                self.assertEqual(s.get("ouvrir"), "false")
                self.assertEqual(s.get("reconstruire"), "true")
                self.assertEqual(s.get("tete"), "tete20")
                self.assertEqual(s.get("pr"), "20")
                self.assertEqual(s.get("branche"), branche)
                self.assertEqual(s.get("derniere"), robot["derniere"])
                self.assertEqual(s.get("actuel"), robot["epinglee"])
                self.assertEqual(s.get(robot["sortie_asset"]), robot["asset"])
                self.assertEqual(s.get("empreinte"), "sha256:abc")
                self.assertIn("::warning::", res.stdout)

    def test_pr_en_conflit_avec_un_commit_humain_laissee_aux_humains(self):
        for nom, robot in ROBOTS.items():
            for etranger in ("nedseb", None):
                with self.subTest(nom, auteur=etranger):
                    branche = robot["prefixe"] + robot["suffixe"]
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
        for nom, robot in ROBOTS.items():
            with self.subTest(nom):
                branche = robot["prefixe"] + robot["suffixe"]
                res, s, appels = self.comparer(nom, [pr(20, branche)])
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertEqual(s.get("pousser"), "false")
                self.assertEqual(s.get("ouvrir"), "false")
                self.assertEqual(s.get("pr"), "20")
                self.assertEqual(s.get("branche"), branche)
                self.assertNotEqual(s.get("reconstruire"), "true")
                self.assertFalse(any(a[0] == "api" and a[1].endswith("/commits") for a in appels))

    def test_release_deja_epinglee_signalee(self):
        for nom, robot in ROBOTS.items():
            if robot["fermeture_a_jour"] is None:
                continue
            with self.subTest(nom):
                res, s, _ = self.comparer(nom, [], epinglee=robot["derniere"])
                self.assertEqual(res.returncode, 0, res.stderr)
                self.assertEqual(s.get("nouvelle"), "false")
                self.assertEqual(s.get("a_jour"), "true")
                self.assertEqual(s.get("epinglee"), robot["derniere"])


class TestFermeture(unittest.TestCase):
    """Fermeture des PR dépassées : App, même dépôt, préfixe, pas la branche courante ;
    branche gardée si elle porte un commit ajouté à la main."""

    def prs(self, prefixe):
        return [
            pr(10, f"{prefixe}v0-2-0"),                                   # fermée, branche supprimée
            pr(11, f"{prefixe}courante"),                                 # la PR courante
            pr(12, f"{prefixe}v0-1-9", auteur="nedseb"),                  # humaine
            pr(13, f"{prefixe}v0-1-8", fork=True),                        # fork
            pr(14, "chore/autre-robot-v9-9-9"),                           # autre robot
            pr(15, f"{prefixe}v0-1-7", etat="CLOSED"),                    # déjà fermée
            pr(16, f"{prefixe}v0-1-6", auteur=f"{ROBOT}[bot]",
               commits=[f"{ROBOT}[bot]", "nedseb"]),                      # commit humain
        ]

    def fermetures(self, appels):
        return [a for a in appels if a[:2] == ["pr", "close"]]

    def test_ferme_les_pr_depassees_du_robot_seulement(self):
        for nom, robot in ROBOTS.items():
            prefixe = robot["prefixe"]
            with self.subTest(nom):
                bac = Bac(self)
                script = etape(nom, robot["fermeture"])["run"]
                res, _, appels = bac.lancer(script, {"PR": "11", "BRANCHE": f"{prefixe}courante"},
                                            {"prs": self.prs(prefixe)})
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
        for nom, robot in ROBOTS.items():
            if robot["fermeture_a_jour"] is None:
                continue
            with self.subTest(nom):
                bac = Bac(self)
                script = etape(nom, robot["fermeture_a_jour"])["run"]
                res, _, appels = bac.lancer(script, {"EPINGLEE": "v0.3.0"},
                                            {"prs": self.prs(robot["prefixe"])})
                self.assertEqual(res.returncode, 0, res.stderr)
                f = self.fermetures(appels)
                self.assertEqual([a[2] for a in f], ["10", "11", "16"])
                self.assertEqual(f[0], ["pr", "close", "10", "--delete-branch", "--comment",
                                        "Superseded: v0.3.0 is already pinned."])
                self.assertNotIn("--delete-branch", f[2])
                self.assertIn("::warning::", res.stdout)

    def test_conditions_des_etapes(self):
        for nom, robot in ROBOTS.items():
            with self.subTest(nom):
                self.assertEqual(etape(nom, robot["fermeture"])["if"],
                                 "steps.comparaison.outputs.nouvelle == 'true'")
                if robot["fermeture_a_jour"] is not None:
                    self.assertEqual(etape(nom, robot["fermeture_a_jour"])["if"],
                                     "steps.comparaison.outputs.a_jour == 'true'")
                env = etape(nom, robot["fermeture"])["env"]
                self.assertEqual(env["PR"], "${{ steps.ouverture.outputs.pr || steps.comparaison.outputs.pr }}")
                self.assertEqual(env["BRANCHE"], "${{ steps.comparaison.outputs.branche }}")

    def test_avant_la_fusion_automatique(self):
        for nom, robot in ROBOTS.items():
            with self.subTest(nom):
                titres = [e.get("name") for e in etapes(nom)]
                fusion = titres.index("Active la fusion automatique")
                self.assertLess(titres.index(robot["fermeture"]), fusion)
                self.assertLess(titres.index(RECONSTRUCTION), fusion)


def git(*args, cwd):
    env = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1",
           "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t",
           "GIT_COMMITTER_EMAIL": "t@t"}
    return subprocess.run(["git", *args], cwd=cwd, env=env, capture_output=True, text=True,
                          check=True).stdout.strip()


PLATFORMIO = "docs/software/arduino/platformio.md"
ATTENTE = "scripts/exemples-arduino-a-documenter.txt"


def page_platformio(version):
    return ("### platformio.ini\n\n```ini\nlib_deps =\n"
            f"  https://github.com/steamicc/arduino-steami.git#{version}\n```\n\n"
            "Texte qui ne change pas : arduino-steami-lib.\n")


def graine_exemples(graine, platformio=True, attente="G/Attente\n"):
    """Fichiers du wiki que lit l'épinglage des exemples Arduino."""
    for script in ("check-arduino-examples.py", "completer-attente-arduino.py"):
        (graine / "scripts").mkdir(exist_ok=True)
        shutil.copy(RACINE / "scripts" / script, graine / "scripts" / script)
    (graine / ATTENTE).write_text(attente, encoding="utf-8")
    exemples = graine / "docs" / "software" / "arduino" / "exemples"
    exemples.mkdir(parents=True)
    (exemples / "g.md").write_text('## Doc {#doc}\n\n<EssayerExemple id="G/Doc" />\n',
                                   encoding="utf-8")
    if platformio:
        (graine / PLATFORMIO).write_text(page_platformio("v0.1.0"), encoding="utf-8")


def archive_exemples(dossier, ids, version="v0.3.0"):
    chemin = dossier / "archive.zip"
    with zipfile.ZipFile(chemin, "w") as z:
        z.writestr("index.json", json.dumps(
            {"version": version, "exemples": [{"id": i, "bin": f"{i}.bin"} for i in ids]}))
        for i in ids:
            z.writestr(f"{i}.bin", "bin")
    return chemin


class TestReconstruction(unittest.TestCase):
    """Branche d'une PR en conflit reconstruite depuis main, poussée avec un bail."""

    def depot(self, bac, nom, branche):
        """origin : main en conflit avec la branche du robot ; travail : clone de main."""
        robot = ROBOTS[nom]
        fichier, cle = robot["fichier"], robot["cle"]
        origine = bac.dir / "origine.git"
        git("init", "-q", "--bare", "-b", "main", str(origine), cwd=bac.dir)
        graine = bac.dir / "graine"
        git("clone", "-q", str(origine), str(graine), cwd=bac.dir)
        (graine / fichier).write_text(json.dumps({cle: robot["epinglee"]}) + "\n", encoding="utf-8")
        if nom == "suivre-exemples-arduino.yml":
            graine_exemples(graine)
        git("add", ".", cwd=graine)
        git("commit", "-qm", "base", cwd=graine)
        git("push", "-q", "origin", "HEAD:main", cwd=graine)
        git("switch", "-qc", branche, cwd=graine)
        (graine / fichier).write_text(json.dumps({cle: robot["derniere"]}) + "\n", encoding="utf-8")
        git("commit", "-qam", "robot", cwd=graine)
        git("push", "-q", "origin", branche, cwd=graine)
        git("switch", "-q", "main", cwd=graine)
        (graine / fichier).write_text(json.dumps({cle: "autre"}) + "\n", encoding="utf-8")
        git("commit", "-qam", "autre epinglage", cwd=graine)
        git("push", "-q", "origin", "main", cwd=graine)
        shutil.rmtree(bac.travail)
        git("clone", "-q", str(origine), str(bac.travail), cwd=bac.dir)
        return origine, git("rev-parse", f"origin/{branche}", cwd=bac.travail)

    def pousser(self, nom, tete):
        robot = ROBOTS[nom]
        branche = robot["prefixe"] + robot["suffixe"]
        bac = Bac(self)
        origine, ancienne = self.depot(bac, nom, branche)
        script = etape(nom, robot["epinglage"])["run"]
        env = {"DERNIERE": robot["derniere"], "BRANCHE": branche, "RECONSTRUIRE": "true",
               "TETE": tete or ancienne}
        if nom == "suivre-exemples-arduino.yml":
            env["FAUX_TELECHARGEMENT"] = str(archive_exemples(bac.dir, ["G/Doc", "G/Attente"]))
        if nom == "suivre-daplink.yml":
            # Empreinte obligatoire pour DAPLink : celle du fichier « téléchargé ».
            env["EMPREINTE"] = "sha256:" + hashlib.sha256(TELECHARGE).hexdigest()
        else:
            env["EMPREINTE"] = ""
        env[robot["sortie_asset"].upper()] = robot["asset"]
        res, _, _ = bac.lancer(script, env, {"prs": []})
        return res, origine, branche, ancienne

    def test_branche_reconstruite_sur_main(self):
        for nom in SANS_RESEAU:
            with self.subTest(nom):
                fichier = ROBOTS[nom]["fichier"]
                res, origine, branche, ancienne = self.pousser(nom, None)
                self.assertEqual(res.returncode, 0, res.stderr)
                nouvelle = git("rev-parse", branche, cwd=origine)
                self.assertNotEqual(nouvelle, ancienne)
                self.assertEqual(git("rev-parse", f"{branche}^", cwd=origine),
                                 git("rev-parse", "main", cwd=origine))
                self.assertIn(f'"{ROBOTS[nom]["derniere"]}"',
                              git("show", f"{branche}:{fichier}", cwd=origine))

    def test_bail_refuse_une_branche_modifiee_entre_temps(self):
        for nom in SANS_RESEAU:
            with self.subTest(nom):
                res, origine, branche, ancienne = self.pousser(nom, "0" * 40)
                self.assertNotEqual(res.returncode, 0)
                self.assertEqual(git("rev-parse", branche, cwd=origine), ancienne)

    def test_meme_poussee_dans_tous_les_robots(self):
        for nom, robot in ROBOTS.items():
            with self.subTest(nom):
                c = code(nom)
                self.assertIn('git push --force-with-lease="refs/heads/$BRANCHE:$TETE" origin "$BRANCHE"', c)
                self.assertIn('git push origin "$BRANCHE"', c)
                env = etape(nom, robot["epinglage"])["env"]
                self.assertEqual(env["RECONSTRUIRE"], "${{ steps.comparaison.outputs.reconstruire }}")
                self.assertEqual(env["TETE"], "${{ steps.comparaison.outputs.tete }}")

    def signaler(self, nom, env, prs):
        bac = Bac(self)
        return bac.lancer(etape(nom, RECONSTRUCTION)["run"], env, {"prs": prs})

    def test_reconstruction_signalee_sur_la_pr(self):
        for nom, robot in ROBOTS.items():
            with self.subTest(nom):
                self.assertEqual(etape(nom, RECONSTRUCTION)["if"],
                                 "steps.comparaison.outputs.reconstruire == 'true'")
                res, _, appels = self.signaler(nom, {"PR": "20", "DIFFERENTS": "", "AJOUTES": ""},
                                               [pr(20, robot["prefixe"] + robot["suffixe"])])
                self.assertEqual(res.returncode, 0, res.stderr)
                commentaires = [a for a in appels if a[:2] == ["pr", "comment"]]
                self.assertEqual(len(commentaires), 1)
                self.assertEqual(commentaires[0][2], "20")
                self.assertFalse(any(a[:2] in (["pr", "ready"], ["pr", "merge"]) for a in appels))

    def test_exemples_mis_en_attente_cites_apres_reconstruction(self):
        nom = "suivre-exemples-arduino.yml"
        env = etape(nom, RECONSTRUCTION)["env"]
        self.assertEqual(env["AJOUTES"], "${{ steps.epinglage.outputs.ajoutes }}")
        res, _, appels = self.signaler(nom, {"PR": "20", "AJOUTES": "G/N H/M"},
                                       [pr(20, "chore/exemples-arduino-v0-3-0")])
        self.assertEqual(res.returncode, 0, res.stderr)
        commentaire = next(a for a in appels if a[:2] == ["pr", "comment"])
        corps = commentaire[commentaire.index("--body") + 1]
        self.assertIn("`G/N`", corps)
        self.assertIn("`H/M`", corps)

    def test_croquis_differents_apres_reconstruction_pr_en_brouillon(self):
        nom = "suivre-croquis-sample.yml"
        robot = ROBOTS[nom]
        env = etape(nom, RECONSTRUCTION)["env"]
        self.assertEqual(env["DIFFERENTS"], "${{ steps.epinglage.outputs.differents }}")
        res, _, appels = self.signaler(nom, {"PR": "20", "DIFFERENTS": "G/N H/M"},
                                       [pr(20, robot["prefixe"] + robot["suffixe"])])
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn(["pr", "merge", "20", "--disable-auto"], appels)
        self.assertIn(["pr", "ready", "20", "--undo"], appels)
        commentaire = next(a for a in appels if a[:2] == ["pr", "comment"])
        corps = commentaire[commentaire.index("--body") + 1]
        self.assertIn("`G/N`", corps)
        self.assertIn("`H/M`", corps)
        self.assertLess(appels.index(["pr", "merge", "20", "--disable-auto"]),
                        appels.index(["pr", "ready", "20", "--undo"]))


class TestEpinglageExemplesArduino(unittest.TestCase):
    """suivre-exemples-arduino.yml : les nouveaux exemples de l'index sont mis en
    attente de documentation (défaut 1 de l'audit) et la version de la
    bibliothèque est réécrite dans la page PlatformIO (défaut 4), dans le commit
    d'épinglage."""

    NOM = "suivre-exemples-arduino.yml"
    BRANCHE = "chore/exemples-arduino-v0-3-0"

    def epingler(self, ids, platformio=True):
        bac = Bac(self)
        origine = bac.dir / "origine.git"
        git("init", "-q", "--bare", "-b", "main", str(origine), cwd=bac.dir)
        graine = bac.dir / "graine"
        git("clone", "-q", str(origine), str(graine), cwd=bac.dir)
        (graine / "exemples-arduino.json").write_text('{"version": "v0.1.0"}\n', encoding="utf-8")
        graine_exemples(graine, platformio=platformio)
        git("add", ".", cwd=graine)
        git("commit", "-qm", "base", cwd=graine)
        git("push", "-q", "origin", "HEAD:main", cwd=graine)
        shutil.rmtree(bac.travail)
        git("clone", "-q", str(origine), str(bac.travail), cwd=bac.dir)
        script = etape(self.NOM, ROBOTS[self.NOM]["epinglage"])["run"]
        env = {"DERNIERE": "v0.3.0", "ARCHIVE": "steami-exemples-v0.3.0.zip", "EMPREINTE": "",
               "BRANCHE": self.BRANCHE, "RECONSTRUIRE": "", "TETE": "",
               "FAUX_TELECHARGEMENT": str(archive_exemples(bac.dir, ids))}
        res, sorties, _ = bac.lancer(script, env, {"prs": []})
        return res, sorties, origine

    def test_nouvel_exemple_mis_en_attente_dans_le_commit_d_epinglage(self):
        res, s, origine = self.epingler(["G/Doc", "G/Attente", "G/Nouveau", "A/Autre"])
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertEqual(s.get("ajoutes"), "A/Autre G/Nouveau")
        self.assertEqual(git("show", f"{self.BRANCHE}:{ATTENTE}", cwd=origine),
                         "G/Attente\nA/Autre\nG/Nouveau")
        # Un seul commit du robot, qui porte les trois fichiers.
        self.assertEqual(git("rev-parse", f"{self.BRANCHE}^", cwd=origine),
                         git("rev-parse", "main", cwd=origine))
        changes = git("diff", "--name-only", "main", self.BRANCHE, cwd=origine).splitlines()
        self.assertEqual(sorted(changes), sorted(["exemples-arduino.json", ATTENTE, PLATFORMIO]))
        self.assertEqual(git("log", "-1", "--format=%an", self.BRANCHE, cwd=origine), f"{ROBOT}[bot]")

    def test_version_de_la_page_platformio_reecrite(self):
        res, _, origine = self.epingler(["G/Doc", "G/Attente"])
        self.assertEqual(res.returncode, 0, res.stderr)
        page = git("show", f"{self.BRANCHE}:{PLATFORMIO}", cwd=origine)
        self.assertEqual(page + "\n", page_platformio("v0.3.0"))

    def test_rien_de_nouveau_liste_inchangee(self):
        res, s, origine = self.epingler(["G/Doc", "G/Attente"])
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertEqual(s.get("ajoutes"), "")
        changes = git("diff", "--name-only", "main", self.BRANCHE, cwd=origine).splitlines()
        self.assertNotIn(ATTENTE, changes)

    def test_page_platformio_sans_version_signalee(self):
        res, _, origine = self.epingler(["G/Doc", "G/Attente"], platformio=False)
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn("::warning::", res.stdout)
        self.assertIn(PLATFORMIO, res.stdout)
        self.assertIn('"v0.3.0"', git("show", f"{self.BRANCHE}:exemples-arduino.json", cwd=origine))

    def ouvrir(self, ajoutes, pousse="true"):
        bac = Bac(self)
        env = {"ACTUEL": "v0.1.0", "DERNIERE": "v0.3.0", "ARCHIVE": "steami-exemples-v0.3.0.zip",
               "BRANCHE": self.BRANCHE, "AJOUTES": ajoutes, "POUSSE": pousse}
        res, s, appels = bac.lancer(etape(self.NOM, "Ouvre la PR")["run"], env, {"prs": []})
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertEqual(s.get("pr"), "99")
        creation = next(a for a in appels if a[:2] == ["pr", "create"])
        return creation, (bac.dir / "corps.md").read_text(encoding="utf-8")

    def test_corps_de_la_pr_cite_les_exemples_mis_en_attente(self):
        env = etape(self.NOM, "Ouvre la PR")["env"]
        self.assertEqual(env["AJOUTES"], "${{ steps.epinglage.outputs.ajoutes }}")
        self.assertEqual(env["POUSSE"], "${{ steps.comparaison.outputs.pousser }}")
        self.assertEqual(etape(self.NOM, ROBOTS[self.NOM]["epinglage"])["id"], "epinglage")
        creation, corps = self.ouvrir("A/Autre G/Nouveau")
        self.assertIn("`A/Autre`, `G/Nouveau`", corps)
        self.assertIn(f"`{ATTENTE}`", corps)
        self.assertIn(f"`{PLATFORMIO}`", corps)
        self.assertNotIn("--draft", creation)

    def test_corps_sans_nouvel_exemple(self):
        _, corps = self.ouvrir("")
        self.assertNotIn("sont ajoutés à", corps)
        self.assertIn(f"`{PLATFORMIO}`", corps)

    def test_corps_d_une_branche_preparee_par_une_execution_precedente(self):
        _, corps = self.ouvrir("", pousse="false")
        self.assertIn("exécution précédente", corps)


if __name__ == "__main__":
    unittest.main()
