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

| Périphérique                                | Composant                             | Fonction                                        | Releases               |
| ------------------------------------------- | ------------------------------------- | ----------------------------------------------- | ---------------------- |
| ISM330DLCTR                                 | Accéléromètre/Gyroscope               | 6 axes + température                            | V1a, V1b, V1c          |
| LIS2MDLTR                                   | Magnétomètre                          | 3 axes                                          | V1a, V1b, V1c          |
| VL53L1CXV0FY/1                              | Capteur de distance                   | Time-of-Flight                                  | V1a, V1b, V1c          |
| APDS-9960                                   | Capteur optique                       | Lumière, couleur, geste, proximité              | V1a (à confirmer), V1b |
| 2511020213301                               | Capteur de pression                   | Baromètre absolu                                | V1a (à confirmer), V1b |
| 2525020210001                               | Capteur humidité/température          | Humidité + température                          | V1a (à confirmer), V1b |
| [BME280](../main-components/sensors/bme280) | Capteur pression/humidité/température | Pression, humidité + température (adresse 0x76) | V1c                    |
| BQ27441DRZR-G1A                             | Jauge de batterie                     | État de charge                                  | V1a, V1b, V1c          |
| MCP23009-E/MG                               | Expandeur GPIO                        | 8 GPIO supplémentaires                          | V1a, V1b, V1c          |

Les capteurs d'environnement réellement montés sur la V1a restent à confirmer (voir [Révisions](../revisions#capteurs-internes)). Sur la V1a, les résistances de pull-up R15/R16 du bus I2C1 ne sont pas montées ; elles valent 4,7 kΩ à partir de la V1b.

## Bus SPI interne (SPI1) - Écran

Les signaux sont identiques pour les trois releases, y compris pour l'écran TFT de la V1c, malgré le suffixe `_OLED`.

| Signal                | Pin STM32WB55 | Test Point |
| --------------------- | ------------- | ---------- |
| SPI1_SCK_OLED         | PA1           | TP22       |
| SPI1_MOSI_OLED        | PB5           | TP23       |
| D/C_OLED_OR_SPI1_MISO | PB4           | TP24       |
| CS_OLED               | PD0           | TP20       |
| RST_OLED              | PA12          | TP21       |

## Signaux d'interruption des capteurs

| Signal                        | Pin STM32WB55 | Capteur                             | Test Point |
| ----------------------------- | ------------- | ----------------------------------- | ---------- |
| INT_ACC                       | PC13          | ISM330DLCTR (Accéléromètre)         | TP28       |
| INT_MAG                       | PD1           | LIS2MDLTR (Magnétomètre)            | TP29       |
| INT_DIST                      | PB12          | VL53L1X (Distance)                  | TP27       |
| INT_PRESSURE                  | -             | WSEN-PADS (Pression), V1a et V1b    | TP30       |
| INT_TEMPERATURE               | -             | WSEN-HIDS (Température), V1a et V1b | TP31       |
| INT_PROXIMITY                 | -             | APDS-9960 (Proximité), V1a et V1b   | TP32       |
| INT_TEMPERATURE_HUMIDITY_BOSH | -             | Bosch (Température)                 | TP45       |

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

## Communication série (STM32WB55 - STM32F103)

Le net `T_UART2` du schéma correspond au périphérique LPUART1 du STM32WB55 et à l'USART2 du STM32F103 (PA2/PA3). Cette liaison porte la console série : REPL MicroPython et `Serial` en Arduino.

| Signal                 | Pin STM32WB55 | Test Point |
| ---------------------- | ------------- | ---------- |
| T_UART2_TX (SERIAL_TX) | PB11          | TP44       |
| T_UART2_RX (SERIAL_RX) | PB10          | TP43       |

## Contrôle alimentation STLink

| Signal              | Pin STM32WB55 | Pin STM32F103 |
| ------------------- | ------------- | ------------- |
| ON/OFF\_+3V3_STLINK | PB2           | PB2           |

Ce signal existe à partir de la V1b. Sur la V1a, la broche PB2 du STM32WB55 porte le signal `I2C_INT` (voir [Révisions](../revisions#alimentation-et-microcontrôleurs)).
