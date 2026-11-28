---
title: CODAL et MakeCode (historique)
sidebar_label: CODAL (historique)
sidebar_position: 9
---

# CODAL et MakeCode (historique)

:::caution Page historique
CODAL et MakeCode ne sont plus suivis pour la carte STeaMi. Les environnements maintenus sont [MicroPython](../micropython/) et [Arduino](../arduino/). Cette page garde l'état du support CODAL tel qu'il a été relevé, sans mise à jour prévue.
:::

CODAL (Component Oriented Device Abstraction Layer) est le runtime C++ utilisé par la carte STeaMi, similaire à celui du micro:bit. L'éditeur MakeCode de la STeaMi compilait ses programmes avec CODAL.

## État du support

Le support CODAL est resté partiel : les principaux composants sont gérés, mais certains drivers n'ont jamais été écrits.

| Composant                                       | Supporté |
| ----------------------------------------------- | :------: |
| Accéléromètre (ISM330DL)                        |    ✅    |
| Magnétomètre (LIS2MDL)                          |    ✅    |
| Distance (VL53L1X)                              |    ✅    |
| Pression (WSEN-PADS, V1a et V1b)                |    🔶    |
| Humidité/Temp (WSEN-HIDS, V1a et V1b)           |    🔶    |
| Pression/Humidité/Temp (BME280, V1c)            |    ❌    |
| Lumière/Geste (APDS-9960, V1a et V1b)           |    ✅    |
| Microphone (IMP34DT05)                          |    ✅    |
| Écran OLED (SSD1327, V1a et V1b)                |    ✅    |
| Écran TFT couleur (GC9A01, V1c)                 |    ❌    |
| Boutons (MCP23009)                              |    ✅    |
| Jauge batterie (BQ27441)                        |    ❌    |
| Flash externe (DAPLink)                         |    ❌    |
| Config persistante                              |    ❌    |
| Détection de la release, même programme partout |    ❌    |
| GPIO de base                                    |    ✅    |
| I2C / SPI / UART                                |    ✅    |
| Bluetooth BLE                                   |    ✅    |

✅ Complet · 🔶 Partiel · ❌ Non supporté

Le dépôt [codal-stm32](https://github.com/letssteam/codal-stm32), utilisé par [codal-steami-samples](https://github.com/steamicc/codal-steami-samples), n'a pas de driver pour les deux composants propres à la V1c, le capteur BME280 et l'écran TFT GC9A01. Son dernier commit date d'octobre 2024. Sur la V1c, ces deux composants sont gérés en MicroPython et en Arduino : voir [Compatibilité par composant](../compatibility#composants-de-la-v1c) et [Révisions](/docs/hardware/revisions).

## Dépôts et sites

| Ressource                                                                | Contenu                                     | État                                |
| ------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------- |
| [codal-stm32](https://github.com/letssteam/codal-stm32)                  | Support CODAL du STM32                      | Dernier commit en octobre 2024      |
| [codal-steami-samples](https://github.com/steamicc/codal-steami-samples) | Exemples CODAL pour la carte STeaMi         | Plus maintenu, archivage prévu      |
| [makecode-steami](https://github.com/steamicc/makecode-steami)           | Éditeur MakeCode de la STeaMi (blocs et JS) | Plus maintenu, archivage prévu      |
| `makecode.steami.cc`                                                     | Éditeur MakeCode en ligne                   | Hors ligne : le site ne répond plus |

Les dépôts des exemples CODAL et de l'éditeur MakeCode ne sont plus maintenus et doivent être archivés sur GitHub. Une fois archivés, ils restent consultables en lecture seule, avec leur code et leur historique, mais ne reçoivent plus de modifications.

## Voir aussi

- [MicroPython](../micropython/) — Environnement maintenu, le plus complet
- [Arduino](../arduino/) — Environnement maintenu, en C++ avec l'Arduino IDE
- [Hardware](../../hardware/) — Description du matériel
