---
sidebar_position: 10
title: "Ecran et audio"
---

# Ecran et audio

## Ecran OLED

| Composant | Description | Fabricant | Qte | Datasheet | Octopart |
|-----------|-------------|-----------|-----|-----------|----------|
| [WEO128128BWPP3N00001](../main-components/display) | Module OLED graphique blanc 128x128, COG (Chip on Glass), Longlife | Winstar | 1 | — | [Rechercher](https://octopart.com/search?q=WEO128128BWPP3N00001) |

### Caracteristiques

- **Technologie** : OLED (pixels blancs)
- **Resolution** : 128 x 128 pixels
- **Montage** : COG (Chip on Glass)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm
- **Interface** : SPI1

## Transducteur audio (Buzzer)

| Composant | Description | Fabricant | Qte | Datasheet | Octopart |
|-----------|-------------|-----------|-----|-----------|----------|
| [SMT-0825-S-HT-R](../main-components/buttons-audio) | Transducteur piezo montage en surface, 3.6V pic-a-pic | PUI Audio Inc | 1 | [Web](https://www.puiaudio.com/products/detail/SMT-0825-S-HT-R) | [Rechercher](https://octopart.com/search?q=SMT-0825-S-HT-R) |

### Caracteristiques

- **Type** : Transducteur piezo SMD
- **Tension** : 3.6V pic-a-pic
- **Alimentation** : Via convertisseur boost LMR62421 (14.5V)
- **Signal** : BEEPER_OUT (PA11 sur STM32WB55)
- **Sortie** : Mono, un seul canal
