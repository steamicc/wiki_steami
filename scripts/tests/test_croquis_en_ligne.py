"""Croquis Arduino écrits en ligne dans les pages : repérage des blocs
(croquis_en_ligne.py) et vérification de leur marquage (check-inline-sketches.py)."""

import contextlib
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import yaml

SCRIPTS = Path(__file__).resolve().parents[1]
RACINE = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))

import croquis_en_ligne

spec = importlib.util.spec_from_file_location(
    "check_inline_sketches", SCRIPTS / "check-inline-sketches.py"
)
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)

PAGE = Path("docs/software/arduino/page.md")
CROQUIS = "void setup() {\n  pinMode(LED_RED, OUTPUT);\n}\n\nvoid loop() {\n  delay(500);\n}\n"
GROUPES = ("CAPTEURS", "ECRAN", "PREMIERS", "CARTE", "BOUTONS", "BUZZER")


def bloc_md(meta="", code=CROQUIS, langage="cpp", indent="", cloture="```"):
    info = f"{langage} {meta}".rstrip()
    lignes = [f"{cloture}{info}"] + code.splitlines() + [cloture]
    return "".join(f"{indent}{l}\n" if l else "\n" for l in lignes)


def blocs(texte, fichier=PAGE):
    return croquis_en_ligne.blocs_de_texte(texte, fichier)


class TestReperage(unittest.TestCase):
    def test_complete_sketch_found_with_lines_and_code(self):
        texte = "# Titre\n\nTexte.\n\n" + bloc_md() + "\nSuite.\n"
        (b,) = blocs(texte)
        self.assertEqual(b.fichier, PAGE)
        self.assertEqual(b.ligne_debut, 5)
        self.assertEqual(b.ligne_fin, 5 + CROQUIS.count("\n") + 1)
        self.assertEqual(b.code, CROQUIS)
        self.assertEqual(b.meta, "")
        self.assertIsNone(b.id_sample)
        self.assertFalse(b.norun)
        self.assertTrue(b.complet)

    def test_ino_language_is_a_sketch(self):
        (b,) = blocs(bloc_md(langage="ino"))
        self.assertTrue(b.complet)

    def test_fragment_without_loop_is_not_complete(self):
        (b,) = blocs(bloc_md(code="void setup() {\n}\n"))
        self.assertFalse(b.complet)

    def test_file_include_is_not_inline(self):
        texte = "```cpp file=.external/arduino-steami-sample/examples/CAPTEURS/Distance/Distance.ino\n```\n"
        self.assertEqual(blocs(texte), [])

    def test_other_languages_ignored_even_with_norun(self):
        texte = bloc_md(langage="python", meta="norun", code="def setup():\n    loop()\n")
        self.assertEqual(blocs(texte), [])

    def test_meta_sample_and_title(self):
        (b,) = blocs(bloc_md(meta='title="Mon croquis" sample=PREMIERS/ClignoterLed'))
        self.assertEqual(b.id_sample, "PREMIERS/ClignoterLed")
        self.assertFalse(b.norun)
        self.assertEqual(b.meta, 'title="Mon croquis" sample=PREMIERS/ClignoterLed')

    def test_meta_norun(self):
        (b,) = blocs(bloc_md(meta="norun"))
        self.assertTrue(b.norun)
        self.assertIsNone(b.id_sample)

    def test_norun_inside_title_is_not_a_mark(self):
        (b,) = blocs(bloc_md(meta='title="norun sample=X/Y"'))
        self.assertFalse(b.norun)
        self.assertIsNone(b.id_sample)

    def test_block_inside_longer_fence_is_ignored(self):
        texte = "````md\n" + bloc_md() + "````\n"
        self.assertEqual(blocs(texte), [])

    def test_tilde_fence(self):
        (b,) = blocs(bloc_md(cloture="~~~", meta="norun"))
        self.assertTrue(b.complet and b.norun)

    def test_indented_block_code_is_dedented(self):
        texte = "1. Coller :\n\n" + bloc_md(indent="   ", meta="norun")
        (b,) = blocs(texte)
        self.assertEqual(b.code, CROQUIS)
        self.assertEqual(b.ligne_debut, 3)

    def test_crlf(self):
        (b,) = blocs(bloc_md(meta="sample=PREMIERS/Nom").replace("\n", "\r\n"))
        self.assertEqual(b.code, CROQUIS)
        self.assertEqual(b.id_sample, "PREMIERS/Nom")

    def test_unclosed_block_runs_to_end(self):
        texte = "```cpp\n" + CROQUIS
        (b,) = blocs(texte)
        self.assertEqual(b.ligne_fin, texte.count("\n"))
        self.assertTrue(b.complet)

    def test_blocs_walks_docs_recursively(self):
        with tempfile.TemporaryDirectory() as d:
            docs = Path(d) / "docs"
            (docs / "a" / "b").mkdir(parents=True)
            (docs / "a" / "b" / "p.mdx").write_text(bloc_md(meta="norun"), encoding="utf-8")
            (docs / "q.md").write_text(bloc_md(), encoding="utf-8")
            (docs / "r.txt").write_text(bloc_md(), encoding="utf-8")
            trouves = croquis_en_ligne.blocs(docs)
        self.assertEqual(
            [b.fichier for b in trouves], [Path("docs/a/b/p.mdx"), Path("docs/q.md")]
        )


def verifier(texte, au_tag=(), fichier=PAGE):
    return check.verifier(blocs(texte, fichier), set(au_tag))


class TestVerifier(unittest.TestCase):
    def test_unmarked_complete_sketch_fails_and_says_what_to_add(self):
        erreurs, attente = verifier(bloc_md())
        self.assertEqual(len(erreurs), 1)
        self.assertIn(f"{PAGE}:1", erreurs[0])
        self.assertIn("sample=GROUPE/Nom", erreurs[0])
        self.assertIn("norun", erreurs[0])
        self.assertEqual(attente, [])

    def test_unmarked_fragment_is_fine(self):
        self.assertEqual(verifier(bloc_md(code="Serial.println(1);\n")), ([], []))

    def test_norun_ok(self):
        self.assertEqual(verifier(bloc_md(meta="norun")), ([], []))

    def test_valid_sample_is_announced(self):
        erreurs, attente = verifier(bloc_md(meta="sample=PREMIERS/ClignoterLed"))
        self.assertEqual(erreurs, [])
        self.assertEqual(len(attente), 1)
        self.assertEqual(attente[0].id_sample, "PREMIERS/ClignoterLed")

    def test_every_group_accepted(self):
        for groupe in GROUPES:
            with self.subTest(groupe=groupe):
                erreurs, _ = verifier(bloc_md(meta=f"sample={groupe}/Nom_2"))
                self.assertEqual(erreurs, [])

    def test_malformed_ids(self):
        for ident in ("", "PREMIERS", "premiers/Nom", "PREMIERS/Nom-tiret", "PREMIERS/a/b", "PREMIERS/"):
            with self.subTest(ident=ident):
                erreurs, attente = verifier(bloc_md(meta=f"sample={ident}"))
                self.assertEqual(len(erreurs), 1, erreurs)
                self.assertIn("GROUPE/Nom", erreurs[0])
                self.assertEqual(attente, [])

    def test_unknown_group(self):
        erreurs, attente = verifier(bloc_md(meta="sample=RADIO/Balise"))
        self.assertEqual(len(erreurs), 1)
        self.assertIn("RADIO", erreurs[0])
        for groupe in GROUPES:
            self.assertIn(groupe, erreurs[0])
        self.assertEqual(attente, [])

    def test_same_id_twice(self):
        texte = bloc_md(meta="sample=CARTE/Double") + "\n" + bloc_md(meta="sample=CARTE/Double")
        erreurs, attente = verifier(texte)
        self.assertEqual(len(erreurs), 1)
        self.assertIn("CARTE/Double", erreurs[0])
        self.assertIn(f"{PAGE}:1", erreurs[0])
        self.assertIn(f"{PAGE}:11", erreurs[0])
        self.assertEqual(len(attente), 1)

    def test_same_id_on_two_pages(self):
        b = blocs(bloc_md(meta="sample=CARTE/Double"), Path("docs/a.md")) + blocs(
            bloc_md(meta="sample=CARTE/Double"), Path("docs/b.md")
        )
        erreurs, _ = check.verifier(b, set())
        self.assertEqual(len(erreurs), 1)
        self.assertIn("docs/a.md:1", erreurs[0])
        self.assertIn("docs/b.md:1", erreurs[0])

    def test_id_already_in_sample_at_pinned_tag(self):
        erreurs, attente = verifier(bloc_md(meta="sample=CAPTEURS/Distance"), au_tag={"CAPTEURS/Distance"})
        self.assertEqual(len(erreurs), 1)
        self.assertIn("CAPTEURS/Distance", erreurs[0])
        self.assertIn("file=.external/arduino-steami-sample/examples/CAPTEURS/Distance/Distance.ino", erreurs[0])
        self.assertIn("https://github.com/steamicc/arduino-steami-sample", erreurs[0])
        self.assertEqual(attente, [])

    def test_sample_and_norun_together(self):
        erreurs, attente = verifier(bloc_md(meta="sample=PREMIERS/Nom norun"))
        self.assertEqual(len(erreurs), 1)
        self.assertIn("norun", erreurs[0])
        self.assertEqual(attente, [])

    def test_sample_on_incomplete_block(self):
        erreurs, attente = verifier(bloc_md(meta="sample=PREMIERS/Nom", code="Serial.println(1);\n"))
        self.assertEqual(len(erreurs), 1)
        self.assertIn("setup(", erreurs[0])
        self.assertEqual(attente, [])


def git(dossier, *args):
    subprocess.run(
        ["git", "-c", "user.name=t", "-c", "user.email=t@example.com",
         "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", "-C", str(dossier), *args],
        check=True, capture_output=True,
    )


class TestMain(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dossier = Path(self._tmp.name)
        self.docs = self.dossier / "docs"
        self.docs.mkdir()
        self.sample = self.dossier / "sample"
        (self.sample / "examples" / "CAPTEURS" / "Distance").mkdir(parents=True)
        (self.sample / "examples" / "CAPTEURS" / "Distance" / "Distance.ino").write_text(
            CROQUIS, encoding="utf-8"
        )
        git(self.sample, "init", "-q")
        git(self.sample, "add", ".")
        git(self.sample, "commit", "-q", "-m", "init")
        git(self.sample, "tag", "v1.0.1")
        self.epingle = self.dossier / "epingle.json"
        self.epingle.write_text(json.dumps({"version": "v1.0.1"}), encoding="utf-8")

    def tearDown(self):
        self._tmp.cleanup()

    def page(self, texte):
        (self.docs / "page.md").write_text(texte, encoding="utf-8")

    def lancer(self, *extra, env=None):
        sortie, erreur = io.StringIO(), io.StringIO()
        argv = ["--pages", str(self.docs), "--sample", str(self.sample),
                "--epingle-sample", str(self.epingle), *extra]
        with (
            mock.patch.dict(os.environ, env or {"GITHUB_ACTIONS": ""}),
            contextlib.redirect_stdout(sortie),
            contextlib.redirect_stderr(erreur),
        ):
            code = check.main(argv)
        return code, sortie.getvalue(), erreur.getvalue()

    def test_ok_and_pending_counted(self):
        self.page(bloc_md(meta="sample=PREMIERS/Un") + "\n" + bloc_md(meta="sample=PREMIERS/Deux")
                  + "\n" + bloc_md(meta="norun"))
        code, sortie, erreur = self.lancer()
        self.assertEqual(code, 0, erreur)
        self.assertIn("PREMIERS/Un", sortie)
        self.assertIn("PREMIERS/Deux", sortie)
        self.assertIn("2 en attente", sortie)

    def test_github_notice_annotation(self):
        self.page(bloc_md(meta="sample=PREMIERS/Un"))
        code, sortie, _ = self.lancer(env={"GITHUB_ACTIONS": "true"})
        self.assertEqual(code, 0)
        self.assertIn("::notice file=docs/page.md,line=1::", sortie)

    def test_unmarked_fails(self):
        self.page(bloc_md())
        code, _, erreur = self.lancer()
        self.assertEqual(code, 1)
        self.assertIn("sample=GROUPE/Nom", erreur)

    def test_github_error_annotation(self):
        self.page(bloc_md())
        code, sortie, _ = self.lancer(env={"GITHUB_ACTIONS": "true"})
        self.assertEqual(code, 1)
        self.assertIn("::error file=docs/page.md,line=1::", sortie)

    def test_id_present_in_sample_clone_fails(self):
        self.page(bloc_md(meta="sample=CAPTEURS/Distance"))
        code, _, erreur = self.lancer()
        self.assertEqual(code, 1)
        self.assertIn("v1.0.1", erreur)

    def test_clone_at_another_tag_fails(self):
        self.epingle.write_text(json.dumps({"version": "v1.0.2"}), encoding="utf-8")
        self.page(bloc_md(meta="norun"))
        code, _, erreur = self.lancer()
        self.assertEqual(code, 1)
        self.assertIn("npm run prebuild", erreur)

    def test_missing_clone_fails(self):
        self.page(bloc_md(meta="norun"))
        code, _, erreur = self.lancer("--sample", str(self.dossier / "absent"))
        self.assertEqual(code, 1)
        self.assertIn("npm run prebuild", erreur)

    def test_not_pinned_skips_sample(self):
        self.page(bloc_md(meta="sample=CAPTEURS/Distance"))
        code, sortie, erreur = self.lancer("--epingle-sample", str(self.dossier / "absent.json"),
                                           "--sample", str(self.dossier / "absent"))
        self.assertEqual(code, 0, erreur)
        self.assertIn("non épinglé", sortie)


class TestDepot(unittest.TestCase):
    def test_npm_script(self):
        scripts = json.loads((RACINE / "package.json").read_text(encoding="utf-8"))["scripts"]
        self.assertEqual(scripts["lint:inline-sketches"], "python3 scripts/check-inline-sketches.py")

    def test_ci_runs_the_lint(self):
        flux = yaml.safe_load((RACINE / ".github/workflows/build.yml").read_text(encoding="utf-8"))
        etapes = flux["jobs"]["build"]["steps"]
        noms = [e.get("run", "") for e in etapes]
        self.assertIn("npm run lint:inline-sketches", noms)
        # Après le build, dont le prebuild clone le sample au tag épinglé.
        self.assertGreater(
            noms.index("npm run lint:inline-sketches"),
            next(i for i, e in enumerate(etapes) if e.get("id") == "build"),
        )

    def test_wiki_pages_pass(self):
        """Les pages du dépôt n'ont aucun croquis complet non marqué ni marque invalide
        (sans le contrôle du tag, qui demande le prebuild)."""
        erreurs, _ = check.verifier(croquis_en_ligne.blocs(RACINE / "docs"), set())
        self.assertEqual(erreurs, [])


# --- Robot page → sample (croquis-vers-sample.py et croquis-vers-sample.yml) ---

FLUX_ROBOT = RACINE / ".github" / "workflows" / "croquis-vers-sample.yml"
BRANCHE_ROBOT = "wiki/croquis"
PAGE_ROBOT = "docs/software/arduino/premiers.md"
CROQUIS_2 = "void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  Serial.println(1);\n}\n"


def charger_robot():
    """Chargé à la demande : son absence ne casse que les tests du robot."""
    spec_robot = importlib.util.spec_from_file_location(
        "croquis_vers_sample", SCRIPTS / "croquis-vers-sample.py"
    )
    module = importlib.util.module_from_spec(spec_robot)
    spec_robot.loader.exec_module(module)
    return module


def git_sortie(dossier, *args):
    return subprocess.run(
        ["git", "-C", str(dossier), *args], check=True, capture_output=True, text=True
    ).stdout


def entete(titre="Premiers programmes", chemin=PAGE_ROBOT):
    return f"// Croquis de la page du wiki « {titre} ({chemin}) ».\n\n"


class TestRobotSample(unittest.TestCase):
    """Dépôt sample simulé : un dépôt nu (le GitHub du sample) et des clones
    (le runner), comme le workflow qui clone, lance le script puis pousse."""

    def setUp(self):
        self.robot = charger_robot()
        self._tmp = tempfile.TemporaryDirectory()
        self.dossier = Path(self._tmp.name)
        self.origine = self.dossier / "origine.git"
        git(self.dossier, "init", "-q", "--bare", "-b", "main", str(self.origine))
        graine = self.dossier / "graine"
        git(self.dossier, "clone", "-q", str(self.origine), str(graine))
        self.ecrire(graine, "examples/CAPTEURS/Distance/Distance.ino", CROQUIS)
        git(graine, "add", ".")
        git(graine, "commit", "-q", "-m", "init")
        git(graine, "tag", "v1.0.1")
        git(graine, "push", "-q", "origin", "HEAD:refs/heads/main", "--tags")
        self.graine = graine
        self.docs = self.dossier / "docs"
        (self.docs / "software" / "arduino").mkdir(parents=True)
        self.epingle = self.dossier / "epingle.json"
        self.epingle.write_text(json.dumps({"version": "v1.0.1"}), encoding="utf-8")
        self.n = 0

    def tearDown(self):
        self._tmp.cleanup()

    @staticmethod
    def ecrire(depot, chemin, texte):
        (depot / chemin).parent.mkdir(parents=True, exist_ok=True)
        (depot / chemin).write_text(texte, encoding="utf-8")

    def page(self, *blocs_md, titre="title: Premiers programmes", chemin=PAGE_ROBOT):
        entete_page = f"---\n{titre}\nsidebar_position: 3\n---\n\n" if titre else ""
        texte = entete_page + "# Premiers pas\n\nTexte.\n\n" + "\nSuite.\n\n".join(blocs_md)
        (self.dossier / chemin).write_text(texte, encoding="utf-8")

    def cloner(self):
        """Clone neuf, comme sur le runner : origin/main, origin/wiki/croquis, tags."""
        self.n += 1
        clone = self.dossier / f"clone{self.n}"
        git(self.dossier, "clone", "-q", str(self.origine), str(clone))
        git(clone, "config", "user.name", "robot")
        git(clone, "config", "user.email", "robot@example.com")
        git(clone, "config", "commit.gpgsign", "false")
        return clone

    def lancer(self, clone, *extra):
        sortie_gh = self.dossier / f"sortie{self.n}.txt"
        corps = self.dossier / f"corps{self.n}.md"
        sortie_gh.write_text("", encoding="utf-8")
        argv = ["--pages", str(self.docs), "--sample", str(clone),
                "--epingle-sample", str(self.epingle),
                "--sortie-github", str(sortie_gh), "--corps", str(corps), *extra]
        out, err = io.StringIO(), io.StringIO()
        with (
            mock.patch.dict(os.environ, {"GITHUB_ACTIONS": ""}),
            contextlib.redirect_stdout(out),
            contextlib.redirect_stderr(err),
        ):
            code = self.robot.main(argv)
        sorties = dict(
            ligne.split("=", 1) for ligne in sortie_gh.read_text(encoding="utf-8").splitlines() if "=" in ligne
        )
        self.corps = corps.read_text(encoding="utf-8") if corps.exists() else ""
        return code, out.getvalue(), err.getvalue(), sorties

    def pousser(self, clone):
        """Ce que fait le workflow quand le script annonce pousser=true."""
        git(clone, "push", "-q", "-f", "origin", f"HEAD:refs/heads/{BRANCHE_ROBOT}")

    def sujets(self, clone, plage):
        return git_sortie(clone, "log", "--reverse", "--format=%s", plage).splitlines()

    def fichier(self, clone, ident, ref="HEAD"):
        groupe, nom = ident.split("/")
        return git_sortie(clone, "show", f"{ref}:examples/{groupe}/{nom}/{nom}.ino")

    # Ajout

    def test_one_commit_per_sketch_with_wiki_header(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"), bloc_md("sample=CARTE/Serie", CROQUIS_2))
        clone = self.cloner()
        code, out, err, sorties = self.lancer(clone)
        self.assertEqual(code, 0, err)
        self.assertEqual(git_sortie(clone, "branch", "--show-current").strip(), BRANCHE_ROBOT)
        self.assertEqual(
            self.sujets(clone, "origin/main..HEAD"),
            ["feat(premiers): Add ClignoterLed from the wiki.", "feat(carte): Add Serie from the wiki."],
        )
        self.assertEqual(self.fichier(clone, "PREMIERS/ClignoterLed"), entete() + CROQUIS)
        self.assertEqual(self.fichier(clone, "CARTE/Serie"), entete() + CROQUIS_2)
        self.assertEqual(sorties["pousser"], "true")
        self.assertEqual(sorties["croquis"], "PREMIERS/ClignoterLed CARTE/Serie")
        self.assertIn("PREMIERS/ClignoterLed", out)

    def test_header_format_matches_published_sketches(self):
        """Même en-tête que les croquis déjà publiés (retiré à l'affichage par remark-code-file)."""
        publie = (RACINE / ".external/arduino-steami-sample/examples/CAPTEURS/Distance/Distance.ino")
        if not publie.is_file():
            self.skipTest("clone du sample absent : lancer npm run prebuild")
        premiere = publie.read_text(encoding="utf-8").split("\n", 2)
        self.assertEqual(premiere[0] + "\n" + premiere[1] + "\n",
                         entete("Capteurs", "docs/software/arduino/capteurs.md"))
        self.assertEqual(
            self.robot.entete("Capteurs", "docs/software/arduino/capteurs.md"),
            premiere[0] + "\n\n",
        )

    def test_title_falls_back_to_first_heading(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"), titre=None)
        clone = self.cloner()
        code, _, err, _ = self.lancer(clone)
        self.assertEqual(code, 0, err)
        self.assertEqual(self.fichier(clone, "PREMIERS/ClignoterLed"), entete("Premiers pas") + CROQUIS)

    def test_quoted_title(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"), titre="title: 'Écran : jauge'")
        clone = self.cloner()
        self.assertEqual(self.lancer(clone)[0], 0)
        self.assertEqual(self.fichier(clone, "PREMIERS/ClignoterLed"), entete("Écran : jauge") + CROQUIS)

    def test_pr_body_lists_sketches_and_pages(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        clone = self.cloner()
        self.lancer(clone)
        self.assertIn("`PREMIERS/ClignoterLed`", self.corps)
        self.assertIn(f"https://github.com/steamicc/wiki_steami/blob/main/{PAGE_ROBOT}", self.corps)
        self.assertIn("norun", self.corps)

    # Rien à faire

    def test_nothing_pending(self):
        self.page(bloc_md("norun"))
        clone = self.cloner()
        code, out, err, sorties = self.lancer(clone)
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "false")
        self.assertEqual(git_sortie(clone, "rev-parse", "HEAD"), git_sortie(clone, "rev-parse", "origin/main"))

    def test_sketch_already_on_sample_main_is_ignored(self):
        # Fusionné dans le sample après le tag épinglé : en attente de la release.
        self.ecrire(self.graine, "examples/PREMIERS/ClignoterLed/ClignoterLed.ino", "// corrigé\n" + CROQUIS)
        git(self.graine, "add", ".")
        git(self.graine, "commit", "-q", "-m", "feat(premiers): Add ClignoterLed from the wiki. (#9)")
        git(self.graine, "push", "-q", "origin", "HEAD:refs/heads/main")
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"), bloc_md("sample=PREMIERS/Serie", CROQUIS_2))
        clone = self.cloner()
        code, out, err, sorties = self.lancer(clone)
        self.assertEqual(code, 0, err)
        self.assertEqual(self.sujets(clone, "origin/main..HEAD"), ["feat(premiers): Add Serie from the wiki."])
        self.assertEqual(sorties["croquis"], "PREMIERS/Serie")
        # Le croquis de main n'est pas remplacé.
        self.assertEqual(self.fichier(clone, "PREMIERS/ClignoterLed"), "// corrigé\n" + CROQUIS)

    def test_all_on_main_means_nothing_to_push(self):
        self.ecrire(self.graine, "examples/PREMIERS/ClignoterLed/ClignoterLed.ino", CROQUIS)
        git(self.graine, "add", ".")
        git(self.graine, "commit", "-q", "-m", "x")
        git(self.graine, "push", "-q", "origin", "HEAD:refs/heads/main")
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        code, _, err, sorties = self.lancer(self.cloner())
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "false")

    def test_invalid_pages_fail_without_commit(self):
        # Id déjà publié au tag épinglé : le lint du wiki le refuse, le robot aussi.
        self.page(bloc_md("sample=CAPTEURS/Distance"), bloc_md("sample=PREMIERS/Serie", CROQUIS_2))
        clone = self.cloner()
        code, _, err, sorties = self.lancer(clone)
        self.assertEqual(code, 1)
        self.assertIn("CAPTEURS/Distance", err)
        self.assertIn("lint:inline-sketches", err)
        self.assertNotEqual(sorties.get("pousser"), "true")
        self.assertEqual(git_sortie(clone, "rev-parse", "HEAD"), git_sortie(clone, "rev-parse", "origin/main"))

    def test_pinned_tag_missing_from_clone_fails(self):
        self.epingle.write_text(json.dumps({"version": "v9.9.9"}), encoding="utf-8")
        self.page(bloc_md("sample=PREMIERS/Serie"))
        code, _, err, _ = self.lancer(self.cloner())
        self.assertEqual(code, 1)
        self.assertIn("v9.9.9", err)

    # Rejeu (Review Focus 5)

    def test_replay_with_open_pr_adds_nothing(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        premier = self.cloner()
        self.lancer(premier)
        self.pousser(premier)
        avant = git_sortie(self.origine, "rev-parse", BRANCHE_ROBOT)
        second = self.cloner()
        code, _, err, sorties = self.lancer(second, "--reprendre")
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "false")
        self.assertEqual(git_sortie(second, "rev-parse", "HEAD"), avant)
        self.assertEqual(self.sujets(second, "origin/main..HEAD"),
                         ["feat(premiers): Add ClignoterLed from the wiki."])
        # Toujours la liste complète pour le corps de la PR.
        self.assertEqual(sorties["croquis"], "PREMIERS/ClignoterLed")

    def test_open_pr_updated_when_page_changes(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        premier = self.cloner()
        self.lancer(premier)
        self.pousser(premier)
        avant = git_sortie(self.origine, "rev-parse", BRANCHE_ROBOT).strip()
        # La page change pendant que la PR est ouverte, et un croquis s'ajoute.
        self.page(bloc_md("sample=PREMIERS/ClignoterLed", CROQUIS_2), bloc_md("sample=PREMIERS/Autre"))
        second = self.cloner()
        code, _, err, sorties = self.lancer(second, "--reprendre")
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "true")
        # Commits ajoutés sur la branche existante (avance rapide, pas de doublon).
        self.assertEqual(git_sortie(second, "merge-base", "--is-ancestor", avant, "HEAD"), "")
        self.assertEqual(
            self.sujets(second, f"{avant}..HEAD"),
            ["feat(premiers): Update ClignoterLed from the wiki.", "feat(premiers): Add Autre from the wiki."],
        )
        self.assertEqual(self.fichier(second, "PREMIERS/ClignoterLed"), entete() + CROQUIS_2)
        self.assertEqual(sorties["croquis"], "PREMIERS/ClignoterLed PREMIERS/Autre")
        # Rejouer encore : rien de plus.
        self.pousser(second)
        troisieme = self.cloner()
        self.assertEqual(self.lancer(troisieme, "--reprendre")[3]["pousser"], "false")

    def test_human_fix_on_the_pr_is_kept(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        premier = self.cloner()
        self.lancer(premier)
        corrige = entete() + "// corrigé dans la PR\n" + CROQUIS
        self.ecrire(premier, "examples/PREMIERS/ClignoterLed/ClignoterLed.ino", corrige)
        git(premier, "commit", "-q", "-am", "fix(premiers): Compile ClignoterLed.")
        self.pousser(premier)
        # Autre modification de docs/ : la page de ce croquis n'a pas changé.
        second = self.cloner()
        code, _, err, sorties = self.lancer(second, "--reprendre")
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "false")
        self.assertEqual(self.fichier(second, "PREMIERS/ClignoterLed"), corrige)

    def test_reprendre_needs_the_remote_branch(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        code, _, err, _ = self.lancer(self.cloner(), "--reprendre")
        self.assertEqual(code, 1)
        self.assertIn(BRANCHE_ROBOT, err)

    def test_without_open_pr_starts_again_from_main(self):
        # Ancienne branche d'une PR fusionnée (squash) ou fermée : on repart de main.
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        premier = self.cloner()
        self.lancer(premier)
        self.pousser(premier)
        self.page(bloc_md("sample=PREMIERS/Autre"))
        second = self.cloner()
        code, _, err, sorties = self.lancer(second)
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "true")
        self.assertEqual(git_sortie(second, "merge-base", "HEAD", "origin/main"),
                         git_sortie(second, "rev-parse", "origin/main"))
        self.assertEqual(self.sujets(second, "origin/main..HEAD"), ["feat(premiers): Add Autre from the wiki."])

    def test_sketch_no_longer_marked_is_reported(self):
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"), bloc_md("sample=PREMIERS/Autre", CROQUIS_2))
        premier = self.cloner()
        self.lancer(premier)
        self.pousser(premier)
        self.page(bloc_md("sample=PREMIERS/Autre", CROQUIS_2), bloc_md("norun"))
        code, out, err, sorties = self.lancer(self.cloner(), "--reprendre")
        self.assertEqual(code, 0, err)
        self.assertIn("PREMIERS/ClignoterLed", out)
        self.assertIn("plus marqué", out)
        self.assertEqual(sorties["croquis"], "PREMIERS/ClignoterLed PREMIERS/Autre")


class TestTitreDePage(unittest.TestCase):
    def setUp(self):
        self.titre = charger_robot().titre_de_page

    def test_frontmatter_title_wins(self):
        self.assertEqual(self.titre('---\ntitle: "Écran"\n---\n\n# Autre\n', "x"), "Écran")

    def test_heading_inside_code_block_is_skipped(self):
        texte = "---\nsidebar_position: 3\n---\n\n```bash\n# commentaire\n```\n\n# Vrai titre #\n"
        self.assertEqual(self.titre(texte, "x"), "Vrai titre")

    def test_default_without_title(self):
        self.assertEqual(self.titre("Texte.\n\n## Section\n", "page"), "page")


def flux_robot():
    return yaml.safe_load(FLUX_ROBOT.read_text(encoding="utf-8"))


def code_robot():
    """Scripts, conditions et paramètres des étapes, sans les commentaires."""
    job = flux_robot()["jobs"]["croquis"]
    morceaux = [str(job.get("if", "")), str(job.get("env", ""))]
    for etape in job["steps"]:
        morceaux.append(str(etape.get("if", "")))
        morceaux.append(str(etape.get("with", "")))
        morceaux.append(str(etape.get("env", "")))
        for ligne in etape.get("run", "").splitlines():
            if not ligne.lstrip().startswith("#"):
                morceaux.append(ligne)
    return "\n".join(morceaux)


class TestFluxRobot(unittest.TestCase):
    def test_triggers(self):
        f = flux_robot()
        self.assertEqual(f["name"], "croquis-vers-sample")
        declencheurs = f[True]  # PyYAML lit « on » comme True.
        self.assertEqual(declencheurs["push"]["branches"], ["main"])
        self.assertEqual(declencheurs["push"]["paths"], ["docs/**"])
        self.assertIn("workflow_dispatch", declencheurs)
        self.assertNotIn("pull_request", declencheurs)
        self.assertNotIn("pull_request_target", declencheurs)

    def test_app_token_limited_to_sample(self):
        etapes = flux_robot()["jobs"]["croquis"]["steps"]
        (app,) = [e for e in etapes if "create-github-app-token" in e.get("uses", "")]
        self.assertEqual(app["with"]["repositories"], "arduino-steami-sample")
        self.assertEqual(app["with"]["app-id"], "${{ secrets.RELEASE_APP_ID }}")
        self.assertEqual(app["with"]["private-key"], "${{ secrets.RELEASE_APP_SECRET }}")
        self.assertEqual(flux_robot()["permissions"], {"contents": "read"})

    def test_never_github_token_never_merge(self):
        t = code_robot()
        self.assertNotIn("GITHUB_TOKEN", t)
        self.assertNotIn("github.token", t)
        self.assertNotIn("gh pr merge", t)
        self.assertNotIn("--auto", t)

    def test_single_branch_and_pr(self):
        t = code_robot()
        self.assertIn("wiki/croquis", t)
        self.assertIn('--title "feat(examples): Add the wiki sketches."', t)
        self.assertIn("--repo steamicc/arduino-steami-sample", t)
        self.assertIn("gh pr list", t)
        self.assertIn("gh pr create", t)
        self.assertIn("gh pr edit", t)
        self.assertIn("isCrossRepository", t)
        self.assertIn("--force-with-lease", t)
        self.assertIn("scripts/croquis-vers-sample.py", t)
        self.assertIn("--reprendre", t)

    def test_not_in_forks_and_serialized(self):
        f = flux_robot()
        self.assertIn("github.repository == 'steamicc/wiki_steami'", str(f["jobs"]["croquis"]["if"]))
        self.assertIs(f["concurrency"]["cancel-in-progress"], False)


if __name__ == "__main__":
    unittest.main()
