---
sidebar_position: 9
title: 'Composants mécaniques'
---

import OctopartButton from '@site/src/components/OctopartButton';

# Composants mécaniques

:::info Release
Les repères sont ceux de la nomenclature de l'indice B1 (V1b). Les composants retirés ou modifiés sur la V1c sont listés dans [BOM complète](./#différences-selon-la-release).
:::

## Boutons et interrupteurs

| Composant                                      | Description                                             | Fabricant                             | Référence                                                         | Qté | Repères       | Datasheet |
| ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- | --- | ------------- | --------- |
| PTS636 SM25J SMTR LFS                          | Interrupteur tactile montage en surface                 | [C&K](https://www.ckswitches.com/)    | PTS636 SM25J SMTR LFS <br/><OctopartButton q="PTS636 SM25J" />    | 1   | SW1           | —         |
| PTS647SM38SMTR2LFS                             | Interrupteur tactile 50 mA 12 VDC, 1.8N, hauteur 3.8 mm | [C&K](https://www.ckswitches.com/)    | PTS647SM38SMTR2LFS <br/><OctopartButton q="PTS647SM38SMTR2LFS" /> | 3   | SW3, SW4, SW5 | —         |
| [SKRHABE010](../main-components/buttons-audio) | Joystick 4 directions avec fonction push central        | [ALPS](https://www.alpsalpine.com/e/) | SKRHABE010 <br/><OctopartButton q="SKRHABE010" />                 | 1   | SW2           | —         |

## Details

Voir [Boutons et buzzer →](../main-components/buttons-audio) pour les details fonctionnels.

### Bouton Reset

- **PTS636 SM25J SMTR LFS** (SW1) : bouton Reset, relié à NRST du STM32WB55

### Boutons A, B et Menu

- **PTS647SM38SMTR2LFS** (x3) : boutons tactiles de hauteur 3,8 mm : SW5 = bouton A, SW4 = bouton B, SW3 = bouton Menu

### Joystick 4 directions

- **ALPS SKRHABE010** : Joystick tactile 4 directions avec push central, utilise pour la navigation (haut, bas, gauche, droite)
