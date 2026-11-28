---
sidebar_position: 6
title: 'Connecteurs externes'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Connecteurs externes

Les connecteurs I2C (J3, J4), USB (J2) et écran (J7) dépendent de la release ; ils sont présentés en onglets. Les autres connecteurs sont communs aux trois releases.

## Connecteur STEMMA/Qwiic (I2C3)

<ReleaseTabs>
<Release releases="v1a v1b">

Deux connecteurs JST S4B-PH-SM4-TB 4 broches (J3, J4, pas 2 mm) pour la connexion de capteurs I2C externes. Leur pas n'est pas celui des câbles Qwiic/STEMMA QT, qui utilisent des connecteurs JST SH au pas de 1 mm : un adaptateur est nécessaire.

</Release>
<Release releases="v1c">

Deux connecteurs JST SM04B-SRSS-TB 4 broches (J3, J4, JST SH, pas 1 mm), compatibles avec les câbles Qwiic/STEMMA QT, pour la connexion de capteurs I2C externes.

</Release>
</ReleaseTabs>

Le brochage est le même pour les trois releases :

| Broche     | Signal        | Pin STM32WB55 |
| ---------- | ------------- | ------------- |
| STEMMA_GND | GND           | -             |
| STEMMA_3V3 | 3V3           | -             |
| STEMMA_SDA | I2C3_SDA_EDGE | PC1           |
| STEMMA_SCL | I2C3_SCL_EDGE | PC0           |

:::info
Le bus I2C3 est partage entre le connecteur STEMMA/Qwiic et les broches P19/P20 du connecteur edge.
:::

## Bus I2C externe (I2C3)

| Signal                      | Pin STM32WB55 |
| --------------------------- | ------------- |
| I2C_EXT_SCL (I2C3_SCL_EDGE) | PC0           |
| I2C_EXT_SDA (I2C3_SDA_EDGE) | PC1           |

## Bus SPI externe (SPI2)

| Signal                        | Pin STM32WB55 |
| ----------------------------- | ------------- |
| SPI_EXT_SCK (SPI2_SCK_EDGE)   | PB13          |
| SPI_EXT_MISO (SPI2_MISO_EDGE) | PB14          |
| SPI_EXT_MOSI (SPI2_MOSI_EDGE) | PB15          |

## Connecteur Jacdac

Interface série pour modules Jacdac. Les nets `UART2_TX` et `UART2_RX` du schéma arrivent sur le périphérique USART1 du STM32WB55.

| Broche           | Signal    | Pin STM32WB55 | Test Point |
| ---------------- | --------- | ------------- | ---------- |
| JACDAC_DATA (TX) | UART2_TX  | PB6           | TP73       |
| JACDAC_DATA (RX) | UART2_RX  | PB7           | TP74       |
| JACDAC_P         | 5V_JD_PWR | -             | -          |
| JACDAC_D         | GND       | -             | -          |

## Port JTAG / SWD

Connecteur de programmation et débogage (header 1 rangée, pas 1.27 mm).

| Broche     | Signal       | Pin STM32F103 | Test Point |
| ---------- | ------------ | ------------- | ---------- |
| JTAG_GND   | GND          | -             | -          |
| JTAG_VREF  | VREF         | -             | -          |
| JTAG_SWDIO | STLINK_SWDIO | PA13          | -          |
| JTAG_NRST  | STLINK_NRST  | NRST          | -          |
| JTAG_SWCLK | STLINK_SWCLK | PA14          | -          |

## Connecteur USB

<ReleaseTabs>
<Release releases="v1a v1b">

- **Composant** : GCT USB3080-30-00-A (Micro-B, Bottom-SMT)
- **Protection** : diode TVS Wurth WE-TVS 824015 (D1)

</Release>
<Release releases="v1c">

- **Composant** : Same Sky UJ20-C-H-G-SMT-4-P16-TR (USB-C 2.0, 16 broches)
- **Résistances CC** : R5 et R25, 5,1 kΩ (la carte se présente comme un périphérique)
- **Protection** : diode TVS Wurth 82400274 (D1)

</Release>
</ReleaseTabs>

- **Fonctions** : Alimentation 5V, programmation DAPLink, communication série, WebUSB, stockage de masse

## Connecteur batterie

- **Composant** : Amphenol 10114830-10102LF (header SMD 2 positions, pas 1.25 mm)
- **Type** : Batterie LiPo 3.7V

## Connecteur écran

<ReleaseTabs>
<Release releases="v1a v1b">

- **Composant** : Molex 52435-2471 (FFC/FPC 24 positions, pas 0.50 mm)

</Release>
<Release releases="v1c">

- **Composant** : F32R-1A7H1-11018 (FFC/FPC 18 positions)

</Release>
</ReleaseTabs>

- **Interface** : SPI1
- **Brochage** : voir la page [Écran](../main-components/display#connecteur-j7)
