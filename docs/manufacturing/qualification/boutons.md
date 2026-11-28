---
title: 10. Boutons
sidebar_position: 4
---

# 10. Boutons

**Ce que le test vérifie** : chaque bouton est lu par le STM32WB55, en scrutation (_polling_) et par interruption. Les boutons A, B et MENU sont reliés directement au STM32WB55 ; les quatre directions de la croix (UP, DOWN, LEFT, RIGHT) passent par l'expandeur MCP23009E (voir [Boutons](/docs/hardware/pin-mapping/buttons)). L'opérateur appuie sur le bouton demandé quand la LED verte s'allume : il a 5 s pour le faire.

**Lancer** : trois scénarios, tous interactifs.

```bash
make test-board_buttons PORT=/dev/ttyACM0
make test-mcp23009e PORT=/dev/ttyACM0
make test-steami_board PORT=/dev/ttyACM0
```

## Résultat attendu

| Scénario                                                                                                                    | Boutons et mode                                                                                                                              | Attendu                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`board_buttons.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/board_buttons.yaml)     | A, B, MENU en scrutation puis par interruption ; UP, DOWN, LEFT, RIGHT en scrutation                                                         | Appui détecté pendant que la LED verte est allumée                              |
| [`mcp23009e.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/mcp23009e.yaml)             | Croix relâchée (registre GPIO lu à 0xF0), puis UP, DOWN, LEFT, RIGHT en scrutation et par interruption                                       | Appui détecté ; l'opérateur confirme d'abord que tous les boutons sont relâchés |
| [`steami_board.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/steami_board.yaml) (V1c) | A relâché ; quatre appuis très brefs (moins de 150 ms), un par seconde, sur A, MENU, UP et LEFT ; ligne d'interruption EXTI 0 prise par MENU | Chaque appui bref compté par la classe `Buttons` de `steami`                    |

Pour les appuis brefs de `steami_board`, la LED verte reste allumée 8 s.

## Bouton Reset

Le bouton **Reset** (SW1) relance le STM32WB55 et, tenu au branchement, fait démarrer le STM32F103 sur le lecteur **MAINTENANCE** (voir [Chaîne de démarrage](/docs/hardware/main-components/stm32f103#chaîne-de-démarrage)). Aucun scénario ne le teste ; son contrôle est **à définir**.
