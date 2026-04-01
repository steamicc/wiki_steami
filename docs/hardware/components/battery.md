---
sidebar_position: 12
title: 'Batterie'
---

# Batterie

| Composant                   | Description                 | Qte |
| --------------------------- | --------------------------- | --- |
| Polymer Lithium-Ion Battery | Batterie LiPo 3.7V 1600 mAh | 1   |

## Caractéristiques

- **Technologie** : Lithium-Polymère (LiPo)
- **Tension nominale** : 3.7V
- **Capacité** : 1600 mAh
- **Intégration** : Peut être fixée à l'arrière de la carte
- **Connecteur** : Amphenol 10114830-10102LF (header SMD 2 positions, pas 1.25 mm)

## Autonomie

- **Mode standard** : environ 1 jour (cf. [FCT-06](../../design/power))
- **Mode basse consommation** : 5 a 10 jours (cf. [FCT-07](../../design/power))

## Gestion

- **Chargeur** : [BQ24075RGT](../main-components/power/bq24075) (via micro-USB, 500 mA minimum)
- **Jauge** : [BQ27441DRZR-G1A](../main-components/power/bq27441) (mesure I2C de l'état de charge)

## Voir aussi

- [Alimentation](../main-components/power/) — chaîne d'alimentation complète
- [Conception — Alimentation](../../design/power)
