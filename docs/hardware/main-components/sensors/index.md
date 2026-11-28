---
sidebar_position: 3
title: 'Capteurs'
---

# Capteurs internes

La carte STeaMi intègre des capteurs couvrant distance, mouvement, environnement et son, ainsi que la lumière sur la V1a et la V1b. Les capteurs d'environnement dépendent de la release (voir [Révisions](../../revisions#capteurs-internes)). Les capteurs I2C sont regroupés sur le bus I2C1 interne ; certains disposent de lignes d'interruption individuelles.

## Bus I2C interne

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB6           |
| I2C1_SDA | PB9           | PB7           |

Les adresses I2C des capteurs, release par release, sont regroupées dans [Capteurs et bus internes](../../pin-mapping/internal-bus#adresses-i2c).

## Liste des capteurs

| Capteur                                   | Modèle    | Mesures                        | Releases               | Page                    |
| ----------------------------------------- | --------- | ------------------------------ | ---------------------- | ----------------------- |
| [Accéléromètre/Gyroscope](./ism330dlc)    | ISM330DLC | 6 axes + température           | V1a, V1b, V1c          | [Détail →](./ism330dlc) |
| [Magnétomètre](./lis2mdl)                 | LIS2MDL   | 3 axes magnétiques             | V1a, V1b, V1c          | [Détail →](./lis2mdl)   |
| [Distance](./vl53l1x)                     | VL53L1X   | Time-of-Flight, 0-4 m          | V1a, V1b, V1c          | [Détail →](./vl53l1x)   |
| [Pression](./wsen-pads)                   | WSEN-PADS | 26-126 kPa, 24 bits            | V1a (à confirmer), V1b | [Détail →](./wsen-pads) |
| [Humidité/Température](./wsen-hids)       | WSEN-HIDS | RH + °C                        | V1a (à confirmer), V1b | [Détail →](./wsen-hids) |
| [Lumière/Geste](./apds9960)               | APDS-9960 | ALS, couleur, proximité, geste | V1a (à confirmer), V1b | [Détail →](./apds9960)  |
| [Pression/Humidité/Température](./bme280) | BME280    | Pression, RH + °C              | V1c                    | [Détail →](./bme280)    |
| [Microphone](./imp34dt05)                 | IMP34DT05 | PDM MEMS omnidirectionnel      | V1a, V1b, V1c          | [Détail →](./imp34dt05) |

## Schémas

[![Schéma FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schéma Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Conception — Capteurs](../../../design/sensors)
- [Pin Mapping — Bus internes](../../pin-mapping/internal-bus)
- [Vue d'ensemble du matériel](../../)
