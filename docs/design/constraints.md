---
sidebar_position: 8
title: 'Contraintes'
---

# Contraintes environnementales et physiques

## Exigences environnementales

| ID     | Nom                        | Description                                                                               | Implémentation                       |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| ENV-01 | Temperature                | Le systeme doit pouvoir fonctionner dans la plage de -20°C a 85°C.                        | Composants grade industriel          |
| ENV-02 | Lifetime                   | Le systeme doit pouvoir fonctionner pendant 70 000 heures (environ 8 ans).                | Selection composants haute fiabilite |
| ENV-03 | ESD Protection             | Les connecteurs d'entree et de sortie doivent etre equipes de protections ESD.            | Protections ESD sur connecteurs      |
| ENV-04 | User Interface Position    | Le systeme doit integrer les elements d'affichage sur la face avant de la carte.          | Ecran OLED et LEDs en face avant     |
| ENV-05 | Command Interface Position | Le systeme doit integrer l'interface de controle (boutons) sur la face avant de la carte. | Boutons en face avant                |

## Exigences physiques

| ID     | Nom                 | Description                                                                                      | Implémentation                |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| PHY-01 | Size                | Le systeme doit etre contenu dans un volume inferieur a 100 mm de longueur par 60 mm de largeur. | PCB < 100 x 60 mm             |
| PHY-02 | Weight              | Le poids doit etre inferieur ou egal a 100 g.                                                    | ≤ 100 g                       |
| PHY-03 | Battery integration | Le systeme peut integrer une batterie a l'arriere.                                               | LiPo 1600 mAh en face arriere |

## Choix de conception

### Temperature de fonctionnement (ENV-01)

La plage -20°C a 85°C couvre les applications educatives en interieur et en exterieur. Tous les composants actifs (MCU, capteurs, PMIC) sont selectionnes en grade industriel pour garantir cette plage.

### Duree de vie (ENV-02)

La cible de 70 000 heures (~8 ans) est assuree par la selection de composants avec une duree de vie garantie superieure et par l'absence de pieces mecaniques d'usure (hors boutons).

### Protection ESD (ENV-03)

Les connecteurs externes (micro-USB, edge connector, STEMMA/Qwiic, Jacdac) sont equipes de diodes de protection ESD pour proteger les circuits internes contre les decharges electrostatiques.

### Ergonomie (ENV-04, ENV-05)

L'ecran OLED, les LEDs et les boutons sont tous places en face avant pour une utilisation intuitive. La batterie est en face arriere (PHY-03) pour ne pas interferer avec l'interface utilisateur.

### Dimensions et poids (PHY-01, PHY-02)

Le format compact (< 100 x 60 mm, ≤ 100 g) est compatible avec le connecteur edge micro:bit et permet une prise en main facile dans un contexte educatif.

## Voir aussi

- [Hardware — Vue d'ensemble](../hardware/)
- [Conception — Interface utilisateur](./user-interface)
- [Conception — Alimentation](./power)
