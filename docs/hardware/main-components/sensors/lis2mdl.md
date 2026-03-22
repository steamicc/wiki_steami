---
sidebar_position: 2
title: 'LIS2MDL'
---

# Magnetometre — LIS2MDL

Magnetometre 3 axes magnetoresistif pour la mesure du champ magnetique et le calcul de cap (boussole).

## Caracteristiques

| Caracteristique | Detail                                                           |
| --------------- | ---------------------------------------------------------------- |
| Modele          | [LIS2MDLTR](https://www.st.com/en/mems-and-sensors/lis2mdl.html) |
| Fabricant       | STMicroelectronics                                               |
| Type            | 3 axes magnetoresistif                                           |
| Interface       | I2C                                                              |
| Interruption    | INT_MAG → PD1                                                    |
| Boitier         | 12-LGA (2x2)                                                     |
| Datasheet       | [PDF](https://www.st.com/resource/en/datasheet/lis2mdl.pdf)      |

:::info
L'orientation des deux capteurs de l'IMU (ISM330DLC et LIS2MDL) doit etre alignee pour permettre la fusion de donnees et le calcul de cap.
:::

## Schemas

[![Schema FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schema Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Driver MicroPython — lis2mdl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl)
- [Accelerometre ISM330DLC](./ism330dlc) — alignement IMU requis
- [Tous les capteurs](./)
