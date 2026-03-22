---
title: Software
sidebar_position: 1
---

# Software

La carte STeaMi est programmable en plusieurs langages. Cette section documente les environnements de développement, les drivers et les exemples d'utilisation pour chaque composant de la carte.

## Langages supportés

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
| Flash (DAPLink)           |     ✅      |  ❌   |   ❌    |
| Config persistante        |     ✅      |  ❌   |   ❌    |

✅ Complet · 🔶 Partiel · ❌ Non supporté

## Par langage

- [**Getting Started**](./getting-started) — Connecter la carte, installer mpremote, premier programme
- [**MicroPython**](./micropython/) — Installation firmware, drivers, tutoriels, API
- [**CODAL**](./codal/) — Runtime C++, état du support
- [**Arduino**](./arduino/) — STM32duino, état du support
- [**DAPLink**](./daplink) — Firmware interface, protocole I2C, commandes

## Ressources

- [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) — Drivers MicroPython (15 drivers, 52 exemples)
- [DAPLink](https://github.com/steamicc/DAPLink) — Firmware du STM32F103 (branche `release_letssteam`)
- [MicroPython](https://docs.micropython.org/en/latest/) — Documentation officielle MicroPython
- [stm32python.gitlab.io](https://stm32python.gitlab.io/fr/) — Tutoriels STM32 + MicroPython
