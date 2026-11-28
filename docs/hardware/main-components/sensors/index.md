---
sidebar_position: 3
title: 'Capteurs'
---

# Capteurs internes

La carte STeaMi intègre des capteurs couvrant distance, mouvement, environnement et son, ainsi que la lumière sur la V1a et la V1b. Les capteurs d'environnement dépendent de la release (voir [Révisions](../../revisions#capteurs-internes)). Les capteurs I2C sont regroupés sur le bus I2C1 interne ; certains disposent de lignes d'interruption individuelles.

## Bus I2C interne

| Signal   | Pin STM32WB55 | Pin STM32F103 (V1b, V1c) | Pin STM32F103 (V1a) |
| -------- | ------------- | ------------------------ | ------------------- |
| I2C1_SCL | PB8           | PB10                     | PB6                 |
| I2C1_SDA | PB9           | PB11                     | PB7                 |

Côté STM32F103, le bus arrive sur PB10/PB11 à partir de l'indice B1 (V1b, V1c) : c'est le périphérique I2C2 du STM32F103, relié à l'I2C1 du STM32WB55 (encadré « I2C2_STM32F103 = I2C1_STM32WB55 » de la feuille FP14). Sur ces releases, PB6/PB7 portent USART1_TX/RX vers le connecteur J9. Sur les indices A et A1 (V1a), le bus arrive sur PB6/PB7, l'I2C1 du STM32F103.

Les adresses I2C des capteurs, release par release, sont regroupées dans [Capteurs et bus internes](../../pin-mapping/internal-bus#adresses-i2c), avec un [schéma du bus](../../pin-mapping/internal-bus#bus-i2c-interne-i2c1) qui montre aussi les lignes d'interruption.

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
