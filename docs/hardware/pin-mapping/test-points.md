---
sidebar_position: 9
title: 'Points de test'
---

# Points de test

Liste complete des points de test disponibles sur le PCB de la carte STeaMi, organises par zone fonctionnelle.

## Alimentation

| Test Point | Signal      | Description                             |
| ---------- | ----------- | --------------------------------------- |
| TP50       | +5V_USB     | 5V apres protection ESD et ferrite bead |
| TP53       | VBUS        | Broche VBUS du connecteur USB J2        |
| TP54       | VBUS        | Broche VBUS du connecteur USB J2        |
| TP51       | VBAT_ON_OFF | Pin SYSOFF du BQ24075RGT                |
| TP49       | POWER       | Alimentation apres le BQ24075RGT        |
| TP1        | PACK_OUT    | Sortie batterie avant le BQ27441DRZR    |
| TP52       | VDD         | Tension apres le BQ27441DRZR            |
| TP2        | +3V3@1200mA | 3.3V apres regulateur TPS63000DRCT      |
| TP3        | SYST        | Avant le regulateur TPS63000DRCT        |
| TP4        | +3V3@1200mA | 3.3V apres regulateur TPS63000DRCT      |
| TP55       | +3V3@1200mA | 3.3V apres regulateur TPS63000DRCT      |
| TP5        | +14V5@100mA | 14.5V apres regulateur LMR62421         |
| TP46       | +3V3_STLINK | 3.3V apres regulateur STLink            |

## Microcontroleur applicatif (STM32WB55RG)

| Test Point | Signal          | Description                |
| ---------- | --------------- | -------------------------- |
| TP61       | T_NRST          | Signal NRST du STM32WB55RG |
| TP62       | +3V3@1200mA     | VDD avant le STM32WB55RG   |
| TP8        | AT0@STM32WB55RG | Pin AT0                    |
| TP9        | AT1@STM32WB55RG | Pin AT1                    |

## Microphone

| Test Point | Signal      | Description                       |
| ---------- | ----------- | --------------------------------- |
| TP60       | +3V3@1200mA | VDD avant le microphone IMP34DT05 |

## Expandeur GPIO (MCP23009)

| Test Point | Signal       | Description                 |
| ---------- | ------------ | --------------------------- |
| TP18       | RST_EXPANDER | Reset de l'expandeur        |
| TP19       | INT_EXPANDER | Interruption de l'expandeur |
| TP17       | GPIO1        | GPIO1 (P28) apres expandeur |
| TP10       | GPIO2        | GPIO2 (P29) apres expandeur |
| TP12       | GPIO3        | GPIO3 (P24) apres expandeur |
| TP11       | GPIO4        | GPIO4 (P25) apres expandeur |

## Boutons

| Test Point | Signal              | Description                      |
| ---------- | ------------------- | -------------------------------- |
| TP63       | RIGHT               | Bouton droit apres expandeur     |
| TP64       | DOWN                | Bouton bas apres expandeur       |
| TP65       | LEFT                | Bouton gauche apres expandeur    |
| TP66       | UP                  | Bouton haut apres expandeur      |
| TP67       | MENU_BOUTON         | Bouton menu apres switch tactile |
| TP68       | GPIO6_EDGE_BOUTON_B | Bouton B apres switch tactile    |
| TP69       | GPIO1_EDGE_BOUTON_A | Bouton A apres switch tactile    |

## Ecran OLED

| Test Point | Signal              | Description       |
| ---------- | ------------------- | ----------------- |
| TP20       | CS_OLED             | Chip Select ecran |
| TP21       | RST_OLED            | Reset ecran       |
| TP22       | SPI1_SCK_OLED       | SPI Clock ecran   |
| TP23       | SPI1_MOSI_OLED      | SPI MOSI ecran    |
| TP24       | C_OLED_OR_SPI1_MISO | SPI MISO ecran    |

## Capteurs internes (I2C1)

| Test Point | Signal                        | Description                                |
| ---------- | ----------------------------- | ------------------------------------------ |
| TP25       | I2C1_SDA                      | Bus I2C SDA capteurs internes              |
| TP26       | I2C1_SCL                      | Bus I2C SCL capteurs internes              |
| TP27       | INT_DIST                      | Interruption VL53L1X (distance)            |
| TP28       | INT_ACC                       | Interruption ISM330DLCTR (accelerometre)   |
| TP29       | INT_MAG                       | Interruption LIS2MDLTR (magnetometre)      |
| TP30       | INT_PRESSURE                  | Interruption capteur de pression           |
| TP31       | INT_TEMPERATURE               | Interruption capteur temperature/humidite  |
| TP32       | INT_PROXIMITY                 | Interruption capteur proximite (APDS-9960) |
| TP45       | INT_TEMPERATURE_HUMIDITY_BOSH | Interruption capteur temperature Bosch     |

## Buzzer

| Test Point | Signal     | Description   |
| ---------- | ---------- | ------------- |
| TP70       | BEEPER_OUT | Sortie buzzer |

## Communication serie et Jacdac

| Test Point | Signal     | Description                    |
| ---------- | ---------- | ------------------------------ |
| TP43       | T_UART2_RX | UART RX entre F103 et WB55     |
| TP44       | T_UART2_TX | UART TX entre F103 et WB55     |
| TP73       | UART2_TX   | UART TX vers connecteur Jacdac |
| TP74       | UART2_RX   | UART RX vers connecteur Jacdac |

## Interface Microcontroleur (STM32F103)

| Test Point | Signal         | Description                      |
| ---------- | -------------- | -------------------------------- |
| TP71       | UART1_RX       | UART1 RX du STM32F103            |
| TP72       | UART1_TX       | UART1 TX du STM32F103            |
| TP37       | FLASH_RST      | Reset flash entre F103 et W25Q64 |
| TP38       | FLASH_WP       | Write Protect flash              |
| TP39       | FLASH_CS       | Chip Select flash                |
| TP40       | SPI1_MOSI      | SPI MOSI (F103 -> flash)         |
| TP41       | SPI1_MISO      | SPI MISO (flash -> F103)         |
| TP42       | SPI1_SCK       | SPI SCK (F103 -> flash)          |
| TP75       | PWR_EXT        | Alimentation externe F103        |
| TP76       | PB15@STM32F103 | Broche PB15                      |
| TP47       | PA4@STM32F103  | Broche PA4                       |
| TP48       | PA1@STM32F103  | Broche PA1                       |
| TP56       | AIN_1          | Entree analogique F103           |

## Masse (GND)

| Test Point | Signal | Description                      |
| ---------- | ------ | -------------------------------- |
| TP6        | GND    | Masse                            |
| TP7        | GND    | Masse                            |
| TP15       | GND    | Masse proche des pads superieurs |
| TP16       | GND    | Masse proche des pads superieurs |
| TP57       | GND    | Masse                            |
| TP58       | GND    | Masse                            |
| TP59       | GND    | Masse                            |

## Alimentation pads superieurs

| Test Point | Signal      | Description                     |
| ---------- | ----------- | ------------------------------- |
| TP13       | +3V3@1200mA | 3.3V proche des pads superieurs |
| TP14       | +3V3@1200mA | 3.3V proche des pads superieurs |
