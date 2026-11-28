---
title: 7. Bus I2C
sidebar_position: 1
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# 7. Bus I2C

**Ce que le test vérifie** : chaque composant du bus I2C interne (I2C1) répond à son adresse, aucun composant inconnu n'y répond, et chaque puce donne son registre d'identification. Un composant absent, mal soudé ou d'une autre référence que prévu fait échouer le test. Les adresses sont celles de [Capteurs et bus internes](/docs/hardware/pin-mapping/internal-bus#adresses-i2c).

**Lancer** : scénario [`board_i2c_scan.yaml`](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/scenarios/board_i2c_scan.yaml).

```bash
make test-board_i2c_scan PORT=/dev/ttyACM0
```

Le test sort d'abord l'expandeur MCP23009E de son reset (broche `RST_EXPANDER`), sans quoi il ne répond pas au scan.

## Résultat attendu

<ReleaseTabs>
<Release releases="v1c">

| Test                         | Attendu                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Adresses présentes           | 0x1E (LIS2MDL), 0x20 (MCP23009E), 0x29 (VL53L1X), 0x3B (STM32F103), 0x6B (ISM330DL), 0x76 (BME280) |
| Adresses inconnues           | Aucune ; 0x55 (BQ27441) est admise                                                                 |
| LIS2MDL, WHO_AM_I            | 0x40                                                                                               |
| MCP23009E, IODIR après reset | 0xFF                                                                                               |
| VL53L1X, identifiant         | 0xEACC                                                                                             |
| ISM330DL, WHO_AM_I           | 0x6A                                                                                               |
| BME280, identifiant          | 0x60                                                                                               |

</Release>
<Release releases="v1a v1b">

| Test                         | Attendu                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Adresses présentes           | 0x1E (LIS2MDL), 0x20 (MCP23009E), 0x29 (VL53L1X), 0x39 (APDS-9960), 0x3B (STM32F103), 0x5D (WSEN-PADS), 0x5F (WSEN-HIDS), 0x6B (ISM330DL) |
| Adresses inconnues           | Aucune ; 0x55 (BQ27441) est admise                                                                                                        |
| LIS2MDL, WHO_AM_I            | 0x40                                                                                                                                      |
| MCP23009E, IODIR après reset | 0xFF                                                                                                                                      |
| VL53L1X, identifiant         | 0xEACC                                                                                                                                    |
| APDS-9960, identifiant       | 0xAB                                                                                                                                      |
| WSEN-PADS, identifiant       | 0xB3                                                                                                                                      |
| WSEN-HIDS, identifiant       | 0xBC                                                                                                                                      |
| ISM330DL, WHO_AM_I           | 0x6A                                                                                                                                      |

</Release>
</ReleaseTabs>

La jauge BQ27441 (0x55) ne répond que si une batterie est branchée : le scénario ne l'exige pas, mais l'accepte. Elle est testée avec les [capteurs](./capteurs#batterie).
