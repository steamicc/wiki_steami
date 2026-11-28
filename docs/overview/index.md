---
sidebar_position: 1
title: "Vue d'ensemble"
---

import DiagrammeCliquable from '@site/src/components/DiagrammeCliquable';

# Vue d'ensemble de la carte STeaMi

La carte **STeaMi** (STEAM32) est une plateforme de développement IoT polyvalente, équipée d'un riche ensemble de fonctionnalités telles que l'acquisition de données multi-capteurs, la communication sans fil et des interfaces faciles à utiliser (USB, WebUSB), ce qui la rend adaptée à la fois à l'éducation et au prototypage.

## Caractéristiques principales

La carte existe en trois releases, **V1a**, **V1b** et **V1c**, qui diffèrent par l'écran, les capteurs d'environnement et les connecteurs USB et I2C (voir [Révisions de la carte](../hardware/revisions)).

- **Microcontrôleur applicatif** : STM32WB55RG (ARM Cortex-M4, 64 MHz, 1 Mo Flash, 256 Ko SRAM)
- **Microcontrôleur interface** : STM32F103CBT6 (DAPLink, USB, programmation)
- **Communication sans fil** : Bluetooth BLE 5.2, OpenThread, ZigBee
- **Écran** : rond, OLED monochrome 128x128 pixels (Winstar WEO128128BWPP3N00001) sur la V1a et la V1b, TFT couleur 240x240 pixels (Winstar WF0128BTYAA4DNN0) sur la V1c
- **Capteurs internes** : distance (VL53L1X), accéléromètre/gyroscope (ISM330DLC), magnétomètre (LIS2MDL), microphone PDM (IMP34DT05) ; pression (WSEN-PADS), humidité/température (WSEN-HIDS) et luminosité/couleur/geste (APDS-9960) sur la V1a et la V1b ; pression, humidité et température (BME280) sur la V1c
- **Alimentation** : batterie LiPo 3.7V 1600 mAh, chargeur USB (BQ24075), jauge de batterie (BQ27441)
- **Connectivité** : connecteur edge micro:bit, 2 connecteurs I2C (JST PH sur la V1a et la V1b, Qwiic/STEMMA QT sur la V1c), Jacdac, SPI, UART, GPIO
- **USB** : micro-USB sur la V1a et la V1b, USB-C sur la V1c
- **Stockage** : flash QSPI 64 Mbit (W25Q64)
- **Interface utilisateur** : 7 boutons (4 directions + A/B + Menu), LED RGB, buzzer

## Architecture du système

La carte STeaMi repose sur deux microcontrôleurs :

1. **STM32WB55RG** (microcontrôleur applicatif) : gère les capteurs, l'affichage, les communications sans fil et l'exécution du code utilisateur (MicroPython).
2. **STM32F103CBT6** (microcontrôleur interface) : gère la connexion USB, le DAPLink pour la programmation drag-and-drop, le WebUSB, la communication série et l'accès au stockage flash.

### Schéma bloc

<DiagrammeCliquable src="/img/diagrams/architecture-v1c.svg" width={800} height={1232} alt="Schéma bloc de la STeaMi V1c : STM32WB55RG relié à l'écran GC9A01 en SPI1, aux LED, aux boutons, au buzzer, au micro IMP34DT05 et, par le bus I2C1, aux capteurs ISM330DLC, LIS2MDL, VL53L1X et BME280, à la jauge BQ27441 et à l'expandeur MCP23009 ; STM32F103 DAPLink relié à l'USB-C, à la flash W25Q64 et au port SWD J8 ; chaîne d'alimentation BQ24075, DIO7003, TPS63000, LD3985 et AP3015" />

Ce schéma bloc représente la V1c. Celui de la V1b, commun à la V1a, se trouve dans l'onglet correspondant de la page [Hardware](../hardware/#schéma-bloc) ; les différences entre releases sont détaillées dans [Révisions de la carte](../hardware/revisions).

## Blocs fonctionnels

| Id   | Bloc fonctionnel                                    | Description                                                                  |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| FP1  | [Batterie](../design/power)                         | Batterie LiPo, autonomie 1 jour (standard) / 5-10 jours (basse consommation) |
| FP2  | [Chargeur de batterie](../design/power)             | Recharge via USB, BQ24075                                                    |
| FP3  | [Jauge de batterie](../design/power)                | Mesure de l'énergie restante, BQ27441 (I2C)                                  |
| FP4  | [Alimentation](../design/power)                     | Convertisseur DC/DC, gestion des tensions                                    |
| FP5  | [Microphone](../design/sensors)                     | Microphone PDM IMP34DT05                                                     |
| FP6  | [Microcontrôleur applicatif](../design/mcu-storage) | STM32WB55RG, Bluetooth, basse consommation                                   |
| FP7  | [Extension GPIO](../design/sensors)                 | MCP23009, 8 GPIO supplémentaires                                             |
| FP8  | [Interface visuelle](../design/user-interface)      | Écran, LEDs RGB et status                                                    |
| FP9  | [Boutons de contrôle](../design/user-interface)     | Boutons directionnels, reset, menu                                           |
| FP10 | [Sortie audio](../design/user-interface)            | Buzzer SMT-0825-S-HT-R                                                       |
| FP11 | [Interface de programmation](../design/service-usb) | Connecteur JTAG/SWD                                                          |
| FP12 | [Capteurs internes](../design/sensors)              | Distance, accélération, gyroscope, magnétomètre                              |
| FP13 | [Ports E/S spécifiques](../design/sensors)          | Edge connector, STEMMA, Jacdac, clips crocodile                              |
| FP14 | [Microcontrôleur interface](../design/service-usb)  | STM32F103, DAPLink, USB, WebUSB                                              |
| FP15 | [Mémoire flash](../design/communication)            | Flash QSPI 64 Mbit, stockage de données                                      |

## Liens utiles

- [Pinout de la carte](./pinout)
- [Hardware](../hardware/)
- [Pin Mapping](../hardware/pin-mapping/)
- [Composants (BOM)](../hardware/components/)
- [Conception et exigences](../design/)
- [Schémas](https://github.com/steamicc/steami-reference-design)
