---
sidebar_position: 3
title: 'Capteurs'
---

# Capteurs internes

La carte STeaMi integre 7 capteurs couvrant distance, mouvement, environnement, lumiere et son. Les capteurs I2C sont regroupes sur le bus I2C1 interne ; certains disposent de lignes d'interruption individuelles.

## Bus I2C interne

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB6           |
| I2C1_SDA | PB9           | PB7           |

## Liste des capteurs

| Capteur                                | Modele    | Mesures                        | Page                    |
| -------------------------------------- | --------- | ------------------------------ | ----------------------- |
| [Accelerometre/Gyroscope](./ism330dlc) | ISM330DLC | 6 axes + temperature           | [Detail →](./ism330dlc) |
| [Magnetometre](./lis2mdl)              | LIS2MDL   | 3 axes magnetiques             | [Detail →](./lis2mdl)   |
| [Distance](./vl53l1x)                  | VL53L1X   | Time-of-Flight, 0-4 m          | [Detail →](./vl53l1x)   |
| [Pression](./wsen-pads)                | WSEN-PADS | 26-126 kPa, 24 bits            | [Detail →](./wsen-pads) |
| [Humidite/Temperature](./wsen-hids)    | WSEN-HIDS | RH + °C                        | [Detail →](./wsen-hids) |
| [Lumiere/Geste](./apds9960)            | APDS-9960 | ALS, couleur, proximite, geste | [Detail →](./apds9960)  |
| [Microphone](./imp34dt05)              | IMP34DT05 | PDM MEMS omnidirectionnel      | [Detail →](./imp34dt05) |

## Schemas

[![Schema FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schema Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Conception — Capteurs](../../../design/sensors)
- [Pin Mapping — Bus internes](../../pin-mapping/internal-bus)
- [Vue d'ensemble du materiel](../../)
