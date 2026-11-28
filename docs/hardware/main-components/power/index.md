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
| AP3015                        | Boost 5V Jacdac (sauf indice A)      | Ci-dessous            |
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

## Boost 5V Jacdac — AP3015

:::info Release
La V1a existe en deux indices de schéma, A et A1. À l'indice A, il n'y a pas de rail 5V Jacdac : les connecteurs Jacdac J5 et J6 (feuille FP13) sont alimentés directement en +3V3@1200mA. La nomenclature VerA correspond à cet indice A : elle ne contient ni U22 ni L5, et R47 y vaut 22R.

L'indice A1 (02/02/2022, « Update Power JACDAC ») ajoute sur la feuille FP4 l'élévateur U22, qui produit le rail 5V_JD_PWR@100mA à partir du +3V3@1200mA. J5 et J6 sont alimentés par ce rail à partir de A1. Sur FP13, A1 change aussi l'annotation de la diode de protection D14 (3V3 à l'indice A, 5V à l'indice A1) et la résistance R47 (22R à l'indice A, 220R à l'indice A1). Les indices B1 (V1b) et C (V1c) gardent ce montage.
:::

| Caractéristique | Détail                                                          |
| --------------- | --------------------------------------------------------------- |
| Repère          | U22                                                             |
| Modèle          | AP3015AKTR-G1                                                   |
| Fabricant       | Diodes Incorporated                                             |
| Type            | Élévateur (boost) à découpage                                   |
| Entrée          | +3V3@1200mA                                                     |
| Sortie          | 5V_JD_PWR, 100 mA                                               |
| Inductance      | L5, 10 µH (TDK VLS3012CX-100M-1 dans les nomenclatures B1 et C) |
| Diode           | D25, Schottky SS14HE                                            |
| Contre-réaction | R56 1M et R59 324K, C85 10 pF 10V                               |
| Usage           | Alimentation des connecteurs Jacdac J5 et J6                    |

Le montage autour de U22 change entre l'indice A1 et l'indice B1. Seul le schéma de l'indice B1 est disponible pour l'indice B : le changement est donc daté « à partir de B1 ».

| Élément                 | Indice A1 (V1a)                                       | Indices B1 (V1b) et C (V1c)                               |
| ----------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| R60                     | Absente : +3V3@1200mA arrive directement sur VIN/SHDN | 0R en série entre +3V3@1200mA et l'entrée VIN/SHDN de U22 |
| C86 (découplage entrée) | Valeur et tension non remplies (« Value / Voltage »)  | 4,7 µF 6,3V, Murata GRM155R60J475ME8D                     |
| C87 (sortie 5V_JD_PWR)  | 47 µF 6,3V                                            | 47 µF 4V, Taiyo Yuden AMK107BBJ476MA-RE                   |

La capacité de C87 ne change pas entre A1 et B1 : seule sa tension nominale passe de 6,3V à 4V.

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
| 5V      | 100 mA      | Jacdac (rail 5V_JD_PWR, V1b, V1c)             |

À l'indice A de la V1a, celui de la nomenclature VerA, il n'y a pas de rail 5V : Jacdac y est alimenté par le 3.3V @ 1200 mA. L'indice A1 de la V1a a déjà le rail 5V_JD_PWR@100mA.

## Schémas

Les deux feuilles ci-dessous viennent du schéma de l'indice B1 (V1b), publié dans le [reference design](https://github.com/steamicc/steami-reference-design).

Feuille FP4, alimentation. Elle comporte l'élévateur LMR62421 (U4) et le rail +14V5 de l'écran OLED, retirés dans le schéma de l'indice C (V1c), ainsi que l'élévateur Jacdac U22 et son rail 5V_JD_PWR@100mA, gardés dans l'indice C :

[![Schéma FP4-Alimentation](/img/schematics/FP4-Alimentation.png)](/docs/schematics/FP4-Alimentation.pdf)

Feuille FP1, connecteur de batterie J1. Son contenu est le même dans le schéma de l'indice C (V1c) ; seul le cartouche change :

[![Schéma FP1-Batterie](/img/schematics/FP1-Batterie.png)](/docs/schematics/FP1-Batterie.pdf)

- [Schéma Altium — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc)
- [Schéma Altium — FP1](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP1-Batterie.SchDoc)

## Voir aussi

- [Conception — Alimentation](../../../design/power)
- [Pin Mapping — Alimentation](../../pin-mapping/power-pins)
- [Vue d'ensemble du matériel](../../)
