---
sidebar_position: 8
title: 'Boutons et buzzer'
---

# Boutons et buzzer

## Boutons

La carte dispose de 7 boutons utilisateur (4 directions + A + B + Menu) plus un bouton reset. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour économiser des broches MCU.

### Boutons directionnels (via MCP23009)

| Bouton | Broche MCP23009 |
| ------ | --------------- |
| UP     | GP7             |
| DOWN   | GP5             |
| LEFT   | GP6             |
| RIGHT  | GP4             |

- **Composant** : ALPS SKRHABE010 (joystick 4 directions avec push central)

### Boutons A et B (GPIO directs)

| Bouton | Signal              | Pin STM32WB55 |
| ------ | ------------------- | ------------- |
| A      | GPIO1_EDGE_BOUTON_A | PA7 (= P5)    |
| B      | GPIO6_EDGE_BOUTON_B | PA8 (= P11)   |

- **Composant** : C&K PTS647SM38SMTR2LFS (SW5 pour A, SW4 pour B), comme le bouton Menu (SW3)

Le C&K PTS636 SM25J SMTR LFS des nomenclatures est le bouton Reset SW1, monté en face arrière.

### Bouton Menu

| Bouton | Signal      | Pin STM32WB55 |
| ------ | ----------- | ------------- |
| Menu   | MENU_BOUTON | PA0           |

- **Fonction secondaire** : réveil du mode basse consommation
- **Fonction secondaire** : appairage BLE (appui long à l'allumage)

### Configuration électrique

Tous les boutons sont connectés avec des résistances de pull-up.

## Expandeur GPIO — MCP23009

L'expandeur MCP23009 fournit 8 GPIO supplémentaires sur le bus I2C1 interne. Il est utilisé pour les boutons directionnels et les pads crocodile.

| Caractéristique    | Détail                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Modèle             | [MCP23009-E/MG](https://www.microchip.com/en-us/product/MCP23009)                       |
| Fabricant          | Microchip                                                                               |
| Interface          | I2C (bus I2C1 interne)                                                                  |
| Adresse I2C        | 0x20 (7 bits)                                                                           |
| GPIO               | 8 (GP0-GP7)                                                                             |
| Reset              | RST_EXPANDER → PB1                                                                      |
| Interruption       | INT_EXPANDER → PB0                                                                      |
| Driver MicroPython | [mcp23009e](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e) |

| Broche | Pin STeaMi | Fonction                   |
| ------ | ---------- | -------------------------- |
| GP0    | P28        | GPIO (pad crocodile)       |
| GP1    | P29        | GPIO (pad crocodile)       |
| GP2    | P24        | GPIO (pad crocodile)       |
| GP3    | P25        | GPIO (pad crocodile)       |
| GP4    | RIGHT      | Bouton directionnel droit  |
| GP5    | DOWN       | Bouton directionnel bas    |
| GP6    | LEFT       | Bouton directionnel gauche |
| GP7    | UP         | Bouton directionnel haut   |

## Buzzer

| Caractéristique | Détail                              |
| --------------- | ----------------------------------- |
| Modèle          | SMT-0825-S-HT-R                     |
| Fabricant       | PUI Audio                           |
| Type            | Transducteur piézo SMD              |
| Tension         | 3.6V pic-à-pic                      |
| Signal          | BEEPER_OUT → PA11 (STM32WB55)       |
| Alimentation    | +3V3, commandé par le transistor T2 |
| Sortie          | Mono, un seul canal                 |

## Schémas

Les trois feuilles ci-dessous viennent du schéma de l'indice B1 (V1b), publié dans le [reference design](https://github.com/steamicc/steami-reference-design). Leur contenu est le même dans le schéma de l'indice C (V1c) ; seul le cartouche change.

Feuille FP9, boutons :

[![Schéma FP9-Boutons](/img/schematics/FP9-Boutons.png)](/docs/schematics/FP9-Boutons.pdf)

Feuille FP7, expandeur GPIO MCP23009 (U8) :

[![Schéma FP7-Extension_GPIO](/img/schematics/FP7-Extension_GPIO.png)](/docs/schematics/FP7-Extension_GPIO.pdf)

Feuille FP10, sortie audio (buzzer LS1, transistor T2) :

[![Schéma FP10-Sortie_audio](/img/schematics/FP10-Sortie_audio.png)](/docs/schematics/FP10-Sortie_audio.pdf)

- [Schéma Altium — FP9 Boutons](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP9-Bouton_de_controle.SchDoc)
- [Schéma Altium — FP10 Audio](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP10-Sortie_Audio.SchDoc)
- [Schéma Altium — FP7 Extension GPIO](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP7-Port_extention.SchDoc)

## Voir aussi

- [Conception — Interface utilisateur](../../design/user-interface)
- [Pin Mapping — Boutons](../pin-mapping/buttons)
- [Vue d'ensemble du matériel](../)
