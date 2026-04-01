---
sidebar_position: 2
title: 'Edge Connector'
---

# Broches Edge Connector (P0-P20)

Le connecteur edge de la carte STeaMi est compatible avec le format micro:bit. Il expose les broches P0 à P20 ainsi que les alimentations.

## Broches analogiques et GPIO

Ces broches peuvent être utilisées comme entrées analogiques ou GPIO numériques.

| Pin | Fonctions         | Signal        | Pin STM32WB55 | Croc |
| --- | ----------------- | ------------- | ------------- | ---- |
| P0  | Analog, GPIO      | ANALOG02_EDGE | PC4           | Oui  |
| P1  | Analog, GPIO      | ANALOG04_EDGE | PA5           | Oui  |
| P2  | Analog, GPIO      | ANALOG06_EDGE | PC5           | Oui  |
| P3  | Analog, GPIO      | ANALOG01_EDGE | PA2           | Non  |
| P4  | Analog, GPIO      | ANALOG03_EDGE | PA4           | Non  |
| P10 | Analog, GPIO, PWM | ANALOG05_EDGE | PA6           | Non  |

## Broches GPIO numériques

| Pin | Fonctions | Signal              | Pin STM32WB55 | Notes                    |
| --- | --------- | ------------------- | ------------- | ------------------------ |
| P5  | GPIO      | GPIO1_EDGE_BOUTON_A | PA7           | Partagé avec bouton A    |
| P6  | GPIO      | GPIO2_EDGE          | PC3           | -                        |
| P7  | GPIO, PWM | GPIO3_EDGE          | PA9           | Support PWM              |
| P8  | GPIO      | GPIO4_EDGE          | PA15          | -                        |
| P9  | GPIO      | GPIO5_EDGE          | PC2           | -                        |
| P11 | GPIO, PWM | GPIO6_EDGE_BOUTON_B | PA8           | Partagé avec bouton B    |
| P12 | GPIO      | GPIO7_EDGE          | PC6           | -                        |
| P16 | GPIO      | GPIO8_EDGE          | PE4           | Via expandeur (PCB: P16) |

## Broches SPI (SPI2)

| Pin | Fonctions | Signal         | Pin STM32WB55 |
| --- | --------- | -------------- | ------------- |
| P13 | GPIO, SPI | SPI2_SCK_EDGE  | PB13          |
| P14 | GPIO, SPI | SPI2_MISO_EDGE | PB14          |
| P15 | GPIO, SPI | SPI2_MOSI_EDGE | PB15          |

## Broches I2C (I2C3)

| Pin | Fonctions | Signal        | Pin STM32WB55 |
| --- | --------- | ------------- | ------------- |
| P19 | GPIO, I2C | I2C3_SCL_EDGE | PC0           |
| P20 | GPIO, I2C | I2C3_SDA_EDGE | PC1           |

## Broches d'alimentation

| Pin       | Signal | Description       |
| --------- | ------ | ----------------- |
| P17 (3V3) | 3V3    | Alimentation 3.3V |
| P18 (3V3) | 3V3    | Alimentation 3.3V |
| P21 (GND) | GND    | Masse             |
| P22 (GND) | GND    | Masse             |

## Pads crocodile (GPIO Expander)

Ces broches sont accessibles via des pads compatibles pinces crocodile et sont connectées au MCP23009 (expandeur GPIO I2C).

| Pin            | Signal | Broche MCP23009 |
| -------------- | ------ | --------------- |
| P24            | GPIO3  | GP2             |
| P25            | GPIO4  | GP3             |
| P28            | GPIO1  | GP0             |
| P29            | GPIO2  | GP1             |
| 3V3 (P23, P30) | 3V3    | -               |
| GND (P26, P27) | GND    | -               |
