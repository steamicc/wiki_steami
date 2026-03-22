---
title: Compatibilité par composant
sidebar_position: 7
---

# Compatibilité par composant

Matrice détaillée du support de chaque composant de la carte STeaMi selon le langage de programmation.

| Composant                 | MicroPython | CODAL | Arduino |
| ------------------------- | :---------: | :---: | :-----: |
| Accéléromètre (ISM330DL)  |     ✅      |  ✅   |   ❌    |
| Magnétomètre (LIS2MDL)    |     ✅      |  ✅   |   ❌    |
| Distance (VL53L1X)        |     ✅      |  ✅   |   ❌    |
| Pression (WSEN-PADS)      |     ✅      |  🔶   |   ❌    |
| Humidité/Temp (WSEN-HIDS) |     ✅      |  🔶   |   ❌    |
| Lumière/Geste (APDS-9960) |     ✅      |  ✅   |   ❌    |
| Microphone (IMP34DT05)    |     🔶      |  ✅   |   ❌    |
| Écran OLED (SSD1327)      |     ✅      |  ✅   |   ❌    |
| Boutons (MCP23009)        |     ✅      |  ✅   |   ❌    |
| Jauge batterie (BQ27441)  |     ✅      |  ❌   |   ❌    |
| Flash externe (DAPLink)   |     ✅      |  ❌   |   ❌    |
| Config persistante        |     ✅      |  ❌   |   ❌    |
| GPIO de base              |     ✅      |  ✅   |   ✅    |
| I2C / SPI / UART          |     ✅      |  ✅   |   ✅    |
| Bluetooth BLE             |     🔶      |  ✅   |   ❌    |

✅ Complet · 🔶 Partiel · ❌ Non supporté

## Voir aussi

- [MicroPython](./micropython/) — Langage le plus complet (15 drivers)
- [CODAL](./codal/) — Runtime C++
- [Arduino](./arduino/) — Support de base
