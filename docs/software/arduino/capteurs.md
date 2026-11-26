---
title: Capteurs et écran
sidebar_position: 5
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Capteurs et écran

Cette page donne un programme minimal pour chaque fonction de la carte. Chaque programme affiche ses mesures dans le moniteur série, à 115200 bauds.

Avant de commencer :

- installer la bibliothèque **STeaMi**, version 0.34.0 ou plus récente, depuis le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)). Avec une version plus ancienne, la compilation s'arrête sur l'en-tête d'une classe, comme `SteamiAccelerometer.h: No such file or directory`. L'encart « Version de la bibliothèque » de [Reconnaître la carte](./carte) donne la version demandée par chaque classe et la façon de mettre à jour ;
- garder en tête que les capteurs sont sur le [bus I²C interne](./bibliotheques#le-bus-ic-interne) : les classes par fonction s'en chargent ; les programmes avec le driver passent au driver le bus `Steami.wire()` de `<SteamiBoard.h>`.

Chaque section de capteur commence par la **classe par fonction**, comme `SteamiTemperature` ou `SteamiCompass`. Son programme marche tel quel sur une V1a, une V1b ou une V1c : la classe choisit le composant présent sur la carte. Si la carte n'a pas ce composant (lumière, couleur et gestes sur une V1c) ou s'il ne répond pas, `begin()` renvoie `false`, un message s'affiche une fois sur le moniteur série et les lectures renvoient une valeur qui signale l'absence de mesure, donnée dans chaque section. Ce message part au démarrage, souvent avant l'ouverture du moniteur : ouvrir le moniteur série à 115200 bauds, puis appuyer sur le bouton Reset de la carte pour le lire (voir [Les messages](./carte#les-messages)).

Une seconde partie, nommée d'après le composant (par exemple **Avec le driver ISM330DL**), sert à ce que la classe n'offre pas, comme la proximité de l'APDS-9960 ou un réglage du composant. Les composants dépendent de la release de la carte (voir [Révisions](/docs/hardware/revisions)) : quand ils diffèrent, ces programmes sont présentés en onglets **V1a / V1b / V1c**. Un driver créé dans le programme ne reçoit pas les calibrations de la zone de configuration du DAPLink : pour une mesure calibrée, garder la classe (voir [les drivers partagés](./carte#aller-plus-loin--les-drivers-partagés)). La [forme commune des classes](./carte#la-forme-commune), leurs [messages](./carte#les-messages) et les [calibrations](./carte#calibrations) sont décrits dans [Reconnaître la carte](./carte).

L'écran a aussi deux classes : `SteamiDisplay`, qui dessine sur l'écran de la release (version 0.37.0 de la bibliothèque), et `SteamiScreen`, qui y ajoute la mise en page des titres et des valeurs (version 0.38.0). Le fichier du disque USB et le Bluetooth n'ont pas de classe par fonction : leur section donne directement le driver.

Pour aller plus loin, la bibliothèque STeaMi fournit des exemples plus complets, rangés par composant dans **Fichier → Exemples → STeaMi**. La page [Exemples à essayer](./exemples/) les reprend un par un, avec un bouton pour les envoyer sur la carte ; chaque section ci-dessous renvoie aux exemples de son composant. Les exemples des classes par fonction sont dans **STeaMi → STEAMI_BOARD** (voir [Exemples STEAMI_BOARD](./exemples/steami-board)).

## Mouvement : accéléromètre et gyroscope

```cpp
#include <SteamiAccelerometer.h>
#include <SteamiGyroscope.h>

SteamiAccelerometer acceleration;
SteamiGyroscope rotation;

void setup() {
  Serial.begin(115200);
  acceleration.begin();
  rotation.begin();
}

void loop() {
  SteamiVector a = acceleration.read();  // les trois axes, en g
  Serial.print("x=");
  Serial.print(a.x);
  Serial.print(" g  y=");
  Serial.print(a.y);
  Serial.print(" g  z=");
  Serial.print(a.z);
  Serial.print(" g  rotation autour de z : ");
  Serial.print(rotation.z());
  Serial.print(" deg/s");
  if (acceleration.isShaken()) {
    Serial.print("  secousse !");
  }
  Serial.println();
  delay(200);
}
```

`SteamiAccelerometer` donne l'accélération en g, et `SteamiGyroscope` la vitesse de rotation autour de chaque axe, en degrés par seconde. `read()` renvoie les trois axes dans un `SteamiVector` (`a.x`, `a.y` et `a.z`), et `x()`, `y()`, `z()` un seul axe. Carte posée à plat, écran vers le haut, z vaut environ −1 g et la rotation reste proche de 0.

`begin()` règle l'accéléromètre sur ±8 g, sinon une secousse de plus de 2 g ne serait jamais vue. `strength()` est la norme des trois axes, environ 1 g au repos ; `isShaken()` vaut `true` quand elle dépasse 2 g, et `isShaken(3.0)` change ce seuil. `SteamiAccelerometer` applique aussi la calibration `ca` de la zone de configuration du DAPLink, si elle existe (voir [Calibrations](./carte#calibrations)). Si le capteur ne répond pas, les lectures renvoient `NAN` (affiché `nan`), et `isShaken()` renvoie `false`.

### Avec le driver ISM330DL

Composant ISM330DL, présent sur toutes les releases. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiISM330DL.h>

SteamiISM330DL imu(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!imu.begin()) {
    Serial.println("ISM330DL non détecté");
    while (true) {}
  }
}

void loop() {
  SteamiISM330DL::Vector3 a;
  if (imu.accelerationG(a)) {
    Serial.print("x=");
    Serial.print(a.x);
    Serial.print(" g  y=");
    Serial.print(a.y);
    Serial.print(" g  z=");
    Serial.print(a.z);
    Serial.println(" g");
  }
  delay(200);
}
```

Carte posée à plat, écran vers le haut, l'axe z mesure environ −1 g (la pesanteur) et les axes x et y environ 0 g. `imu.gyroscopeDps(v)` donne de la même façon la vitesse de rotation en degrés par seconde.

Les méthodes de lecture de ce driver remplissent une variable passée en paramètre et renvoient `true` si la lecture a réussi.

Ce driver, créé dans le programme, ne reçoit pas la calibration `ca` : pour une accélération calibrée, utiliser `SteamiAccelerometer`.

Exemples à essayer sur la carte : [Exemples ISM330DL](./exemples/ism330dl).

## Boussole : magnétomètre

```cpp
#include <SteamiCompass.h>
#include <SteamiButtons.h>

SteamiCompass boussole;
SteamiButtons boutons;

unsigned long dernierAffichage = 0;

void setup() {
  Serial.begin(115200);
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
    Serial.println(")");
  }
  delay(5);
}
```

Au démarrage, sauf si une calibration `cm` est enregistrée sur la carte (voir [Calibrations](./carte#calibrations)), la boussole n'est pas calibrée et le cap affiché est faux : appuyer sur MENU, tourner lentement la carte dans tous les sens pendant les 12 secondes, puis la reposer à plat. Le programme ne s'endort pas une demi-seconde entre deux affichages : il lit les boutons toutes les 5 ms environ, sinon une tape brève sur MENU serait manquée (voir [Boutons et D-PAD](#boutons-et-d-pad)).

`SteamiCompass` donne le cap de la carte tenue à plat, écran vers le haut :

- `heading()` renvoie un angle en degrés, compté dans le sens des aiguilles d'une montre à partir du nord, de 0 à moins de 360 (jamais 360). Il vaut 0 quand le haut de l'écran, le côté opposé au connecteur USB, pointe vers le nord, 90 vers l'est, 180 vers le sud et 270 vers l'ouest.
- `direction()` renvoie la direction la plus proche parmi huit : `"N"`, `"NE"`, `"E"`, `"SE"`, `"S"`, `"SW"`, `"W"` ou `"NW"`. Chacune couvre 45° centrés sur elle : `"N"` va de 337,5° à 22,5°, `"NE"` de 22,5° à 67,5°, etc. `heading()` et `direction()` font chacune leur propre mesure : près de la limite entre deux secteurs, la direction affichée peut ne pas correspondre au cap affiché juste avant (par exemple 22° avec `NE`).

Le cap ne tient pas compte de l'inclinaison : une carte penchée donne un cap faux. Si le capteur ne répond pas, `heading()` renvoie `NAN` et `direction()` un texte vide (`""`).

**Calibrer.** Le magnétomètre mesure aussi le champ magnétique de la carte elle-même, plus fort que celui de la Terre : sans calibration, une V1c a lu 176 µT au total, champ terrestre compris, alors que le champ terrestre seul vaut 25 à 65 µT. Sans calibration, le cap est donc faux. Deux façons de calibrer :

- `boussole.calibrate(12)` mesure pendant 12 secondes : tourner lentement la carte dans tous les sens pendant ce temps. La calibration reste en mémoire vive, n'est pas enregistrée et se perd au redémarrage, à chaque Reset et à chaque téléversement. Le programme ci-dessus et l'exemple [**STeaMi → STEAMI_BOARD → Compass**](./exemples/steami-board#compass) la lancent par un appui sur MENU.
- une calibration `cm` enregistrée dans la zone de configuration du DAPLink est appliquée automatiquement au démarrage (voir [Calibrations](./carte#calibrations)).

Sur une V1c calibrée avec l'exemple Compass, le cap lu face au nord était proche de 359° (`N`) et face à l'est d'environ 70° (`E`) : la boussole indique une direction, pas un cap précis au degré. Les objets métalliques, les aimants et les câbles proches faussent aussi la mesure.

**Nord géographique.** Le cap est mesuré par rapport au nord magnétique. `boussole.setDeclination(2.0)` ajoute la déclinaison magnétique du lieu, en degrés, positive vers l'est, pour viser le nord géographique ; elle ne dépasse pas quelques degrés en France métropolitaine. Cet appel peut se faire avant `begin()`.

**Le magnétomètre.** `SteamiMagnetometer` donne le champ magnétique sur les trois axes, en µT, et `strength()` son intensité. Avant toute calibration, ces valeurs contiennent le champ propre de la carte et peuvent dépasser de loin le champ terrestre. Après une calibration (`cm` dans la zone de configuration, ou `calibrate()` comme pour la boussole), ce décalage est retiré : loin des aimants et du métal, `strength()` vaut alors environ 25 à 65 µT. `SteamiMagnetometer` et `SteamiCompass` partagent le même LIS2MDL : une calibration faite par l'une sert à l'autre. L'exemple [**STeaMi → STEAMI_BOARD → Magnetometer**](./exemples/steami-board#magnetometer) affiche le champ et se calibre, lui aussi, par un appui sur MENU. Si le capteur ne répond pas, `read()`, `x()`, `y()`, `z()` et `strength()` renvoient `NAN` (affiché `nan`), et `calibrate()` ne fait rien.

### Avec le driver LIS2MDL

Composant LIS2MDL, présent sur toutes les releases. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiLIS2MDL.h>

SteamiLIS2MDL mag(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!mag.begin()) {
    Serial.println("LIS2MDL non détecté");
    while (true) {}
  }
}

void loop() {
  float cap = mag.headingFlatOnly();  // carte posée à plat
  Serial.print("Cap : ");
  Serial.print(lroundf(cap) % 360);  // arrondi au degré, jamais 360
  Serial.print(" deg (");
  Serial.print(mag.directionLabel(cap));
  Serial.println(")");
  delay(500);
}
```

Depuis la version 0.34.0 de la bibliothèque, le cap vaut 0° quand le haut de l'écran (le côté opposé au connecteur USB) pointe vers le nord, et augmente dans le sens des aiguilles d'une montre : 90° à l'est, 180° au sud, 270° à l'ouest, jamais 360°. `directionLabel()` renvoie l'une des huit directions (`N`, `NE`, `E`…), chacune centrée sur sa valeur : `N` va de 337,5° à 22,5°. Avec une version plus ancienne, le cap et les directions étaient comptés autrement : un programme qui comparait le cap à des valeurs fixes doit être revérifié.

Le cap n'est fiable qu'après une calibration et loin des objets métalliques : sans calibration, le capteur mesure aussi le champ magnétique de la carte elle-même. L'exemple **STeaMi → LIS2MDL → MagneticCalibration** montre comment calibrer la boussole. `headingWithTiltCompensation()`, qui corrige l'inclinaison avec l'accéléromètre, ne suit pas encore cette convention : même carte à plat, son 0° et son sens de rotation peuvent différer de ceux de `headingFlatOnly()`. Cette fonction n'a pas été vérifiée sur une carte. Utiliser `headingFlatOnly()` et tenir la carte à plat.

La classe `SteamiCompass` calcule le même cap, avec `headingFlatOnly()` du driver partagé, et lui applique d'elle-même la calibration `cm` de la zone de configuration du DAPLink. Un driver créé dans le programme, comme ci-dessus, ne reçoit pas cette calibration.

Exemples à essayer sur la carte : [Exemples LIS2MDL](./exemples/lis2mdl).

## Distance : capteur de temps de vol

```cpp
#include <SteamiDistance.h>

SteamiDistance distance;

void setup() {
  Serial.begin(115200);
  distance.begin();
}

void loop() {
  Serial.print("Distance : ");
  Serial.print(distance.read());
  Serial.println(" mm");
  delay(500);
}
```

`read()` donne la distance en millimètres, et `cm()` en centimètres. `read()` renvoie `-1`, et `cm()` renvoie `NAN`, quand le capteur ne répond pas ou ne donne pas de résultat à temps. Le capteur ne signale pas une cible hors de portée : `read()` renvoie quand même un nombre de millimètres, qui n'est pas une mesure fiable. Une vraie distance de 0 mm se lit aussi `-1`.

### Avec le driver VL53L1X

Composant VL53L1X, présent sur toutes les releases. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiVL53L1X.h>

SteamiVL53L1X tof(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!tof.begin()) {
    Serial.println("VL53L1X non détecté");
    while (true) {}
  }
  tof.startRanging();
}

void loop() {
  if (tof.dataReady()) {
    Serial.print("Distance : ");
    Serial.print(tof.distanceMm());
    Serial.println(" mm");
  }
  delay(50);
}
```

Les exemples **STeaMi → VL53L1X** montrent aussi un radar de recul (**ParkingSensor**), une alarme de proximité (**ProximityAlarm**), un compteur de passages (**ObjectCounter**) et un geste de la main devant le capteur qui allume ou éteint la LED (**GestureDetection**).

Exemples à essayer sur la carte : [Exemples VL53L1X](./exemples/vl53l1x).

## Boutons et D-PAD

```cpp
#include <SteamiButtons.h>

SteamiButtons boutons;

const SteamiButton liste[] = {SteamiButton::A, SteamiButton::B, SteamiButton::MENU,
                              SteamiButton::UP, SteamiButton::DOWN,
                              SteamiButton::LEFT, SteamiButton::RIGHT};
const char* noms[] = {"A", "B", "MENU", "HAUT", "BAS", "GAUCHE", "DROITE"};

void setup() {
  Serial.begin(115200);
  boutons.begin();
}

void loop() {
  for (uint8_t i = 0; i < 7; i++) {
    if (boutons.wasPressed(liste[i])) {  // une seule fois par appui
      Serial.println(noms[i]);
    }
  }
  delay(5);  // lire les boutons souvent : une tape brève dure environ 100 ms
}
```

`SteamiButtons` lit les sept boutons de la carte : `SteamiButton::A`, `B` et `MENU`, reliés au microcontrôleur, et les quatre flèches du D-PAD, `UP`, `DOWN`, `LEFT` et `RIGHT`, reliées à l'extenseur MCP23009E.

| Méthode               | Rôle                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `isPressed(bouton)`   | `true` tant que le bouton est enfoncé                                                                                                                                                      |
| `wasPressed(bouton)`  | `true` une fois par appui : l'appui est consommé, l'appel suivant renvoie `false` jusqu'au prochain appui                                                                                  |
| `wasReleased(bouton)` | de même, `true` une fois par relâchement                                                                                                                                                   |
| `waitForPress()`      | attend, sans limite, un nouvel appui et renvoie le bouton ; `waitForPress(3000)` renvoie `SteamiButton::NONE` après 3 secondes sans appui. Les appuis faits avant l'appel ne comptent pas. |

Si l'extenseur du D-PAD ne répond pas, `begin()` renvoie `false` avec le message `E10`, mais A, B et MENU fonctionnent quand même ; les flèches restent alors relâchées.

Chaque appel de `isPressed()`, `wasPressed()` ou `wasReleased()` lit l'état des boutons, et un appui est pris en compte dès qu'un appel voit le bouton enfoncé. Une tape brève dure environ 100 ms : appeler ces méthodes au moins toutes les 50 ms. Avec un `delay(500)` dans `loop()`, une tape tombée entre deux lectures est perdue ; le programme de la [boussole](#boussole--magnétomètre) mesure le temps avec `millis()` pour afficher sans attendre. Un bouton déjà enfoncé au démarrage du programme ne compte pas comme un appui.

Un contact mécanique rebondit : pendant quelques millisecondes, il s'ouvre et se ferme plusieurs fois. La bibliothèque ignore les rebonds des 20 ms qui suivent chaque appui ou relâchement, si bien qu'un appui ne compte qu'une fois.

L'exemple [**STeaMi → STEAMI_BOARD → Buttons**](./exemples/steami-board#buttons) affiche chaque appui et chaque relâchement des sept boutons.

### Avec le driver MCP23009E

Les boutons A, B et MENU se lisent aussi avec `digitalRead()`, sans bibliothèque (voir [Premiers programmes](./premiers-programmes)). Les quatre boutons directionnels passent par le circuit d'extension MCP23009E, présent sur toutes les releases. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiMCP23009E.h>

SteamiMCP23009E dpad(Steami.wire(), RST_EXPANDER, MCP23009_I2C_ADDR, INT_EXPANDER);

const uint8_t boutons[] = {MCP23009_BTN_UP, MCP23009_BTN_DOWN, MCP23009_BTN_LEFT, MCP23009_BTN_RIGHT};
const char* noms[] = {"HAUT", "BAS", "GAUCHE", "DROITE"};

void setup() {
  Serial.begin(115200);
  dpad.begin();
  for (uint8_t i = 0; i < 4; i++) {
    dpad.setup(boutons[i], MCP23009_DIR_INPUT, MCP23009_PULLUP);
  }
}

void loop() {
  for (uint8_t i = 0; i < 4; i++) {
    if (dpad.getLevel(boutons[i]) == MCP23009_LOGIC_LOW) {  // appuyé = niveau bas
      Serial.println(noms[i]);
    }
  }
  delay(100);
}
```

Ce programme lit le niveau des broches : il affiche le nom d'un bouton tant qu'il reste enfoncé, sans anti-rebond. Pour compter chaque appui une seule fois, utiliser `SteamiButtons`.

La bibliothèque fournit aussi des jeux prêts à téléverser, dans **STeaMi → MCP23009E** : **SimonGame**, **ReactionTimer**, **MorseCode** et **MusicPlayer**.

Exemples à essayer sur la carte : [Exemples MCP23009E](./exemples/mcp23009e).

## Batterie

```cpp
#include <SteamiBattery.h>

SteamiBattery batterie;

void setup() {
  Serial.begin(115200);
  batterie.begin();
}

void loop() {
  Serial.print("Charge : ");
  Serial.print(batterie.percent());
  Serial.print(" %  Tension : ");
  Serial.print(batterie.voltage());
  Serial.print(" V  Courant : ");
  Serial.print(batterie.current());
  Serial.println(batterie.isCharging() ? " mA (en charge)" : " mA");
  delay(2000);
}
```

`percent()` donne la charge en %, `voltage()` la tension en volts et `current()` le courant en mA. `isCharging()` vaut `true` quand `current()` est positif, c'est-à-dire pendant la charge.

La jauge est alimentée par la batterie : sans batterie (carte alimentée par l'USB seul), elle ne répond pas, `begin()` renvoie `false` et le message `E10` demande de brancher une batterie puis d'appuyer sur Reset. Les lectures renvoient alors `0`, `NAN`, `0` et `false` : une fonction qui a échoué n'est réessayée qu'au redémarrage de la carte. `voltage()` renvoie aussi `NAN` quand la jauge mesure 0 mV.

### Avec le driver BQ27441

Composant BQ27441, présent sur toutes les releases. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiBQ27441.h>

SteamiBQ27441 batterie(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!batterie.begin()) {
    Serial.println("BQ27441 non détecté");
    while (true) {}
  }
}

void loop() {
  Serial.print("Charge : ");
  Serial.print(batterie.stateOfCharge());
  Serial.print(" %  Tension : ");
  Serial.print(batterie.voltageMv());
  Serial.println(" mV");
  delay(2000);
}
```

Sans batterie branchée, la jauge ne répond pas et ce programme affiche « BQ27441 non détecté ». Brancher la batterie, puis appuyer sur le bouton Reset de la carte.

Exemples à essayer sur la carte : [Exemples BQ27441](./exemples/bq27441).

## Pression, humidité et température

```cpp
#include <SteamiTemperature.h>
#include <SteamiHumidity.h>
#include <SteamiPressure.h>

SteamiTemperature temperature;
SteamiHumidity humidite;
SteamiPressure pression;

void setup() {
  Serial.begin(115200);
  temperature.begin();
  humidite.begin();
  pression.begin();
}

void loop() {
  Serial.print("Température : ");
  Serial.print(temperature.read());
  Serial.print(" °C  Humidité : ");
  Serial.print(humidite.read());
  Serial.print(" %  Pression : ");
  Serial.print(pression.read());
  Serial.print(" hPa  Altitude : ");
  Serial.print(pression.altitude());
  Serial.println(" m");
  delay(1000);
}
```

`SteamiTemperature` donne la température en °C, `SteamiHumidity` l'humidité relative en % et `SteamiPressure` la pression en hPa. Sur une V1c, les trois classes utilisent le BME280 ; sur une V1a ou une V1b, la température vient du WSEN-HIDS (sinon du WSEN-PADS), l'humidité du WSEN-HIDS et la pression du WSEN-PADS. `chip()` indique le composant utilisé, par exemple `"BME280"`. Si le capteur ne répond pas, les lectures renvoient `NAN` (affiché `nan`).

La calibration de la température enregistrée dans la zone de configuration du DAPLink est appliquée au démarrage (voir [Calibrations](./carte#calibrations)). `temperature.setOffset(-0.5)` ajoute en plus un décalage, en °C, à chaque `read()` de cet objet.

`altitude()` donne l'altitude en mètres avec la pression standard au niveau de la mer, 1013,25 hPa. Pour une meilleure estimation, lui passer la pression du jour, ramenée au niveau de la mer : `pression.altitude(1020.0)`. La formule est la même sur toutes les releases.

### Avec les drivers WSEN-PADS, WSEN-HIDS et BME280

<ReleaseTabs>
<Release releases="v1a v1b">

Deux capteurs Würth : WSEN-PADS (pression) et WSEN-HIDS (humidité). Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiWsenPads.h>
#include <SteamiWsenHids.h>

SteamiWsenPads pression(Steami.wire());
SteamiWsenHids humidite(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!pression.begin() || !humidite.begin()) {
    Serial.println("Capteur non détecté");
    while (true) {}
  }
}

void loop() {
  Serial.print("Pression : ");
  Serial.print(pression.pressureHpa());
  Serial.print(" hPa  Humidité : ");
  Serial.print(humidite.humidity());
  Serial.print(" %  Température : ");
  Serial.print(humidite.temperature());
  Serial.println(" °C");
  delay(1000);
}
```

Exemples à essayer sur la carte : [Exemples WSEN-PADS](./exemples/wsen-pads) et [Exemples WSEN-HIDS](./exemples/wsen-hids).

</Release>
<Release releases="v1c">

Un seul capteur, le BME280, à l'adresse `0x76`. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiBME280.h>

SteamiBME280 bme(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!bme.begin()) {
    Serial.println("BME280 non détecté");
    while (true) {}
  }
}

void loop() {
  auto mesure = bme.read();  // les trois grandeurs d'une même mesure
  Serial.print("Température : ");
  Serial.print(mesure.temperature);
  Serial.print(" °C  Humidité : ");
  Serial.print(mesure.humidity);
  Serial.print(" %  Pression : ");
  Serial.print(mesure.pressure);
  Serial.println(" hPa");
  delay(1000);
}
```

Les exemples **STeaMi → BME280** estiment aussi l'altitude (**Altitude**), le point de rosée (**DewPointMonitor**) et le confort d'une pièce (**ComfortZone**).

Exemples à essayer sur la carte : [Exemples BME280](./exemples/bme280).

</Release>
</ReleaseTabs>

Ces programmes créent leur propre driver : ils lisent la mesure du capteur sans la calibration de la zone de configuration du DAPLink. Pour une température calibrée, utiliser `SteamiTemperature` (voir plus haut).

## Lumière, couleur et gestes

Ces mesures demandent le capteur APDS-9960, présent sur la V1a et la V1b seulement : la V1c n'a pas de capteur de lumière, de couleur ni de gestes. Sur une V1c, les programmes ci-dessous se téléversent, puis affichent le message `E20` et des mesures à 0 (voir plus bas).

```cpp
#include <SteamiLight.h>
#include <SteamiColor.h>

SteamiLight lumiere;
SteamiColor couleur;

void setup() {
  Serial.begin(115200);
  lumiere.begin();
  couleur.begin();
}

void loop() {
  uint16_t rouge, vert, bleu;
  Serial.print("Lumière : ");
  Serial.print(lumiere.read());
  if (couleur.read(rouge, vert, bleu)) {
    Serial.print("  rouge=");
    Serial.print(rouge);
    Serial.print(" vert=");
    Serial.print(vert);
    Serial.print(" bleu=");
    Serial.print(bleu);
  }
  Serial.println();
  delay(500);
}
```

`SteamiLight` et `SteamiColor` donnent des nombres bruts du capteur, sans unité, qui augmentent avec la lumière ; pas de lux ni de couleur prête à afficher. `couleur.read(rouge, vert, bleu)` remplit les trois composantes et renvoie `false` si la mesure manque ; `red()`, `green()` et `blue()` en lisent une seule.

Les gestes de la main se lisent avec `SteamiGesture`. Leur décodage n'a pas encore été vérifié sur une carte.

```cpp
#include <SteamiGesture.h>

SteamiGesture geste;

void setup() {
  Serial.begin(115200);
  geste.begin();
}

void loop() {
  SteamiGesture::Direction direction = geste.read(200);  // NONE tout de suite si aucune main
  if (direction != SteamiGesture::NONE) {
    Serial.println(SteamiGesture::name(direction));
  }
}
```

`read()` renvoie `LEFT`, `RIGHT`, `UP`, `DOWN`, `NEAR`, `FAR` ou `NONE` (de la forme `SteamiGesture::LEFT`), et `SteamiGesture::name(direction)` son nom en texte. `read(200)` lit le geste en cours pendant 200 ms au plus. S'il n'y a pas de main au-dessus du capteur, `read()` renvoie `NONE` tout de suite, quel que soit le délai : il n'attend pas qu'un geste commence. On l'appelle donc à chaque tour de `loop()`, comme ce programme et l'exemple **Gesture** avec `read(200)`. Sans délai, `read()` ne lit que ce que le capteur a déjà enregistré et peut couper un geste en cours.

`SteamiGesture` met le capteur en détection de gestes : pendant qu'une main passe au-dessus, la lumière et la couleur ne sont plus mesurées, puis reprennent.

Sur une V1c, les trois classes affichent le message `E20` (voir [Les messages](./carte#les-messages)) et leur `begin()` renvoie `false`, sans échange sur le bus I²C. `SteamiLight` renvoie alors `0`, `SteamiColor` `false` (et trois `0`) et `SteamiGesture` `NONE`. `Steami.has(SteamiFunction::LIGHT)` indique à l'avance si la carte possède la fonction (voir [les drivers partagés](./carte#aller-plus-loin--les-drivers-partagés)).

### Avec le driver APDS-9960

<ReleaseTabs>
<Release releases="v1a v1b">

Composant APDS-9960. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiAPDS9960.h>

SteamiAPDS9960 lumiere(Steami.wire());

void setup() {
  Serial.begin(115200);
  if (!lumiere.begin()) {
    Serial.println("APDS-9960 non détecté");
    while (true) {}
  }
  lumiere.enableLightSensor();
}

void loop() {
  uint16_t clair;
  if (lumiere.ambientLight(clair)) {
    Serial.print("Lumière ambiante (nombre brut) : ");
    Serial.println(clair);
  }
  delay(500);
}
```

La valeur est un nombre brut du capteur, sans unité, qui augmente avec la lumière (pas des lux).

Les exemples **STeaMi → APDS9960** montrent aussi la proximité (**proximity**) et la reconnaissance de gestes (**gesture**). La proximité n'a pas de classe par fonction : elle se lit avec ce driver.

Exemples à essayer sur la carte : [Exemples APDS9960](./exemples/apds9960).

</Release>
<Release releases="v1c">

La V1c n'a pas de capteur de lumière, de couleur ni de gestes : l'APDS-9960 a été retiré.

</Release>
</ReleaseTabs>

## Écran

```cpp
#include <SteamiDisplay.h>

SteamiDisplay ecran;

void setup() {
  Serial.begin(115200);
  if (!ecran.begin()) {                    // en premier : l'image prend beaucoup de mémoire
    Serial.print("Pas d'écran : ");
    Serial.println(ecran.error());
    return;
  }
  const int16_t cx = ecran.centerX(), cy = ecran.centerY();
  ecran.clear();                           // fond noir
  ecran.circle(cx, cy, ecran.radius() - 1, STEAMI_GREEN);
  ecran.text("Bonjour !", cx - ecran.textWidth("Bonjour !") / 2, cy - 4);
  ecran.show();                            // envoie l'image à l'écran
}

void loop() {}
```

`SteamiDisplay` demande la version 0.37.0 de la bibliothèque. `begin()` reconnaît la release, comme les autres classes, puis démarre son écran : le SSD1327 en niveaux de gris (128 × 128) sur une V1a ou une V1b, le GC9A01 en couleur (240 × 240) sur une V1c. Le même programme dessine la même image sur les deux : `centerX()`, `centerY()` et `radius()` donnent le centre et le rayon de l'écran rond, `width()` et `height()` sa taille en pixels, `(0, 0)` étant le coin en haut à gauche.

Le dessin se fait dans une image en mémoire (`clear`, `pixel`, `line`, `rect`, `circle`, `triangle`, `arc`, `text`), et rien n'apparaît avant l'appel à `show()`. Ce qui dépasse de l'écran est coupé, sans erreur. Les couleurs sont des constantes `SteamiRgb` (`STEAMI_WHITE`, `STEAMI_GREEN`, `STEAMI_RED`…) : en couleur sur une V1c, elles deviennent l'un des 16 niveaux de gris sur une V1a ou une V1b. `text()` écrit en caractères de 8 × 8 pixels, agrandis par un dernier argument facultatif ; les lettres accentuées s'affichent sans accent.

Si `begin()` échoue, la bibliothèque écrit un message codé (`E30` quand la release reste inconnue, `E31` quand l'image de la V1c, 115 200 octets d'un seul bloc, ne trouve pas sa place en mémoire, voir [Les messages](./carte#les-messages)), `error()` vaut `unknown board` ou `no memory`, et les fonctions de dessin ne font plus rien. C'est pourquoi `begin()` s'appelle au tout début de `setup()`, tant que la mémoire est encore libre.

L'exemple **STeaMi → STEAMI_BOARD → Drawing** dessine une galerie de formes avec cette classe : voir [Drawing](./exemples/steami-board#drawing).

Pour afficher une mesure sans calculer de coordonnées, `SteamiScreen` place elle-même le texte sur l'écran rond :

```cpp
#include <SteamiScreen.h>
#include <SteamiHumidity.h>

SteamiScreen ecran;
SteamiHumidity humidite;

void setup() {
  Serial.begin(115200);
  ecran.begin();                     // en premier, comme pour SteamiDisplay
  humidite.begin();
}

void loop() {
  float h = humidite.read();         // NAN si la mesure manque
  ecran.clear();
  ecran.title("Humidité");           // en haut ; s'affiche sans accent
  ecran.value(h, "%");               // au centre, unité en dessous ; NAN s'écrit --
  ecran.bar(h);                      // barre remplie de 0 à 100, vide pour NAN
  ecran.subtitle(humidite.chip());   // nom du capteur, en bas
  ecran.show();
  delay(1000);
}
```

`SteamiScreen` demande la version 0.38.0 de la bibliothèque. C'est une `SteamiDisplay` : `begin()`, `clear()`, `show()`, `error()` et les fonctions de dessin ci-dessus restent disponibles, et ses messages `E30` et `E31` commencent par `SteamiScreen:`.

Elle ajoute des fonctions qui calculent leur place à partir de la taille de l'écran : `title()` en haut, `subtitle()` en bas (trois lignes au plus), `value()` pour un nombre avec son unité et une étiquette facultative, `bar()` pour une barre horizontale, et `text(texte, position)`. La position est l'une des neuf constantes `SteamiAt` : `CENTER` et les points cardinaux `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`, le nord en haut.

Positions et marges sont données pour l'écran de 128 pixels et agrandies sur celui de 240, où les caractères sont deux fois plus grands : le même programme donne la même image sur les deux écrans. Aucun texte ne sort du cercle : une valeur trop large passe à des chiffres plus petits, un texte trop long est coupé. `value()` écrit un `float` avec un chiffre après le point (`setDecimals()` en change le nombre) et `--` pour `NAN`.

Les exemples [ScreenTemperature](./exemples/steami-board#screentemperature), [ScreenBattery](./exemples/steami-board#screenbattery) et [ScreenComfort](./exemples/steami-board#screencomfort) affichent ainsi une température, la charge de la batterie avec une barre, et deux valeurs côte à côte.

### Avec les drivers SSD1327 et GC9A01

Le driver de l'écran de chaque release offre ce que la classe n'a pas, comme les 16 niveaux de gris en valeurs brutes ou les couleurs RGB565 du GC9A01. Il ne marche que sur une carte qui a cet écran.

<ReleaseTabs>
<Release releases="v1a v1b">

Écran OLED rond 128 × 128, 16 niveaux de gris (contrôleur SSD1327). Driver : bibliothèque STeaMi.

```cpp
#include <SteamiSSD1327.h>

SteamiSSD1327 oled;

void setup() {
  oled.begin();
  oled.fill(0);                       // 0 = noir, 15 = blanc
  oled.text("Bonjour !", 30, 60, 15);
  oled.show();                        // envoie l'image à l'écran
}

void loop() {}
```

Le dessin se fait en mémoire (`fill`, `pixel`, `line`, `fillRect`, `text`) ; rien n'apparaît avant l'appel à `show()`. Les couleurs vont de `0` (noir) à `15` (blanc).

Exemples à essayer sur la carte : [Exemples SSD1327](./exemples/ssd1327).

</Release>
<Release releases="v1c">

Écran TFT rond 240 × 240 en couleur (contrôleur GC9A01). Driver : bibliothèque STeaMi.

```cpp
#include <SteamiGC9A01.h>

SteamiGC9A01 affichage;

void setup() {
  Serial.begin(115200);
  if (!affichage.begin()) {               // false si la mémoire manque
    Serial.println("Mémoire insuffisante pour l'écran");
    while (true) {}
  }
  affichage.fill(GC9A01_BLACK);
  affichage.text("Bonjour !", 93, 100, GC9A01_WHITE);
  affichage.fillRect(100, 130, 40, 40, GC9A01_RED);
  affichage.show();                       // envoie l'image à l'écran
}

void loop() {}
```

Le dessin se fait en mémoire, avec les mêmes fonctions que l'écran des V1a et V1b (`fill`, `pixel`, `line`, `fillRect`, `text`) ; rien n'apparaît avant l'appel à `show()`. Les couleurs sont au format RGB565 : constantes `GC9A01_RED`, `GC9A01_BLUE`, `GC9A01_YELLOW`…, ou `SteamiGC9A01::color565(r, g, b)` à partir de valeurs de 0 à 255.

`text(texte, x, y, couleur)` écrit avec une petite police de 5 × 7 pixels, 6 pixels par caractère, sans option de taille ; `(x, y)` est le coin en haut à gauche de la première lettre. Les lettres accentuées ne s'affichent pas.

L'écran est rond : les coins de l'image ne s'affichent pas. Le plus grand carré entièrement visible va de `(36, 36)` à `(203, 203)`.

L'image occupe 115 200 octets de mémoire vive, plus de la moitié de celle disponible pour un programme. Cette mémoire est réservée par `begin()` pendant l'exécution : le rapport de compilation de l'IDE ne la compte pas. Si l'écran reste noir dans un programme plus gros, c'est que la mémoire manque.

Les exemples **STeaMi → GC9A01** reprennent ceux de l'écran des V1a et V1b, en couleur (**color_palette**, **rotating_3d_cube**…).

Exemples à essayer sur la carte : [Exemples GC9A01](./exemples/gc9a01).

</Release>
</ReleaseTabs>

## Fichier sur le disque USB

Le DAPLink, le second microcontrôleur de la carte qui fait apparaître le disque USB **STeaMi**, garde un seul fichier dans la mémoire flash externe de 8 Mo. Un programme peut y ajouter des lignes de texte, par exemple un relevé de mesures au format CSV, que l'ordinateur ouvre ensuite comme un fichier ordinaire. Driver : bibliothèque STeaMi.

```cpp
#include <SteamiBoard.h>
#include <SteamiDaplinkBridge.h>
#include <SteamiDaplinkFlash.h>

SteamiDaplinkBridge pont(Steami.wire());
SteamiDaplinkFlash fichier(pont);

void setup() {
  Serial.begin(115200);
  if (!fichier.begin()) {
    Serial.println("DAPLink non détecté");
    while (true) {}
  }
  if (!fichier.setFilename("MESURES", "CSV")) {
    Serial.println("Nom refusé");
  }
  fichier.writeLine("secondes");          // en-tête : repère chaque démarrage
}

void loop() {
  char ligne[16];
  snprintf(ligne, sizeof(ligne), "%lu", millis() / 1000);
  fichier.writeLine(ligne);               // ajoute une ligne à la fin du fichier
  Serial.println(ligne);
  delay(10000);
}
```

Ce qu'il faut savoir sur ce fichier :

- **Un seul fichier.** `setFilename()` le renomme sans effacer son contenu : un autre programme (comme l'exemple **data_logger**) écrit dans ce même fichier. Le nom compte 8 caractères au plus et l'extension 3, sans espace ni point ; les minuscules deviennent des majuscules.
- **Les lignes s'ajoutent.** Chaque démarrage du programme (téléversement, bouton Reset, rebranchement) ajoute ses lignes après les précédentes, et le compteur repart à 0 : l'en-tête `secondes` sépare les séries.
- **Voir le fichier à jour.** Le disque USB montre le fichier tel qu'il était au démarrage du DAPLink. Pour voir les nouvelles lignes, débrancher le câble USB, et aussi la batterie si elle est branchée (elle garde le DAPLink alimenté), puis rebrancher. Le bouton Reset ne suffit pas.
- **Vider le fichier.** `fichier.clearFlash()` efface le contenu et garde le nom. L'appeler volontairement, par exemple à l'appui sur un bouton, et pas dans `setup()` : le relevé serait effacé à chaque démarrage. L'effacement prend de moins d'une seconde à une vingtaine de secondes selon la taille du fichier.

L'exemple **STeaMi → DAPLINK_FLASH → data_logger** relit aussi le fichier depuis le programme. La lecture demande un firmware DAPLink de mars 2026 ou plus récent : avec un firmware plus ancien, le fichier paraît vide au programme. Le [mettre à jour](../daplink#mise-à-jour-du-firmware) corrige le problème.

La zone de configuration du DAPLink (nom de la carte, calibrations des capteurs) se lit avec le driver `SteamiConfig` : voir l'exemple **STeaMi → STEAMI_CONFIG → show_config**. Sur une carte dont le firmware DAPLink n'a pas de zone de configuration, `SteamiConfig::begin()` renvoie `false` ; là aussi, mettre à jour le firmware.

Exemples à essayer sur la carte : [Exemples DAPLINK_FLASH](./exemples/daplink-flash) et [Exemples STEAMI_CONFIG](./exemples/steami-config).

## Bluetooth

Le Bluetooth Low Energy s'utilise avec la bibliothèque **STM32duinoBLE**, proposée automatiquement à l'installation de STeaMi. Les exemples propres à la STeaMi sont dans **Fichier → Exemples → STeaMi → BLE** : jeu du chaud-froid (**BleHotCold**), estimation de distance par la force du signal (**BleRssiProximity**)… L'exemple **BleBeacon** diffuse la mesure du capteur WSEN-HIDS : il ne fonctionne que sur V1a et V1b.

Le Bluetooth demande une pile radio, installée à part sur le second cœur du STM32WB55. Si `BLE.begin()` renvoie `0`, vérifier la pile et l'installer au besoin : voir [Pile radio Bluetooth](../pile-radio).

Exemples à essayer sur la carte : [Exemples BLE](./exemples/ble).

## Composants non pris en charge

Le microphone (IM34DT05) n'a pas encore de driver Arduino. Il est utilisable en [MicroPython](../micropython/).
