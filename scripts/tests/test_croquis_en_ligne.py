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

    def test_meta_without_sample_keeps_the_rest(self):
        m = croquis_en_ligne.meta_sans_sample
        self.assertEqual(m("sample=PREMIERS/A"), "")
        self.assertEqual(
            m('title="Mon croquis" showLineNumbers sample=PREMIERS/A {1-3}'),
            'title="Mon croquis" showLineNumbers {1-3}',
        )
        self.assertEqual(m('sample="PREMIERS/A" title="sample=X/Y"'), 'title="sample=X/Y"')
        self.assertEqual(m('title="a  b"'), 'title="a  b"')

    def test_same_code_ignores_the_sample_header_and_line_endings(self):
        entete_sample = "// Croquis de la page du wiki « T (docs/p.md) ».\n\n"
        self.assertTrue(croquis_en_ligne.meme_code(entete_sample + CROQUIS, CROQUIS))
        self.assertTrue(croquis_en_ligne.meme_code(CROQUIS.replace("\n", "\r\n"), CROQUIS))
        self.assertFalse(croquis_en_ligne.meme_code(entete_sample + "// corrigé\n" + CROQUIS, CROQUIS))

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

    def test_block_changed_after_merge_into_sample_main_is_reported(self):
        # PR du robot fusionnée dans le sample, pas encore publiée ; le bloc du
        # wiki change ensuite : le robot ne remplace pas le croquis de main,
        # mais signale l'écart (sinon la PR d'épinglage efface la modification).
        self.ecrire(self.graine, "examples/PREMIERS/ClignoterLed/ClignoterLed.ino", entete() + CROQUIS)
        git(self.graine, "add", ".")
        git(self.graine, "commit", "-q", "-m", "feat(examples): Add the wiki sketches. (#9)")
        git(self.graine, "push", "-q", "origin", "HEAD:refs/heads/main")
        self.page(bloc_md("sample=PREMIERS/ClignoterLed", CROQUIS.replace("500", "250")))
        clone = self.cloner()
        code, out, err, sorties = self.lancer(clone)
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "false")
        (avertissement,) = [l for l in out.splitlines() if l.startswith("Attention")]
        self.assertIn("PREMIERS/ClignoterLed", avertissement)
        self.assertIn(f"{PAGE_ROBOT}:", avertissement)
        self.assertIn("arduino-steami-sample", avertissement)
        # Sous GitHub Actions : annotation.
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            out2 = io.StringIO()
            with contextlib.redirect_stdout(out2), contextlib.redirect_stderr(io.StringIO()):
                self.robot.main(["--pages", str(self.docs), "--sample", str(self.cloner()),
                                 "--epingle-sample", str(self.epingle)])
        self.assertIn("::warning::", out2.getvalue())
        self.assertIn("PREMIERS/ClignoterLed", out2.getvalue())

    def test_same_block_on_sample_main_is_not_reported(self):
        self.ecrire(self.graine, "examples/PREMIERS/ClignoterLed/ClignoterLed.ino", entete() + CROQUIS)
        git(self.graine, "add", ".")
        git(self.graine, "commit", "-q", "-m", "x")
        git(self.graine, "push", "-q", "origin", "HEAD:refs/heads/main")
        self.page(bloc_md("sample=PREMIERS/ClignoterLed"))
        code, out, err, _ = self.lancer(self.cloner())
        self.assertEqual(code, 0, err)
        self.assertNotIn("Attention", out)

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
        # Aucun commit, mais le corps change : le workflow doit quand même
        # mettre à jour la PR (voir test_open_pr_body_updated_without_push).
        self.assertEqual(sorties["pousser"], "false")
        self.assertIn("| `PREMIERS/ClignoterLed` | no longer marked `sample=` in the wiki |", self.corps)

    # Boucle wiki -> sample -> wiki

    def test_page_converted_by_the_pin_opens_nothing(self):
        # Le croquis est publié au tag v1.0.2 et la page d'épinglage l'inclut :
        # le push de cette page sur main relance le robot, qui ne doit rien ouvrir.
        self.ecrire(self.graine, "examples/PREMIERS/ClignoterLed/ClignoterLed.ino", entete() + CROQUIS)
        git(self.graine, "add", ".")
        git(self.graine, "commit", "-q", "-m", "feat(examples): Add the wiki sketches. (#9)")
        git(self.graine, "tag", "v1.0.2")
        git(self.graine, "push", "-q", "origin", "HEAD:refs/heads/main", "--tags")
        self.epingle.write_text(json.dumps({"version": "v1.0.2"}), encoding="utf-8")
        texte = ENTETE_PAGE + "# Premiers pas\n\n" + bloc_md("sample=PREMIERS/ClignoterLed")
        convertie = charger_conversion().convertir_texte(texte, {"PREMIERS/ClignoterLed"})[0]
        (self.dossier / PAGE_ROBOT).write_text(convertie, encoding="utf-8")
        clone = self.cloner()
        code, out, err, sorties = self.lancer(clone)
        self.assertEqual(code, 0, err)
        self.assertEqual(sorties["pousser"], "false")
        self.assertEqual(sorties.get("croquis", ""), "")
        self.assertEqual(git_sortie(clone, "rev-parse", "HEAD"), git_sortie(clone, "rev-parse", "origin/main"))


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
        self.assertEqual(app["with"]["client-id"], "${{ secrets.RELEASE_APP_ID }}")
        self.assertEqual(app["with"]["private-key"], "${{ secrets.RELEASE_APP_SECRET }}")
        self.assertEqual(flux_robot()["permissions"], {"contents": "read"})

    def test_never_github_token(self):
        t = code_robot()
        self.assertNotIn("GITHUB_TOKEN", t)
        self.assertNotIn("github.token", t)

    def test_auto_merge_guarded(self):
        etapes = {e.get("name"): e for e in flux_robot()["jobs"]["croquis"]["steps"]}
        noms = list(etapes)
        self.assertEqual(etapes["Ouvre ou met à jour la PR"]["id"], "ouverture")
        fusion = etapes["Active la fusion automatique"]
        self.assertEqual(fusion["if"], etapes["Ouvre ou met à jour la PR"]["if"])
        self.assertGreater(noms.index("Active la fusion automatique"), noms.index("Ouvre ou met à jour la PR"))
        self.assertEqual(fusion["env"]["PR"], "${{ steps.ouverture.outputs.pr }}")
        # Garde commune (fork, auteur, « compile » exigé sur le sample sans
        # contournement, brouillon) : voir test_garde_fusion_auto.
        self.assertEqual(
            fusion["run"].strip(),
            'bash .github/scripts/garde-fusion-auto.sh steamicc/arduino-steami-sample "$PR" "$APP_SLUG" compile',
        )

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

    def test_open_pr_body_updated_without_push(self):
        # Un croquis passé en norun ne crée aucun commit (pousser=false) mais
        # change le corps : la PR ouverte est mise à jour quand même.
        etapes = {e.get("name"): e for e in flux_robot()["jobs"]["croquis"]["steps"]}
        pousse = str(etapes["Pousse la branche"]["if"])
        self.assertIn("steps.preparation.outputs.pousser == 'true'", pousse)
        self.assertNotIn("steps.pr.outputs.pr", pousse)
        pr = str(etapes["Ouvre ou met à jour la PR"]["if"])
        self.assertIn("!inputs.essai", pr)
        self.assertIn("steps.preparation.outputs.pousser == 'true' || steps.pr.outputs.pr != ''", pr)
        essai = str(etapes["Affiche l'essai à blanc"]["if"])
        self.assertIn("steps.preparation.outputs.pousser == 'true' || steps.pr.outputs.pr != ''", essai)

    def test_not_in_forks_and_serialized(self):
        f = flux_robot()
        self.assertIn("github.repository == 'steamicc/wiki_steami'", str(f["jobs"]["croquis"]["if"]))
        self.assertIs(f["concurrency"]["cancel-in-progress"], False)

    def test_outside_main_only_the_dry_run(self):
        # Lancé à la main depuis une autre branche, essai décoché : le robot
        # porterait dans le sample des pages ni relues ni fusionnées.
        condition = str(flux_robot()["jobs"]["croquis"]["if"])
        self.assertIn("&& (github.ref == 'refs/heads/main' || inputs.essai)", condition)


IMPORT_ESSAYER = "import EssayerExemple from '@site/src/components/EssayerExemple';"
ENTETE_PAGE = "---\ntitle: Premiers programmes\nsidebar_position: 3\n---\n\n"
IMPORTS_TABS = "import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';\n"
IMPORT_TOC = "import TOCInline from '@theme/TOCInline';\n"


def charger_conversion():
    """Chargé à la demande : son absence ne casse que les tests de la conversion."""
    spec_conv = importlib.util.spec_from_file_location(
        "convertir_croquis", SCRIPTS / "convertir-croquis.py"
    )
    module = importlib.util.module_from_spec(spec_conv)
    spec_conv.loader.exec_module(module)
    return module


def inclusion(ident, indent="", eol="\n", meta=""):
    """Bloc converti attendu : inclusion du croquis, puis bouton Téléverser."""
    groupe, nom = ident.split("/")
    reste = f" {meta}" if meta else ""
    return (
        f"{indent}```cpp file=.external/arduino-steami-sample/examples/{groupe}/{nom}/{nom}.ino{reste}{eol}"
        f"{eol}"
        f"{indent}```{eol}"
        f"{eol}"
        f'{indent}<EssayerExemple id="{ident}" source="sample" />{eol}'
    )


class TestConversion(unittest.TestCase):
    """convertir-croquis.py : un bloc `sample=G/N` publié dans le sample devient
    son inclusion ; le reste de la page est identique octet pour octet."""

    def setUp(self):
        self.conv = charger_conversion()

    def convertir(self, texte, publies):
        return self.conv.convertir_texte(texte, set(publies))

    def test_block_replaced_and_import_added_after_frontmatter(self):
        avant = "# Premiers programmes\n\nIntro.\n\n## LED\n\nTexte avant.\n\n"
        apres = "\nTexte après.\n"
        texte = ENTETE_PAGE + avant + bloc_md("sample=PREMIERS/ClignoterLed") + apres
        nouveau, convertis = self.convertir(texte, {"PREMIERS/ClignoterLed"})
        self.assertEqual(
            nouveau,
            ENTETE_PAGE + IMPORT_ESSAYER + "\n\n" + avant + inclusion("PREMIERS/ClignoterLed") + apres,
        )
        self.assertEqual(convertis, ["PREMIERS/ClignoterLed"])

    def test_unpublished_block_left_untouched(self):
        texte = ENTETE_PAGE + "# T\n\n" + bloc_md("sample=PREMIERS/ClignoterLed") + "\nFin.\n"
        nouveau, convertis = self.convertir(texte, {"PREMIERS/Autre"})
        self.assertEqual(nouveau, texte)
        self.assertEqual(convertis, [])

    def test_several_blocks_in_one_section_only_published_ones(self):
        b1 = bloc_md("sample=CARTE/ToutesLesCartes")
        b2 = bloc_md("sample=CARTE/PasEncore", code=CROQUIS_2)
        b3 = bloc_md("sample=CARTE/MesDrivers", code=CROQUIS_2)
        texte = (
            ENTETE_PAGE + "# Carte\n\n## Section\n\nUn.\n\n" + b1 + "\nDeux.\n\n" + b2
            + "\nTrois.\n\n" + b3 + "\nQuatre.\n"
        )
        nouveau, convertis = self.convertir(texte, {"CARTE/ToutesLesCartes", "CARTE/MesDrivers"})
        self.assertEqual(
            nouveau,
            ENTETE_PAGE + IMPORT_ESSAYER + "\n\n# Carte\n\n## Section\n\nUn.\n\n"
            + inclusion("CARTE/ToutesLesCartes") + "\nDeux.\n\n" + b2 + "\nTrois.\n\n"
            + inclusion("CARTE/MesDrivers") + "\nQuatre.\n",
        )
        self.assertEqual(convertis, ["CARTE/ToutesLesCartes", "CARTE/MesDrivers"])
        self.assertEqual(nouveau.count(IMPORT_ESSAYER), 1)

    def test_blocks_in_release_tabs_keep_their_indentation(self):
        entete = "---\ntitle: Écran\n---\n\n" + IMPORTS_TABS + IMPORT_TOC + "\n# Écran\n\n## Jauge\n\n"
        onglet_1 = '<ReleaseTabs>\n<Release releases="v1a v1b">\n\nTexte V1a.\n\n'
        b1 = bloc_md("sample=ECRAN/EcranJauge", indent="  ")
        onglet_2 = '\n  Suite V1a.\n\n</Release>\n<Release releases="v1c">\n\n'
        b2 = bloc_md("sample=ECRAN/EcranGraphe", code=CROQUIS_2)
        fin = "\n</Release>\n</ReleaseTabs>\n\nAprès les onglets.\n"
        texte = entete + onglet_1 + b1 + onglet_2 + b2 + fin
        nouveau, _ = self.convertir(texte, {"ECRAN/EcranJauge", "ECRAN/EcranGraphe"})
        self.assertEqual(
            nouveau,
            "---\ntitle: Écran\n---\n\n" + IMPORTS_TABS + IMPORT_TOC + IMPORT_ESSAYER + "\n"
            + "\n# Écran\n\n## Jauge\n\n" + onglet_1 + inclusion("ECRAN/EcranJauge", indent="  ")
            + onglet_2 + inclusion("ECRAN/EcranGraphe") + fin,
        )

    def test_block_directly_followed_by_text_gets_a_blank_line(self):
        # Sans ligne vide, MDX lirait la balise et le texte comme un même paragraphe.
        texte = ENTETE_PAGE + "# T\n\nTexte collé.\n" + bloc_md("sample=PREMIERS/JouerSon") + "Texte qui suit.\n"
        nouveau, _ = self.convertir(texte, {"PREMIERS/JouerSon"})
        self.assertEqual(
            nouveau,
            ENTETE_PAGE + IMPORT_ESSAYER + "\n\n# T\n\nTexte collé.\n"
            + inclusion("PREMIERS/JouerSon") + "\nTexte qui suit.\n",
        )

    def test_block_at_end_of_page_without_final_newline(self):
        texte = ENTETE_PAGE + "# T\n\n" + bloc_md("sample=PREMIERS/JouerSon").rstrip("\n")
        nouveau, _ = self.convertir(texte, {"PREMIERS/JouerSon"})
        self.assertEqual(
            nouveau,
            ENTETE_PAGE + IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("PREMIERS/JouerSon").rstrip("\n"),
        )

    def test_crlf_page_keeps_crlf_everywhere(self):
        lf = ENTETE_PAGE + "# T\n\nAvant.\n\n" + bloc_md("sample=PREMIERS/LireBoutons") + "\nAprès.\n"
        texte = lf.replace("\n", "\r\n")
        nouveau, convertis = self.convertir(texte, {"PREMIERS/LireBoutons"})
        attendu = (
            ENTETE_PAGE + IMPORT_ESSAYER + "\n\n# T\n\nAvant.\n\n"
            + inclusion("PREMIERS/LireBoutons") + "\nAprès.\n"
        ).replace("\n", "\r\n")
        self.assertEqual(nouveau, attendu)
        self.assertEqual(nouveau.count("\n"), nouveau.count("\r\n"))
        self.assertEqual(convertis, ["PREMIERS/LireBoutons"])

    def test_mixed_line_endings_outside_the_block_are_kept(self):
        texte = (
            ENTETE_PAGE + "# T\r\n\r\nAvant.\n\n" + bloc_md("sample=PREMIERS/LireBoutons")
            + "\r\nAprès.\r\n"
        )
        nouveau, _ = self.convertir(texte, {"PREMIERS/LireBoutons"})
        self.assertTrue(nouveau.endswith("\n" + '<EssayerExemple id="PREMIERS/LireBoutons" source="sample" />\n\r\nAprès.\r\n'))
        self.assertIn("# T\r\n\r\nAvant.\n\n```cpp file=", nouveau)

    def test_import_added_once_with_existing_imports(self):
        texte = (
            "---\ntitle: T\n---\n\n" + IMPORTS_TABS + IMPORT_TOC + "\n<!-- cspell:ignore x -->\n\n# T\n\n"
            + bloc_md("sample=CARTE/A") + "\n" + bloc_md("sample=CARTE/B", code=CROQUIS_2)
        )
        nouveau, _ = self.convertir(texte, {"CARTE/A", "CARTE/B"})
        self.assertTrue(
            nouveau.startswith(
                "---\ntitle: T\n---\n\n" + IMPORTS_TABS + IMPORT_TOC + IMPORT_ESSAYER
                + "\n\n<!-- cspell:ignore x -->\n\n# T\n\n"
            )
        )
        self.assertEqual(nouveau.count(IMPORT_ESSAYER), 1)

    def test_existing_import_not_duplicated(self):
        texte = (
            "---\ntitle: T\n---\n\n" + IMPORT_ESSAYER + "\n\n# T\n\n"
            + bloc_md("sample=CARTE/A") + "\nFin.\n"
        )
        nouveau, _ = self.convertir(texte, {"CARTE/A"})
        self.assertEqual(
            nouveau,
            "---\ntitle: T\n---\n\n" + IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("CARTE/A") + "\nFin.\n",
        )

    def test_import_without_frontmatter_goes_first(self):
        texte = "# T\n\n" + bloc_md("sample=CARTE/A")
        nouveau, _ = self.convertir(texte, {"CARTE/A"})
        self.assertEqual(nouveau, IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("CARTE/A"))

    def test_frontmatter_after_byte_order_mark(self):
        texte = "﻿---\ntitle: T\n---\n\n# T\n\n" + bloc_md("sample=CARTE/A")
        nouveau, _ = self.convertir(texte, {"CARTE/A"})
        self.assertEqual(
            nouveau, "﻿---\ntitle: T\n---\n\n" + IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("CARTE/A")
        )

    def test_frontmatter_not_followed_by_blank_line(self):
        texte = "---\ntitle: T\n---\n# T\n\n" + bloc_md("sample=CARTE/A")
        nouveau, _ = self.convertir(texte, {"CARTE/A"})
        self.assertEqual(
            nouveau, "---\ntitle: T\n---\n\n" + IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("CARTE/A")
        )

    def test_nothing_converted_leaves_page_and_imports_alone(self):
        texte = ENTETE_PAGE + "# T\n\n" + bloc_md("norun") + "\n" + bloc_md()
        self.assertEqual(self.convertir(texte, {"CARTE/A"}), (texte, []))

    def test_second_pass_changes_nothing(self):
        texte = (
            ENTETE_PAGE + "# T\n\n" + bloc_md("sample=CARTE/A") + "\nEntre.\n\n"
            + bloc_md("sample=CARTE/B", code=CROQUIS_2) + "\nFin.\n"
        )
        une_fois, _ = self.convertir(texte, {"CARTE/A", "CARTE/B"})
        deux_fois, convertis = self.convertir(une_fois, {"CARTE/A", "CARTE/B"})
        self.assertEqual(deux_fois, une_fois)
        self.assertEqual(convertis, [])

    def test_norun_unclosed_invalid_and_duplicate_blocks_untouched(self):
        norun = bloc_md("sample=CARTE/A norun")
        invalide = bloc_md("sample=carte/a")
        premier = bloc_md("sample=CARTE/B")
        doublon = bloc_md("sample=CARTE/B", code=CROQUIS_2)
        non_ferme = "```cpp sample=CARTE/C\n" + CROQUIS
        texte = ENTETE_PAGE + "# T\n\n" + norun + "\n" + invalide + "\n" + premier + "\n" + doublon + "\n" + non_ferme
        nouveau, convertis = self.convertir(texte, {"CARTE/A", "carte/a", "CARTE/B", "CARTE/C"})
        self.assertEqual(convertis, ["CARTE/B"])
        self.assertEqual(
            nouveau,
            ENTETE_PAGE + IMPORT_ESSAYER + "\n\n# T\n\n" + norun + "\n" + invalide + "\n"
            + inclusion("CARTE/B") + "\n" + doublon + "\n" + non_ferme,
        )

    def test_other_meta_and_fence_forms(self):
        # ~~~ et ```` sont des délimiteurs aussi ; le bloc converti prend la forme ```cpp.
        tilde = bloc_md("sample=CARTE/A", langage="ino", cloture="~~~")
        quatre = bloc_md('title="Mon croquis" sample=CARTE/B', cloture="````")
        texte = "# T\n\n" + tilde + "\n" + quatre
        nouveau, _ = self.convertir(texte, {"CARTE/A", "CARTE/B"})
        self.assertEqual(
            nouveau,
            IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("CARTE/A") + "\n"
            + inclusion("CARTE/B", meta='title="Mon croquis"'),
        )

    def test_title_line_numbers_and_highlights_kept_after_file(self):
        # La marque sample= ne change pas l'affichage : la conversion non plus.
        meta = 'title="Clignoter" showLineNumbers {1-3}'
        texte = "# T\n\n" + bloc_md('title="Clignoter" showLineNumbers sample=PREMIERS/Clignoter {1-3}')
        nouveau, _ = self.convertir(texte, {"PREMIERS/Clignoter"})
        self.assertEqual(nouveau, IMPORT_ESSAYER + "\n\n# T\n\n" + inclusion("PREMIERS/Clignoter", meta=meta))
        # remark-code-file.js lit file= puis garde le reste de la meta.
        (ligne,) = [l for l in nouveau.splitlines() if "file=" in l]
        self.assertTrue(ligne.startswith("```cpp file=.external/arduino-steami-sample/examples/PREMIERS/"))
        self.assertTrue(ligne.endswith(" " + meta))

    def test_converted_page_passes_both_lints(self):
        texte = (
            ENTETE_PAGE + "# T\n\n## Clignoter\n\n" + bloc_md("sample=PREMIERS/ClignoterLed")
            + "\n## Sons\n\n" + bloc_md("sample=PREMIERS/JouerSon", code=CROQUIS_2) + "\nFin.\n"
        )
        nouveau, _ = self.convertir(texte, {"PREMIERS/ClignoterLed", "PREMIERS/JouerSon"})
        # Plus aucun croquis en ligne : rien à marquer ni en attente.
        self.assertEqual(blocs(nouveau), [])
        spec_ex = importlib.util.spec_from_file_location(
            "check_arduino_examples", SCRIPTS / "check-arduino-examples.py"
        )
        exemples = importlib.util.module_from_spec(spec_ex)
        spec_ex.loader.exec_module(exemples)
        ids = {"PREMIERS/ClignoterLed", "PREMIERS/JouerSon"}
        self.assertEqual(exemples.verifier_sample(ids, {PAGE: nouveau}, []), [])


class TestConversionFichiers(unittest.TestCase):
    """main() de convertir-croquis.py sur un dossier de pages et un sample simulés."""

    def setUp(self):
        self.conv = charger_conversion()
        dossier = tempfile.TemporaryDirectory()
        self.addCleanup(dossier.cleanup)
        self.tmp = Path(dossier.name)
        self.pages = self.tmp / "docs"
        self.sample = self.tmp / "sample"
        self.attente = self.tmp / "a-documenter.txt"
        self.sortie = self.tmp / "sortie"
        (self.pages / "arduino").mkdir(parents=True)
        for ident in ("PREMIERS/ClignoterLed", "CAPTEURS/Distance"):
            groupe, nom = ident.split("/")
            dossier = self.sample / "examples" / groupe / nom
            dossier.mkdir(parents=True)
            (dossier / f"{nom}.ino").write_text(entete() + CROQUIS, encoding="utf-8")

    def lancer(self, *extra):
        sortie = io.StringIO()
        with contextlib.redirect_stdout(sortie), contextlib.redirect_stderr(sortie):
            code = self.conv.main(
                [str(self.sample), "--pages", str(self.pages), "--attente-sample", str(self.attente),
                 "--sortie-github", str(self.sortie), *extra]
            )
        return code, sortie.getvalue()

    def test_converts_pages_and_cleans_waiting_list(self):
        page = self.pages / "arduino" / "premiers.md"
        contenu = (ENTETE_PAGE + "# T\r\n\r\n" + bloc_md("sample=PREMIERS/ClignoterLed")).encode("utf-8")
        page.write_bytes(contenu)
        autre = self.pages / "arduino" / "autre.mdx"
        autre_octets = ("# Autre\r\n\r\n" + bloc_md("sample=PREMIERS/PasEncore")).encode("utf-8")
        autre.write_bytes(autre_octets)
        self.attente.write_bytes(b"BOUTONS/LedsBoutons\r\nPREMIERS/ClignoterLed\r\nBUZZER/Melodie\r\n")
        code, sortie = self.lancer()
        self.assertEqual(code, 0, sortie)
        self.assertIn(inclusion("PREMIERS/ClignoterLed").encode("utf-8"), page.read_bytes())
        self.assertIn(IMPORT_ESSAYER.encode("utf-8"), page.read_bytes())
        # Fins de ligne et page non concernée intactes.
        self.assertTrue(page.read_bytes().startswith(ENTETE_PAGE.encode("utf-8")))
        self.assertEqual(autre.read_bytes(), autre_octets)
        self.assertEqual(self.attente.read_bytes(), b"BOUTONS/LedsBoutons\r\nBUZZER/Melodie\r\n")
        self.assertEqual(
            self.sortie.read_text(encoding="utf-8"), "convertis=PREMIERS/ClignoterLed\ndifferents=\n"
        )
        self.assertIn("PREMIERS/ClignoterLed", sortie)
        self.assertIn("premiers.md", sortie)
        # Deuxième passage : aucun changement.
        octets = page.read_bytes()
        self.sortie.unlink()
        code, _ = self.lancer()
        self.assertEqual(code, 0)
        self.assertEqual(page.read_bytes(), octets)
        self.assertEqual(self.sortie.read_text(encoding="utf-8"), "convertis=\ndifferents=\n")

    def test_waiting_list_untouched_when_not_listed_or_absent(self):
        (self.pages / "arduino" / "p.md").write_text("# P\n\n" + bloc_md("sample=CAPTEURS/Distance"), encoding="utf-8")
        code, sortie = self.lancer()
        self.assertEqual(code, 0, sortie)
        self.assertFalse(self.attente.exists())
        self.attente.write_bytes(b"BUZZER/Melodie")
        (self.pages / "arduino" / "q.md").write_text("# Q\n\n" + bloc_md("sample=PREMIERS/ClignoterLed"), encoding="utf-8")
        code, sortie = self.lancer()
        self.assertEqual(code, 0, sortie)
        self.assertEqual(self.attente.read_bytes(), b"BUZZER/Melodie")

    def test_missing_sample_examples_is_an_error(self):
        code, sortie = self.lancer_sur(self.tmp / "absent")
        self.assertEqual(code, 2)
        self.assertIn("examples", sortie)

    def lancer_sur(self, sample):
        self.sample = sample
        return self.lancer()

    def test_unpublished_block_announced_not_converted(self):
        page = self.pages / "arduino" / "p.md"
        page.write_text("# P\n\n" + bloc_md("sample=CARTE/PasEncore"), encoding="utf-8")
        avant = page.read_bytes()
        code, sortie = self.lancer()
        self.assertEqual(code, 0, sortie)
        self.assertEqual(page.read_bytes(), avant)
        self.assertIn("CARTE/PasEncore", sortie)

    def test_published_sketch_different_from_page_is_announced(self):
        # Croquis corrigé dans la PR du sample (ou nom déjà pris) : converti
        # quand même, mais signalé pour la relecture du diff.
        (self.pages / "arduino" / "p.md").write_text(
            "# P\n\n" + bloc_md("sample=PREMIERS/ClignoterLed") + "\n"
            + bloc_md("sample=CAPTEURS/Distance", code=CROQUIS_2),
            encoding="utf-8",
        )
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            code, sortie = self.lancer()
        self.assertEqual(code, 0, sortie)
        self.assertIn("::warning", sortie)
        self.assertIn("CAPTEURS/Distance", sortie)
        avertissements = [l for l in sortie.splitlines() if "diffère" in l]
        self.assertEqual(len(avertissements), 2)  # texte et annotation, pour Distance seulement
        self.assertTrue(all("CAPTEURS/Distance" in l for l in avertissements))
        # Écrit aussi pour le workflow, qui ouvre alors la PR en brouillon.
        self.assertEqual(
            self.sortie.read_text(encoding="utf-8"),
            "convertis=PREMIERS/ClignoterLed CAPTEURS/Distance\ndifferents=CAPTEURS/Distance\n",
        )

    def test_page_edited_after_the_sample_merge_is_reported(self):
        # Bloc modifié dans le wiki après la fusion de la PR du robot dans le
        # sample : la conversion remet le croquis publié, l'écart est nommé.
        page = self.pages / "arduino" / "p.md"
        page.write_text(
            "# P\n\n" + bloc_md("sample=PREMIERS/ClignoterLed", code="// commentaire corrigé\n" + CROQUIS),
            encoding="utf-8",
        )
        code, sortie = self.lancer()
        self.assertEqual(code, 0, sortie)
        self.assertIn("differents=PREMIERS/ClignoterLed\n", self.sortie.read_text(encoding="utf-8"))
        self.assertNotIn("commentaire corrigé", page.read_text(encoding="utf-8"))
        self.assertIn("perdue", sortie)

    def test_command_line_runs(self):
        (self.pages / "arduino" / "p.md").write_text("# P\n\n" + bloc_md("sample=CAPTEURS/Distance"), encoding="utf-8")
        r = subprocess.run(
            [sys.executable, str(SCRIPTS / "convertir-croquis.py"), str(self.sample),
             "--pages", str(self.pages), "--attente-sample", str(self.attente)],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('<EssayerExemple id="CAPTEURS/Distance" source="sample" />',
                      (self.pages / "arduino" / "p.md").read_text(encoding="utf-8"))


FLUX_EPINGLAGE = RACINE / ".github" / "workflows" / "suivre-croquis-sample.yml"


class TestFluxConversion(unittest.TestCase):
    """Branchement de la conversion dans le robot d'épinglage du sample."""

    def etape(self):
        etapes = yaml.safe_load(FLUX_EPINGLAGE.read_text(encoding="utf-8"))["jobs"]["suivre"]["steps"]
        (e,) = [e for e in etapes if e.get("name") == "Crée la branche et épingle la nouvelle archive"]
        return e

    def code(self):
        return "\n".join(
            l for l in self.etape()["run"].splitlines() if not l.lstrip().startswith("#")
        )

    def test_sources_cloned_at_the_new_tag_outside_the_checkout(self):
        t = self.code()
        self.assertIn('git clone --depth 1 --quiet --branch "$DERNIERE"', t)
        self.assertIn("https://github.com/steamicc/arduino-steami-sample.git", t)
        (clone,) = [l for l in t.splitlines() if "git clone" in l]
        (conversion,) = [l for l in t.splitlines() if "convertir-croquis.py" in l]
        # Hors du dépôt du wiki : git add ne peut pas l'emporter dans le commit.
        self.assertIn('src="$RUNNER_TEMP/', t)
        self.assertTrue(clone.endswith(' "$src"'))
        self.assertIn('convertir-croquis.py "$src"', conversion)

    def test_conversion_between_pin_and_commit(self):
        t = self.code()
        conversion = t.index("python3 scripts/convertir-croquis.py")
        self.assertGreater(conversion, t.index("> exemples-arduino-sample.json"))
        self.assertGreater(conversion, t.index("git clone"))
        self.assertLess(conversion, t.index("git add"))
        self.assertLess(t.index("git add"), t.index("git commit"))

    def test_converted_files_are_committed(self):
        t = self.code()
        ajout = [l for l in t.splitlines() if "git add" in l]
        self.assertEqual(len(ajout), 1)
        for chemin in ("exemples-arduino-sample.json", "docs", "scripts/exemples-arduino-sample-a-documenter.txt"):
            with self.subTest(chemin=chemin):
                self.assertIn(chemin, ajout[0])

    def test_pr_body_mentions_the_conversion(self):
        texte = FLUX_EPINGLAGE.read_text(encoding="utf-8")
        self.assertIn("steps.epinglage.outputs.convertis", texte)
        self.assertIn("--sortie-github", self.code())
        self.assertIn("sample=G/N", texte)
        self.assertNotIn("point d'extension", texte)

    def ouvrir_pr(self, convertis="", differents="", pousse="true"):
        """Lance le script de l'étape « Ouvre la PR » avec un faux gh ; renvoie
        (arguments de gh pr create, corps de la PR)."""
        etapes = yaml.safe_load(FLUX_EPINGLAGE.read_text(encoding="utf-8"))["jobs"]["suivre"]["steps"]
        (etape,) = [e for e in etapes if e.get("name") == "Ouvre la PR"]
        self.assertEqual(etape["env"]["DIFFERENTS"], "${{ steps.epinglage.outputs.differents }}")
        with tempfile.TemporaryDirectory() as d:
            d = Path(d)
            (d / "bin").mkdir()
            gh = d / "bin" / "gh"
            # Faux gh : note ses arguments et recopie le corps de la PR.
            gh.write_text(
                '#!/bin/bash\nprintf "%s\\n" "$@" > "$RUNNER_TEMP/args"\n'
                'while [ $# -gt 0 ]; do [ "$1" = --body-file ] && cp "$2" "$RUNNER_TEMP/corps-pr"; shift; done\n'
                'echo https://github.com/steamicc/wiki_steami/pull/42\n',
                encoding="utf-8",
            )
            gh.chmod(0o755)
            env = {
                "PATH": f"{d / 'bin'}:{os.environ['PATH']}",
                "RUNNER_TEMP": str(d),
                "GITHUB_OUTPUT": str(d / "sortie"),
                "ACTUEL": "v1.0.1", "DERNIERE": "v1.1.0", "ARCHIVE": "steami-exemples-v1.1.0.zip",
                "BRANCHE": "chore/croquis-sample-v1-1-0", "POUSSE": pousse,
                "CONVERTIS": convertis, "DIFFERENTS": differents,
            }
            r = subprocess.run(["bash", "-e", "-c", etape["run"]], env=env,
                               capture_output=True, text=True, check=False)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual((d / "sortie").read_text(encoding="utf-8"), "pr=42\n")
            return (d / "args").read_text(encoding="utf-8").splitlines(), (d / "corps-pr").read_text(encoding="utf-8")

    def test_pr_without_difference_is_not_a_draft(self):
        args, corps = self.ouvrir_pr(convertis="PREMIERS/LireBoutons")
        self.assertNotIn("--draft", args)
        self.assertIn("`PREMIERS/LireBoutons`", corps)
        self.assertNotIn("À vérifier", corps)
        self.assertIn("La fusion automatique (squash) est activée", corps)

    def test_published_sketch_different_from_page_opens_a_draft(self):
        # Modification faite dans le wiki après la fusion de la PR du sample :
        # la PR la nomme et n'est pas fusionnée automatiquement.
        args, corps = self.ouvrir_pr(
            convertis="PREMIERS/ClignoterLed PREMIERS/LireBoutons", differents="PREMIERS/LireBoutons"
        )
        self.assertIn("--draft", args)
        (ecart,) = [l for l in corps.splitlines() if l.startswith("**À vérifier")]
        self.assertIn("`PREMIERS/LireBoutons`", ecart)
        self.assertNotIn("ClignoterLed", ecart)
        self.assertIn("modification du wiki est perdue", ecart)
        self.assertIn("n'est pas activée tant que la PR est en brouillon", corps)
        self.assertNotIn("La fusion automatique (squash) est activée", corps)

    def test_branch_from_a_previous_run_opens_a_draft(self):
        # Écarts de la conversion inconnus : un humain lit le diff d'abord.
        args, corps = self.ouvrir_pr(pousse="false")
        self.assertIn("--draft", args)
        self.assertIn("exécution précédente", corps)

    def test_auto_merge_skipped_for_a_draft(self):
        # La garde commune laisse une PR en brouillon telle quelle
        # (test_garde_fusion_auto.TestGardeExecutee.test_brouillon_laisse_aux_humains).
        etapes = yaml.safe_load(FLUX_EPINGLAGE.read_text(encoding="utf-8"))["jobs"]["suivre"]["steps"]
        (etape,) = [e for e in etapes if e.get("name") == "Active la fusion automatique"]
        self.assertIn("bash .github/scripts/garde-fusion-auto.sh", etape["run"])


if __name__ == "__main__":
    unittest.main()
