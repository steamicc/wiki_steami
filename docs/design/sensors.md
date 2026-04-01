---
sidebar_position: 6
title: 'Capteurs'
---

# Capteurs

## Exigences — Capteurs internes

| ID     | Nom                                  | Description                                                                            | Implémentation                         |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------- |
| FCT-40 | Magnetometer (LIS2MDL)               | Le système doit intégrer un magnétomètre (LIS2MDL).                                    | LIS2MDLTR (I2C, INT_MAG → PD1)         |
| FCT-41 | Distance (VL53L1X)                   | Le système doit intégrer un capteur de distance (VL53L1X).                             | VL53L1CXV0FY/1 (I2C, INT_DIST → PB12)  |
| FCT-42 | PDM MEMS Microphone                  | Le système doit intégrer un microphone MEMS PDM (MP34DT01 / IMP34DT05).                | IMP34DT05 (PDM, PA10/PA3)              |
| FCT-43 | Light, Color, Gesture (APDS9960)     | Le système doit intégrer un capteur de lumière, couleur et geste (APDS9960).           | APDS-9960 (I2C)                        |
| FCT-44 | Barometer (LPS22HH)                  | Le système doit intégrer un baromètre (LPS22HH / WSEN-PADS).                           | WSEN-PADS 2511020213301 (I2C)          |
| FCT-45 | Humidity and temperature (HTS221)    | Le système doit intégrer un capteur d'humidité et de température (HTS221 / WSEN-HIDS). | WSEN-HIDS 2525020210001 (I2C)          |
| FCT-46 | Humidity and temperature - Isolation | Le capteur de température doit être thermiquement éloigné de tout composant chauffant. | Placement PCB isolé                    |
| FCT-47 | Accel/Gyro (LSM6DS33)                | Le système doit intégrer un accéléromètre/gyroscope (LSM6DS33 / ISM330DLC).            | ISM330DLCTR (I2C, INT_ACC → PC13)      |
| FCT-48 | IMU alignment                        | L'orientation des deux capteurs de l'IMU doit être alignée.                            | Alignement ISM330DLC + LIS2MDL sur PCB |

## Exigences — Capteurs et connecteurs externes

| ID        | Nom                                 | Description                                                                                | Implémentation                                |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| FCT-49    | GPIO - Micro:bit edge connector     | Le système doit fournir un connecteur externe similaire au connecteur edge du micro:bit.   | Connecteur edge P0-P20                        |
| FCT-50    | GPIO - Alligator-clip friendly pins | Le système doit fournir des broches d'entrée/sortie compatibles avec les pinces crocodile. | Pads P0, P1, P2, P24, P25, P28, P29, 3V3, GND |
| FCT-50bis | GPIO                                | Les broches du MCU non utilisées doivent être routées vers des pads du PCB.                | Pads PCB + MCP23009                           |
| FCT-51    | UART                                | Le système doit intégrer des pads sur le PCB pour les signaux UART.                        | SERIAL_TX (PB11), SERIAL_RX (PB10)            |
| FCT-52    | I2C - Qwiic/STEMMA QT               | Le système doit intégrer un connecteur Qwiic/STEMMA QT pour les signaux I2C.               | 2x JST 4-pin sur I2C3 (PC0/PC1)               |
| FCT-53    | SPI                                 | Le système doit intégrer des pads sur le PCB pour les signaux SPI.                         | SPI2 sur edge connector (PB13/PB14/PB15)      |
| FCT-54    | RTC                                 | Le système doit intégrer une horloge temps réel (RTC).                                     | RTC intégré au STM32WB55 (quartz 32 KHz)      |

## Choix de conception

### Capteurs internes (FP12)

La carte intègre 7 capteurs embarqués couvrant distance, mouvement, environnement et lumière. Les capteurs I2C sont regroupés sur un bus interne commun ; certains disposent de lignes d'interruption individuelles (VL53L1X, ISM330DLC, LIS2MDL).

#### Capteur de distance — VL53L1X

- **Composant** : STMicroelectronics VL53L1CXV0FY/1
- **Type** : Time-of-Flight (ToF)
- **Portée** : jusqu'à 4 m
- **Interface** : I2C
- **Interruption** : INT_DIST → PB12

#### Accéléromètre / Gyroscope — ISM330DLC

- **Composant** : STMicroelectronics ISM330DLCTR
- **Axes** : 6 axes (accéléromètre + gyroscope + température)
- **Interface** : I2C, SPI
- **Interruption** : INT_ACC → PC13

#### Magnétomètre — LIS2MDL

- **Composant** : STMicroelectronics LIS2MDLTR
- **Axes** : X, Y, Z
- **Type** : Magnétorésistif
- **Interface** : I2C
- **Interruption** : INT_MAG → PD1
- **Boîtier** : 12-LGA (2x2)

:::info
L'orientation des deux capteurs de l'IMU (ISM330DLC et LIS2MDL) doit être alignée pour permettre la fusion de données et le calcul de cap.
:::

#### Capteur de pression — WSEN-PADS

- **Composant** : Wurth Elektronik 2511020213301
- **Plage** : 26 kPa à 126 kPa (absolu)
- **Résolution** : 24 bits
- **Interface** : I2C, SPI
- **Boîtier** : 10-WFLGA

#### Capteur d'humidité et température — WSEN-HIDS

- **Composant** : Wurth Elektronik 2525020210001
- **Mesures** : Humidité + Température
- **Interface** : I2C, SPI

:::tip
Le capteur de température doit être thermiquement éloigné de tout composant chauffant pour garantir la précision des mesures.
:::

#### Capteur de luminosité, couleur et geste — APDS-9960

- **Composant** : Broadcom APDS-9960
- **Fonctions** : Lumière ambiante (560 nm), couleur, détection de geste, proximité
- **Interface** : I2C
- **Boîtier** : 8-SMD

### Microphone (FP5)

- **Composant** : STMicroelectronics IMP34DT05
- **Type** : Microphone MEMS PDM (Pulse Density Modulation)
- **Application** : Industrielle (haute qualité)
- **Directivité** : Omnidirectionnel
- **Signaux** :
  - `MIC_IN` (MICRO_DATA) → PA10 (STM32WB55)
  - `MIC_CLK` (MICRO_CLK) → PA3 (STM32WB55)

### Bus I2C interne

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB6           |
| I2C1_SDA | PB9           | PB7           |

### Extension GPIO (FP7)

L'expandeur MCP23009 fournit 8 GPIO supplémentaires, utilisés pour les boutons directionnels et les pads crocodile.

- **Composant** : Microchip MCP23009-E/MG
- **Interface** : I2C (bus interne I2C1)

| Broche MCP23009 | Pin STeaMi   | Fonction                   |
| --------------- | ------------ | -------------------------- |
| GP0             | P28          | GPIO1 (pad crocodile)      |
| GP1             | P29          | GPIO2 (pad crocodile)      |
| GP2             | P24          | GPIO3 (pad crocodile)      |
| GP3             | P25          | GPIO4 (pad crocodile)      |
| GP4             | RIGHT_BUTTON | Bouton directionnel droit  |
| GP5             | DOWN_BUTTON  | Bouton directionnel bas    |
| GP6             | LEFT_BUTTON  | Bouton directionnel gauche |
| GP7             | UP_BUTTON    | Bouton directionnel haut   |

**Signaux de contrôle :**

- **RST_EXPANDER** → PB1 (STM32WB55) : Reset de l'expandeur
- **INT_EXPANDER** → PB0 (STM32WB55) : Interruption de l'expandeur

### Connecteurs externes (FP13)

#### Connecteur Edge (micro:bit compatible)

Le connecteur edge fournit un accès aux broches P0-P20 avec support pour :

- 6 entrées analogiques (P0-P4, P10)
- GPIO numériques
- SPI (P13-P15)
- I2C (P19-P20)
- PWM (P7, P10, P11)

#### Connecteur STEMMA/Qwiic

Deux connecteurs JST 4 broches (pas 2 mm) pour capteurs I2C externes.

- Bus I2C3 (SCL: PC0, SDA: PC1)

#### Connecteur Jacdac

Interface série pour la connexion de modules Jacdac.

- JACDAC_DATA (UART2_TX/RX) → PB6/PB7
- JACDAC_P : alimentation 5V

#### Pads crocodile

Pads accessibles avec des pinces crocodile autour de la carte :

- P0, P1, P2 : entrées analogiques
- P24, P25, P28, P29 : GPIO via expandeur MCP23009
- 3V3, GND : alimentation

#### Bus SPI externe

| Signal               | Pin STM32WB55 |
| -------------------- | ------------- |
| SPI2_SCK_EDGE (P13)  | PB13          |
| SPI2_MISO_EDGE (P14) | PB14          |
| SPI2_MOSI_EDGE (P15) | PB15          |

#### Bus UART série

| Signal                 | Pin STM32WB55 |
| ---------------------- | ------------- |
| SERIAL_TX (T_UART2_TX) | PB11          |
| SERIAL_RX (T_UART2_RX) | PB10          |

## Voir aussi

- [Hardware](../hardware/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
- [Pin Mapping — Bus internes](../hardware/pin-mapping/internal-bus)
- [Pin Mapping — Edge connector](../hardware/pin-mapping/edge-connector)
- [Pin Mapping — Connecteurs externes](../hardware/pin-mapping/external-connectors)
