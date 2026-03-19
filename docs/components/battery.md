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
- **Integration** : Peut etre fixee a l'arriere de la carte (voir exigence PHY-03)
- **Connecteur** : Amphenol 10114830-10102LF (header SMD 2 positions, pas 1.25 mm)

## Autonomie

- **Mode standard** : environ 1 jour (voir exigence FCT-06)
- **Mode basse consommation** : 5 a 10 jours (voir exigence FCT-07)

## Gestion

- **Chargeur** : Texas Instruments BQ24075RGT (via micro-USB, 500 mA minimum)
- **Jauge** : Texas Instruments BQ27441DRZR-G1A (mesure I2C de l'etat de charge)
