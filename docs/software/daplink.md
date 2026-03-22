---
title: DAPLink
sidebar_position: 6
---

# DAPLink — Firmware interface

Le STM32F103 exécute le firmware [DAPLink](https://github.com/steamicc/DAPLink) (branche `release_letssteam`). Il fait office d'interface entre l'ordinateur et le MCU applicatif (STM32WB55).

## Fonctions

| Fonction            | Protocole           | Description                              |
| ------------------- | ------------------- | ---------------------------------------- |
| Programmation       | USB MSC             | Drag-and-drop d'un fichier .hex/.bin     |
| Débogage            | USB HID (CMSIS-DAP) | Debug SWD du STM32WB55                   |
| Communication série | USB CDC             | Port série virtuel (REPL MicroPython)    |
| Interface web       | USB WebUSB          | Interaction directe depuis un navigateur |
| Flash externe       | I2C (0x3B)          | Accès à la mémoire W25Q64 (8 Mo)         |
| Config persistante  | I2C (0x3B)          | Lecture/écriture config zone (1 Ko)      |

## Protocole I2C

Le STM32F103 est accessible via le bus I2C1 à l'adresse **0x3B**.

### Commandes

| Commande     | Code | Description                            |
| ------------ | ---- | -------------------------------------- |
| WHO_AM_I     | 0x01 | Identification (retourne 0x4C)         |
| SET_FILENAME | 0x03 | Définir le nom de fichier (format 8.3) |
| GET_FILENAME | 0x04 | Lire le nom de fichier courant         |
| CLEAR_FLASH  | 0x10 | Effacer la mémoire flash W25Q64        |
| WRITE_DATA   | 0x11 | Écrire des données dans la flash       |
| READ_SECTOR  | 0x20 | Lire un secteur de 256 octets          |
| WRITE_CONFIG | 0x30 | Écrire dans la config zone             |
| READ_CONFIG  | 0x31 | Lire la config zone                    |
| CLEAR_CONFIG | 0x32 | Effacer la config zone                 |
| STATUS       | 0x80 | Lire l'état de la dernière opération   |
| ERROR        | 0x81 | Lire le code d'erreur                  |

### Constantes

| Constante       | Valeur | Description                        |
| --------------- | ------ | ---------------------------------- |
| Adresse I2C     | 0x3B   | Adresse du DAPLink sur I2C1        |
| MAX_WRITE_CHUNK | 30     | Octets max par commande WRITE_DATA |
| SECTOR_SIZE     | 256    | Taille d'un secteur flash          |
| MAX_SECTORS     | 32768  | Nombre max de secteurs (8 Mo)      |
| CONFIG_SIZE     | 1024   | Taille de la config zone (1 Ko)    |
| FILENAME_LEN    | 8      | Longueur max du nom de fichier     |
| EXT_LEN         | 3      | Longueur max de l'extension        |

## Architecture flash F103

| Zone               | Adresse                 | Taille | Description                        |
| ------------------ | ----------------------- | ------ | ---------------------------------- |
| Bootloader         | 0x08000000 — 0x0800BBFF | 47 Ko  | Bootloader DAPLink (jamais touché) |
| Config zone        | 0x0800BC00 — 0x0800BFFF | 1 Ko   | Données usine persistantes         |
| Interface firmware | 0x0800C000 — 0x0801FBFF | 79 Ko  | Firmware DAPLink                   |
| DAPLink settings   | 0x0801FC00 — 0x0801FFFF | 1 Ko   | Paramètres DAPLink                 |

## API MicroPython

### DaplinkFlash

```python
from machine import I2C
from daplink_flash import DaplinkFlash

i2c = I2C(1)
flash = DaplinkFlash(i2c)
```

| Méthode                        | Description                       |
| ------------------------------ | --------------------------------- |
| `device_id()`                  | Retourne WHO_AM_I (0x4C)          |
| `set_filename(name, ext)`      | Définir le fichier (format 8.3)   |
| `get_filename()`               | Retourne (name, ext)              |
| `clear_flash()`                | Effacer toute la flash W25Q64     |
| `write(data)`                  | Écrire des données (bytes ou str) |
| `write_line(text)`             | Écrire une ligne (texte + \\n)    |
| `read_sector(sector)`          | Lire un secteur de 256 octets     |
| `read(length=None)`            | Lire le fichier courant           |
| `clear_config()`               | Effacer la config zone            |
| `write_config(data, offset=0)` | Écrire dans la config zone        |
| `read_config()`                | Lire la config zone               |
| `busy()`                       | Retourne True si flash occupée    |

### Exemple : écrire des données CSV

```python
from machine import I2C
from daplink_flash import DaplinkFlash

i2c = I2C(1)
flash = DaplinkFlash(i2c)

flash.set_filename("DATA", "CSV")
flash.clear_flash()
flash.write_line("temperature;humidity")
flash.write_line("25.3;48.2")
flash.write_line("26.1;45.7")

content = flash.read()
print(content)
```

Les données sont ensuite accessibles via USB Mass Storage en branchant la carte à un ordinateur.

### SteamiConfig

```python
from machine import I2C
from daplink_flash import DaplinkFlash
from steami_config import SteamiConfig

i2c = I2C(1)
config = SteamiConfig(DaplinkFlash(i2c))
config.load()

print(f"Board: {config.board_name}")
print(f"Revision: {config.board_revision}")
```

| Propriété / Méthode                                 | Description                           |
| --------------------------------------------------- | ------------------------------------- |
| `load()`                                            | Charger la config depuis la flash     |
| `save()`                                            | Sauvegarder la config dans la flash   |
| `board_revision`                                    | Numéro de révision (int ou None)      |
| `board_name`                                        | Nom de la carte (str ou None)         |
| `set_temperature_calibration(sensor, gain, offset)` | Stocker la calibration température    |
| `get_temperature_calibration(sensor)`               | Lire la calibration température       |
| `apply_temperature_calibration(sensor_instance)`    | Appliquer la calibration à un capteur |

#### Capteurs supportés pour la calibration

| Clé   | Capteur   |
| ----- | --------- |
| `hts` | HTS221    |
| `mag` | LIS2MDL   |
| `ism` | ISM330DL  |
| `hid` | WSEN-HIDS |
| `pad` | WSEN-PADS |

#### Format JSON de la config zone

```json
{
  "rev": 3,
  "name": "STeaMi-01",
  "tc": { "hts": { "g": 1.0, "o": -0.5 }, "pad": { "g": 1.0, "o": -1.73 } }
}
```

## Mise à jour du firmware

Le firmware DAPLink peut être mis à jour via le mode maintenance DFU :

1. Maintenir le bouton Reset enfoncé pendant le branchement USB
2. La carte apparaît comme un disque "MAINTENANCE"
3. Glisser-déposer le fichier firmware `.hex` sur le disque
4. La carte redémarre automatiquement

## Voir aussi

- [Hardware — STM32F103](../hardware/main-components/stm32f103) — Détails du MCU interface
- [Hardware — Flash W25Q64](../hardware/main-components/w25q64) — Mémoire flash externe
- [Conception — Service et USB](../design/service-usb) — Exigences et justifications
- [Code source DAPLink](https://github.com/steamicc/DAPLink) — Firmware (branche `release_letssteam`)
- [Code source daplink_flash](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash) — Driver MicroPython
- [Code source steami_config](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config) — Module config
