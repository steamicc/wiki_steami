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
  if [ "$a" = "%s" ]; then args+=("$FAUX_GIT_DEPOT"); else args+=("$a"); fi
done
exec "%s" "${args[@]}"
""" % (REPO_URL, REAL_GIT)


def archive_de_test():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("index.json", json.dumps({"version": VERSION, "exemples": []}))
        z.writestr("exemple/exemple.ino.bin", b"binaire")
    return buf.getvalue()


@unittest.skipUnless(REAL_GIT and shutil.which("flock"), "git et flock requis")
class TestFetchArduinoExamples(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.work = self.tmp / "work"
        (self.work / "scripts").mkdir(parents=True)
        shutil.copy(SCRIPT, self.work / "scripts" / SCRIPT.name)

        data = archive_de_test()
        self.archive = self.tmp / "archive.zip"
        self.archive.write_bytes(data)
        (self.work / "exemples-arduino.json").write_text(
            json.dumps({"version": VERSION, "sha256": hashlib.sha256(data).hexdigest()})
        )

        self.depot = self.tmp / "depot"
        self.depot.mkdir()
        (self.depot / "README.md").write_text("arduino-steami de test\n")
        git = [REAL_GIT, "-C", str(self.depot), "-c", "user.name=t", "-c", "user.email=t@t"]
        subprocess.run([REAL_GIT, "init", "-q", str(self.depot)], check=True)
        subprocess.run(git + ["add", "."], check=True)
        subprocess.run(git + ["commit", "-q", "-m", "init"], check=True)
        subprocess.run(git + ["tag", VERSION], check=True)

        self.bin = self.tmp / "bin"
        self.bin.mkdir()
        for nom, contenu in (("curl", FAUX_CURL), ("git", FAUX_GIT)):
            (self.bin / nom).write_text(contenu)
            (self.bin / nom).chmod(0o755)
        self.journal = self.tmp / "curl.log"

    def env(self, **extra):
        return dict(
            os.environ,
            PATH=f"{self.bin}{os.pathsep}{os.environ['PATH']}",
            FAUX_CURL_JOURNAL=str(self.journal),
            FAUX_CURL_ARCHIVE=str(self.archive),
            FAUX_GIT_DEPOT=f"file://{self.depot}",
            **extra,
        )

    def lancer(self, **extra):
        return subprocess.Popen(
            ["bash", f"scripts/{SCRIPT.name}"],
            cwd=self.work,
            env=self.env(**extra),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

    def executer(self, **extra):
        p = self.lancer(**extra)
        out, err = p.communicate(timeout=60)
        return p.returncode, out, err

    def en_parallele(self, **extra):
        procs = [self.lancer(FAUX_CURL_PAUSE="1", **extra) for _ in range(2)]
        return [(p, *p.communicate(timeout=60)) for p in procs]

    def telechargements(self):
        return len(self.journal.read_text().splitlines()) if self.journal.exists() else 0

    def verifier_installation(self):
        dest = self.work / "static/exemples-arduino"
        self.assertEqual(sorted(os.listdir(dest)), [".sha256", "exemple", "index.json"])
        self.assertEqual(json.loads((dest / "index.json").read_text())["version"], VERSION)
        src = self.work / ".external/arduino-steami"
        tag = subprocess.run(
            [REAL_GIT, "-C", str(src), "describe", "--tags", "--exact-match"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        self.assertEqual(tag, VERSION)
        self.assertEqual(sorted(os.listdir(src)), [".git", "README.md"])
        restes = [n for n in os.listdir(self.work / ".external") if n.startswith(".fetch-")]
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


if __name__ == "__main__":
    unittest.main()
