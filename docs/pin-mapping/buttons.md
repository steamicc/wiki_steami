---
sidebar_position: 3
title: "Boutons"
---

# Boutons

La carte STeaMi dispose de 7 boutons utilisateur plus un bouton reset.

## Boutons directionnels (via MCP23009)

Les 4 boutons directionnels sont connectes via l'expandeur GPIO MCP23009 sur le bus I2C interne.

| Bouton | Signal | Broche MCP23009 | PCB |
|--------|--------|-----------------|-----|
| UP_BUTTON | UP | GP7 | Up |
| DOWN_BUTTON | DOWN | GP5 | Down |
| LEFT_BUTTON | LEFT | GP6 | Left |
| RIGHT_BUTTON | RIGHT | GP4 | Right |

## Boutons A et B (GPIO directs)

Les boutons A et B sont connectes directement au STM32WB55 et sont partages avec les broches P5 et P11 du connecteur edge.

| Bouton | Signal | Pin STM32WB55 | PCB | Partage avec |
|--------|--------|---------------|-----|--------------|
| A_BUTTON | GPIO1_EDGE_BOUTON_A | PA7 | A | P5 |
| B_BUTTON | GPIO6_EDGE_BOUTON_B | PA8 | B | P11 |

## Bouton Menu

| Bouton | Signal | Pin STM32WB55 | PCB |
|--------|--------|---------------|-----|
| MENU_BUTTON | MENU_BOUTON | PA0 | Menu |

Le bouton Menu a plusieurs fonctions :
- Acces au menu de la carte
- Reveil depuis le mode basse consommation (sleep)
- Appairage BLE (appui long a l'allumage)

## Points de test associes

| Bouton | Test Point |
|--------|-----------|
| UP | TP66 |
| DOWN | TP64 |
| LEFT | TP65 |
| RIGHT | TP63 |
| MENU | TP67 |
| A (P5) | TP69 |
| B (P11) | TP68 |
