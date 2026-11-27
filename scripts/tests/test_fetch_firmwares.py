import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "fetch-firmwares.sh"

MPY_VERSION = "v9.8.7"
MPY_BIN = b"micropython-firmware-fixture"
DAP_RELEASE = "2026-11-25.3"
DAP_BIN = b"daplink-firmware-fixture"


def sha(data):
    return hashlib.sha256(data).hexdigest()


class TestFetchFirmwares(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.work = self.tmp / "work"
        (self.work / "scripts").mkdir(parents=True)
        shutil.copy(SCRIPT, self.work / "scripts" / "fetch-firmwares.sh")
        self.base = self.tmp / "base"
        mpy = self.base / "steamicc/micropython-steami-lib/releases/download" / MPY_VERSION
        dap = self.base / "steamicc/DAPLink/releases/download" / DAP_RELEASE
        mpy.mkdir(parents=True)
        dap.mkdir(parents=True)
        self.mpy_file = mpy / f"steami-micropython-firmware-{MPY_VERSION}.bin"
        self.dap_file = dap / "stm32f103xb_steami32_if_crc.bin"
        self.mpy_file.write_bytes(MPY_BIN)
        self.dap_file.write_bytes(DAP_BIN)
        self.pin(sha(MPY_BIN), sha(DAP_BIN))

    def pin(self, mpy_sha, dap_sha):
        (self.work / "micropython.json").write_text(
            json.dumps({"version": MPY_VERSION, "sha256": mpy_sha})
        )
        (self.work / "daplink.json").write_text(
            json.dumps({"release": DAP_RELEASE, "sha256": dap_sha})
        )

    def run_script(self, **extra):
        env = dict(os.environ, FIRMWARES_URL_BASE=f"file://{self.base}", **extra)
        return subprocess.run(
            ["bash", "scripts/fetch-firmwares.sh"],
            cwd=self.work,
            env=env,
            capture_output=True,
            text=True,
        )

    def test_sha_incorrect_echoue_sans_rien_remplacer(self):
        ok = self.run_script()
        self.assertEqual(ok.returncode, 0, ok.stderr)
        avant = (self.work / "static/micropython/firmware.bin").read_bytes()
        self.pin("0" * 64, sha(DAP_BIN))
        res = self.run_script()
        self.assertNotEqual(res.returncode, 0)
        self.assertIn("sha256", res.stderr)
        self.assertEqual((self.work / "static/micropython/firmware.bin").read_bytes(), avant)

    def test_sha_incorrect_sans_cible_ne_cree_rien(self):
        self.pin("0" * 64, sha(DAP_BIN))
        res = self.run_script()
        self.assertNotEqual(res.returncode, 0)
        self.assertFalse((self.work / "static/micropython").exists())

    def test_firmware_et_index_ecrits(self):
        res = self.run_script()
        self.assertEqual(res.returncode, 0, res.stderr)
        dest = self.work / "static/micropython"
        self.assertEqual((dest / "firmware.bin").read_bytes(), MPY_BIN)
        self.assertEqual(
            json.loads((dest / "index.json").read_text()),
            {"version": MPY_VERSION, "taille": len(MPY_BIN), "sha256": sha(MPY_BIN)},
        )

    def test_daplink_json_au_format_codespace(self):
        res = self.run_script()
        self.assertEqual(res.returncode, 0, res.stderr)
        dest = self.work / "static/daplink"
        self.assertEqual((dest / "firmware.bin").read_bytes(), DAP_BIN)
        self.assertEqual(
            json.loads((dest / "firmware.json").read_text()),
            {
                "release": DAP_RELEASE,
                "numero": 3,
                "date": 20261125,
                "taille": len(DAP_BIN),
                "sha256": sha(DAP_BIN),
            },
        )

    def test_rien_retelecharge_si_deja_present(self):
        self.assertEqual(self.run_script().returncode, 0)
        self.mpy_file.unlink()
        self.dap_file.unlink()
        res = self.run_script()
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn("déjà présent", res.stdout)

    def test_forcer_retelecharge(self):
        self.assertEqual(self.run_script().returncode, 0)
        self.mpy_file.unlink()
        res = self.run_script(FORCER_FIRMWARES="1")
        self.assertNotEqual(res.returncode, 0)


if __name__ == "__main__":
    unittest.main()
