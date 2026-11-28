---
sidebar_position: 12
title: 'Batterie'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Batterie

| Composant                   | Description                 | Qte |
| --------------------------- | --------------------------- | --- |
| Polymer Lithium-Ion Battery | Batterie LiPo 3.7V 1600 mAh | 1   |

## Référence

La batterie ne figure pas dans la [nomenclature B1 publiée](https://github.com/steamicc/steami-reference-design/blob/main/Manufacturing/BOM/STeaMi-BOM.csv).

<ReleaseTabs>
<Release releases="v1b">

La documentation de conception de l'indice B1 donne la batterie **ACCU-LP903450** (Cellevia LP903450, 3,7 V, 1600 mAh), au repère BAT1. Sa fiche technique est la [fiche CEL0009](https://www.tme.eu/Document/01754da9c4096903311446f0fa7edecb/cel0009.pdf) du distributeur TME.

</Release>
<Release releases="v1a v1c">

La référence de la batterie n'est pas documentée pour cette release. Pour la V1b, la documentation de conception de l'indice B1 donne la batterie ACCU-LP903450 (Cellevia LP903450, 3,7 V, 1600 mAh) : voir l'onglet V1b.

</Release>
</ReleaseTabs>

## Caractéristiques

- **Technologie** : Lithium-Polymère (LiPo)
- **Tension nominale** : 3.7V
- **Capacité** : 1600 mAh
- **Intégration** : Peut être fixée à l'arrière de la carte
- **Connecteur** : Amphenol 10114830-10102LF (header SMD 2 positions, pas 1.25 mm)

## Autonomie

- **Mode standard** : environ 1 jour (cf. [FCT-06](../../design/power))
- **Mode basse consommation** : 5 à 10 jours (cf. [FCT-07](../../design/power))

## Gestion

- **Chargeur** : [BQ24075RGT](../main-components/power/bq24075) (par le connecteur USB J2 : micro-USB sur la V1a et la V1b, USB-C sur la V1c ; 500 mA minimum)
- **Jauge** : [BQ27441DRZR-G1A](../main-components/power/bq27441) (mesure I2C de l'état de charge)

## Voir aussi

- [Alimentation](../main-components/power/) — chaîne d'alimentation complète
- [Conception — Alimentation](../../design/power)
