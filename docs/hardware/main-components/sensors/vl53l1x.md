---
sidebar_position: 3
title: 'VL53L1X'
---

# Capteur de distance — VL53L1X

Capteur de distance Time-of-Flight (ToF) utilisant un laser infrarouge.

## Caracteristiques

| Caracteristique | Detail                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| Modele          | [VL53L1CXV0FY/1](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html) |
| Fabricant       | STMicroelectronics                                                                   |
| Type            | Time-of-Flight (ToF)                                                                 |
| Portee          | Jusqu'a 4 m                                                                          |
| Interface       | I2C                                                                                  |
| Interruption    | INT_DIST → PB12                                                                      |
| Datasheet       | [PDF](https://www.st.com/resource/en/datasheet/vl53l1x.pdf)                          |

## Schemas

[![Schema FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schema Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Driver MicroPython — vl53l1x](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x)
- [Tous les capteurs](./)
