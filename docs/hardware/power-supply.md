---
sidebar_position: 6
title: "Alimentation"
---

# Alimentation

**Identifiant** : FP4

Le systeme de gestion de l'alimentation fournit les differentes tensions et courants requis par les composants de la carte. Il utilise un convertisseur DC/DC pour fournir une alimentation stable au microcontroleur, aux capteurs et a l'ecran.

## Architecture d'alimentation

- **Entree** : 5V via USB ou batterie LiPo 3.7V
- **Convertisseur principal** : TPS63000DRCT (buck-boost) - fournit 3.3V @ 1200 mA
- **Regulateur lineaire** : LD3985M33R - 3.3V @ 150 mA
- **Convertisseur boost** : LMR62421 - 14.5V @ 100 mA (pour le buzzer)
- **Switch d'alimentation** : DIO7003LEST5 - distribution de puissance basse perte

## Sorties disponibles

| Tension | Courant max | Utilisation |
|---------|-------------|-------------|
| 3.3V | 1200 mA | Microcontroleur, capteurs, affichage |
| 3.3V | 150 mA | Regulateur lineaire (STLink) |
| 14.5V | 100 mA | Buzzer piezo |
| 5V | - | Alimentation Jacdac |
