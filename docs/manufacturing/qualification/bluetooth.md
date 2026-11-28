---
title: 15. Bluetooth
sidebar_position: 9
---

# 15. Bluetooth

**Ce que le test vérifie** : le second cœur du STM32WB55 a le FUS et la pile radio attendus, installés aux étapes [3](../preparation/fus) et [4](../preparation/pile-radio), et la radio Bluetooth reçoit les appareils voisins. Aucun scénario de micropython-steami-lib ne teste le Bluetooth.

## Versions du FUS et de la pile

La lecture des versions est celle de [Vérifier la pile installée](/docs/software/pile-radio#vérifier-la-pile-installée) :

```bash
mpremote connect /dev/ttyACM0 exec "import stm; print(stm.rfcore_fw_version(0)); print(stm.rfcore_fw_version(1))"
```

| Ligne | Programme  | Attendu                                |
| ----- | ---------- | -------------------------------------- |
| 1     | FUS        | Commence par `(1, 2, 0` : FUS 1.2.0    |
| 2     | Pile radio | Commence par `(1, 20, 0` : pile 1.20.0 |

Une pile en `(0, 0, 0, 0, 0)` signifie qu'aucune pile n'est installée : refaire l'[étape 4](../preparation/pile-radio).

## Scan Bluetooth

Sur une V1c munie de la pile BLE HCI Layer 1.20.0, un scan Bluetooth lancé en MicroPython a vu les appareils voisins (voir [Installer la pile](/docs/software/pile-radio#installer-la-pile)). Ni le wiki ni micropython-steami-lib ne donnent le programme de ce scan, ni le résultat à exiger d'une carte. Le scan de qualification est **à définir**.
