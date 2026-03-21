---
sidebar_position: 3
title: "Capteurs"
---

# Capteurs internes

La carte STeaMi integre 7 capteurs couvrant distance, mouvement, environnement, lumiere et son. Les capteurs I2C sont regroupes sur le bus I2C1 interne ; certains disposent de lignes d'interruption individuelles.

## Bus I2C interne

| Signal | Pin STM32WB55 | Pin STM32F103 |
|--------|---------------|---------------|
| I2C1_SCL | PB8 | PB6 |
| I2C1_SDA | PB9 | PB7 |

## Accelerometre / Gyroscope — ISM330DLC

IMU 6 axes mesurant acceleration, rotation et temperature. L'orientation de l'IMU doit etre alignee avec le magnetometre LIS2MDL pour la fusion de donnees.

| Caracteristique | Detail |
|---|---|
| Modele | [ISM330DLCTR](https://www.st.com/en/mems-and-sensors/ism330dlc.html) |
| Fabricant | STMicroelectronics |
| Type | 6 axes (accelerometre + gyroscope + temperature) |
| Interface | I2C / SPI |
| Interruption | INT_ACC → PC13 |
| Boitier | LGA-14 (2.5x3) |
| Datasheet | [PDF](https://www.st.com/resource/en/datasheet/ism330dlc.pdf) |
| Driver MicroPython | [ism330dl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl) |
| Schema | [FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

## Magnetometre — LIS2MDL

Magnetometre 3 axes magnetoresistif pour la mesure du champ magnetique et le calcul de cap (boussole).

| Caracteristique | Detail |
|---|---|
| Modele | [LIS2MDLTR](https://www.st.com/en/mems-and-sensors/lis2mdl.html) |
| Fabricant | STMicroelectronics |
| Type | 3 axes magnetoresistif |
| Interface | I2C |
| Interruption | INT_MAG → PD1 |
| Boitier | 12-LGA (2x2) |
| Datasheet | [PDF](https://www.st.com/resource/en/datasheet/lis2mdl.pdf) |
| Driver MicroPython | [lis2mdl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl) |
| Schema | [FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

:::info
L'orientation des deux capteurs de l'IMU (ISM330DLC et LIS2MDL) doit etre alignee pour permettre la fusion de donnees et le calcul de cap.
:::

## Capteur de distance — VL53L1X

Capteur de distance Time-of-Flight (ToF) utilisant un laser infrarouge.

| Caracteristique | Detail |
|---|---|
| Modele | [VL53L1CXV0FY/1](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html) |
| Fabricant | STMicroelectronics |
| Type | Time-of-Flight (ToF) |
| Portee | Jusqu'a 4 m |
| Interface | I2C |
| Interruption | INT_DIST → PB12 |
| Datasheet | [PDF](https://www.st.com/resource/en/datasheet/vl53l1x.pdf) |
| Driver MicroPython | [vl53l1x](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x) |
| Schema | [FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

## Capteur de pression — WSEN-PADS

Capteur de pression absolue avec haute resolution 24 bits. Permet de mesurer la pression atmospherique et d'estimer l'altitude.

| Caracteristique | Detail |
|---|---|
| Modele | [2511020213301](https://www.we-online.com/en/components/products/WSEN-PADS) |
| Fabricant | Wurth Elektronik |
| Plage | 26 kPa a 126 kPa (absolu) |
| Resolution | 24 bits |
| Interface | I2C / SPI |
| Boitier | 10-WFLGA |
| Datasheet | [WSEN-PADS](https://www.we-online.com/en/components/products/WSEN-PADS) |
| Driver MicroPython | [wsen-pads](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads) |
| Schema | [FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

## Capteur d'humidite et temperature — WSEN-HIDS

Capteur double mesurant l'humidite relative et la temperature ambiante.

| Caracteristique | Detail |
|---|---|
| Modele | [2525020210001](https://www.we-online.com/en/components/products/WSEN-HIDS) |
| Fabricant | Wurth Elektronik |
| Mesures | Humidite relative + temperature |
| Interface | I2C / SPI |
| Datasheet | [WSEN-HIDS](https://www.we-online.com/en/components/products/WSEN-HIDS) |
| Driver MicroPython | [wsen-hids](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids) |
| Schema | [FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

:::tip
Le capteur de temperature doit etre thermiquement eloigne de tout composant chauffant pour garantir la precision des mesures.
:::

## Capteur de lumiere, couleur et geste — APDS-9960

Capteur multifonction combinant mesure de lumiere ambiante, detection de couleur, detection de geste et proximite.

| Caracteristique | Detail |
|---|---|
| Modele | [APDS-9960](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) |
| Fabricant | Broadcom |
| Fonctions | Lumiere ambiante (560 nm), couleur RGB, geste, proximite |
| Interface | I2C |
| Boitier | 8-SMD |
| Datasheet | [APDS-9960](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) |
| Driver MicroPython | [apds9960](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/apds9960) |
| Schema | [FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc) |

## Microphone — IMP34DT05

Microphone MEMS avec sortie numerique PDM (Pulse Density Modulation).

| Caracteristique | Detail |
|---|---|
| Modele | [IMP34DT05](https://www.st.com/en/mems-and-sensors/imp34dt05.html) |
| Fabricant | STMicroelectronics |
| Type | MEMS PDM omnidirectionnel |
| Application | Industrielle (haute qualite) |
| Signal data | MIC_IN (MICRO_DATA) → PA10 |
| Signal clock | MIC_CLK (MICRO_CLK) → PA3 |
| Datasheet | [PDF](https://www.st.com/resource/en/datasheet/imp34dt05.pdf) |
| Schema | [FP5](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP5-Microphone.SchDoc) |

## Voir aussi

- [Conception — Capteurs](../../design/sensors)
- [Pin Mapping — Bus internes](../pin-mapping/internal-bus)
- [Vue d'ensemble du materiel](../)
