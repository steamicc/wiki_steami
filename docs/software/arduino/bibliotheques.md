---
title: Bibliothèques STeaMi
sidebar_position: 3
---

# Bibliothèques STeaMi

Les capteurs, le D-PAD, la jauge de batterie et l'écran de la carte demandent un driver. Les drivers STeaMi sont développés dans le dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) : un dossier par composant, chacun étant une bibliothèque Arduino avec ses exemples.

:::info Installation provisoire
Les drivers STeaMi ne sont pas encore publiés dans le gestionnaire de bibliothèques de l'Arduino IDE. Un package unique « STeaMi » est prévu ([suivi](https://github.com/steamicc/arduino-steami-lib/issues/221)). En attendant, l'installation se fait par copie de dossiers, comme décrit ci-dessous.
:::

## Installer les drivers STeaMi

1. Télécharger la dernière version du dépôt : sur la page [Releases](https://github.com/steamicc/arduino-steami-lib/releases/latest), cliquer sur **Source code (zip)**.
2. Décompresser l'archive. Les drivers se trouvent dans son dossier `lib/`.
3. Repérer le dossier des bibliothèques de l'Arduino IDE : c'est le sous-dossier `libraries` du **carnet de croquis**, dont l'emplacement est indiqué dans **Fichier → Préférences**. Par défaut :
   - Windows et macOS : `Documents/Arduino/libraries` ;
   - Linux : `~/Arduino/libraries`.

   Créer le dossier `libraries` s'il n'existe pas.

4. Copier dans ce dossier les drivers utiles, par exemple `lib/ism330dl` et `lib/lis2mdl`. Copier le dossier entier, pas seulement son contenu.
5. Redémarrer l'Arduino IDE.

Les exemples de chaque driver apparaissent alors dans **Fichier → Exemples**, sous le nom de la bibliothèque (par exemple **STeaMi ISM330DL**).

Seuls les drivers du tableau suivant sont utilisables. Les dossiers `bme280`, `gc9a01`, `im34dt05`, `daplink_flash` et `steami_config` du dépôt sont encore vides.

| Dossier à copier | `#include`      | Composant                             | Releases      |
| ---------------- | --------------- | ------------------------------------- | ------------- |
| `ism330dl`       | `<ISM330DL.h>`  | accéléromètre et gyroscope            | V1a, V1b, V1c |
| `lis2mdl`        | `<LIS2MDL.h>`   | magnétomètre (boussole)               | V1a, V1b, V1c |
| `vl53l1x`        | `<VL53L1X.h>`   | capteur de distance (temps de vol)    | V1a, V1b, V1c |
| `mcp23009e`      | `<MCP23009E.h>` | D-PAD (boutons directionnels)         | V1a, V1b, V1c |
| `bq27441`        | `<BQ27441.h>`   | jauge de batterie                     | V1a, V1b, V1c |
| `wsen-pads`      | `<WSEN_PADS.h>` | pression et température               | V1a, V1b      |
| `wsen-hids`      | `<WsenHids.h>`  | humidité et température               | V1a, V1b      |
| `apds9960`       | `<APDS9960.h>`  | lumière, couleur, proximité et gestes | V1a, V1b      |
| `ssd1327`        | `<SSD1327.h>`   | écran OLED 128 × 128                  | V1a, V1b      |

Le dossier `hts221` est un driver historique : le capteur HTS221 n'est monté sur aucune carte STeaMi. Le WSEN-HIDS de la carte est compatible avec lui, mais il faut utiliser son propre driver, `wsen-hids`, qui corrige le démarrage et la mesure ponctuelle.

## Bibliothèques tierces

Certaines fonctions s'appuient sur des bibliothèques existantes, à installer depuis le **gestionnaire de bibliothèques** de l'Arduino IDE (icône de livres dans la barre latérale) :

| Bibliothèque à rechercher   | Utilisation                                | Releases |
| --------------------------- | ------------------------------------------ | -------- |
| **Adafruit BME280 Library** | pression, humidité et température (BME280) | V1c      |
| **GFX Library for Arduino** | écran TFT rond couleur (GC9A01)            | V1c      |
| **STM32duinoBLE**           | Bluetooth Low Energy                       | toutes   |

Accepter l'installation des dépendances proposée par l'IDE.

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
