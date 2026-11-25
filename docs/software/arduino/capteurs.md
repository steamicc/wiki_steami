---
title: Capteurs et écran
sidebar_position: 5
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Capteurs et écran

Cette page donne un programme minimal pour chaque composant de la carte. Chaque programme affiche ses mesures dans le moniteur série, à 115200 bauds.

Avant de commencer :

- installer la bibliothèque **STeaMi** depuis le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)) ;
- garder en tête que les capteurs sont sur le [bus I²C interne](./bibliotheques#le-bus-ic-interne) : tous les programmes passent au driver le bus de la carte, `Steami.wire()`, déclaré dans `<SteamiBoard.h>`.

Pour aller plus loin, la bibliothèque STeaMi fournit des exemples plus complets, rangés par composant dans **Fichier → Exemples → STeaMi**.

Les composants de la carte dépendent de sa release (voir [Révisions](/docs/hardware/revisions)). Les sections qui diffèrent sont présentées en onglets **V1a / V1b / V1c**.

## Mouvement : accéléromètre et gyroscope

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

Carte posée à plat, l'axe z mesure environ ±1 g (la pesanteur) et les axes x et y environ 0 g. `imu.gyroscopeDps(v)` donne de la même façon la vitesse de rotation en degrés par seconde.

Les méthodes de lecture de ce driver remplissent une variable passée en paramètre et renvoient `true` si la lecture a réussi.

## Boussole : magnétomètre

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
  Serial.print(cap);
  Serial.print(" deg (");
  Serial.print(mag.directionLabel(cap));
  Serial.println(")");
  delay(500);
}
```

Le cap n'est fiable qu'après une calibration et loin des objets métalliques. L'exemple **STeaMi → LIS2MDL → MagneticCalibration** montre comment calibrer la boussole.

## Distance : capteur de temps de vol

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

## D-PAD

Les quatre boutons directionnels passent par le circuit d'extension MCP23009E, présent sur toutes les releases. Driver : bibliothèque STeaMi.

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

La bibliothèque fournit aussi des jeux prêts à téléverser, dans **STeaMi → MCP23009E** : **SimonGame**, **ReactionTimer**, **MorseCode** et **MusicPlayer**.

## Batterie

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

Sans batterie branchée (carte alimentée par l'USB seul), la jauge répond mais renvoie 0 % et 0 mV.

## Pression, humidité et température

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

</Release>
</ReleaseTabs>

## Lumière, couleur et gestes

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
  uint16_t lux;
  if (lumiere.ambientLight(lux)) {
    Serial.print("Lumière ambiante : ");
    Serial.println(lux);
  }
  delay(500);
}
```

Les exemples **STeaMi → APDS9960** montrent aussi la proximité (**proximity**) et la reconnaissance de gestes (**gesture**).

</Release>
<Release releases="v1c">

La V1c n'a pas de capteur de lumière, de couleur ni de gestes : l'APDS-9960 a été retiré.

</Release>
</ReleaseTabs>

## Écran

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

## Bluetooth

Le Bluetooth Low Energy s'utilise avec la bibliothèque **STM32duinoBLE**, proposée automatiquement à l'installation de STeaMi. Les exemples propres à la STeaMi sont dans **Fichier → Exemples → STeaMi → BLE** : jeu du chaud-froid (**BleHotCold**), estimation de distance par la force du signal (**BleRssiProximity**)… L'exemple **BleBeacon** diffuse la mesure du capteur WSEN-HIDS : il ne fonctionne que sur V1a et V1b.

## Composants non pris en charge

Le microphone (IM34DT05) n'a pas encore de driver Arduino. Il est utilisable en [MicroPython](../micropython/).
