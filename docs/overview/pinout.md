---
sidebar_position: 2
title: 'Pinout'
---

# Pinout de la carte STeaMi

## Brochage général

Le diagramme suivant présente l'ensemble des broches de la carte STeaMi, incluant le connecteur edge (compatible micro:bit), les pads crocodile, le connecteur STEMMA/Qwiic et le port JTAG.

![Pinout STeaMi](/img/pinout/pinout_steami.svg)

## Connecteurs

Vue détaillée des connecteurs disponibles sur la carte :

![Connecteurs STeaMi](/img/pinout/connectors_steami.svg)

### Connecteur Edge (compatible micro:bit)

Le connecteur edge expose les broches P0 a P20 ainsi que l'alimentation (3V3, GND). Il est compatible avec les accessoires micro:bit.

| Broche  | Fonction            | Signal              | Pin STM32WB55 |
| ------- | ------------------- | ------------------- | ------------- |
| P0      | Analog, GPIO, Croc  | ANALOG02_EDGE       | PC4           |
| P1      | Analog, GPIO, Croc  | ANALOG04_EDGE       | PA5           |
| P2      | Analog, GPIO, Croc  | ANALOG06_EDGE       | PC5           |
| P3      | Analog, GPIO        | ANALOG01_EDGE       | PA2           |
| P4      | Analog, GPIO        | ANALOG03_EDGE       | PA4           |
| P5      | GPIO, Bouton A      | GPIO1_EDGE_BOUTON_A | PA7           |
| P6      | GPIO                | GPIO2_EDGE          | PC3           |
| P7      | GPIO, PWM           | GPIO3_EDGE          | PA9           |
| P8      | GPIO                | GPIO4_EDGE          | PA15          |
| P9      | GPIO                | GPIO5_EDGE          | PC2           |
| P10     | Analog, GPIO, PWM   | ANALOG05_EDGE       | PA6           |
| P11     | GPIO, PWM, Bouton B | GPIO6_EDGE_BOUTON_B | PA8           |
| P12     | GPIO                | GPIO7_EDGE          | PC6           |
| P13     | GPIO, SPI CLK       | SPI2_SCK_EDGE       | PB13          |
| P14     | GPIO, SPI MISO      | SPI2_MISO_EDGE      | PB14          |
| P15     | GPIO, SPI MOSI      | SPI2_MOSI_EDGE      | PB15          |
| P16     | GPIO                | GPIO8_EDGE          | PE4           |
| P17-P18 | 3V3                 | Alimentation 3.3V   | -             |
| P19     | GPIO, I2C SCL       | I2C3_SCL_EDGE       | PC0           |
| P20     | GPIO, I2C SDA       | I2C3_SDA_EDGE       | PC1           |
| P21-P22 | GND                 | Masse               | -             |

### Connecteur STEMMA/Qwiic (I2C)

Deux connecteurs JST 4 broches au pas de 2 mm pour la connexion de capteurs externes via I2C.

| Broche     | Signal        |
| ---------- | ------------- |
| STEMMA_GND | GND           |
| STEMMA_3V3 | 3V3           |
| STEMMA_SDA | I2C3_SDA_EDGE |
| STEMMA_SCL | I2C3_SCL_EDGE |

### Pads crocodile

| Broche | Fonction        | Signal        |
| ------ | --------------- | ------------- |
| P0     | Analog, GPIO    | ANALOG02_EDGE |
| P1     | Analog, GPIO    | ANALOG04_EDGE |
| P2     | Analog, GPIO    | ANALOG06_EDGE |
| P24    | GPIO (Expander) | GPIO3         |
| P25    | GPIO (Expander) | GPIO4         |
| P28    | GPIO (Expander) | GPIO1         |
| P29    | GPIO (Expander) | GPIO2         |
| 3V3    | Alimentation    | 3V3           |
| GND    | Masse           | GND           |

## Indicateurs LED

![Indicateurs STeaMi](/img/pinout/indicators_steami.png)

| LED         | Signal            | Pin STM32WB55     | Description           |
| ----------- | ----------------- | ----------------- | --------------------- |
| LED_BLE     | BOOT0/LED_BLE     | PH3               | Indicateur Bluetooth  |
| LED_RED     | LED_USER_RED      | PC12              | LED utilisateur rouge |
| LED_GREEN   | LED_USER_GREEN    | PC11              | LED utilisateur verte |
| LED_BLUE    | LED_USER_BLUE     | PC10              | LED utilisateur bleue |
| LED_CHG     | LED_CHG_RED       | -                 | Indicateur de charge  |
| LED_STATUS  | LED_STLINK_STATUS | - (STM32F103 PA9) | Statut DAPLink        |
| LED_FLASH   | LED_COM_GRN       | - (STM32F103 PB1) | Activité flash        |
| LED_DAPLINK | LED_DAP_BLUE      | - (STM32F103 PA6) | Indicateur DAPLink    |

## Port JTAG

| Broche     | Signal       | Pin STM32F103 |
| ---------- | ------------ | ------------- |
| JTAG_GND   | GND          | -             |
| JTAG_VREF  | VREF         | -             |
| JTAG_SWDIO | STLINK_SWDIO | PA13          |
| JTAG_NRST  | STLINK_NRST  | NRST          |
| JTAG_SWCLK | STLINK_SWCLK | PA14          |
