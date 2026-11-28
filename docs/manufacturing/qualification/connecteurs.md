---
title: 16. Connecteurs
sidebar_position: 10
---

# 16. Connecteurs

**Ce que le test vérifie** : les broches que l'utilisateur branche lui-même, sur le connecteur de bord, les pastilles crocodile, les connecteurs STEMMA/Qwiic et le connecteur Jacdac (voir [Connecteurs](/docs/hardware/main-components/connectors/)). Seul le connecteur de bord a un scénario, et ce scénario ne fait qu'un premier contrôle.

## Connecteur de bord

**Lancer** : scénario [`board_pins.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/board_pins.yaml), automatique. Ne rien brancher sur le connecteur de bord pendant le test.

```bash
make test-board_pins PORT=/dev/ttyACM0
```

| Broches                  | Ce que fait le test                                    | Attendu                  |
| ------------------------ | ------------------------------------------------------ | ------------------------ |
| P0, P1, P2, P3, P4, P10  | Configure la broche en entrée analogique et la lit     | Une valeur de 0 à 65 535 |
| P6, P7, P8, P9, P12, P16 | Configure la broche en entrée avec tirage vers le haut | 1, broche en l'air       |

Le scénario se présente lui-même comme un test de fumée : il vérifie que chaque broche se configure et se lit, pas qu'elle est reliée à sa pastille. D'après son en-tête, le contrôle de continuité demande un banc de test qui applique des tensions connues aux broches ; ce banc n'est pas encore conçu. Les broches P5 et P11 (boutons A et B), P13 à P15 (SPI) et P19, P20 (I2C3) n'y figurent pas.

Le contrôle de continuité du connecteur de bord et des pastilles crocodile est **à définir**, avec le banc qui le permettra. Les [points de test](/docs/hardware/pin-mapping/test-points) de la carte peuvent servir à le concevoir.

## STEMMA/Qwiic

Les deux connecteurs [STEMMA/Qwiic](/docs/hardware/main-components/connectors/stemma-qwiic) (J3 et J4) portent le bus I2C3 (PC0, PC1). Aucun scénario ne les teste. Leur test est **à définir**.

## Jacdac

Aucun scénario ne teste le connecteur [Jacdac](/docs/hardware/main-components/connectors/jacdac). Son test est **à définir**.
