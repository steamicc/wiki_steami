---
sidebar_position: 14
title: "Capteurs internes"
---

# Capteurs internes

**Identifiant** : FP12

La carte integre plusieurs capteurs embarques, tels que des capteurs de distance, d'acceleration, de gyroscope et de magnetometre. Ces capteurs permettent a la carte de detecter les changements environnementaux et les mouvements.

Tous les capteurs internes sont connectes sur le premier bus I2C (I2C1).

## Liste des capteurs

### Capteur de distance - VL53L1X

- **Composant** : STMicroelectronics VL53L1CXV0FY/1
- **Type** : Time-of-Flight (ToF)
- **Portee** : jusqu'a 4 m
- **Interface** : I2C
- **Interruption** : INT_DIST -> PB12

### Accelerometre / Gyroscope - ISM330DLC

- **Composant** : STMicroelectronics ISM330DLCTR
- **Axes** : 6 axes (accelerometre + gyroscope + temperature)
- **Interface** : I2C, SPI
- **Interruption** : INT_ACC -> PC13

### Magnetometre - LIS2MDL

- **Composant** : STMicroelectronics LIS2MDLTR
- **Axes** : X, Y, Z
- **Type** : Magnetoresistif
- **Interface** : I2C
- **Interruption** : INT_MAG -> PD1
- **Boitier** : 12-LGA (2x2)

:::info
L'orientation des deux capteurs de l'IMU (ISM330DLC et LIS2MDL) doit etre alignee.
:::

### Capteur de pression - WSEN-PADS (2511020213301)

- **Composant** : Wurth Elektronik 2511020213301
- **Plage** : 26 kPa a 126 kPa (absolu)
- **Resolution** : 24 bits
- **Interface** : I2C, SPI
- **Boitier** : 10-WFLGA

### Capteur d'humidite et temperature - WSEN-HIDS (2525020210001)

- **Composant** : Wurth Elektronik 2525020210001
- **Mesures** : Humidite + Temperature
- **Interface** : I2C, SPI

:::tip
Le capteur de temperature doit etre thermiquement eloigne de tout composant chauffant.
:::

### Capteur de luminosite, couleur et geste - APDS-9960

- **Composant** : Broadcom APDS-9960
- **Fonctions** : Lumiere ambiante (560 nm), couleur, detection de geste, proximite
- **Interface** : I2C
- **Boitier** : 8-SMD

### Microphone PDM - IMP34DT05

- **Composant** : STMicroelectronics IMP34DT05
- **Type** : MEMS PDM omnidirectionnel
- **Signaux** : MICRO_DATA -> PA10, MICRO_CLK -> PA3

## Bus I2C interne

| Signal | Pin STM32WB55 | Pin STM32F103 |
|--------|---------------|---------------|
| I2C1_SCL | PB8 | PB6 |
| I2C1_SDA | PB9 | PB7 |
