---
sidebar_position: 9
title: "Extension GPIO"
---

# Extension GPIO

**Identifiant** : FP7

Ce port etend les capacites GPIO (General Purpose Input/Output), permettant la connexion de peripheriques supplementaires. Le circuit MCP23009 fournit huit GPIO supplementaires pour une expansion flexible.

## Caracteristiques

- **Composant** : Microchip MCP23009-E/MG
- **Interface** : I2C (bus interne I2C1)
- **Nombre de GPIO** : 8

## Attribution des broches

| Broche MCP23009 | Pin STeaMi | Fonction |
|-----------------|------------|----------|
| GP0 | P28 | GPIO1 (pad crocodile) |
| GP1 | P29 | GPIO2 (pad crocodile) |
| GP2 | P24 | GPIO3 (pad crocodile) |
| GP3 | P25 | GPIO4 (pad crocodile) |
| GP4 | RIGHT_BUTTON | Bouton directionnel droit |
| GP5 | DOWN_BUTTON | Bouton directionnel bas |
| GP6 | LEFT_BUTTON | Bouton directionnel gauche |
| GP7 | UP_BUTTON | Bouton directionnel haut |

## Signaux de controle

- **RST_EXPANDER** -> PB1 (STM32WB55) : Reset de l'expandeur
- **INT_EXPANDER** -> PB0 (STM32WB55) : Interruption de l'expandeur
