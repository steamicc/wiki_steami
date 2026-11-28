---
title: 9. LEDs
sidebar_position: 3
---

# 9. LEDs

**Ce que le test vérifie** : chaque couleur de la LED RGB utilisateur et la LED Bluetooth s'allument puis s'éteignent quand le STM32WB55 pilote leur broche. Le programme ne peut pas voir une LED : après chaque allumage, l'opérateur confirme ce qu'il a vu. Les LEDs sont décrites dans [LEDs](/docs/hardware/main-components/leds).

**Lancer** : scénario [`board_leds.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/board_leds.yaml), interactif.

```bash
make test-board_leds PORT=/dev/ttyACM0
```

## Résultat attendu

| Broche (STM32WB55) | Ce que fait le test                                               | Question posée à l'opérateur                            |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `LED_RED` (PC12)   | Allume 1 s, puis éteint                                           | La LED rouge s'est-elle allumée puis éteinte ?          |
| `LED_GREEN` (PC11) | Allume 1 s, puis éteint                                           | La LED verte s'est-elle allumée puis éteinte ?          |
| `LED_BLUE` (PC10)  | Allume 1 s, puis éteint                                           | La LED bleue s'est-elle allumée puis éteinte ?          |
| Les trois          | Rouge, vert, bleu, puis blanc (les trois ensemble), 500 ms chacun | La LED a-t-elle affiché rouge, vert, bleu, puis blanc ? |
| `LED_BLE` (PH3)    | Allume 1 s, puis éteint                                           | La LED BLE (bleue) s'est-elle allumée puis éteinte ?    |

Chaque question attend une réponse positive. Avant le premier test et avant celui de la LED BLE, le banc demande d'appuyer sur Entrée puis d'observer la carte.

## LEDs d'état

Les autres LEDs ne sont pas reliées au STM32WB55 : `LED_CHG` dépend du chargeur de batterie, et `LED_DAP`, `LED_COM` et `LED_STATUS` sont pilotées par le STM32F103 (voir [Révisions — LEDs](/docs/hardware/revisions#leds)). Aucun scénario ne les teste. Leur contrôle visuel pendant la préparation (activité du DAPLink pendant les copies, LED de charge avec une batterie) est **à définir**.
