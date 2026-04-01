---
sidebar_position: 1
title: 'Edge connector'
---

# Connecteur Edge (micro:bit compatible)

Le connecteur edge fournit un accès aux broches P0-P20, compatible avec l'écosystème micro:bit.

## Fonctionnalités

- 6 entrées analogiques (P0-P4, P10)
- GPIO numériques
- SPI (P13-P15)
- I2C (P19-P20)
- PWM (P7, P10, P11)

## Bus SPI externe

| Signal               | Pin STM32WB55 |
| -------------------- | ------------- |
| SPI2_SCK_EDGE (P13)  | PB13          |
| SPI2_MISO_EDGE (P14) | PB14          |
| SPI2_MOSI_EDGE (P15) | PB15          |

## Bus UART série

| Signal                 | Pin STM32WB55 |
| ---------------------- | ------------- |
| SERIAL_TX (T_UART2_TX) | PB11          |
| SERIAL_RX (T_UART2_RX) | PB10          |

## Voir aussi

- [Pin Mapping — Edge connector](../../pin-mapping/edge-connector)
- [Tous les connecteurs](./)
