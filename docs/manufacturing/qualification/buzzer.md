---
title: 11. Buzzer
sidebar_position: 5
---

# 11. Buzzer

**Ce que le test vérifie** : le buzzer joue les sons que le STM32WB55 lui envoie en PWM sur la broche `SPEAKER` (timer 1, canal 4). Le programme ne peut pas entendre le son : après chaque essai, l'opérateur confirme ce qu'il a entendu. Le buzzer est décrit dans [Boutons et audio](/docs/hardware/main-components/buttons-audio).

**Lancer** : scénario [`board_buzzer.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/board_buzzer.yaml), interactif. Le faire dans un endroit assez calme pour entendre le buzzer.

```bash
make test-board_buzzer PORT=/dev/ttyACM0
```

## Résultat attendu

| Ce que joue le test                           | Question posée à l'opérateur                                   |
| --------------------------------------------- | -------------------------------------------------------------- |
| La 440 Hz pendant 500 ms                      | Avez-vous entendu un bip (La 440Hz) ?                          |
| Balayage de 200 à 2 000 Hz, par pas de 100 Hz | Avez-vous entendu un balayage de fréquence (grave vers aigu) ? |
| Début de l'Hymne à la joie                    | Avez-vous reconnu l'Hymne à la joie (Beethoven) ?              |

Chaque question attend une réponse positive.
