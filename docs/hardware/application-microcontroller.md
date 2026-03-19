---
sidebar_position: 8
title: "Microcontroleur applicatif"
---

# Microcontroleur applicatif

**Identifiant** : FP6

Le microcontroleur STM32WB55RG de STMicroelectronics gere les communications, le traitement et les fonctions de controle de la carte. Il supporte les modes basse consommation et la communication Bluetooth pour les interactions sans fil.

## Caracteristiques

- **Composant** : STMicroelectronics STM32WB55RG
- **Coeur** : ARM Cortex-M4 @ 64 MHz
- **Memoire Flash** : 1 Mo
- **RAM** : 256 Ko SRAM
- **Communication sans fil** : Bluetooth BLE 5.2, OpenThread, ZigBee
- **Antenne** : Antenne interne integree
- **Filtre RF** : MLPF-WB55-01E3 (passe-bas 2.45 GHz)
- **Horloge** : Quartz 32 MHz + Quartz 32 KHz (RTC)
- **Boitier** : VFQFPN68

## Bus et peripheriques

- **I2C1** (interne) : capteurs, jauge batterie
- **I2C3** (externe) : connecteur edge, STEMMA/Qwiic
- **SPI1** (interne) : ecran OLED
- **SPI2** (externe) : connecteur edge
- **UART** : communication serie avec le microcontroleur interface
