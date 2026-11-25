---
title: Reconnaître la carte
sidebar_position: 4.5
---

# Reconnaître la carte

Les releases V1a, V1b et V1c de la STeaMi n'ont pas les mêmes capteurs d'environnement ni le même écran (voir [Révisions de la carte](/docs/hardware/revisions)). Depuis sa version 0.31.0, la bibliothèque STeaMi fournit l'objet `Steami`, qui :

- reconnaît la release de la carte sur laquelle tourne le programme ;
- crée une seule fois, à la première demande, le driver des capteurs de la carte, de la jauge de batterie et de l'extenseur du D-PAD (voir [les drivers partagés](#aller-plus-loin--les-drivers-partagés)), sur le bus I²C interne, et le partage avec tout le programme ;
- signale les problèmes par de courts messages codés, comme `E01`.

Depuis la version 0.32.0, des classes par fonction s'appuient sur cet objet : `SteamiTemperature`, par exemple, lit la température avec le capteur de la carte, quelle que soit sa release. La version 0.34.0 ajoute les classes du mouvement, de la boussole, de la lumière et des boutons. Un même programme peut ainsi tourner sur toutes les cartes.

:::note Version de la bibliothèque
L'objet `Steami` demande la version 0.31.0 de la bibliothèque STeaMi. Ses méthodes `calibrate()` et `calibrated()`, ainsi que les cinq premières classes par fonction (`SteamiTemperature`, `SteamiHumidity`, `SteamiPressure`, `SteamiDistance` et `SteamiBattery`), demandent la version 0.32.0. Les classes du mouvement, de la boussole, de la lumière et des boutons (`SteamiAccelerometer`, `SteamiCompass`, `SteamiButtons`…) demandent la version 0.34.0. Si la compilation s'arrête sur `SteamiBoard.h: No such file or directory`, sur `SteamiTemperature.h: No such file or directory`, sur `SteamiCompass.h: No such file or directory` (ou l'en-tête d'une autre classe) ou sur `has no member named 'calibrate'`, la bibliothèque STeaMi installée est trop ancienne :

- **Arduino IDE** : mettre à jour STeaMi dans le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)).
- **PlatformIO** : indiquer `#v0.34.0`, ou une version plus récente, à la fin de la ligne `lib_deps` de `platformio.ini` (voir [Programmer avec PlatformIO](./platformio)).
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

Treize classes lisent une fonction de la carte sans qu'il faille choisir le capteur : `SteamiTemperature`, `SteamiHumidity`, `SteamiPressure`, `SteamiDistance`, `SteamiBattery`, `SteamiAccelerometer`, `SteamiGyroscope`, `SteamiMagnetometer`, `SteamiCompass`, `SteamiLight`, `SteamiColor`, `SteamiGesture` et `SteamiButtons`. Chacune prend le composant qui sert cette fonction sur la release de la carte, et partage le driver que `Steami` a déjà créé. Ce programme affiche chaque seconde la température, la pression, l'altitude et la distance, sur une V1a, une V1b ou une V1c :

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

Le programme n'appelle pas `Steami.begin()` : la première classe démarrée reconnaît la carte.

Les classes du mouvement, de la boussole et des boutons s'utilisent de la même façon. Ce programme affiche deux fois par seconde le cap et l'accélération sur l'axe z ; le cap n'est juste qu'après une calibration de la boussole, lancée par un appui sur MENU (voir [Boussole](#boussole)) :

```cpp
#include <SteamiAccelerometer.h>
#include <SteamiCompass.h>
#include <SteamiButtons.h>

SteamiAccelerometer acceleration;
SteamiCompass boussole;
SteamiButtons boutons;

unsigned long dernierAffichage = 0;

void setup() {
  Serial.begin(115200);
  acceleration.begin();
  boussole.begin();
  boutons.begin();
}

void loop() {
  // lire les boutons souvent : une tape brève dure environ 100 ms
  if (boutons.wasPressed(SteamiButton::MENU)) {
    Serial.println("Calibration : tourner la carte dans tous les sens pendant 12 s");
    boussole.calibrate(12);
    Serial.println("Calibration terminée");
  }

  if (millis() - dernierAffichage >= 500) {  // affichage deux fois par seconde
    dernierAffichage = millis();
    float cap = boussole.heading();
    Serial.print("Cap : ");
    if (isnan(cap)) {
      Serial.print("nan");
    } else {
      Serial.print(lroundf(cap) % 360);  // arrondi au degré : 359,6 s'affiche 0, jamais 360
    }
    Serial.print(" deg (");
    Serial.print(boussole.direction());
    Serial.print(")  z : ");
    Serial.print(acceleration.z());
    Serial.println(" g");
  }
  delay(5);
}
```

Au démarrage, la boussole n'est pas calibrée et le cap affiché est faux : appuyer sur MENU, tourner lentement la carte dans tous les sens pendant les 12 secondes, puis la reposer à plat. La calibration se perd à chaque Reset et à chaque téléversement, sauf si une calibration `cm` est enregistrée sur la carte (voir [Boussole](#boussole)).

Carte posée à plat, écran vers le haut, z vaut environ −1 g. Le programme ne s'endort pas une demi-seconde entre deux affichages : il lit les boutons toutes les 5 ms environ, sinon une tape brève sur MENU serait manquée (voir [Boutons](#boutons)).

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

Quelques précisions :

- `SteamiTemperature` : `setOffset(-0.5)` ajoute un décalage, en °C, à chaque `read()` de cet objet.
- `SteamiPressure` : `altitude()` utilise la pression standard au niveau de la mer, 1013,25 hPa. Pour une meilleure estimation, lui passer la pression du jour, ramenée au niveau de la mer : `pression.altitude(1020.0)`. La formule est la même sur toutes les releases.
- `SteamiDistance` : `read()` renvoie aussi `-1` quand le capteur ne donne pas de résultat à temps. Une cible hors de portée n'est pas distinguée, et une distance de 0 mm se lit aussi `-1`.
- `SteamiBattery` : `isCharging()` vaut `true` quand `current()` est positif, c'est-à-dire pendant la charge. `voltage()` renvoie aussi `NAN` quand la jauge mesure 0 mV. La jauge est alimentée par la batterie : sans batterie (carte alimentée par l'USB seul), elle ne répond pas, `begin()` renvoie `false` et le message `E10` demande de brancher une batterie puis d'appuyer sur Reset.
- `SteamiAccelerometer` : `begin()` règle l'accéléromètre partagé sur ±8 g, sinon une secousse de plus de 2 g ne serait jamais vue. `strength()` est la norme des trois axes, environ 1 g au repos ; `isShaken()` vaut `true` quand elle dépasse 2 g, et `isShaken(3.0)` change ce seuil.
- `SteamiGyroscope` : la vitesse de rotation autour de chaque axe, en degrés par seconde, environ 0 au repos.
- `SteamiLight` et `SteamiColor` : des nombres bruts du capteur, sans unité, qui augmentent avec la lumière ; pas de lux ni de couleur prête à afficher. `SteamiGesture` met le capteur en détection de gestes : pendant qu'une main passe au-dessus, la lumière et la couleur ne sont plus mesurées, puis reprennent.
- `SteamiGesture` : `read()` renvoie `LEFT`, `RIGHT`, `UP`, `DOWN`, `NEAR`, `FAR` ou `NONE` (de la forme `SteamiGesture::LEFT`), et `SteamiGesture::name(geste)` son nom en texte. `read(200)` lit le geste en cours pendant 200 ms au plus. S'il n'y a pas de main au-dessus du capteur, `read()` renvoie `NONE` tout de suite, quel que soit le délai : il n'attend pas qu'un geste commence. On l'appelle donc à chaque tour de `loop()`, comme l'exemple **Gesture** avec `read(200)`. Sans délai, `read()` ne lit que ce que le capteur a déjà enregistré et peut couper un geste en cours. Le décodage des gestes n'a pas encore été vérifié sur une carte.
- Sur une V1c, `SteamiLight`, `SteamiColor` et `SteamiGesture` affichent le message `E20` et leur `begin()` renvoie `false`, sans échange sur le bus I²C.

### Boussole

`SteamiCompass` donne le cap de la carte tenue à plat, écran vers le haut :

- `heading()` renvoie un angle en degrés, compté dans le sens des aiguilles d'une montre à partir du nord, de 0 à moins de 360 (jamais 360). Il vaut 0 quand le haut de l'écran, le côté opposé au connecteur USB, pointe vers le nord, 90 vers l'est, 180 vers le sud et 270 vers l'ouest.
- `direction()` renvoie la direction la plus proche parmi huit : `"N"`, `"NE"`, `"E"`, `"SE"`, `"S"`, `"SW"`, `"W"` ou `"NW"`. Chacune couvre 45° centrés sur elle : `"N"` va de 337,5° à 22,5°, `"NE"` de 22,5° à 67,5°, etc. `heading()` et `direction()` font chacune leur propre mesure : près de la limite entre deux secteurs, la direction affichée peut ne pas correspondre au cap affiché juste avant (par exemple 22° avec `NE`).

Le cap ne tient pas compte de l'inclinaison : une carte penchée donne un cap faux.

**Calibrer.** Le magnétomètre mesure aussi le champ magnétique de la carte elle-même, plus fort que celui de la Terre : sans calibration, une V1c a lu 176 µT au total, champ terrestre compris, alors que le champ terrestre seul vaut 25 à 65 µT. Sans calibration, le cap est donc faux. Deux façons de calibrer :

- `boussole.calibrate(12)` mesure pendant 12 secondes : tourner lentement la carte dans tous les sens pendant ce temps. La calibration reste en mémoire vive et se perd au redémarrage. L'exemple **STeaMi → STEAMI_BOARD → Compass** la lance par un appui sur MENU.
- une calibration `cm` enregistrée dans la zone de configuration du DAPLink est appliquée automatiquement au démarrage (voir [Calibrations](#calibrations)).

Sur une V1c calibrée avec l'exemple Compass, le cap lu face au nord était proche de 359° (`N`) et face à l'est d'environ 70° (`E`) : la boussole indique une direction, pas un cap précis au degré. Les objets métalliques, les aimants et les câbles proches faussent aussi la mesure.

**Nord géographique.** Le cap est mesuré par rapport au nord magnétique. `boussole.setDeclination(2.0)` ajoute la déclinaison magnétique du lieu, en degrés, positive vers l'est, pour viser le nord géographique ; elle ne dépasse pas quelques degrés en France métropolitaine. Cet appel peut se faire avant `begin()`.

**Le magnétomètre.** `SteamiMagnetometer` donne le champ magnétique sur les trois axes, en µT, et `strength()` son intensité. Avant toute calibration, ces valeurs contiennent le champ propre de la carte et peuvent dépasser de loin le champ terrestre. Après une calibration (`cm` dans la zone de configuration, ou `calibrate()` comme pour la boussole), ce décalage est retiré : loin des aimants et du métal, `strength()` vaut alors environ 25 à 65 µT. `SteamiMagnetometer` et `SteamiCompass` partagent le même LIS2MDL : une calibration faite par l'une sert à l'autre.

### Boutons

`SteamiButtons` lit les sept boutons de la carte : `SteamiButton::A`, `B` et `MENU`, reliés au microcontrôleur, et les quatre flèches du D-PAD, `UP`, `DOWN`, `LEFT` et `RIGHT`, reliées à l'extenseur MCP23009E.

| Méthode               | Rôle                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `isPressed(bouton)`   | `true` tant que le bouton est enfoncé                                                                                                                                                      |
| `wasPressed(bouton)`  | `true` une fois par appui : l'appui est consommé, l'appel suivant renvoie `false` jusqu'au prochain appui                                                                                  |
| `wasReleased(bouton)` | de même, `true` une fois par relâchement                                                                                                                                                   |
| `waitForPress()`      | attend, sans limite, un nouvel appui et renvoie le bouton ; `waitForPress(3000)` renvoie `SteamiButton::NONE` après 3 secondes sans appui. Les appuis faits avant l'appel ne comptent pas. |

Si l'extenseur du D-PAD ne répond pas, `begin()` renvoie `false` avec le message `E10`, mais A, B et MENU fonctionnent quand même ; les flèches restent alors relâchées.

Chaque appel de ces méthodes lit l'état des boutons. Un appui est pris en compte dès qu'un appel voit le bouton enfoncé. Un contact mécanique ne s'ouvre ni ne se ferme net : pendant quelques millisecondes, il rebondit (s'ouvre et se ferme plusieurs fois). Après chaque appui ou relâchement, les rebonds des 20 ms suivantes sont donc ignorés, si bien qu'un appui ne compte qu'une fois. Une tape brève dure environ 100 ms : il faut donc appeler les boutons au moins toutes les 50 ms. Avec un `delay(500)` dans `loop()`, une tape tombée entre deux lectures est perdue ; le deuxième programme de [Un programme pour toutes les cartes](#un-programme-pour-toutes-les-cartes) mesure le temps avec `millis()` pour afficher sans attendre. Un bouton déjà enfoncé au démarrage du programme ne compte pas comme un appui.

L'exemple **STeaMi → STEAMI_BOARD → Buttons** affiche chaque appui et chaque relâchement des sept boutons.

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

Un driver créé dans le programme, comme `SteamiBME280 bme(Steami.wire());` dans [Capteurs et écran](./capteurs), ne reçoit pas cette calibration : pour des températures calibrées, utiliser une classe par fonction, ou le driver partagé (`Steami.bme280()`) après `Steami.calibrate(SteamiChip::BME280)`.

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

| Code  | Début du message                                                                                       | Cause                                                                                                                                                                                                                                                                                                                                                                                 | Que faire                                                                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E01` | `cannot tell which STeaMi this is`                                                                     | La zone de configuration ne donne pas de révision, et aucun capteur de la V1a, de la V1b ou de la V1c n'a répondu.                                                                                                                                                                                                                                                                    | [Forcer la release](#forcer-la-release). Si la carte devrait être reconnue, vérifier avec l'exemple BoardInfo les composants qui répondent.                                                                                                           |
| `E02` | `unknown board revision <n> in the board config`                                                       | La zone de configuration contient un code que cette version de la bibliothèque ne connaît pas, par exemple le `3` écrit par d'anciens exemples. La carte est alors reconnue à ses capteurs.                                                                                                                                                                                           | Rien d'obligatoire : le programme fonctionne. Si le code est récent, mettre à jour la bibliothèque STeaMi ; s'il est faux, [corriger le code de révision](#corriger-le-code-de-révision).                                                             |
| `E03` | `two different STEAMI_BOARD_ defines in this sketch`                                                   | Deux fichiers compilés séparément (par exemple le `.ino` et un `.cpp` du projet) forcent deux releases différentes avec `#define`.                                                                                                                                                                                                                                                    | Garder un seul `#define STEAMI_BOARD_…` dans tout le projet, avant l'`#include`.                                                                                                                                                                      |
| `E10` | `the <composant> <capteur> (I2C 0x<adresse>) did not answer` ou `no <capteur> answered (<composants>)` | Le composant de la fonction n'a pas répondu. Le message le nomme, avec son adresse, ou liste les composants essayés quand il y en a plusieurs.                                                                                                                                                                                                                                        | Vérifier avec l'exemple BoardInfo les composants qui répondent. Pour la batterie, brancher une batterie puis appuyer sur Reset : une fonction qui a échoué n'est réessayée qu'au redémarrage. Pour les boutons, A, B et MENU fonctionnent quand même. |
| `E11` | `this STeaMi is set as a <release> (<source>), but its <composant> <capteur>`                          | La release a été forcée (`#define` ou `Steami.begin(…)`) ou lue dans la zone de configuration, et le capteur de cette release ne répond pas : la release indiquée est peut-être fausse. Ne concerne que les fonctions dont le composant change avec la release : la température, l'humidité, la pression, et la lumière, la couleur et les gestes (APDS-9960 d'une V1a ou d'une V1b). | Vérifier le `#define`, l'appel à `Steami.begin(…)` ou le code de révision de la zone de configuration ([le corriger](#corriger-le-code-de-révision) s'il est faux).                                                                                   |
| `E20` | `this STeaMi is a <release>, it has no <capteur>`                                                      | La fonction n'existe pas sur cette release. Seules `SteamiLight`, `SteamiColor` et `SteamiGesture` l'affichent, sur une V1c : l'APDS-9960 n'existe que sur les V1a et V1b. Les autres fonctions existent sur toutes les releases.                                                                                                                                                     | Tester la fonction avec `Steami.has()` avant de l'utiliser, ou utiliser une carte qui la possède.                                                                                                                                                     |

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

`Steami.config()` renvoie `nullptr` si le firmware DAPLink n'a pas de zone de configuration (le [mettre à jour](../daplink#mise-à-jour-du-firmware)), si la release est forcée (sauf si une calibration a déjà lu la zone, par une classe de température, d'humidité, de pression, du mouvement, du magnétomètre ou de la boussole, ou par `Steami.calibrate()`) ou si la zone est illisible. `save()` réécrit toute la zone avec les champs que la bibliothèque a lus : révision, nom de la carte, calibrations et compteur de démarrages. Au démarrage suivant, la première ligne affiche `(read from the board config, revision 131)`.

## Étapes suivantes

- [Capteurs et écran](./capteurs) : un programme minimal pour chaque composant.
- [Conventions de l'API](./conventions) : ce que les drivers ont en commun.
- Le [README de SteamiBoard](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/steami_board/README.md), dans le dépôt arduino-steami-lib, liste toutes les méthodes de `Steami` et des classes par fonction.
