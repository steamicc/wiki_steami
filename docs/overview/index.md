---
sidebar_position: 1
title: "Vue d'ensemble"
---

# Vue d'ensemble de la carte STeaMi

La carte **STeaMi** (STEAM32) est une plateforme de développement IoT polyvalente, équipée d'un riche ensemble de fonctionnalités telles que l'acquisition de données multi-capteurs, la communication sans fil et des interfaces faciles à utiliser (USB, WebUSB), ce qui la rend adaptée à la fois à l'éducation et au prototypage.

## Caractéristiques principales

- **Microcontrôleur applicatif** : STM32WB55RG (ARM Cortex-M4, 64 MHz, 1 Mo Flash, 256 Ko SRAM)
- **Microcontrôleur interface** : STM32F103CBT6 (DAPLink, USB, programmation)
- **Communication sans fil** : Bluetooth BLE 5.2, OpenThread, ZigBee
- **Écran** : OLED 128x128 pixels (Winstar WEO128128BWPP3N00001)
- **Capteurs internes** : distance (VL53L1X), accéléromètre/gyroscope (ISM330DLC), magnétomètre (LIS2MDL), pression (WSEN-PADS), humidité/température (WSEN-HIDS), luminosité/couleur/geste (APDS-9960), microphone PDM (IMP34DT05)
- **Alimentation** : batterie LiPo 3.7V 1600 mAh, chargeur USB (BQ24075), jauge de batterie (BQ27441)
- **Connectivité** : connecteur edge micro:bit, STEMMA/Qwiic (I2C), Jacdac, SPI, UART, GPIO
- **Stockage** : flash QSPI 64 Mbit (W25Q64)
- **Interface utilisateur** : 7 boutons (4 directions + A/B + Menu), LED RGB, buzzer

## Architecture du système

La carte STeaMi repose sur deux microcontrôleurs :

1. **STM32WB55RG** (microcontrôleur applicatif) : gère les capteurs, l'affichage, les communications sans fil et l'exécution du code utilisateur (MicroPython).
2. **STM32F103CBT6** (microcontrôleur interface) : gère la connexion USB, le DAPLink pour la programmation drag-and-drop, le WebUSB, la communication série et l'accès au stockage flash.

### Schéma bloc

![Schéma bloc STeaMi](/img/hardware/block-diagram.svg)

## Blocs fonctionnels

| Id   | Bloc fonctionnel                                    | Description                                                                  |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| FP1  | [Batterie](../design/power)                         | Batterie LiPo, autonomie 1 jour (standard) / 5-10 jours (basse consommation) |
| FP2  | [Chargeur de batterie](../design/power)             | Recharge via micro-USB, BQ24075                                              |
| FP3  | [Jauge de batterie](../design/power)                | Mesure de l'énergie restante, BQ27441 (I2C)                                  |
| FP4  | [Alimentation](../design/power)                     | Convertisseur DC/DC, gestion des tensions                                    |
| FP5  | [Microphone](../design/sensors)                     | Microphone PDM IMP34DT05                                                     |
| FP6  | [Microcontrôleur applicatif](../design/mcu-storage) | STM32WB55RG, Bluetooth, basse consommation                                   |
| FP7  | [Extension GPIO](../design/sensors)                 | MCP23009, 8 GPIO supplémentaires                                             |
| FP8  | [Interface visuelle](../design/user-interface)      | Écran OLED, LEDs RGB et status                                               |
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
