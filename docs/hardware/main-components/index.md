---
sidebar_position: 3
title: 'Composants principaux'
---

# Composants principaux

Les composants actifs de la carte STeaMi, regroupés par fonction. Chaque composant dispose d'une page détaillée avec spécifications complètes, pinout, liens datasheets et drivers.

Pour la BOM complète (incluant passifs, connecteurs, etc.), voir la section [BOM](../components/).

## Microcontrôleurs

| Composant                    | Description                                                           | Page détaillée          |
| ---------------------------- | --------------------------------------------------------------------- | ----------------------- |
| [STM32WB55RG](./stm32wb55)   | MCU applicatif — Cortex-M4 @ 64 MHz, 1 Mo Flash, 256 Ko SRAM, BLE 5.2 | [Détail →](./stm32wb55) |
| [STM32F103CBT6](./stm32f103) | MCU interface — Cortex-M3 @ 72 MHz, 128 Ko Flash, DAPLink             | [Détail →](./stm32f103) |

## Capteurs

7 capteurs internes sur le bus I2C1. [Détail de chaque capteur →](./sensors)

| Composant      | Fonction                                     | Fabricant          |
| -------------- | -------------------------------------------- | ------------------ |
| ISM330DLCTR    | Accéléromètre/gyroscope 6 axes + température | STMicroelectronics |
| VL53L1CXV0FY/1 | Distance Time-of-Flight, portée 4 m          | STMicroelectronics |
| LIS2MDLTR      | Magnétomètre 3 axes                          | STMicroelectronics |
| WSEN-PADS      | Pression absolu 26-126 kPa, 24 bits          | Wurth Elektronik   |
| WSEN-HIDS      | Humidité + température                       | Wurth Elektronik   |
| APDS-9960      | Lumière ambiante, couleur, geste, proximité  | Broadcom           |
| IMP34DT05      | Microphone MEMS PDM omnidirectionnel         | STMicroelectronics |

## Interface utilisateur

| Composant                         | Fonction                                                        | Page détaillée              |
| --------------------------------- | --------------------------------------------------------------- | --------------------------- |
| WEO128128BWPP3N00001              | [Écran OLED](./display) 128x128 blanc, SPI                      | [Détail →](./display)       |
| Wurth 150505M173300 + LEDs status | [LEDs](./leds) RGB utilisateur + indicateurs système            | [Détail →](./leds)          |
| ALPS SKRHABE010 + C&K PTS636      | [Boutons et buzzer](./buttons-audio) — 7 boutons + buzzer piezo | [Détail →](./buttons-audio) |

## Alimentation

[Détail complet de la chaîne d'alimentation →](./power)

| Composant       | Fonction                                 | Fabricant          |
| --------------- | ---------------------------------------- | ------------------ |
| BQ24075RGT      | Chargeur batterie Li-Ion 1.5A, PowerPath | Texas Instruments  |
| BQ27441DRZR-G1A | Jauge de batterie Li-Ion, I2C            | Texas Instruments  |
| TPS63000DRCT    | Convertisseur buck-boost 3.3V @ 1.2A     | Texas Instruments  |
| LMR62421XMF     | Boost 14.5V (buzzer + écran)             | Texas Instruments  |
| LD3985M33R      | LDO 3.3V 150 mA                          | STMicroelectronics |

## Autres

| Composant                   | Fonction                                        | Page détaillée                                     |
| --------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| [W25Q64JVZPIM](./w25q64)    | Flash NOR 64 Mbit, SPI/QSPI                     | [Détail →](./w25q64)                               |
| MCP23009-E/MG               | Expandeur GPIO 8 bits, I2C                      | Inclus dans [Boutons et buzzer →](./buttons-audio) |
| [Connecteurs](./connectors) | Edge, STEMMA/Qwiic, Jacdac, SWD, pads crocodile | [Détail →](./connectors)                           |

## Voir aussi

- [BOM complète](../components/) — Tous les composants incluant passifs, connecteurs, mécaniques
- [Vue d'ensemble du matériel](../) — Description résumée de chaque sous-système
- [Conception](../../design/) — Justification des choix de composants
