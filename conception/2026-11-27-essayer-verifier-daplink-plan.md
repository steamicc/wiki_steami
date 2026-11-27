# Vérifier le DAPLink depuis le bouton « Essayer » — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** after **Connecter la carte**, the Arduino « Essayer » block reads the STeaMi DAPLink version and, when it is older than the pinned one, shows the guided-update box with « Plus tard ».

**Architecture:**

- A new module `src/components/EssayerExemple/daplink.mjs` holds the pure decision and a small page-level store (proposed release, « Plus tard » flag), tested with `node --test`.
- `carte.mjs` gains two read-only accessors (raw `0x9F` reply, USB serial number).
- `Controles` (`index.js`) awaits the connection, runs the check, and renders the existing `EtapesDaplink` under the example that was clicked.

**Tech Stack:** Docusaurus 3, React, ES modules (`.mjs`), WebUSB + DAP.js 2.3.0 (vendored), `node --test`.

**Spec:** `conception/2026-11-27-essayer-verifier-daplink-design.md` (issue #256).

## Global Constraints

- **Non-blocking:** « l'encart propose, il n'empêche rien ». Téléverser and Déconnecter stay as they are.
- **Nothing shown when:**
  - the serial number does not start with `0839`;
  - the `0x9F` read fails (no board, flash in progress, USB error);
  - `firmware.json` is missing or invalid;
  - the decision is `a-jour` or `dev`.
- **Box shown when:** the decision is `ancien`. That includes a reply without « STM1 » (old DAPLink without `0x9F`).
- **Version order:** by date, then by number. Reuse `decisionMiseAJour`, `lireVersionSteami` and `lireFirmwareEpingle` from `src/components/EssayerMicroPython/logique.mjs` unchanged.
- **« Plus tard »:** one flag for the whole page (module level), until reload.
- **Disconnects:** the box survives a disconnect. Only the next check (after a reconnection) hides or updates it.
- **Last step of the box:** « Cliquer sur « Connecter la carte », puis sur « Téléverser ». » (`derniereEtape` prop of `EtapesDaplink`).
- **Out of scope:** the MicroPython and Pile radio buttons keep their behaviour; `lireVersionDaplink()` keeps its contract.
- **Writing:**
  - wiki text in French, neutral tone (infinitive, no « tu » / « vous »);
  - commits « type(scope): sujet » in French, lowercase after the scope, no final period, scopes `software` / `conception`;
  - no attribution lines.
- **Checks before each commit:** `npm run test:js`, `npm run lint:js`, `npm run format:check`, `npm run lint:md` (when a `.md` changes). The last task also runs `npm run build`.

## Review Focus

1. **A STeaMi whose DAPLink predates `0x9F`** (it replies without « STM1 »): the box must show. Pinned by Task 1's `decision : réponse sans STM1 → proposer`.
2. **A micro:bit or stock DAPLink** (VID `0x0d28`, serial not `0839…`): nothing must show. Pinned by Task 1's `decision : carte qui n'est pas une STeaMi → rien`.
3. **The board reboots into MAINTENANCE during the update** (USB disconnect): the box must stay. Pinned by Task 1's store test `déconnexion : l'encart reste`.
4. **« Plus tard » under one example, then « Connecter la carte » under another:** no box again. Pinned by Task 1's store test `plus tard : vaut pour toute la page`.
5. **`firmware.json` fetch fails** (offline dev server, 404): no box and no error message. Pinned by Task 1's `verifier : épinglé illisible → rien`.

---

### Task 1: Decision and page store (`daplink.mjs`)

**Files:**

- Create: `src/components/EssayerExemple/daplink.mjs`
- Test: `src/components/EssayerExemple/daplink.test.mjs`

**Interfaces:**

- Consumes: `lireVersionSteami(reponse: DataView|null) → {numero, date}|null`, `lireFirmwareEpingle(json) → {release, numero, date}|null`, `decisionMiseAJour(version, epingle) → 'ancien'|'a-jour'|'dev'` (from `../EssayerMicroPython/logique.mjs`).
- Produces:
  - `estSteami(numeroSerie: string|null|undefined) → boolean`: true iff it is a string starting with `'0839'`.
  - `decisionEncart({ numeroSerie, reponse, epingle }) → { proposer: boolean, release: string|null }`.
    - `reponse` is the raw `0x9F` DataView, or `null` when the read failed.
    - `epingle` is the parsed pinned firmware, or `null`.
    - It proposes only when `estSteami`, `reponse !== null`, `epingle !== null` and `decisionMiseAJour(lireVersionSteami(reponse), epingle) === 'ancien'`.
  - `ETAT_INITIAL_DAPLINK = Object.freeze({ release: null, reporte: false })`.
  - `verificationDaplink`, a store object:
    - `etat` (getter) → `{ release: string|null, reporte: boolean }`: `release` is non-null while the box is proposed;
    - `abonner(fn) → () => void`;
    - `async verifier({ numeroSerie, lireReponse, chargerEpingle })` → resolves to nothing and never rejects. `lireReponse: () => Promise<DataView|null>`; `chargerEpingle: () => Promise<object>`, the raw JSON. It sets `release` to the pinned release when `decisionEncart` proposes and `reporte` is false. Otherwise it sets `release` to null;
    - `reporter()`: sets `reporte: true` and `release: null`;
    - `reinitialiser()`: back to `{ release: null, reporte: false }`, for tests only.

- [ ] **Step 1: Write the failing tests** in `daplink.test.mjs` (style of `logique.test.mjs`).
  - Build the replies with a helper `reponse(marque, numero, date)` returning a 13-byte DataView: byte 0 = `0x9f`, bytes 1-4 = `marque`, then uint32 LE `numero`, then uint32 LE `date`.
  - The pinned firmware is `EPINGLE = { release: '2026-11-25.3', numero: 3, date: 20261125 }`.
  - `estSteami` : `'0839000012345'` → true ; `'9904360259'` (micro:bit) → false ; `''`, `null`, `undefined` → false.
  - `decision : réponse plus ancienne → proposer`: `decisionEncart({ numeroSerie: '0839…', reponse: reponse('STM1', 3, 20261124), epingle: EPINGLE })` deep-equals `{ proposer: true, release: '2026-11-25.3' }`.
  - `decision : réponse sans STM1 → proposer`: reply with marque `'\0\0\0\0'` → `proposer: true`.
  - `decision : à jour ou dev → rien`:
    - `('STM1', 3, 20261125)` → `proposer: false` ;
    - `('STM1', 4, 20261125)` → false ;
    - `('STM1', 1, 20261201)` → false ;
    - `('STM1', 0, 0)` → false.
  - `decision : carte qui n'est pas une STeaMi → rien`: serial `'9904360259'` with an old reply → `proposer: false`.
  - `decision : lecture en échec ou épinglé absent → rien`: `reponse: null` → false ; `epingle: null` → false.
  - `verifier : propose puis masque après mise à jour`:
    1. `verifier` with an old reply → `etat.release === '2026-11-25.3'`;
    2. `verifier` with `('STM1', 3, 20261125)` → `etat.release === null`.
  - `verifier : épinglé illisible → rien`:
    - with `chargerEpingle` rejecting → `etat.release === null`, no rejection;
    - with `chargerEpingle` resolving `{}` → null.
  - `plus tard : vaut pour toute la page`:
    1. `verifier` (old) proposes;
    2. after `reporter()`, `etat` deep-equals `{ release: null, reporte: true }`;
    3. a new `verifier` with an old reply → still `release === null`.
  - `déconnexion : l'encart reste`: after a proposing `verifier`, nothing else is called, so `etat.release` is still set. This documents that only `verifier` and `reporter` change the store.
  - `abonner` : a subscriber is called on each change and no longer after its unsubscribe.
  - Each test starts with `verificationDaplink.reinitialiser()`.

- [ ] **Step 2: Run the tests and check that they fail.** Run `node --test src/components/EssayerExemple/daplink.test.mjs`. Expected: FAIL, because the module does not exist.
- [ ] **Step 3: Implement `daplink.mjs`** with the interfaces above. `verifier` loads the pinned JSON first, then the reply, inside one try/catch that leaves `release: null`. Header comment in French, like the sibling modules.
- [ ] **Step 4: Run the tests and check that they pass.** Run `node --test src/components/EssayerExemple/daplink.test.mjs`, then `npm run test:js`, `npm run lint:js` and `npm run format:check`. Expected: all pass.
- [ ] **Step 5: Commit.** `git add src/components/EssayerExemple/daplink.mjs src/components/EssayerExemple/daplink.test.mjs`, then `git commit -m "feat(software): décision de mise à jour du DAPLink pour le bouton Essayer"`.

### Task 2: Raw `0x9F` reply and serial number in `carte.mjs`

**Files:**

- Modify: `src/components/EssayerExemple/carte.mjs`: add next to `lireVersionDaplink` (around l.548-560), and to the exported `carte` object (l.588-602).
- Test: `src/components/EssayerExemple/carte.test.mjs`

**Interfaces:**

- Produces on `carte`:
  - `lireReponseVersionDaplink() → Promise<DataView|null>`: the raw reply to `COMMANDE_VERSION` (`0x9f`) through `executerSansAttendre`. It returns `null` without a board, during a flash or on any error, and never rejects.
  - `get numeroSerie() → string|null`: `peripherique?.serialNumber ?? null`.
- `lireVersionDaplink()` stays as it is. It may call `lireReponseVersionDaplink()` and then `lireVersionSteami`.

- [ ] **Step 1: Write the failing tests** in `carte.test.mjs`, reusing the file's fake DAP.js and USB device.
  - `version brute : réponse de 0x9F rendue telle quelle`: connect, make the fake `send(0x9f)` return a known DataView, then `await carte.lireReponseVersionDaplink()` is that same DataView.
  - `version brute : null sans carte, pendant un flash, ou si send échoue`: three cases, each resolving to `null`.
  - `numéro de série : celui du périphérique connecté, null après déconnexion`: the fake device has `serialNumber: '0839000012345'`.
- [ ] **Step 2: Run the tests and check that they fail.** Run `node --test src/components/EssayerExemple/carte.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement the two accessors.**
- [ ] **Step 4: Run the tests and check that they pass.** Run `node --test src/components/EssayerExemple/carte.test.mjs`, then `npm run test:js` (the MicroPython and PileRadio tests are unchanged and pass), `npm run lint:js` and `npm run format:check`.
- [ ] **Step 5: Commit.** `git commit -m "feat(software): réponse brute de la version du DAPLink et numéro de série de la carte"`.

### Task 3: Box under the Arduino « Essayer » block, and the doc sentence

**Files:**

- Modify: `src/components/EssayerExemple/index.js`: `Controles`, l.100-291.
- Modify: `docs/software/arduino/exemples/premier-essai.md`: section « 2. Connecter la carte », l.33-45.
- Test: the existing tests stay green, then the build.

**Interfaces:**

- Consumes:
  - `verificationDaplink`, from Task 1;
  - `carte.lireReponseVersionDaplink`, `carte.numeroSerie`, `carte.etat` and `carte.connecter(id, urlDapjs)`, from Task 2. `carte.connecter` already returns a promise;
  - `EtapesDaplink({ release, href, surPlusTard, derniereEtape })`.

- [ ] **Step 1: Wire `connecter()`.**
  - `connecter()` becomes `async` and awaits `carte.connecter(id, urlDapjs)`.
  - Then, if `carte.etat.connectee`, it calls `verificationDaplink.verifier({ numeroSerie: carte.numeroSerie, lireReponse: carte.lireReponseVersionDaplink, chargerEpingle: () => fetch(urlFirmwareJson).then((r) => r.json()) })`.
  - `urlFirmwareJson = useBaseUrl('/daplink/firmware.json')`, like `PileRadio/index.js:115`.
- [ ] **Step 2: Render the box.**
  - Subscribe with `useSyncExternalStore(verificationDaplink.abonner, () => verificationDaplink.etat, () => ETAT_INITIAL_DAPLINK)`. `ETAT_INITIAL_DAPLINK` comes from Task 1.
  - Show `<EtapesDaplink>` after the messages and before `<Telechargement>`, only when `etatDaplink.release !== null && etat.dernierClic === id`, so that one box shows on the page, under the clicked example.
  - Its props:
    - `release={etatDaplink.release}`;
    - `href={useBaseUrl('/daplink/firmware.bin')}`;
    - `surPlusTard={verificationDaplink.reporter}`;
    - `derniereEtape="Cliquer sur « Connecter la carte », puis sur « Téléverser »."`.
- [ ] **Step 3: Write the doc sentence.** In `premier-essai.md`, after the paragraph at l.43, add one neutral sentence: if the DAPLink of the board is older than the one the wiki expects, a box under the buttons gives the update steps, and the update can wait (« Plus tard »). Link to the Codespace section that describes the same steps (`../codespace#mettre-à-jour-le-daplink-depuis-la-page`, check that the anchor exists in `docs/software/arduino/codespace.md`).
- [ ] **Step 4: Run the checks.** Run `npm run test:js`, `npm run lint:js`, `npm run format:check`, `npm run lint:md` and `npm run build`. Expected: all pass, and the build reports no broken link.
- [ ] **Step 5: Commit.** `git commit -m "feat(software): proposer la mise à jour du DAPLink sous les exemples Arduino"`. Its body ends with `Closes #256`.

## Hardware check (controller, after Task 3)

WebUSB needs a click in Chrome, so this check is done with the user. Run `npm run start` in the worktree. The user opens `docs/software/arduino/exemples/vl53l1x` on a V1c that has the pinned DAPLink (`2026-11-25.3`) and clicks **Connecter la carte**: no box should show. Ask the other sessions for the board slot first. Never flash the DAPLink to test the « ancien » case: Task 1's tests cover it.
