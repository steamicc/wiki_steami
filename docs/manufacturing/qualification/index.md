---
title: Qualification
sidebar_position: 3
---

import TOCInline from '@theme/TOCInline';

# Qualification d'une carte

La qualification vérifie, carte par carte, chaque fonction de la STeaMi une fois les programmes installés. Elle s'appuie sur les scénarios de test du dépôt [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib/tree/main/tests/scenarios) : des fichiers YAML que `pytest` exécute sur la carte par le port série, avec `mpremote`. Certains tests sont automatiques ; d'autres demandent à l'opérateur d'appuyer sur un bouton ou de confirmer ce qu'il voit ou entend.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

:::caution Procédure non déroulée sur une V1c de série

Les commandes et les résultats attendus viennent des scénarios du dépôt (branche `main` au 28 novembre 2026). Les scénarios n'ont pas encore été lancés ensemble sur une V1c de série. Plusieurs tests demandés n'ont pas de scénario : ils sont signalés « à définir ».

:::

## Installer le banc de test

Sur l'ordinateur de test (Linux, avec Python 3, `make` et `npm`), une seule fois :

```bash
git clone https://github.com/steamicc/micropython-steami-lib.git
cd micropython-steami-lib
make setup
```

`make setup` crée un environnement Python `.venv` avec `pytest`, `pyyaml` et `mpremote`, et installe les outils du dépôt (voir [`TESTING.md`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/TESTING.md)). Les tests appellent la commande `mpremote` par son nom ([`mpremote_bridge.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/runner/mpremote_bridge.py)) : activer l'environnement dans chaque terminal de test, sauf si `mpremote` est déjà installé sur le système.

```bash
source .venv/bin/activate
```

La carte se branche en USB ; son port série est `/dev/ttyACM0` par défaut, et se change avec `PORT=…`.

## Lancer les tests

Tous les tests matériels d'un coup :

```bash
make test-hardware PORT=/dev/ttyACM0
```

Les tests d'un seul scénario, par exemple pour reprendre un test qui a échoué :

```bash
make test-board_i2c_scan PORT=/dev/ttyACM0
```

Le nom de la cible est `test-` suivi du champ `driver` du scénario (`make test-bme280`) ou, pour un scénario de carte (`type: board`), du nom du fichier (`make test-board_leds`). Les tests interactifs ne tournent que dans un terminal.

Avant le premier test limité à une release, le banc détecte la release de la carte avec `Steami.begin()` et l'écrit, par exemple `[STeaMi] Board V1c (found by Steami.begin())`. Les tests d'une autre release sont sautés, avec leur raison. Pour ne pas dépendre de cette détection, donner la release :

```bash
python -m pytest tests/ -v --port /dev/ttyACM0 -s -k hardware --release V1c
```

Ajouter `--report auto` à cette commande range un rapport Markdown daté dans `reports/`. La trace à garder pour chaque carte (rapport, numéro, nom) est **à définir**.

:::warning Config zone et lecteur STEAMI

Les scénarios `daplink_bridge`, `daplink_flash` et `steami_config` effacent la config zone et y écrivent des valeurs de test ; `daplink_flash` écrit aussi des fichiers de test dans la flash W25Q64, que `daplink_flash` et `steami_config` effacent (voir [Flash W25Q64](./flash#après-le-test)). Après la qualification, réécrire la configuration d'usine (voir [Après la qualification](../preparation/configuration-usine#après-la-qualification)).

:::

## Les tests

| N°  | Test                         | Scénarios (`make test-…`)                                                                             | Sans scénario (à définir)                                            |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 7   | [Bus I2C](./i2c)             | `board_i2c_scan`                                                                                      | —                                                                    |
| 8   | [Capteurs](./capteurs)       | `bme280`, `ism330dl`, `lis2mdl`, `vl53l1x`, `bq27441`, `steami_board`, `board_temperature_comparison` | Microphone IMP34DT05                                                 |
| 9   | [LEDs](./leds)               | `board_leds`                                                                                          | LEDs pilotées par le DAPLink et le chargeur                          |
| 10  | [Boutons](./boutons)         | `board_buttons`, `mcp23009e`, `steami_board`                                                          | Bouton Reset                                                         |
| 11  | [Buzzer](./buzzer)           | `board_buzzer`                                                                                        | —                                                                    |
| 12  | [Écran](./ecran)             | `steami_screen_v1c`                                                                                   | Contrôle visuel sur la V1c                                           |
| 13  | [USB](./usb)                 | —                                                                                                     | Liste des interfaces ; les étapes de préparation en utilisent quatre |
| 14  | [Flash W25Q64](./flash)      | `daplink_flash`, `daplink_bridge`, `steami_config`                                                    | —                                                                    |
| 15  | [Bluetooth](./bluetooth)     | —                                                                                                     | Scan Bluetooth                                                       |
| 16  | [Connecteurs](./connecteurs) | `board_pins`                                                                                          | Continuité, STEMMA/Qwiic, Jacdac                                     |

Les scénarios des capteurs des V1a et V1b (`wsen_hids`, `wsen_pads`, `apds9960`) et de leur écran (`ssd1327`) sont sautés sur une V1c.

## Résultat attendu

Une carte V1c est qualifiée quand tous les tests lancés passent, sans autre échec que ceux qu'explique l'absence de batterie (voir [Capteurs](./capteurs#batterie)), et quand les tests sans scénario ont été faits. Que faire d'une carte qui échoue (réparation, mise au rebut, nouvelle tentative) est **à définir**.
