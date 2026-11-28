---
sidebar_position: 2
title: 'STEMMA/Qwiic'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Connecteur STEMMA/Qwiic

Deux connecteurs JST 4 broches (J3, J4) pour capteurs I2C externes. Leur type dépend de la release : seuls ceux de la V1c acceptent directement les câbles de l'écosystème Adafruit STEMMA QT et SparkFun Qwiic.

## Caractéristiques

<ReleaseTabs>
<Release releases="v1a v1b">

| Caractéristique | Détail                                                               |
| --------------- | -------------------------------------------------------------------- |
| Type            | JST PH 4 broches, pas 2 mm (S4B-PH-SM4-TB)                           |
| Nombre          | 2                                                                    |
| Bus             | I2C3 (SCL: PC0, SDA: PC1)                                            |
| Compatibilité   | Câbles JST PH 4 broches ; adaptateur nécessaire pour Qwiic/STEMMA QT |

Les connecteurs JST PH ne respectent pas l'exigence FCT-52, qui demande un connecteur Qwiic/STEMMA QT (voir [Révisions](../../revisions#écarts-aux-exigences)).

</Release>
<Release releases="v1c">

| Caractéristique | Détail                                     |
| --------------- | ------------------------------------------ |
| Type            | JST SH 4 broches, pas 1 mm (SM04B-SRSS-TB) |
| Nombre          | 2                                          |
| Bus             | I2C3 (SCL: PC0, SDA: PC1)                  |
| Compatibilité   | Câbles Qwiic / STEMMA QT                   |

</Release>
</ReleaseTabs>

## Branchement d'un capteur externe

[![Schéma de branchement STEMMA QT / Qwiic de la STeaMi V1c : J3 et J4 en parallèle sur le bus I2C3 (PC1 SDA, PC0 SCL) et le 3V3 ; un câble Qwiic relie J3 à un module capteur, chaîné à un second ; brochage 1 GND, 2 3V3, 3 SDA, 4 SCL](/img/diagrams/branchement-stemma-qwiic.svg)](pathname:///img/diagrams/branchement-stemma-qwiic.svg)

J3 et J4 sont câblés en parallèle : un module se branche sur l'un ou l'autre, et les deux peuvent servir en même temps. Le brochage est le même pour les trois releases :

| Broche | Signal | Pin STM32WB55 | Fil d'un câble Qwiic |
| ------ | ------ | ------------- | -------------------- |
| 1      | GND    | -             | noir                 |
| 2      | 3V3    | -             | rouge                |
| 3      | SDA    | PC1           | bleu                 |
| 4      | SCL    | PC0           | jaune                |

- L'I2C3 est le second bus I2C du STM32WB55, réservé aux capteurs externes par l'exigence FCT-52 ; les capteurs de la carte sont sur l'[I2C1](../../pin-mapping/internal-bus).
- La carte n'a pas de résistance de pull-up sur l'I2C3 : celles des modules STEMMA QT / Qwiic tirent SDA et SCL au 3V3.
- Pour chaîner plusieurs modules (de la sortie de l'un à l'entrée du suivant), leurs adresses I2C doivent être différentes.
- L'I2C3 sort aussi sur les broches P19 (SCL) et P20 (SDA) du [connecteur edge](../../pin-mapping/edge-connector#broches-i2c-i2c3).

## Voir aussi

- [Pin Mapping — Connecteurs externes](../../pin-mapping/external-connectors)
- [Tous les connecteurs](./)
