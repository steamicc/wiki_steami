#!/bin/bash
# Récupère les exemples Arduino précompilés (archive épinglée) et les sources
# correspondantes (clone du dépôt arduino-steami au même tag).
# L'archive est traitée comme non fiable. Toutes les étapes faillibles
# (téléchargement, sha256, décompression, clone) se font dans des dossiers de
# préparation placés dans .external/ (même système de fichiers que les cibles,
# ignoré par git et par Docusaurus), puis les cibles sont échangées par renommage :
# l'ancienne cible part dans le dossier de préparation (supprimé à la sortie) et
# la nouvelle n'est installée que si la cible n'existe plus, pour ne jamais
# déplacer un dossier À L'INTÉRIEUR d'une cible existante.
#
# Deux exécutions simultanées (npm start et npm run build, lint:examples pendant
# un build...) sont sérialisées par un verrou flock sur le fichier
# .external/.verrou-exemples-arduino : la seconde attend la fin de la première
# (600 s au plus, ATTENTE_VERROU_EXEMPLES_ARDUINO pour changer ce délai, sinon
# échec). Sans flock (macOS), un avertissement est affiché et le script
# continue sans verrou.
#
# Rien n'est téléchargé quand les exemples sont déjà là pour la version
# épinglée : index.json à cette version, empreinte de l'archive (.sha256,
# écrit à l'extraction) égale au sha256 épinglé et sources au même tag. Ce
# contrôle a lieu une fois le verrou pris : une exécution qui a attendu trouve
# le résultat de la précédente et s'arrête sans rien télécharger.
# FORCER_EXEMPLES_ARDUINO=1 force le téléchargement.
#
# Le script sert deux sources, choisies par son premier argument :
#   (aucun) ou bibliotheque : arduino-steami-lib (exemples-arduino.json,
#                             static/exemples-arduino/, .external/arduino-steami/)
#   sample                  : arduino-steami-sample (exemples-arduino-sample.json,
#                             static/exemples-arduino-sample/,
#                             .external/arduino-steami-sample/)
# Chaque source a son verrou, son épinglage et ses cibles : elles ne s'écrasent pas.

set -euo pipefail

SOURCE="${1:-bibliotheque}"
case "$SOURCE" in
  bibliotheque)
    REPO="steamicc/arduino-steami"
    PIN="exemples-arduino.json"
    SRC_DIR=".external/arduino-steami"
    DEST="static/exemples-arduino"
    LOCK=".external/.verrou-exemples-arduino"
    ;;
  sample)
    REPO="steamicc/arduino-steami-sample"
    PIN="exemples-arduino-sample.json"
    SRC_DIR=".external/arduino-steami-sample"
    DEST="static/exemples-arduino-sample"
    LOCK=".external/.verrou-exemples-arduino-sample"
    ;;
  *)
    echo "Usage : fetch-arduino-examples.sh [bibliotheque|sample]" >&2
    exit 2
    ;;
esac
NOM_REPO="${REPO#steamicc/}"

VERSION=$(node -p "require('./$PIN').version")
SHA256=$(node -p "require('./$PIN').sha256")
ZIP="steami-exemples-${VERSION}.zip"
URL="https://github.com/${REPO}/releases/download/${VERSION}/${ZIP}"

ATTENTE="${ATTENTE_VERROU_EXEMPLES_ARDUINO:-600}"

mkdir -p .external "$(dirname "$DEST")"

# Verrou : une seule exécution à la fois installe les cibles.
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK"
  if ! flock -n 9; then
    echo "Une autre exécution de fetch-arduino-examples.sh ($SOURCE) est en cours : attente de sa fin (${ATTENTE} s au plus)..."
    if ! flock -w "$ATTENTE" 9; then
      echo "Erreur : le verrou $LOCK est toujours pris après ${ATTENTE} s, abandon" >&2
      exit 1
    fi
  fi
else
  echo "Attention : flock introuvable, exécution sans verrou (deux exécutions simultanées peuvent se gêner)" >&2
fi

# État actuel, lu une fois le verrou pris (une exécution précédente a pu le changer).
CURRENT=""
if [ -d "$SRC_DIR/.git" ]; then
  CURRENT=$(git -C "$SRC_DIR" describe --tags --exact-match 2>/dev/null || true)
fi

if [ "${FORCER_EXEMPLES_ARDUINO:-0}" != "1" ] && [ "$CURRENT" = "$VERSION" ] \
  && [ -f "$DEST/.sha256" ] && [ "$(cat "$DEST/.sha256")" = "$SHA256" ] \
  && [ "$(node -p "JSON.parse(require('fs').readFileSync('$DEST/index.json', 'utf8')).version" 2>/dev/null)" = "$VERSION" ]; then
  echo "Exemples Arduino ${VERSION} déjà présents dans $DEST (FORCER_EXEMPLES_ARDUINO=1 pour les retélécharger)"
  exit 0
fi

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
# La version annoncée par index.json doit être le tag épinglé : sinon l'archive
# est incompatible (et le saut « déjà présent » échouerait à chaque exécution).
VERSION_ARCHIVE=$(node -p "const i = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); i && i.version" "$TMP/out/index.json" 2>/dev/null || true)
if [ "$VERSION_ARCHIVE" != "$VERSION" ]; then
  echo "Erreur : index.json de l'archive annonce la version '${VERSION_ARCHIVE:-?}' au lieu de ${VERSION} (version illisible ou différente du tag épinglé dans ${PIN})" >&2
  exit 1
fi
# Chaque entrée de l'index doit avoir un id conforme, un champ bin égal à
# <id>.bin et ce binaire dans l'archive : sinon les boutons du wiki
# demanderaient des .bin introuvables (404 en production).
if ! ERREUR_INDEX=$(node -e '
const fs = require("fs");
const [fichier, dossier] = process.argv.slice(1);
const index = JSON.parse(fs.readFileSync(fichier, "utf8"));
if (!Array.isArray(index.exemples)) { console.log("exemples n'"'"'est pas une liste"); process.exit(1); }
const motif = /^[A-Z0-9_-]+\/[A-Za-z0-9_]+$/;
for (const e of index.exemples) {
  const id = e && e.id;
  if (typeof id !== "string" || !motif.test(id)) { console.log("id non conforme : " + JSON.stringify(id)); process.exit(1); }
  if (e.bin !== id + ".bin") { console.log("bin de " + id + " vaut " + JSON.stringify(e.bin) + " au lieu de " + id + ".bin"); process.exit(1); }
  const chemin = dossier + "/" + e.bin;
  if (!fs.existsSync(chemin) || !fs.statSync(chemin).isFile()) { console.log("binaire absent de l'"'"'archive : " + e.bin); process.exit(1); }
}
' "$TMP/out/index.json" "$TMP/out" 2>&1); then
  echo "Erreur : index.json de l'archive incompatible : ${ERREUR_INDEX}" >&2
  exit 1
fi
# Empreinte de l'archive vérifiée : permet de sauter le téléchargement la fois suivante.
printf '%s\n' "$SHA256" > "$TMP/out/.sha256"

NEW_SRC=""
if [ "$CURRENT" != "$VERSION" ]; then
  echo "Clonage de ${NOM_REPO} ${VERSION}..."
  git clone --depth 1 --quiet --branch "$VERSION" "https://github.com/${REPO}.git" "$TMP/src"
  NEW_SRC="$TMP/src"
fi

# installer NOUVEAU CIBLE ANCIEN : l'ancienne cible est renommée en ANCIEN (dans
# $TMP, donc supprimée à la sortie), puis NOUVEAU prend sa place. Si la cible
# existe encore à ce moment (exécution concurrente sans verrou), échec plutôt
# qu'un « mv » qui déplacerait NOUVEAU à l'intérieur de la cible. mv -T (GNU)
# refuse aussi ce cas au moment même du renommage ; il n'existe pas sous BSD.
installer() {
  local nouveau="$1" cible="$2" ancien="$3"
  if [ -e "$cible" ] || [ -L "$cible" ]; then mv "$cible" "$ancien"; fi
  if [ -e "$cible" ] || [ -L "$cible" ]; then
    echo "Erreur : $cible a été recréé pendant l'installation (autre exécution en cours ?)" >&2
    exit 1
  fi
  if mv --version >/dev/null 2>&1; then
    mv -T "$nouveau" "$cible"
  else
    mv "$nouveau" "$cible"
  fi
}

# Tout ce qui peut échouer est fait : échange des cibles par renommage.
installer "$TMP/out" "$DEST" "$TMP/old-dest"
if [ -n "$NEW_SRC" ]; then
  installer "$NEW_SRC" "$SRC_DIR" "$TMP/old-src"
fi
echo "Exemples Arduino prêts dans $DEST"
echo "${NOM_REPO} ${VERSION} prêt dans $SRC_DIR"
