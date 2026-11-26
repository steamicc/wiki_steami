#!/bin/bash
# Récupère les exemples Arduino précompilés (archive épinglée) et les sources
# correspondantes (clone du dépôt arduino-steami au même tag).
# L'archive est traitée comme non fiable. Toutes les étapes faillibles
# (téléchargement, sha256, décompression, clone) se font dans des dossiers de
# préparation placés dans .external/ (même système de fichiers que les cibles,
# ignoré par git et par Docusaurus), puis les cibles sont échangées par renommage.

set -euo pipefail

REPO="steamicc/arduino-steami"
PIN="exemples-arduino.json"
SRC_DIR=".external/arduino-steami"
DEST="static/exemples-arduino"

VERSION=$(node -p "require('./$PIN').version")
SHA256=$(node -p "require('./$PIN').sha256")
ZIP="steami-exemples-${VERSION}.zip"
URL="https://github.com/${REPO}/releases/download/${VERSION}/${ZIP}"

mkdir -p .external "$(dirname "$DEST")"
TMP=$(mktemp -d .external/.fetch-XXXXXX)
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

LISTE=$(unzip -Z1 "$TMP/dl/$ZIP")
if grep -qE '(^/|(^|/)\.\.(/|$))' <<<"$LISTE"; then
  echo "Erreur : l'archive contient des chemins hors du dossier d'extraction" >&2
  exit 1
fi
unzip -q "$TMP/dl/$ZIP" -d "$TMP/out"
if [ -n "$(find "$TMP/out" -type l)" ]; then
  echo "Erreur : l'archive contient des liens symboliques" >&2
  exit 1
fi
[ -f "$TMP/out/index.json" ] || { echo "Erreur : index.json absent de l'archive" >&2; exit 1; }

CURRENT=""
if [ -d "$SRC_DIR/.git" ]; then
  CURRENT=$(git -C "$SRC_DIR" describe --tags --exact-match 2>/dev/null || true)
fi
NEW_SRC=""
if [ "$CURRENT" != "$VERSION" ]; then
  echo "Clonage de arduino-steami ${VERSION}..."
  git clone --depth 1 --quiet --branch "$VERSION" "https://github.com/${REPO}.git" "$TMP/src"
  NEW_SRC="$TMP/src"
fi

# Tout ce qui peut échouer est fait : échange des cibles par renommage.
if [ -e "$DEST" ]; then mv "$DEST" "$TMP/old-dest"; fi
mv "$TMP/out" "$DEST"
if [ -n "$NEW_SRC" ]; then
  if [ -e "$SRC_DIR" ]; then mv "$SRC_DIR" "$TMP/old-src"; fi
  mv "$NEW_SRC" "$SRC_DIR"
fi
echo "Exemples Arduino prêts dans $DEST"
echo "arduino-steami ${VERSION} prêt dans $SRC_DIR"
