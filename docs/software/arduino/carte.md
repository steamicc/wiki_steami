---
title: Reconnaître la carte
sidebar_position: 4.5
---

# Reconnaître la carte

Les releases V1a, V1b et V1c de la STeaMi n'ont pas les mêmes capteurs d'environnement ni le même écran (voir [Révisions de la carte](/docs/hardware/revisions)). Depuis sa version 0.31.0, la bibliothèque STeaMi fournit l'objet `Steami`, qui :

- reconnaît la release de la carte sur laquelle tourne le programme ;
- crée une seule fois, à la première demande, le driver des capteurs de la carte, de la jauge de batterie et de l'extenseur du D-PAD (voir [les drivers partagés](#aller-plus-loin--les-drivers-partagés)), sur le bus I²C interne, et le partage avec tout le programme ;
- signale les problèmes par de courts messages codés, comme `E01`.

Depuis la version 0.32.0, des classes par fonction s'appuient sur cet objet : `SteamiTemperature`, par exemple, lit la température avec le capteur de la carte, quelle que soit sa release. Un même programme peut ainsi tourner sur toutes les cartes.

:::note Version de la bibliothèque
L'objet `Steami` demande la version 0.31.0 de la bibliothèque STeaMi. Ses méthodes `calibrate()` et `calibrated()`, ainsi que les classes par fonction (`SteamiTemperature`, `SteamiDistance`…), demandent la version 0.32.0. Si la compilation s'arrête sur `SteamiBoard.h: No such file or directory`, sur `SteamiTemperature.h: No such file or directory` ou sur `has no member named 'calibrate'`, la bibliothèque STeaMi installée est trop ancienne :

- **Arduino IDE** : mettre à jour STeaMi dans le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)).
- **PlatformIO** : indiquer `#v0.32.0`, ou une version plus récente, à la fin de la ligne `lib_deps` de `platformio.ini` (voir [Programmer avec PlatformIO](./platformio)).
- **Codespace** : la version vient de l'image du Codespace et s'affiche dans la sortie de `steami-compiler` (`STeaMi @ x.y.z`). En dessous de la version demandée, les programmes de cette page ne compilent pas dans ce dépôt. Un dépôt garde la version de sa création. Pour en changer, [sauvegarder son travail](./codespace#7-sauvegarder-son-travail), créer un nouveau dépôt à partir du modèle [arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter) et y recopier son dossier `src/`.
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

| État             | Signification                                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OK`             | le composant a répondu et son driver est prêt                                                                                                                                                                                          |
| `not responding` | le composant ne répond pas : absent, mal soudé ou non alimenté                                                                                                                                                                         |
| `not tried`      | aucune classe par fonction, ni `Steami.claim()`, ni l'accesseur de ce composant ne l'a encore demandé (voir [Un programme pour toutes les cartes](#un-programme-pour-toutes-les-cartes)) ; la reconnaissance de la carte ne compte pas |

Un composant dont la calibration a été appliquée affiche en plus `, calibrated` (voir [Calibrations](#calibrations)).

L'exemple BoardInfo essaie d'abord chaque composant possible de chaque fonction : ses lignes affichent donc `OK` ou `not responding`, même quand la release est inconnue (message `E01`).

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

Cinq classes lisent une fonction de la carte sans qu'il faille choisir le capteur : `SteamiTemperature`, `SteamiHumidity`, `SteamiPressure`, `SteamiDistance` et `SteamiBattery`. Chacune prend le composant qui sert cette fonction sur la release de la carte, et partage le driver que `Steami` a déjà créé. Ce programme affiche chaque seconde la température, la pression, l'altitude et la distance, sur une V1a, une V1b ou une V1c :

```cpp
#include <SteamiTemperature.h>
#include <SteamiPressure.h>
#include <SteamiDistance.h>

SteamiTemperature temperature;
SteamiPressure pression;
SteamiDistance distance;

void setup() {
  Serial.begin(115200);
  if (temperature.begin()) {
    Serial.print("Capteur de température : ");
    Serial.println(temperature.chip());  // BME280 sur une V1c
  }
  pression.begin();
  distance.begin();
}

void loop() {
  Serial.print("Température : ");
  Serial.print(temperature.read());
  Serial.print(" °C  Pression : ");
  Serial.print(pression.read());
  Serial.print(" hPa  Altitude : ");
  Serial.print(pression.altitude());
  Serial.print(" m  Distance : ");
  Serial.print(distance.read());
  Serial.println(" mm");
  delay(1000);
}
```

Le programme n'appelle pas `Steami.begin()` : la première classe démarrée reconnaît la carte. Chaque classe a aussi un exemple prêt à téléverser, dans **Fichier → Exemples → STeaMi → STEAMI_BOARD** : **Temperature**, **Humidity**, **Pressure**, **Distance** et **Battery**.

### La forme commune

Les cinq classes ont les mêmes méthodes :

| Méthode         | Rôle                                                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `begin()`       | cherche le composant de la fonction et le démarre ; renvoie `false`, avec un message, s'il ne répond pas. Les appels suivants ne refont rien.                                                                                                                                                   |
| `isAvailable()` | `true` si `begin()` a réussi                                                                                                                                                                                                                                                                    |
| `status()`      | l'état de la fonction : `SteamiStatus::NOT_STARTED` avant `begin()`, puis `OK` ou `NOT_RESPONDING`. Le type `SteamiStatus` a d'autres valeurs (`NOT_ON_THIS_BOARD`, `UNKNOWN_BOARD`, `NO_MEMORY`), mais les cinq classes actuelles ne les renvoient jamais, même quand la release est inconnue. |
| `error()`       | un court texte en anglais qui explique l'état : `"not started"` ou `"no answer"` ; `""` (texte vide) quand tout va bien                                                                                                                                                                         |
| `chip()`        | le composant utilisé : `"BME280"`, `"WSEN-HIDS"`… ; `""` si aucun                                                                                                                                                                                                                               |

Une classe se déclare en variable globale : sa déclaration ne touche pas au matériel. Une lecture faite avant `begin()` appelle `begin()`.

### Quel composant pour quelle fonction

| Classe              | Mesure             | V1a / V1b                  | V1c     |
| ------------------- | ------------------ | -------------------------- | ------- |
| `SteamiTemperature` | température        | WSEN-HIDS, sinon WSEN-PADS | BME280  |
| `SteamiHumidity`    | humidité           | WSEN-HIDS                  | BME280  |
| `SteamiPressure`    | pression, altitude | WSEN-PADS                  | BME280  |
| `SteamiDistance`    | distance           | VL53L1X                    | VL53L1X |
| `SteamiBattery`     | batterie           | BQ27441                    | BQ27441 |

Quand la release est inconnue (message `E01`), la classe essaie chaque composant possible : pour la température, le BME280, puis le WSEN-HIDS, puis le WSEN-PADS.

### Quand une fonction manque

Si le composant ne répond pas, `begin()` renvoie `false`, un message s'affiche (voir [Les messages](#les-messages)), et les lectures renvoient une valeur qui signale l'absence de mesure :

| Classe              | Lectures                                                              | Valeur si la fonction manque |
| ------------------- | --------------------------------------------------------------------- | ---------------------------- |
| `SteamiTemperature` | `read()` en °C                                                        | `NAN`                        |
| `SteamiHumidity`    | `read()` en % d'humidité relative                                     | `NAN`                        |
| `SteamiPressure`    | `read()` en hPa, `altitude()` en mètres                               | `NAN`                        |
| `SteamiDistance`    | `read()` en mm, `cm()` en cm                                          | `-1`, et `NAN` pour `cm()`   |
| `SteamiBattery`     | `percent()` en %, `voltage()` en V, `current()` en mA, `isCharging()` | `0`, `NAN`, `0`, `false`     |

`NAN` (« not a number », pas de valeur) s'affiche `nan` sur le moniteur série ; `isnan(valeur)` le teste dans le programme.

Une fonction qui a échoué n'est pas réessayée avant un redémarrage de la carte : ses lectures renvoient aussitôt leur valeur d'absence, sans nouveau message. Après avoir branché une batterie, par exemple, appuyer sur le bouton Reset. Si `begin()` a renvoyé `false` sans message visible, ouvrir le moniteur série puis appuyer sur Reset pour lire le message (voir [Les messages](#les-messages)).

Quelques précisions :

- `SteamiTemperature` : `setOffset(-0.5)` ajoute un décalage, en °C, à chaque `read()` de cet objet.
- `SteamiPressure` : `altitude()` utilise la pression standard au niveau de la mer, 1013,25 hPa. Pour une meilleure estimation, lui passer la pression du jour, ramenée au niveau de la mer : `pression.altitude(1020.0)`. La formule est la même sur toutes les releases.
- `SteamiDistance` : `read()` renvoie aussi `-1` quand le capteur ne donne pas de résultat à temps. Une cible hors de portée n'est pas distinguée, et une distance de 0 mm se lit aussi `-1`.
- `SteamiBattery` : `isCharging()` vaut `true` quand `current()` est positif, c'est-à-dire pendant la charge. `voltage()` renvoie aussi `NAN` quand la jauge mesure 0 mV. Sans batterie (carte alimentée par l'USB seul), la jauge répond souvent quand même : `begin()` renvoie `true`, sans message, mais `percent()` donne 0 et `voltage()` donne `nan`, comme si la fonction manquait. Brancher une batterie pour avoir de vraies mesures.

### Aller plus loin : les drivers partagés

Les autres fonctions (mouvement, boussole, lumière…) n'ont pas encore de classe : elles passent par le driver partagé de leur composant. `Steami.isV1c()` et `Steami.isV1ab()` testent la release. `Steami.claim()` prépare le driver d'un composant à la première demande et indique s'il répond : `SteamiStatus::OK` ou `SteamiStatus::NOT_RESPONDING`. Le driver s'obtient par son accesseur, qui fait lui-même ce `claim()` :

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

Ce programme fait à la main ce que fait `SteamiTemperature` : il affiche la température chaque seconde, avec le BME280 sur une V1c et le WSEN-HIDS sur une V1a ou une V1b :

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

Si le capteur ne répond pas, ou si une lecture échoue, la ligne affiche `nan` au lieu d'une température : l'exemple BoardInfo indique alors quel composant ne répond pas.

`Steami.has()` indique si la carte possède un composant pour une fonction : `TEMPERATURE`, `HUMIDITY`, `PRESSURE`, `DISTANCE`, `ACCELEROMETER`, `GYROSCOPE`, `MAGNETOMETER`, `COMPASS`, `LIGHT`, `COLOR`, `GESTURE`, `BATTERY`, `BUTTONS` ou `SCREEN`. La V1c n'a pas de capteur de lumière, de couleur ni de gestes.

Un accesseur renvoie `nullptr`, un pointeur vide, si le composant ne répond pas ; ce résultat est gardé jusqu'au redémarrage. Il faut le tester avant d'utiliser `->`, sinon le programme plante : `SteamiBME280* capteur = Steami.bme280(); if (capteur != nullptr) { … }`. Tester `Steami.claim()` d'abord, comme dans l'exemple ci-dessus, revient au même. Les écrans ne sont pas partagés par `Steami` : ils se pilotent avec leur driver, `SteamiSSD1327` ou `SteamiGC9A01` (voir [Capteurs et écran](./capteurs)).

Les classes par fonction utilisent ces mêmes drivers. Au démarrage d'une classe de température, d'humidité ou de pression, si la zone de configuration contient une calibration pour son composant (voir [Calibrations](#calibrations)), elle est appliquée au driver partagé. Ce driver renvoie alors des températures calibrées, et un `calibrateTemperature()` que le programme avait fait plus tôt sur ce driver est remplacé.

## Calibrations

La zone de configuration du DAPLink peut contenir une calibration de la température pour chaque capteur. Ses clés sont les mêmes que celles de la bibliothèque MicroPython [`steami_config`](../daplink#steamiconfig) :

| Clé   | Composant |
| ----- | --------- |
| `bme` | BME280    |
| `hid` | WSEN-HIDS |
| `pad` | WSEN-PADS |

Les classes par fonction appliquent cette calibration automatiquement, dans `begin()`, une fois par composant, même quand la release est forcée : le programme n'a rien à faire. `Steami.printInfo()` ajoute alors `, calibrated` à la ligne du composant, par exemple `BME280 0x76 OK, calibrated`. Sans zone de configuration, ou sans calibration pour ce composant, les mesures ne changent pas.

`Steami.calibrate(SteamiChip::BME280)` applique la calibration d'un composant sans passer par une classe, et `Steami.calibrated(SteamiChip::BME280)` indique si elle a été appliquée.

Un driver créé dans le programme, comme `SteamiBME280 bme(Steami.wire());` dans [Capteurs et écran](./capteurs), ne reçoit pas cette calibration : pour des températures calibrées, utiliser une classe par fonction, ou le driver partagé (`Steami.bme280()`) après `Steami.calibrate(SteamiChip::BME280)`.

Une calibration s'écrit dans la zone de configuration comme le code de révision (voir [Corriger le code de révision](#corriger-le-code-de-révision)), avec `config->setTemperatureCalibration(STEAMI_CONFIG_SENSOR_BME280, gain, offset)` avant `config->save()` : la température corrigée vaut `mesure × gain + offset`.

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

Certains composants ne sont partagés ni par une classe ni par `Steami`, comme le [fichier du disque USB](./capteurs#fichier-sur-le-disque-usb). Leur driver se crée dans le programme, sur le bus de la carte, `Steami.wire()`. Ce driver peut être une variable globale : `Steami.wire()` crée et démarre le bus I²C interne à son premier appel. Ce programme affiche chaque seconde le nom du fichier du disque USB, sans le modifier :

```cpp
#include <SteamiBoard.h>
#include <SteamiDaplinkBridge.h>
#include <SteamiDaplinkFlash.h>

SteamiDaplinkBridge pont(Steami.wire());  // le bus interne de la carte
SteamiDaplinkFlash fichier(pont);

void setup() {
  Serial.begin(115200);
  if (!fichier.begin()) {
    Serial.println("DAPLink non détecté");
    while (true) {}
  }
}

void loop() {
  SteamiDaplinkFlash::Filename nom;
  if (fichier.getFilename(nom)) {
    Serial.print("Fichier du disque USB : ");
    Serial.print(nom.name);
    Serial.print('.');
    Serial.println(nom.ext);
  }
  delay(1000);
}
```

Tous les drivers I²C de la bibliothèque se créent de la même façon, et tous ses exemples qui utilisent le bus interne passent par `Steami.wire()` (voir [Le bus I²C interne](./bibliotheques#le-bus-ic-interne)).

Deux objets `TwoWire` sur le bus interne ne fonctionnent pas ensemble : seul le dernier démarré répond, et les échanges de l'autre échouent sans message d'erreur. Un programme ne doit donc pas créer son propre `TwoWire` sur les broches `I2C_INT_SDA` et `I2C_INT_SCL`, comme le faisaient les programmes écrits pour des versions antérieures de la bibliothèque : il faut le remplacer par `Steami.wire()`.

## Les messages

Les messages s'affichent sur le moniteur série, en anglais, sous la forme `[STeaMi] <classe>: <détail> (Exx)`. Après `[STeaMi]` vient le nom de la classe qui signale le problème : `SteamiBoard` pour la reconnaissance de la carte, ou une classe par fonction, comme `SteamiTemperature`. Chaque message ne s'affiche qu'une fois par classe, au démarrage du programme, souvent avant l'ouverture du moniteur série : ouvrir le moniteur à 115200 bauds, puis appuyer sur le bouton Reset de la carte pour le voir. `Steami.lastError()` renvoie le dernier, et `Steami.printInfo()` le répète s'il n'a pas pu s'afficher, par exemple parce que `Serial.begin()` n'avait pas encore été appelé.

| Code  | Début du message                                                                                       | Cause                                                                                                                                                                                                                                              | Que faire                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E01` | `cannot tell which STeaMi this is`                                                                     | La zone de configuration ne donne pas de révision, et aucun capteur de la V1a, de la V1b ou de la V1c n'a répondu.                                                                                                                                 | [Forcer la release](#forcer-la-release). Si la carte devrait être reconnue, vérifier avec l'exemple BoardInfo les composants qui répondent.                                                   |
| `E02` | `unknown board revision <n> in the board config`                                                       | La zone de configuration contient un code que cette version de la bibliothèque ne connaît pas, par exemple le `3` écrit par d'anciens exemples. La carte est alors reconnue à ses capteurs.                                                        | Rien d'obligatoire : le programme fonctionne. Si le code est récent, mettre à jour la bibliothèque STeaMi ; s'il est faux, [corriger le code de révision](#corriger-le-code-de-révision).     |
| `E03` | `two different STEAMI_BOARD_ defines in this sketch`                                                   | Deux fichiers compilés séparément (par exemple le `.ino` et un `.cpp` du projet) forcent deux releases différentes avec `#define`.                                                                                                                 | Garder un seul `#define STEAMI_BOARD_…` dans tout le projet, avant l'`#include`.                                                                                                              |
| `E10` | `the <composant> <capteur> (I2C 0x<adresse>) did not answer` ou `no <capteur> answered (<composants>)` | Le composant de la fonction n'a pas répondu. Le message le nomme, avec son adresse, ou liste les composants essayés quand il y en a plusieurs.                                                                                                     | Vérifier avec l'exemple BoardInfo les composants qui répondent. Pour la batterie, brancher une batterie puis appuyer sur Reset : une fonction qui a échoué n'est réessayée qu'au redémarrage. |
| `E11` | `this STeaMi is set as a <release> (<source>), but its <composant> <capteur>`                          | La release a été forcée (`#define` ou `Steami.begin(…)`) ou lue dans la zone de configuration, et le capteur de cette release ne répond pas : la release indiquée est peut-être fausse. Ne concerne que la température, l'humidité et la pression. | Vérifier le `#define`, l'appel à `Steami.begin(…)` ou le code de révision de la zone de configuration ([le corriger](#corriger-le-code-de-révision) s'il est faux).                           |
| `E20` | `this STeaMi is a <release>, it has no <capteur>`                                                      | La fonction n'existe pas sur cette release. Aucune des cinq classes actuelles ne peut l'afficher : la température, l'humidité, la pression, la distance et la batterie existent sur toutes les releases.                                           | Tester la fonction avec `Steami.has()` avant de l'utiliser, ou utiliser une carte qui la possède.                                                                                             |

Quelques messages complets :

```text
[STeaMi] SteamiTemperature: the BME280 temperature sensor (I2C 0x76) did not answer. Check the board or try another one. (E10)
[STeaMi] SteamiTemperature: no temperature sensor answered (WSEN-HIDS, WSEN-PADS). Check the board or try another one. (E10)
[STeaMi] SteamiBattery: the BQ27441 battery gauge (I2C 0x55) did not answer. Plug in a battery, then reset the board. (E10)
[STeaMi] SteamiTemperature: this STeaMi is set as a V1c (forced by Steami.begin()), but its BME280 temperature sensor (I2C 0x76) did not answer. Check the #define, Steami.begin() or the board config. (E11)
```

Dans `E11`, la source vaut `forced by Steami.begin()`, `forced by #define` ou `read from the board config`. `E20` a la forme `this STeaMi is a <release>, it has no <capteur> (<composant> is on <autre release> only).`, suivie de la valeur que renverront les lectures.

`Steami.setLogger(nullptr)` rend la bibliothèque silencieuse ; `Steami.setLogger(maFonction)` envoie chaque ligne à une fonction `void maFonction(const char* ligne)`, par exemple pour l'afficher sur l'écran.

### Corriger le code de révision

:::warning
`save()` réécrit toute la zone de configuration. Si la carte a des calibrations, téléverser d'abord l'exemple **STeaMi → STEAMI_CONFIG → show_config** et vérifier qu'elles s'affichent : une lecture ratée ressemble à une zone vide, et `save()` effacerait alors les calibrations.
:::

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

`Steami.config()` renvoie `nullptr` si le firmware DAPLink n'a pas de zone de configuration (le [mettre à jour](../daplink#mise-à-jour-du-firmware)), si la release est forcée (sauf si une calibration de température a déjà lu la zone, par `SteamiTemperature`, `SteamiHumidity`, `SteamiPressure` ou `Steami.calibrate()`) ou si la zone est illisible. `save()` réécrit toute la zone avec les champs que la bibliothèque a lus : révision, nom de la carte, calibrations et compteur de démarrages. Au démarrage suivant, la première ligne affiche `(read from the board config, revision 131)`.

## Étapes suivantes

- [Capteurs et écran](./capteurs) : un programme minimal pour chaque composant.
- [Conventions de l'API](./conventions) : ce que les drivers ont en commun.
- Le [README de SteamiBoard](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/steami_board/README.md), dans le dépôt arduino-steami-lib, liste toutes les méthodes de `Steami` et des classes par fonction.
