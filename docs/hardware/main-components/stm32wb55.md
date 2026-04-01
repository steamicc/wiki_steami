---
sidebar_position: 1
title: 'STM32WB55RG'
---

# STM32WB55RG — Microcontrôleur applicatif

Le STM32WB55RG est le processeur principal de la carte STeaMi. C'est sur ce microcontrôleur que s'exécutent les programmes utilisateur (MicroPython, CODAL, Arduino). Il intègre un transceiver radio 2.4 GHz pour les communications Bluetooth, OpenThread et ZigBee.

## Caractéristiques

| Caractéristique        | Détail                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Modèle                 | [STM32WB55RG](https://www.st.com/en/microcontrollers-microprocessors/stm32wb55rg.html)                                 |
| Fabricant              | STMicroelectronics                                                                                                     |
| Cœur                   | ARM Cortex-M4 @ 64 MHz                                                                                                 |
| Flash                  | 1 Mo                                                                                                                   |
| RAM                    | 256 Ko SRAM                                                                                                            |
| Communication sans fil | Bluetooth BLE 5.2, OpenThread, ZigBee                                                                                  |
| Antenne                | Interne intégrée sur PCB                                                                                               |
| Filtre RF              | [MLPF-WB55-01E3](https://www.st.com/en/emi-filtering-and-signal-conditioning/mlpf-wb55-01e3.html) (passe-bas 2.45 GHz) |
| Horloge principale     | Quartz 32 MHz                                                                                                          |
| Horloge RTC            | Quartz 32 KHz                                                                                                          |
| Boîtier                | VFQFPN68                                                                                                               |
| Datasheet              | [PDF](https://www.st.com/resource/en/datasheet/stm32wb55rg.pdf)                                                        |

## Bus et périphériques

Le MCU organise ses périphériques sur plusieurs bus pour séparer les usages internes et externes :

| Bus            | Usage                                    | Signaux                           |
| -------------- | ---------------------------------------- | --------------------------------- |
| I2C1 (interne) | Capteurs, jauge batterie, expandeur GPIO | SCL: PB8, SDA: PB9                |
| I2C3 (externe) | Connecteur edge, STEMMA/Qwiic            | SCL: PC0, SDA: PC1                |
| SPI1 (interne) | Écran OLED                               | SCK: PA1, MOSI: PB5, MISO: PB4    |
| SPI2 (externe) | Connecteur edge                          | SCK: PB13, MISO: PB14, MOSI: PB15 |
| UART           | Communication avec STM32F103             | TX: PB11, RX: PB10                |

:::info
Le bus I2C1 est partagé entre le STM32WB55 et le STM32F103 (DAPLink), permettant au processeur d'interface d'accéder aux capteurs et à la jauge de batterie.
:::

## Broches GPIO directes

| Signal         | Pin       | Fonction                  |
| -------------- | --------- | ------------------------- |
| A_BUTTON       | PA7 (P5)  | Bouton A                  |
| B_BUTTON       | PA8 (P11) | Bouton B                  |
| MENU_BUTTON    | PA0       | Bouton Menu (broche wake) |
| BEEPER_OUT     | PA11      | Buzzer                    |
| LED_USER_RED   | PC12      | LED RGB rouge             |
| LED_USER_GREEN | PC11      | LED RGB verte             |
| LED_USER_BLUE  | PC10      | LED RGB bleue             |
| LED_BLE        | PH3       | LED Bluetooth             |
| MIC_IN         | PA10      | Microphone PDM data       |
| MIC_CLK        | PA3       | Microphone PDM clock      |
| RST_EXPANDER   | PB1       | Reset MCP23009            |
| INT_EXPANDER   | PB0       | Interruption MCP23009     |
| CS_OLED        | PD0       | Chip select écran         |
| RST_OLED       | PA12      | Reset écran               |

## Interruptions capteurs

| Signal   | Pin  | Capteur                   |
| -------- | ---- | ------------------------- |
| INT_DIST | PB12 | VL53L1X (distance)        |
| INT_ACC  | PC13 | ISM330DLC (accéléromètre) |
| INT_MAG  | PD1  | LIS2MDL (magnétomètre)    |

## Schémas

[![Schéma FP6-Microcontroleur_applicatif](/img/schematics/FP6-Microcontroleur_applicatif.png)](/docs/schematics/FP6-Microcontroleur_applicatif.pdf)

- [Schéma Altium — FP6](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP6-Microcontroleur.SchDoc)

## Voir aussi

- [STM32F103 — MCU interface](./stm32f103)
- [Conception — MCU et stockage](../../design/mcu-storage)
- [Conception — Communication](../../design/communication)
- [Programmation](../../software/)
