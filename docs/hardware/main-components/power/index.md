---
sidebar_position: 5
title: "Alimentation"
---

# Alimentation

Le systeme de gestion de l'alimentation fournit les differentes tensions a partir du 5V USB ou de la batterie LiPo 3.7V.

## Sous-systemes

| Composant | Fonction | Page |
|-----------|----------|------|
| Batterie LiPo | 3.7V 1600 mAh | Ci-dessous |
| [Chargeur BQ24075](./bq24075) | Charge via USB, PowerPath | [Detail →](./bq24075) |
| [Jauge BQ27441](./bq27441) | Mesure etat de charge, I2C | [Detail →](./bq27441) |
| TPS63000 | Convertisseur buck-boost 3.3V | Ci-dessous |
| LD3985 | Regulateur lineaire 3.3V | Ci-dessous |
| LMR62421 | Boost 14.5V (buzzer + ecran) | Ci-dessous |
| DIO7003 | Switch basse perte | Ci-dessous |

## Batterie — LiPo

| Caracteristique | Detail |
|---|---|
| Technologie | Lithium-Polymere (LiPo) |
| Tension | 3.7V |
| Capacite | 1600 mAh |
| Autonomie mode standard | 1 jour |
| Autonomie mode basse consommation | 5 a 10 jours |
| Integration | Face arriere de la carte |

## Convertisseur principal — TPS63000

Convertisseur buck-boost permettant de fournir 3.3V a partir d'une entree 3.7V (batterie) ou 5V (USB).

| Caracteristique | Detail |
|---|---|
| Modele | [TPS63000DRCT](https://www.ti.com/product/TPS63000) |
| Fabricant | Texas Instruments |
| Type | Buck-boost |
| Sortie | 3.3V @ 1200 mA |
| Entree | 1.8V a 5.5V |

### Pourquoi un buck-boost ?

L'entree peut etre 3.7V (batterie) ou 5V (USB). Le TPS63000 peut monter ET descendre la tension pour fournir un 3.3V stable quelle que soit la source.

## Regulateur lineaire — LD3985

| Caracteristique | Detail |
|---|---|
| Modele | LD3985M33R |
| Fabricant | STMicroelectronics |
| Sortie | 3.3V @ 150 mA |
| Usage | Alimentation STLink, rails sensibles |

## Boost buzzer — LMR62421

| Caracteristique | Detail |
|---|---|
| Modele | [LMR62421XMF](https://www.ti.com/product/LMR62421) |
| Fabricant | Texas Instruments |
| Sortie | 14.5V @ 100 mA |
| Usage | Alimentation du buzzer piezo et de l'ecran OLED |

## Switch d'alimentation — DIO7003

| Caracteristique | Detail |
|---|---|
| Modele | DIO7003LEST5 |
| Fabricant | DIOO Microcircuits |
| Type | Switch de distribution basse perte |
| Usage | Coupure totale en mode basse consommation |

## Sorties disponibles

| Tension | Courant max | Utilisation |
|---------|-------------|-------------|
| 3.3V | 1200 mA | MCU, capteurs, affichage |
| 3.3V | 150 mA | Regulateur lineaire (STLink) |
| 14.5V | 100 mA | Buzzer piezo, ecran OLED |
| 5V | — | Alimentation Jacdac |

## Schemas

[![Schema FP4-Alimentation](/img/schematics/FP4-Alimentation.png)](/docs/schematics/FP4-Alimentation.pdf)

- [Schema Altium — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc)
- [Schema Altium — FP1](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP1-Batterie.SchDoc)

## Voir aussi

- [Conception — Alimentation](../../../design/power)
- [Pin Mapping — Alimentation](../../pin-mapping/power-pins)
- [Vue d'ensemble du materiel](../../)
