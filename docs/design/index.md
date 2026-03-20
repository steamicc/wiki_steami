---
title: Conception
sidebar_position: 1
---

# Conception et exigences

Cette section documente les choix de conception de la carte STeaMi et les exigences techniques qui les motivent. Chaque page combine les exigences formelles avec les justifications des composants et architectures retenus.

## Organisation

Les exigences sont regroupées par domaine fonctionnel. Chaque domaine présente :
- Les **exigences** (identifiées FCT-xx, ENV-xx, PHY-xx) sous forme de tableau
- Les **choix de conception** qui répondent à ces exigences
- La **traçabilité** entre exigences et implémentation
- Des **liens croisés** vers les pages [Hardware](../hardware/), [Pin Mapping](../pin-mapping/) et [Composants](../components/)

## Domaines

| Domaine | Exigences | Blocs fonctionnels |
|---------|-----------|-------------------|
| Alimentation | FCT-01 à FCT-09 | Batterie, chargeur, jauge, convertisseurs |
| Interface utilisateur | FCT-10 à FCT-27 | Écran, LEDs, boutons, buzzer |
| Communication | FCT-28 à FCT-34 | Bluetooth, radio, flash |
| MCU et stockage | FCT-35 à FCT-39 | STM32WB55, mémoire |
| Capteurs | FCT-40 à FCT-54 | 7 capteurs internes, connecteurs externes |
| Service et USB | FCT-55 à FCT-64 | SWD, DAPLink, USB |
| Contraintes | ENV-01 à ENV-05, PHY-01 à PHY-03 | Environnement, mécanique |

## Exigences existantes

En attendant la migration complète, les exigences sont consultables dans la section [Requirements](../requirements/).
