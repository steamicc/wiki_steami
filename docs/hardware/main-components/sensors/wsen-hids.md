---
sidebar_position: 5
title: 'WSEN-HIDS'
---

# Capteur d'humidité et température — WSEN-HIDS

Capteur double mesurant l'humidité relative et la température ambiante.

## Caractéristiques

| Caractéristique | Détail                                                                        |
| --------------- | ----------------------------------------------------------------------------- |
| Modèle          | [2525020210001](https://www.we-online.com/en/components/products/WSEN-HIDS_1) |
| Fabricant       | Wurth Elektronik                                                              |
| Mesures         | Humidité relative + température                                               |
| Interface       | I2C / SPI                                                                     |
| Datasheet       | [WSEN-HIDS](https://www.we-online.com/en/components/products/WSEN-HIDS_1)     |

:::tip
Le capteur de température doit être thermiquement éloigné de tout composant chauffant pour garantir la précision des mesures.
:::

## Schémas

[![Schéma FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schéma Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Driver MicroPython — wsen-hids](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids)
- [Tous les capteurs](./)
