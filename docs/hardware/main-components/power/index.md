---
sidebar_position: 5
title: 'Alimentation'
---

# Alimentation

Le système de gestion de l'alimentation fournit les différentes tensions à partir du 5V USB ou de la batterie LiPo 3.7V.

## Sous-systèmes

| Composant                     | Fonction                      | Page                  |
| ----------------------------- | ----------------------------- | --------------------- |
| Batterie LiPo                 | 3.7V 1600 mAh                 | Ci-dessous            |
| [Chargeur BQ24075](./bq24075) | Charge via USB, PowerPath     | [Détail →](./bq24075) |
| [Jauge BQ27441](./bq27441)    | Mesure état de charge, I2C    | [Détail →](./bq27441) |
| TPS63000                      | Convertisseur buck-boost 3.3V | Ci-dessous            |
| LD3985                        | Régulateur linéaire 3.3V      | Ci-dessous            |
| LMR62421                      | Boost 14.5V (buzzer + écran)  | Ci-dessous            |
| DIO7003                       | Switch basse perte            | Ci-dessous            |

## Batterie — LiPo

| Caractéristique                   | Détail                   |
| --------------------------------- | ------------------------ |
| Technologie                       | Lithium-Polymère (LiPo)  |
| Tension                           | 3.7V                     |
| Capacité                          | 1600 mAh                 |
| Autonomie mode standard           | 1 jour                   |
| Autonomie mode basse consommation | 5 à 10 jours             |
| Intégration                       | Face arrière de la carte |

## Convertisseur principal — TPS63000

Convertisseur buck-boost permettant de fournir 3.3V à partir d'une entrée 3.7V (batterie) ou 5V (USB).

| Caractéristique | Détail                                              |
| --------------- | --------------------------------------------------- |
| Modèle          | [TPS63000DRCT](https://www.ti.com/product/TPS63000) |
| Fabricant       | Texas Instruments                                   |
| Type            | Buck-boost                                          |
| Sortie          | 3.3V @ 1200 mA                                      |
| Entrée          | 1.8V à 5.5V                                         |

### Pourquoi un buck-boost ?

L'entrée peut être 3.7V (batterie) ou 5V (USB). Le TPS63000 peut monter ET descendre la tension pour fournir un 3.3V stable quelle que soit la source.

## Régulateur linéaire — LD3985

| Caractéristique | Détail                                                            |
| --------------- | ----------------------------------------------------------------- |
| Modèle          | LD3985M33R                                                        |
| Fabricant       | STMicroelectronics                                                |
| Sortie          | 3.3V @ 150 mA                                                     |
| Usage           | Alimentation MCU interface (STM32F103) / DAPLink, rails sensibles |

## Boost buzzer — LMR62421

| Caractéristique | Détail                                             |
| --------------- | -------------------------------------------------- |
| Modèle          | [LMR62421XMF](https://www.ti.com/product/LMR62421) |
| Fabricant       | Texas Instruments                                  |
| Sortie          | 14.5V @ 100 mA                                     |
| Usage           | Alimentation du buzzer piézo et de l'écran OLED    |

## Switch d'alimentation — DIO7003

| Caractéristique | Détail                                    |
| --------------- | ----------------------------------------- |
| Modèle          | DIO7003LEST5                              |
| Fabricant       | DIOO Microcircuits                        |
| Type            | Switch de distribution basse perte        |
| Usage           | Coupure totale en mode basse consommation |

## Sorties disponibles

| Tension | Courant max | Utilisation                                   |
| ------- | ----------- | --------------------------------------------- |
| 3.3V    | 1200 mA     | MCU, capteurs, affichage                      |
| 3.3V    | 150 mA      | Régulateur linéaire (MCU interface / DAPLink) |
| 14.5V   | 100 mA      | Buzzer piézo, écran OLED                      |
| 5V      | —           | Alimentation Jacdac                           |

## Schémas

[![Schéma FP4-Alimentation](/img/schematics/FP4-Alimentation.png)](/docs/schematics/FP4-Alimentation.pdf)

- [Schéma Altium — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc)
- [Schéma Altium — FP1](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP1-Batterie.SchDoc)

## Voir aussi

- [Conception — Alimentation](../../../design/power)
- [Pin Mapping — Alimentation](../../pin-mapping/power-pins)
- [Vue d'ensemble du matériel](../../)
