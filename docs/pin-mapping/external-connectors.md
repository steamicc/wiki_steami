---
sidebar_position: 6
title: "Connecteurs externes"
---

# Connecteurs externes

## Connecteur STEMMA/Qwiic (I2C3)

Deux connecteurs JST S4B-PH-SM4-TB 4 broches (pas 2 mm) pour la connexion de capteurs I2C externes.

| Broche | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| STEMMA_GND | GND | - |
| STEMMA_3V3 | 3V3 | - |
| STEMMA_SDA | I2C3_SDA_EDGE | PC1 |
| STEMMA_SCL | I2C3_SCL_EDGE | PC0 |

:::info
Le bus I2C3 est partage entre le connecteur STEMMA/Qwiic et les broches P19/P20 du connecteur edge.
:::

## Bus I2C externe (I2C3)

| Signal | Pin STM32WB55 |
|--------|---------------|
| I2C_EXT_SCL (I2C3_SCL_EDGE) | PC0 |
| I2C_EXT_SDA (I2C3_SDA_EDGE) | PC1 |

## Bus SPI externe (SPI2)

| Signal | Pin STM32WB55 |
|--------|---------------|
| SPI_EXT_SCK (SPI2_SCK_EDGE) | PB13 |
| SPI_EXT_MISO (SPI2_MISO_EDGE) | PB14 |
| SPI_EXT_MOSI (SPI2_MOSI_EDGE) | PB15 |

## Connecteur Jacdac

Interface serie pour modules Jacdac.

| Broche | Signal | Pin STM32WB55 | Test Point |
|--------|--------|---------------|-----------|
| JACDAC_DATA (TX) | UART2_TX | PB6 | TP73 |
| JACDAC_DATA (RX) | UART2_RX | PB7 | TP74 |
| JACDAC_P | 5V_JD_PWR | - | - |
| JACDAC_D | GND | - | - |

## Port JTAG / SWD

Connecteur de programmation et debogage (header 1 rangee, pas 1.27 mm).

| Broche | Signal | Pin STM32F103 | Test Point |
|--------|--------|---------------|-----------|
| JTAG_GND | GND | - | - |
| JTAG_VREF | VREF | - | - |
| JTAG_SWDIO | STLINK_SWDIO | PA13 | - |
| JTAG_NRST | STLINK_NRST | NRST | - |
| JTAG_SWCLK | STLINK_SWCLK | PA14 | - |

## Connecteur micro-USB

- **Composant** : GCT USB3080-30-00-A (Micro-B, Bottom-SMT)
- **Fonctions** : Alimentation 5V, programmation DAPLink, communication serie, WebUSB, stockage de masse

## Connecteur batterie

- **Composant** : Amphenol 10114830-10102LF (header SMD 2 positions, pas 1.25 mm)
- **Type** : Batterie LiPo 3.7V

## Connecteur ecran OLED

- **Composant** : Molex 52435-2471 (FFC/FPC 24 positions, pas 0.50 mm)
- **Interface** : SPI1
