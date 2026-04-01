---
sidebar_position: 10
title: 'Écran et audio'
---

import OctopartButton from '@site/src/components/OctopartButton';

# Écran et audio

## Écran OLED

| Composant                                          | Description                                                        | Fabricant                              | Reference                                                             | Qte | Datasheet |
| -------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------- | --- | --------- |
| [WEO128128BWPP3N00001](../main-components/display) | Module OLED graphique blanc 128x128, COG (Chip on Glass), Longlife | [Winstar](https://www.winstar.com.tw/) | WEO128128BWPP3N00001 <br/><OctopartButton q="WEO128128BWPP3N00001" /> | 1   | —         |

### Caractéristiques

- **Technologie** : OLED (pixels blancs)
- **Resolution** : 128 x 128 pixels
- **Montage** : COG (Chip on Glass)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm
- **Interface** : SPI1

## Transducteur audio (Buzzer)

| Composant                                           | Description                                           | Fabricant                                                         | Reference                                                   | Qte | Datasheet |
| --------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- | --- | --------- |
| [SMT-0825-S-HT-R](../main-components/buttons-audio) | Transducteur piézo montage en surface, 3.6V pic-a-pic | [PUI Audio](https://puiaudio.com/products/detail/SMT-0825-S-HT-R) | SMT-0825-S-HT-R <br/><OctopartButton q="SMT-0825-S-HT-R" /> | 1   | —         |

### Caractéristiques du buzzer

- **Type** : Transducteur piézo SMD
- **Tension** : 3.6V pic-a-pic
- **Alimentation** : Via convertisseur boost LMR62421 (14.5V)
- **Signal** : BEEPER_OUT (PA11 sur STM32WB55)
- **Sortie** : Mono, un seul canal
