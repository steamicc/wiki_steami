---
sidebar_position: 5
title: "Alimentation"
---

# Alimentation

Le systeme de gestion de l'alimentation fournit les differentes tensions a partir du 5V USB ou de la batterie LiPo 3.7V.

## Batterie — LiPo

| Caracteristique | Detail |
|---|---|
| Technologie | Lithium-Polymere (LiPo) |
| Tension | 3.7V |
| Capacite | 1600 mAh |
| Autonomie mode standard | 1 jour |
| Autonomie mode basse consommation | 5 a 10 jours |
| Integration | Face arriere de la carte |

## Chargeur de batterie — BQ24075

| Caracteristique | Detail |
|---|---|
| Modele | [BQ24075RGT](https://www.ti.com/product/BQ24075) |
| Fabricant | Texas Instruments |
| Courant de charge | Minimum 500 mA |
| Source | Micro-USB |
| PowerPath | Integre — le systeme fonctionne meme sans batterie |
| Schema | [FP2](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP2-Chargeur_de_batterie.SchDoc) |

## Jauge de batterie — BQ27441

| Caracteristique | Detail |
|---|---|
| Modele | [BQ27441DRZR-G1A](https://www.ti.com/product/BQ27441-G1) |
| Fabricant | Texas Instruments |
| Interface | I2C (bus I2C1 interne) |
| Tension d'alimentation | 2.45V a 4.5V |
| Technologie batterie | LiCoO2, Li-Ion |
| Boitier | SON-12 |
| Driver MicroPython | [bq27441](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bq27441) |
| Schema | [FP3](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP3-Jauge_Batterie.SchDoc) |

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

- [Schema complet (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/PDF/STeaMi-Schematic.PDF)

- [Schema Altium — FP4](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP4-Alimentation.SchDoc)
- [Schema Altium — FP1](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP1-Batterie.SchDoc)

## Voir aussi

- [Conception — Alimentation](../../design/power)
- [Pin Mapping — Alimentation](../pin-mapping/power-pins)
- [Vue d'ensemble du materiel](../)
