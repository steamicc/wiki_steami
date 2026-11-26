# Exemples Arduino à essayer depuis le wiki — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque exemple Arduino du paquet STeaMi est expliqué sur le wiki, avec son code, un bouton Téléverser (WebUSB) et la console série, ou le téléchargement du `.bin` hors Chrome/Edge.

**Architecture:** `arduino-steami-lib` compile les exemples du paquet publié et attache `steami-exemples-<tag>.zip` (`.bin` + `index.json`) à la release de `steamicc/arduino-steami`. Le wiki épingle une version, récupère au prebuild le code (clone au tag) et l'archive (sha256 vérifié), et l'affiche par page de composant avec le composant React `<EssayerExemple id="…" />`. Un script de cohérence et un robot de mise à jour gardent explications et exemples alignés.

**Tech Stack:** GitHub Actions, arduino-cli (STM32duino 3.1.0), Python 3 (unittest), Docusaurus 3.9.2 / React 19, DAP.js 2.3.0 (WebUSB), `node --test`.

**Spec:** `conception/2026-11-25-exemples-arduino-design.md` (issue steamicc/wiki_steami#180).

## Global Constraints

- FQBN `STMicroelectronics:stm32:STeaMi`, cœur `STMicroelectronics:stm32@3.1.0`, bibliothèque `STM32duinoBLE`.
- Archive : `steami-exemples-<tag>.zip` (ex. `steami-exemples-v0.34.0.zip`), contenu `index.json` + `<COMPOSANT>/<nom>.bin`.
- `index.json` : `{version, fqbn, coeur, exemples: [{id, composant, nom, bin, taille, sha256, source}]}` ; `id` = `<COMPOSANT>/<nom>` (ex. `VL53L1X/GestureDetection`), `source` = `examples/<COMPOSANT>/<nom>/<nom>.ino`.
- Une archive déjà attachée à une release n'est jamais remplacée.
- Wiki : épinglage `exemples-arduino.json` = `{ "version": "vX.Y.Z", "sha256": "<archive>" }` ; code dans `.external/arduino-steami` ; `.bin` servis sous `/exemples-arduino/<COMPOSANT>/<nom>.bin`, index sous `/exemples-arduino/index.json`.
- Pages : `docs/software/arduino/exemples/index.md` et `docs/software/arduino/exemples/<composant-en-minuscules>.md` ; section d'exemple `## <nom> {#<nom-en-minuscules>}` (les `_` sont gardés).
- Console série : 115200 bauds. Après `dap.flash()`, **pas** de `dap.reset()` (le DAPLink redémarre la carte).
- Textes de l'interface en français ; texte du repli : « Glisse ce fichier sur le lecteur STEAMI de la carte. »
- Une issue, une branche, une PR par livraison ; jamais de push sur `main` ; commitlint (wiki : scopes `wip, configs, formatting, code, ci, docs, hardware, software, design` ; bibliothèque : types conventionnels, fusion squash) ; l'utilisateur fusionne.
- La carte de test (V1c) est partagée avec la session wiki-steami-71 : lui écrire avant toute utilisation, rendre la carte avec `battery_status`.
- `docs/software/arduino/bibliotheques.md` et `docs/software/daplink.md` ne sont pas modifiés sans accord de l'utilisateur.

## Review Focus

- Carte débranchée pendant l'envoi ou la console : message en français, boutons revenus à l'état « carte non connectée », aucune exception non rattrapée (Task 5).
- Carte déjà prise par un autre onglet (Codespace ouvert) : message « déjà utilisée par un autre onglet… », pas de blocage de la page (Task 5).
- Prebuild sans réseau, archive absente ou sha256 différent : le build échoue avec un message clair, il ne publie jamais des pages sans `.bin` (Task 3).
- Téléverser un exemple pendant que la console d'un autre tourne : la lecture série est arrêtée avant l'envoi, la console passe sous le nouvel exemple (Task 5).
- Noms en `snake_case` ou répétés entre composants (`ambient_light`, `BasicReader`) : ancre, URL du `.bin` et `id` restent cohérents (Tasks 1, 4, 5).

---

## Livraison 1 — bibliothèque (`steamicc/arduino-steami-lib`, une PR)

### Task 1: Compiler les exemples en `.bin` et construire l'archive

**Files:**

- Modify: `scripts/compile-package-examples.sh` (option `--output-dir DIR`)
- Create: `scripts/build-examples-archive.py`
- Test: `scripts/tests/test_build_examples_archive.py`

**Interfaces:**

- Produces: `scripts/compile-package-examples.sh PKG_DIR [--output-dir DIR]` — avec l'option, copie pour chaque exemple `<nom>.ino.bin` de `arduino-cli compile --output-dir` vers `DIR/<COMPOSANT>/<nom>.bin`.
- Produces: `python3 scripts/build-examples-archive.py --pkg PKG_DIR --bins BIN_DIR --tag vX.Y.Z --out FICHIER.zip` ; fonction `construire_index(pkg_dir: Path, bins_dir: Path, tag: str) -> dict` et `ecrire_archive(index: dict, bins_dir: Path, sortie: Path) -> None`.

- [ ] **Step 1: Write the failing tests** (`unittest`, paquet factice en `tempfile`)
  - `test_index_lists_every_example` : paquet avec `examples/VL53L1X/GestureDetection/GestureDetection.ino` et `examples/APDS9960/ambient_light/ambient_light.ino` + `.bin` correspondants → `index["exemples"]` trié par `id`, ids `["APDS9960/ambient_light", "VL53L1X/GestureDetection"]`, `source == "examples/VL53L1X/GestureDetection/GestureDetection.ino"`, `bin == "VL53L1X/GestureDetection.bin"`, `taille` et `sha256` exacts du fichier, `version == "v0.34.0"`, `fqbn == "STMicroelectronics:stm32:STeaMi"`, `coeur == "3.1.0"`.
  - `test_missing_bin_fails` : un exemple sans `.bin` → `SystemExit` dont le message nomme l'`id`.
  - `test_archive_layout` : le zip contient exactement `index.json` + les `.bin` aux chemins `bin`.
  - `test_rejects_bad_tag` : `tag="0.34.0"` → erreur.
- [ ] **Step 2: Run** `python3 -m unittest discover -s scripts/tests` — Expected: FAIL (module absent).
- [ ] **Step 3: Implement** `build-examples-archive.py` (bibliothèque standard seulement, en-tête SPDX GPL-3.0-or-later comme les autres scripts) and the `--output-dir` option (compilation dans un dossier temporaire par exemple ; sans l'option, comportement inchangé).
- [ ] **Step 4: Run** `python3 -m unittest discover -s scripts/tests` — Expected: PASS. Then `make format-check check-spdx` — Expected: OK.
- [ ] **Step 5: Commit** `feat(tooling): build an archive of compiled package examples`

### Task 2: Workflow d'archive, appelé par la publication et à relancer sur un tag

**Files:**

- Create: `.github/workflows/examples-archive.yml`
- Modify: `.github/workflows/publish-arduino-package.yml` (job final `examples-archive`, `needs: [resolve, publish]`, `uses: ./.github/workflows/examples-archive.yml`, `with: tag`, `secrets: inherit`)

**Interfaces:**

- Consumes: Task 1 (scripts).
- Produces: asset `steami-exemples-<tag>.zip` sur la release `<tag>` de `steamicc/arduino-steami`.

Déroulé du workflow (`workflow_call` input `tag` + `workflow_dispatch` input `tag`, lancé depuis `main`) :

1. checkout de `main` (scripts de Task 1) et checkout du tag dans `src/` ;
2. construire le paquet avec le `scripts/build-arduino-package.py` **du tag** (`--version` sans le `v`) ;
3. installer arduino-cli, le cœur 3.1.0 et STM32duinoBLE (mêmes commandes que `arduino-package-check.yml`) ;
4. `compile-package-examples.sh build/arduino-package --output-dir build/exemples-bin` (un échec arrête tout) ;
5. `build-examples-archive.py` ;
6. jeton d'application (`RELEASE_APP_ID`/`RELEASE_APP_SECRET`, comme le job `publish`) ; si `gh release view <tag> -R steamicc/arduino-steami --json assets` contient déjà l'archive → `::notice::` et fin sans rien écrire ; sinon `gh release upload`.

- [ ] **Step 1:** Write both workflow changes; `actionlint` if available, sinon relecture.
- [ ] **Step 2:** Commit `ci(release): attach compiled examples to the distribution release`, PR « Closes » une issue de la bibliothèque créée pour l'occasion ; l'utilisateur fusionne.
- [ ] **Step 3 (après fusion):** `gh workflow run examples-archive.yml -R steamicc/arduino-steami-lib -f tag=v0.34.0` ; Expected: `steami-exemples-v0.34.0.zip` attaché, 78 entrées dans `index.json`. Relancer une 2e fois : Expected: notice « déjà attachée », asset inchangé (même sha256).
- [ ] **Step 4 (carte, accord de wiki-steami-71):** envoyer `VL53L1X/GestureDetection.bin` de l'archive par DAP.js depuis Node (`usb@2.14.0` + `dapjs@2.3.0`, `dap.flash()` sans offset, sans `reset`) ; Expected: la console à 115200 montre le programme ; rendre la carte avec `battery_status`.

## Livraison 2 — wiki : infrastructure + page pilote VL53L1X (`steamicc/wiki_steami`, une PR)

### Task 3: Épinglage et récupération des exemples

**Files:**

- Create: `exemples-arduino.json`, `scripts/fetch-arduino-examples.sh`
- Modify: `package.json` (`prebuild` = `bash scripts/fetch-examples.sh && bash scripts/fetch-arduino-examples.sh`), `.gitignore` (`static/exemples-arduino/`)

**Interfaces:**

- Produces: `.external/arduino-steami/` (clone `--depth 1 --branch <version>`, remplacé si la version change) ; `static/exemples-arduino/index.json` et `static/exemples-arduino/<COMPOSANT>/<nom>.bin`.

- [ ] **Step 1:** Écrire le script (`set -euo pipefail`, lit la version et le sha256 avec `node -p`, télécharge `https://github.com/steamicc/arduino-steami/releases/download/<version>/steami-exemples-<version>.zip` avec `curl -fL --retry 3`, vérifie `sha256sum -c`, décompresse dans un dossier temporaire puis remplace `static/exemples-arduino/`).
- [ ] **Step 2: Vérifier les échecs** — sha256 modifié à la main → `npm run build` échoue avec « sha256 de l'archive des exemples différent » ; version inexistante → échec « archive introuvable » ; Expected: aucun dossier `static/exemples-arduino/` partiel.
- [ ] **Step 3: Vérifier le cas normal** — `npm run build` → `build/exemples-arduino/VL53L1X/GestureDetection.bin` existe ; `.external/arduino-steami/examples/VL53L1X/GestureDetection/GestureDetection.ino` existe.
- [ ] **Step 4: Commit** `ci(software): récupérer les exemples Arduino épinglés au build`

### Task 4: Contrôle de cohérence explications ↔ exemples

**Files:**

- Create: `scripts/check-arduino-examples.py`, `scripts/exemples-arduino-a-documenter.txt` (un `id` par ligne, les 78 au départ, triés)
- Test: `scripts/tests/test_check_arduino_examples.py`
- Modify: `package.json` (`"lint:arduino-examples": "python3 scripts/check-arduino-examples.py"`, `"test:scripts": "python3 -m unittest discover -s scripts/tests"`), `.github/workflows/build.yml` (deux étapes après « Build site »)

**Interfaces:**

- Produces: `verifier(index_ids: set[str], pages: dict[Path, str], attente: list[str]) -> list[str]` (liste d'erreurs en français, vide si tout va bien) ; CLI qui lit `static/exemples-arduino/index.json`, `docs/software/arduino/exemples/*.md` et la liste d'attente, affiche les erreurs, sort en code 1 s'il y en a.

Règles (spec §5) : un `<EssayerExemple id="X" />` d'une page doit exister dans l'index ; il doit être précédé (dans la même section) d'un titre `## <nom> {#<nom.lower()>}` ; chaque id de l'index est documenté ou en attente ; un id documenté ne doit plus être en attente ; un id en attente doit exister dans l'index.

- [ ] **Step 1: Write the failing tests** : `test_all_documented_ok` (→ `[]`), `test_unknown_id`, `test_missing_anchor` (titre sans `{#…}`), `test_wrong_anchor` (`{#GestureDetection}` → erreur, attendu `gesturedetection`), `test_snake_case_anchor_kept` (`ambient_light` → `{#ambient_light}` accepté), `test_undocumented_not_waiting`, `test_documented_still_waiting`, `test_waiting_unknown_id` ; chaque erreur nomme l'`id`.
- [ ] **Step 2: Run** `npm run test:scripts` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run test:scripts` then `npm run build && npm run lint:arduino-examples` — Expected: PASS (aucune page encore, les 78 en attente).
- [ ] **Step 5: Commit** `ci(software): vérifier que chaque exemple Arduino est expliqué`

### Task 5: Composant `<EssayerExemple>`

**Files:**

- Create: `static/vendor/dapjs-2.3.0/dap.umd.js` et `LICENSE-dapjs` (copiés de `steamicc/arduino-steami-devcontainer`, `.devcontainer/source/flasher/vendor/`)
- Create: `src/components/EssayerExemple/logique.mjs` (fonctions pures), `src/components/EssayerExemple/logique.test.mjs`
- Create: `src/components/EssayerExemple/carte.js` (connexion partagée par la page), `src/components/EssayerExemple/index.js`, `src/components/EssayerExemple/styles.module.css`
- Modify: `package.json` (`"test:js": "node --test src/"`), `.github/workflows/build.yml` (étape `npm run test:js`)

**Interfaces:**

- Produces (`logique.mjs`) : `etatWebUSB(nav, estFenetrePrincipale) -> 'ok'|'absent'|'iframe'` et `messageErreur(err) -> string` (repris tels quels de `support.js` du Codespace, mêmes tests) ; `TamponLignes` (repris de `console.js`) ; `urlBin(id) -> string` (`'VL53L1X/GestureDetection'` → `'/exemples-arduino/VL53L1X/GestureDetection.bin'`) ; `nomFichier(id) -> string` (→ `'GestureDetection.bin'`) ; `idValide(id) -> boolean` (`/^[A-Z0-9_-]+\/[A-Za-z0-9_]+$/`).
- Produces (`carte.js`) : singleton `carte` avec `connecter(): Promise<void>`, `televerser(id: string, donnees: ArrayBuffer): Promise<void>` (arrête la lecture série en cours, `flash`, pas de `reset`, relance la lecture), `abonner(fn: (etat) => void): () => void`, état `{connectee: boolean, occupee: boolean, exempleActif: string|null, lignes: string[], erreur: string|null}` ; DAP.js chargé à la demande par `<script src="/vendor/dapjs-2.3.0/dap.umd.js">` (global `DAPjs`) ; `navigator.usb` `disconnect` → état non connecté ; vitesse 115200.
- Produces (`index.js`) : `export default function EssayerExemple({ id })`, rendu dans `BrowserOnly`. WebUSB `ok` : bouton « Connecter la carte » si non connectée, « Téléverser » sinon, état et console (seulement si `exempleActif === id`). `absent`/`iframe` : `<a href={urlBin(id)} download={nomFichier(id)}>Télécharger le .bin</a>` + « Glisse ce fichier sur le lecteur STEAMI de la carte. ». Rendu côté serveur : le lien de téléchargement (la page reste complète sans JS).

- [ ] **Step 1: Write the failing tests** (`node:test`) : les cas de `messageErreur` et `etatWebUSB` du Codespace (`tests/flasher.test.mjs`), `urlBin`/`nomFichier` pour `VL53L1X/GestureDetection` et `APDS9960/ambient_light`, `idValide` refuse `../x`, `VL53L1X`, `a/b/c`.
- [ ] **Step 2: Run** `npm run test:js` — Expected: FAIL.
- [ ] **Step 3: Implement** `logique.mjs`, puis `carte.js` et `index.js` (styles avec les variables du thème Infima, lisibles en mode sombre).
- [ ] **Step 4: Run** `npm run test:js && npm run lint:js && npm run build` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(software): composant pour téléverser un exemple Arduino depuis le wiki`

### Task 6: Pages index et VL53L1X (pilote)

**Files:**

- Create: `docs/software/arduino/exemples/index.md`, `docs/software/arduino/exemples/vl53l1x.md`, `docs/software/arduino/exemples/_category_.json` (ou entrée dans `sidebars.js`, selon le mécanisme déjà utilisé pour `docs/software/arduino/`)
- Modify: `scripts/exemples-arduino-a-documenter.txt` (retirer les 5 `VL53L1X/…`), `cspell.json` si des mots manquent

- [ ] **Step 1:** `index.md` : à quoi servent ces pages, comment essayer (Chrome/Edge, carte branchée en USB, autoriser la carte une fois ; sinon télécharger le `.bin`), liste des composants — d'abord ceux de la V1c, puis ceux des V1a/V1b, chacun avec sa mention de version (référence : `docs/hardware/revisions.md`).
- [ ] **Step 2:** `vl53l1x.md` : présentation courte du capteur (temps de vol, portée, versions de carte), puis pour `BasicDistance`, `GestureDetection`, `ObjectCounter`, `ParkingSensor`, `ProximityAlarm` : `## <nom> {#<nom-minuscules>}`, **Ce que tu vas voir**, **Matériel** (seulement si besoin), ` ```cpp file=.external/arduino-steami/examples/VL53L1X/<nom>/<nom>.ino `, **Comment ça marche** (appels du driver et notions du capteur, pas de paraphrase ligne à ligne), `<EssayerExemple id="VL53L1X/<nom>" />`.
- [ ] **Step 3: Run** `npm run build && npm run lint:arduino-examples && npm run lint:md && npm run lint:spell && npm run format:check` — Expected: PASS, aucun lien cassé.
- [ ] **Step 4: Recette** (accord de wiki-steami-71) : `npm run serve`, Chrome, page VL53L1X : connecter, téléverser `GestureDetection`, la console affiche les messages ; passer à `BasicDistance` sans recharger ; débrancher la carte → message et boutons corrects ; Firefox → lien de téléchargement. Rendre la carte avec `battery_status`.
- [ ] **Step 5: Commit** `docs(software): page d'exemples VL53L1X à essayer sur la carte`, PR « Closes » rien (référence #180) ; **l'utilisateur relit le ton et le niveau des explications avant la suite.**

## Livraison 3 — les autres composants (une PR par composant)

### Task 7: Page d'exemples d'un composant (répétée)

Ordre : BME280, GC9A01, STEAMI_BOARD, ISM330DL, LIS2MDL, BQ27441, MCP23009E, BLE, DAPLINK_FLASH, STEAMI_CONFIG (V1c d'abord), puis SSD1327, APDS9960, WSEN-HIDS, WSEN-PADS. Fichier `docs/software/arduino/exemples/<composant-minuscules>.md` (`wsen-hids.md`, `steami-board.md`, `daplink-flash.md`, `steami-config.md`).

- [ ] **Step 1:** Rédiger la page sur le modèle validé de `vl53l1x.md` ; `data_logger` (DAPLINK_FLASH) avec un encart `:::info` sur `LOG.CSV` ; exemples BLE à plusieurs cartes : **Matériel** le dit.
- [ ] **Step 2:** Retirer ses ids de la liste d'attente ; ajouter la page à `index.md`.
- [ ] **Step 3: Run** la même commande qu'en Task 6 Step 3 — Expected: PASS.
- [ ] **Step 4: Commit** `docs(software): page d'exemples <COMPOSANT>` ; PR ; relecture de l'utilisateur.

À la fin : `scripts/exemples-arduino-a-documenter.txt` est vide.

## Livraison 4 — liens et robot

### Task 8: Liens « ▶ Essayer sur la carte »

- [ ] **Step 1 (bibliothèque, une PR) :** dans le README de chaque driver ayant des exemples (`lib/<driver>/README.md`), une colonne ou un lien « ▶ Try it on the board » par exemple vers `https://wiki.steami.cc/docs/software/arduino/exemples/<composant>#<nom-minuscules>` ; seulement pour les composants dont la page est fusionnée. Commit `docs(<driver>): link examples to the wiki try-it pages` (un commit par driver ou un seul `docs: …`).
- [ ] **Step 2 (wiki) :** `docs/software/arduino/capteurs.md` : un lien vers la page d'exemples de chaque capteur. Commit `docs(software): liens vers les pages d'exemples`.
- [ ] **Step 3: Vérifier** chaque URL ajoutée (build du wiki sans lien cassé ; ancres présentes dans `build/`).

### Task 9: Robot `suivre-exemples-arduino.yml`

**Files:** Create `.github/workflows/suivre-exemples-arduino.yml` (wiki), modèle : `.github/workflows/suivre-paquet.yml` de `steamicc/arduino-steami-devcontainer`.

- [ ] **Step 1:** cron quotidien + `workflow_dispatch` ; lit la dernière release de `steamicc/arduino-steami` ; si plus récente que `exemples-arduino.json`, porte l'archive, et qu'aucune branche/PR `chore/exemples-arduino-<tag>` (points du tag remplacés par des tirets, ex. `v0-37-0`) n'existe : télécharge l'archive, calcule le sha256, met à jour `exemples-arduino.json`, commit `chore(configs): exemples Arduino <tag>`, ouvre la PR, puis `gh workflow run build.yml --ref chore/exemples-arduino-<tag>`. Neutralisé dans les forks. (Remplacé depuis par le jeton de la GitHub App et la fusion automatique, voir la conception §6 et #227.) `concurrency` unique.
- [ ] **Step 2: Vérifier** par `workflow_dispatch` après fusion : sans nouvelle version → rien ; avec une version plus récente → PR ouverte et CI lancé (le contrôle de cohérence nomme les exemples nouveaux non expliqués).
