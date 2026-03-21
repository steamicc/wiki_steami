---
sidebar_position: 1
title: "Vue d'ensemble"
---

# Vue d'ensemble de la carte STeaMi

La carte **STeaMi** (STEAM32) est une plateforme de developpement IoT polyvalente, equipee d'un riche ensemble de fonctionnalites telles que l'acquisition de donnees multi-capteurs, la communication sans fil et des interfaces faciles a utiliser (USB, WebUSB), ce qui la rend adaptee a la fois a l'education et au prototypage.

## Caracteristiques principales

- **Microcontroleur applicatif** : STM32WB55RG (ARM Cortex-M4, 64 MHz, 1 Mo Flash, 256 Ko SRAM)
- **Microcontroleur interface** : STM32F103CBT6 (DAPLink, USB, programmation)
- **Communication sans fil** : Bluetooth BLE 5.2, OpenThread, ZigBee
- **Ecran** : OLED 128x128 pixels (Winstar WEO128128BWPP3N00001)
- **Capteurs internes** : distance (VL53L1X), accelerometre/gyroscope (ISM330DLC), magnetometre (LIS2MDL), pression (WSEN-PADS), humidite/temperature (WSEN-HIDS), luminosite/couleur/geste (APDS-9960), microphone PDM (IMP34DT05)
- **Alimentation** : batterie LiPo 3.7V 1600 mAh, chargeur USB (BQ24075), jauge de batterie (BQ27441)
- **Connectivite** : connecteur edge micro:bit, STEMMA/Qwiic (I2C), Jacdac, SPI, UART, GPIO
- **Stockage** : flash QSPI 64 Mbit (W25Q64)
- **Interface utilisateur** : 7 boutons (4 directions + A/B + Menu), LED RGB, buzzer

## Architecture du systeme

La carte STeaMi repose sur deux microcontroleurs :

1. **STM32WB55RG** (microcontroleur applicatif) : gere les capteurs, l'affichage, les communications sans fil et l'execution du code utilisateur (MicroPython).
2. **STM32F103CBT6** (microcontroleur interface) : gere la connexion USB, le DAPLink pour la programmation drag-and-drop, le WebUSB, la communication serie et l'acces au stockage flash.

## Blocs fonctionnels

| Id | Bloc fonctionnel | Description |
|----|-------------------|-------------|
| FP1 | [Batterie](../design/power) | Batterie LiPo, autonomie 1 jour (standard) / 5-10 jours (basse consommation) |
| FP2 | [Chargeur de batterie](../design/power) | Recharge via micro-USB, BQ24075 |
| FP3 | [Jauge de batterie](../design/power) | Mesure de l'energie restante, BQ27441 (I2C) |
| FP4 | [Alimentation](../design/power) | Convertisseur DC/DC, gestion des tensions |
| FP5 | [Microphone](../design/sensors) | Microphone PDM IMP34DT05 |
| FP6 | [Microcontroleur applicatif](../design/mcu-storage) | STM32WB55RG, Bluetooth, basse consommation |
| FP7 | [Extension GPIO](../design/sensors) | MCP23009, 8 GPIO supplementaires |
| FP8 | [Interface visuelle](../design/user-interface) | Ecran OLED, LEDs RGB et status |
| FP9 | [Boutons de controle](../design/user-interface) | Boutons directionnels, reset, menu |
| FP10 | [Sortie audio](../design/user-interface) | Buzzer SMT-0825-S-HT-R |
| FP11 | [Interface de programmation](../design/service-usb) | Connecteur JTAG/SWD |
| FP12 | [Capteurs internes](../design/sensors) | Distance, acceleration, gyroscope, magnetometre |
| FP13 | [Ports E/S specifiques](../design/sensors) | Edge connector, STEMMA, Jacdac, clips crocodile |
| FP14 | [Microcontroleur interface](../design/service-usb) | STM32F103, DAPLink, USB, WebUSB |
| FP15 | [Memoire flash](../design/communication) | Flash QSPI 64 Mbit, stockage de donnees |

## Liens utiles

- [Pinout de la carte](./pinout)
- [Hardware](../hardware/)
- [Pin Mapping](../pin-mapping/)
- [Composants (BOM)](../components/)
- [Conception et exigences](../design/)
- [Schemas](https://github.com/steamicc/steami-reference-design)
