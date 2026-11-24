---
title: Bibliothèques STeaMi
sidebar_position: 4
---

# Bibliothèques STeaMi

La LED RGB, les boutons A, B et MENU et le buzzer s'utilisent sans bibliothèque. Tous les autres composants de la carte se pilotent avec un driver : accéléromètre et gyroscope, magnétomètre, capteur de distance, capteurs de pression, d'humidité et de lumière, D-PAD, jauge de batterie, écran et Bluetooth. La plupart de ces drivers sont réunis dans une seule bibliothèque Arduino, **STeaMi**, disponible dans le gestionnaire de bibliothèques de l'Arduino IDE ; le [tableau des drivers](#les-drivers-des-composants) donne la bibliothèque de chaque composant. Elle est développée dans le dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) et publiée à chaque version dans [arduino-steami](https://github.com/steamicc/arduino-steami).

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

## Les drivers des composants

Le tableau suivant donne, pour chaque composant de la carte, la bibliothèque qui le pilote et l'en-tête à inclure. La plupart des drivers font partie de la bibliothèque STeaMi. Le BME280 et l'écran couleur de la V1c n'ont pas encore de driver STeaMi : ils s'utilisent avec des bibliothèques existantes, à installer elles aussi depuis le gestionnaire de bibliothèques.

| Composant                                         | Bibliothèque à installer    | `#include`                | Releases      |
| ------------------------------------------------- | --------------------------- | ------------------------- | ------------- |
| Accéléromètre et gyroscope (ISM330DL)             | STeaMi                      | `<ISM330DL.h>`            | V1a, V1b, V1c |
| Magnétomètre, boussole (LIS2MDL)                  | STeaMi                      | `<LIS2MDL.h>`             | V1a, V1b, V1c |
| Distance (VL53L1X)                                | STeaMi                      | `<VL53L1X.h>`             | V1a, V1b, V1c |
| D-PAD (MCP23009E)                                 | STeaMi                      | `<MCP23009E.h>`           | V1a, V1b, V1c |
| Jauge de batterie (BQ27441)                       | STeaMi                      | `<BQ27441.h>`             | V1a, V1b, V1c |
| Pression et température (WSEN-PADS)               | STeaMi                      | `<WSEN_PADS.h>`           | V1a, V1b      |
| Humidité et température (WSEN-HIDS)               | STeaMi                      | `<WsenHids.h>`            | V1a, V1b      |
| Lumière, couleur, proximité et gestes (APDS-9960) | STeaMi                      | `<APDS9960.h>`            | V1a, V1b      |
| Pression, humidité et température (BME280)        | **Adafruit BME280 Library** | `<Adafruit_BME280.h>`     | V1c           |
| Écran OLED 128 × 128 (SSD1327)                    | STeaMi                      | `<SSD1327.h>`             | V1a, V1b      |
| Écran TFT couleur 240 × 240 (GC9A01)              | **GFX Library for Arduino** | `<Arduino_GFX_Library.h>` | V1c           |
| Bluetooth Low Energy (STM32WB55)                  | STM32duinoBLE               | `<STM32duinoBLE.h>`       | V1a, V1b, V1c |
| Microphone (IM34DT05)                             | pas encore de driver        | —                         | V1a, V1b, V1c |

STM32duinoBLE est proposée automatiquement à l'installation de STeaMi. Pour les bibliothèques tierces, accepter l'installation des dépendances proposée par l'IDE.

Un programme inclut seulement les drivers dont il a besoin. **Croquis → Inclure une bibliothèque → STeaMi** ajoute `#include <STeaMi.h>`, qui inclut tous les drivers STeaMi d'un coup.

Les exemples des drivers STeaMi sont rangés par composant dans **Fichier → Exemples → STeaMi** : par exemple **STeaMi → LIS2MDL → DigitalCompass**, ou **STeaMi → BLE → BleHotCold** pour le Bluetooth. La page [Capteurs et écran](./capteurs) donne un programme minimal pour chaque composant, BME280 et écran V1c compris.

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
#include <ISM330DL.h>

TwoWire internalI2C(I2C_INT_SDA, I2C_INT_SCL);  // bus I²C interne
ISM330DL imu(internalI2C);                      // le driver reçoit ce bus

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

La même règle vaut pour les bibliothèques tierces. Par exemple, le BME280 de la V1c se démarre avec `bme.begin(0x76, &internalI2C)`.

## Étapes suivantes

- [Capteurs et écran](./capteurs) : un programme minimal pour chaque composant.
- [Conventions de l'API](./conventions) : ce que les drivers ont en commun.
