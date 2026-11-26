import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "check-arduino-examples.py"
spec = importlib.util.spec_from_file_location("check_arduino_examples", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
verifier = module.verifier

PAGE = Path("docs/software/arduino/exemples/vl53l1x.md")
ID = "VL53L1X/GestureDetection"


def page(titre="## GestureDetection {#gesturedetection}", ident=ID):
    return f'{titre}\n\nTexte.\n\n<EssayerExemple id="{ident}" />\n'


class TestVerifier(unittest.TestCase):
    def test_all_documented_ok(self):
        self.assertEqual(verifier({ID}, {PAGE: page()}, []), [])

    def test_unknown_id(self):
        erreurs = verifier({ID}, {PAGE: page(ident="VL53L1X/Inconnu")}, [ID])
        self.assertTrue(any("VL53L1X/Inconnu" in e for e in erreurs))

    def test_missing_anchor(self):
        erreurs = verifier({ID}, {PAGE: page(titre="## GestureDetection")}, [])
        self.assertTrue(any(ID in e for e in erreurs))

    def test_wrong_anchor(self):
        erreurs = verifier({ID}, {PAGE: page(titre="## GestureDetection {#GestureDetection}")}, [])
        self.assertTrue(any(ID in e and "gesturedetection" in e for e in erreurs))

    def test_snake_case_anchor_kept(self):
        ident = "APDS9960/ambient_light"
        texte = page(titre="## ambient_light {#ambient_light}", ident=ident)
        self.assertEqual(verifier({ident}, {PAGE: texte}, []), [])

    def test_undocumented_not_waiting(self):
        erreurs = verifier({ID, "X/Autre"}, {PAGE: page()}, [])
        self.assertTrue(any("X/Autre" in e for e in erreurs))

    def test_documented_still_waiting(self):
        erreurs = verifier({ID}, {PAGE: page()}, [ID])
        self.assertTrue(any(ID in e for e in erreurs))

    def test_waiting_unknown_id(self):
        erreurs = verifier({ID}, {PAGE: page()}, ["Z/Fantome"])
        self.assertTrue(any("Z/Fantome" in e for e in erreurs))

    def test_single_quotes_accepted(self):
        texte = page().replace(f'"{ID}"', f"'{ID}'")
        self.assertEqual(verifier({ID}, {PAGE: texte}, []), [])


if __name__ == "__main__":
    unittest.main()
