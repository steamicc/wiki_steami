---
sidebar_position: 8
title: 'Signaux'
---

# Table des signaux

Liste complète de tous les signaux de la carte STeaMi avec leurs broches associées.

## Signaux du connecteur Edge

| Signal              | Broche associée | Description                         |
| ------------------- | --------------- | ----------------------------------- |
| ANALOG01_EDGE       | P3              | Entrée analogique 1                 |
| ANALOG02_EDGE       | P0              | Entrée analogique 2 (pad crocodile) |
| ANALOG03_EDGE       | P4              | Entrée analogique 3                 |
| ANALOG04_EDGE       | P1              | Entrée analogique 4 (pad crocodile) |
| ANALOG05_EDGE       | P10             | Entrée analogique 5 (PWM)           |
| ANALOG06_EDGE       | P2              | Entrée analogique 6 (pad crocodile) |
| GPIO1_EDGE_BOUTON_A | P5              | GPIO / Bouton A                     |
| GPIO2_EDGE          | P6              | GPIO numérique                      |
| GPIO3_EDGE          | P7              | GPIO / PWM                          |
| GPIO4_EDGE          | P8              | GPIO numérique                      |
| GPIO5_EDGE          | P9              | GPIO numérique                      |
| GPIO6_EDGE_BOUTON_B | P11             | GPIO / Bouton B / PWM               |
| GPIO7_EDGE          | P12             | GPIO numérique                      |
| GPIO8_EDGE          | P16             | GPIO numérique                      |
| SPI2_SCK_EDGE       | P13             | SPI2 Clock                          |
| SPI2_MISO_EDGE      | P14             | SPI2 MISO                           |
| SPI2_MOSI_EDGE      | P15             | SPI2 MOSI                           |
| I2C3_SCL_EDGE       | P19             | I2C3 Clock                          |
| I2C3_SDA_EDGE       | P20             | I2C3 Data                           |

## Signaux des boutons

| Signal      | Broche associée | Description                               |
| ----------- | --------------- | ----------------------------------------- |
| UP          | UP_BUTTON       | Bouton directionnel haut (MCP23009 GP7)   |
| DOWN        | DOWN_BUTTON     | Bouton directionnel bas (MCP23009 GP5)    |
| LEFT        | LEFT_BUTTON     | Bouton directionnel gauche (MCP23009 GP6) |
| RIGHT       | RIGHT_BUTTON    | Bouton directionnel droit (MCP23009 GP4)  |
| MENU_BOUTON | MENU_BUTTON     | Bouton menu (PA0)                         |

## Signaux GPIO Expander

| Signal       | Broche associée | Description                       |
| ------------ | --------------- | --------------------------------- |
| GPIO1        | P28             | GPIO expander GP0 (pad crocodile) |
| GPIO2        | P29             | GPIO expander GP1 (pad crocodile) |
| GPIO3        | P24             | GPIO expander GP2 (pad crocodile) |
| GPIO4        | P25             | GPIO expander GP3 (pad crocodile) |
| RST_EXPANDER | RST_EXPANDER    | Reset de l'expandeur (PB1)        |
| INT_EXPANDER | INT_EXPANDER    | Interruption de l'expandeur (PB0) |

## Signaux LEDs

| Signal            | Broche associée | Description                        |
| ----------------- | --------------- | ---------------------------------- |
| LED_USER_RED      | LED_RED         | LED utilisateur rouge (PC12)       |
| LED_USER_GREEN    | LED_GREEN       | LED utilisateur verte (PC11)       |
| LED_USER_BLUE     | LED_BLUE        | LED utilisateur bleue (PC10)       |
| BOOT0/LED_BLE     | LED_BLE         | LED Bluetooth (PH3)                |
| LED_CHG_RED       | LED_CHG         | LED charge batterie                |
| LED_STLINK_STATUS | LED_STATUS      | LED statut STLink (F103 PA9)       |
| LED_COM_GRN       | LED_FLASH       | LED communication flash (F103 PB1) |
| LED_DAP_BLUE      | LED_DAPLINK     | LED DAPLink (F103 PA6)             |

## Signaux internes - Écran OLED

| Signal              | Broche associée | Description             |
| ------------------- | --------------- | ----------------------- |
| SPI1_SCK_OLED       | SPI_INT_SCK     | SPI1 Clock écran (PA1)  |
| SPI1_MOSI_OLED      | SPI_INT_MOSI    | SPI1 MOSI écran (PB5)   |
| C_OLED_OR_SPI1_MISO | SPI_INT_MISO    | SPI1 MISO écran (PB4)   |
| CS_OLED             | CS_DISPLAY      | Chip Select écran (PD0) |
| RST_OLED            | RST_DISPLAY     | Reset écran (PA12)      |

## Signaux internes - Capteurs

| Signal     | Broche associée | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| I2C1_SCL   | I2C_INT_SCL     | I2C1 Clock interne (WB55: PB8, F103: PB6) |
| I2C1_SDA   | I2C_INT_SDA     | I2C1 Data interne (WB55: PB9, F103: PB7)  |
| INT_ACC    | INT_ACC         | Interruption accéléromètre (PC13)         |
| INT_MAG    | INT_MAG         | Interruption magnétomètre (PD1)           |
| INT_DIST   | INT_DIST        | Interruption distance (PB12)              |
| MICRO_DATA | MIC_IN          | Données microphone (PA10)                 |
| MICRO_CLK  | MIC_CLK         | Horloge microphone (PA3)                  |
| BEEPER_OUT | SPEAKER         | Sortie buzzer (PA11)                      |

## Signaux internes - Communication serie

| Signal              | Broche associée     | Description                        |
| ------------------- | ------------------- | ---------------------------------- |
| T_UART2_TX          | SERIAL_TX           | TX vers F103 (PB11)                |
| T_UART2_RX          | SERIAL_RX           | RX depuis F103 (PB10)              |
| UART2_TX            | JACDAC_DATA         | Jacdac TX (PB6)                    |
| UART2_RX            | JACDAC_DATA         | Jacdac RX (PB7)                    |
| ON/OFF\_+3V3_STLINK | ACTIVATE_3V3_STLINK | Controle alimentation STLink (PB2) |

## Signaux JTAG

| Signal       | Broche associée | Description           |
| ------------ | --------------- | --------------------- |
| STLINK_SWDIO | JTAG_SWDIO      | SWD Data (F103 PA13)  |
| STLINK_SWCLK | JTAG_SWCLK      | SWD Clock (F103 PA14) |
| STLINK_NRST  | JTAG_NRST       | Reset (F103 NRST)     |
| VREF         | JTAG_VREF       | Tension de référence  |
| GND          | JTAG_GND        | Masse                 |

## Signaux d'alimentation

| Signal    | Broche associée                                                         | Description            |
| --------- | ----------------------------------------------------------------------- | ---------------------- |
| 3V3       | 3V3_P17, 3V3_P18, 3V3, 3V3_P23, 3V3_P30, STEMMA_3V3                     | Alimentation 3.3V      |
| GND       | GND_P21, GND_P22, GND, GND_P26, GND_P27, STEMMA_GND, JTAG_GND, JACDAC_D | Masse                  |
| 5V_JD_PWR | JACDAC_P                                                                | Alimentation 5V Jacdac |

## Signaux internes (non exposes)

Ces signaux sont uniquement accessibles via les points de test du PCB.

| Signal                        | Description                      | Test Points                            |
| ----------------------------- | -------------------------------- | -------------------------------------- |
| +5V_USB                       | 5V après protection ESD          | TP50                                   |
| VBUS                          | VBUS du connecteur USB           | TP53, TP54                             |
| VBAT_ON_OFF                   | Signal SYSOFF BQ24075            | TP51                                   |
| PACK_OUT                      | Sortie batterie                  | TP1                                    |
| VDD                           | Tension après jauge              | TP52                                   |
| POWER                         | Sortie BQ24075                   | TP49                                   |
| +3V3@1200mA                   | Rail 3.3V principal              | TP2, TP4, TP55, TP60, TP62, TP13, TP14 |
| SYST                          | Avant regulateur TPS63000        | TP3                                    |
| +14V5@100mA                   | Boost 14.5V pour buzzer          | TP5                                    |
| +3V3_STLINK                   | 3.3V STLink                      | TP46                                   |
| T_NRST                        | Reset STM32WB55                  | TP61                                   |
| AT0@STM32WB55RG               | Pin AT0                          | TP8                                    |
| AT1@STM32WB55RG               | Pin AT1                          | TP9                                    |
| INT_PRESSURE                  | Interruption capteur pression    | TP30                                   |
| INT_TEMPERATURE               | Interruption capteur température | TP31                                   |
| INT_PROXIMITY                 | Interruption capteur proximité   | TP32                                   |
| INT_TEMPERATURE_HUMIDITY_BOSH | Interruption Bosch temp.         | TP45                                   |
| UART1_RX                      | UART1 RX F103                    | TP71                                   |
| UART1_TX                      | UART1 TX F103                    | TP72                                   |
| FLASH_RST                     | Reset flash                      | TP37                                   |
| FLASH_WP                      | Write Protect flash              | TP38                                   |
| FLASH_CS                      | Chip Select flash                | TP39                                   |
| SPI1_MOSI                     | SPI1 MOSI (F103 -> flash)        | TP40                                   |
| SPI1_MISO                     | SPI1 MISO (flash -> F103)        | TP41                                   |
| SPI1_SCK                      | SPI1 SCK (F103 -> flash)         | TP42                                   |
| AIN_1                         | Entrée analogique F103           | TP56                                   |
| PWR_EXT                       | Alimentation externe F103        | TP75                                   |
| PB15@STM32F103                | Broche PB15 F103                 | TP76                                   |
| PA4@STM32F103                 | Broche PA4 F103                  | TP47                                   |
| PA1@STM32F103                 | Broche PA1 F103                  | TP48                                   |
