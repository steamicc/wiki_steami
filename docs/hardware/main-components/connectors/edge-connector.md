---
sidebar_position: 1
title: 'Edge connector'
---

# Connecteur Edge (micro:bit compatible)

Le connecteur edge fournit un accès aux broches P0-P20, compatible avec l'écosystème micro:bit.

[![Brochage du connecteur edge de la STeaMi V1c, contacts de gauche à droite : P3, P0, P4 à P7, P1, P8 à P12, P2, P13 à P16, 3V3, P19, P20 et GND, avec la broche du STM32WB55 de chaque contact. Entrées analogiques sur P0 à P4 et P10, SPI2 sur P13 à P15, I2C3 sur P19 et P20, boutons A et B sur P5 et P11, anneaux pour pince crocodile sur P0, P1, P2, 3V3 et GND.](/img/diagrams/edge-connector.svg)](pathname:///img/diagrams/edge-connector.svg)

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

Ces deux broches ne sortent pas sur le connecteur edge : elles relient le STM32WB55 au STM32F103 (DAPLink). Le net `T_UART2` du schéma correspond au périphérique LPUART1 du STM32WB55, qui porte la console série (REPL MicroPython, `Serial` en Arduino), et à l'USART2 du STM32F103.

| Signal                 | Pin STM32WB55 |
| ---------------------- | ------------- |
| SERIAL_TX (T_UART2_TX) | PB11          |
| SERIAL_RX (T_UART2_RX) | PB10          |

## Voir aussi

- [Pin Mapping — Edge connector](../../pin-mapping/edge-connector)
- [Tous les connecteurs](./)
