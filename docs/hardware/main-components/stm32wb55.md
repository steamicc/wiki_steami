---
sidebar_position: 1
title: 'STM32WB55RG'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# STM32WB55RG — Microcontrôleur applicatif

Le STM32WB55RG est le processeur principal de la carte STeaMi. C'est sur ce microcontrôleur que s'exécutent les programmes utilisateur (MicroPython, Arduino). Il intègre un transceiver radio 2.4 GHz pour les communications Bluetooth, OpenThread et ZigBee.

Toutes les cartes diffusées (V1a, V1b et V1c) utilisent un STM32WB55RG ; seuls les prototypes des indices A et C étaient équipés d'un STM32WB55RC (256 Ko de flash). Le brochage est identique sur les trois releases, à l'exception de la broche PB2 : `I2C_INT` sur la V1a, `ON/OFF_+3V3_STLINK` à partir de la V1b (voir [Révisions](../revisions#alimentation-et-microcontrôleurs)).

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

| Bus            | Usage                                                    | Signaux                           |
| -------------- | -------------------------------------------------------- | --------------------------------- |
| I2C1 (interne) | Capteurs, jauge batterie, expandeur GPIO                 | SCL: PB8, SDA: PB9                |
| I2C3 (externe) | Connecteur edge, STEMMA/Qwiic                            | SCL: PC0, SDA: PC1                |
| SPI1 (interne) | Écran (OLED ou TFT selon la release)                     | SCK: PA1, MOSI: PB5, MISO: PB4    |
| SPI2 (externe) | Connecteur edge                                          | SCK: PB13, MISO: PB14, MOSI: PB15 |
| LPUART1        | Console série vers le STM32F103 (DAPLink), net `T_UART2` | TX: PB11, RX: PB10                |
| USART1         | Connecteur Jacdac, net `UART2`                           | TX: PB6, RX: PB7                  |

:::info
Le STM32WB55 est le maître du bus I2C1. Le STM32F103 (DAPLink) y est esclave, à l'adresse 0x3B : le firmware [DAPLink](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/board/steami/steami_i2c.c) ne fait que répondre, il n'interroge ni les capteurs ni la jauge de batterie. Ce pont donne au STM32WB55 l'accès à la flash externe et à la config zone. Le [schéma du bus I2C1](../pin-mapping/internal-bus#bus-i2c-interne-i2c1) montre les adresses et les interruptions de chaque release.
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

## Liaisons avec le STM32F103

Le STM32WB55 ne parle à l'ordinateur qu'à travers le [STM32F103](./stm32f103), qui exécute DAPLink. Les deux microcontrôleurs sont reliés par cinq liaisons. Cliquer sur le schéma pour l'ouvrir en grand.

<ReleaseTabs>
<Release releases="v1b v1c">

[![Schéma des liaisons entre les deux microcontrôleurs de la STeaMi V1b et V1c : SWD de PB13 et PB14 du STM32F103 vers PA14 et PA13 du STM32WB55 pour flasher et déboguer, reset par PB0, console série UART à 115 200 bauds entre l'USART2 (PA2, PA3) et le LPUART1 (PB10, PB11), commande d'alimentation du STM32F103 par PB2, et I2C avec le STM32F103 esclave 0x3B pour la flash W25Q64 et la config zone](/img/diagrams/liaisons-mcu-v1c.svg)](pathname:///img/diagrams/liaisons-mcu-v1c.svg)

</Release>
<Release releases="v1a">

[![Schéma des liaisons entre les deux microcontrôleurs de la STeaMi V1a : SWD, reset par le tampon 74LVC1G07 et console série UART comme en V1b, ligne I2C_INT entre les broches PB2 des deux microcontrôleurs, et bus I2C arrivant sur PB6 et PB7 du STM32F103 alors que le firmware DAPLink l'attend sur PB10 et PB11](/img/diagrams/liaisons-mcu-v1a.svg)](pathname:///img/diagrams/liaisons-mcu-v1a.svg)

</Release>
</ReleaseTabs>

| Liaison              | STM32WB55                           | STM32F103                                       | Rôle                                                                                                                                                         |
| -------------------- | ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SWD                  | PA14 (SWCLK), PA13 (SWDIO)          | PB13 (SWCLK), PB14 et PB12 (SWDIO)              | Flasher le programme déposé sur le lecteur USB, déboguer le STM32WB55 (CMSIS-DAP)                                                                            |
| SWO                  | PB3                                 | PA10                                            | Câblé, non utilisé : DAPLink n'active pas la capture SWO sur ce microcontrôleur                                                                              |
| Reset (`T_NRST`)     | NRST, par la diode D7               | PB0                                             | Redémarrer le STM32WB55 après un flashage ou sur commande CMSIS-DAP. Le bouton Reset (SW1) est sur ce fil : DAPLink le lit au démarrage                      |
| UART (`T_UART2`)     | LPUART1 : PB11 (TX), PB10 (RX)      | USART2 : PA3 (RX), PA2 (TX)                     | Console série à 115 200 bauds (REPL MicroPython, `Serial` en Arduino), relayée vers l'ordinateur par le port série USB (CDC)                                 |
| `ON/OFF_+3V3_STLINK` | PB2                                 | aucune broche : commutateur T4 de `+3V3_STLINK` | Couper l'alimentation du STM32F103 sur batterie. Tant que l'USB est branché, le STM32F103 reste alimenté                                                     |
| I2C                  | I2C1, maître : PB8 (SCL), PB9 (SDA) | I2C2, esclave 0x3B : PB10 (SCL), PB11 (SDA)     | Pont DAPLink : écrire et lire le fichier de la [flash W25Q64](./w25q64), lire et écrire la config zone ([protocole](./stm32f103#protocole-i2c-adresse-0x3b)) |

Le bouton Reset sert aussi à ouvrir le lecteur MAINTENANCE pour [mettre à jour DAPLink](../../software/daplink#mise-à-jour-du-firmware). Le bus I2C est le bus I2C1 interne, partagé avec les capteurs ([Capteurs et bus internes](../pin-mapping/internal-bus)).

Sur la V1a (indices A et A1), trois liaisons diffèrent, d'après la feuille FP14 de chaque indice :

- **I2C** : le bus arrive sur PB6 et PB7 du STM32F103 (son I2C1). Le firmware DAPLink actuel configure le pont sur PB10 et PB11, qui portent sur cette release l'UART3 du connecteur J9.
- **Reset** : PB0 attaque NRST par un tampon à collecteur ouvert 74LVC1G07 (U18, net `T_NRST_STLINK`). Le bouton Reset est placé après ce tampon, côté STM32WB55.
- **PB2** : la broche porte `I2C_INT`, une ligne directe vers PB2 du STM32F103, qu'aucun firmware actuel n'utilise. Il n'y a pas de commande d'alimentation : le STM32F103 est toujours alimenté.

Sources : feuilles FP6 et FP14 des schémas ; firmware DAPLink, branche `release_letssteam` ([`IO_Config.h`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/hic_hal/stm32/stm32f103xb/IO_Config.h) pour le SWD et le reset, [`uart.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/hic_hal/stm32/stm32f103xb/uart.c) pour l'USART2, [`steami_i2c.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/board/steami/steami_i2c.c) pour l'I2C) ; MicroPython, [`mpconfigboard.h`](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/mpconfigboard.h) pour le REPL sur le LPUART1.

## Schémas

[![Schéma FP6-Microcontroleur_applicatif](/img/schematics/FP6-Microcontroleur_applicatif.png)](/docs/schematics/FP6-Microcontroleur_applicatif.pdf)

- [Schéma Altium — FP6](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP6-Microcontroleur.SchDoc)

## Voir aussi

- [STM32F103 — MCU interface](./stm32f103)
- [Conception — MCU et stockage](../../design/mcu-storage)
- [Conception — Communication](../../design/communication)
- [Programmation](../../software/)
