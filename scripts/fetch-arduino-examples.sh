#!/bin/bash
# Récupère les exemples Arduino précompilés (archive épinglée) et les sources
# correspondantes (clone du dépôt arduino-steami au même tag).
# L'archive est traitée comme non fiable : sha256 vérifié avant décompression,
# puis échange atomique de static/exemples-arduino/.

set -euo pipefail

REPO="steamicc/arduino-steami"
PIN="exemples-arduino.json"
SRC_DIR=".external/arduino-steami"
DEST="static/exemples-arduino"

VERSION=$(node -p "require('./$PIN').version")
SHA256=$(node -p "require('./$PIN').sha256")
ZIP="steami-exemples-${VERSION}.zip"
URL="https://github.com/${REPO}/releases/download/${VERSION}/${ZIP}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/dl" "$TMP/out"

echo "Téléchargement de l'archive des exemples Arduino ${VERSION}..."
if ! curl -fL --retry 3 --silent --show-error -o "$TMP/dl/$ZIP" "$URL"; then
  echo "Erreur : archive introuvable (${URL})" >&2
  exit 1
fi

if ! (cd "$TMP/dl" && echo "${SHA256}  ${ZIP}" | sha256sum -c --status -); then
  echo "Erreur : sha256 de l'archive des exemples différent de celui épinglé dans ${PIN}" >&2
  exit 1
fi

unzip -q "$TMP/dl/$ZIP" -d "$TMP/out"
[ -f "$TMP/out/index.json" ] || { echo "Erreur : index.json absent de l'archive" >&2; exit 1; }

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mv "$TMP/out" "$DEST"
echo "Exemples Arduino prêts dans $DEST"

CURRENT=""
if [ -d "$SRC_DIR/.git" ]; then
  CURRENT=$(git -C "$SRC_DIR" describe --tags --exact-match 2>/dev/null || true)
fi
if [ "$CURRENT" != "$VERSION" ]; then
  echo "Clonage de arduino-steami ${VERSION}..."
  rm -rf "$SRC_DIR"
  mkdir -p "$(dirname "$SRC_DIR")"
  git clone --depth 1 --quiet --branch "$VERSION" "https://github.com/${REPO}.git" "$SRC_DIR"
fi
echo "arduino-steami ${VERSION} prêt dans $SRC_DIR"
