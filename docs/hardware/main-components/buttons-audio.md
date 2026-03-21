---
sidebar_position: 8
title: "Boutons et buzzer"
---

# Boutons et buzzer

## Boutons

La carte dispose de 7 boutons utilisateur (4 directions + A + B + Menu) plus un bouton reset. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour economiser des broches MCU.

### Boutons directionnels (via MCP23009)

| Bouton | Broche MCP23009 |
|--------|-----------------|
| UP | GP7 |
| DOWN | GP5 |
| LEFT | GP6 |
| RIGHT | GP4 |

- **Composant** : ALPS SKRHABE010 (joystick 4 directions avec push central)

### Boutons A et B (GPIO directs)

| Bouton | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| A | GPIO1_EDGE_BOUTON_A | PA7 (= P5) |
| B | GPIO6_EDGE_BOUTON_B | PA8 (= P11) |

- **Composant** : C&K PTS636 SM25J SMTR LFS / PTS647SM38SMTR2LFS

### Bouton Menu

| Bouton | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| Menu | MENU_BOUTON | PA0 |

- **Fonction secondaire** : reveil du mode basse consommation
- **Fonction secondaire** : appairage BLE (appui long a l'allumage)

### Configuration electrique

Tous les boutons sont connectes avec des resistances de pull-up.

## Expandeur GPIO — MCP23009

L'expandeur MCP23009 fournit 8 GPIO supplementaires sur le bus I2C1 interne. Il est utilise pour les boutons directionnels et les pads crocodile.

| Caracteristique | Detail |
|---|---|
| Modele | [MCP23009-E/MG](https://www.microchip.com/en-us/product/MCP23009) |
| Fabricant | Microchip |
| Interface | I2C (bus I2C1 interne) |
| GPIO | 8 (GP0-GP7) |
| Reset | RST_EXPANDER → PB1 |
| Interruption | INT_EXPANDER → PB0 |
| Driver MicroPython | [mcp23009e](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e) |

| Broche | Pin STeaMi | Fonction |
|--------|------------|----------|
| GP0 | P28 | GPIO (pad crocodile) |
| GP1 | P29 | GPIO (pad crocodile) |
| GP2 | P24 | GPIO (pad crocodile) |
| GP3 | P25 | GPIO (pad crocodile) |
| GP4 | RIGHT | Bouton directionnel droit |
| GP5 | DOWN | Bouton directionnel bas |
| GP6 | LEFT | Bouton directionnel gauche |
| GP7 | UP | Bouton directionnel haut |

## Buzzer

| Caracteristique | Detail |
|---|---|
| Modele | SMT-0825-S-HT-R |
| Fabricant | PUI Audio |
| Type | Transducteur piezo SMD |
| Tension | 3.6V pic-a-pic |
| Signal | BEEPER_OUT → PA11 (STM32WB55) |
| Alimentation | Boost converter LMR62421 (14.5V) |
| Sortie | Mono, un seul canal |

## Schemas

- [Schema complet (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/PDF/STeaMi-Schematic.PDF)

- [Schema Altium — FP9 Boutons](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP9-Bouton_de_controle.SchDoc)
- [Schema Altium — FP10 Audio](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP10-Sortie_Audio.SchDoc)
- [Schema Altium — FP7 Extension GPIO](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP7-Port_extention.SchDoc)

## Voir aussi

- [Conception — Interface utilisateur](../../design/user-interface)
- [Pin Mapping — Boutons](../pin-mapping/buttons)
- [Vue d'ensemble du materiel](../)
