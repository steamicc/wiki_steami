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

## Voir aussi

- [Pin Mapping — Connecteurs externes](../../pin-mapping/external-connectors)
- [Tous les connecteurs](./)
