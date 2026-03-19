---
sidebar_position: 15
title: "Ports E/S specifiques"
---

# Ports E/S specifiques

**Identifiant** : FP13

Ce port E/S specifique permet des connexions supplementaires via I2C, UART, SPI, GPIO analogiques et numeriques. La carte STeaMi supporte le connecteur edge micro:bit, STEMMA, Jacdac et des pads pour clips crocodile.

## Connecteur Edge (micro:bit compatible)

Le connecteur edge fournit un acces aux broches P0-P20 avec support pour :
- 6 entrees analogiques (P0-P4, P10)
- GPIO numeriques
- SPI (P13-P15)
- I2C (P19-P20)
- PWM (P7, P10, P11)

Voir la section [Pin Mapping](../pin-mapping/) pour le detail complet.

## Connecteur STEMMA/Qwiic

Deux connecteurs JST 4 broches (pas 2 mm) pour capteurs I2C externes.
- Bus I2C3 (SCL: PC0, SDA: PC1)

## Connecteur Jacdac

Interface serie pour la connexion de modules Jacdac.
- JACDAC_DATA (UART2_TX/RX) -> PB6/PB7
- JACDAC_P : alimentation 5V

## Pads crocodile

Pads accessibles avec des pinces crocodile autour de la carte :
- P0, P1, P2 : entrees analogiques
- P24, P25, P28, P29 : GPIO via expandeur MCP23009
- 3V3, GND : alimentation

## Bus SPI externe

| Signal | Pin STM32WB55 |
|--------|---------------|
| SPI2_SCK_EDGE (P13) | PB13 |
| SPI2_MISO_EDGE (P14) | PB14 |
| SPI2_MOSI_EDGE (P15) | PB15 |

## Bus UART serie

| Signal | Pin STM32WB55 |
|--------|---------------|
| SERIAL_TX (T_UART2_TX) | PB11 |
| SERIAL_RX (T_UART2_RX) | PB10 |
