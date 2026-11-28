---
sidebar_position: 1
title: "Vue d'ensemble du matériel"
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';
import DiagrammeCliquable from '@site/src/components/DiagrammeCliquable';

# Vue d'ensemble du matériel

La carte STeaMi est un ordinateur monocarte (SBC) éducatif basé sur deux processeurs : un processeur applicatif (STM32WB55RG) sur lequel s'exécutent les programmes utilisateur, et un processeur d'interface (STM32F103) qui gère les communications USB et la programmation drag-and-drop via DAPLink.

La carte existe en trois releases, **V1a**, **V1b** et **V1c**, qui ne diffèrent que sur quelques fonctions (écran, capteurs d'environnement, connecteurs USB et I2C). Les sections concernées sont présentées en onglets ; la page [Révisions](./revisions) détaille toutes les différences.

Deux ressources clés pour comprendre les détails internes de la carte :

- Les [schémas](./schematic), qui montrent les données de connectivité détaillées de chaque composant.
- Le [reference design](https://github.com/steamicc/steami-reference-design), qui est un design complet de la carte au format Altium (indice B1, release V1b).

<ReleaseTabs>
<Release releases="v1c">

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-v1c-front.png" alt="STeaMi V1c face avant" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face avant</figcaption>
</figure>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-v1c-back.png" alt="STeaMi V1c face arrière" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face arrière</figcaption>
</figure>
</div>

Carte V1c (prototype) : écran TFT rond, connecteur USB-C et connecteurs I2C Qwiic/STEMMA QT.

</Release>
<Release releases="v1b">

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-v1b-front.png" alt="STeaMi V1b face avant" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face avant</figcaption>
</figure>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-v1b-back.png" alt="STeaMi V1b face arrière" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face arrière</figcaption>
</figure>
</div>

Carte V1b de série (circuit imprimé noir, indice B2) : écran OLED rond, connecteur micro-USB et connecteurs I2C JST PH. Les prototypes V1b avaient un circuit imprimé vert, comme la V1a (voir [Identifier sa version](./revisions#identifier-sa-version)).

</Release>
<Release releases="v1a">

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center'}}>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-front.png" alt="STeaMi au circuit imprimé vert, face avant" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face avant</figcaption>
</figure>
<figure style={{textAlign: 'center', margin: 0}}>
<img src="/img/hardware/steami-back.png" alt="STeaMi au circuit imprimé vert, face arrière" loading="lazy" width="350" style={{height: 'auto'}} />
<figcaption>Face arrière</figcaption>
</figure>
</div>

Carte au circuit imprimé vert : écran OLED rond, connecteur micro-USB et connecteurs I2C JST PH. Il s'agit d'une V1a ou d'un prototype V1b, qui ont le même aspect ; aucune photo d'une V1a identifiée avec certitude n'est encore disponible.

</Release>
</ReleaseTabs>

## Schéma bloc

<ReleaseTabs>
<Release releases="v1a v1b">

![Schéma bloc de la STeaMi V1b : STM32WB55RG relié à l'écran OLED SSD1327 en SPI1, aux capteurs du bus I2C1 (dont WSEN-PADS, WSEN-HIDS et APDS-9960), au STM32F103 DAPLink, au micro-USB et à la flash W25Q64](/img/hardware/block-diagram.svg)

Ce schéma bloc représente la V1b (indice B1), dont l'architecture est commune à la V1a. Ses blocs ne sont pas cliquables. Les différences avec la V1c sont détaillées dans [Révisions](./revisions).

</Release>
<Release releases="v1c">

<DiagrammeCliquable src="/img/diagrams/architecture-v1c.svg" width={800} height={1232} alt="Schéma bloc de la STeaMi V1c : STM32WB55RG relié à l'écran GC9A01 en SPI1, aux LED, aux boutons, au buzzer, au micro IMP34DT05 et, par le bus I2C1, aux capteurs ISM330DLC, LIS2MDL, VL53L1X et BME280, à la jauge BQ27441 et à l'expandeur MCP23009 ; STM32F103 DAPLink relié à l'USB-C, à la flash W25Q64 et au port SWD J8 ; chaîne d'alimentation BQ24075, DIO7003, TPS63000, LD3985 et AP3015" />

Les deux microcontrôleurs sont reliés par une liaison série (console), par le SWD (programmation du STM32WB55 par DAPLink) et par le bus I2C1 (pont DAPLink à l'adresse 0x3B). Côté alimentation (feuilles FP4 et FP14 de l'indice C), la sortie du chargeur BQ24075 alimente le convertisseur TPS63000 (+3V3 de la carte) par l'interrupteur DIO7003, et le régulateur LD3985 (+3V3_STLINK du STM32F103 et de la flash). L'élévateur AP3015 tire du +3V3 le 5 V des connecteurs Jacdac.

</Release>
</ReleaseTabs>

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

Les capteurs I2C sont reliés au bus I2C1 interne ; certains (VL53L1X, ISM330DLC, LIS2MDL) disposent de lignes d'interruption individuelles. Les capteurs d'environnement et de lumière dépendent de la release.

<ReleaseTabs>
<Release releases="v1a v1b">

| Capteur                 | Modèle                                                                                                                  | Mesures                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Accéléromètre/Gyroscope | [ISM330DLC](https://www.st.com/en/mems-and-sensors/ism330dlc.html)                                                      | 6 axes + température           |
| Magnétomètre            | [LIS2MDL](https://www.st.com/en/mems-and-sensors/lis2mdl.html)                                                          | 3 axes magnétiques             |
| Distance                | [VL53L1X](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html)                                           | Time-of-Flight, 0-4 m          |
| Pression                | [WSEN-PADS](https://www.we-online.com/en/components/products/WSEN-PADS_1)                                               | 26-126 kPa, 24 bits            |
| Humidité/Température    | [WSEN-HIDS](https://www.we-online.com/en/components/products/WSEN-HIDS_1)                                               | RH + °C                        |
| Lumière/Geste           | [APDS-9960](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) | ALS, couleur, proximité, geste |
| Microphone              | [IMP34DT05](https://www.st.com/en/mems-and-sensors/imp34dt05.html)                                                      | PDM MEMS omnidirectionnel      |

Pour la V1a, les capteurs d'environnement et de lumière réellement montés restent à confirmer (voir [Révisions](./revisions#capteurs-internes)).

</Release>
<Release releases="v1c">

| Capteur                       | Modèle                                                                        | Mesures                         |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| Accéléromètre/Gyroscope       | [ISM330DLC](https://www.st.com/en/mems-and-sensors/ism330dlc.html)            | 6 axes + température            |
| Magnétomètre                  | [LIS2MDL](https://www.st.com/en/mems-and-sensors/lis2mdl.html)                | 3 axes magnétiques              |
| Distance                      | [VL53L1X](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html) | Time-of-Flight, 0-4 m           |
| Pression/Humidité/Température | [BME280](./main-components/sensors/bme280)                                    | Pression, RH, °C (adresse 0x76) |
| Microphone                    | [IMP34DT05](https://www.st.com/en/mems-and-sensors/imp34dt05.html)            | PDM MEMS omnidirectionnel       |

La V1c n'a pas de capteur de lumière, de couleur ni de geste.

</Release>
</ReleaseTabs>

| Caractéristique | Détail                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bus I2C         | I2C1 — SCL: PB8, SDA: PB9 (STM32WB55)                                                                                                                                |
| Plus d'infos    | [Conception — Capteurs](../design/sensors), [Schéma — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

### Écran

L'écran rond est connecté au processeur applicatif via SPI1 ; son modèle dépend de la release (voir [Écran](./main-components/display)).

<ReleaseTabs>
<Release releases="v1a v1b">

| Caractéristique | Détail                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | Winstar WEO128128BWPP3N00001                                                                                                                                                                  |
| Contrôleur      | SSD1327                                                                                                                                                                                       |
| Technologie     | OLED rond (blanc)                                                                                                                                                                             |
| Résolution      | 128 x 128 pixels                                                                                                                                                                              |
| Interface       | SPI1 (interne)                                                                                                                                                                                |
| Connecteur      | FFC/FPC 24 positions, pas 0.50 mm                                                                                                                                                             |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc) |

</Release>
<Release releases="v1c">

| Caractéristique | Détail                                                         |
| --------------- | -------------------------------------------------------------- |
| Modèle          | Winstar WF0128BTYAA4DNN0                                       |
| Contrôleur      | GC9A01                                                         |
| Technologie     | TFT IPS rond, rétroéclairage LED                               |
| Résolution      | 240 x 240 pixels, couleur                                      |
| Interface       | SPI1 (interne)                                                 |
| Connecteur      | FFC/FPC 18 positions                                           |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface) |

</Release>
</ReleaseTabs>

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

La carte dispose de 7 boutons utilisateur (4 directions + A + B + Menu) plus un bouton Reset. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour économiser des broches MCU.

| Bouton                            | Composant                                     | Connexion              |
| --------------------------------- | --------------------------------------------- | ---------------------- |
| D-pad (haut, bas, gauche, droite) | ALPS SKRHABE010                               | Via MCP23009 (GP4-GP7) |
| A                                 | C&K PTS647SM38SMTR2LFS (SW5)                  | PA7 (direct GPIO)      |
| B                                 | C&K PTS647SM38SMTR2LFS (SW4)                  | PA8 (direct GPIO)      |
| Menu                              | C&K PTS647SM38SMTR2LFS (SW3)                  | PA0 (broche wake)      |
| Reset                             | C&K PTS636 SM25J SMTR LFS (SW1), face arrière | NRST                   |

| Caractéristique            | Détail                                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull-up                    | Résistances pull-up externes sur tous les boutons                                                                                                                                         |
| Menu — fonction secondaire | Réveil basse consommation, appairage BLE (appui long)                                                                                                                                     |
| Plus d'infos               | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP9](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP9-Bouton_de_controle.SchDoc) |

### Sortie audio

| Caractéristique | Détail                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modèle          | [PUI Audio SMT-0825-S-HT-R](https://puiaudio.com/product/transducers/smt-0825-s-ht-r)                                                                                                 |
| Type            | Transducteur piézo SMD                                                                                                                                                                |
| Tension         | 3.6V pic-à-pic                                                                                                                                                                        |
| Signal          | BEEPER_OUT → PA11 (STM32WB55)                                                                                                                                                         |
| Alimentation    | +3V3, commandé par le transistor T2                                                                                                                                                   |
| Plus d'infos    | [Conception — Interface utilisateur](../design/user-interface), [Schéma — FP10](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP10-Sortie_Audio.SchDoc) |

### Connecteurs

La carte offre plusieurs options de connectivité externe pour les capteurs, actionneurs et accessoires.

| Connecteur     | Type                                                                                    | Signaux                          |
| -------------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| Edge connector | Compatible micro:bit, P0-P20                                                            | GPIO, analogique, SPI, I2C, PWM  |
| STEMMA/Qwiic   | 2x JST 4-pin : PH, pas 2 mm (V1a, V1b) ; SH, pas 1 mm (V1c)                             | I2C3 (SCL: PC0, SDA: PC1)        |
| Jacdac         | Interface série                                                                         | USART1 (PB6/PB7, net UART2), 5V  |
| Pads crocodile | P0, P1, P2 + P24-P29 + 3V3/GND                                                          | Analogique + GPIO (via MCP23009) |
| SWD (J8)       | Pas de 1,27 mm : 1 rangée de 5 trous (V1b, V1c) ; 2 × 5 pastilles, dont 5 reliées (V1a) | GND, VREF, SWDIO, NRST, SWCLK    |

| Caractéristique | Détail                                                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bus SPI externe | SPI2 — SCK: PB13, MISO: PB14, MOSI: PB15                                                                                                                                                                                           |
| Plus d'infos    | [Pin Mapping — Edge connector](./pin-mapping/edge-connector), [Conception — Capteurs](../design/sensors), [Schéma — FP13](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP13-Port_Specifique.SchDoc) |

### Alimentation

Le système de gestion de l'alimentation fournit les différentes tensions à partir du 5V USB ou de la batterie LiPo 3.7V.

| Caractéristique         | Détail                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Convertisseur principal | [TPS63000DRCT](https://www.ti.com/product/TPS63000) (buck-boost) — 3.3V @ 1200 mA                                                                                 |
| Régulateur linéaire     | LD3985M33R — 3.3V @ 150 mA                                                                                                                                        |
| Boost écran OLED        | [LMR62421](https://www.ti.com/product/LMR62421) — 14.5V @ 100 mA (V1a et V1b ; retiré sur la V1c)                                                                 |
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
| Connecteur USB  | Micro-USB (V1a, V1b) ; USB-C (V1c)                                                                                                                                                                                                                              |
| Cœur            | ARM Cortex-M3 @ 72 MHz                                                                                                                                                                                                                                          |
| Flash           | 128 Ko                                                                                                                                                                                                                                                          |
| Firmware        | DAPLink                                                                                                                                                                                                                                                         |
| Horloge         | Quartz 8 MHz                                                                                                                                                                                                                                                    |
| USB HID         | CMSIS-DAP (débogage)                                                                                                                                                                                                                                            |
| USB CDC         | Port série virtuel                                                                                                                                                                                                                                              |
| Console série   | USART2 (PA2/PA3) relié au LPUART1 du STM32WB55 (TX: PB11, RX: PB10), net `T_UART2` : REPL MicroPython, `Serial` en Arduino                                                                                                                                      |
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
