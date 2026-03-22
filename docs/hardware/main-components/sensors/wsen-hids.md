---
sidebar_position: 5
title: 'WSEN-HIDS'
---

# Capteur d'humidite et temperature — WSEN-HIDS

Capteur double mesurant l'humidite relative et la temperature ambiante.

## Caracteristiques

| Caracteristique | Detail                                                                        |
| --------------- | ----------------------------------------------------------------------------- |
| Modele          | [2525020210001](https://www.we-online.com/en/components/products/WSEN-HIDS_1) |
| Fabricant       | Wurth Elektronik                                                              |
| Mesures         | Humidite relative + temperature                                               |
| Interface       | I2C / SPI                                                                     |
| Datasheet       | [WSEN-HIDS](https://www.we-online.com/en/components/products/WSEN-HIDS_1)     |

:::tip
Le capteur de temperature doit etre thermiquement eloigne de tout composant chauffant pour garantir la precision des mesures.
:::

## Schemas

[![Schema FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schema Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Driver MicroPython — wsen-hids](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids)
- [Tous les capteurs](./)
