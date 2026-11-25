---
title: Reconnaître la carte
sidebar_position: 4.5
---

# Reconnaître la carte

Les releases V1a, V1b et V1c de la STeaMi n'ont pas les mêmes capteurs d'environnement ni le même écran (voir [Révisions de la carte](/docs/hardware/revisions)). Depuis sa version 0.31.0, la bibliothèque STeaMi fournit l'objet `Steami`, qui :

- reconnaît la release de la carte sur laquelle tourne le programme ;
- crée une seule fois le driver de chaque composant I²C de la carte, sur le bus I²C interne, et le partage avec tout le programme ;
- signale les problèmes par de courts messages codés, de `E01` à `E03`.

Un même programme peut ainsi tourner sur toutes les cartes, en choisissant le bon capteur selon la release.

:::note Version de la bibliothèque
Si la compilation s'arrête sur `SteamiBoard.h: No such file or directory`, la bibliothèque STeaMi installée est antérieure à la version 0.31.0 :

- **Arduino IDE** : mettre à jour STeaMi dans le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)).
- **PlatformIO** : indiquer `#v0.31.0`, ou une version plus récente, à la fin de la ligne `lib_deps` de `platformio.ini` (voir [Programmer avec PlatformIO](./platformio)).
- **Codespace** : la version vient de l'image du Codespace et s'affiche dans la sortie de `steami-compiler` (`STeaMi @ x.y.z`). Un dépôt d'élève garde la version de sa création : pour passer à une version plus récente, créer un nouveau dépôt à partir du modèle [arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter) une fois celui-ci mis à jour (voir [Programmer sans installation](./codespace)).
  :::

## Afficher la carte détectée

L'exemple **Fichier → Exemples → STeaMi → STEAMI_BOARD → BoardInfo** affiche la release reconnue et l'état de chaque composant I²C de cette release. Le programme minimal est le suivant :

```cpp
#include <SteamiBoard.h>

void setup() {
  Serial.begin(115200);
  Steami.begin();      // reconnaît la carte
  Steami.printInfo();  // affiche le résultat sur le moniteur série
}

void loop() {}
```

Ouvrir le moniteur série à 115200 bauds, puis appuyer sur le bouton Reset de la carte : le programme n'écrit qu'une fois, au démarrage, et ses lignes partent avant l'ouverture du moniteur. Sur une V1c, le moniteur affiche :

```text
[STeaMi] Board V1c (detected: BME280 at 0x76)
BME280 0x76 not tried
ISM330DL 0x6B not tried
LIS2MDL 0x1E not tried
VL53L1X 0x29 not tried
BQ27441 0x55 not tried
MCP23009E 0x20 not tried
```

La première ligne donne la release et la façon dont elle a été trouvée. Si `Serial.begin()` a été appelé avant `Steami.begin()`, c'est `Steami.begin()` qui l'affiche et `printInfo()` ne la répète pas ; sinon, c'est `printInfo()` qui l'affiche. Les lignes suivantes listent les composants I²C de cette release avec leur adresse et leur état :

| État             | Signification                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OK`             | le composant a répondu et son driver est prêt                                                                                                                                                             |
| `not responding` | le composant ne répond pas : absent, mal soudé ou non alimenté                                                                                                                                            |
| `not tried`      | ni `Steami.claim()` ni l'accesseur de ce composant n'a encore été appelé (voir [Un programme pour toutes les cartes](#un-programme-pour-toutes-les-cartes)) ; la reconnaissance de la carte ne compte pas |

L'exemple BoardInfo utilise d'abord le composant de chaque fonction : ses lignes affichent donc `OK` ou `not responding`. Seule exception, une release inconnue (message `E01`) : la liste compte alors les neuf composants, mais l'exemple n'essaie que le BME280 pour la température, l'humidité et la pression, et les lignes du WSEN-HIDS et du WSEN-PADS restent `not tried`.

## Comment la carte est reconnue

`Steami.begin()` cherche la release une seule fois, dans cet ordre :

1. **Une release forcée** par le programme (voir [Forcer la release](#forcer-la-release)).
2. **Le code de révision** écrit dans la zone de configuration du DAPLink, par exemple `131` pour une V1c de série (voir [Identifier sa version](/docs/hardware/revisions#identifier-sa-version)). Il n'est lu que si le firmware DAPLink de la carte possède une zone de configuration.
3. **Les capteurs présents** sur le bus I²C interne : le BME280 désigne une V1c ; le WSEN-HIDS, le WSEN-PADS ou l'APDS-9960 désignent une V1a ou une V1b.

Les capteurs ne permettent pas de distinguer une V1a d'une V1b : la release s'affiche alors `V1a/V1b`. Pour ce que fait la bibliothèque, ces deux releases sont identiques.

La fin de la première ligne indique la source de la réponse :

| Fin de la première ligne                     | Source                                       |
| -------------------------------------------- | -------------------------------------------- |
| `(forced by Steami.begin())`                 | release forcée dans `setup()`                |
| `(forced by STEAMI_BOARD_V1C)`               | release forcée par un `#define`              |
| `(read from the board config, revision 131)` | code de révision de la zone de configuration |
| `(detected: BME280 at 0x76)`                 | capteur trouvé sur le bus I²C interne        |
| `(nothing detected)`                         | release inconnue (message `E01`)             |

Un code de révision d'indice 0 ajoute `, prototype` : `(read from the board config, revision 130, prototype)`.

## Un programme pour toutes les cartes

`Steami.isV1c()` et `Steami.isV1ab()` testent la release. `Steami.claim()` prépare le driver d'un composant à la première demande et indique s'il répond : `SteamiStatus::OK` ou `SteamiStatus::NOT_RESPONDING`. Le driver s'obtient par son accesseur, qui fait lui-même ce `claim()` :

| Composant | Valeur pour `Steami.claim()` | Accesseur            |
| --------- | ---------------------------- | -------------------- |
| BME280    | `SteamiChip::BME280`         | `Steami.bme280()`    |
| WSEN-HIDS | `SteamiChip::WSEN_HIDS`      | `Steami.wsenHids()`  |
| WSEN-PADS | `SteamiChip::WSEN_PADS`      | `Steami.wsenPads()`  |
| APDS-9960 | `SteamiChip::APDS9960`       | `Steami.apds9960()`  |
| ISM330DL  | `SteamiChip::ISM330DL`       | `Steami.ism330dl()`  |
| LIS2MDL   | `SteamiChip::LIS2MDL`        | `Steami.lis2mdl()`   |
| VL53L1X   | `SteamiChip::VL53L1X`        | `Steami.vl53l1x()`   |
| BQ27441   | `SteamiChip::BQ27441`        | `Steami.bq27441()`   |
| MCP23009E | `SteamiChip::MCP23009E`      | `Steami.mcp23009e()` |

Ce programme affiche la température chaque seconde, avec le BME280 sur une V1c et le WSEN-HIDS sur une V1a ou une V1b :

```cpp
#include <SteamiBoard.h>

void setup() {
  Serial.begin(115200);
  Steami.begin();
  if (!Steami.has(SteamiFunction::LIGHT)) {
    Serial.println("Pas de capteur de lumière sur cette carte");
  }
}

void loop() {
  float temperature = NAN;
  if (Steami.isV1c()) {
    if (Steami.claim(SteamiChip::BME280) == SteamiStatus::OK) {
      temperature = Steami.bme280()->temperature();
    }
  } else if (Steami.claim(SteamiChip::WSEN_HIDS) == SteamiStatus::OK) {
    temperature = Steami.wsenHids()->temperature();
  }

  Serial.print("Température : ");
  Serial.print(temperature);
  Serial.println(" °C");
  delay(1000);
}
```

Si le capteur ne répond pas, ou si une lecture échoue, la ligne affiche `nan` (« not a number », pas de valeur) au lieu d'une température : l'exemple BoardInfo indique alors quel composant ne répond pas.

`Steami.has()` indique si la carte possède un composant pour une fonction : `TEMPERATURE`, `HUMIDITY`, `PRESSURE`, `DISTANCE`, `ACCELEROMETER`, `GYROSCOPE`, `MAGNETOMETER`, `COMPASS`, `LIGHT`, `COLOR`, `GESTURE`, `BATTERY`, `BUTTONS` ou `SCREEN`. La V1c n'a pas de capteur de lumière, de couleur ni de gestes.

Un accesseur renvoie `nullptr`, un pointeur vide, si le composant ne répond pas ; ce résultat est gardé jusqu'au redémarrage. Il faut le tester avant d'utiliser `->`, sinon le programme plante : `SteamiBME280* capteur = Steami.bme280(); if (capteur != nullptr) { … }`. Tester `Steami.claim()` d'abord, comme dans l'exemple ci-dessus, revient au même. Les écrans ne sont pas partagés par `Steami` : ils se pilotent avec leur driver, `SteamiSSD1327` ou `SteamiGC9A01` (voir [Capteurs et écran](./capteurs)).

## Forcer la release

Sur une carte dont le firmware DAPLink n'a pas de zone de configuration et dont aucun capteur ne répond, la release reste inconnue et le message `E01` s'affiche. On peut alors indiquer la release au programme, avec un `#define` placé **avant** l'`#include` :

```cpp
#define STEAMI_BOARD_V1C  // ou STEAMI_BOARD_V1B, STEAMI_BOARD_V1A
#include <SteamiBoard.h>
```

ou dans `setup()`, ce qui l'emporte sur le `#define` :

```cpp
Steami.begin(SteamiRelease::V1C);
```

Une release forcée ne fait aucun échange sur le bus I²C.

Les messages `E01` et `E03` disent de placer le `#define` avant `#include <STeaMi.h>`, l'en-tête qui inclut tous les drivers ; il fonctionne de la même façon avant `#include <SteamiBoard.h>`. Un seul `#define STEAMI_BOARD_…` par programme : deux `#define` différents placés avant l'`#include` arrêtent la compilation sur l'erreur `Define only one of STEAMI_BOARD_V1A, STEAMI_BOARD_V1B, STEAMI_BOARD_V1C.` Un `#define` placé après l'`#include` est ignoré sans message, y compris dans un second onglet `.ino`, que l'IDE ajoute après l'onglet principal.

## Utiliser ses propres drivers

Un programme qui utilise `Steami` ne crée pas de second bus I²C interne : il passe `Steami.wire()` aux drivers qu'il crée lui-même, à la place de l'objet `internalI2C` décrit dans [Bibliothèques STeaMi](./bibliotheques#le-bus-ic-interne). `Steami.wire()` démarre le bus à son premier appel : ces drivers se créent donc dans `setup()`, et pas dans la déclaration d'une variable globale, qui s'exécute avant `setup()`. Ce programme affiche chaque seconde le nom du fichier du [disque USB](./capteurs#fichier-sur-le-disque-usb), sans le modifier :

```cpp
#include <SteamiBoard.h>
#include <SteamiDaplinkBridge.h>
#include <SteamiDaplinkFlash.h>

SteamiDaplinkFlash* fichier = nullptr;  // rempli dans setup()

void setup() {
  Serial.begin(115200);
  Steami.begin();
  static SteamiDaplinkBridge pont(Steami.wire());  // le bus interne de Steami
  static SteamiDaplinkFlash flash(pont);
  if (flash.begin()) {
    fichier = &flash;
  } else {
    Serial.println("DAPLink non détecté");
  }
}

void loop() {
  SteamiDaplinkFlash::Filename nom;
  if (fichier != nullptr && fichier->getFilename(nom)) {
    Serial.print("Fichier du disque USB : ");
    Serial.print(nom.name);
    Serial.print('.');
    Serial.println(nom.ext);
  }
  delay(1000);
}
```

Le mot-clé `static` garde les drivers en vie après la fin de `setup()`, mais leur nom n'est connu que dans `setup()`. Le pointeur global `fichier` les rend utilisables dans `loop()` ; il reste vide (`nullptr`) si le DAPLink ne répond pas.

Deux objets `TwoWire` sur le bus interne ne fonctionnent pas ensemble : seul le dernier démarré répond, et les échanges de l'autre échouent sans message d'erreur. Les exemples des autres drivers de la bibliothèque créent encore leur propre bus ; il ne faut pas les combiner avec `Steami` dans un même programme.

## Les messages

Les messages s'affichent sur le moniteur série, en anglais, sous la forme `[STeaMi] SteamiBoard: <détail> (Exx)`. Chacun ne s'affiche qu'une fois. `Steami.lastError()` renvoie le dernier, et `Steami.printInfo()` le répète s'il n'a pas pu s'afficher, par exemple parce que `Serial.begin()` n'avait pas encore été appelé.

| Code  | Début du message                                     | Cause                                                                                                                                                                                       | Que faire                                                                                                                                                                                 |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E01` | `cannot tell which STeaMi this is`                   | La zone de configuration ne donne pas de révision, et aucun capteur de la V1a, de la V1b ou de la V1c n'a répondu.                                                                          | [Forcer la release](#forcer-la-release). Si la carte devrait être reconnue, vérifier avec l'exemple BoardInfo les composants qui répondent.                                               |
| `E02` | `unknown board revision <n> in the board config`     | La zone de configuration contient un code que cette version de la bibliothèque ne connaît pas, par exemple le `3` écrit par d'anciens exemples. La carte est alors reconnue à ses capteurs. | Rien d'obligatoire : le programme fonctionne. Si le code est récent, mettre à jour la bibliothèque STeaMi ; s'il est faux, [corriger le code de révision](#corriger-le-code-de-révision). |
| `E03` | `two different STEAMI_BOARD_ defines in this sketch` | Deux fichiers compilés séparément (par exemple le `.ino` et un `.cpp` du projet) forcent deux releases différentes avec `#define`.                                                          | Garder un seul `#define STEAMI_BOARD_…` dans tout le projet, avant l'`#include`.                                                                                                          |

`Steami.setLogger(nullptr)` rend la bibliothèque silencieuse ; `Steami.setLogger(maFonction)` envoie chaque ligne à une fonction `void maFonction(const char* ligne)`, par exemple pour l'afficher sur l'écran.

### Corriger le code de révision

Le code de révision s'écrit une seule fois, par exemple par l'enseignant. Choisir le code de la carte dans le tableau [Identifier sa version](/docs/hardware/revisions#identifier-sa-version) (`111`, `121` ou `131` pour une carte de série), puis téléverser une fois ce programme :

```cpp
#include <SteamiBoard.h>

void setup() {
  Serial.begin(115200);
  Steami.begin();
  SteamiConfig* config = Steami.config();
  if (config != nullptr) {
    config->setBoardRevision(131);  // code de VOTRE carte
    if (config->save()) {
      Serial.println("Code de révision enregistré");
    }
  } else {
    Serial.println("Pas de zone de configuration");
  }
}

void loop() {}
```

`Steami.config()` renvoie `nullptr` si le firmware DAPLink n'a pas de zone de configuration (le [mettre à jour](../daplink#mise-à-jour-du-firmware)), si la release est forcée ou si la zone est illisible. `save()` réécrit toute la zone avec les champs que la bibliothèque a lus : révision, nom de la carte, calibrations et compteur de démarrages. Si la carte a des calibrations, vérifier d'abord avec l'exemple **STeaMi → STEAMI_CONFIG → show_config** qu'elles sont bien lues : une lecture ratée ressemble à une zone vide, et `save()` effacerait alors les calibrations. Au démarrage suivant, la première ligne affiche `(read from the board config, revision 131)`.

## Étapes suivantes

- [Capteurs et écran](./capteurs) : un programme minimal pour chaque composant.
- [Conventions de l'API](./conventions) : ce que les drivers ont en commun.
- Le [README de SteamiBoard](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/steami_board/README.md), dans le dépôt arduino-steami-lib, liste toutes les méthodes de `Steami`.
