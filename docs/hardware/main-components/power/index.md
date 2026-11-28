---
sidebar_position: 5
title: 'Alimentation'
---

# Alimentation

Le système de gestion de l'alimentation fournit les différentes tensions à partir du 5V USB ou de la batterie LiPo 3.7V.

## Sous-systèmes

| Composant                     | Fonction                             | Page                  |
| ----------------------------- | ------------------------------------ | --------------------- |
| Batterie LiPo                 | 3.7V 1600 mAh                        | Ci-dessous            |
| [Chargeur BQ24075](./bq24075) | Charge via USB, PowerPath            | [Détail →](./bq24075) |
| [Jauge BQ27441](./bq27441)    | Mesure état de charge, I2C           | [Détail →](./bq27441) |
| TPS63000                      | Convertisseur buck-boost 3.3V        | Ci-dessous            |
| LD3985                        | Régulateur linéaire 3.3V             | Ci-dessous            |
| LMR62421                      | Boost 14.5V (écran OLED, V1a et V1b) | Ci-dessous            |
| DIO7003                       | Switch basse perte                   | Ci-dessous            |

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

## Boost écran OLED — LMR62421

:::info Release
L'élévateur LMR62421 (U4) n'équipe que la V1a et la V1b : il fournit le +14V5 de l'écran OLED. Il est retiré sur la V1c, dont l'écran TFT est alimenté en +3V3. Le buzzer est alimenté en +3V3 sur les trois releases.
:::

| Caractéristique | Détail                                             |
| --------------- | -------------------------------------------------- |
| Modèle          | [LMR62421XMF](https://www.ti.com/product/LMR62421) |
| Fabricant       | Texas Instruments                                  |
| Sortie          | 14.5V @ 100 mA                                     |
| Usage           | Alimentation de l'écran OLED (connecteur J7)       |

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
| 14.5V   | 100 mA      | Écran OLED (V1a, V1b)                         |
| 5V      | —           | Alimentation Jacdac                           |

## Schémas

Les deux feuilles ci-dessous viennent du schéma de l'indice B1 (V1b), publié dans le [reference design](https://github.com/steamicc/steami-reference-design).

Feuille FP4, alimentation. Elle comporte l'élévateur LMR62421 (U4) et le rail +14V5 de l'écran OLED, retirés dans le schéma de l'indice C (V1c) :

[![Schéma FP4-Alimentation](/img/schematics/FP4-Alimentation.png)](/docs/schematics/FP4-Alimentation.pdf)

Feuille FP1, connecteur de batterie J1. Son contenu est le même dans le schéma de l'indice C (V1c) ; seul le cartouche change :

[![Schéma FP1-Batterie](/img/schematics/FP1-Batterie.png)](/docs/schematics/FP1-Batterie.pdf)

- [Schéma Altium — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc)
- [Schéma Altium — FP1](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP1-Batterie.SchDoc)

## Voir aussi

- [Conception — Alimentation](../../../design/power)
- [Pin Mapping — Alimentation](../../pin-mapping/power-pins)
- [Vue d'ensemble du matériel](../../)
