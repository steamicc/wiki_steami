---
title: Bibliothèques STeaMi
sidebar_position: 4
---

# Bibliothèques STeaMi

La LED RGB, les boutons A, B et MENU et le buzzer s'utilisent sans bibliothèque. Tous les autres composants de la carte se pilotent avec un driver : accéléromètre et gyroscope, magnétomètre, capteur de distance, capteurs de pression, d'humidité et de lumière, D-PAD, jauge de batterie, écran et Bluetooth. Ces drivers sont réunis dans une seule bibliothèque Arduino, **STeaMi**, disponible dans le gestionnaire de bibliothèques de l'Arduino IDE, à l'exception du Bluetooth ; le [tableau des drivers](#les-drivers-des-composants) donne l'en-tête de chaque composant. Elle est développée dans le dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) et publiée à chaque version dans [arduino-steami](https://github.com/steamicc/arduino-steami).

## Installer la bibliothèque STeaMi

1. Ouvrir le **gestionnaire de bibliothèques** : icône de livres dans la barre latérale, ou **Outils → Gérer les bibliothèques**.
2. Rechercher **STeaMi** et cliquer sur **Installer**.
3. L'IDE propose d'installer aussi la bibliothèque **STM32duinoBLE**, utilisée par les exemples Bluetooth : choisir **Tout installer**.

Les mises à jour se font de la même façon : le gestionnaire de bibliothèques signale quand une nouvelle version est disponible.

### Installation sans accès à Internet

Pour une salle sans accès au gestionnaire de bibliothèques :

1. Sur un poste connecté, ouvrir la [dernière version de arduino-steami](https://github.com/steamicc/arduino-steami/releases/latest) et télécharger **Source code (zip)**.
2. Sur chaque poste, dans l'Arduino IDE : **Croquis → Inclure une bibliothèque → Ajouter la bibliothèque .ZIP**, puis choisir le fichier téléchargé.
3. Installer de la même façon la bibliothèque STM32duinoBLE si les exemples Bluetooth sont utilisés.

### Si les drivers avaient été copiés à la main

Une version précédente de cette page faisait copier des dossiers de drivers (`ism330dl`, `lis2mdl`…) dans le dossier `libraries` du carnet de croquis. Ces copies entrent en conflit avec la bibliothèque STeaMi et provoquent des erreurs de compilation. Avant d'installer STeaMi, supprimer ces dossiers. Ils se trouvent dans le sous-dossier `libraries` du **carnet de croquis**, dont l'emplacement est indiqué dans **Fichier → Préférences** (par défaut `Documents/Arduino/libraries` sous Windows et macOS, `~/Arduino/libraries` sous Linux).

De même, ne pas installer en plus l'ancienne bibliothèque **MCP23009E** du gestionnaire : le driver du D-PAD est déjà inclus dans STeaMi.

### Programmes écrits avant la version 0.30.0

Depuis la version 0.30.0 de STeaMi, chaque driver porte le préfixe `Steami`, dans son en-tête comme dans le nom de sa classe. Un programme écrit avec une version antérieure ne compile plus : il suffit de remplacer les noms.

| Avant                                                  | Depuis la version 0.30.0                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| `#include <ISM330DL.h>`, `ISM330DL imu(…)`             | `#include <SteamiISM330DL.h>`, `SteamiISM330DL imu(…)`            |
| `#include <LIS2MDL.h>`, `LIS2MDL mag(…)`               | `#include <SteamiLIS2MDL.h>`, `SteamiLIS2MDL mag(…)`              |
| `#include <VL53L1X.h>`, `VL53L1X tof(…)`               | `#include <SteamiVL53L1X.h>`, `SteamiVL53L1X tof(…)`              |
| `#include <MCP23009E.h>`, `MCP23009E dpad(…)`          | `#include <SteamiMCP23009E.h>`, `SteamiMCP23009E dpad(…)`         |
| `#include <BQ27441.h>`, `BQ27441 batterie(…)`          | `#include <SteamiBQ27441.h>`, `SteamiBQ27441 batterie(…)`         |
| `#include <WSEN_PADS.h>`, `WSEN_PADS pression(…)`      | `#include <SteamiWsenPads.h>`, `SteamiWsenPads pression(…)`       |
| `#include <WsenHids.h>`, `WsenHids humidite(…)`        | `#include <SteamiWsenHids.h>`, `SteamiWsenHids humidite(…)`       |
| `#include <APDS9960.h>`, `APDS9960 lumiere(…)`         | `#include <SteamiAPDS9960.h>`, `SteamiAPDS9960 lumiere(…)`        |
| `#include <SSD1327.h>`, `WS_OLED_128X128_STEAMI oled;` | `#include <SteamiSSD1327.h>`, `SteamiSSD1327 oled;`               |
| `#include <DaplinkBridge.h>`, `DaplinkBridge pont(…)`  | `#include <SteamiDaplinkBridge.h>`, `SteamiDaplinkBridge pont(…)` |

Les types définis dans une classe suivent son nom (`ISM330DL::Vector3` devient `SteamiISM330DL::Vector3`). Les constantes (`MCP23009_BTN_UP`, `WSEN_HIDS_ODR_1_HZ`…) ne changent pas.

Les programmes de la V1c qui utilisaient les bibliothèques **Adafruit BME280 Library** ou **GFX Library for Arduino** fonctionnent toujours. Les drivers de la bibliothèque STeaMi sont plus simples : rien à installer en plus, et `SteamiGC9A01` laisse libre la broche P10, sur laquelle l'ancien programme de l'écran déplaçait le MISO du SPI (voir [Capteurs et écran](./capteurs)).

Les dépôts d'élèves créés dans un [Codespace](./codespace) gardent la version des drivers de leur création : ceux créés avant le passage à la version 0.30.0 utilisent encore les anciens noms.

## Les drivers des composants

Le tableau suivant donne, pour chaque composant de la carte, la bibliothèque qui le pilote et l'en-tête à inclure.

| Composant                                         | Bibliothèque à installer | `#include`               | Releases      |
| ------------------------------------------------- | ------------------------ | ------------------------ | ------------- |
| Accéléromètre et gyroscope (ISM330DL)             | STeaMi                   | `<SteamiISM330DL.h>`     | V1a, V1b, V1c |
| Magnétomètre, boussole (LIS2MDL)                  | STeaMi                   | `<SteamiLIS2MDL.h>`      | V1a, V1b, V1c |
| Distance (VL53L1X)                                | STeaMi                   | `<SteamiVL53L1X.h>`      | V1a, V1b, V1c |
| D-PAD (MCP23009E)                                 | STeaMi                   | `<SteamiMCP23009E.h>`    | V1a, V1b, V1c |
| Jauge de batterie (BQ27441)                       | STeaMi                   | `<SteamiBQ27441.h>`      | V1a, V1b, V1c |
| Pression et température (WSEN-PADS)               | STeaMi                   | `<SteamiWsenPads.h>`     | V1a, V1b      |
| Humidité et température (WSEN-HIDS)               | STeaMi                   | `<SteamiWsenHids.h>`     | V1a, V1b      |
| Lumière, couleur, proximité et gestes (APDS-9960) | STeaMi                   | `<SteamiAPDS9960.h>`     | V1a, V1b      |
| Pression, humidité et température (BME280)        | STeaMi                   | `<SteamiBME280.h>`       | V1c           |
| Écran OLED 128 × 128 (SSD1327)                    | STeaMi                   | `<SteamiSSD1327.h>`      | V1a, V1b      |
| Écran TFT couleur 240 × 240 (GC9A01)              | STeaMi                   | `<SteamiGC9A01.h>`       | V1c           |
| Fichier sur le disque USB (DAPLink)               | STeaMi                   | `<SteamiDaplinkFlash.h>` | V1a, V1b, V1c |
| Configuration persistante (DAPLink)               | STeaMi                   | `<SteamiConfig.h>`       | V1a, V1b, V1c |
| Bluetooth Low Energy (STM32WB55)                  | STM32duinoBLE            | `<STM32duinoBLE.h>`      | V1a, V1b, V1c |
| Microphone (IM34DT05)                             | pas encore de driver     | —                        | V1a, V1b, V1c |

STM32duinoBLE est proposée automatiquement à l'installation de STeaMi.

Un programme inclut seulement les drivers dont il a besoin. **Croquis → Inclure une bibliothèque → STeaMi** ajoute `#include <STeaMi.h>`, qui inclut tous les drivers STeaMi d'un coup.

Les exemples des drivers STeaMi sont rangés par composant dans **Fichier → Exemples → STeaMi** : par exemple **STeaMi → LIS2MDL → DigitalCompass**, ou **STeaMi → BLE → BleHotCold** pour le Bluetooth. Dans le menu, STeaMi apparaît dans la section « Exemples des librairies personnalisées ».

![Menu Fichier → Exemples de l'Arduino IDE : sous « Exemples des librairies personnalisées », le sous-menu STeaMi liste les composants, et LIS2MDL ses exemples BasicReader, DigitalCompass, MagneticCalibration et MetalDetector](/img/software/arduino/bibliotheques-03-exemples.png)
La page [Capteurs et écran](./capteurs) donne un programme minimal pour chaque composant.

## Le bus I²C interne

C'est le point le plus important pour utiliser les capteurs de la STeaMi.

La carte possède **deux bus I²C** :

| Bus     | Objet Arduino                                              | Broches                      | Usage                                                           |
| ------- | ---------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| externe | `Wire` (créé automatiquement)                              | `I2C_EXT_SDA`, `I2C_EXT_SCL` | connecteurs I²C externes et connecteur de bord                  |
| interne | à créer : `TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);` | `I2C_INT_SDA`, `I2C_INT_SCL` | tous les capteurs, le D-PAD et la jauge de batterie de la carte |

L'objet `Wire` des exemples Arduino classiques ne voit **pas** les capteurs de la carte. Chaque programme qui utilise un capteur interne commence donc ainsi :

```cpp
#include <Wire.h>
#include <SteamiISM330DL.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);  // bus I²C interne
SteamiISM330DL imu(internalI2C);                // le driver reçoit ce bus

void setup() {
  Serial.begin(115200);
  internalI2C.begin();                          // démarrer le bus avant les capteurs
  if (!imu.begin()) {
    Serial.println("ISM330DL non détecté");
  }
}

void loop() {}
```

Un seul objet `internalI2C` suffit pour tous les capteurs : il se passe à chaque driver.

La même règle vaut pour les bibliothèques tierces : elles reçoivent elles aussi `internalI2C` à la place de `Wire`.

## Étapes suivantes

- [Capteurs et écran](./capteurs) : un programme minimal pour chaque composant.
- [Conventions de l'API](./conventions) : ce que les drivers ont en commun.
