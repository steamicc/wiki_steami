---
title: Reconnaître la carte
sidebar_position: 4.5
---

import EssayerExemple from '@site/src/components/EssayerExemple';

<!-- cspell:ignore colour -->

# Reconnaître la carte

Les releases V1a, V1b et V1c de la STeaMi n'ont pas les mêmes capteurs d'environnement ni le même écran (voir [Révisions de la carte](/docs/hardware/revisions)). Depuis sa version 0.31.0, la bibliothèque STeaMi fournit l'objet `Steami`, qui :

- reconnaît la release de la carte sur laquelle tourne le programme ;
- crée une seule fois, à la première demande, le driver des capteurs de la carte, de la jauge de batterie et de l'extenseur du D-PAD (voir [les drivers partagés](#aller-plus-loin--les-drivers-partagés)), sur le bus I²C interne, et le partage avec tout le programme ;
- signale les problèmes par de courts messages codés, comme `E01`.

Depuis la version 0.32.0, des classes par fonction s'appuient sur cet objet : `SteamiTemperature`, par exemple, lit la température avec le capteur de la carte, quelle que soit sa release. La version 0.34.0 ajoute les classes du mouvement, de la boussole, de la lumière et des boutons, la version 0.37.0 la classe de l'écran, `SteamiDisplay`, la version 0.38.0 `SteamiScreen`, qui met en page titres et valeurs sur cet écran, la version 0.40.0 ses widgets ronds (jauge, boussole, montre, visages) et la police Spleen du texte sur la V1c, et la version 0.41.0 son graphe, avec `SteamiHistory`, et son menu. Un même programme peut ainsi tourner sur toutes les cartes. Les pages [Capteurs](./capteurs) et [Écran](./ecran) donnent le programme de chaque classe ; cette page-ci décrit ce qu'elles ont en commun, la reconnaissance de la carte, les calibrations et les messages.

Les croquis de cette page qui tournent seuls sur la carte sont repris dans le dépôt [arduino-steami-sample](https://github.com/steamicc/arduino-steami-sample), qui les compile pour la STeaMi et les republie sous licence GPL-3.0.

:::note Version de la bibliothèque
L'objet `Steami` demande la version 0.31.0 de la bibliothèque STeaMi. Ses méthodes `calibrate()` et `calibrated()`, ainsi que les cinq premières classes par fonction (`SteamiTemperature`, `SteamiHumidity`, `SteamiPressure`, `SteamiDistance` et `SteamiBattery`), demandent la version 0.32.0. Les classes du mouvement, de la boussole, de la lumière et des boutons (`SteamiAccelerometer`, `SteamiCompass`, `SteamiButtons`…) demandent la version 0.34.0, `SteamiDisplay` la version 0.37.0, et `SteamiScreen` la version 0.38.0. Les widgets ronds de `SteamiScreen` (`gauge()`, `compass()`, `watch()`, `face()`), ainsi que `textHeight()`, demandent la version 0.40.0 ; `graph()`, `SteamiHistory` et `menu()` la version 0.41.0. Si la compilation s'arrête sur `SteamiBoard.h: No such file or directory`, sur `SteamiTemperature.h: No such file or directory`, sur `SteamiCompass.h: No such file or directory` (ou l'en-tête d'une autre classe), sur `has no member named 'calibrate'`, sur `has no member named 'gauge'` (ou le nom d'une autre fonction) ou sur `'SteamiHistory' was not declared in this scope`, la bibliothèque STeaMi installée est trop ancienne :

- **Arduino IDE** : mettre à jour STeaMi dans le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)).
- **PlatformIO** : indiquer la version demandée ci-dessus (`#v0.38.0` pour `SteamiScreen`, `#v0.41.0` pour son graphe et son menu), ou une plus récente, à la fin de la ligne `lib_deps` de `platformio.ini` (voir [Programmer avec PlatformIO](./platformio)).
- **Codespace** : la version vient de l'image du Codespace et s'affiche dans la sortie de `steami-compiler` (`STeaMi @ x.y.z`). En dessous de la version demandée, les programmes de cette page ne compilent pas dans ce dépôt. Un dépôt garde la version de sa création. Pour en changer, [sauvegarder son travail](./codespace#7-sauvegarder-son-travail), créer un nouveau dépôt à partir du modèle [arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter) et y recopier son dossier `src/`.
  :::

## Afficher la carte détectée

L'exemple **Fichier → Exemples → STeaMi → STEAMI_BOARD → BoardInfo** affiche la release reconnue et l'état de chaque composant I²C de cette release. Le programme minimal est le suivant :

```cpp norun
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

Treize classes lisent une fonction de la carte sans qu'il faille choisir le capteur : `SteamiTemperature`, `SteamiHumidity`, `SteamiPressure`, `SteamiDistance`, `SteamiBattery`, `SteamiAccelerometer`, `SteamiGyroscope`, `SteamiMagnetometer`, `SteamiCompass`, `SteamiLight`, `SteamiColor`, `SteamiGesture` et `SteamiButtons`. Chacune prend le composant qui sert cette fonction sur la release de la carte, et partage le driver que `Steami` a déjà créé. `SteamiDisplay` fait de même pour l'écran : elle dessine sur le SSD1327 d'une V1a ou d'une V1b, ou sur le GC9A01 d'une V1c ; `SteamiScreen`, qui en hérite, y place titres, valeurs et widgets (voir [Écran](./ecran)). Ce programme affiche chaque seconde la température, la pression, l'altitude et la distance, sur une V1a, une V1b ou une V1c :

```cpp file=.external/arduino-steami-sample/examples/CARTE/ToutesLesCartes/ToutesLesCartes.ino

```

<EssayerExemple id="CARTE/ToutesLesCartes" source="sample" />

Le programme n'appelle pas `Steami.begin()` : la première classe démarrée reconnaît la carte.

Les autres classes s'utilisent de la même façon. Chaque section de [Capteurs](./capteurs) commence par le programme de sa classe : [mouvement](./capteurs#mouvement--accéléromètre-et-gyroscope), [boussole](./capteurs#boussole--magnétomètre), [distance](./capteurs#distance--capteur-de-temps-de-vol), [boutons](./capteurs#boutons-et-d-pad), [batterie](./capteurs#batterie), [pression, humidité et température](./capteurs#pression-humidité-et-température), [lumière, couleur et gestes](./capteurs#lumière-couleur-et-gestes) ; la page [Écran](./ecran) fait de même pour l'écran.

Chaque classe a aussi un exemple prêt à téléverser, dans **Fichier → Exemples → STeaMi → STEAMI_BOARD** : **Temperature**, **Humidity**, **Pressure**, **Distance**, **Battery**, **Accelerometer**, **Gyroscope**, **Magnetometer**, **Compass**, **Light**, **Color**, **Gesture** et **Buttons**.

### La forme commune

Les treize classes ont les mêmes méthodes :

| Méthode         | Rôle                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `begin()`       | cherche le composant de la fonction et le démarre ; renvoie `false`, avec un message, s'il ne répond pas. Les appels suivants ne refont rien.                                                                                                                                                                                                                          |
| `isAvailable()` | `true` si `begin()` a réussi                                                                                                                                                                                                                                                                                                                                           |
| `status()`      | l'état de la fonction : `SteamiStatus::NOT_STARTED` avant `begin()`, puis `OK`, `NOT_RESPONDING`, ou `NOT_ON_THIS_BOARD` quand la release n'a pas la fonction (lumière, couleur et gestes sur une V1c). Le type `SteamiStatus` a d'autres valeurs (`UNKNOWN_BOARD`, `NO_MEMORY`), mais les treize classes ne les renvoient jamais, même quand la release est inconnue. |
| `error()`       | un court texte en anglais qui explique l'état : `"not started"`, `"no answer"` ou `"not on this board"` ; `""` (texte vide) quand tout va bien                                                                                                                                                                                                                         |
| `chip()`        | le composant utilisé : `"BME280"`, `"WSEN-HIDS"`… ; `""` si aucun                                                                                                                                                                                                                                                                                                      |

Une classe se déclare en variable globale : sa déclaration ne touche pas au matériel. Une lecture faite avant `begin()` appelle `begin()`.

### Quel composant pour quelle fonction

| Classe                | Mesure              | V1a / V1b                                                   | V1c                   |
| --------------------- | ------------------- | ----------------------------------------------------------- | --------------------- |
| `SteamiTemperature`   | température         | WSEN-HIDS, sinon WSEN-PADS                                  | BME280                |
| `SteamiHumidity`      | humidité            | WSEN-HIDS                                                   | BME280                |
| `SteamiPressure`      | pression, altitude  | WSEN-PADS                                                   | BME280                |
| `SteamiDistance`      | distance            | VL53L1X                                                     | VL53L1X               |
| `SteamiBattery`       | batterie            | BQ27441                                                     | BQ27441               |
| `SteamiAccelerometer` | accélération        | ISM330DL                                                    | ISM330DL              |
| `SteamiGyroscope`     | vitesse de rotation | ISM330DL                                                    | ISM330DL              |
| `SteamiMagnetometer`  | champ magnétique    | LIS2MDL                                                     | LIS2MDL               |
| `SteamiCompass`       | cap                 | LIS2MDL                                                     | LIS2MDL               |
| `SteamiLight`         | lumière ambiante    | APDS-9960                                                   | aucun (message `E20`) |
| `SteamiColor`         | couleur             | APDS-9960                                                   | aucun (message `E20`) |
| `SteamiGesture`       | gestes de la main   | APDS-9960                                                   | aucun (message `E20`) |
| `SteamiButtons`       | boutons             | A, B et MENU sur le microcontrôleur, D-PAD sur le MCP23009E | idem                  |

Quand la release est inconnue (message `E01`), la classe essaie chaque composant possible : pour la température, le BME280, puis le WSEN-HIDS, puis le WSEN-PADS ; pour la lumière, la couleur et les gestes, l'APDS-9960.

Plusieurs classes partagent un composant : `SteamiAccelerometer` et `SteamiGyroscope` utilisent le même ISM330DL, `SteamiMagnetometer` et `SteamiCompass` le même LIS2MDL, `SteamiLight`, `SteamiColor` et `SteamiGesture` le même APDS-9960. Le driver de ce composant n'est créé qu'une fois.

### Quand une fonction manque

Si le composant ne répond pas, ou si la release n'a pas la fonction, `begin()` renvoie `false`, un message s'affiche (voir [Les messages](#les-messages)), et les lectures renvoient une valeur qui signale l'absence de mesure :

| Classe                | Lectures                                                                             | Valeur si la fonction manque                                                          |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `SteamiTemperature`   | `read()` en °C                                                                       | `NAN`                                                                                 |
| `SteamiHumidity`      | `read()` en % d'humidité relative                                                    | `NAN`                                                                                 |
| `SteamiPressure`      | `read()` en hPa, `altitude()` en mètres                                              | `NAN`                                                                                 |
| `SteamiDistance`      | `read()` en mm, `cm()` en cm                                                         | `-1`, et `NAN` pour `cm()`                                                            |
| `SteamiBattery`       | `percent()` en %, `voltage()` en V, `current()` en mA, `isCharging()`                | `0`, `NAN`, `0`, `false`                                                              |
| `SteamiAccelerometer` | `read()` en g (les trois axes), `x()`, `y()`, `z()`, `strength()` en g, `isShaken()` | `NAN`, et `false` pour `isShaken()`                                                   |
| `SteamiGyroscope`     | `read()` en degrés par seconde (les trois axes), `x()`, `y()`, `z()`                 | `NAN`                                                                                 |
| `SteamiMagnetometer`  | `read()` en µT (les trois axes), `x()`, `y()`, `z()`, `strength()` en µT             | `NAN`                                                                                 |
| `SteamiCompass`       | `heading()` en degrés, `direction()`                                                 | `NAN`, `""`                                                                           |
| `SteamiLight`         | `read()`, nombre brut du capteur                                                     | `0`                                                                                   |
| `SteamiColor`         | `read(r, g, b)`, `red()`, `green()`, `blue()`, nombres bruts                         | `false` (et trois `0`), `0`                                                           |
| `SteamiGesture`       | `read()`, le geste vu                                                                | `SteamiGesture::NONE`                                                                 |
| `SteamiButtons`       | `isPressed()`, `wasPressed()`, `wasReleased()`, `waitForPress()`                     | les flèches du D-PAD restent relâchées (`false`) ; A, B et MENU fonctionnent toujours |

`read()` des classes du mouvement et du magnétomètre renvoie un `SteamiVector`, qui regroupe les trois axes : `SteamiVector v = acceleration.read();`, puis `v.x`, `v.y` et `v.z`.

`NAN` (« not a number », pas de valeur) s'affiche `nan` sur le moniteur série ; `isnan(valeur)` le teste dans le programme.

Une fonction qui a échoué n'est pas réessayée avant un redémarrage de la carte : ses lectures renvoient aussitôt leur valeur d'absence, sans nouveau message. Après avoir branché une batterie, par exemple, appuyer sur le bouton Reset. Si `begin()` a renvoyé `false` sans message visible, ouvrir le moniteur série puis appuyer sur Reset pour lire le message (voir [Les messages](#les-messages)).

Le détail de chaque classe (décalage de `setOffset()`, altitude avec la pression du jour, ±8 g et `isShaken()`, nombres bruts de la lumière et de la couleur, gestes, `E20` sur une V1c, cap et calibration de la boussole, anti-rebond des boutons) est donné dans sa section de [Capteurs](./capteurs) : [mouvement](./capteurs#mouvement--accéléromètre-et-gyroscope), [boussole](./capteurs#boussole--magnétomètre), [distance](./capteurs#distance--capteur-de-temps-de-vol), [boutons et D-PAD](./capteurs#boutons-et-d-pad), [batterie](./capteurs#batterie), [pression, humidité et température](./capteurs#pression-humidité-et-température), [lumière, couleur et gestes](./capteurs#lumière-couleur-et-gestes), et celui de l'écran sur la page [Écran](./ecran).

### Aller plus loin : les drivers partagés

Les classes par fonction couvrent l'usage courant. Pour une mesure ou un réglage qu'elles n'offrent pas, comme la proximité de l'APDS-9960, on passe par le driver partagé du composant. `Steami.isV1c()` et `Steami.isV1ab()` testent la release. `Steami.claim()` prépare le driver d'un composant à la première demande et indique s'il répond : `SteamiStatus::OK` ou `SteamiStatus::NOT_RESPONDING`. Le driver s'obtient par son accesseur, qui fait lui-même ce `claim()` :

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

```cpp file=.external/arduino-steami-sample/examples/CARTE/DriversPartages/DriversPartages.ino

```

<EssayerExemple id="CARTE/DriversPartages" source="sample" />

Si le capteur ne répond pas, ou si une lecture échoue, la ligne affiche `nan` au lieu d'une température : l'exemple BoardInfo indique alors quel composant ne répond pas.

`Steami.has()` indique si la carte possède un composant pour une fonction : `TEMPERATURE`, `HUMIDITY`, `PRESSURE`, `DISTANCE`, `ACCELEROMETER`, `GYROSCOPE`, `MAGNETOMETER`, `COMPASS`, `LIGHT`, `COLOR`, `GESTURE`, `BATTERY`, `BUTTONS` ou `SCREEN`. La V1c n'a pas de capteur de lumière, de couleur ni de gestes.

Un accesseur renvoie `nullptr`, un pointeur vide, si le composant ne répond pas ; ce résultat est gardé jusqu'au redémarrage. Il faut le tester avant d'utiliser `->`, sinon le programme plante : `SteamiBME280* capteur = Steami.bme280(); if (capteur != nullptr) { … }`. Tester `Steami.claim()` d'abord, comme dans l'exemple ci-dessus, revient au même. Les écrans ne sont pas partagés par `Steami` : ils se pilotent avec leur driver, `SteamiSSD1327` ou `SteamiGC9A01` (voir [Écran](./ecran#avec-les-drivers-ssd1327-et-gc9a01)).

Les classes par fonction utilisent ces mêmes drivers. Au démarrage d'une classe de température, d'humidité, de pression, du mouvement, du magnétomètre ou de la boussole, si la zone de configuration contient une calibration pour son composant (voir [Calibrations](#calibrations)), elle est appliquée au driver partagé. Ce driver renvoie alors des mesures calibrées, et une calibration que le programme avait faite plus tôt sur ce driver, comme un `calibrateTemperature()`, est remplacée. Pour le magnétomètre, seuls le cap (`headingFlatOnly()`) et `calibratedField()` profitent de la calibration : `magneticFieldUt()` et `magnitudeUt()` de `Steami.lis2mdl()` restent non corrigés, et `SteamiMagnetometer` donne le champ calibré en µT. De même, une fois la classe `SteamiAccelerometer` démarrée, `Steami.ism330dl()` mesure l'accélération sur la plage de ±8 g.

## Calibrations

La zone de configuration du DAPLink peut contenir une calibration de la température pour chaque capteur (clé `tc`). Ses clés sont les mêmes que celles de la bibliothèque MicroPython [`steami_config`](../daplink#steamiconfig) :

| Clé   | Composant |
| ----- | --------- |
| `bme` | BME280    |
| `hid` | WSEN-HIDS |
| `pad` | WSEN-PADS |

Elle peut aussi contenir une calibration de l'accéléromètre et une du magnétomètre :

| Clé  | Contenu                                                                               | Composant (classes)                             |
| ---- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `ca` | décalages `ox`, `oy`, `oz` en g                                                       | ISM330DL (`SteamiAccelerometer`)                |
| `cm` | décalages `hx`, `hy`, `hz` en valeurs brutes du capteur, et échelles `sx`, `sy`, `sz` | LIS2MDL (`SteamiMagnetometer`, `SteamiCompass`) |

`SteamiMagnetometer` ne retire que les décalages `hx`, `hy` et `hz` ; `SteamiCompass` utilise aussi les échelles `sx`, `sy` et `sz` pour le cap.

Les classes par fonction appliquent ces calibrations automatiquement, dans `begin()`, une fois par composant, même quand la release est forcée : le programme n'a rien à faire. `Steami.printInfo()` ajoute alors `, calibrated` à la ligne du composant, par exemple `BME280 0x76 OK, calibrated`. Sans zone de configuration, ou sans calibration pour ce composant, les mesures ne changent pas.

`Steami.calibrate(SteamiChip::BME280)` applique la calibration d'un composant sans passer par une classe (`SteamiChip::ISM330DL` pour `ca`, `SteamiChip::LIS2MDL` pour `cm`, depuis la version 0.34.0 : avec une version plus ancienne, l'appel compile mais renvoie `false` sans rien appliquer), et `Steami.calibrated(SteamiChip::BME280)` indique si elle a été appliquée.

Un driver créé dans le programme, comme `SteamiBME280 bme(Steami.wire());` dans [Capteurs](./capteurs), ne reçoit pas cette calibration : pour des températures calibrées, utiliser une classe par fonction, ou le driver partagé (`Steami.bme280()`) après `Steami.calibrate(SteamiChip::BME280)`.

Une calibration s'écrit dans la zone de configuration comme le code de révision (voir [Corriger le code de révision](#corriger-le-code-de-révision)), avec `config->setTemperatureCalibration(STEAMI_CONFIG_SENSOR_BME280, gain, offset)` avant `config->save()` : la température corrigée vaut `mesure × gain + offset`. Les calibrations `ca` et `cm` s'écrivent de même, avec `config->setAccelerometerCalibration(ox, oy, oz)` et `config->setMagnetometerCalibration(hx, hy, hz, sx, sy, sz)`.

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

```cpp file=.external/arduino-steami-sample/examples/CARTE/MesDrivers/MesDrivers.ino

```

<EssayerExemple id="CARTE/MesDrivers" source="sample" />

Tous les drivers I²C de la bibliothèque se créent de la même façon, et tous ses exemples qui utilisent le bus interne passent par `Steami.wire()` (voir [Le bus I²C interne](./bibliotheques#le-bus-ic-interne)).

Deux objets `TwoWire` sur le bus interne ne fonctionnent pas ensemble : seul le dernier démarré répond, et les échanges de l'autre échouent sans message d'erreur. Un programme ne doit donc pas créer son propre `TwoWire` sur les broches `I2C_INT_SDA` et `I2C_INT_SCL`, comme le faisaient les programmes écrits pour des versions antérieures de la bibliothèque : il faut le remplacer par `Steami.wire()`.

## Les messages

Les messages s'affichent sur le moniteur série, en anglais, sous la forme `[STeaMi] <classe>: <détail> (Exx)`. Après `[STeaMi]` vient le nom de la classe qui signale le problème : `SteamiBoard` pour la reconnaissance de la carte, ou une classe par fonction, comme `SteamiTemperature`. Chaque message ne s'affiche qu'une fois par classe, au démarrage du programme, souvent avant l'ouverture du moniteur série : ouvrir le moniteur à 115200 bauds, puis appuyer sur le bouton Reset de la carte pour le voir. `Steami.lastError()` renvoie le dernier, et `Steami.printInfo()` le répète s'il n'a pas pu s'afficher, par exemple parce que `Serial.begin()` n'avait pas encore été appelé.

| Code  | Début du message                                                                                       | Cause                                                                                                                                                                                                                                                                                                                                                                                 | Que faire                                                                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E01` | `cannot tell which STeaMi this is`                                                                     | La zone de configuration ne donne pas de révision, et aucun capteur de la V1a, de la V1b ou de la V1c n'a répondu.                                                                                                                                                                                                                                                                    | [Forcer la release](#forcer-la-release). Si la carte devrait être reconnue, vérifier avec l'exemple BoardInfo les composants qui répondent.                                                                                                           |
| `E02` | `unknown board revision <n> in the board config`                                                       | La zone de configuration contient un code que cette version de la bibliothèque ne connaît pas, par exemple le `3` écrit par d'anciens exemples. La carte est alors reconnue à ses capteurs.                                                                                                                                                                                           | Rien d'obligatoire : le programme fonctionne. Si le code est récent, mettre à jour la bibliothèque STeaMi ; s'il est faux, [corriger le code de révision](#corriger-le-code-de-révision).                                                             |
| `E03` | `two different STEAMI_BOARD_ defines in this sketch`                                                   | Deux fichiers compilés séparément (par exemple le `.ino` et un `.cpp` du projet) forcent deux releases différentes avec `#define`.                                                                                                                                                                                                                                                    | Garder un seul `#define STEAMI_BOARD_…` dans tout le projet, avant l'`#include`.                                                                                                                                                                      |
| `E10` | `the <composant> <capteur> (I2C 0x<adresse>) did not answer` ou `no <capteur> answered (<composants>)` | Le composant de la fonction n'a pas répondu. Le message le nomme, avec son adresse, ou liste les composants essayés quand il y en a plusieurs.                                                                                                                                                                                                                                        | Vérifier avec l'exemple BoardInfo les composants qui répondent. Pour la batterie, brancher une batterie puis appuyer sur Reset : une fonction qui a échoué n'est réessayée qu'au redémarrage. Pour les boutons, A, B et MENU fonctionnent quand même. |
| `E11` | `this STeaMi is set as a <release> (<source>), but its <composant> <capteur>`                          | La release a été forcée (`#define` ou `Steami.begin(…)`) ou lue dans la zone de configuration, et le capteur de cette release ne répond pas : la release indiquée est peut-être fausse. Ne concerne que les fonctions dont le composant change avec la release : la température, l'humidité, la pression, et la lumière, la couleur et les gestes (APDS-9960 d'une V1a ou d'une V1b). | Vérifier le `#define`, l'appel à `Steami.begin(…)` ou le code de révision de la zone de configuration ([le corriger](#corriger-le-code-de-révision) s'il est faux).                                                                                   |
| `E20` | `this STeaMi is a <release>, it has no <capteur>`                                                      | La fonction n'existe pas sur cette release. Seules `SteamiLight`, `SteamiColor` et `SteamiGesture` l'affichent, sur une V1c : l'APDS-9960 n'existe que sur les V1a et V1b. Les autres fonctions existent sur toutes les releases.                                                                                                                                                     | Tester la fonction avec `Steami.has()` avant de l'utiliser, ou utiliser une carte qui la possède.                                                                                                                                                     |
| `E30` | `cannot tell if this board is a V1a/V1b or a V1c`                                                      | `SteamiDisplay` (ou `SteamiScreen`) ne sait pas quel écran démarrer : la release reste inconnue (message `E01`). `error()` vaut alors `unknown board`.                                                                                                                                                                                                                                | [Forcer la release](#forcer-la-release), avec `#define STEAMI_BOARD_V1C` (ou `V1B`) avant l'`#include`.                                                                                                                                               |
| `E31` | `not enough RAM for the colour screen (115200 bytes in one block)`                                     | Sur une V1c, l'image de l'écran couleur demande 115 200 octets de mémoire vive d'un seul bloc, que `SteamiDisplay` (ou `SteamiScreen`) ne trouve pas. `error()` vaut alors `no memory`.                                                                                                                                                                                               | Appeler `begin()` de `SteamiDisplay` (ou `SteamiScreen`) au tout début de `setup()`, tant que la mémoire est encore libre (voir [Écran](./ecran#si-lécran-ne-démarre-pas)).                                                                           |

Quelques messages complets :

```text
[STeaMi] SteamiTemperature: the BME280 temperature sensor (I2C 0x76) did not answer. Check the board or try another one. (E10)
[STeaMi] SteamiTemperature: no temperature sensor answered (WSEN-HIDS, WSEN-PADS). Check the board or try another one. (E10)
[STeaMi] SteamiBattery: the BQ27441 battery gauge (I2C 0x55) did not answer. Plug in a battery, then reset the board. (E10)
[STeaMi] SteamiAccelerometer: the ISM330DL accelerometer (I2C 0x6B) did not answer. Check the board or try another one. (E10)
[STeaMi] SteamiCompass: the LIS2MDL compass (I2C 0x1E) did not answer. Check the board or try another one. (E10)
[STeaMi] SteamiButtons: the MCP23009E D-PAD expander (I2C 0x20) did not answer. The A, B and MENU buttons still work. (E10)
[STeaMi] SteamiTemperature: this STeaMi is set as a V1c (forced by Steami.begin()), but its BME280 temperature sensor (I2C 0x76) did not answer. Check the #define, Steami.begin() or the board config. (E11)
[STeaMi] SteamiLight: this STeaMi is a V1c, it has no light sensor (APDS-9960 is on V1a/V1b only). read() will return 0. (E20)
[STeaMi] SteamiColor: this STeaMi is a V1c, it has no colour sensor (APDS-9960 is on V1a/V1b only). read() will return false. (E20)
[STeaMi] SteamiGesture: this STeaMi is a V1c, it has no gesture sensor (APDS-9960 is on V1a/V1b only). read() will return NONE. (E20)
```

Dans `E11`, la source vaut `forced by Steami.begin()`, `forced by #define` ou `read from the board config`. `E20` a la forme `this STeaMi is a <release>, it has no <capteur> (<composant> is on <autre release> only).`, suivie de la valeur que renverront les lectures. Les classes qui partagent un composant affichent chacune leur propre message : sur une V1c, un programme qui démarre la lumière, la couleur et les gestes affiche trois messages `E20`.

`Steami.setLogger(nullptr)` rend la bibliothèque silencieuse ; `Steami.setLogger(maFonction)` envoie chaque ligne à une fonction `void maFonction(const char* ligne)`, par exemple pour l'afficher sur l'écran.

### Corriger le code de révision

:::warning
`save()` réécrit toute la zone de configuration. Si la carte a des calibrations, téléverser d'abord l'exemple **STeaMi → STEAMI_CONFIG → show_config** et vérifier qu'elles s'affichent : une lecture ratée ressemble à une zone vide, et `save()` effacerait alors les calibrations.
:::

Le code de révision s'écrit une seule fois, par exemple par l'enseignant. Choisir le code de la carte dans le tableau [Identifier sa version](/docs/hardware/revisions#identifier-sa-version) (`111`, `121` ou `131` pour une carte de série), puis téléverser une fois ce programme :

```cpp norun
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

`Steami.config()` renvoie `nullptr` si le firmware DAPLink n'a pas de zone de configuration (le [mettre à jour](../daplink#mise-à-jour-du-firmware)), si la release est forcée (sauf si une calibration a déjà lu la zone, par une classe de température, d'humidité, de pression, du mouvement, du magnétomètre ou de la boussole, ou par `Steami.calibrate()`) ou si la zone est illisible. `save()` réécrit toute la zone avec les champs que la bibliothèque a lus : révision, nom de la carte, calibrations et compteur de démarrages. Au démarrage suivant, la première ligne affiche `(read from the board config, revision 131)`.

## Étapes suivantes

- [Capteurs](./capteurs) : un programme minimal pour chaque fonction, avec sa classe puis avec le driver du composant.
- [Écran](./ecran) : dessiner sur l'écran rond, avec `SteamiDisplay`, `SteamiScreen` et ses widgets, ou avec le driver de l'écran.
- [Conventions de l'API](./conventions) : ce que les drivers ont en commun.
- Le [README de SteamiBoard](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/steami_board/README.md), dans le dépôt arduino-steami-lib, liste toutes les méthodes de `Steami` et des classes par fonction.
