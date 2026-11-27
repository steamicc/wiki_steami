"""Tests de fetch-arduino-examples.sh sans réseau.

Un faux curl (copie d'une archive de test, avec une pause pour élargir la
fenêtre de concurrence) et une enveloppe de git (clone d'un dépôt local à la
place de GitHub) sont placés en tête du PATH.
"""

import fcntl
import hashlib
import io
import json
import os
import shutil
import subprocess
import tempfile
import time
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "fetch-arduino-examples.sh"
VERSION = "v9.8.7"
REPO_URL = "https://github.com/steamicc/arduino-steami.git"
SAMPLE_URL = "https://github.com/steamicc/arduino-steami-sample.git"
REAL_GIT = shutil.which("git")

FAUX_CURL = """#!/bin/bash
# Faux curl : note l'appel, attend, puis copie l'archive de test vers -o.
out=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    *) shift ;;
  esac
done
echo appel >> "$FAUX_CURL_JOURNAL"
sleep "${FAUX_CURL_PAUSE:-0}"
cp "$FAUX_CURL_ARCHIVE" "$out"
"""

FAUX_GIT = """#!/bin/bash
# Enveloppe de git : clone le dépôt local à la place de GitHub.
args=()
for a in "$@"; do
  if [ "$a" = "%s" ]; then args+=("$FAUX_GIT_DEPOT")
  elif [ "$a" = "%s" ]; then args+=("$FAUX_GIT_DEPOT_SAMPLE")
  else args+=("$a"); fi
done
exec "%s" "${args[@]}"
""" % (REPO_URL, SAMPLE_URL, REAL_GIT)


def archive_de_test(index=None, fichiers=("exemple/exemple.ino.bin",)):
    """Archive de test ; index=None omet index.json, sinon son contenu."""
    if index is ...:
        index = {"version": VERSION, "exemples": []}
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        if index is not None:
            z.writestr("index.json", json.dumps(index))
        for nom in fichiers:
            z.writestr(nom, b"binaire")
    return buf.getvalue()


@unittest.skipUnless(REAL_GIT and shutil.which("flock"), "git et flock requis")
class TestFetchArduinoExamples(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.work = self.tmp / "work"
        (self.work / "scripts").mkdir(parents=True)
        shutil.copy(SCRIPT, self.work / "scripts" / SCRIPT.name)

        data = archive_de_test(...)
        self.archive = self.tmp / "archive.zip"
        self.archive.write_bytes(data)
        self.sha = hashlib.sha256(data).hexdigest()
        (self.work / "exemples-arduino.json").write_text(
            json.dumps({"version": VERSION, "sha256": self.sha})
        )
        (self.work / "exemples-arduino-sample.json").write_text(
            json.dumps({"version": VERSION, "sha256": self.sha})
        )

        self.depot = self.creer_depot("depot", "arduino-steami de test\n")
        self.depot_sample = self.creer_depot(
            "depot-sample", "arduino-steami-sample de test\n"
        )

        self.bin = self.tmp / "bin"
        self.bin.mkdir()
        for nom, contenu in (("curl", FAUX_CURL), ("git", FAUX_GIT)):
            (self.bin / nom).write_text(contenu)
            (self.bin / nom).chmod(0o755)
        self.journal = self.tmp / "curl.log"

    def creer_depot(self, nom, readme):
        depot = self.tmp / nom
        depot.mkdir()
        (depot / "README.md").write_text(readme)
        git = [REAL_GIT, "-C", str(depot), "-c", "user.name=t", "-c", "user.email=t@t"]
        subprocess.run([REAL_GIT, "init", "-q", str(depot)], check=True)
        subprocess.run(git + ["add", "."], check=True)
        subprocess.run(git + ["commit", "-q", "-m", "init"], check=True)
        subprocess.run(git + ["tag", VERSION], check=True)
        return depot

    def env(self, **extra):
        return dict(
            os.environ,
            PATH=f"{self.bin}{os.pathsep}{os.environ['PATH']}",
            FAUX_CURL_JOURNAL=str(self.journal),
            FAUX_CURL_ARCHIVE=str(self.archive),
            FAUX_GIT_DEPOT=f"file://{self.depot}",
            FAUX_GIT_DEPOT_SAMPLE=f"file://{self.depot_sample}",
            **extra,
        )

    def lancer(self, *args, **extra):
        return subprocess.Popen(
            ["bash", f"scripts/{SCRIPT.name}", *args],
            cwd=self.work,
            env=self.env(**extra),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def executer(self, *args, **extra):
        p = self.lancer(*args, **extra)
        out, err = p.communicate(timeout=60)
        return p.returncode, out, err

    def en_parallele(self, **extra):
        procs = [self.lancer(FAUX_CURL_PAUSE="1", **extra) for _ in range(2)]
        return [(p, *p.communicate(timeout=60)) for p in procs]

    def telechargements(self):
        return (
            len(self.journal.read_text().splitlines()) if self.journal.exists() else 0
        )

    def verifier_installation(self):
        dest = self.work / "static/exemples-arduino"
        self.assertEqual(sorted(os.listdir(dest)), [".sha256", "exemple", "index.json"])
        self.assertEqual(
            json.loads((dest / "index.json").read_text())["version"], VERSION
        )
        src = self.work / ".external/arduino-steami"
        tag = subprocess.run(
            [REAL_GIT, "-C", str(src), "describe", "--tags", "--exact-match"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        self.assertEqual(tag, VERSION)
        self.assertEqual(sorted(os.listdir(src)), [".git", "README.md"])
        restes = [
            n for n in os.listdir(self.work / ".external") if n.startswith(".fetch-")
        ]
        self.assertEqual(restes, [])

    def test_installe_puis_deja_present(self):
        code, _, err = self.executer()
        self.assertEqual(code, 0, err)
        self.verifier_installation()
        code, out, err = self.executer()
        self.assertEqual(code, 0, err)
        self.assertIn("déjà présents", out)
        self.assertEqual(self.telechargements(), 1)

    def test_deux_executions_forcees_simultanees(self):
        self.assertEqual(self.executer()[0], 0)
        res = self.en_parallele(FORCER_EXEMPLES_ARDUINO="1")
        for p, _, err in res:
            self.assertEqual(p.returncode, 0, err)
        self.assertEqual(sum("attente" in out for _, out, _ in res), 1)
        self.assertEqual(self.telechargements(), 3)
        self.verifier_installation()

    def test_deux_executions_simultanees_un_seul_telechargement(self):
        res = self.en_parallele()
        for p, _, err in res:
            self.assertEqual(p.returncode, 0, err)
        sorties = [out for _, out, _ in res]
        self.assertEqual(sum("attente" in out for out in sorties), 1)
        self.assertEqual(sum("déjà présents" in out for out in sorties), 1)
        self.assertEqual(self.telechargements(), 1)
        self.verifier_installation()

    def test_delai_du_verrou_depasse(self):
        (self.work / ".external").mkdir()
        with open(self.work / ".external/.verrou-exemples-arduino", "w") as verrou:
            fcntl.flock(verrou, fcntl.LOCK_EX)
            debut = time.monotonic()
            code, _, err = self.executer(ATTENTE_VERROU_EXEMPLES_ARDUINO="1")
        self.assertEqual(code, 1)
        self.assertIn("toujours pris", err)
        self.assertLess(time.monotonic() - debut, 30)
        self.assertEqual(self.telechargements(), 0)
        self.assertFalse((self.work / "static/exemples-arduino").exists())

    # --- source « sample » (arduino-steami-sample) ---

    def test_sample_installe_puis_deja_present(self):
        code, out, err = self.executer("sample")
        self.assertEqual(code, 0, err)
        self.assertIn("arduino-steami-sample", out)
        dest = self.work / "static/exemples-arduino-sample"
        self.assertEqual(sorted(os.listdir(dest)), [".sha256", "exemple", "index.json"])
        self.assertEqual(
            json.loads((dest / "index.json").read_text())["version"], VERSION
        )
        src = self.work / ".external/arduino-steami-sample"
        self.assertEqual(
            (src / "README.md").read_text(), "arduino-steami-sample de test\n"
        )
        tag = subprocess.run(
            [REAL_GIT, "-C", str(src), "describe", "--tags", "--exact-match"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        self.assertEqual(tag, VERSION)
        self.assertFalse((self.work / "static/exemples-arduino").exists())
        code, out, err = self.executer("sample")
        self.assertEqual(code, 0, err)
        self.assertIn("déjà présents", out)
        self.assertEqual(self.telechargements(), 1)

    def test_sample_sha256_different_laisse_l_existant_intact(self):
        self.assertEqual(self.executer("sample")[0], 0)
        dest = self.work / "static/exemples-arduino-sample"
        avant = (dest / "index.json").read_text()
        (self.work / "exemples-arduino-sample.json").write_text(
            json.dumps({"version": VERSION, "sha256": "0" * 64})
        )
        code, _, err = self.executer("sample", FORCER_EXEMPLES_ARDUINO="1")
        self.assertEqual(code, 1)
        self.assertIn("sha256", err)
        self.assertIn("exemples-arduino-sample.json", err)
        self.assertEqual((dest / "index.json").read_text(), avant)
        self.assertTrue(
            (self.work / ".external/arduino-steami-sample/README.md").exists()
        )

    def test_sample_sha256_different_sans_installation_prealable(self):
        (self.work / "exemples-arduino-sample.json").write_text(
            json.dumps({"version": VERSION, "sha256": "0" * 64})
        )
        code, _, err = self.executer("sample")
        self.assertEqual(code, 1)
        self.assertFalse((self.work / "static/exemples-arduino-sample").exists())
        self.assertFalse((self.work / ".external/arduino-steami-sample").exists())

    def test_les_deux_sources_ne_s_ecrasent_pas(self):
        self.assertEqual(self.executer()[0], 0)
        self.assertEqual(self.executer("sample")[0], 0)
        self.verifier_installation()
        self.assertTrue(
            (self.work / "static/exemples-arduino-sample/index.json").exists()
        )
        self.assertEqual(
            (self.work / ".external/arduino-steami-sample/README.md").read_text(),
            "arduino-steami-sample de test\n",
        )
        # Chaque source reste à jour sans retélécharger l'autre.
        for args in ((), ("sample",)):
            code, out, err = self.executer(*args)
            self.assertEqual(code, 0, err)
            self.assertIn("déjà présents", out)
        self.assertEqual(self.telechargements(), 2)

    def epingler_archive(self, source, index, fichiers=("exemple/exemple.ino.bin",)):
        """Remplace l'archive servie par le faux curl et l'épingle pour `source`."""
        data = archive_de_test(index, fichiers)
        self.archive.write_bytes(data)
        pin = (
            "exemples-arduino-sample.json"
            if source == "sample"
            else "exemples-arduino.json"
        )
        (self.work / pin).write_text(
            json.dumps({"version": VERSION, "sha256": hashlib.sha256(data).hexdigest()})
        )

    def verifier_archive_refusee(
        self, source, index, message, fichiers=("exemple/exemple.ino.bin",)
    ):
        self.epingler_archive(source, index, fichiers)
        code, _, err = self.executer(*([source] if source == "sample" else []))
        self.assertEqual(code, 1)
        self.assertIn(message, err)
        dossier = (
            "exemples-arduino-sample" if source == "sample" else "exemples-arduino"
        )
        depot = "arduino-steami-sample" if source == "sample" else "arduino-steami"
        self.assertFalse((self.work / "static" / dossier).exists())
        self.assertFalse((self.work / ".external" / depot).exists())

    def test_archive_sans_index_refusee(self):
        for source in ("bibliotheque", "sample"):
            with self.subTest(source=source):
                self.verifier_archive_refusee(source, None, "index.json absent")

    def test_archive_dont_version_differe_du_tag_refusee(self):
        for source in ("bibliotheque", "sample"):
            with self.subTest(source=source):
                self.verifier_archive_refusee(
                    source, {"version": "v0.0.1", "exemples": []}, "v0.0.1"
                )

    def test_archive_avec_index_illisible_refusee(self):
        for source in ("bibliotheque", "sample"):
            with self.subTest(source=source):
                self.verifier_archive_refusee(source, [1, 2], "version")

    def test_archive_dont_les_chemins_ne_correspondent_pas_a_index_refusee(self):
        def entree(id="CAPTEURS/Distance", bin="CAPTEURS/Distance.bin"):
            return {"version": VERSION, "exemples": [{"id": id, "bin": bin}]}

        cas = [
            (
                "id non conforme",
                entree("capteurs/distance", "capteurs/distance.bin"),
                ("capteurs/distance.bin",),
                "id non conforme",
            ),
            (
                "id avec ..",
                entree("../X/Y", "../X/Y.bin"),
                ("X/Y.bin",),
                "id non conforme",
            ),
            (
                "bin différent de id.bin",
                entree(bin="CAPTEURS/Distance/Distance.bin"),
                ("CAPTEURS/Distance/Distance.bin",),
                "au lieu de CAPTEURS/Distance.bin",
            ),
            (
                "bin absent de l'archive",
                entree(),
                ("exemples/CAPTEURS/Distance.bin",),
                "binaire absent",
            ),
            (
                "exemples pas une liste",
                {"version": VERSION, "exemples": {}},
                (),
                "pas une liste",
            ),
        ]
        for source in ("bibliotheque", "sample"):
            for nom, index, fichiers, message in cas:
                with self.subTest(source=source, cas=nom):
                    self.verifier_archive_refusee(source, index, message, fichiers)

    def test_archive_aux_chemins_conformes_acceptee(self):
        index = {
            "version": VERSION,
            "exemples": [{"id": "CAPTEURS/Distance", "bin": "CAPTEURS/Distance.bin"}],
        }
        for source in ("bibliotheque", "sample"):
            with self.subTest(source=source):
                self.epingler_archive(source, index, ("CAPTEURS/Distance.bin",))
                code, _, err = self.executer(*([source] if source == "sample" else []))
                self.assertEqual(code, 0, err)

    def test_source_inconnue(self):
        code, _, err = self.executer("autre")
        self.assertEqual(code, 2)
        self.assertIn("Usage", err)


if __name__ == "__main__":
    unittest.main()
