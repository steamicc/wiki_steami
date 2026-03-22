---
sidebar_position: 1
title: "Vue d'ensemble du materiel"
---

# Vue d'ensemble du materiel

La carte STeaMi est un ordinateur monocarte (SBC) educatif base sur deux processeurs : un processeur applicatif (STM32WB55RG) sur lequel s'executent les programmes utilisateur, et un processeur d'interface (STM32F103) qui gere les communications USB et la programmation drag-and-drop via DAPLink.

Deux ressources cles pour comprendre les details internes de la carte :

- Les [schemas](./schematic), qui montrent les donnees de connectivite detaillees de chaque composant.
- Le [reference design](https://github.com/steamicc/steami-reference-design), qui est un design complet de la carte au format Altium.

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-front.png" alt="STeaMi face avant" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face avant</figcaption>
</figure>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-back.png" alt="STeaMi face arriere" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face arriere</figcaption>
</figure>
</div>

## Schema bloc

![Schema bloc STeaMi](/img/hardware/block-diagram.svg)

## Description du hardware

### Microcontroleur applicatif

Le STM32WB55RG est le processeur principal sur lequel s'executent les programmes utilisateur (MicroPython, CODAL, Arduino). Il integre un transceiver radio 2.4 GHz pour les communications Bluetooth, OpenThread et ZigBee. Toutes les broches GPIO accessibles a l'utilisateur sont fournies par ce processeur.

| Caracteristique | Detail                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Modele          | [STM32WB55RG](https://www.st.com/en/microcontrollers-microprocessors/stm32wb55rg.html)                                                     |
| Coeur           | ARM Cortex-M4 @ 64 MHz                                                                                                                     |
| Flash           | 1 Mo                                                                                                                                       |
| RAM             | 256 Ko SRAM                                                                                                                                |
| Radio           | BLE 5.2, OpenThread, ZigBee                                                                                                                |
| Antenne         | Interne + filtre [MLPF-WB55-01E3](https://www.st.com/en/emi-filtering-and-signal-conditioning/mlpf-wb55-01e3.html) (passe-bas 2.45 GHz)    |
| Horloge         | Quartz 32 MHz + Quartz 32 KHz (RTC)                                                                                                        |
| Boitier         | VFQFPN68                                                                                                                                   |
| Plus d'infos    | [Software](../software/), [Conception — MCU](../design/mcu-storage), [Datasheet](https://www.st.com/resource/en/datasheet/stm32wb55rg.pdf) |

### Communication Bluetooth

Le transceiver 2.4 GHz integre au STM32WB55 prend en charge les communications Bluetooth Low Energy, OpenThread et ZigBee. L'antenne est integree sur le PCB avec un filtre RF dedie.

| Caracteristique | Detail                                                |
| --------------- | ----------------------------------------------------- |
| Stack           | Bluetooth 5.2 BLE                                     |
| Bande           | 2.4 GHz ISM                                           |
| Protocoles      | BLE, OpenThread, ZigBee                               |
| Antenne         | Integree sur PCB                                      |
| Filtre RF       | MLPF-WB55-01E3                                        |
| Plus d'infos    | [Conception — Communication](../design/communication) |

### Capteurs internes

La carte integre 7 capteurs sur le bus I2C1 interne, couvrant distance, mouvement, environnement, lumiere et son. Certains capteurs (VL53L1X, ISM330DLC, LIS2MDL) disposent de lignes d'interruption individuelles.

| Capteur                 | Modele                                                                                                                  | Mesures                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Accelerometre/Gyroscope | [ISM330DLC](https://www.st.com/en/mems-and-sensors/ism330dlc.html)                                                      | 6 axes + temperature           |
| Magnetometre            | [LIS2MDL](https://www.st.com/en/mems-and-sensors/lis2mdl.html)                                                          | 3 axes magnetiques             |
| Distance                | [VL53L1X](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html)                                           | Time-of-Flight, 0-4 m          |
| Pression                | [WSEN-PADS](https://www.we-online.com/en/components/products/WSEN-PADS_1)                                                 | 26-126 kPa, 24 bits            |
| Humidite/Temperature    | [WSEN-HIDS](https://www.we-online.com/en/components/products/WSEN-HIDS_1)                                                 | RH + °C                        |
| Lumiere/Geste           | [APDS-9960](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) | ALS, couleur, proximite, geste |
| Microphone              | [IMP34DT05](https://www.st.com/en/mems-and-sensors/imp34dt05.html)                                                      | PDM MEMS omnidirectionnel      |

| Caracteristique | Detail                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bus I2C         | I2C1 — SCL: PB8, SDA: PB9 (STM32WB55)                                                                                                                                |
| Plus d'infos    | [Conception — Capteurs](../design/sensors), [Schema — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

### Ecran OLED

L'ecran OLED 128x128 pixels blanc est connecte au processeur applicatif via SPI1.

| Caracteristique | Detail                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modele          | Winstar WEO128128BWPP3N00001                                                                                                                                                                  |
| Controleur      | SSD1327                                                                                                                                                                                       |
| Technologie     | OLED (blanc)                                                                                                                                                                                  |
| Resolution      | 128 x 128 pixels                                                                                                                                                                              |
| Interface       | SPI1 (interne)                                                                                                                                                                                |
| Connecteur      | FFC/FPC 24 positions, pas 0.50 mm                                                                                                                                                             |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schema — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc) |

### LEDs

La carte dispose de plusieurs LEDs pour le retour visuel : une LED RGB programmable par l'utilisateur, une LED Bluetooth, et des LEDs de status gerees par le processeur d'interface.

| LED             | Composant/Signal    | Broches                      |
| --------------- | ------------------- | ---------------------------- |
| RGB utilisateur | Wurth 150505M173300 | PC12 (R), PC11 (G), PC10 (B) |
| Bluetooth       | LED_BLE             | PH3                          |
| Status          | LED_STLINK_STATUS   | PA9 (F103)                   |
| Flash           | LED_COM_GRN         | PB1 (F103)                   |
| DAPLink         | LED_DAP_BLUE        | PA6 (F103)                   |
| Charge          | LED_CHG_RED         | —                            |

| Caracteristique | Detail                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schema — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc) |

### Boutons

La carte dispose de 7 boutons utilisateur (4 directions + A + B + Menu) plus un bouton reset. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour economiser des broches MCU.

| Bouton                            | Composant       | Connexion              |
| --------------------------------- | --------------- | ---------------------- |
| D-pad (haut, bas, gauche, droite) | ALPS SKRHABE010 | Via MCP23009 (GP4-GP7) |
| A                                 | C&K PTS636      | PA7 (direct GPIO)      |
| B                                 | C&K PTS636      | PA8 (direct GPIO)      |
| Menu                              | Bouton poussoir | PA0 (broche wake)      |
| Reset                             | Bouton poussoir | NRST                   |

| Caracteristique            | Detail                                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull-up                    | Resistances pull-up externes sur tous les boutons                                                                                                                                         |
| Menu — fonction secondaire | Reveil basse consommation, appairage BLE (appui long)                                                                                                                                     |
| Plus d'infos               | [Conception — Interface utilisateur](../design/user-interface), [Schema — FP9](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP9-Bouton_de_controle.SchDoc) |

### Sortie audio

| Caracteristique | Detail                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modele          | [PUI Audio SMT-0825-S-HT-R](https://www.puiaudio.com/products/detail/SMT-0825-S-HT-R)                                                                                                 |
| Type            | Transducteur piezo SMD                                                                                                                                                                |
| Tension         | 3.6V pic-a-pic                                                                                                                                                                        |
| Signal          | BEEPER_OUT → PA11 (STM32WB55)                                                                                                                                                         |
| Alimentation    | Boost converter LMR62421 (14.5V)                                                                                                                                                      |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schema — FP10](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP10-Sortie_Audio.SchDoc) |

### Connecteurs

La carte offre plusieurs options de connectivite externe pour les capteurs, actionneurs et accessoires.

| Connecteur     | Type                           | Signaux                          |
| -------------- | ------------------------------ | -------------------------------- |
| Edge connector | Compatible micro:bit, P0-P20   | GPIO, analogique, SPI, I2C, PWM  |
| STEMMA/Qwiic   | 2x JST 4-pin (pas 2 mm)        | I2C3 (SCL: PC0, SDA: PC1)        |
| Jacdac         | Interface serie                | UART2 (PB6/PB7), 5V              |
| Pads crocodile | P0, P1, P2 + P24-P29 + 3V3/GND | Analogique + GPIO (via MCP23009) |
| SWD            | Header 1 rangee, pas 1.27 mm   | GND, SWCLK, 3V3, SWDIO           |

| Caracteristique | Detail                                                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bus SPI externe | SPI2 — SCK: PB13, MISO: PB14, MOSI: PB15                                                                                                                                                                                           |
| Bus UART serie  | TX: PB11, RX: PB10                                                                                                                                                                                                                 |
| Plus d'infos    | [Pin Mapping — Edge connector](./pin-mapping/edge-connector), [Conception — Capteurs](../design/sensors), [Schema — FP13](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP13-Port_Specifique.SchDoc) |

### Alimentation

Le systeme de gestion de l'alimentation fournit les differentes tensions a partir du 5V USB ou de la batterie LiPo 3.7V.

| Caracteristique         | Detail                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Convertisseur principal | [TPS63000DRCT](https://www.ti.com/product/TPS63000) (buck-boost) — 3.3V @ 1200 mA                                                                                 |
| Regulateur lineaire     | LD3985M33R — 3.3V @ 150 mA                                                                                                                                        |
| Boost buzzer            | [LMR62421](https://www.ti.com/product/LMR62421) — 14.5V @ 100 mA                                                                                                  |
| Switch alimentation     | DIO7003LEST5 — basse perte                                                                                                                                        |
| Chargeur batterie       | [BQ24075RGT](https://www.ti.com/product/BQ24075) — 500 mA, PowerPath                                                                                              |
| Jauge batterie          | [BQ27441](https://www.ti.com/product/BQ27441-G1) — I2C, SON-12                                                                                                    |
| Batterie                | LiPo 3.7V, 1600 mAh                                                                                                                                               |
| Autonomie standard      | 1 jour                                                                                                                                                            |
| Autonomie basse conso   | 5-10 jours                                                                                                                                                        |
| Plus d'infos            | [Conception — Alimentation](../design/power), [Schema — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc) |

### Interface USB / DAPLink

Le processeur d'interface (STM32F103) gere les communications USB. Il execute le firmware DAPLink (comme le micro:bit), permettant la programmation drag-and-drop et le debogage.

| Caracteristique | Detail                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modele          | [STM32F103CBT6](https://www.st.com/en/microcontrollers-microprocessors/stm32f103cb.html)                                                                                                                                                                        |
| Coeur           | ARM Cortex-M3 @ 72 MHz                                                                                                                                                                                                                                          |
| Flash           | 128 Ko                                                                                                                                                                                                                                                          |
| Firmware        | DAPLink                                                                                                                                                                                                                                                         |
| Horloge         | Quartz 8 MHz                                                                                                                                                                                                                                                    |
| USB HID         | CMSIS-DAP (debogage)                                                                                                                                                                                                                                            |
| USB CDC         | Port serie virtuel                                                                                                                                                                                                                                              |
| USB MSC         | Stockage de masse (drag-and-drop programming)                                                                                                                                                                                                                   |
| USB WebUSB      | Interface web directe                                                                                                                                                                                                                                           |
| Plus d'infos    | [Conception — Service et USB](../design/service-usb), [Schema — FP14](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP14-Microcontroleur_interface.SchDoc), [Datasheet](https://www.st.com/resource/en/datasheet/stm32f103cb.pdf) |

### Memoire flash externe

La memoire flash externe est connectee au processeur d'interface (STM32F103) pour le stockage des donnees capteurs, accessible via USB Mass Storage.

| Caracteristique | Detail                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modele          | [W25Q64JVZPIM](https://www.winbond.com/hq/new-online-purchasing-guide/?__locale=en&pLine=/product/code-storage-flash/qspi-nor/&pNo=W25Q64JV)                                                    |
| Capacite        | 64 Mbit (8 Mo)                                                                                                                                                                |
| Interface       | SPI / Quad-SPI (QPI, DTR)                                                                                                                                                     |
| Frequence       | Jusqu'a 133 MHz                                                                                                                                                               |
| Boitier         | 8-WSON (6x5)                                                                                                                                                                  |
| Acces           | USB Mass Storage via DAPLink                                                                                                                                                  |
| Format donnees  | CSV                                                                                                                                                                           |
| Plus d'infos    | [Conception — Communication](../design/communication), [Schema — FP15](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP15-Memoire_flash.SchDoc) |

### Extension GPIO

L'expandeur GPIO MCP23009 fournit 8 GPIO supplementaires sur le bus I2C1. Il est utilise pour les boutons directionnels et les pads crocodile.

| Caracteristique | Detail                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modele          | [MCP23009-E/MG](https://www.microchip.com/en-us/product/MCP23009)                                                                                                 |
| Interface       | I2C (bus I2C1 interne)                                                                                                                                            |
| GPIO            | 8 (GP0-GP7)                                                                                                                                                       |
| Utilisation     | GP0-GP3 : pads crocodile (P24, P25, P28, P29) / GP4-GP7 : boutons directionnels                                                                                   |
| Reset           | RST_EXPANDER → PB1                                                                                                                                                |
| Interruption    | INT_EXPANDER → PB0                                                                                                                                                |
| Plus d'infos    | [Conception — Capteurs](../design/sensors), [Schema — FP7](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP7-Port_extention.SchDoc) |

## Mecanique

| Caracteristique  | Detail        |
| ---------------- | ------------- |
| Dimensions       | < 100 x 60 mm |
| Poids            | ≤ 100 g       |
| Batterie         | Face arriere  |
| Ecran et boutons | Face avant    |

## Informations complementaires

- [Schemas de la carte (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/PDF/STeaMi-Schematic.PDF)
- [Reference design (Altium)](https://github.com/steamicc/steami-reference-design)
- [Vue 3D (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/3D/STeaMi_3D.pdf)
- [BOM de fabrication](https://github.com/steamicc/steami-reference-design/blob/main/Manufacturing/BOM/STeaMi-BOM.csv)
- [Composants (BOM detaillee)](./components/)
- [Pin Mapping](./pin-mapping/)
- [Conception et exigences](../design/)
- [Revisions de la carte](./revisions)
