---
sidebar_position: 8
title: 'Contraintes'
---

# Contraintes environnementales et physiques

## Exigences environnementales

| ID     | Nom                        | Description                                                                               | Implémentation                       |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| ENV-01 | Temperature                | Le système doit pouvoir fonctionner dans la plage de -20°C à 85°C.                        | Composants grade industriel          |
| ENV-02 | Lifetime                   | Le système doit pouvoir fonctionner pendant 70 000 heures (environ 8 ans).                | Sélection composants haute fiabilité |
| ENV-03 | ESD Protection             | Les connecteurs d'entrée et de sortie doivent être équipés de protections ESD.            | Protections ESD sur connecteurs      |
| ENV-04 | User Interface Position    | Le système doit intégrer les éléments d'affichage sur la face avant de la carte.          | Écran OLED et LEDs en face avant     |
| ENV-05 | Command Interface Position | Le système doit intégrer l'interface de contrôle (boutons) sur la face avant de la carte. | Boutons en face avant                |

## Exigences physiques

| ID     | Nom                 | Description                                                                                      | Implémentation                |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| PHY-01 | Size                | Le système doit être contenu dans un volume inférieur à 100 mm de longueur par 60 mm de largeur. | PCB < 100 x 60 mm             |
| PHY-02 | Weight              | Le poids doit être inférieur ou égal à 100 g.                                                    | ≤ 100 g                       |
| PHY-03 | Battery integration | Le système peut intégrer une batterie à l'arrière.                                               | LiPo 1600 mAh en face arrière |

## Choix de conception

### Température de fonctionnement (ENV-01)

La plage -20°C à 85°C couvre les applications éducatives en intérieur et en extérieur. Tous les composants actifs (MCU, capteurs, PMIC) sont sélectionnés en grade industriel pour garantir cette plage.

### Durée de vie (ENV-02)

La cible de 70 000 heures (~8 ans) est assurée par la sélection de composants avec une durée de vie garantie supérieure et par l'absence de pièces mécaniques d'usure (hors boutons).

### Protection ESD (ENV-03)

Les connecteurs externes (micro-USB, edge connector, STEMMA/Qwiic, Jacdac) sont équipés de diodes de protection ESD pour protéger les circuits internes contre les décharges électrostatiques.

### Ergonomie (ENV-04, ENV-05)

L'écran OLED, les LEDs et les boutons sont tous placés en face avant pour une utilisation intuitive. La batterie est en face arrière (PHY-03) pour ne pas interférer avec l'interface utilisateur.

### Dimensions et poids (PHY-01, PHY-02)

Le format compact (< 100 x 60 mm, ≤ 100 g) est compatible avec le connecteur edge micro:bit et permet une prise en main facile dans un contexte éducatif.

## Voir aussi

- [Hardware — Vue d'ensemble](../hardware/)
- [Conception — Interface utilisateur](./user-interface)
- [Conception — Alimentation](./power)
