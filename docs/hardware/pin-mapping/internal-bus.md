---
sidebar_position: 5
title: 'Capteurs et bus internes'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Capteurs et bus internes

## Sommaire

- [Bus I2C interne (I2C1)](#bus-i2c-interne-i2c1), avec les [adresses I2C](#adresses-i2c) de chaque release
- [Bus SPI interne (SPI1) - Écran](#bus-spi-interne-spi1---écran)
- [Signaux d'interruption des capteurs](#signaux-dinterruption-des-capteurs)
- [Expandeur GPIO (MCP23009)](#expandeur-gpio-mcp23009)
- [Microphone](#microphone)
- [Buzzer](#buzzer)
- [Communication série (STM32WB55 - STM32F103)](#communication-série-stm32wb55---stm32f103)
- [Contrôle alimentation STLink](#contrôle-alimentation-stlink)

## Bus I2C interne (I2C1)

Le bus I2C1 connecte les capteurs internes, la jauge de batterie et l'expandeur GPIO.

<ReleaseTabs>
<Release releases="v1a">

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB6           |
| I2C1_SDA | PB9           | PB7           |

Côté STM32F103, le bus est relié à son I2C1 (feuille FP14 des indices A et A1).

</Release>
<Release releases="v1b v1c">

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB10          |
| I2C1_SDA | PB9           | PB11          |

Côté STM32F103, le bus est relié à son I2C2 (bloc « I2C2_STM32F103 = I2C1_STM32WB55 » de la feuille FP14 des indices B1 et C). Le firmware DAPLink de la carte configure bien l'I2C2 sur PB10 et PB11 ([steami_i2c.c](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/board/steami/steami_i2c.c)). PB6 et PB7 portent l'USART1 du F103, relié au port série [J9](../components/not-fitted.md#notes).

</Release>
</ReleaseTabs>

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

### Adresses I2C

Les adresses sont données au format 7 bits, celui qu'attendent MicroPython (`I2C.scan()`, `readfrom_mem()`) et Arduino (`Wire.beginTransmission()`). Le format 8 bits, employé par certaines fiches techniques, ajoute le bit de lecture/écriture : il double l'adresse (0x6B devient 0xD6 en écriture et 0xD7 en lecture).

<ReleaseTabs>
<Release releases="v1a v1b">

| Adresse | Composant                                           | Fonction                             |
| ------- | --------------------------------------------------- | ------------------------------------ |
| 0x1E    | [LIS2MDL](../main-components/sensors/lis2mdl)       | Magnétomètre                         |
| 0x20    | [MCP23009](../main-components/buttons-audio)        | Expandeur GPIO                       |
| 0x29    | [VL53L1X](../main-components/sensors/vl53l1x)       | Distance                             |
| 0x39    | [APDS-9960](../main-components/sensors/apds9960)    | Lumière, couleur, geste, proximité   |
| 0x3B    | [STM32F103](../main-components/stm32f103) (DAPLink) | Accès à la flash et à la config zone |
| 0x55    | [BQ27441](../main-components/power/bq27441)         | Jauge de batterie                    |
| 0x5D    | [WSEN-PADS](../main-components/sensors/wsen-pads)   | Pression                             |
| 0x5F    | [WSEN-HIDS](../main-components/sensors/wsen-hids)   | Humidité et température              |
| 0x6B    | [ISM330DLC](../main-components/sensors/ism330dlc)   | Accéléromètre et gyroscope           |

Pour la V1a, le montage de l'APDS-9960, du WSEN-PADS et du WSEN-HIDS reste à confirmer (voir [Révisions](../revisions#capteurs-internes)).

</Release>
<Release releases="v1c">

| Adresse | Composant                                           | Fonction                             |
| ------- | --------------------------------------------------- | ------------------------------------ |
| 0x1E    | [LIS2MDL](../main-components/sensors/lis2mdl)       | Magnétomètre                         |
| 0x20    | [MCP23009](../main-components/buttons-audio)        | Expandeur GPIO                       |
| 0x29    | [VL53L1X](../main-components/sensors/vl53l1x)       | Distance                             |
| 0x3B    | [STM32F103](../main-components/stm32f103) (DAPLink) | Accès à la flash et à la config zone |
| 0x55    | [BQ27441](../main-components/power/bq27441)         | Jauge de batterie                    |
| 0x6B    | [ISM330DLC](../main-components/sensors/ism330dlc)   | Accéléromètre et gyroscope           |
| 0x76    | [BME280](../main-components/sensors/bme280)         | Pression, humidité, température      |

</Release>
</ReleaseTabs>

Ces adresses sont celles des pilotes de [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) (dictionnaire `ADDRESS` de [`lib/steami/steami/const.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/steami/const.py)) et du firmware [DAPLink](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/board/steami/steami_i2c.h) pour le pont 0x3B. Pour reconnaître la release, la bibliothèque lit l'identifiant du BME280 (V1c), puis ceux du WSEN-HIDS, du WSEN-PADS et de l'APDS-9960 (V1a ou V1b).

:::warning Ne pas confondre 0x3B et 0x76
L'adresse 8 bits du pont DAPLink (0x76) a la même valeur que l'adresse 7 bits du BME280. En 7 bits, les deux composants sont bien distincts sur le bus : 0x3B pour le pont, 0x76 pour le BME280.
:::

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
