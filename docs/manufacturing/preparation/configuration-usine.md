---
title: 6. Configuration d'usine
sidebar_position: 6
---

import TOCInline from '@theme/TOCInline';

# 6. Configuration d'usine

La configuration d'usine est rangée dans la **config zone** du STM32F103 : une page de 1 Ko de sa flash interne, à 0x0800BC00, entre le bootloader et le firmware DAPLink. Elle survit aux mises à jour du DAPLink et de MicroPython. Le STM32WB55 la lit et l'écrit par le pont I2C du DAPLink (adresse 0x3B), avec les modules `daplink_bridge` et `steami_config` (voir [DAPLink — SteamiConfig](/docs/software/daplink#steamiconfig)).

En fabrication, deux valeurs y sont écrites : la révision de la carte (`board_revision`, clé `rev`) et son nom (`board_name`, clé `name`).

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Valeurs à écrire

| Valeur           | V1c de série  | Source                                                                                                                                              |
| ---------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `board_revision` | `131`         | Code de trois chiffres : génération 1, release c, indice de série C1 (voir [Identifier sa version](/docs/hardware/revisions#identifier-sa-version)) |
| `board_name`     | **à définir** | Les sources ne donnent que des exemples (`STeaMi-01`, `STeaMi-14`) ; la règle de nommage des cartes de la série reste à fixer                       |

Les codes des autres releases (110, 111, 120, 121, 130) sont dans le même tableau de [Révisions](/docs/hardware/revisions#identifier-sa-version).

## Script

Le script part d'une configuration vide : `save()` efface la config zone avant de l'écrire, et seules les deux valeurs d'usine y sont rangées. Il s'arrête si le firmware DAPLink n'a pas de config zone (DAPLink trop ancien), car un tel firmware se bloque sur les commandes de configuration.

```python title="config_usine.py"
from machine import I2C
from daplink_bridge import DaplinkBridge
from steami_config import SteamiConfig

REVISION = 131  # V1c de série (indice C1)
NOM = "STeaMi-01"  # exemple : règle de nommage à définir

bridge = DaplinkBridge(I2C(1))
if not bridge.has_config_zone():
    raise SystemExit("DAPLink sans config zone : refaire l'étape 2")

config = SteamiConfig(bridge)
config.board_revision = REVISION
config.board_name = NOM
config.save()

relue = SteamiConfig(bridge)
relue.load()
print("rev =", relue.board_revision, "name =", relue.board_name)
```

Lancer le script depuis l'ordinateur, sans le copier sur la carte : `daplink_bridge` et `steami_config` sont compilés dans le firmware.

```bash
mpremote connect /dev/ttyACM0 run config_usine.py
```

`SteamiConfig` sans `load()` part d'un dictionnaire vide ([`device.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/steami_config/device.py)) : une calibration ou un compteur de démarrages déjà présents dans la zone seraient effacés. C'est voulu ici, la zone ne contenant à ce stade que des valeurs de test. Pour garder des valeurs déjà écrites, appeler `config.load()` avant de modifier la révision et le nom.

## Résultat attendu

Le script écrit `rev = 131 name = STeaMi-01` (avec le nom choisi). La config zone ne contient alors que ces deux clés, `rev` et `name`, en JSON compact. La même lecture se fait depuis le navigateur avec le programme de [Identifier sa version](/docs/hardware/revisions#identifier-sa-version).

## Après la qualification

Plusieurs scénarios de qualification écrivent et effacent la config zone pour la tester : `daplink_bridge`, `daplink_flash` et `steami_config`. Le dernier test de `daplink_flash`, par exemple, y laisse `{"cal": true}`. Après la qualification, relancer le script de cette page, puis vérifier la ligne qu'il écrit. C'est la dernière écriture faite sur la carte avant sa livraison.
