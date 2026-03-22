---
sidebar_position: 2
title: 'Pin Mapping'
---

# Pin Mapping

Cette section presente le mapping complet des broches de la carte STeaMi. Les broches sont regroupees par fonction pour faciliter la consultation.

## Sommaire

- [Broches Edge Connector (P0-P20)](./edge-connector) - GPIO, analogiques, SPI, I2C
- [Boutons](./buttons) - Boutons directionnels, A/B, Menu
- [LEDs](./leds) - LEDs utilisateur et systeme
- [Capteurs et bus internes](./internal-bus) - I2C, SPI, signaux internes
- [Connecteurs externes](./external-connectors) - STEMMA, Jacdac, JTAG
- [Alimentation](./power-pins) - 3V3, GND, pads crocodile
- [Signaux](./signals) - Table complete des signaux
- [Points de test](./test-points) - Points de test sur le PCB

## Vue d'ensemble rapide

La carte STeaMi expose ses broches via plusieurs interfaces :

| Interface                  | Broches                           | Bus                      |
| -------------------------- | --------------------------------- | ------------------------ |
| Edge Connector (micro:bit) | P0-P20, 3V3, GND                  | GPIO, Analog, SPI2, I2C3 |
| Pads crocodile             | P0-P2, P24-P25, P28-P29, 3V3, GND | GPIO, Analog             |
| STEMMA/Qwiic (x2)          | SDA, SCL, 3V3, GND                | I2C3                     |
| Jacdac                     | DATA, PWR, GND                    | UART2                    |
| JTAG                       | SWDIO, SWCLK, NRST, VREF, GND     | SWD                      |

## Microcontroleurs

La carte utilise deux microcontroleurs :

- **STM32WB55RG** : microcontroleur applicatif (broches PA*, PB*, PC*, PD*, PE*, PH*)
- **STM32F103CBT6** : microcontroleur interface (broches PA*, PB*) - gere USB, DAPLink, flash
