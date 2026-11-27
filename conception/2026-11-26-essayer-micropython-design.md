# Essayer le code MicroPython du wiki sur la carte — conception

Date : 2026-11-26. Statut : validée par l'utilisateur. Issue : steamicc/wiki_steami#233.

## Intention

Un lecteur du wiki qui voit un programme MicroPython (dans une page d'exemples,
un tutoriel ou une page capteur) doit pouvoir **voir directement ce qu'il fait
sur sa carte**, en un clic, sans rien installer : ni Thonny, ni `mpremote`, ni
firmware à télécharger à la main. C'est l'équivalent MicroPython du bouton
« Téléverser » des pages d'exemples Arduino
(`conception/2026-11-25-exemples-arduino-design.md`).

Aujourd'hui, le wiki contient peu de code MicroPython (17 blocs, dont un seul
exemple complet tiré de la bibliothèque), mais les tutoriels
(steamicc/micropython-steami-tutorials#5) et les samples
(steamicc/micropython-steami-sample#3) doivent y être migrés : l'outil doit être
prêt pour eux.

## Objectifs

- Un bouton **« Essayer sur la carte »** sous les blocs de code MicroPython
  exécutables, avec une **console** qui affiche la sortie du programme et un
  bouton **Arrêter**.
- Le programme est **lancé sans être enregistré** : il tourne en RAM et disparaît
  au redémarrage de la carte ; le `main.py` et les fichiers de l'utilisateur ne
  sont pas touchés. Les fichiers annexes déclarés par le bloc (voir 3) sont
  déposés dans un disque en RAM, pas sur la flash.
- Avant de lancer, la carte est vérifiée :
  1. **DAPLink** trop ancien : un encart propose la mise à jour, guidée à la main
     comme dans le Codespace (le DAPLink ne peut pas se flasher lui-même) ;
  2. **pas de MicroPython** (programme Arduino, carte neuve…) ou **MicroPython
     plus ancien que la version épinglée** : un encart propose « Installer
     MicroPython vX.Y.Z », prévient que les fichiers de la carte peuvent être
     effacés, et **ne flashe qu'après un clic de confirmation** ; le flash passe
     par WebUSB, avec une barre de progression, puis le programme est lancé ;
  3. MicroPython à jour : le programme est lancé directement.
- Le wiki affiche une **version épinglée** de la bibliothèque MicroPython : le
  code des exemples affiché et le firmware proposé viennent de la même release ;
  un robot propose chaque nouvelle release par PR.

## Non-objectifs

- Éditer le code dans la page (le bouton lance le code tel qu'affiché).
- Installer le programme comme `main.py` (pour cela : Thonny, `mpremote`,
  documentés dans le wiki).
- Lancer depuis Firefox ou Safari (pas de WebUSB) : la page reste lisible, le
  bouton est remplacé par un renvoi vers les outils classiques.
- Mettre à jour le DAPLink automatiquement.
- La pile radio BLE (procédure à part, `docs/software/pile-radio.md`).

## Anti-objectifs (échec même si ça « marche »)

- Flasher le firmware, écraser des fichiers de l'utilisateur, ou lancer un
  exemple qui modifie la carte de façon durable, sans son clic de confirmation
  explicite.
- Un bouton sous un bloc qui ne peut pas tourner seul (fragment, session REPL
  `>>>`) : il échouerait à coup sûr.
- Le code affiché vient d'une version de la bibliothèque et le firmware proposé
  d'une autre.
- Le contenu du wiki change sans PR fusionnée.
- Une page inutilisable sans carte branchée.

## Contraintes

- Wiki : Docusaurus 3.9.2, React 19, en français ; prebuild
  `scripts/fetch-examples.sh` (clone aujourd'hui `micropython-steami-lib` sur
  `main`, **non épinglé**) ; plugin `plugins/remark-code-file.js`
  (` ```python file=.external/… `).
- Composant existant `src/components/EssayerExemple/` : connexion DAP.js 2.3.0
  (WebUSB, Chrome/Edge, https) **partagée par la page** (`carte.mjs`), flash d'un
  `.bin`, console série à 115200 bauds lue par `startSerialRead`, erreurs en
  français, libération de la carte quand on quitte les pages d'exemples, bouton
  Déconnecter. Pas de `dap.reset()` après `flash()` (le DAPLink redémarre la
  carte).
- Sur la STeaMi, le **REPL MicroPython** passe par l'UART que le DAPLink relaie :
  le même que la console série du composant. DAP.js sait aussi y écrire
  (`serialWrite`), mais le wiki ne l'a jamais fait : **à vérifier sur la carte
  en premier** (voir 6).
- Firmware MicroPython : chaque release `vX.Y.Z` de `micropython-steami-lib`
  publie `steami-micropython-firmware-vX.Y.Z.bin` et `.hex`, ainsi qu'un firmware
  DAPLink. Le firmware **n'indique pas aujourd'hui de quelle release il vient**
  (`os.uname()` donne le commit du fork MicroPython et une date).
- Flasher le firmware MicroPython **peut reformater** son système de fichiers.
  La pile radio BLE, le DAPLink et la zone de configuration ne doivent pas être
  touchés.
- DAPLink : version lue par la commande vendeur `0x9F` (réponse `STM1`, numéro,
  date) ; épinglage et règle de décision du Codespace
  (`steamicc/arduino-steami-devcontainer`, `flasher/support.js` :
  `lireVersionSteami`, `decisionMiseAJour`) ; firmware publié par les releases
  `steamicc/DAPLink` (`stm32f103xb_steami32_if_crc.bin`).
- Versions de carte : V1a/V1b (SSD1327, WSEN-HIDS/PADS, APDS-9960) et V1c
  (GC9A01, BME280). L'écran de la V1c n'est pas encore géré par MicroPython
  (micropython-steami-lib#368) : sur une V1c, un programme qui dessine tourne
  mais l'écran reste noir ; la console montre quand même ce qu'il fait.
- Dépôts : une issue, une branche et une PR par changement ; commits
  conventionnels ; fusions par l'utilisateur.

## Approches considérées

- **A. Tout par la connexion DAP.js existante (retenue).** Une seule connexion
  WebUSB sert à lire la version du DAPLink, flasher le firmware MicroPython et
  dialoguer avec le REPL par l'UART relayé. Une seule autorisation, partagée
  avec les pages Arduino ; le code éprouvé du composant est réutilisé. Liaison
  série lente (quelques ko/s), suffisante pour des scripts de quelques ko.
- **B. Web Serial pour le REPL, DAP.js pour le flash.** Plus rapide et standard,
  mais deux autorisations (appareil USB puis port série) et deux connexions ;
  choisir le bon port est un piège pour un élève. Solution de repli si l'essai
  de A échoue.
- **C. Renvoyer vers un éditeur en ligne (Vittascience, ViperIDE).** Ni DAPLink
  ni version du firmware, et on quitte la page. Écartée.

L'utilisateur a choisi A.

## Décisions

### 1. Bibliothèque : le firmware dit sa version

`micropython-steami-lib` grave son numéro de release dans le firmware, lisible
depuis le REPL par une seule expression, par exemple un module gelé
`steami_version` avec `VERSION = "v0.29.0"` (nom exact laissé au constructeur,
mais stable : le wiki en dépend). La valeur est écrite par le workflow de
release avant la compilation du firmware, à partir du tag.

Un firmware qui n'a pas ce module est considéré **plus ancien que toute version
épinglée** par le wiki (la première version épinglée sera celle qui l'apporte).

Décision de Claude, suite à la relecture : la version est rangée dans le paquet
`steami`, déjà gelé (par exemple `steami/version.py`), plutôt que dans un
nouveau module de premier niveau, qui demanderait de modifier le manifeste du
fork MicroPython. Un firmware compilé localement (`make micropython-firmware`)
porte la valeur `"dev"` : le wiki ne lui propose jamais de mise à jour (même
règle que le numéro 0 du DAPLink dans le Codespace), sinon les cartes des
mainteneurs se verraient proposer un reflash à chaque essai.

### 2. Wiki : version épinglée

- Fichier `micropython.json` à la racine du wiki :
  `{ "version": "vX.Y.Z", "sha256": "<sha256 du .bin>" }`.
- `scripts/fetch-examples.sh` clone `micropython-steami-lib` **au tag épinglé**
  (et non plus `main`), pour que le code affiché corresponde au firmware.
- Un script de prebuild télécharge `steami-micropython-firmware-vX.Y.Z.bin` de
  la release, **vérifie le sha256**, et le place dans `static/micropython/`
  (ignoré par git) avec un `index.json` (`version`, `taille`, `sha256`) : le
  navigateur ne lit que des fichiers du wiki.
- DAPLink : même épinglage que le Codespace (release `steamicc/DAPLink`, sha256),
  dans un fichier du wiki servi en `/daplink/firmware.bin` et
  `/daplink/firmware.json` (format du Codespace).
- Robot `suivre-micropython.yml`, sur le modèle de `suivre-exemples-arduino.yml`
  (jeton de la GitHub App, branche `chore/micropython-<tag>`, fusion automatique
  quand le CI est vert) : met à jour la version et le sha256 du firmware
  MicroPython. Le DAPLink est mis à jour à la main par PR (comme dans le
  Codespace).

### 3. Wiki : quels blocs sont exécutables

- Bloc en ligne : marqué explicitement ` ```python run `.
- Exemple inclus depuis la bibliothèque : ` ```python file=.external/micropython-steami-lib/lib/<driver>/examples/<nom>.py `
  reçoit le bouton automatiquement **si tous ses imports sont gelés dans le
  firmware épinglé**. Ce n'est pas le cas de tous : en v0.28.2, quatre exemples
  importent `hts221`, marqué `.not-frozen` (`hts221/examples/humidity.py`,
  `steami_screen/examples/comfort_bar_demo.py`,
  `wsen-pads/examples/station_env.py`,
  `steami_config/examples/calibrate_temperature.py`). Ceux-là restent sans
  bouton. Un marqueur `norun` permet aussi de retirer le bouton à la main.
- **Exemples qui modifient la carte durablement** (décision de l'utilisateur) :
  le bouton reste, mais le bloc porte `run confirm="<texte>"`. Le clic ouvre un
  encart qui dit précisément ce qui sera modifié, et le programme ne se lance
  qu'après **Lancer quand même**. Liste en v0.28.2 :
  `steami_config/examples/populate_demo_config.py` (remplace la configuration et
  les calibrations par des valeurs de démonstration),
  `steami_config/examples/calibrate_*.py` (écrivent dans la zone de
  configuration), `daplink_flash/examples/erase_flash.py` (efface la flash
  externe). Le CI tient cette liste et refuse un de ces exemples publié sans
  `confirm`.
- Fichiers annexes : un bloc peut déclarer des fichiers à déposer avant le
  lancement (par exemple `pins.py`, `mesh.py` des samples), par un attribut du
  bloc (`files=…`, chemins sous `.external/` ou blocs nommés de la page ;
  syntaxe exacte laissée au constructeur). Décision de Claude, suite à la
  relecture : ils sont écrits dans un **disque en RAM** de MicroPython, placé en
  tête de `sys.path`, et non sur la flash : rien de persistant n'est touché, ce
  qui respecte le « lancé sans être enregistré ». À vérifier à l'étape 1 de la
  livraison.
- Tout autre bloc Python reste un simple bloc de code, sans bouton.
- Un plugin remark transforme les blocs exécutables en
  `<EssayerMicroPython code="…" fichiers={…} />` (le code affiché reste coloré
  comme aujourd'hui).
- Le CI vérifie qu'un bloc exécutable est un programme Python valide (analyse
  syntaxique), que ses fichiers annexes existent, que les imports d'un exemple
  de la bibliothèque sont gelés, et que les exemples destructifs portent
  `confirm`. Attention : l'expression de `scripts/validate-code-examples.py`
  n'accepte aujourd'hui que `file=` juste après `python` ; elle ignorerait
  silencieusement ` ```python run `.

### 4. Wiki : composant d'essai et déroulement

`<EssayerMicroPython>` réutilise la connexion partagée de `carte.mjs` (même
autorisation, même bouton Déconnecter, même libération de la carte, mêmes
erreurs en français que `EssayerExemple`). Au clic sur **Essayer sur la carte** :

0. Si le bloc porte `confirm` : encart d'avertissement, **Lancer quand même** ou
   **Annuler**.
1. Connexion (si besoin) et lecture de la version du DAPLink (`0x9F`) ; s'il est
   plus ancien que l'épinglé : encart de mise à jour guidée, repris du Codespace
   (télécharger le firmware, `START_BL.ACT`, lecteur MAINTENANCE, se
   reconnecter), avec « Plus tard » ; l'essai continue si l'utilisateur reporte
   (sauf si l'étape 1 de la livraison révèle une version minimale du DAPLink
   indispensable au REPL). Décision de Claude : cette vérification n'a lieu que
   sur le chemin MicroPython ; les pages Arduino ne changent pas (la mise à jour
   du DAPLink y reste un non-objectif).
2. Sondage du REPL : interrompre le programme en cours (Ctrl-C), attendre l'invite
   MicroPython dans un délai borné, puis lire la version du firmware (1).
   Sans invite, la cause peut être l'absence de MicroPython, mais aussi un autre
   outil qui tient la carte (Thonny, `mpremote`) ou un programme qui bloque
   Ctrl-C. Décision de Claude : le composant redémarre alors la carte une fois
   et guette le message de démarrage de MicroPython. S'il le voit, il ne propose
   pas d'installer : il dit qu'un autre outil ou un programme occupe peut-être
   la carte. S'il ne le voit pas, il propose l'installation (3), et l'encart cite
   aussi l'autre explication possible.
3. Firmware absent ou plus ancien : encart de confirmation (version proposée,
   avertissement sur l'effacement possible des fichiers, boutons **Installer** et
   **Annuler**). Après **Installer** : flash du `.bin` épinglé par DAP.js, barre
   de progression, attente du redémarrage, nouveau sondage (2).
4. Dépôt des fichiers annexes s'il y en a (écriture par le REPL brut).
5. Lancement du programme en RAM par le REPL brut, sortie affichée dans la
   console sous le bloc (une seule console visible à la fois, sous le dernier
   bloc lancé, comme pour Arduino). Une erreur Python (traceback) s'affiche dans
   la console, mise en évidence.
6. **Arrêter** : interrompt le programme (Ctrl-C) et remet MicroPython dans un
   état propre (redémarrage logiciel), pour que l'essai suivant parte de zéro.
   Lancer un autre bloc arrête d'abord le programme en cours.

Sans WebUSB : pas de bouton ; une ligne renvoie vers les pages Thonny et
`mpremote` du wiki.

Pendant qu'un autre outil (Thonny, `mpremote`) utilise le port série de la
carte, le REPL est partagé : le composant le signale (étape 2), sans forcer.

### 5. Pages

- Les pages existantes ne changent pas, sauf pour marquer `run` les blocs qui
  sont des programmes complets (au moins l'exemple ISM330DL déjà inclus).
- Une section de `docs/software/micropython/` explique le bouton (ce qu'il fait,
  le lancement sans enregistrement, la mise à jour du firmware et du DAPLink).
- Les migrations des tutoriels et des samples marqueront leurs programmes
  exécutables ; elles sont hors de ce projet.

### 6. Livraison

1. **Essai jetable sur la carte** : avec DAP.js, envoyer `print(1+1)` au REPL
   brut par `serialWrite` et relire la réponse ; mesurer le débit en envoyant
   un script de 5 ko ; vérifier qu'un disque en RAM (`vfs`) se monte et s'importe.
   Point de vigilance : DAP.js n'ordonne pas sa boucle de lecture série avec les
   autres commandes (remarque du Codespace) ; écrire pendant la lecture est le
   vrai risque à tester. Si l'écriture ne marche pas ou si le débit est
   inutilisable, revenir ici et passer à l'approche B.
2. Bibliothèque : version gravée dans le firmware, nouvelle release.
3. Wiki : épinglage et récupération (MicroPython, DAPLink), plugin des blocs
   exécutables, composant et déroulement complet, page d'explication, CI.
4. Robot de suivi.

Chaque étape : issue, branche, PR, fusionnée par l'utilisateur. Les étapes
touchant la carte se font sur la V1c partagée, après demande de créneau.

## Laissé au constructeur

- Nom exact du module de version dans le paquet `steami` et forme de la valeur.
- Protocole REPL : mode brut ou « raw paste », découpage des envois, délais,
  écriture des fichiers annexes (dans le respect du débit mesuré à l'étape 1).
- Syntaxe exacte de la déclaration des fichiers annexes.
- Présentation des encarts, du bouton et de la console, dans le style du thème
  (mode sombre compris), en reprenant `EssayerExemple`.
- Découpage du code entre `EssayerExemple` et `EssayerMicroPython` (logique
  commune dans `carte.mjs` / `logique.mjs`) et ses tests.
- Messages d'erreur exacts, en français, qui disent quoi faire.
