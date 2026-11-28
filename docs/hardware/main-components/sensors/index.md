---
sidebar_position: 3
title: 'Capteurs'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Capteurs internes

La carte STeaMi intègre des capteurs couvrant distance, mouvement, environnement et son, ainsi que la lumière sur la V1a et la V1b. Les capteurs d'environnement dépendent de la release (voir [Révisions](../../revisions#capteurs-internes)). Les capteurs I2C sont regroupés sur le bus I2C1 interne ; certains disposent de lignes d'interruption individuelles.

## Bus I2C interne

<ReleaseTabs>
<Release releases="v1a">

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB6           |
| I2C1_SDA | PB9           | PB7           |

Côté STM32F103, le bus est relié à son I2C1 (feuille FP14 des indices A et A1).

</Release>
<Release releases="v1b v1c">

| Signal   | Pin STM32WB55 | Pin STM32F103 |
| -------- | ------------- | ------------- |
| I2C1_SCL | PB8           | PB10          |
| I2C1_SDA | PB9           | PB11          |

Côté STM32F103, le bus est relié à son I2C2 (bloc « I2C2_STM32F103 = I2C1_STM32WB55 » de la feuille FP14 des indices B1 et C). Le firmware DAPLink de la carte configure bien l'I2C2 sur PB10 et PB11 ([steami_i2c.c](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/board/steami/steami_i2c.c)). PB6 et PB7 portent l'USART1 du F103, relié au port série [J9](../../components/not-fitted.md#notes).

</Release>
</ReleaseTabs>

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
