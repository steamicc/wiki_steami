---
title: CODAL
sidebar_position: 4
---

# CODAL

CODAL (Component Oriented Device Abstraction Layer) est le runtime C++ utilisé par la carte STeaMi, similaire à celui du micro:bit.

## État du support

Le support CODAL est partiel. Les principaux composants sont supportés mais certains drivers ne sont pas encore implémentés.

| Composant                             | Supporté |
| ------------------------------------- | :------: |
| Accéléromètre (ISM330DL)              |    ✅    |
| Magnétomètre (LIS2MDL)                |    ✅    |
| Distance (VL53L1X)                    |    ✅    |
| Lumière/Geste (APDS-9960, V1a et V1b) |    ✅    |
| Écran OLED (SSD1327, V1a et V1b)      |    ✅    |
| Boutons (MCP23009)                    |    ✅    |
| Pression (WSEN-PADS, V1a et V1b)      |    🔶    |
| Humidité/Temp (WSEN-HIDS, V1a et V1b) |    🔶    |
| Microphone (IMP34DT05)                |    ✅    |
| Jauge batterie (BQ27441)              |    ❌    |
| Flash (DAPLink)                       |    ❌    |
| Config persistante                    |    ❌    |

Les composants propres à la V1c, le capteur BME280 et l'écran TFT GC9A01, ne figurent pas encore dans ce tableau. En MicroPython, le driver [bme280](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bme280) est disponible et l'écran GC9A01 est géré depuis la v0.30.0 du firmware, par le driver [gc9a01](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/gc9a01) et par `steami.Screen` ([steami_screen](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen)), qui dessine le même programme sur l'écran de chaque release. Voir [Révisions](/docs/hardware/revisions).

## À venir

- Exemples d'utilisation
- Guide d'installation
- API reference

## Voir aussi

- [MicroPython](../micropython/) — Alternative avec support complet
- [Hardware](../../hardware/) — Description du matériel
