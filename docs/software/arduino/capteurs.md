---
title: Capteurs et écran
sidebar_position: 4
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Capteurs et écran

Cette page donne un programme minimal pour chaque composant de la carte. Chaque programme affiche ses mesures dans le moniteur série, à 115200 bauds.

Avant de commencer :

- installer les bibliothèques indiquées dans chaque section (voir [Bibliothèques STeaMi](./bibliotheques)) ;
- garder en tête que les capteurs sont sur le [bus I²C interne](./bibliotheques#le-bus-ic-interne) : tous les programmes créent l'objet `internalI2C` et le passent au driver.

Pour aller plus loin, chaque driver STeaMi fournit des exemples plus complets dans **Fichier → Exemples**.

Les composants de la carte dépendent de sa release (voir [Révisions](/docs/hardware/revisions)). Les sections qui diffèrent sont présentées en onglets **V1a / V1b / V1c**.

## Mouvement : accéléromètre et gyroscope

Composant ISM330DL, présent sur toutes les releases. Bibliothèque : dossier `ism330dl`.

```cpp
#include <Wire.h>
#include <ISM330DL.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
ISM330DL imu(internalI2C);

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
  if (!imu.begin()) {
    Serial.println("ISM330DL non détecté");
    while (true) {}
  }
}

void loop() {
  ISM330DL::Vector3 a;
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

Composant LIS2MDL, présent sur toutes les releases. Bibliothèque : dossier `lis2mdl`.

```cpp
#include <Wire.h>
#include <LIS2MDL.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
LIS2MDL mag(internalI2C);

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
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

Le cap n'est fiable qu'après une calibration et loin des objets métalliques. L'exemple **MagneticCalibration** du driver montre comment calibrer la boussole.

## Distance : capteur de temps de vol

Composant VL53L1X, présent sur toutes les releases. Bibliothèque : dossier `vl53l1x`.

```cpp
#include <Wire.h>
#include <VL53L1X.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
VL53L1X tof(internalI2C);

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
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

Les quatre boutons directionnels passent par le circuit d'extension MCP23009E, présent sur toutes les releases. Bibliothèque : dossier `mcp23009e`.

```cpp
#include <Wire.h>
#include <MCP23009E.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
MCP23009E dpad(internalI2C, RST_EXPANDER, MCP23009_I2C_ADDR, INT_EXPANDER);

const uint8_t boutons[] = {MCP23009_BTN_UP, MCP23009_BTN_DOWN, MCP23009_BTN_LEFT, MCP23009_BTN_RIGHT};
const char* noms[] = {"HAUT", "BAS", "GAUCHE", "DROITE"};

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
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

Le driver fournit aussi des jeux prêts à téléverser : **SimonGame**, **ReactionTimer**, **MorseCode** et **MusicPlayer**.

## Batterie

Composant BQ27441, présent sur toutes les releases. Bibliothèque : dossier `bq27441`.

```cpp
#include <Wire.h>
#include <BQ27441.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
BQ27441 batterie(internalI2C);

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
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

Deux capteurs Würth : WSEN-PADS (pression) et WSEN-HIDS (humidité). Bibliothèques : dossiers `wsen-pads` et `wsen-hids`.

```cpp
#include <Wire.h>
#include <WSEN_PADS.h>
#include <WsenHids.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
WSEN_PADS pression(internalI2C);
WsenHids humidite(internalI2C);

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
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

Un seul capteur, le BME280, à l'adresse `0x76`. Il n'a pas encore de driver STeaMi : on utilise la bibliothèque **Adafruit BME280 Library**, à installer depuis le gestionnaire de bibliothèques.

```cpp
#include <Wire.h>
#include <Adafruit_BME280.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
Adafruit_BME280 bme;

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
  if (!bme.begin(0x76, &internalI2C)) {
    Serial.println("BME280 non détecté");
    while (true) {}
  }
}

void loop() {
  Serial.print("Température : ");
  Serial.print(bme.readTemperature());
  Serial.print(" °C  Humidité : ");
  Serial.print(bme.readHumidity());
  Serial.print(" %  Pression : ");
  Serial.print(bme.readPressure() / 100.0);
  Serial.println(" hPa");
  delay(1000);
}
```

</Release>
</ReleaseTabs>

## Lumière, couleur et gestes

<ReleaseTabs>
<Release releases="v1a v1b">

Composant APDS-9960. Bibliothèque : dossier `apds9960`.

```cpp
#include <Wire.h>
#include <APDS9960.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);
APDS9960 lumiere(internalI2C);

void setup() {
  Serial.begin(115200);
  internalI2C.begin();
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

Les exemples du driver montrent aussi la proximité (**proximity**) et la reconnaissance de gestes (**gesture**).

</Release>
<Release releases="v1c">

La V1c n'a pas de capteur de lumière, de couleur ni de gestes : l'APDS-9960 a été retiré.

</Release>
</ReleaseTabs>

## Écran

<ReleaseTabs>
<Release releases="v1a v1b">

Écran OLED rond 128 × 128, 16 niveaux de gris (contrôleur SSD1327). Bibliothèque : dossier `ssd1327`.

```cpp
#include <SSD1327.h>

WS_OLED_128X128_STEAMI oled;

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

Écran TFT rond 240 × 240 en couleur (contrôleur GC9A01). Il n'a pas encore de driver STeaMi : on utilise la bibliothèque **GFX Library for Arduino**, à installer depuis le gestionnaire de bibliothèques.

```cpp
#include <SPI.h>
#include <Arduino_GFX_Library.h>

// L'écran partage la broche D/C (PB4) avec le MISO du SPI interne.
// On déclare donc un SPI dont le MISO est déplacé sur PA6 (broche P10
// du connecteur de bord), et on garde PB4 pour D/C.
SPIClass spiTft(SPI_INT_MOSI, PA6, SPI_INT_SCK);
Arduino_DataBus *bus = new Arduino_HWSPI(SPI_INT_MISO, CS_DISPLAY, &spiTft);
Arduino_GFX *tft = new Arduino_GC9A01(bus, RST_DISPLAY, 0, true);

void setup() {
  tft->begin();
  tft->fillScreen(RGB565_BLACK);
  tft->setTextColor(RGB565_WHITE);
  tft->setTextSize(3);
  tft->setCursor(40, 105);
  tft->print("Bonjour !");
  tft->fillCircle(120, 180, 20, RGB565_RED);
}

void loop() {}
```

Sur la STeaMi, la broche de commande D/C de l'écran est la broche MISO du bus SPI interne. Le programme crée donc un bus SPI dont le MISO est déplacé sur la broche P10 du connecteur de bord, qui ne peut plus servir à autre chose tant que l'écran est utilisé.

Les fonctions de dessin (`fillScreen`, `drawLine`, `fillCircle`, `setCursor`, `print`…) sont décrites dans le [wiki de la bibliothèque](https://github.com/moononournation/Arduino_GFX/wiki). Les couleurs sont au format RGB565 (`RGB565_RED`, `RGB565_BLUE`…).

</Release>
</ReleaseTabs>

## Bluetooth

Le Bluetooth Low Energy s'utilise avec la bibliothèque **STM32duinoBLE**, à installer depuis le gestionnaire de bibliothèques. Le dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib/tree/main/lib/ble/examples) contient des exemples propres à la STeaMi : jeu du chaud-froid (**BleHotCold**), estimation de distance par la force du signal (**BleRssiProximity**)… L'exemple **BleBeacon** diffuse la mesure du capteur WSEN-HIDS : il ne fonctionne que sur V1a et V1b.

## Composants non pris en charge

Le microphone (IM34DT05), la mémoire flash externe et la configuration persistante (gérées par le DAPLink) n'ont pas encore de driver Arduino. Ils sont utilisables en [MicroPython](../micropython/).
