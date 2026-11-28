---
sidebar_position: 2
title: 'Alimentation'
---

import { Release, ReleaseSelector, ReleaseValue } from '@site/src/components/ReleaseTabs';

# Alimentation

Les exigences sont communes aux trois releases de la carte. Quand l'implémentation diffère, la colonne « Implémentation » affiche la release choisie ci-dessous ; les écarts sont détaillés dans [Révisions](../hardware/revisions#écarts-aux-exigences).

<ReleaseSelector />

## Exigences

| ID     | Nom                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Implémentation                                                                                                                                                                      |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FCT-01 | Power Input                  | Le système doit pouvoir être alimenté par une alimentation 5V via un connecteur micro-USB.                                                                                                                                                                                                                                                                                                                                                                                                                                                | <ReleaseValue><Release releases="v1a v1b">Connecteur micro-USB + TPS63000DRCT</Release><Release releases="v1c">**Écart** : connecteur USB-C + TPS63000DRCT</Release></ReleaseValue> |
| FCT-02 | Power Input - Low power mode | Afin d'assurer une très faible consommation de repos après l'extinction automatique, tous les périphériques du MCU doivent passer en mode basse consommation. Le CPU est mis en veille profonde, le rétroéclairage de l'écran et l'amplificateur audio sont éteints. Toute LED d'alimentation doit pouvoir être éteinte par le MCU. Si une sortie du MCU doit signaler l'extinction, un signal optionnel PWREN est prévu : s'il est défini, le logiciel le met à l'état haut au démarrage et le maintient à l'état bas pendant la veille. | Switch DIO7003LEST5                                                                                                                                                                 |
| FCT-03 | Power Input - Regulator      | Un régulateur 3,3 V sera probablement nécessaire. Il doit résister aux perturbations non filtrées de la ligne d'alimentation USB et aux courts-circuits en aval, possibles quand la carte n'a pas de boîtier. Si le régulateur peut être touché, il ne doit en aucun cas devenir trop chaud au toucher.                                                                                                                                                                                                                                   | TPS63000DRCT buck-boost                                                                                                                                                             |
| FCT-04 | Power Output                 | Le système doit intégrer des pads sur la carte électronique pour les sorties d'alimentation 5V, 3V3 et GND.                                                                                                                                                                                                                                                                                                                                                                                                                               | Pads PCB                                                                                                                                                                            |
| FCT-05 | Battery LiPo                 | Le système peut être équipé d'un pack batterie de type Li-Po permettant au système de fonctionner sans alimentation externe.                                                                                                                                                                                                                                                                                                                                                                                                              | LiPo 3.7V 1600 mAh                                                                                                                                                                  |
| FCT-06 | Battery Discharge standard   | Le système doit pouvoir fonctionner pendant 1 jour sur batterie interne en scénario standard.                                                                                                                                                                                                                                                                                                                                                                                                                                             | Batterie 1600 mAh                                                                                                                                                                   |
| FCT-07 | Battery Discharge long stand | Le système doit pouvoir fonctionner entre 5 et 10 jours sur batterie interne en mode basse consommation.                                                                                                                                                                                                                                                                                                                                                                                                                                  | Mode basse consommation + coupure DIO7003                                                                                                                                           |
| FCT-08 | Battery Charger              | Le système doit pouvoir recharger la batterie interne en présence d'une source d'alimentation USB (minimum 500 mA).                                                                                                                                                                                                                                                                                                                                                                                                                       | BQ24075RGT (PowerPath)                                                                                                                                                              |
| FCT-09 | Battery Gauge                | Le système doit pouvoir connaître l'état de charge de sa batterie interne.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | BQ27441DRZR-G1A (I2C)                                                                                                                                                               |

## Choix de conception

### Batterie (FP1)

La batterie utilise la technologie Lithium-Polymère (LiPo) pour une taille et un poids réduits.

- **Technologie** : Lithium-Polymère (LiPo)
- **Tension** : 3.7V
- **Capacité** : 1600 mAh
- **Autonomie mode standard** : 1 jour
- **Autonomie mode basse consommation** : 5 à 10 jours
- **Intégration** : La batterie peut être intégrée à l'arrière de la carte

### Chargeur de batterie (FP2)

La batterie est rechargée via le port USB (micro-USB sur la V1a et la V1b, USB-C sur la V1c). Le design utilise le circuit de charge Texas Instruments BQ24075 avec gestion PowerPath intégrée.

- **Composant** : Texas Instruments BQ24075RGT
- **Courant de charge** : minimum 500 mA
- **Connecteur** : micro-USB (V1a, V1b), USB-C (V1c)
- **Mode de fonctionnement** : le système reste opérationnel même sans batterie (alimentation USB)
- **Gestion du chemin d'alimentation** : PowerPath intégré

### Jauge de batterie (FP3)

La jauge BQ27441 de Texas Instruments mesure périodiquement l'énergie restante dans la batterie, avec communication I2C et faible consommation.

- **Composant** : Texas Instruments BQ27441DRZR-G1A
- **Interface** : I2C (bus interne I2C1)
- **Tension d'alimentation** : 2.45V à 4.5V
- **Technologie batterie supportée** : LiCoO2, Li-Ion
- **Boîtier** : SON-12

### Architecture d'alimentation (FP4)

Le système de gestion de l'alimentation fournit les différentes tensions et courants requis par les composants de la carte.

- **Entrée** : 5V via USB ou batterie LiPo 3.7V
- **Convertisseur principal** : TPS63000DRCT (buck-boost) — fournit 3.3V @ 1200 mA
- **Régulateur linéaire** : LD3985M33R — 3.3V @ 150 mA
- **Convertisseur boost** : LMR62421 — 14.5V @ 100 mA (pour l'écran OLED, sur la V1a et la V1b uniquement)
- **Alimentation Jacdac** : élévateur AP3015 (U22) — 5V, ajouté à l'indice A1
- **Switch d'alimentation** : DIO7003LEST5 — distribution de puissance basse perte

#### Pourquoi un buck-boost ?

L'entrée peut être 3.7V (batterie) ou 5V (USB). Le TPS63000 peut monter ET descendre la tension pour fournir un 3.3V stable quelle que soit la source.

#### Sorties disponibles

| Tension | Courant max | Utilisation                          |
| ------- | ----------- | ------------------------------------ |
| 3.3V    | 1200 mA     | Microcontrôleur, capteurs, affichage |
| 3.3V    | 150 mA      | Régulateur linéaire (STLink)         |
| 14.5V   | 100 mA      | Écran OLED (V1a, V1b)                |
| 5V      | -           | Alimentation Jacdac                  |

## Voir aussi

- [Hardware — Vue d'ensemble](../hardware/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
- [Pin Mapping — Alimentation](../hardware/pin-mapping/power-pins)
