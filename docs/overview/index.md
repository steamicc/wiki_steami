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
| FP0 | [Vue systeme](../hardware/system-overview) | Vue d'ensemble du systeme STEAM32 |
| FP1 | [Batterie](../hardware/battery) | Batterie LiPo, autonomie 1 jour (standard) / 5-10 jours (basse consommation) |
| FP2 | [Chargeur de batterie](../hardware/battery-charger) | Recharge via micro-USB, BQ24075 |
| FP3 | [Jauge de batterie](../hardware/battery-gauge) | Mesure de l'energie restante, BQ27441 (I2C) |
| FP4 | [Alimentation](../hardware/power-supply) | Convertisseur DC/DC, gestion des tensions |
| FP5 | [Microphone](../hardware/microphone) | Microphone PDM IMP34DT05 |
| FP6 | [Microcontroleur applicatif](../hardware/application-microcontroller) | STM32WB55RG, Bluetooth, basse consommation |
| FP7 | [Extension GPIO](../hardware/gpio-extension-port) | MCP23009, 8 GPIO supplementaires |
| FP8 | [Interface visuelle](../hardware/visual-interface) | Ecran OLED, LEDs RGB et status |
| FP9 | [Boutons de controle](../hardware/control-buttons) | Boutons directionnels, reset, menu |
| FP10 | [Sortie audio](../hardware/audio-output) | Buzzer SMT-0825-S-HT-R |
| FP11 | [Interface de programmation](../hardware/programming-debugging-interface) | Connecteur JTAG/SWD |
| FP12 | [Capteurs internes](../hardware/internal-sensor) | Distance, acceleration, gyroscope, magnetometre |
| FP13 | [Ports E/S specifiques](../hardware/specific-io-port) | Edge connector, STEMMA, Jacdac, clips crocodile |
| FP14 | [Microcontroleur interface](../hardware/interface-microcontroller) | STM32F103, DAPLink, USB, WebUSB |
| FP15 | [Memoire flash](../hardware/flash-memory) | Flash QSPI 64 Mbit, stockage de donnees |

## Liens utiles

- [Pinout de la carte](./pinout)
- [Pin Mapping](../pin-mapping/)
- [Composants (BOM)](../components/)
- [Exigences](../requirements/)
