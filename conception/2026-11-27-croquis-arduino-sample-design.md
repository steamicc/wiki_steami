# Croquis Arduino du wiki dans arduino-steami-sample — conception

Date : 2026-11-27. Issues : [wiki_steami#251](https://github.com/steamicc/wiki_steami/issues/251), [arduino-steami-sample#5](https://github.com/steamicc/arduino-steami-sample/issues/5).

## Intention

Les pages Arduino du wiki contiennent des croquis complets écrits en clair, en particulier les 22 de [Capteurs et écran](https://wiki.steami.cc/docs/software/arduino/capteurs/). Les lecteurs veulent les essayer sur la carte, comme les exemples des bibliothèques, qui ont déjà un bouton **Téléverser**. Ce bouton flashe un `.bin` compilé d'avance : l'archive des exemples d'arduino-steami-lib, construite par la CI de cette bibliothèque. Les croquis du wiki, eux, ne sont compilés par personne.

L'utilisateur veut que les croquis du wiki vivent dans [steamicc/arduino-steami-sample](https://github.com/steamicc/arduino-steami-sample). Ils pourront s'écarter des exemples des bibliothèques (en français, plus courts, pédagogiques), seront compilés par la CI de ce dépôt, et serviront au bouton. Le dépôt est la seule source : la page inclut le croquis par `file=`. Un croquis écrit en ligne dans une page est repris automatiquement par un robot, qui l'ajoute au dépôt puis remplace le code de la page par l'inclusion.

Dans le même mouvement, la section « Écran » de capteurs.md devient sa propre page : l'utilisateur juge que capteurs et écran sont deux sujets différents.

## Objectifs

- `arduino-steami-sample` compile chaque croquis à chaque PR et publie, à chaque release, une archive `steami-exemples-<tag>.zip` au format de celle d'arduino-steami-lib (`index.json` + `<GROUPE>/<Nom>.bin`).
- Le wiki sait lire deux sources d'exemples : la bibliothèque (comme aujourd'hui) et le dépôt sample, chacune épinglée et suivie par un robot.
- Les croquis de capteurs.md et de la nouvelle page Écran viennent du dépôt sample, avec le bouton **Téléverser** sous chacun.
- La CI du wiki repère un croquis complet écrit en ligne. S'il porte un nom de croquis, un robot l'ajoute au dépôt sample après la fusion de la page, puis, une fois le croquis publié, remplace le code en ligne par l'inclusion et le bouton dans la PR qui épingle la nouvelle version du dépôt sample.
- Une page Écran (`docs/software/arduino/ecran.md`) remplace la section « Écran » de capteurs.md, qui s'intitule désormais « Capteurs ». Tous les liens vers les anchors de l'ancienne section sont corrigés.

## Non-objectifs

- Compiler dans la CI du wiki (pas de chaîne de compilation dans le wiki).
- Remplacer les pages d'exemples des bibliothèques (`docs/software/arduino/exemples/`), qui gardent l'archive d'arduino-steami-lib.
- Faire connaître au bouton la release de la carte (V1a/V1b/V1c).
- Compiler aussi avec PlatformIO dans la CI du sample (la référence est arduino-cli, comme pour l'archive de la bibliothèque).

## Anti-objectifs

- Deux copies durables d'un même croquis (page et dépôt) qui divergent.
- Un bouton qui flashe un croquis qui n'a pas compilé dans la CI du sample.
- Une page bloquée par un robot qui pousse dans la PR de son auteur (fork compris).
- Une CI du wiki rouge à l'activation à cause des croquis existants.

## Contraintes (relevé du 2026-11-27)

- **Archive et suivi.** Le format, le nom `steami-exemples-<tag>.zip`, le tag `vX.Y.Z`, `index.json` avec `version == tag`, le contrôle du digest GitHub et le sha256 viennent de `scripts/build-examples-archive.py`, `scripts/compile-package-examples.sh` et `.github/workflows/examples-archive.yml` d'arduino-steami-lib, et de `.github/workflows/suivre-exemples-arduino.yml` du wiki.
- **Chaîne de référence.** arduino-cli, core `STMicroelectronics:stm32@3.1.0`, FQBN `STMicroelectronics:stm32:STeaMi`, STM32duinoBLE 1.5.0, bibliothèque STeaMi ≥ v0.40.0 (SteamiScreen, SteamiDisplay, microphone et Spleen).
- **Ids.** `idValide` impose `/^[A-Z0-9_-]+\/[A-Za-z0-9_]+$/` : `GROUPE/Nom`, un seul `/`.
- **`file=`.** Seuls les chemins sous `.external/` sont acceptés (`plugins/remark-code-file.js`).
- **App.** La GitHub App de l'organisation est installée sur toute l'organisation. Mais, le 2026-11-27, le dépôt sample ne voit que le secret d'organisation `RELEASE_APP_ID`, pas `RELEASE_APP_SECRET` (wiki_steami voit les deux ; arduino-steami-lib a son propre secret de dépôt). Un jeton limité à `arduino-steami-sample` permet au robot du wiki d'y ouvrir des PR qui déclenchent sa CI. `GITHUB_TOKEN` ne convient pas.
- **Releases immuables** : imposées par l'organisation sur le dépôt sample (`enforced_by_owner`). La publication suit donc obligatoirement brouillon, archive jointe, vérification, publication.
- **Licences** : wiki sous CC BY-SA 4.0, bibliothèque sous GPL-3.0 ; le dépôt sample n'a pas de licence.
- **Rulesets.** `Default_Ruleset` de l'organisation : PR obligatoire, historique linéaire, squash ou rebase. Personne, robot compris, ne pousse sur `main`.
- **Lint actuel des exemples** (`scripts/check-arduino-examples.py`, à relire avant de l'adapter) : règle 2 (titre `## <Nom> {#<nom>}` dans la section du bouton) et règle 3 (chaque id de l'index documenté ou en attente).
- **Croquis en ligne existants** : 22 dans capteurs.md, 3 dans premiers-programmes.md, 5 dans carte.md (dont 2 avec `loop() {}` vide), 1 dans bibliotheques.md (`loop() {}` vide), 1 `src/main.cpp` dans platformio.md.
- **Dépôt sample existant** (avril 2026, Charly-sketch) : projet PlatformIO, `.cpp` inclus dans `main.cpp`, deux PR ouvertes d'Aline Dumont (#3 boutons et LED, #4 mélodie au buzzer) et deux issues.

## Approches considérées

1. **Dépôt sample source unique, robot page → dépôt après fusion, conversion dans la PR d'épinglage (retenue par l'utilisateur).**
2. Robot page → dépôt sans conversion : la page garde son code, le dépôt une copie. Écartée : deux copies durables.
3. Compilation dans la CI du wiki. Écartée : chaîne de compilation à maintenir dans le wiki.

## Décisions

### 1. Dépôt arduino-steami-sample

- **Arborescence** : `examples/<GROUPE>/<Nom>/<Nom>.ino`, un dossier par croquis, le `.ino` porte le nom du dossier. Le groupe est en majuscules et suit la page : `CAPTEURS`, `ECRAN`, `CARTE`, `PREMIERS`… Les ids du wiki sont `GROUPE/Nom`, compatibles avec `idValide`.
- **Fichier de versions** (`versions.json` ou équivalent) : core, STM32duinoBLE, et version de la bibliothèque STeaMi (`arduino-cli lib install STeaMi@X` par le Library Manager, ou autre moyen vérifié par le constructeur). Un test de cohérence comme `test_workflow_versions.py`.
- **Montée de version de la bibliothèque** : manuelle, par un commit `fix(deps): STeaMi vX.Y.Z` (un `fix` publie une release, donc recompile les `.bin`). Pas de robot de suivi dans cette livraison. Décision de l'assistant.
- **Première version** : semantic-release part de v1.0.0. Décision de l'assistant.
- **CI de compilation** à chaque PR et sur `main` : tous les croquis avec arduino-cli, échec au premier croquis en erreur. Elle devient la vérification exigée par un ruleset du dépôt.
- **Release** : semantic-release (`feat` → mineure, `fix` → correctif), puis release en brouillon, archive jointe, vérification (`uploaded`, taille, digest), publication. Scripts repris d'arduino-steami-lib.
- **README** réécrit : rôle de source des croquis du wiki, français permis, conventions.
- **Contenu existant** (choix de l'utilisateur) : les croquis des PR #3 (boutons et LED) et #4 (mélodie au buzzer) d'Aline Dumont sont repris dans la nouvelle structure (`examples/BOUTONS/…`, `examples/BUZZER/…`), avec `Co-authored-by` ; ils sont listés « en attente » côté wiki. Les PR #3 et #4 et les issues #1 et #2 sont fermées avec un commentaire qui renvoie à la reprise et explique le nouveau rôle du dépôt. Le projet PlatformIO (`platformio.ini`, `boards/`, `src/main.cpp`, `LED/blink.cpp`) est retiré : il ne compile pas avec la bibliothèque STeaMi.
- **Licence** (choix de l'utilisateur) : GPL-3.0, celle de la bibliothèque. Fichier `LICENSE`, mention dans le README, et une phrase dans le wiki : les croquis écrits dans ses pages sont republiés sous GPL-3.0 dans le dépôt sample.
- **Secret de l'App** (choix de l'utilisateur) : l'utilisateur ajoute `arduino-steami-sample` aux dépôts autorisés du secret d'organisation `RELEASE_APP_SECRET` (réglage d'administration, une fois). La release du sample utilise ensuite le même script qu'arduino-steami-lib.

### 2. Wiki : seconde source

- Épinglage `exemples-arduino-sample.json` (`{version, sha256}`), récupéré au prebuild par un script paramétré (ou jumeau de `fetch-arduino-examples.sh`) vers `static/exemples-arduino-sample/`, et clone des sources au même tag dans `.external/arduino-steami-sample`.
- `EssayerExemple` reçoit une prop `source="sample"` (par défaut la bibliothèque) qui choisit la base d'URL des `.bin` : la regex des ids ne change pas. Le bouton « Vérifier la pile radio » suit l'id `BLE/…` quelle que soit la source.
- Le lint des exemples devient multi-source. Pour la source sample : chaque id de l'index est utilisé sur une page (ou listé en attente), chaque `<EssayerExemple source="sample">` a son `file=` juste au-dessus qui pointe sur le même croquis, sans exiger le titre `## <Nom>` de la règle 2 (les pages guides regroupent plusieurs croquis par section). Décision de l'assistant.
- Robot de suivi : le workflow de suivi est généralisé en matrice (bibliothèque, sample) ou doublé ; même contrôle de digest, même fusion automatique sur CI verte.

### 3. Croquis en ligne : marquage, vérification et robot

- **Marquage** (décision de l'assistant). Un croquis complet en ligne (bloc `cpp` avec `setup(` et `loop(`) porte dans sa meta soit `sample=GROUPE/Nom` (à reprendre dans le dépôt), soit `norun` (fragment pédagogique, `src/main.cpp` PlatformIO, croquis volontairement incomplet).
- **Vérification de la CI du wiki** : un croquis complet en ligne sans `sample=` ni `norun` fait échouer la CI, avec un message qui dit quoi ajouter. Un croquis `sample=` passe, avec une annotation : le robot s'en chargera après la fusion. La CI n'attend donc jamais le dépôt sample (pas de blocage, pas de push dans la PR d'un auteur ou d'un fork).
- **Robot, après fusion sur `main` du wiki** :
  1. pour chaque bloc `sample=` sans fichier dans le dépôt sample au tag épinglé (un bloc `sample=` qui nomme un croquis déjà présent au tag épinglé est refusé par le lint du wiki, avec un renvoi vers une PR du dépôt sample : le robot ne fait qu'ajouter, jamais remplacer — décision de l'assistant), ouvrir (ou mettre à jour) une PR dans `arduino-steami-sample` qui ajoute `examples/<GROUPE>/<Nom>/<Nom>.ino` avec le code du bloc ; sa CI compile ; un humain fusionne ; la release suit ;
  2. dans la PR d'épinglage du robot de suivi du sample (choix de l'utilisateur), qui fusionne seule quand la CI est verte, remplacer chaque bloc `sample=` dont le croquis existe au nouveau tag par `file=.external/arduino-steami-sample/examples/<GROUPE>/<Nom>/<Nom>.ino` et `<EssayerExemple id="GROUPE/Nom" source="sample" />`. Le contenu inclus est celui du dépôt : si un humain a corrigé le croquis dans la PR du sample, c'est la version corrigée qui s'affiche.
- Entre la fusion de la page et la conversion, la page montre le code en ligne, sans bouton : c'est la seule fenêtre où deux copies existent.

### 4. Migration initiale

Sans attendre le robot, une première PR du dépôt sample apporte les croquis de capteurs.md et de la page Écran (groupes `CAPTEURS` et `ECRAN`), et une PR du wiki les inclut avec le bouton. Les sections à onglets V1a/V1b et V1c ont un croquis par onglet (suffixe de nom, par exemple `TemperatureV1c`), le bouton apparaît dans chaque onglet, et le texte dit la release visée. Décision de l'assistant.

Les autres croquis complets en ligne (premiers-programmes, carte, bibliothèques, platformio) reçoivent `sample=` s'ils tournent seuls et ont un sens sur la carte, `norun` sinon (`loop() {}` vide, `src/main.cpp`). Décision de l'assistant ; le robot fera ensuite le reste.

### 5. Page Écran

- `docs/software/arduino/ecran.md`, juste après Capteurs dans la barre latérale ; capteurs.md devient « Capteurs ».
- La phrase de capteurs.md qui présente SteamiDisplay et SteamiScreen part dans la page Écran.
- Liens corrigés : `capteurs#écran` dans carte.md, exemples/gc9a01.md et exemples/ssd1327.md, et les liens relatifs de la section déplacée. Pas de redirection : Docusaurus ne redirige pas une ancre ; l'ancien lien mène à la page Capteurs.

### 6. Livraison

Trois issues et des PR séparées, dans l'ordre : (1) dépôt sample (structure, CI, release, migration initiale) ; (2) wiki (seconde source, page Écran, inclusion des croquis, lint) ; (3) vérification des croquis en ligne et robot. Chaque étape est vérifiée sur la V1c avant la suivante (bouton **Téléverser** de quelques croquis, avec la caméra).

## Laissé au constructeur

- Le moyen d'installer la bibliothèque STeaMi au tag épinglé dans la CI du sample.
- Le nom exact des scripts et workflows, le découpage en matrice ou en workflows jumeaux.
- Les noms des croquis (`CAPTEURS/Mouvement`, etc.), en CamelCase.

## Décisions de l'utilisateur (2026-11-27)

- Approche 1 : dépôt sample source unique, robot page → dépôt, conversion dans la PR d'épinglage.
- Contenu existant du sample : reprise de #3 et #4 avec crédit, retrait du projet PlatformIO.
- Secret de l'App : autorisation du dépôt sample sur le secret d'organisation.
- Licence du sample : GPL-3.0.
