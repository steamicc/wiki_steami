---
sidebar_position: 11
title: "Boutons de controle"
---

# Boutons de controle

**Identifiant** : FP9

Un ensemble de boutons de controle permet aux utilisateurs d'interagir avec la carte. Cela inclut des boutons directionnels, un bouton reset et des boutons de menu pour naviguer entre les differents modes ou fonctions.

## Configuration des boutons

Le systeme necessite 7 boutons utilisateur au total : gauche, haut, droite, bas (en configuration d-pad), A, B et Menu.

### Boutons directionnels (via MCP23009)

Les 4 boutons directionnels sont connectes via l'expandeur GPIO MCP23009 :

| Bouton | Broche MCP23009 | PCB |
|--------|-----------------|-----|
| UP | GP7 | Up |
| DOWN | GP5 | Down |
| LEFT | GP6 | Left |
| RIGHT | GP4 | Right |

- **Composant** : ALPS SKRHABE010 (joystick 4 directions avec push central)

### Boutons A et B (GPIO directs)

| Bouton | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| A_BUTTON | GPIO1_EDGE_BOUTON_A | PA7 (= P5) |
| B_BUTTON | GPIO6_EDGE_BOUTON_B | PA8 (= P11) |

- **Composant** : C&K PTS636 SM25J SMTR LFS / PTS647SM38SMTR2LFS

### Bouton Menu

| Bouton | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| MENU_BUTTON | MENU_BOUTON | PA0 |

- Fonction secondaire : reveil du mode basse consommation
- Fonction secondaire : appairage BLE (appui long a l'allumage)

### Configuration electrique

Les boutons directionnels, A/B et Menu sont connectes avec des resistances de pull-up.
