---
sidebar_position: 1
title: "Vue d'ensemble du matériel"
---

# Vue d'ensemble du matériel

La carte STeaMi est un ordinateur monocarte (SBC) éducatif basé sur deux processeurs : un processeur applicatif (STM32WB55RG) sur lequel s'exécutent les programmes utilisateur, et un processeur d'interface (STM32F103) qui gère les communications USB et la programmation drag-and-drop via DAPLink.

Deux ressources clés pour comprendre les détails internes de la carte :

- Les [schémas](./schematic), qui montrent les données de connectivité détaillées de chaque composant.
- Le [reference design](https://github.com/steamicc/steami-reference-design), qui est un design complet de la carte au format Altium.

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-front.png" alt="STeaMi face avant" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face avant</figcaption>
</figure>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-back.png" alt="STeaMi face arrière" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face arrière</figcaption>
</figure>
</div>

## Schéma bloc

![Schéma bloc STeaMi](/img/hardware/block-diagram.svg)

## Description du hardware

### Microcontrôleur applicatif

Le STM32WB55RG est le processeur principal sur lequel s'exécutent les programmes utilisateur (MicroPython, CODAL, Arduino). Il intègre un transceiver radio 2.4 GHz pour les communications Bluetooth, OpenThread et ZigBee. Toutes les broches GPIO accessibles à l'utilisateur sont fournies par ce processeur.

| Caractéristique | Détail                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | [STM32WB55RG](https://www.st.com/en/microcontrollers-microprocessors/stm32wb55rg.html)                                                          |
| Cœur            | ARM Cortex-M4 @ 64 MHz                                                                                                                          |
| Flash           | 1 Mo                                                                                                                                            |
| RAM             | 256 Ko SRAM                                                                                                                                     |
| Radio           | BLE 5.2, OpenThread, ZigBee                                                                                                                     |
| Antenne         | Interne + filtre [MLPF-WB55-01E3](https://www.st.com/en/emi-filtering-and-signal-conditioning/mlpf-wb55-01e3.html) (passe-bas 2.45 GHz)         |
| Horloge         | Quartz 32 MHz + Quartz 32 KHz (RTC)                                                                                                             |
| Boîtier         | VFQFPN68                                                                                                                                        |
| Plus d'infos    | [Programmation](../software/), [Conception — MCU](../design/mcu-storage), [Datasheet](https://www.st.com/resource/en/datasheet/stm32wb55rg.pdf) |

### Communication Bluetooth

Le transceiver 2.4 GHz intégré au STM32WB55 prend en charge les communications Bluetooth Low Energy, OpenThread et ZigBee. L'antenne est intégrée sur le PCB avec un filtre RF dédié.

| Caractéristique | Détail                                                |
| --------------- | ----------------------------------------------------- |
| Stack           | Bluetooth 5.2 BLE                                     |
| Bande           | 2.4 GHz ISM                                           |
| Protocoles      | BLE, OpenThread, ZigBee                               |
| Antenne         | Intégrée sur PCB                                      |
| Filtre RF       | MLPF-WB55-01E3                                        |
| Plus d'infos    | [Conception — Communication](../design/communication) |

### Capteurs internes

La carte intègre 7 capteurs sur le bus I2C1 interne, couvrant distance, mouvement, environnement, lumière et son. Certains capteurs (VL53L1X, ISM330DLC, LIS2MDL) disposent de lignes d'interruption individuelles.

| Capteur                 | Modèle                                                                                                                  | Mesures                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Accéléromètre/Gyroscope | [ISM330DLC](https://www.st.com/en/mems-and-sensors/ism330dlc.html)                                                      | 6 axes + température           |
| Magnétomètre            | [LIS2MDL](https://www.st.com/en/mems-and-sensors/lis2mdl.html)                                                          | 3 axes magnétiques             |
| Distance                | [VL53L1X](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html)                                           | Time-of-Flight, 0-4 m          |
| Pression                | [WSEN-PADS](https://www.we-online.com/en/components/products/WSEN-PADS_1)                                               | 26-126 kPa, 24 bits            |
| Humidité/Température    | [WSEN-HIDS](https://www.we-online.com/en/components/products/WSEN-HIDS_1)                                               | RH + °C                        |
| Lumière/Geste           | [APDS-9960](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) | ALS, couleur, proximité, geste |
| Microphone              | [IMP34DT05](https://www.st.com/en/mems-and-sensors/imp34dt05.html)                                                      | PDM MEMS omnidirectionnel      |

| Caractéristique | Détail                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bus I2C         | I2C1 — SCL: PB8, SDA: PB9 (STM32WB55)                                                                                                                                |
| Plus d'infos    | [Conception — Capteurs](../design/sensors), [Schéma — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

### Écran OLED

L'écran OLED 128x128 pixels blanc est connecté au processeur applicatif via SPI1.

| Caractéristique | Détail                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | Winstar WEO128128BWPP3N00001                                                                                                                                                                  |
| Contrôleur      | SSD1327                                                                                                                                                                                       |
| Technologie     | OLED (blanc)                                                                                                                                                                                  |
| Résolution      | 128 x 128 pixels                                                                                                                                                                              |
| Interface       | SPI1 (interne)                                                                                                                                                                                |
| Connecteur      | FFC/FPC 24 positions, pas 0.50 mm                                                                                                                                                             |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc) |

### LEDs

La carte dispose de plusieurs LEDs pour le retour visuel : une LED RGB programmable par l'utilisateur, une LED Bluetooth, et des LEDs de status gérées par le processeur d'interface.

| LED             | Composant/Signal    | Broches                      |
| --------------- | ------------------- | ---------------------------- |
| RGB utilisateur | Wurth 150505M173300 | PC12 (R), PC11 (G), PC10 (B) |
| Bluetooth       | LED_BLE             | PH3                          |
| Status          | LED_STLINK_STATUS   | PA9 (F103)                   |
| Flash           | LED_COM_GRN         | PB1 (F103)                   |
| DAPLink         | LED_DAP_BLUE        | PA6 (F103)                   |
| Charge          | LED_CHG_RED         | —                            |

| Caractéristique | Détail                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc) |

### Boutons

La carte dispose de 7 boutons utilisateur (4 directions + A + B + Menu) plus un bouton reset. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour économiser des broches MCU.

| Bouton                            | Composant       | Connexion              |
| --------------------------------- | --------------- | ---------------------- |
| D-pad (haut, bas, gauche, droite) | ALPS SKRHABE010 | Via MCP23009 (GP4-GP7) |
| A                                 | C&K PTS636      | PA7 (direct GPIO)      |
| B                                 | C&K PTS636      | PA8 (direct GPIO)      |
| Menu                              | Bouton poussoir | PA0 (broche wake)      |
| Reset                             | Bouton poussoir | NRST                   |

| Caractéristique            | Détail                                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull-up                    | Résistances pull-up externes sur tous les boutons                                                                                                                                         |
| Menu — fonction secondaire | Réveil basse consommation, appairage BLE (appui long)                                                                                                                                     |
| Plus d'infos               | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP9](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP9-Bouton_de_controle.SchDoc) |

### Sortie audio

| Caractéristique | Détail                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | [PUI Audio SMT-0825-S-HT-R](https://www.puiaudio.com/products/detail/SMT-0825-S-HT-R)                                                                                                 |
| Type            | Transducteur piézo SMD                                                                                                                                                                |
| Tension         | 3.6V pic-à-pic                                                                                                                                                                        |
| Signal          | BEEPER_OUT → PA11 (STM32WB55)                                                                                                                                                         |
| Alimentation    | Boost converter LMR62421 (14.5V)                                                                                                                                                      |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP10](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP10-Sortie_Audio.SchDoc) |

### Connecteurs

La carte offre plusieurs options de connectivité externe pour les capteurs, actionneurs et accessoires.

| Connecteur     | Type                           | Signaux                          |
| -------------- | ------------------------------ | -------------------------------- |
| Edge connector | Compatible micro:bit, P0-P20   | GPIO, analogique, SPI, I2C, PWM  |
| STEMMA/Qwiic   | 2x JST 4-pin (pas 2 mm)        | I2C3 (SCL: PC0, SDA: PC1)        |
| Jacdac         | Interface série                | UART2 (PB6/PB7), 5V              |
| Pads crocodile | P0, P1, P2 + P24-P29 + 3V3/GND | Analogique + GPIO (via MCP23009) |
| SWD            | Header 1 rangée, pas 1.27 mm   | GND, SWCLK, 3V3, SWDIO           |

| Caractéristique | Détail                                                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bus SPI externe | SPI2 — SCK: PB13, MISO: PB14, MOSI: PB15                                                                                                                                                                                           |
| Bus UART série  | TX: PB11, RX: PB10                                                                                                                                                                                                                 |
| Plus d'infos    | [Pin Mapping — Edge connector](./pin-mapping/edge-connector), [Conception — Capteurs](../design/sensors), [Schéma — FP13](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP13-Port_Specifique.SchDoc) |

### Alimentation

Le système de gestion de l'alimentation fournit les différentes tensions à partir du 5V USB ou de la batterie LiPo 3.7V.

| Caractéristique         | Détail                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Convertisseur principal | [TPS63000DRCT](https://www.ti.com/product/TPS63000) (buck-boost) — 3.3V @ 1200 mA                                                                                 |
| Régulateur linéaire     | LD3985M33R — 3.3V @ 150 mA                                                                                                                                        |
| Boost buzzer            | [LMR62421](https://www.ti.com/product/LMR62421) — 14.5V @ 100 mA                                                                                                  |
| Switch alimentation     | DIO7003LEST5 — basse perte                                                                                                                                        |
| Chargeur batterie       | [BQ24075RGT](https://www.ti.com/product/BQ24075) — 500 mA, PowerPath                                                                                              |
| Jauge batterie          | [BQ27441](https://www.ti.com/product/BQ27441-G1) — I2C, SON-12                                                                                                    |
| Batterie                | LiPo 3.7V, 1600 mAh                                                                                                                                               |
| Autonomie standard      | 1 jour                                                                                                                                                            |
| Autonomie basse conso   | 5-10 jours                                                                                                                                                        |
| Plus d'infos            | [Conception — Alimentation](../design/power), [Schéma — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc) |

### Interface USB / DAPLink

Le processeur d'interface (STM32F103) gère les communications USB. Il exécute le firmware DAPLink (comme le micro:bit), permettant la programmation drag-and-drop et le débogage.

| Caractéristique | Détail                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | [STM32F103CBT6](https://www.st.com/en/microcontrollers-microprocessors/stm32f103cb.html)                                                                                                                                                                        |
| Cœur            | ARM Cortex-M3 @ 72 MHz                                                                                                                                                                                                                                          |
| Flash           | 128 Ko                                                                                                                                                                                                                                                          |
| Firmware        | DAPLink                                                                                                                                                                                                                                                         |
| Horloge         | Quartz 8 MHz                                                                                                                                                                                                                                                    |
| USB HID         | CMSIS-DAP (débogage)                                                                                                                                                                                                                                            |
| USB CDC         | Port série virtuel                                                                                                                                                                                                                                              |
| USB MSC         | Stockage de masse (drag-and-drop programming)                                                                                                                                                                                                                   |
| USB WebUSB      | Interface web directe                                                                                                                                                                                                                                           |
| Plus d'infos    | [Conception — Service et USB](../design/service-usb), [Schéma — FP14](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP14-Microcontroleur_interface.SchDoc), [Datasheet](https://www.st.com/resource/en/datasheet/stm32f103cb.pdf) |

### Mémoire flash externe

La mémoire flash externe est connectée au processeur d'interface (STM32F103) pour le stockage des données capteurs, accessible via USB Mass Storage.

| Caractéristique | Détail                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | [W25Q64JVZPIM](https://www.winbond.com/hq/new-online-purchasing-guide/?__locale=en&pLine=/product/code-storage-flash/qspi-nor/&pNo=W25Q64JV)                                  |
| Capacité        | 64 Mbit (8 Mo)                                                                                                                                                                |
| Interface       | SPI / Quad-SPI (QPI, DTR)                                                                                                                                                     |
| Fréquence       | Jusqu'à 133 MHz                                                                                                                                                               |
| Boîtier         | 8-WSON (6x5)                                                                                                                                                                  |
| Accès           | USB Mass Storage via DAPLink                                                                                                                                                  |
| Format données  | CSV                                                                                                                                                                           |
| Plus d'infos    | [Conception — Communication](../design/communication), [Schéma — FP15](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP15-Memoire_flash.SchDoc) |

### Extension GPIO

L'expandeur GPIO MCP23009 fournit 8 GPIO supplémentaires sur le bus I2C1. Il est utilisé pour les boutons directionnels et les pads crocodile.

| Caractéristique | Détail                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | [MCP23009-E/MG](https://www.microchip.com/en-us/product/MCP23009)                                                                                                 |
| Interface       | I2C (bus I2C1 interne)                                                                                                                                            |
| GPIO            | 8 (GP0-GP7)                                                                                                                                                       |
| Utilisation     | GP0-GP3 : pads crocodile (P24, P25, P28, P29) / GP4-GP7 : boutons directionnels                                                                                   |
| Reset           | RST_EXPANDER → PB1                                                                                                                                                |
| Interruption    | INT_EXPANDER → PB0                                                                                                                                                |
| Plus d'infos    | [Conception — Capteurs](../design/sensors), [Schéma — FP7](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP7-Port_extention.SchDoc) |

## Mécanique

| Caractéristique  | Détail        |
| ---------------- | ------------- |
| Dimensions       | < 100 x 60 mm |
| Poids            | ≤ 100 g       |
| Batterie         | Face arrière  |
| Écran et boutons | Face avant    |

## Informations complémentaires

- [Schémas de la carte (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/PDF/STeaMi-Schematic.PDF)
- [Reference design (Altium)](https://github.com/steamicc/steami-reference-design)
- [Vue 3D (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/3D/STeaMi_3D.pdf)
- [BOM de fabrication](https://github.com/steamicc/steami-reference-design/blob/main/Manufacturing/BOM/STeaMi-BOM.csv)
- [Composants (BOM détaillée)](./components/)
- [Pin Mapping](./pin-mapping/)
- [Conception et exigences](../design/)
- [Révisions de la carte](./revisions)
