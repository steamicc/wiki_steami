#!/bin/bash
# Récupère les deux firmwares épinglés servis par le wiki :
#   - MicroPython (release micropython-steami-lib, micropython.json)
#     -> static/micropython/{firmware.bin,index.json}
#   - DAPLink (release steamicc/DAPLink, daplink.json)
#     -> static/daplink/{firmware.bin,firmware.json} (format du Codespace)
# Les fichiers téléchargés sont traités comme non fiables : téléchargement et
# sha256 se font dans un dossier de préparation de .external/ (même système de
# fichiers que les cibles, ignoré par git et par Docusaurus), puis la cible est
# échangée par renommage. Une erreur ne remplace donc jamais l'existant.
#
# Rien n'est téléchargé quand le firmware est déjà là pour la version épinglée
# (sha256 du .bin égal à celui épinglé). FORCER_FIRMWARES=1 force le
# téléchargement. FIRMWARES_URL_BASE (défaut https://github.com) remplace
# l'hôte des releases, pour les tests.

set -euo pipefail

BASE="${FIRMWARES_URL_BASE:-https://github.com}"
FORCE="${FORCER_FIRMWARES:-0}"

mkdir -p .external static
TMP=$(mktemp -d .external/.fetch-XXXXXX)
trap 'rm -rf "$TMP"' EXIT

# firmware_a_jour DEST SHA256 : le .bin présent a le sha256 épinglé et l'index existe.
firmware_a_jour() {
  local dest="$1" sha="$2" json="$3"
  [ "$FORCE" != "1" ] && [ -f "$dest/firmware.bin" ] && [ -f "$dest/$json" ] \
    && [ "$(sha256sum "$dest/firmware.bin" | cut -d' ' -f1)" = "$sha" ] \
    && [ "$(node -p "require('./$dest/$json').sha256" 2>/dev/null)" = "$sha" ]
}

# telecharger NOM URL SHA256 PIN SORTIE
telecharger() {
  local nom="$1" url="$2" sha="$3" pin="$4" out="$5"
  echo "Téléchargement du firmware ${nom}..."
  if ! curl -fL --retry 3 --silent --show-error -o "$out" "$url"; then
    echo "Erreur : firmware ${nom} introuvable (${url})" >&2
    exit 1
  fi
  if ! echo "${sha}  ${out}" | sha256sum -c --status -; then
    echo "Erreur : sha256 du firmware ${nom} différent de celui épinglé dans ${pin}" >&2
    exit 1
  fi
}

# installer DEST STAGE : échange par renommage.
installer() {
  local dest="$1" stage="$2"
  mkdir -p "$(dirname "$dest")"
  if [ -e "$dest" ]; then mv "$dest" "$stage.old"; fi
  mv "$stage" "$dest"
}

# --- MicroPython ---
MPY_VERSION=$(node -p "require('./micropython.json').version")
MPY_SHA=$(node -p "require('./micropython.json').sha256")
MPY_DEST="static/micropython"

if firmware_a_jour "$MPY_DEST" "$MPY_SHA" index.json; then
  echo "Firmware MicroPython ${MPY_VERSION} déjà présent dans $MPY_DEST (FORCER_FIRMWARES=1 pour le retélécharger)"
else
  mkdir -p "$TMP/mpy"
  telecharger "MicroPython ${MPY_VERSION}" \
    "${BASE}/steamicc/micropython-steami-lib/releases/download/${MPY_VERSION}/steami-micropython-firmware-${MPY_VERSION}.bin" \
    "$MPY_SHA" micropython.json "$TMP/mpy/firmware.bin"
  printf '{"version": "%s", "taille": %s, "sha256": "%s"}\n' \
    "$MPY_VERSION" "$(stat -c %s "$TMP/mpy/firmware.bin")" "$MPY_SHA" > "$TMP/mpy/index.json"
  installer "$MPY_DEST" "$TMP/mpy"
  echo "Firmware MicroPython ${MPY_VERSION} prêt dans $MPY_DEST"
fi

# --- DAPLink ---
DAP_RELEASE=$(node -p "require('./daplink.json').release")
DAP_SHA=$(node -p "require('./daplink.json').sha256")
DAP_DEST="static/daplink"

if firmware_a_jour "$DAP_DEST" "$DAP_SHA" firmware.json; then
  echo "Firmware DAPLink ${DAP_RELEASE} déjà présent dans $DAP_DEST (FORCER_FIRMWARES=1 pour le retélécharger)"
else
  mkdir -p "$TMP/dap"
  telecharger "DAPLink ${DAP_RELEASE}" \
    "${BASE}/steamicc/DAPLink/releases/download/${DAP_RELEASE}/stm32f103xb_steami32_if_crc.bin" \
    "$DAP_SHA" daplink.json "$TMP/dap/firmware.bin"
  # Même format que le Dockerfile du Codespace : numero = après le dernier point,
  # date = release sans le numéro, sans tirets, en entier.
  printf '{"release": "%s", "numero": %s, "date": %s, "taille": %s, "sha256": "%s"}\n' \
    "$DAP_RELEASE" "${DAP_RELEASE##*.}" \
    "$(printf '%s' "${DAP_RELEASE%.*}" | tr -d '-')" \
    "$(stat -c %s "$TMP/dap/firmware.bin")" "$DAP_SHA" > "$TMP/dap/firmware.json"
  installer "$DAP_DEST" "$TMP/dap"
  echo "Firmware DAPLink ${DAP_RELEASE} prêt dans $DAP_DEST"
fi
