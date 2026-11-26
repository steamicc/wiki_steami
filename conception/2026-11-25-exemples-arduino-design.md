# Exemples Arduino expliqués et à essayer depuis le wiki — conception

Date : 2026-11-25. Statut : validée par l'utilisateur. Issue : steamicc/wiki_steami#180.

## Intention

N'importe quel utilisateur de la carte STeaMi qui lit le code d'un exemple
Arduino (sur le wiki, sur GitHub ou dans l'IDE) se demande ce que ça fait. Le
wiki doit lui permettre de **lire l'exemple, le comprendre et le voir tourner
sur sa carte en un clic**, sans rien installer. Au-delà de l'essai, les
exemples deviennent un support pour **comprendre les composants de la carte et
leurs drivers** : chaque exemple est visible, lisible et expliqué.

La page Téléverser du Codespace (`steamicc/arduino-steami-devcontainer`,
`.devcontainer/source/flasher/`) montre que l'envoi sur la carte et la console
série fonctionnent depuis Chrome/Edge par WebUSB (DAP.js 2.3.0). On reprend ce
savoir-faire dans le wiki, pour des programmes déjà compilés.

## Objectifs

- Une section « Exemples » du wiki Arduino, avec **une page par composant**
  (15 aujourd'hui : APDS9960, BLE, BME280, BQ27441, DAPLINK_FLASH, GC9A01,
  ISM330DL, LIS2MDL, MCP23009E, SSD1327, STEAMI_BOARD, STEAMI_CONFIG, VL53L1X,
  WSEN-HIDS, WSEN-PADS ; 78 exemples dans le paquet v0.34.0).
- Pour **chaque exemple** de la page : « Ce que tu vas voir », le matériel
  nécessaire s'il en faut en plus de la carte, le **code complet** coloré,
  « Comment ça marche » (les appels au driver expliqués), puis le bouton
  **Téléverser** et la **console série**.
- Une **ancre stable par exemple** (lien direct), utilisée par des liens
  « ▶ Essayer sur la carte » dans les README des drivers et dans les pages
  capteurs du wiki.
- Navigateur sans WebUSB (Firefox, Safari) : le bouton devient **Télécharger
  le .bin**, avec une ligne qui explique de le glisser sur le lecteur STEAMI.
- Le wiki affiche une **version épinglée** des exemples ; un robot propose la
  mise à jour par PR, que l'utilisateur fusionne.
- Les explications **ne prennent pas de retard** sur le code : le CI du wiki
  échoue si un exemple publié n'est pas expliqué (hors liste d'attente
  explicite) ou si une page cite un exemple qui n'existe pas.

## Non-objectifs

- Compiler ou modifier du code dans le navigateur.
- Les exemples MicroPython (déjà inclus ailleurs dans le wiki).
- Mettre à jour le DAPLink depuis le wiki (reste au Codespace).
- Téléverser depuis Firefox/Safari (téléchargement seulement).

## Anti-objectifs (échec même si ça « marche »)

- Le contenu du wiki change sans PR fusionnée par l'utilisateur.
- Des explications qui paraphrasent le code ligne à ligne sans rien apprendre
  du composant ni du driver.
- Le code affiché et le `.bin` téléversé ne viennent pas de la même version.
- Une page inutilisable sans carte branchée (la lecture doit rester complète).

## Contraintes

- Wiki : Docusaurus 3.9.2, React 19, construit par `npm run build` (prebuild
  `scripts/fetch-examples.sh`), déployé par Netlify et par GitHub Pages
  (`deploy.yml`). Le plugin `plugins/remark-code-file.js` remplace un bloc
  ` ```cpp file=.external/… ` par le contenu du fichier (chemins sous
  `.external/` seulement).
- Paquet Arduino : publié par `publish-arduino-package.yml` de
  `steamicc/arduino-steami-lib` dans le dépôt de distribution
  `steamicc/arduino-steami` (une release GitHub `vX.Y.Z` par version, exemples
  sous `examples/<COMPOSANT>/<Nom>/<Nom>.ino`).
- Compilation : `arduino-cli`, FQBN `STMicroelectronics:stm32:STeaMi`, même
  cœur STM32duino que l'image du Codespace (3.1.0) et STM32duinoBLE ; script
  existant `scripts/compile-package-examples.sh`.
- Envoi : DAP.js 2.3.0 en WebUSB (Chrome/Edge, https). Le DAPLink réinitialise
  la carte après le flash (`auto_rst`) : ne pas rappeler `dap.reset()` après
  `flash()` (double démarrage, corrigé dans l'image 2026.11.7).
- Dépôts : une issue, une branche et une PR par changement ; jamais de push
  sur `main` ; commits conventionnels (commitlint) ; la bibliothèque n'accepte
  que les fusions squash.
- Le wiki est en français ; la bibliothèque est en anglais.
- **Versions de la carte** (`docs/hardware/revisions.md`) : la V1c a un écran
  GC9A01 et un BME280 ; les V1a/V1b ont un écran SSD1327 et les capteurs
  WSEN-PADS, WSEN-HIDS et APDS-9960. Les exemples de ces composants ne
  marchent donc que sur une partie des cartes. La V1c est la version actuelle,
  à montrer en premier.
- Console : les 78 exemples de v0.34.0 ouvrent `Serial` à 115200 bauds ; aucun
  n'utilise un autre port série pour sa sortie.
- Noms d'exemples : uniques dans un composant, mais répétés d'un composant à
  l'autre (`BasicReader`, `framebuf_*`…) et parfois en `snake_case`.

## Approches considérées

- **A. Pages d'exemples avec lien direct par exemple (retenue).** Les exemples
  de la bibliothèque sont la seule source ; le wiki les affiche, les explique
  et les envoie. Sert tous les lecteurs (wiki, GitHub, IDE) par les liens.
- **B. Bouton sous chaque extrait de code du wiki.** Les extraits du wiki sont
  souvent partiels : il faudrait les compléter et les compiler, donc maintenir
  deux versions des exemples ; rien pour les lecteurs de GitHub ou de l'IDE.
- **C. A puis B pour quelques extraits.** Possible plus tard, au-dessus de A.

L'utilisateur a choisi A, puis demandé que les exemples soient expliqués sur le
wiki pour aider à comprendre composants et drivers : A se décline donc en une
page par composant plutôt qu'en une page unique avec un sélecteur.

## Décisions

### 1. Bibliothèque : publier les programmes compilés

Dans `publish-arduino-package.yml`, après la création de la release du dépôt
de distribution, un job compile tous les exemples du paquet publié et attache
à cette release l'archive `steami-exemples-<tag>.zip` :

```text
index.json
APDS9960/ambient_light.bin
…
VL53L1X/GestureDetection.bin
```

`index.json` :

```json
{
  "version": "v0.34.0",
  "fqbn": "STMicroelectronics:stm32:STeaMi",
  "coeur": "3.1.0",
  "exemples": [
    {
      "id": "VL53L1X/GestureDetection",
      "composant": "VL53L1X",
      "nom": "GestureDetection",
      "bin": "VL53L1X/GestureDetection.bin",
      "taille": 41234,
      "sha256": "…",
      "source": "examples/VL53L1X/GestureDetection/GestureDetection.ino"
    }
  ]
}
```

Un exemple qui ne compile pas fait échouer le job : pas d'archive partielle.
Le job compile le paquet **tel que publié au tag** (sources de la bibliothèque au tag, construites avec le script de paquet du tag),
avec le même cœur et les mêmes dépendances que le job de vérification
existant, et s'authentifie avec le jeton d'application déjà utilisé par le
workflow (`RELEASE_APP_ID`/`RELEASE_APP_SECRET`). Il peut être relancé à la
main sur un tag existant (pour produire l'archive de v0.34.0, déjà publiée),
mais **refuse de remplacer une archive déjà attachée** : le sha256 épinglé par
le wiki ne doit jamais changer sous ses pieds.

Première vérification, sur la carte, avant de construire la suite : un `.bin`
produit par `arduino-cli` s'envoie bien par `dap.flash()` de DAP.js sans
décalage, comme le `firmware.bin` du Codespace (le glisser-déposer de ces
`.bin` a déjà été validé sur la V1c).

### 2. Wiki : version épinglée et récupération

- Fichier `exemples-arduino.json` à la racine du wiki :
  `{ "version": "v0.34.0", "sha256": "<sha256 de l'archive>" }`.
- Nouveau script de prebuild `scripts/fetch-arduino-examples.sh` :
  - clone `steamicc/arduino-steami` au tag épinglé dans
    `.external/arduino-steami` (pour le code affiché par `remark-code-file`) ;
  - télécharge l'archive de la release, **vérifie le sha256**, la décompresse
    dans `static/exemples-arduino/` (ignoré par git), servie à
    `/exemples-arduino/<COMPOSANT>/<Nom>.bin` et `/exemples-arduino/index.json`.
    Code affiché et `.bin` viennent ainsi du même tag, et le navigateur ne lit
    que des fichiers du wiki (même origine, pas de CORS).
- `prebuild` lance les deux scripts de récupération.

### 3. Wiki : composant d'essai

Composant React `<EssayerExemple id="VL53L1X/GestureDetection" />` (MDX,
`BrowserOnly`) :

- avec WebUSB : bouton **Téléverser**, état de la carte, console série sous
  l'exemple ; la connexion à la carte est **partagée par toute la page**
  (on autorise la carte une fois, puis on peut essayer chaque exemple) ;
  une seule console visible à la fois, sous le dernier exemple téléversé ;
- sans WebUSB : lien **Télécharger le .bin** (`download="<Nom>.bin"`) et une
  ligne : « Glisse ce fichier sur le lecteur STEAMI de la carte. » ;
- erreurs en français, comme la page du Codespace (carte absente, carte prise
  par un autre onglet, échec du flash) ;
- console à 115200 bauds, fixe.

Le code d'envoi et de console est repris de la page du Codespace
(`app.js`/`support.js`), sans la partie mise à jour du DAPLink. Dépendance
npm `dapjs@2.3.0`.

### 4. Wiki : pages

- `docs/software/arduino/exemples/index.md` : présentation, comment essayer,
  liste des composants.
- Une page par composant, `docs/software/arduino/exemples/<composant>.md`
  (nom en minuscules : `vl53l1x.md`, `wsen-hids.md`, `steami-board.md`…),
  qui présente brièvement le composant, **indique les versions de carte qui
  l'ont** (V1c ; V1a et V1b), puis, pour chaque exemple, une section
  `## <Nom> {#<nom-en-minuscules>}` (ancre explicite, `_` gardés, ex.
  `#gesturedetection`, `#ambient_light`) :
  1. **Ce que tu vas voir** : une ou deux phrases sur ce qui se passe sur la
     carte et quoi faire (approcher la main, souffler sur le capteur…) ;
  2. **Matériel** : seulement s'il faut plus que la carte (deuxième carte
     pour certains exemples BLE, écran externe…) ;
  3. le code complet : ` ```cpp file=.external/arduino-steami/examples/… `;
  4. **Comment ça marche** : les appels au driver et les notions du
     composant qu'ils illustrent (registres, modes, unités, calibration…) ;
  5. `<EssayerExemple id="…" />`.
- Aucun exemple de v0.34.0 n'est dangereux pour la carte : `show_config`
  (STEAMI_CONFIG) ne fait que lire ; `data_logger` (DAPLINK_FLASH) ajoute des
  lignes au fichier utilisateur `LOG.CSV` du DAPLink, ce que sa section dit
  clairement (encart d'information, bouton actif).
- Les exemples qui demandent plus que la carte (plusieurs cartes pour
  certains exemples BLE…) le disent dans **Matériel** ; le bouton reste actif.
- Page d'index : les composants de la V1c d'abord, puis ceux des V1a/V1b,
  chacun avec sa mention de version.
- Barre latérale : sous-catégorie « Exemples » de la section Arduino.

### 5. Wiki : cohérence entre explications et exemples

Script `scripts/check-arduino-examples.py`, lancé par le CI de build du wiki,
sur les pages de `docs/software/arduino/exemples/` (« documenté » = un
`<EssayerExemple>` dans l'une de ces pages) :

- erreur si une page cite un `id` absent de `index.json` ;
- erreur si la section d'un exemple n'a pas l'ancre explicite attendue (les
  liens des README en dépendent) ;
- erreur si un exemple de `index.json` n'a pas de `<EssayerExemple>` dans les
  pages **et** n'est pas dans `scripts/exemples-arduino-a-documenter.txt` ;
- erreur si un `id` de la liste d'attente est documenté (la liste doit
  rétrécir).

Pendant le déploiement progressif, la liste d'attente contient les exemples
pas encore rédigés ; elle est vide à la fin.

### 6. Wiki : robot de mise à jour

Workflow `suivre-exemples-arduino.yml`, sur le modèle de `suivre-paquet.yml`
de l'image : une fois par jour et à la demande, lit la dernière release de
`steamicc/arduino-steami` ; si elle est plus récente que la version épinglée
et porte l'archive, il crée la branche `chore/exemples-arduino-<tag>` (points
du tag remplacés par des tirets, ex. `v0-37-0`, règle des noms de branche), met à
jour `exemples-arduino.json` (version et sha256), ouvre la PR et active sa
fusion automatique (squash) : elle est fusionnée dès que le CI est vert. Si de
nouveaux exemples ne sont pas expliqués, le CI de la PR échoue et les nomme :
l'utilisateur décide de les rédiger ou de les ajouter à la liste d'attente.

Le robot agit avec un jeton d'installation de la GitHub App de l'organisation
(celle des releases de `arduino-steami-lib`), limité au dépôt du wiki : une PR
ouverte avec `GITHUB_TOKEN` attend une approbation manuelle avant que le CI
tourne, celle de l'App déclenche `pull_request` normalement (#227). Il faut :

- les secrets `RELEASE_APP_ID` et `RELEASE_APP_SECRET` dans le dépôt du wiki,
  sans quoi le workflow échoue en les nommant ;
- l'App installée sur le dépôt, avec Contents et Pull requests en écriture ;
- « Allow auto-merge » coché, et un ruleset « CI verte avant fusion » sur
  `main` qui exige la vérification `build`. Sans vérification exigée, GitHub
  fusionnerait la PR tout de suite, même avec un CI rouge : le robot vérifie
  donc les règles de `main` et, si `build` n'y est pas exigé, laisse la PR à
  fusionner à la main avec un avertissement.

Une PR en brouillon n'est pas fusionnée automatiquement.

### 7. Liens vers les pages

- README de chaque driver de `arduino-steami-lib` : colonne ou lien
  « ▶ Essayer sur la carte » dans le tableau des exemples, vers
  `https://wiki.steami.cc/docs/software/arduino/exemples/<composant>#<nom>`.
- `docs/software/arduino/capteurs.md` : lien vers la page d'exemples de chaque
  capteur. (`bibliotheques.md` n'est modifié qu'avec l'accord de
  l'utilisateur.)

### 8. Rédaction et livraison

1. Bibliothèque : archive des programmes compilés (et production pour
   v0.34.0).
2. Wiki : récupération, composant d'essai, contrôle de cohérence (liste
   d'attente pleine), page d'index et **page VL53L1X complète** en pilote ;
   l'utilisateur relit le ton et le niveau des explications.
3. Les 14 autres composants, une PR par composant, rédigées par Claude à
   partir du code et relues par l'utilisateur.
4. Liens des README et des pages capteurs ; robot de mise à jour.

## Laissé au constructeur

- Présentation visuelle du bouton, de l'état de la carte et de la console,
  dans le style du thème Docusaurus (mode sombre compris).
- Découpage interne du composant React et des fonctions reprises du
  Codespace, et leurs tests.
- Message exact des erreurs, tant qu'il est en français et dit quoi faire.
