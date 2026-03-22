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
- Des **liens croisés** vers les pages [Hardware](../hardware/), [Pin Mapping](../hardware/pin-mapping/) et [Composants](../hardware/components/)

## Domaines

| Domaine                                   | Exigences                        | Blocs fonctionnels                        |
| ----------------------------------------- | -------------------------------- | ----------------------------------------- |
| [Alimentation](./power)                   | FCT-01 a FCT-09                  | Batterie, chargeur, jauge, convertisseurs |
| [Interface utilisateur](./user-interface) | FCT-10 a FCT-27                  | Ecran, LEDs, boutons, buzzer              |
| [Communication](./communication)          | FCT-28 a FCT-34                  | Bluetooth, radio, flash                   |
| [MCU et stockage](./mcu-storage)          | FCT-35 a FCT-39                  | STM32WB55, memoire                        |
| [Capteurs](./sensors)                     | FCT-40 a FCT-54                  | 7 capteurs internes, connecteurs externes |
| [Service et USB](./service-usb)           | FCT-55 a FCT-64                  | SWD, DAPLink, USB                         |
| [Contraintes](./constraints)              | ENV-01 a ENV-05, PHY-01 a PHY-03 | Environnement, mecanique                  |

## Voir aussi

- [Hardware](../hardware/) — Description du materiel
- [Schemas](../hardware/schematic) — Fichiers Altium et PDF
