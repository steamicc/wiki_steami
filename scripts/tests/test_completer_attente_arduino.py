"""scripts/completer-attente-arduino.py : les exemples de l'index qui ne sont ni
documentés ni en attente sont ajoutés à la liste d'attente, pour que la PR du
robot suivre-exemples-arduino.yml passe la vérification lint:arduino-examples.
Seuls les exemples retirés ou renommés encore cités restent bloquants."""

import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]


def charger(nom, fichier):
    spec = importlib.util.spec_from_file_location(nom, SCRIPTS / fichier)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


completer = charger("completer_attente_arduino", "completer-attente-arduino.py")
check = charger("check_arduino_examples_pour_completer", "check-arduino-examples.py")


def section(ident):
    nom = ident.split("/")[-1]
    return f"## {nom} {{#{nom.lower()}}}\n\nTexte.\n\n<EssayerExemple id=\"{ident}\" />\n"


class Bac:
    def __init__(self, test, index_ids, pages, attente=None):
        self.dir = Path(tempfile.mkdtemp())
        test.addCleanup(lambda: __import__("shutil").rmtree(self.dir, True))
        self.index = self.dir / "index.json"
        self.index.write_text(
            json.dumps({"version": "v0.3.0",
                        "exemples": [{"id": i, "bin": f"{i}.bin"} for i in index_ids]}),
            encoding="utf-8",
        )
        self.pages = self.dir / "docs"
        for chemin, texte in pages.items():
            p = self.pages / chemin
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(texte, encoding="utf-8")
        self.attente = self.dir / "a-documenter.txt"
        if attente is not None:
            self.attente.write_text(attente, encoding="utf-8")
        self.sortie = self.dir / "sortie.txt"

    def lancer(self, *supplementaires):
        sortie = io.StringIO()
        with contextlib.redirect_stdout(sortie):
            code = completer.main([
                "--index", str(self.index), "--pages", str(self.pages),
                "--attente", str(self.attente), "--sortie-github", str(self.sortie),
                *supplementaires,
            ])
        return code, sortie.getvalue(), self.sortie.read_text(encoding="utf-8")

    def verifier(self):
        """Vérification lint:arduino-examples sur le résultat (sans la source sample)."""
        erreurs = io.StringIO()
        with contextlib.redirect_stderr(erreurs), contextlib.redirect_stdout(io.StringIO()):
            code = check.main([
                "--index", str(self.index), "--pages", str(self.pages),
                "--attente", str(self.attente), "--epingle", str(self.dir / "absent.json"),
                "--index-sample", str(self.dir / "absent-sample.json"),
                "--epingle-sample", str(self.dir / "absent-epingle-sample.json"),
                "--attente-sample", str(self.dir / "absente-sample.txt"),
            ])
        return code, erreurs.getvalue()


class TestCompleterAttente(unittest.TestCase):
    def test_nouvel_exemple_ajoute_a_la_liste_et_cite(self):
        bac = Bac(self, ["G/Doc", "G/Attente", "Z/Nouveau", "A/Autre"],
                  {"software/arduino/exemples/g.md": section("G/Doc")}, "G/Attente\n")
        code, journal, sortie = bac.lancer()
        self.assertEqual(code, 0)
        # Lignes existantes gardées telles quelles, nouveaux ids ajoutés à la fin, triés.
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Attente\nA/Autre\nZ/Nouveau\n")
        self.assertEqual(sortie, "ajoutes=A/Autre Z/Nouveau\n")
        self.assertIn("A/Autre", journal)
        self.assertIn("Z/Nouveau", journal)
        # Le résultat passe la vérification.
        self.assertEqual(bac.verifier()[0], 0)

    def test_rien_de_nouveau_liste_inchangee(self):
        bac = Bac(self, ["G/Doc", "G/Attente"],
                  {"software/arduino/exemples/g.md": section("G/Doc")}, "G/Attente")
        code, _, sortie = bac.lancer()
        self.assertEqual(code, 0)
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Attente")
        self.assertEqual(sortie, "ajoutes=\n")

    def test_liste_sans_saut_de_ligne_final(self):
        bac = Bac(self, ["G/Attente", "G/Nouveau"], {}, "G/Attente")
        bac.lancer()
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Attente\nG/Nouveau\n")

    def test_liste_absente_creee(self):
        bac = Bac(self, ["G/Nouveau"], {})
        code, _, sortie = bac.lancer()
        self.assertEqual(code, 0)
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Nouveau\n")
        self.assertEqual(sortie, "ajoutes=G/Nouveau\n")

    def test_balise_dans_une_page_de_n_importe_quel_dossier_compte(self):
        bac = Bac(self, ["G/Doc", "G/Nouveau"], {"hardware/capteurs/g.mdx": section("G/Doc")}, "")
        bac.lancer()
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Nouveau\n")

    def test_balise_du_sample_ne_documente_pas_l_exemple_de_la_bibliotheque(self):
        page = '## Doc\n\n<EssayerExemple id="G/Doc" source="sample" />\n'
        bac = Bac(self, ["G/Doc"], {"software/g.md": page}, "")
        bac.lancer()
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Doc\n")

    def test_exemple_retire_encore_cite_reste_bloquant(self):
        # G/Ancien a été renommé G/Nouveau : la page cite encore l'ancien id.
        bac = Bac(self, ["G/Nouveau", "G/Attente"],
                  {"software/arduino/exemples/g.md": section("G/Ancien")}, "G/Attente\nG/Retire\n")
        code, _, _ = bac.lancer()
        self.assertEqual(code, 0)
        # Le nouvel id est mis en attente, les ids disparus ne sont pas touchés.
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Attente\nG/Retire\nG/Nouveau\n")
        code, erreurs = bac.verifier()
        self.assertEqual(code, 1)
        self.assertIn("« G/Ancien » n'existe pas dans l'index", erreurs)
        self.assertIn("« G/Retire » de la liste des exemples à documenter n'existe pas", erreurs)
        self.assertNotIn("G/Nouveau", erreurs)
        self.assertIn("2 erreur(s) de cohérence", erreurs)

    def test_index_illisible(self):
        bac = Bac(self, [], {})
        bac.index.write_text("pas du json", encoding="utf-8")
        erreurs = io.StringIO()
        with contextlib.redirect_stderr(erreurs):
            code = completer.main(["--index", str(bac.index), "--pages", str(bac.pages),
                                   "--attente", str(bac.attente)])
        self.assertEqual(code, 1)
        self.assertIn("index", erreurs.getvalue())
        self.assertFalse(bac.attente.exists())


def section_sample(ident):
    nom = ident.split("/")[-1]
    return (f"## {nom}\n\n```cpp file=.external/arduino-steami-sample/examples/{ident}/{nom}.ino\n```\n\n"
            f'<EssayerExemple id="{ident}" source="sample" />\n')


class TestCompleterAttenteSample(unittest.TestCase):
    """Même règle pour les croquis du sample (--source sample)."""

    def verifier_sample(self, bac):
        erreurs = io.StringIO()
        vide = bac.dir / "index-bibliotheque.json"
        vide.write_text(json.dumps({"version": "v0", "exemples": []}), encoding="utf-8")
        with contextlib.redirect_stderr(erreurs), contextlib.redirect_stdout(io.StringIO()):
            code = check.main([
                "--index", str(vide), "--pages", str(bac.pages),
                "--attente", str(bac.dir / "absente.txt"), "--epingle", str(bac.dir / "absent-e.json"),
                "--index-sample", str(bac.index), "--attente-sample", str(bac.attente),
                "--epingle-sample", str(bac.dir / "absent-es.json"),
            ])
        return code, erreurs.getvalue()

    def test_nouveau_croquis_ble_reference_xiaomi_mis_en_attente(self):
        bac = Bac(self, ["BLE/ReferenceXiaomi", "G/Doc", "G/Attente"],
                  {"software/arduino/sample.md": section_sample("G/Doc")}, "G/Attente\n")
        code, journal, sortie = bac.lancer("--source", "sample")
        self.assertEqual(code, 0)
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Attente\nBLE/ReferenceXiaomi\n")
        self.assertEqual(sortie, "ajoutes=BLE/ReferenceXiaomi\n")
        self.assertIn("BLE/ReferenceXiaomi", journal)
        self.assertEqual(self.verifier_sample(bac)[0], 0)

    def test_balise_de_la_bibliotheque_ne_documente_pas_le_croquis_du_sample(self):
        bac = Bac(self, ["G/Doc"], {"software/g.md": section("G/Doc")}, "")
        bac.lancer("--source", "sample")
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Doc\n")

    def test_croquis_retire_encore_cite_reste_bloquant(self):
        bac = Bac(self, ["G/Nouveau"],
                  {"software/g.md": section_sample("G/Ancien")}, "G/Retire\n")
        code, _, _ = bac.lancer("--source", "sample")
        self.assertEqual(code, 0)
        self.assertEqual(bac.attente.read_text(encoding="utf-8"), "G/Retire\nG/Nouveau\n")
        code, erreurs = self.verifier_sample(bac)
        self.assertEqual(code, 1)
        self.assertIn("G/Ancien", erreurs)
        self.assertIn("G/Retire", erreurs)
        self.assertNotIn("G/Nouveau", erreurs)

    def test_source_inconnue_refusee(self):
        bac = Bac(self, [], {})
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            bac.lancer("--source", "autre")


if __name__ == "__main__":
    unittest.main()
