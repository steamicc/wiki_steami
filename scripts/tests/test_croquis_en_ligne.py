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


if __name__ == "__main__":
    unittest.main()
