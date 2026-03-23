---
title: MicroPython
sidebar_position: 3
---

# MicroPython

MicroPython est le langage le mieux supporté sur la carte STeaMi, avec 15 drivers couvrant tous les capteurs et périphériques.

## Drivers disponibles

| Driver                                                                                          | Composant               | Exemples | Code source                                                                                        |
| ----------------------------------------------------------------------------------------------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| [ism330dl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl)           | Accéléromètre/Gyroscope | 3        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl/README.md)      |
| [lis2mdl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl)             | Magnétomètre            | 3        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl/README.md)       |
| [vl53l1x](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x)             | Distance ToF            | 1        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x/README.md)       |
| [wsen-pads](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads)         | Pression                | 5        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads/README.md)     |
| [wsen-hids](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids)         | Humidité/Température    | 3        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids/README.md)     |
| [apds9960](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/apds9960)           | Lumière/Geste           | 3        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/apds9960/README.md)      |
| [ssd1327](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327)             | Écran OLED              | 15       | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327/README.md)       |
| [mcp23009e](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e)         | Boutons/GPIO            | 9        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e/README.md)     |
| [bq27441](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bq27441)             | Jauge batterie          | 1        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bq27441/README.md)       |
| [daplink_flash](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash) | Flash/Config            | 6        | —                                                                                                  |
| [steami_config](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config) | Config persistante      | 2        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config/README.md) |
| [hts221](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/hts221)               | Humidité (ancien)       | 1        | [README](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/hts221/README.md)        |
| gc9a01                                                                                          | Écran rond              | 0        | —                                                                                                  |
| bme280                                                                                          | Pression (externe)      | 0        | —                                                                                                  |
| [im34dt05](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/im34dt05)           | Microphone PDM          | 0        | —                                                                                                  |

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
- [**mpremote**](./mpremote) — Outil en ligne de commande (recommandé)
- [**Thonny**](./thonny) — Éditeur graphique avec REPL intégré
- [**Vittascience**](./vittascience) — IDE en ligne avec programmation par blocs

## Sections à venir

- Tutoriels par composant (capteurs, écran, I/O, communication, stockage)
- Sujets avancés (limite RAM, timers, interruptions, low power)

## Voir aussi

- [Premiers pas](../getting-started) — Premier programme
- [DAPLink](../daplink) — Flash externe et config persistante
- [Code source](https://github.com/steamicc/micropython-steami-lib) — Tous les drivers
