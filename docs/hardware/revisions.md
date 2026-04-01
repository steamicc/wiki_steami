---
sidebar_position: 6
title: 'Revisions'
---

# Revisions de la carte

## Identifier sa version

La revision et le nom de la carte sont stockes dans la config zone du STM32F103 (DAPLink). Ils peuvent être lus via le module `steami_config` en MicroPython :

```python
from steami_config import SteamiConfig
from machine import I2C

config = SteamiConfig(I2C(1))
print(f"Board: {config.board_name}")
print(f"Revision: {config.board_revision}")
```

## Historique des revisions

_A venir — les details de chaque revision seront documentes ici._
