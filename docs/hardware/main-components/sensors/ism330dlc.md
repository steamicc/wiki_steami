---
sidebar_position: 1
title: 'ISM330DLC'
---

# Accelerometre / Gyroscope — ISM330DLC

IMU 6 axes mesurant acceleration, rotation et temperature. L'orientation de l'IMU doit etre alignee avec le magnetometre LIS2MDL pour la fusion de donnees.

## Caracteristiques

| Caracteristique | Detail                                                               |
| --------------- | -------------------------------------------------------------------- |
| Modele          | [ISM330DLCTR](https://www.st.com/en/mems-and-sensors/ism330dlc.html) |
| Fabricant       | STMicroelectronics                                                   |
| Type            | 6 axes (accelerometre + gyroscope + temperature)                     |
| Interface       | I2C / SPI                                                            |
| Interruption    | INT_ACC → PC13                                                       |
| Boitier         | LGA-14 (2.5x3)                                                       |
| Datasheet       | [PDF](https://www.st.com/resource/en/datasheet/ism330dlc.pdf)        |

## Schemas

[![Schema FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schema Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Driver MicroPython — ism330dl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl)
- [Magnetometre LIS2MDL](./lis2mdl) — alignement IMU requis
- [Tous les capteurs](./)
