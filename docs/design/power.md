---
sidebar_position: 2
title: "Alimentation"
---

# Alimentation

## Exigences

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-01 | Power Input | Le systeme doit pouvoir etre alimente par une alimentation 5V via un connecteur micro-USB. | Connecteur micro-USB + TPS63000DRCT |
| FCT-02 | Power Input - Low power mode | Afin d'assurer une tres faible consommation de repos apres l'extinction automatique, toutes les alimentations et peripheriques doivent etre coupes. | Switch DIO7003LEST5 |
| FCT-03 | Power Input - Regulator | Un regulateur 3.3V est necessaire. Il doit etre robuste aux perturbations non filtrees de la batterie et de l'USB. | TPS63000DRCT buck-boost |
| FCT-04 | Power Output | Le systeme doit integrer des pads sur la carte electronique pour les sorties d'alimentation 5V, 3V3 et GND. | Pads PCB |
| FCT-05 | Battery LiPo | Le systeme peut etre equipe d'un pack batterie de type Li-Po permettant au systeme de fonctionner sans alimentation externe. | LiPo 3.7V 1600 mAh |
| FCT-06 | Battery Discharge standard | Le systeme doit pouvoir fonctionner pendant 1 jour sur batterie interne en scenario standard. | Batterie 1600 mAh |
| FCT-07 | Battery Discharge long stand | Le systeme doit pouvoir fonctionner entre 5 et 10 jours sur batterie interne en mode basse consommation. | Mode basse consommation + coupure DIO7003 |
| FCT-08 | Battery Charger | Le systeme doit pouvoir recharger la batterie interne en presence d'une source d'alimentation USB (minimum 500 mA). | BQ24075RGT (PowerPath) |
| FCT-09 | Battery Gauge | Le systeme doit pouvoir connaitre l'etat de charge de sa batterie interne. | BQ27441DRZR-G1A (I2C) |

## Choix de conception

### Batterie (FP1)

La batterie utilise la technologie Lithium-Polymere (LiPo) pour une taille et un poids reduits.

- **Technologie** : Lithium-Polymere (LiPo)
- **Tension** : 3.7V
- **Capacite** : 1600 mAh
- **Autonomie mode standard** : 1 jour
- **Autonomie mode basse consommation** : 5 a 10 jours
- **Integration** : La batterie peut etre integree a l'arriere de la carte

### Chargeur de batterie (FP2)

La batterie est rechargee via le port micro-USB. Le design utilise le circuit de charge Texas Instruments BQ24075 avec gestion PowerPath integree.

- **Composant** : Texas Instruments BQ24075RGT
- **Courant de charge** : minimum 500 mA
- **Connecteur** : micro-USB
- **Mode de fonctionnement** : le systeme reste operationnel meme sans batterie (alimentation USB)
- **Gestion du chemin d'alimentation** : PowerPath integre

### Jauge de batterie (FP3)

La jauge BQ27441 de Texas Instruments mesure periodiquement l'energie restante dans la batterie, avec communication I2C et faible consommation.

- **Composant** : Texas Instruments BQ27441DRZR-G1A
- **Interface** : I2C (bus interne I2C1)
- **Tension d'alimentation** : 2.45V a 4.5V
- **Technologie batterie supportee** : LiCoO2, Li-Ion
- **Boitier** : SON-12

### Architecture d'alimentation (FP4)

Le systeme de gestion de l'alimentation fournit les differentes tensions et courants requis par les composants de la carte.

- **Entree** : 5V via USB ou batterie LiPo 3.7V
- **Convertisseur principal** : TPS63000DRCT (buck-boost) — fournit 3.3V @ 1200 mA
- **Regulateur lineaire** : LD3985M33R — 3.3V @ 150 mA
- **Convertisseur boost** : LMR62421 — 14.5V @ 100 mA (pour le buzzer)
- **Switch d'alimentation** : DIO7003LEST5 — distribution de puissance basse perte

#### Pourquoi un buck-boost ?

L'entree peut etre 3.7V (batterie) ou 5V (USB). Le TPS63000 peut monter ET descendre la tension pour fournir un 3.3V stable quelle que soit la source.

#### Sorties disponibles

| Tension | Courant max | Utilisation |
|---------|-------------|-------------|
| 3.3V | 1200 mA | Microcontroleur, capteurs, affichage |
| 3.3V | 150 mA | Regulateur lineaire (STLink) |
| 14.5V | 100 mA | Buzzer piezo |
| 5V | - | Alimentation Jacdac |

## Voir aussi

- [Hardware — Vue d'ensemble](../hardware/)
- [Composants — Circuits integres](../components/integrated-circuits)
- [Pin Mapping — Alimentation](../pin-mapping/power-pins)
