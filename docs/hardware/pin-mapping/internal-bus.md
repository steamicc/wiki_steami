---
sidebar_position: 5
title: 'Capteurs et bus internes'
---

# Capteurs et bus internes

## Bus I2C interne (I2C1)

Le bus I2C1 connecte les capteurs internes, la jauge de batterie et l'expandeur GPIO.

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB6           |
| I2C1_SDA | PB9           | PB7           |

### Périphériques sur I2C1

| Périphérique    | Composant                    | Fonction                           |
| --------------- | ---------------------------- | ---------------------------------- |
| ISM330DLCTR     | Accéléromètre/Gyroscope      | 6 axes + température               |
| LIS2MDLTR       | Magnétomètre                 | 3 axes                             |
| VL53L1CXV0FY/1  | Capteur de distance          | Time-of-Flight                     |
| APDS-9960       | Capteur optique              | Lumière, couleur, geste, proximité |
| 2511020213301   | Capteur de pression          | Baromètre absolu                   |
| 2525020210001   | Capteur humidité/température | Humidité + température             |
| BQ27441DRZR-G1A | Jauge de batterie            | État de charge                     |
| MCP23009-E/MG   | Expandeur GPIO               | 8 GPIO supplémentaires             |

## Bus SPI interne (SPI1) - Écran OLED

| Signal              | Pin STM32WB55 | Test Point |
| ------------------- | ------------- | ---------- |
| SPI1_SCK_OLED       | PA1           | TP22       |
| SPI1_MOSI_OLED      | PB5           | TP23       |
| C_OLED_OR_SPI1_MISO | PB4           | TP24       |
| CS_OLED             | PD0           | TP20       |
| RST_OLED            | PA12          | TP21       |

## Signaux d'interruption des capteurs

| Signal                        | Pin STM32WB55 | Capteur                     | Test Point |
| ----------------------------- | ------------- | --------------------------- | ---------- |
| INT_ACC                       | PC13          | ISM330DLCTR (Accéléromètre) | TP28       |
| INT_MAG                       | PD1           | LIS2MDLTR (Magnétomètre)    | TP29       |
| INT_DIST                      | PB12          | VL53L1X (Distance)          | TP27       |
| INT_PRESSURE                  | -             | WSEN-PADS (Pression)        | TP30       |
| INT_TEMPERATURE               | -             | WSEN-HIDS (Température)     | TP31       |
| INT_PROXIMITY                 | -             | APDS-9960 (Proximité)       | TP32       |
| INT_TEMPERATURE_HUMIDITY_BOSH | -             | Bosch (Température)         | TP45       |

## Expandeur GPIO (MCP23009)

| Signal       | Pin STM32WB55 | Test Point |
| ------------ | ------------- | ---------- |
| RST_EXPANDER | PB1           | TP18       |
| INT_EXPANDER | PB0           | TP19       |

## Microphone

| Signal              | Pin STM32WB55 |
| ------------------- | ------------- |
| MICRO_DATA (MIC_IN) | PA10          |
| MICRO_CLK (MIC_CLK) | PA3           |

## Buzzer

| Signal               | Pin STM32WB55 | Test Point |
| -------------------- | ------------- | ---------- |
| BEEPER_OUT (SPEAKER) | PA11          | TP70       |

## Communication serie (STM32WB55 - STM32F103)

| Signal                 | Pin STM32WB55 | Test Point |
| ---------------------- | ------------- | ---------- |
| T_UART2_TX (SERIAL_TX) | PB11          | TP44       |
| T_UART2_RX (SERIAL_RX) | PB10          | TP43       |

## Controle alimentation STLink

| Signal              | Pin STM32WB55 | Pin STM32F103 |
| ------------------- | ------------- | ------------- |
| ON/OFF\_+3V3_STLINK | PB2           | PB2           |
