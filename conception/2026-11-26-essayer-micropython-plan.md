# Essayer le code MicroPython du wiki sur la carte — plan de réalisation

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes
> utilisent des cases à cocher (`- [ ]`).

**But :** un bouton « Essayer sur la carte » sous les programmes MicroPython du
wiki, qui vérifie le DAPLink et le firmware, puis lance le programme en RAM et
affiche sa sortie.

**Architecture :** tout passe par la connexion DAP.js partagée de
`EssayerExemple/carte.mjs` : commande vendeur `0x9F` (DAPLink), `flash()`
(firmware MicroPython épinglé), `serialWrite`/lecture série (REPL brut). Un
module de protocole REPL sans dépendance au navigateur (`repl.mjs`) est testé
avec un faux transport, et sur la carte par un script Node (dapjs + usb). Un
plugin remark ajoute le composant sous les blocs exécutables.

**Technologies :** Docusaurus 3.9.2, React 19, DAP.js 2.3.0, `node --test`,
`python3 -m unittest`, GitHub Actions ; MicroPython 1.29 (STeaMi).

**Conception :** `conception/2026-11-26-essayer-micropython-design.md`
(à lire avec ce plan).

## Contraintes globales

- Le programme est lancé en RAM, jamais enregistré ; les fichiers annexes vont
  dans un disque en RAM monté sur `/ram`, placé en tête de `sys.path`.
- Rien n'est flashé sans clic sur **Installer** ; un bloc `confirm` ne se lance
  qu'après **Lancer quand même**.
- Le code affiché et le firmware proposé viennent de la même release épinglée
  (`micropython.json`).
- Firmware sans `steami.version` → « ancien » ; `VERSION == "dev"` → jamais de
  proposition.
- DAPLink : vérifié seulement sur le chemin MicroPython ; décision par
  `(date, numéro)` comme le Codespace ; numéro 0 → « dev ».
- Pas de `dap.reset()` après `flash()`.
- Textes du wiki en français, qui disent quoi faire ; code de la lib en anglais.
- Chaque tâche : issue (ou #233), branche `feat|fix|docs|ci/<kebab>`, PR fusionnée
  par l'utilisateur ; commits conventionnels ; hooks Prettier, CSpell et
  markdownlint.
- Toute manipulation de la V1c partagée : créneau demandé à la session qui la
  gère, `battery_status` remis à la fin.

## Points de vigilance (revue)

1. **Programme qui inonde la console** (`while True: print(...)`) : l'invite et
   la fin d'exécution doivent quand même être détectées, et **Arrêter** doit
   marcher. Test dans la tâche 4.
2. **Programme qui ne rend pas la main à Ctrl-C** ou carte tenue par Thonny :
   pas de proposition d'installation tant que la bannière MicroPython est vue
   après un redémarrage. Test dans la tâche 5.
3. **Carte débranchée pendant le flash du firmware** : erreur en français, état
   « non connectée », aucun lancement ensuite. Test dans la tâche 6.
4. **Lancer un second bloc pendant qu'un programme tourne** : le premier est
   arrêté (Ctrl-C puis redémarrage logiciel) avant l'envoi du second. Test dans
   la tâche 7.
5. **Fichier annexe avec accents, guillemets ou `\x04`** : écrit sans
   corruption dans `/ram`. Test dans la tâche 4.

---

### Tâche 1 : essai jetable sur la carte (porte d'entrée)

**Fichiers :** scratchpad uniquement (rien n'est commité).

**Interfaces :**

- Produit : une conclusion écrite dans l'issue #233 (oui/non pour l'approche A,
  débit mesuré, taille de paquet et délai retenus, `/ram` utilisable, flash du
  `.bin` par DAP.js réussi).

- [ ] **Étape 1 :** demander un créneau sur la V1c ; installer `dapjs@2.3.0` et
      `usb` dans un dossier du scratchpad.
- [ ] **Étape 2 :** script Node qui ouvre le DAPLink (`0x0d28`), règle 115200
      bauds, lance `startSerialRead`, envoie Ctrl-C, Ctrl-A, `print(1+1)`, Ctrl-D, et
      attend `OK2\r\n\x04\x04>` (`OK`, la sortie, puis les deux séparateurs).
      Attendu : la réponse arrive, sans erreur USB, en écrivant pendant que la lecture
      tourne.
- [ ] **Étape 3 :** envoyer en REPL brut un script de 5 ko (paquets de 256 o,
      puis essayer 64 o et 1 ko) ; noter le débit et les pertes éventuelles.
- [ ] **Étape 4 :** monter un disque en RAM (`vfs.VfsFat` sur un bloc en RAM, ou
      `vfs.VfsLfs2`), écrire `/ram/pins.py`, l'importer après
      `sys.path.insert(0, '/ram')`.
- [ ] **Étape 5 :** `dap.flash()` du `steami-micropython-firmware-v0.28.2.bin`,
      puis vérifier la bannière MicroPython et que `steami` s'importe ; mesurer la
      durée. Remettre `battery_status`.
- [ ] **Étape 6 :** écrire la conclusion dans #233. Si l'étape 2 ou 3 échoue :
      s'arrêter et revenir à la conception (approche B).

### Tâche 2 : la lib grave sa version dans le firmware

**Dépôt :** `steamicc/micropython-steami-lib` (issue à créer, commits en anglais,
fusion squash).

**Fichiers :**

- Créer : `lib/steami/steami/version.py`, `scripts/write_firmware_version.py`
- Modifier : `.github/workflows/release.yml` (job `micropython-firmware`),
  `lib/steami/README.md`
- Test : `tests/test_firmware_version.py`

**Interfaces :**

- Produit : sur la carte, `from steami.version import VERSION` donne `"vX.Y.Z"`
  pour un firmware de release, `"dev"` pour un firmware local.

- [ ] **Étape 1 : test qui échoue**

```python
def test_version_defaults_to_dev():
    assert read_version(REPO / "lib/steami/steami/version.py") == "dev"

def test_write_version_sets_release_tag(tmp_path):
    target = tmp_path / "version.py"
    write_version(target, "v0.29.0")
    assert read_version(target) == "v0.29.0"

def test_write_version_rejects_bad_tag(tmp_path):
    with pytest.raises(ValueError):
        write_version(tmp_path / "version.py", "0.29.0")
```

- [ ] **Étape 2 :** `python -m pytest tests/test_firmware_version.py -v` → FAIL.
- [ ] **Étape 3 :** `version.py` contient `VERSION = "dev"` ;
      `scripts/write_firmware_version.py` expose `write_version(path, tag)` (tag
      `^v\d+\.\d+\.\d+$`, sinon `ValueError`) et `read_version(path)`, et s'utilise
      en ligne de commande : `python3 scripts/write_firmware_version.py v0.29.0`.
- [ ] **Étape 4 :** tests → PASS.
- [ ] **Étape 5 :** dans `release.yml`, avant « Build MicroPython firmware » :
      `python3 scripts/write_firmware_version.py "v${{ needs.release.outputs.new-release-version }}"`.
      README de `steami` : une ligne sur `steami.version`.
- [ ] **Étape 6 :** commit `feat(steami): Expose the release version in the firmware.` ;
      PR. Après fusion et release, noter la version dans #233.

### Tâche 3 : épingler le firmware MicroPython et le DAPLink dans le wiki

**Fichiers :**

- Créer : `micropython.json`, `daplink.json`, `scripts/fetch-firmwares.sh`
- Modifier : `scripts/fetch-examples.sh`, `package.json` (`prebuild`), `.gitignore`
- Test : `scripts/tests/test_fetch_firmwares.py`

**Interfaces :**

- Consomme : la release de la tâche 2.
- Produit (servis par le wiki) :
  - `/micropython/firmware.bin` et `/micropython/index.json`
    `{ "version": "vX.Y.Z", "taille": n, "sha256": "…" }` ;
  - `/daplink/firmware.bin` et `/daplink/firmware.json`
    `{ "release": "AAAA-MM-JJ.N", "numero": N, "date": AAAAMMJJ, "taille": n, "sha256": "…" }`
    (format du Codespace).
- `micropython.json` : `{ "version": "vX.Y.Z", "sha256": "<sha256 du .bin>" }` ;
  `daplink.json` : `{ "release": "2026-11-25.3", "sha256": "73b67af7…" }`.

- [ ] **Étape 1 : tests qui échouent** (le script lu sous `bash`, avec
      `FIRMWARES_URL_BASE` pointant vers un dossier local de fixtures) :
      `test_sha_incorrect_echoue_sans_rien_remplacer`,
      `test_firmware_et_index_ecrits`,
      `test_daplink_json_au_format_codespace` (numero et date déduits de la release),
      `test_rien_retelecharge_si_deja_present`.
- [ ] **Étape 2 :** `npm run test:scripts` → FAIL.
- [ ] **Étape 3 :** `scripts/fetch-firmwares.sh`, sur le modèle de
      `fetch-arduino-examples.sh` (dossier de préparation dans `.external/`,
      vérification sha256, échange par renommage, rien si déjà présent,
      `FORCER_FIRMWARES=1`). Sources : release `micropython-steami-lib`
      (`steami-micropython-firmware-<version>.bin`) et release `steamicc/DAPLink`
      (`stm32f103xb_steami32_if_crc.bin`).
- [ ] **Étape 4 :** `fetch-examples.sh` clone `micropython-steami-lib` au tag de
      `micropython.json` (et se remet sur ce tag s'il existe déjà) ; `prebuild`
      lance aussi `fetch-firmwares.sh` ; `.gitignore` : `static/micropython/`,
      `static/daplink/`.
- [ ] **Étape 5 :** tests → PASS ; `npm run prebuild` télécharge les deux
      firmwares.
- [ ] **Étape 6 :** commit `feat(configs): épingler le firmware MicroPython et le DAPLink` ; PR.

### Tâche 4 : protocole REPL brut

**Fichiers :**

- Créer : `src/components/EssayerMicroPython/repl.mjs`
- Test : `src/components/EssayerMicroPython/repl.test.mjs`

**Interfaces :**

- Produit :
  - `creerRepl({ ecrire: (octets: Uint8Array) => Promise<void>, ecouter: (fn: (texte: string) => void) => () => void, attendre?: (ms) => Promise<void>, paquet?: number, pause?: number })`
    renvoie :
    - `interrompre(): Promise<boolean>` (Ctrl-C ×2, `true` si l'invite `>>>`
      arrive dans `DELAI_INVITE_MS = 1500`) ;
    - `executer(code: string, { surSortie: (texte) => void }): Promise<{ erreur: string | null }>`
      (REPL brut ; sortie transmise au fil de l'eau ; `erreur` = la partie
      stderr, traceback compris) ;
    - `ecrireFichierRam(nom: string, contenu: string): Promise<void>` (monte
      `/ram` si besoin, `sys.path` en tête) ;
    - `lireVersion(): Promise<string | null>` (`null` si `steami.version`
      n'existe pas) ;
    - `arreter(): Promise<void>` (Ctrl-C, puis Ctrl-D en REPL normal).
  - `estBanniereMicroPython(texte: string): boolean` (`/MicroPython v\d/`).
  - `paquet` et `pause` : valeurs retenues à la tâche 1.

- [ ] **Étape 1 : tests qui échouent**, avec un faux REPL MicroPython qui
      répond comme la carte (octets reçus → réponses) :
  - `executer : renvoie la sortie et pas d'erreur pour print(1+1)` (`'2\r\n'`) ;
  - `executer : traceback renvoyé dans erreur` ;
  - `executer : code envoyé par paquets de 'paquet' octets` ;
  - `executer : sortie continue (1000 lignes) puis fin détectée` (vigilance 1) ;
  - `ecrireFichierRam : contenu avec é, guillemets, \\ et \\x04 relu à l'identique` (vigilance 5) ;
  - `lireVersion : "v0.29.0", "dev", puis null sans module` ;
  - `interrompre : false sans invite dans le délai` ;
  - `estBanniereMicroPython : vrai pour la bannière STeaMi, faux pour une sortie Arduino`.
- [ ] **Étape 2 :** `node --test src/components/EssayerMicroPython/repl.test.mjs` → FAIL.
- [ ] **Étape 3 :** implémenter `repl.mjs`. Le contenu des fichiers est transmis
      encodé (par exemple base64 décodé sur la carte par `binascii.a2b_base64`), jamais
      inséré tel quel dans du code Python.
- [ ] **Étape 4 :** tests → PASS.
- [ ] **Étape 5 :** `scripts/essai-micropython-carte.mjs` (hors CI) : branche
      `creerRepl` sur dapjs + usb en Node et lance `print(1+1)`, un fichier `/ram`
      et `lireVersion()`. Sur la V1c (créneau) : les trois réussissent.
- [ ] **Étape 6 :** commit `feat(software): protocole REPL brut pour essayer MicroPython` ; PR.

### Tâche 5 : décisions (firmware, DAPLink, carte muette)

**Fichiers :**

- Créer : `src/components/EssayerMicroPython/logique.mjs`
- Test : `src/components/EssayerMicroPython/logique.test.mjs`

**Interfaces :**

- Produit :
  - `decisionFirmware({ micropython: boolean, version: string | null }, epinglee: string): 'absent' | 'ancien' | 'dev' | 'a-jour'` ;
  - `comparerVersions(a: string, b: string): -1 | 0 | 1` (`vX.Y.Z`) ;
  - `lireVersionSteami`, `lireFirmwareEpingle`, `decisionMiseAJour` : repris du
    Codespace (`flasher/support.js`), mêmes signatures et mêmes règles ;
  - `diagnosticSansInvite({ banniereVue: boolean }): 'occupee' | 'absent'`.
  - Textes : `texteInstallation(version)`, `TEXTE_EFFACEMENT`,
    `TEXTE_CARTE_OCCUPEE`, `texteMiseAJourDaplink(release)`.

- [ ] **Étape 1 : tests qui échouent** :
  - `decisionFirmware : absent sans MicroPython, ancien sans version, dev, plus ancien, égal, plus récent` ;
  - `comparerVersions : v0.28.10 > v0.28.9` ;
  - `decisionMiseAJour : mêmes cas que le Codespace (date puis numéro, 0 → dev, réponse illisible → ancien)` ;
  - `diagnosticSansInvite : bannière vue → occupee (jamais d'installation proposée)` (vigilance 2).
- [ ] **Étape 2 :** `npm run test:js` → FAIL.
- [ ] **Étape 3 :** implémenter.
- [ ] **Étape 4 :** tests → PASS.
- [ ] **Étape 5 :** commit `feat(software): décisions de mise à jour pour MicroPython` (même PR que la tâche 6 ou séparée).

### Tâche 6 : la connexion partagée sait écrire, flasher un firmware et lire le DAPLink

**Fichiers :**

- Modifier : `src/components/EssayerExemple/carte.mjs`
- Test : `src/components/EssayerExemple/carte.test.mjs` (étendre `FauxDAPLink` :
  `serialWrite`, `send(0x9f)`, `reset`)

**Interfaces :**

- Consomme : `lireVersionSteami` (tâche 5).
- Produit, sur l'objet `carte` :
  - `ecrireSerie(octets: Uint8Array): Promise<void>` ;
  - `ecouterSerie(fn: (texte: string) => void): () => void` (en plus de la
    console existante) ;
  - `lireVersionDaplink(): Promise<{ numero: number, date: number } | null>`
    (console arrêtée pendant la commande, puis relancée) ;
  - `flasherFirmware(id: string, url: string): Promise<boolean>` (même chemin
    que `televerser`, avec `progression`) ;
  - `redemarrer(): Promise<void>` (`dap.reset()`, pour le diagnostic de la tâche 5).
    Les composants Arduino existants ne changent pas de comportement.

- [ ] **Étape 1 : tests qui échouent** :
  - `écriture série : transmise à serialWrite, refusée sans carte` ;
  - `version DAPLink : console arrêtée pendant send(0x9f) puis relancée` ;
  - `flash firmware : progression, puis console relancée, pas de reset()` ;
  - `flash firmware : carte débranchée en cours → erreur en français, non connectée` (vigilance 3) ;
  - les tests existants passent sans modification.
- [ ] **Étape 2 :** `npm run test:js` → FAIL.
- [ ] **Étape 3 :** implémenter dans `carte.mjs`.
- [ ] **Étape 4 :** `npm run test:js` → PASS (anciens et nouveaux).
- [ ] **Étape 5 :** commit `feat(software): écriture série, firmware et version DAPLink dans la connexion partagée` ; PR.

### Tâche 7 : composant `EssayerMicroPython`

**Fichiers :**

- Créer : `src/components/EssayerMicroPython/index.js`,
  `src/components/EssayerMicroPython/deroulement.mjs`,
  `src/components/EssayerMicroPython/deroulement.test.mjs`,
  `src/components/EssayerMicroPython/styles.module.css`,
  `src/theme/MDXComponents.js`

**Interfaces :**

- Consomme : `carte` (tâche 6), `creerRepl` (tâche 4), décisions (tâche 5).
- Produit : `<EssayerMicroPython id="…" code="…" fichiers='[{"nom":"pins.py","contenu":"…"}]' confirmation="…" />`,
  enregistré dans `MDXComponents` (utilisable sans import).
  `deroulement.mjs` exporte `essayer({ id, code, fichiers, confirmation }, dependances)`,
  qui enchaîne les étapes 0 à 6 de la conception et appelle
  `dependances.demander(type, donnees): Promise<'oui' | 'non' | 'plus-tard'>`
  pour chaque encart (`confirmation`, `daplink`, `installation`).

- [ ] **Étape 1 : tests qui échouent** (`deroulement.test.mjs`, carte et REPL simulés) :
  - `bloc confirm : rien n'est envoyé si l'utilisateur annule` ;
  - `DAPLink ancien, « plus tard » : l'essai continue` ;
  - `firmware ancien, « non » : rien n'est flashé, rien n'est lancé` ;
  - `firmware ancien, « oui » : flash, nouveau sondage, puis lancement` ;
  - `pas d'invite mais bannière après redémarrage : message « carte occupée », pas d'installation proposée` ;
  - `fichiers annexes écrits dans /ram avant le lancement` ;
  - `second bloc lancé pendant un programme : arreter() appelé avant` (vigilance 4).
- [ ] **Étape 2 :** `npm run test:js` → FAIL.
- [ ] **Étape 3 :** implémenter `deroulement.mjs`, puis `index.js` (`BrowserOnly`,
      bouton, encarts, console reprise de `EssayerExemple`, **Arrêter**, lien vers
      Thonny et `mpremote` sans WebUSB), styles (mode sombre), `MDXComponents.js`.
- [ ] **Étape 4 :** tests → PASS ; `npm run build` sans erreur.
- [ ] **Étape 5 :** commit `feat(software): composant EssayerMicroPython` ; PR.

### Tâche 8 : blocs exécutables (plugin remark et CI)

**Fichiers :**

- Créer : `plugins/remark-micropython-run.js`, `scripts/check-micropython-blocks.py`,
  `scripts/micropython-exemples-destructifs.txt`
- Modifier : `docusaurus.config.js` (après `remark-code-file`),
  `scripts/validate-code-examples.py`, `package.json`
  (`lint:micropython-blocks`), le workflow de CI du build
- Test : `plugins/remark-micropython-run.test.mjs`,
  `scripts/tests/test_check_micropython_blocks.py`

**Interfaces :**

- Consomme : la lib clonée au tag (tâche 3), le composant (tâche 7).
- Règles du plugin, sur les blocs `python` :
  - `run` → bouton ; `norun` → jamais ;
  - `file=.external/micropython-steami-lib/lib/<driver>/examples/*.py` → bouton
    si aucun import ne vise un driver de la lib qui contient `.not-frozen` ;
  - `confirm="…"` → transmis en `confirmation` ;
  - `files=a.py,b.py` (chemins sous `.external/`) → lus et transmis en `fichiers`.
  - `id` : `<chemin de la page>#<n° du bloc>`.
- Liste `micropython-exemples-destructifs.txt` : `steami_config/examples/populate_demo_config.py`,
  `steami_config/examples/calibrate_*.py`, `daplink_flash/examples/erase_flash.py`.

- [ ] **Étape 1 : tests qui échouent** :
  - plugin : `bloc run → composant ajouté`, `bloc sans marque → rien`,
    `exemple de la lib qui importe hts221 → rien`, `norun l'emporte`,
    `confirm et files transmis` ;
  - CI : `syntaxe invalide signalée`, `fichier annexe absent signalé`,
    `exemple destructif sans confirm signalé`, `bloc python run reconnu par validate-code-examples.py`.
- [ ] **Étape 2 :** `npm run test:js` et `npm run test:scripts` → FAIL.
- [ ] **Étape 3 :** implémenter le plugin, le script, la liste ; corriger
      l'expression de `validate-code-examples.py` (` ```python run ` aujourd'hui
      ignoré) ; brancher `lint:micropython-blocks` dans le CI.
- [ ] **Étape 4 :** tests → PASS ; `npm run build` ; vérifier dans
      `build/` que la page ISM330DL contient le bouton.
- [ ] **Étape 5 :** commit `feat(software): blocs MicroPython exécutables` ; PR.

### Tâche 9 : page d'explication et marquage des pages

**Fichiers :**

- Créer : `docs/software/micropython/essayer.md`
- Modifier : `sidebars.js` (ou l'équivalent), `docs/software/micropython/index.md`,
  pages dont les blocs sont des programmes complets (au moins l'exemple ISM330DL).

- [ ] **Étape 1 :** page (ton neutre, à l'infinitif, sommaire) : ce que fait le
      bouton, lancement sans enregistrement, fichiers annexes en RAM, mise à jour du
      firmware (avertissement sur l'effacement) et du DAPLink, V1c et écran noir,
      navigateurs pris en charge, Thonny et `mpremote` pour enregistrer un programme.
- [ ] **Étape 2 :** marquer `run` les blocs complets ; `npm run build`,
      `npm run lint:md`, `npm run lint:spell`.
- [ ] **Étape 3 :** commit `docs(software): essayer le code MicroPython sur la carte` ; PR.

### Tâche 10 : robot de suivi des releases

**Fichiers :**

- Créer : `.github/workflows/suivre-micropython.yml`

- [ ] **Étape 1 :** copier `suivre-exemples-arduino.yml` : dernière release de
      `micropython-steami-lib` portant `steami-micropython-firmware-<tag>.bin` ; si
      plus récente que `micropython.json`, branche `chore/micropython-<tag avec tirets>`,
      mise à jour de `version` et `sha256`, PR par la GitHub App, fusion
      automatique si `build` est exigé sur `main` (sinon avertissement).
- [ ] **Étape 2 :** `workflow_dispatch` sur une branche de test : il ouvre la
      PR attendue (ou ne fait rien si à jour).
- [ ] **Étape 3 :** commit `ci(configs): robot de suivi du firmware MicroPython` ; PR.

### Tâche 11 : vérification de bout en bout

- [ ] **Étape 1 :** avec l'utilisateur (la fenêtre de choix WebUSB de Chrome
      demande un clic humain), sur la V1c (créneau), avec `npm run serve` :
      carte sous `battery_status` → encart d'installation → **Installer** →
      programme lancé ; deuxième essai sans encart ; bloc `confirm` → encart ;
      **Arrêter** ; Thonny ouvert → message « carte occupée ». `battery_status` remis.
- [ ] **Étape 2 :** noter le résultat dans #233 et le fermer avec la dernière PR.
