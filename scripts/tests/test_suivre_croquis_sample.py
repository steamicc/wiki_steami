"""Contrôles du workflow suivre-croquis-sample.yml (jumeau de suivre-exemples-arduino.yml)."""

import re
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parents[2]
FLUX = RACINE / ".github" / "workflows" / "suivre-croquis-sample.yml"
JUMEAU = RACINE / ".github" / "workflows" / "suivre-exemples-arduino.yml"
BRANCHE_OK = re.compile(r"^(chore|feat|fix|docs|ci|refactor)\/([a-z0-9]+-)*[a-z0-9]+$")


def texte():
    return FLUX.read_text(encoding="utf-8")


def flux():
    return yaml.safe_load(texte())


def test_le_workflow_existe_et_est_du_yaml_valide():
    assert FLUX.is_file()
    assert flux()["name"] == "suivre-croquis-sample"


def test_cible_le_depot_sample_et_son_fichier_d_epinglage():
    t = texte()
    assert "repos/steamicc/arduino-steami-sample/releases/latest" in t
    assert "releases/download/$DERNIERE/$ARCHIVE" in t
    assert "steamicc/arduino-steami-sample/releases/download" in t
    assert "exemples-arduino-sample.json" in t
    # Aucune trace du paquet ni du fichier d'épinglage du jumeau.
    assert "steamicc/arduino-steami/" not in t
    assert not re.search(r"exemples-arduino\.json", t)


def test_branche_conforme_a_la_regle_du_depot():
    t = texte()
    assert 'branche="chore/croquis-sample-${derniere//./-}"' in t
    assert BRANCHE_OK.match("chore/croquis-sample-v1-2-3")


def test_titres_et_commit_en_francais_conventionnel():
    t = texte()
    assert "chore(configs): croquis du sample $DERNIERE" in t
    assert "exemples Arduino $DERNIERE" not in t


def test_point_d_extension_avant_le_commit():
    t = texte()
    marque = "point d'extension : conversion des croquis en ligne (tâche 14)"
    assert marque in t
    assert t.index(marque) < t.index("git commit -m")
    assert t.index(marque) > t.index("> exemples-arduino-sample.json")


def test_memes_controles_que_le_jumeau():
    t = texte()
    for garde in (
        "isCrossRepository",
        "sha256:$sha",
        'git push origin "$BRANCHE"',
        "gh pr merge \"$PR\" --auto --squash",
        "required_status_checks",
        "github.repository == 'steamicc/wiki_steami'",
        "RELEASE_APP_SECRET",
    ):
        assert garde in t


def test_concurrence_distincte_de_celle_du_jumeau():
    f = flux()
    j = yaml.safe_load(JUMEAU.read_text(encoding="utf-8"))
    assert f["concurrency"]["group"] != j["concurrency"]["group"]
    # PyYAML lit « on » comme True.
    assert "workflow_dispatch" in f[True]
    assert "schedule" in f[True]
