---
title: Arduino
sidebar_position: 3
---

# Arduino

Arduino est l'un des environnements de développement les plus populaires pour les microcontrôleurs. La bibliothèque **arduino-steami-lib** fournit des drivers Arduino/C++ pour tous les capteurs et périphériques intégrés à la carte STeaMi.

## Drivers disponibles

| Driver          | Composant                                        | Avancé du driver | Exemples | Code sources                                                                                   |
| --------------- | ------------------------------------------------ | ---------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `apds9960`      | Capteur de lumière, couleur, proximité et gestes | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/apds9960/README.md)      |
| `bq27441`       | Jauge de batterie                                | ✅               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/bq27441/README.md)       |
| `daplink_flash` | Configuration et mémoire Flash                   | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/daplink_flash/README.md) |
| `hts221`        | Humidité et température                          | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/hts221/README.md)        |
| `ism330dl`      | Accéléromètre et gyroscope                       | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/ism330dl/README.md)      |
| `lis2mdl`       | Magnétomètre                                     | ✅               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/lis2mdl/README.md)       |
| `mcp23009e`     | Expandeur GPIO et boutons                        | ✅               | 5        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/mcp23009e/README.md)     |
| `ssd1327`       | Écran OLED 128×128                               | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/ssd1327/README.md)       |
| `steami_config` | Configuration persistante                        | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/steami_config/README.md) |
| `vl53l1x`       | Capteur de distance ToF                          | ✅               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/vl53l1x/README.md)       |
| `wsen-hids`     | Humidité et température                          | ✅               | 4        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/wsen-hids/README.md)     |
| `wsen-pads`     | Pression atmosphérique et température            | ❌               | 0        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/wsen-pads/README.md)     |
| `bme280`        | Pression, humidité et température _(à venir)_    | ❌               | —        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/bme280/README.md)        |
| `gc9a01`        | Écran LCD rond _(à venir)_                       | ❌               | —        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/gc9a01/README.md)        |
| `im34dt05`      | Microphone numérique _(à venir)_                 | ❌               | —        | [README](https://github.com/steamicc/arduino-steami-lib/blob/main/lib/im34dt05/README.md)      |

## Conventions de l'API

Tous les drivers suivent les mêmes conventions afin d'offrir une API cohérente d'un composant à l'autre.

Les principales méthodes sont :

- `begin()` : initialise le périphérique et vérifie sa présence.
- `deviceId()` : lit l'identifiant matériel (`WHO_AM_I`).
- `powerOn()` / `powerOff()` : active ou désactive le périphérique.
- `read()` : lit toutes les mesures disponibles.
- `temperature()`, `humidity()`, `pressureHpa()`, `distanceMm()`, etc. : lecture d'une mesure spécifique.
- `dataReady()` : indique si de nouvelles données sont disponibles.

Les noms des méthodes et leur comportement sont harmonisés avec la bibliothèque MicroPython afin de faciliter le passage d'un langage à l'autre.

**Voir les conventions détaillées →** `./conventions`

## Installation et outils

- **Installation** — Installer la bibliothèque Arduino STeaMi.
- **Arduino IDE** — Développer avec l'IDE Arduino.
- **PlatformIO** — Développer avec Visual Studio Code et PlatformIO.
- **Exemples** — Compiler et téléverser les exemples fournis.

## Sections à venir

La documentation sera progressivement complétée avec :

- Tutoriels par capteur
- Utilisation des bus I²C et SPI internes de la STeaMi
- Bluetooth Low Energy (BLE)
- Affichage graphique sur écran OLED
- Gestion de la mémoire Flash
- Développement de nouveaux drivers
- Tests et qualification

## Voir aussi

- Premiers pas
- Documentation de la carte STeaMi
- Dépôt GitHub `arduino-steami-lib`
- Documentation Arduino officielle
