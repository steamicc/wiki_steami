---
sidebar_position: 12
title: "Batterie"
---

# Batterie

| Composant | Description | Qte |
|-----------|-------------|-----|
| Polymer Lithium-Ion Battery | Batterie LiPo 3.7V 1600 mAh | 1 |

## Caracteristiques

- **Technologie** : Lithium-Polymere (LiPo)
- **Tension nominale** : 3.7V
- **Capacite** : 1600 mAh
- **Integration** : Peut etre fixee a l'arriere de la carte
- **Connecteur** : Amphenol 10114830-10102LF (header SMD 2 positions, pas 1.25 mm)

## Autonomie

- **Mode standard** : environ 1 jour
- **Mode basse consommation** : 5 a 10 jours

## Gestion

- **Chargeur** : [BQ24075RGT](../main-components/power/bq24075) (via micro-USB, 500 mA minimum)
- **Jauge** : [BQ27441DRZR-G1A](../main-components/power/bq27441) (mesure I2C de l'etat de charge)

## Voir aussi

- [Alimentation](../main-components/power/) — chaine d'alimentation complete
- [Conception — Alimentation](../../design/power)
