---
title: MicroPython
sidebar_position: 3
---

# MicroPython

MicroPython est le langage le mieux supporté sur la carte STeaMi, avec 17 drivers couvrant tous les capteurs et périphériques.

## Drivers disponibles

| Driver                                                                                            | Composant                                                           | Exemples | Code source                                                                                         |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| [ism330dl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl)             | Accéléromètre/Gyroscope                                             | 6        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/ism330dl/README.md)       |
| [lis2mdl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl)               | Magnétomètre                                                        | 11       | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/lis2mdl/README.md)        |
| [vl53l1x](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x)               | Distance ToF                                                        | 3        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/vl53l1x/README.md)        |
| [wsen-pads](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads)           | Pression (V1a, V1b)                                                 | 11       | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/wsen-pads/README.md)      |
| [wsen-hids](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids)           | Humidité/Température (V1a, V1b)                                     | 8        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/wsen-hids/README.md)      |
| [apds9960](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/apds9960)             | Lumière/Geste (V1a, V1b)                                            | 5        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/apds9960/README.md)       |
| [ssd1327](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327)               | Écran OLED (V1a, V1b)                                               | 16       | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/ssd1327/README.md)        |
| [mcp23009e](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e)           | Boutons/GPIO                                                        | 11       | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/mcp23009e/README.md)      |
| [bq27441](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bq27441)               | Jauge batterie                                                      | 2        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/bq27441/README.md)        |
| [daplink_bridge](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_bridge) | Pont I2C du DAPLink (config zone)                                   | 0        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_bridge/README.md) |
| [daplink_flash](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash)   | Fichier sur le disque USB (flash externe)                           | 6        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/README.md)  |
| [steami_config](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config)   | Config persistante                                                  | 6        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/README.md)  |
| [gc9a01](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/gc9a01)                 | Écran rond TFT (V1c), depuis la v0.30.0                             | 1        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/gc9a01/README.md)         |
| [steami_screen](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen)   | Écran, même programme sur V1a, V1b et V1c (`steami.Screen`)         | 8        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/README.md)  |
| [bme280](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bme280)                 | Pression/Humidité/Température (V1c)                                 | 2        | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/bme280/README.md)         |
| [im34dt05](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/im34dt05)             | Microphone PDM                                                      | 0        | —                                                                                                   |
| [steami](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami)                 | Carte : détection de la release, fonctions communes (V1a, V1b, V1c) | 14       | [README](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/README.md)         |

## Conventions API des drivers

Tous les drivers suivent des [**conventions standardisées**](./conventions) (issues [#56 à #82](https://github.com/steamicc/micropython-steami-lib/issues?q=is%3Aissue+is%3Aclosed+label%3Arefactoring)) :

- **Initialisation** : `sensor = Driver(i2c)` avec `i2c = I2C(1)`
- **Méthodes** : `device_id()`, `power_on()`, `power_off()`, `read()`, `data_ready()`
- **Mesures** : `temperature()`, `pressure_hpa()`, `acceleration_g()`, `<mesure>_raw()`
- **Réveil automatique** : si le capteur est en power-down, le driver déclenche une mesure one-shot à la lecture
- **Calibration** : `set_temp_offset()`, `calibrate_temperature()` (deux points)

[**Voir les conventions détaillées →**](./conventions)

## Installation et outils

- [**Installation du firmware**](./install) — Flasher MicroPython sur la carte STeaMi
- [**Essayer sur la carte**](./essayer) — Lancer un programme du wiki sur la carte depuis la page, sans rien installer
- [**mpremote**](./mpremote) — Outil en ligne de commande (recommandé)
- [**Thonny**](./thonny) — Éditeur graphique avec REPL intégré
- [**Vittascience**](./vittascience) — IDE en ligne avec programmation par blocs

## Sections à venir

- Tutoriels par composant (capteurs, écran, I/O, communication, stockage)
- Sujets avancés (limite RAM, timers, interruptions, low power)

## Voir aussi

- [Premiers pas](../getting-started) — Premier programme
- [DAPLink](../daplink) — Flash externe et config persistante
- [Stockage](./stockage) — Fichiers de la carte, fichier du disque USB, zone de configuration et calibrations
- [Code source](https://github.com/steamicc/micropython-steami-lib) — Tous les drivers
