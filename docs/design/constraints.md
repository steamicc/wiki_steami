---
sidebar_position: 8
title: 'Contraintes'
---

import { Release, ReleaseSelector, ReleaseValue } from '@site/src/components/ReleaseTabs';

# Contraintes environnementales et physiques

Les exigences sont communes aux trois releases de la carte. Quand l'implémentation diffère, la colonne « Implémentation » affiche la release choisie ci-dessous ; les écarts sont détaillés dans [Révisions](../hardware/revisions#écarts-aux-exigences).

<ReleaseSelector />

## Exigences environnementales

| ID     | Nom                        | Description                                                                               | Implémentation                                                                                                                                                                                                                              |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENV-01 | Temperature                | Le système doit pouvoir fonctionner dans la plage de -20°C à 85°C.                        | <ReleaseValue><Release releases="v1a v1b">Composants grade industriel</Release><Release releases="v1c">Composants grade industriel ; écran TFT annoncé de -20 °C à 70 °C par les distributeurs (écart à confirmer)</Release></ReleaseValue> |
| ENV-02 | Lifetime                   | Le système doit pouvoir fonctionner pendant 70 000 heures (environ 8 ans).                | Sélection composants haute fiabilité                                                                                                                                                                                                        |
| ENV-03 | ESD Protection             | Les connecteurs d'entrée et de sortie doivent être équipés de protections ESD.            | Protections ESD sur connecteurs                                                                                                                                                                                                             |
| ENV-04 | User Interface Position    | Le système doit intégrer les éléments d'affichage sur la face avant de la carte.          | Écran et LEDs en face avant                                                                                                                                                                                                                 |
| ENV-05 | Command Interface Position | Le système doit intégrer l'interface de contrôle (boutons) sur la face avant de la carte. | Boutons en face avant                                                                                                                                                                                                                       |

## Exigences physiques

| ID     | Nom                 | Description                                                                                                       | Implémentation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PHY-01 | Size                | Le système doit être contenu dans un volume inférieur à 100 mm de longueur, 60 mm de largeur et 10 mm de hauteur. | <ReleaseValue><Release releases="v1a">**Écart** : PCB d'environ 61,1 x 91,7 mm à l'indice A (dessin d'assemblage A), soit plus de 60 mm de large ; aucun dessin pour l'indice A1 ; hauteur non mesurée</Release><Release releases="v1b">**Écart** : PCB d'environ 61,1 x 91,7 mm (Gerber du reference design B1), soit plus de 60 mm de large aux languettes Jacdac ; hauteur non mesurée</Release><Release releases="v1c">**Écart** : PCB d'environ 61,1 x 91,7 mm, même contour que la B1 (dessin d'assemblage C), soit plus de 60 mm de large ; hauteur non mesurée</Release></ReleaseValue> |
| PHY-02 | Weight              | Le poids doit être inférieur ou égal à 100 g.                                                                     | ≤ 100 g                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| PHY-03 | Battery integration | Le système peut intégrer une batterie à l'arrière.                                                                | LiPo 1600 mAh en face arrière                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Choix de conception

### Température de fonctionnement (ENV-01)

La plage -20°C à 85°C couvre les applications éducatives en intérieur et en extérieur. Tous les composants actifs (MCU, capteurs, PMIC) sont sélectionnés en grade industriel pour garantir cette plage.

### Durée de vie (ENV-02)

La cible de 70 000 heures (~8 ans) est assurée par la sélection de composants avec une durée de vie garantie supérieure et par l'absence de pièces mécaniques d'usure (hors boutons).

### Protection ESD (ENV-03)

Les connecteurs externes (USB, edge connector, STEMMA/Qwiic, Jacdac) sont équipés de diodes de protection ESD pour protéger les circuits internes contre les décharges électrostatiques.

### Ergonomie (ENV-04, ENV-05)

L'écran, les LEDs et les boutons sont tous placés en face avant pour une utilisation intuitive. La batterie est en face arrière (PHY-03) pour ne pas interférer avec l'interface utilisateur.

### Dimensions et poids (PHY-01, PHY-02)

Le format visé (< 100 x 60 mm, ≤ 100 g) est compatible avec le connecteur edge micro:bit et permet une prise en main facile dans un contexte éducatif.

Le circuit imprimé mesure environ 61,1 x 91,7 mm. Cette cote vient du contour Gerber du [reference design](https://github.com/steamicc/steami-reference-design) (indice B1) et des dessins d'assemblage des indices A et C, qui montrent le même contour. La longueur reste sous les 100 mm, mais la largeur, prise aux languettes Jacdac, dépasse les 60 mm d'environ 1,1 mm : c'est un écart à l'exigence PHY-01. Aucun dessin d'assemblage n'existe pour l'indice A1. L'exigence PHY-01 limite aussi la hauteur à 10 mm ; la hauteur de la carte équipée de sa batterie n'a pas été mesurée.

## Voir aussi

- [Hardware — Vue d'ensemble](../hardware/)
- [Conception — Interface utilisateur](./user-interface)
- [Conception — Alimentation](./power)
