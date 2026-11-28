---
sidebar_position: 10
title: 'Écran et audio'
---

import OctopartButton from '@site/src/components/OctopartButton';
import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Écran et audio

## Écran

<ReleaseTabs>
<Release releases="v1a v1b">

| Composant                                          | Description                                                        | Fabricant                              | Reference                                                             | Qte | Repères | Datasheet |
| -------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------- | --- | ------- | --------- |
| [WEO128128BWPP3N00001](../main-components/display) | Module OLED graphique blanc 128x128, COG (Chip on Glass), Longlife | [Winstar](https://www.winstar.com.tw/) | WEO128128BWPP3N00001 <br/><OctopartButton q="WEO128128BWPP3N00001" /> | 1   | —       | —         |

### Caractéristiques de l'écran OLED

- **Technologie** : OLED (pixels blancs)
- **Resolution** : 128 x 128 pixels
- **Montage** : COG (Chip on Glass)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm
- **Interface** : SPI1

L'écran ne figure dans aucune nomenclature : sa référence vient du dossier de conception.

</Release>
<Release releases="v1c">

| Composant                                      | Description                                | Fabricant                              | Reference                                                     | Qte | Repères | Datasheet |
| ---------------------------------------------- | ------------------------------------------ | -------------------------------------- | ------------------------------------------------------------- | --- | ------- | --------- |
| [WF0128BTYAA4DNN0](../main-components/display) | Écran TFT rond 1,28 pouce, 240x240, GC9A01 | [Winstar](https://www.winstar.com.tw/) | WF0128BTYAA4DNN0 <br/><OctopartButton q="WF0128BTYAA4DNN0" /> | 1   | —       | —         |

### Caractéristiques de l'écran TFT

- **Technologie** : TFT IPS, rétroéclairage LED
- **Resolution** : 240 x 240 pixels, couleur
- **Connecteur** : FFC/FPC 18 positions (F32R-1A7H1-11018)
- **Interface** : SPI1

L'écran ne figure ni dans le schéma ni dans la nomenclature C : sa référence vient des échanges avec le bureau d'études lors de la conception de l'indice C, ses caractéristiques des fiches distributeurs.

</Release>
</ReleaseTabs>

## Transducteur audio (Buzzer)

| Composant                                           | Description                                           | Fabricant                                                             | Reference                                                   | Qte | Repères | Datasheet |
| --------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | --- | ------- | --------- |
| [SMT-0825-S-HT-R](../main-components/buttons-audio) | Transducteur piézo montage en surface, 3.6V pic-a-pic | [PUI Audio](https://puiaudio.com/product/transducers/smt-0825-s-ht-r) | SMT-0825-S-HT-R <br/><OctopartButton q="SMT-0825-S-HT-R" /> | 1   | LS1     | —         |

### Caractéristiques du buzzer

- **Type** : Transducteur piézo SMD
- **Tension** : 3.6V pic-a-pic
- **Alimentation** : +3V3, commandé par le transistor T2 (identique sur les trois releases)
- **Signal** : BEEPER_OUT (PA11 sur STM32WB55)
- **Sortie** : Mono, un seul canal
