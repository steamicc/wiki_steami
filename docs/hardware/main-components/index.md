---
sidebar_position: 3
title: 'Composants principaux'
---

# Composants principaux

Les composants actifs de la carte STeaMi, regroupes par fonction. Chaque composant dispose d'une page detaillee avec specifications completes, pinout, liens datasheets et drivers.

Pour la BOM complete (incluant passifs, connecteurs, etc.), voir la section [BOM](../components/).

## Microcontroleurs

| Composant                    | Description                                                           | Page detaillee          |
| ---------------------------- | --------------------------------------------------------------------- | ----------------------- |
| [STM32WB55RG](./stm32wb55)   | MCU applicatif — Cortex-M4 @ 64 MHz, 1 Mo Flash, 256 Ko SRAM, BLE 5.2 | [Detail →](./stm32wb55) |
| [STM32F103CBT6](./stm32f103) | MCU interface — Cortex-M3 @ 72 MHz, 128 Ko Flash, DAPLink             | [Detail →](./stm32f103) |

## Capteurs

7 capteurs internes sur le bus I2C1. [Detail de chaque capteur →](./sensors)

| Composant      | Fonction                                     | Fabricant          |
| -------------- | -------------------------------------------- | ------------------ |
| ISM330DLCTR    | Accelerometre/gyroscope 6 axes + temperature | STMicroelectronics |
| VL53L1CXV0FY/1 | Distance Time-of-Flight, portee 4 m          | STMicroelectronics |
| LIS2MDLTR      | Magnetometre 3 axes                          | STMicroelectronics |
| WSEN-PADS      | Pression absolu 26-126 kPa, 24 bits          | Wurth Elektronik   |
| WSEN-HIDS      | Humidite + temperature                       | Wurth Elektronik   |
| APDS-9960      | Lumiere ambiante, couleur, geste, proximite  | Broadcom           |
| IMP34DT05      | Microphone MEMS PDM omnidirectionnel         | STMicroelectronics |

## Interface utilisateur

| Composant                         | Fonction                                                        | Page detaillee              |
| --------------------------------- | --------------------------------------------------------------- | --------------------------- |
| WEO128128BWPP3N00001              | [Ecran OLED](./display) 128x128 blanc, SPI                      | [Detail →](./display)       |
| Wurth 150505M173300 + LEDs status | [LEDs](./leds) RGB utilisateur + indicateurs systeme            | [Detail →](./leds)          |
| ALPS SKRHABE010 + C&K PTS636      | [Boutons et buzzer](./buttons-audio) — 7 boutons + buzzer piezo | [Detail →](./buttons-audio) |

## Alimentation

[Detail complet de la chaine d'alimentation →](./power)

| Composant       | Fonction                                 | Fabricant          |
| --------------- | ---------------------------------------- | ------------------ |
| BQ24075RGT      | Chargeur batterie Li-Ion 1.5A, PowerPath | Texas Instruments  |
| BQ27441DRZR-G1A | Jauge de batterie Li-Ion, I2C            | Texas Instruments  |
| TPS63000DRCT    | Convertisseur buck-boost 3.3V @ 1.2A     | Texas Instruments  |
| LMR62421XMF     | Boost 14.5V (buzzer + ecran)             | Texas Instruments  |
| LD3985M33R      | LDO 3.3V 150 mA                          | STMicroelectronics |

## Autres

| Composant                   | Fonction                                        | Page detaillee                                     |
| --------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| [W25Q64JVZPIM](./w25q64)    | Flash NOR 64 Mbit, SPI/QSPI                     | [Detail →](./w25q64)                               |
| MCP23009-E/MG               | Expandeur GPIO 8 bits, I2C                      | Inclus dans [Boutons et buzzer →](./buttons-audio) |
| [Connecteurs](./connectors) | Edge, STEMMA/Qwiic, Jacdac, SWD, pads crocodile | [Detail →](./connectors)                           |

## Voir aussi

- [BOM complete](../components/) — Tous les composants incluant passifs, connecteurs, mecaniques
- [Vue d'ensemble du materiel](../) — Description resumee de chaque sous-systeme
- [Conception](../../design/) — Justification des choix de composants
