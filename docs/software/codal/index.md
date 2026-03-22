---
title: CODAL
sidebar_position: 4
---

# CODAL

CODAL (Component Oriented Device Abstraction Layer) est le runtime C++ utilisé par la carte STeaMi, similaire à celui du micro:bit.

## État du support

Le support CODAL est partiel. Les principaux composants sont supportés mais certains drivers ne sont pas encore implémentés.

| Composant                 | Supporté |
| ------------------------- | :------: |
| Accéléromètre (ISM330DL)  |    ✅    |
| Magnétomètre (LIS2MDL)    |    ✅    |
| Distance (VL53L1X)        |    ✅    |
| Lumière/Geste (APDS-9960) |    ✅    |
| Écran OLED (SSD1327)      |    ✅    |
| Boutons (MCP23009)        |    ✅    |
| Pression (WSEN-PADS)      |    🔶    |
| Humidité/Temp (WSEN-HIDS) |    🔶    |
| Microphone (IMP34DT05)    |    ✅    |
| Jauge batterie (BQ27441)  |    ❌    |
| Flash (DAPLink)           |    ❌    |
| Config persistante        |    ❌    |

## À venir

- Exemples d'utilisation
- Guide d'installation
- API reference

## Voir aussi

- [MicroPython](../micropython/) — Alternative avec support complet
- [Hardware](../../hardware/) — Description du matériel
