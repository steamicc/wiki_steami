---
title: Compatibilité par composant
sidebar_position: 7
---

# Compatibilité par composant

Matrice détaillée du support de chaque composant de la carte STeaMi selon le langage de programmation.

| Composant                             | MicroPython | CODAL | Arduino |
| ------------------------------------- | :---------: | :---: | :-----: |
| Accéléromètre (ISM330DL)              |     ✅      |  ✅   |   ✅    |
| Magnétomètre (LIS2MDL)                |     ✅      |  ✅   |   ✅    |
| Distance (VL53L1X)                    |     ✅      |  ✅   |   ✅    |
| Pression (WSEN-PADS, V1a et V1b)      |     ✅      |  🔶   |   ✅    |
| Humidité/Temp (WSEN-HIDS, V1a et V1b) |     ✅      |  🔶   |   ✅    |
| Lumière/Geste (APDS-9960, V1a et V1b) |     ✅      |  ✅   |   ✅    |
| Microphone (IMP34DT05)                |     🔶      |  ✅   |   ❌    |
| Écran OLED (SSD1327, V1a et V1b)      |     ✅      |  ✅   |   ✅    |
| Boutons (MCP23009)                    |     ✅      |  ✅   |   ✅    |
| Jauge batterie (BQ27441)              |     ✅      |  ❌   |   ✅    |
| Flash externe (DAPLink)               |     ✅      |  ❌   |   ❌    |
| Config persistante                    |     ✅      |  ❌   |   ❌    |
| GPIO de base                          |     ✅      |  ✅   |   ✅    |
| I2C / SPI / UART                      |     ✅      |  ✅   |   ✅    |
| Bluetooth BLE                         |     🔶      |  ✅   |   🔶    |

Les composants propres à la V1c, le capteur BME280 et l'écran TFT GC9A01, ne figurent pas encore dans ce tableau. En MicroPython, le driver [bme280](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bme280) est disponible et le driver gc9a01 est en cours de développement ([issue #10](https://github.com/steamicc/micropython-steami-lib/issues/10)). En Arduino, ils s'utilisent avec les bibliothèques Adafruit BME280 et GFX Library for Arduino, en attendant des drivers STeaMi (voir [Capteurs et écran](./arduino/capteurs)). Voir [Révisions](/docs/hardware/revisions).

✅ Complet · 🔶 Partiel · ❌ Non supporté

## Voir aussi

- [MicroPython](./micropython/) — Langage le plus complet (15 drivers)
- [CODAL](./codal/) — Runtime C++
- [Arduino](./arduino/) — Support partiel, en cours de développement
