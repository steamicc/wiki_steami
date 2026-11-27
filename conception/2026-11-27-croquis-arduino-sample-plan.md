<!-- cspell:ignore Dumont Worktree frontmatter actionlint -->

# Croquis Arduino du wiki dans arduino-steami-sample — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** les croquis Arduino des pages du wiki vivent dans `steamicc/arduino-steami-sample`, qui les compile et publie une archive de `.bin` ; le wiki les inclut par `file=` avec le bouton **Téléverser** ; un croquis écrit en ligne et marqué `sample=` est repris par un robot puis converti.

**Architecture :** livraison 1 dans le dépôt sample (structure, CI arduino-cli, release semantic-release + archive au format d'arduino-steami-lib, migration). Livraison 2 dans le wiki (seconde source d'exemples à côté de la bibliothèque, page Écran, inclusion des croquis). Livraison 3 dans le wiki (marquage et vérification des croquis en ligne, robot page → dépôt, conversion dans la PR d'épinglage).

**Tech Stack :** arduino-cli, GitHub Actions, semantic-release, Python 3 (scripts et unittest/pytest), Docusaurus 3.9 / MDX, node --test.

**Spec :** `conception/2026-11-27-croquis-arduino-sample-design.md` (issues wiki_steami#251, arduino-steami-sample#5).

## Global Constraints

- Arborescence du sample : `examples/<GROUPE>/<Nom>/<Nom>.ino` ; ids du wiki `GROUPE/Nom`, conformes à `/^[A-Z0-9_-]+\/[A-Za-z0-9_]+$/`.
- Chaîne de compilation : arduino-cli, core `STMicroelectronics:stm32@3.1.0` (URL du BoardManager de stm32duino), FQBN `STMicroelectronics:stm32:STeaMi`, STM32duinoBLE `1.5.0`, bibliothèque STeaMi `0.40.0` ; ces versions ne sont écrites qu'à un endroit, `versions.json` du sample.
- Archive : `steami-exemples-<tag>.zip`, tag `vX.Y.Z`, contenu `index.json` (`version == tag`) + `<GROUPE>/<Nom>.bin`, format identique à celui produit par `scripts/build-examples-archive.py` d'arduino-steami-lib (zip déterministe).
- Release du sample : semantic-release (`feat` → mineure, `fix` → correctif), puis release en brouillon, archive jointe, vérification (`uploaded`, taille, digest `sha256:`), publication. Releases immuables imposées sur ce dépôt.
- GitHub App de l'organisation (secrets `RELEASE_APP_ID`, `RELEASE_APP_SECRET`) pour la release du sample et pour les robots du wiki ; jamais `GITHUB_TOKEN` pour ouvrir une PR qui doit déclencher une CI. Jeton limité au dépôt cible.
- Personne ne pousse sur `main` (ruleset de l'organisation) : tout passe par PR ; les PR humaines sont fusionnées par l'utilisateur.
- Licence du sample : GPL-3.0 ; le wiki dit que les croquis écrits dans ses pages y sont republiés sous GPL-3.0.
- Marquage d'un bloc `cpp` complet (`setup(` et `loop(`) écrit en ligne dans `docs/` : `sample=GROUPE/Nom` ou `norun` ; sinon la CI du wiki échoue. Le robot n'ajoute jamais un croquis qui existe déjà au tag épinglé (le lint refuse ce cas).
- Groupes : `CAPTEURS`, `ECRAN`, `PREMIERS`, `CARTE`, `BOUTONS`, `BUZZER`.
- Wiki : ton neutre (infinitif, ni tu ni vous), sommaire TOCInline sur les pages longues, CSpell, markdownlint, prettier ; commits conventionnels en français, sans attribution. Sample : commits conventionnels en anglais (style « feat(scope): Sentence. »), README en anglais, croquis du wiki en français.
- Carte V1c partagée : créneau à demander à wiki-steami-71 ; jamais de DAPLink, pile radio, zone de configuration ; battery_status remis à la fin.

## Review Focus

1. **Croquis qui ne compile pas dans le sample** (API absente de la bibliothèque épinglée, croquis V1a/V1b seulement) : la CI du sample échoue sur la PR et rien n'est publié ; le message nomme le croquis. Tests en Tâche 2.
2. **Archive incompatible avec le wiki** (nom, `index.json`, chemins) : le prebuild du wiki la refuse avec un message clair, et la règle 0 du lint (`version == tag`) tient. Tests en Tâches 3 et 6.
3. **Bloc `sample=` mal formé ou dupliqué** (id invalide, groupe inconnu, même id deux fois dans le wiki, id déjà présent dans le sample) : la CI du wiki échoue avec un message qui dit quoi faire. Tests en Tâche 12.
4. **Conversion d'une page** (bloc dans des onglets `<Release>`, bloc suivi de texte, plusieurs blocs dans la même section, fins de ligne) : seul le bloc visé est remplacé, le reste de la page est identique octet pour octet. Tests en Tâche 14.
5. **Robot rejoué** (même croquis en attente, PR du sample déjà ouverte, branche existante) : aucune PR en double, la PR existante est mise à jour. Tests en Tâche 13.

---

## Livraison 1 — dépôt arduino-steami-sample

Clone de travail : `/home/nedjar/sandbox/arduino-steami-sample`, branche `feat/wiki-sketches` partie de `main`.

### Task 0: Prérequis (utilisateur et contrôleur)

- [ ] **Step 1 :** l'utilisateur autorise `arduino-steami-sample` sur le secret d'organisation `RELEASE_APP_SECRET`.
- [ ] **Step 2 :** le contrôleur clone le dépôt, crée la branche, et relève l'adresse de commit d'Aline Dumont dans les commits des PR #3 et #4 (`gh pr view 3 --json commits`) pour le `Co-authored-by`.

### Task 1: Structure, licence, reprise de #3 et #4

**Files :**

- Delete : `platformio.ini`, `boards/`, `src/main.cpp`, `LED/blink.cpp`
- Create : `LICENSE` (texte GPL-3.0, copie de celui d'arduino-steami-lib), `README.md` (réécrit), `.gitignore`, `versions.json`, `examples/BOUTONS/<Nom>/<Nom>.ino`, `examples/BUZZER/<Nom>/<Nom>.ino`

**Interfaces :**

- Produces : `versions.json` = `{"core": "3.1.0", "core_url": "<URL BoardManager stm32duino>", "fqbn": "STMicroelectronics:stm32:STeaMi", "STM32duinoBLE": "1.5.0", "STeaMi": "0.40.0"}`.

- [ ] **Step 1 :** lire les PR #3 et #4 (`gh pr diff`), transformer leurs croquis `setup_/loop_` inclus dans `main.cpp` en croquis Arduino autonomes (`setup()`, `loop()`), un dossier par croquis, sans changer leur comportement. Noms CamelCase tirés de leur rôle (par exemple `BOUTONS/LedsBoutons`, `BUZZER/Melodie`).
- [ ] **Step 2 :** README : rôle du dépôt (source des croquis du wiki STeaMi, compilés pour le bouton Téléverser), arborescence, conventions (un dossier par croquis, français permis, `#include` des en-têtes STeaMi), comment compiler en local avec `scripts/compile-examples.sh`, licence.
- [ ] **Step 3 :** commit `feat: Restructure the repository for the wiki sketches.` avec `Co-authored-by: <Aline Dumont>` pour les deux croquis repris (ou un commit par croquis repris).

### Task 2: Compilation locale et CI

**Files :**

- Create : `scripts/compile-examples.sh`, `scripts/versions.py` (lecture de `versions.json`), `.github/workflows/ci.yml`, `scripts/tests/test_versions.py`, `scripts/tests/test_compile_examples.py`

**Interfaces :**

- Consumes : `versions.json` (Tâche 1).
- Produces : `scripts/compile-examples.sh <dossier-sortie>` : installe si besoin le core, STM32duinoBLE et STeaMi aux versions de `versions.json`, compile chaque `examples/*/*/` avec `arduino-cli compile --fqbn <fqbn>`, copie `<Nom>.ino.bin` vers `<sortie>/<GROUPE>/<Nom>.bin`, échoue au premier croquis en erreur en nommant `GROUPE/Nom`, refuse un dossier dont le `.ino` ne porte pas le nom.
- Produces : job CI `compile` (nom de vérification stable, à exiger par le ruleset), sur `pull_request` et `push` sur `main` ; artefact des `.bin`.

- [ ] **Step 1 : tests qui échouent** (`test_compile_examples.py`, avec un faux `arduino-cli` dans le PATH qui écrit un `.bin` ou échoue) : un croquis → `<sortie>/G/N.bin` ; `.ino` mal nommé → échec qui nomme le dossier ; compilation en erreur → code non nul et `G/N` dans le message. `test_versions.py` : `versions.json` valide, et aucune version écrite en dur dans `ci.yml` ni dans les scripts.
- [ ] **Step 2 :** lancer `python3 -m pytest scripts/tests -q`. Attendu : échec.
- [ ] **Step 3 :** implémenter, en reprenant la logique de `scripts/compile-package-examples.sh` d'arduino-steami-lib.
- [ ] **Step 4 :** installer arduino-cli dans le scratchpad (binaire officiel), lancer `scripts/compile-examples.sh /tmp/.../bin` sur les croquis de la Tâche 1. Attendu : deux `.bin`. Relancer pytest : vert.
- [ ] **Step 5 :** commit `ci: Compile every sketch with arduino-cli.`

### Task 3: Release et archive

**Files :**

- Create : `.releaserc.json`, `.github/workflows/release.yml`, `.github/workflows/examples-archive.yml`, `scripts/build-examples-archive.py`, `scripts/tests/test_build_examples_archive.py`, `package.json` (dépendances semantic-release, versions copiées d'arduino-steami-lib)

**Interfaces :**

- Produces : à chaque release `vX.Y.Z`, l'asset `steami-exemples-vX.Y.Z.zip` au format d'arduino-steami-lib, sur une release immuable publiée après vérification.

- [ ] **Step 1 : tests qui échouent** (`test_build_examples_archive.py`, repris de ceux d'arduino-steami-lib s'ils existent, sinon) : zip déterministe (deux constructions identiques octet pour octet), `index.json` avec `version == tag` et une entrée par croquis, tag invalide refusé, `.bin` manquant refusé.
- [ ] **Step 2 :** lancer, attendu : échec.
- [ ] **Step 3 :** copier et adapter `build-examples-archive.py`, `.releaserc.json` et les workflows `release.yml` / `examples-archive.yml` d'arduino-steami-lib (jeton App, release en brouillon, asset, vérification `uploaded`/taille/digest, publication, `--latest` par `sort -V`, concurrence par tag, garde `main`), sans la partie paquet Arduino.
- [ ] **Step 4 :** relancer : vert. `actionlint` sur les workflows si disponible (`pip`/binaire dans le scratchpad), sinon relecture.
- [ ] **Step 5 :** commit `ci: Publish the compiled sketches as a release archive.`

### Task 4: Migration des croquis de Capteurs et Écran

**Files :**

- Create : `examples/CAPTEURS/<Nom>/<Nom>.ino` (18 croquis), `examples/ECRAN/<Nom>/<Nom>.ino` (4 croquis)

**Interfaces :**

- Produces : ids `CAPTEURS/MouvementImu`, `CAPTEURS/MouvementDriverIsm330dl`, `CAPTEURS/Boussole`, `CAPTEURS/BoussoleDriverLis2mdl`, `CAPTEURS/Distance`, `CAPTEURS/DistanceDriverVl53l1x`, `CAPTEURS/Boutons`, `CAPTEURS/BoutonsDriverMcp23009e`, `CAPTEURS/Batterie`, `CAPTEURS/BatterieDriverBq27441`, `CAPTEURS/Meteo`, `CAPTEURS/MeteoDriverWsen`, `CAPTEURS/MeteoDriverBme280`, `CAPTEURS/LumiereCouleur`, `CAPTEURS/Gestes`, `CAPTEURS/LumiereDriverApds9960`, `CAPTEURS/Microphone`, `CAPTEURS/FichierDisqueUsb`, `ECRAN/EcranBonjour`, `ECRAN/EcranHumidite`, `ECRAN/EcranDriverSsd1327`, `ECRAN/EcranDriverGc9a01`.

- [ ] **Step 1 :** copier chaque bloc de `docs/software/arduino/capteurs.md` (wiki `origin/main`) dans son fichier, à l'identique (code tel qu'affiché aujourd'hui), avec une ligne d'en-tête de commentaire qui nomme la page du wiki d'origine. Correspondance bloc → id : tableau du relevé (blocs 1 à 22 dans l'ordre de la page).
- [ ] **Step 2 :** `scripts/compile-examples.sh` sur tout le dépôt. Attendu : 24 `.bin`. Un croquis qui ne compile pas avec STeaMi 0.40.0 est corrigé a minima et signalé dans le rapport (la page du wiki devra suivre).
- [ ] **Step 3 :** commit `feat: Add the sketches of the wiki pages Capteurs and Écran.`

### Task 5: Mise en service (contrôleur et utilisateur)

- [ ] **Step 1 :** pousser `feat/wiki-sketches`, ouvrir la PR (Closes #5), vérifier la CI `compile` verte.
- [ ] **Step 2 :** l'utilisateur fusionne (squash) ; le contrôleur commente puis ferme #1, #2, #3, #4 avec un renvoi à la PR et à la reprise créditée.
- [ ] **Step 3 :** l'utilisateur ajoute un ruleset au dépôt qui exige la vérification `compile` (le contrôleur fournit le nom exact et vérifie par `gh api repos/steamicc/arduino-steami-sample/rules/branches/main`).
- [ ] **Step 4 :** vérifier la release `v1.0.0` : asset présent, publiée, `index.json` lu par `unzip -p`, 24 entrées.

---

## Livraison 2 — wiki : seconde source, page Écran, inclusion

Worktree : `/home/nedjar/sandbox/wiki_steami-pile-radio`, branche `feat/croquis-sample` partie de `main` (après fusion de la conception).

### Task 6: Épinglage et récupération du sample

**Files :**

- Create : `exemples-arduino-sample.json`, tests dans `scripts/tests/test_fetch_arduino_examples.py` (ou fichier jumeau)
- Modify : `scripts/fetch-arduino-examples.sh` (paramétré par source) ou création d'un jumeau `scripts/fetch-arduino-sample.sh`, `package.json` (`prebuild`), `.gitignore`

**Interfaces :**

- Produces : `exemples-arduino-sample.json` = `{"version": "v1.0.0", "sha256": "<sha de l'asset>"}` ; au prebuild, `static/exemples-arduino-sample/{index.json,<GROUPE>/<Nom>.bin}` et `.external/arduino-steami-sample/` (clone au tag).

- [ ] **Step 1 : tests qui échouent**, sur le modèle des tests existants du fetch : archive valide installée dans la nouvelle destination ; sha256 différent → échec et existant intact ; déjà à jour → rien téléchargé ; clone des sources au tag ; les deux sources s'installent sans s'écraser.
- [ ] **Step 2 :** lancer : échec.
- [ ] **Step 3 :** implémenter (préférer le paramétrage du script existant à la duplication, sans changer le comportement de la source bibliothèque).
- [ ] **Step 4 :** pytest vert, puis `npm run prebuild` réel : les deux destinations sont remplies.
- [ ] **Step 5 :** commit `feat(configs): épingler les croquis compilés d'arduino-steami-sample`.

### Task 7: Bouton à deux sources

**Files :**

- Modify : `src/components/EssayerExemple/logique.mjs`, `logique.test.mjs`, `index.js`

**Interfaces :**

- Produces : `<EssayerExemple id="GROUPE/Nom" source="sample" />` ; `urlBin(id, source = 'bibliotheque')` → `/exemples-arduino/…` ou `/exemples-arduino-sample/…` ; `nomFichier` inchangé ; source inconnue refusée comme un id invalide.

- [ ] **Step 1 : tests qui échouent** : `urlBin('CAPTEURS/Distance', 'sample')`, valeur par défaut inchangée pour les ids existants, source inconnue.
- [ ] **Step 2-4 :** implémenter, `npm run test:js` vert.
- [ ] **Step 5 :** commit `feat(software): bouton Téléverser pour les croquis d'arduino-steami-sample`.

### Task 8: Lint multi-source

**Files :**

- Modify : `scripts/check-arduino-examples.py`, `scripts/tests/test_check_arduino_examples.py`
- Create : `scripts/exemples-arduino-sample-a-documenter.txt`

**Interfaces :**

- Produces : pour la source sample, règles : (a) chaque id de `static/exemples-arduino-sample/index.json` est utilisé par un `<EssayerExemple source="sample">` ou listé en attente ; (b) chaque `<EssayerExemple source="sample" id="G/N">` est précédé, dans la même section, d'un bloc `file=.external/arduino-steami-sample/examples/G/N/N.ino` ; (c) la règle 2 (titre `## <Nom>`) ne s'applique pas à la source sample ; (d) règle 0 sur l'index du sample. Source bibliothèque : inchangée.

- [ ] **Step 1 : tests qui échouent** pour (a) à (d), et non-régression de la source bibliothèque.
- [ ] **Step 2-4 :** implémenter, pytest vert, `npm run lint:arduino-examples` vert sur `main` (BOUTONS et BUZZER en attente, CAPTEURS et ECRAN en attente tant que la Tâche 10 n'est pas faite).
- [ ] **Step 5 :** commit `fix(software): lint des exemples Arduino à deux sources`.

### Task 9: Robot de suivi du sample

**Files :**

- Create : `.github/workflows/suivre-croquis-sample.yml` (jumeau de `suivre-exemples-arduino.yml`, ou matrice si le diff reste lisible)

**Interfaces :**

- Produces : PR `chore/croquis-sample-vX-Y-Z` qui met à jour `exemples-arduino-sample.json`, fusion automatique sur CI verte, mêmes contrôles (digest, sha256) ; un point d'extension documenté où la Tâche 14 branchera la conversion.

- [ ] **Step 1 :** écrire le workflow en reprenant `suivre-exemples-arduino.yml` (dépôt, fichier d'épinglage, préfixe de branche, titres).
- [ ] **Step 2 :** `actionlint` (ou relecture), et `workflow_dispatch` en essai à blanc si le workflow le prévoit.
- [ ] **Step 3 :** commit `ci(configs): robot de suivi des croquis d'arduino-steami-sample`.

### Task 10: Pages Capteurs et Écran

**Files :**

- Create : `docs/software/arduino/ecran.md`
- Modify : `docs/software/arduino/capteurs.md`, `docs/software/arduino/carte.md`, `docs/software/arduino/exemples/gc9a01.md`, `docs/software/arduino/exemples/ssd1327.md`, `scripts/exemples-arduino-sample-a-documenter.txt`

**Interfaces :**

- Consumes : ids de la Tâche 4, `source="sample"` (Tâche 7).

- [ ] **Step 1 :** déplacer la section « Écran » (lignes 625 à 759 d'`origin/main`) et la phrase de présentation de SteamiDisplay/SteamiScreen (ligne 23) dans `ecran.md` (frontmatter `title: Écran`, `sidebar_position: 5.5`, sommaire, ton neutre) ; capteurs.md devient « Capteurs » (frontmatter et titre).
- [ ] **Step 2 :** remplacer chaque bloc des deux pages par `file=.external/arduino-steami-sample/examples/<G>/<N>/<N>.ino` suivi de `<EssayerExemple id="<G>/<N>" source="sample" />`, y compris dans les onglets `<Release>` (un bouton par onglet) ; ajouter, une fois par page, la phrase qui dit que ces croquis viennent d'arduino-steami-sample, sous GPL-3.0.
- [ ] **Step 3 :** corriger les liens `capteurs#écran` (carte.md, exemples/gc9a01.md, exemples/ssd1327.md) vers `ecran` et les liens relatifs de la section déplacée ; retirer CAPTEURS et ECRAN de la liste d'attente.
- [ ] **Step 4 :** `npm run build` (liens et ancres), `npm run lint:arduino-examples`, `lint:md`, `lint:spell`, `test:js` : verts. Le texte affiché des croquis est identique à celui d'avant (même source).
- [ ] **Step 5 :** commits `docs(software): page Écran séparée de Capteurs` puis `docs(software): croquis de Capteurs et Écran avec le bouton Téléverser`.

### Task 11: Essai sur la V1c (contrôleur)

- [ ] **Step 1 :** créneau auprès de wiki-steami-71 ; build et serveur local ; Chrome sous Xvfb.
- [ ] **Step 2 :** sur les pages Capteurs et Écran : téléverser `CAPTEURS/Distance`, `CAPTEURS/Meteo`, `ECRAN/EcranHumidite`, `ECRAN/EcranDriverGc9a01` ; lire la console et photographier l'écran. Attendu : sorties et affichages conformes au texte des pages.
- [ ] **Step 3 :** remettre battery_status, rendre la carte. Pousser, PR (Refs #251), l'utilisateur fusionne.

---

## Livraison 3 — wiki : croquis en ligne et robot

Branche `feat/croquis-robot` partie de `main` après la livraison 2.

### Task 12: Marquage et vérification des croquis en ligne

**Files :**

- Create : `scripts/croquis_en_ligne.py` (module commun : repérage des blocs, lecture de la meta), `scripts/check-inline-sketches.py`, `scripts/tests/test_croquis_en_ligne.py`
- Modify : `package.json` (`lint:inline-sketches`), `.github/workflows/build.yml`, `docs/software/arduino/premiers-programmes.md`, `carte.md`, `bibliotheques.md`, `platformio.md`, `plugins/remark-code-file.js` si la meta `sample=`/`norun` y gêne

**Interfaces :**

- Produces : `croquis_en_ligne.blocs(docs_dir) -> list[Bloc]` avec `Bloc(fichier, ligne_debut, ligne_fin, meta, code, id_sample | None, norun: bool)` ; un bloc est « complet » s'il est en `cpp`/`ino`, sans `file=`, et contient `setup(` et `loop(`.
- Produces : `check-inline-sketches.py` échoue (message qui dit quoi ajouter) pour : bloc complet sans `sample=` ni `norun` ; `sample=` invalide (regex, groupe hors liste) ; même id deux fois ; id déjà présent dans `.external/arduino-steami-sample/examples/` au tag épinglé. Il annonce (sans échouer) chaque bloc `sample=` en attente du robot.

- [ ] **Step 1 : tests qui échouent** pour chaque cas ci-dessus, et pour les cas de la Review Focus 3.
- [ ] **Step 2-4 :** implémenter, pytest vert.
- [ ] **Step 5 :** marquer les 10 blocs existants : `premiers-programmes.md` → `sample=PREMIERS/ClignoterLed`, `PREMIERS/LireBoutons`, `PREMIERS/JouerSon` ; `carte.md` → `sample=CARTE/ToutesLesCartes` (l. 92), `CARTE/DriversPartages` (l. 213), `CARTE/MesDrivers` (l. 299), `norun` pour les deux blocs à `loop() {}` vide (l. 30 et 373) ; `bibliotheques.md` (l. 99) et `platformio.md` (l. 100) → `norun`. Le bloc garde son affichage (la meta ne change pas le rendu).
- [ ] **Step 6 :** `npm run lint:inline-sketches` vert (6 blocs annoncés en attente), build vert ; commit `feat(software): marquage et vérification des croquis Arduino écrits en ligne`.

### Task 13: Robot page → sample

**Files :**

- Create : `.github/workflows/croquis-vers-sample.yml`, `scripts/croquis-vers-sample.py`, tests dans `scripts/tests/test_croquis_en_ligne.py`

**Interfaces :**

- Consumes : `croquis_en_ligne.blocs`.
- Produces : sur `push` de `main` (chemins `docs/**`) et `workflow_dispatch` : pour les blocs `sample=` absents du sample au tag épinglé et absents de `main` du sample, une seule branche `wiki/croquis` et une seule PR ouverte dans `arduino-steami-sample` (créée ou mise à jour), un commit `feat(<groupe en minuscules>): Add <Nom> from the wiki.` par croquis, fichier `examples/<G>/<N>/<N>.ino` = code du bloc + ligne d'en-tête qui nomme la page ; jeton App limité au sample.

- [ ] **Step 1 : tests qui échouent** de `croquis-vers-sample.py` (dépôt sample simulé dans un dossier git temporaire) : ajout d'un croquis, rejeu sans doublon, croquis déjà sur `main` du sample ignoré, PR déjà ouverte mise à jour (Review Focus 5).
- [ ] **Step 2-4 :** implémenter (le script prépare la branche et les fichiers ; le workflow pousse et ouvre la PR avec `gh`), pytest vert, actionlint.
- [ ] **Step 5 :** commit `ci(configs): robot qui ajoute les croquis en ligne à arduino-steami-sample`.

### Task 14: Conversion dans la PR d'épinglage

**Files :**

- Create : `scripts/convertir-croquis.py`, tests dans `scripts/tests/test_croquis_en_ligne.py`
- Modify : `.github/workflows/suivre-croquis-sample.yml` (point d'extension de la Tâche 9)

**Interfaces :**

- Produces : `convertir-croquis.py <dossier sample au nouveau tag>` remplace chaque bloc `sample=G/N` dont `examples/G/N/N.ino` existe par la ligne ` ```cpp file=.external/arduino-steami-sample/examples/G/N/N.ino `, une ligne vide ` ``` `, une ligne vide et `<EssayerExemple id="G/N" source="sample" />` ; ajoute l'import d'`EssayerExemple` en tête de page s'il manque ; ne touche à rien d'autre.

- [ ] **Step 1 : tests qui échouent** : cas de la Review Focus 4 (onglets, plusieurs blocs, texte autour, CRLF), import ajouté une seule fois, idempotence (deuxième passage sans effet).
- [ ] **Step 2-4 :** implémenter, brancher dans le robot de suivi avant le commit d'épinglage, pytest vert.
- [ ] **Step 5 :** commit `ci(configs): conversion des croquis en ligne dans la PR d'épinglage`.

### Task 15: Essai de bout en bout (contrôleur et utilisateur)

- [ ] **Step 1 :** pousser, PR (Closes #251), l'utilisateur fusionne.
- [ ] **Step 2 :** le robot de la Tâche 13 ouvre la PR du sample avec les 6 croquis PREMIERS et CARTE ; sa CI compile ; l'utilisateur fusionne ; la release suit.
- [ ] **Step 3 :** le robot de suivi ouvre la PR d'épinglage qui convertit les 6 blocs ; CI verte ; fusion automatique. Vérifier le diff de conversion.
- [ ] **Step 4 :** créneau V1c : téléverser un croquis converti (`PREMIERS/ClignoterLed`) depuis la page ; photo ; battery_status remis.
