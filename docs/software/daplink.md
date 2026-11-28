---
title: DAPLink
sidebar_position: 6
---

# DAPLink : firmware d'interface

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

[![Schéma de la flash interne de 128 Ko du STM32F103 de la STeaMi : bootloader DAPLink de 47 Ko à 0x08000000, config zone STeaMi de 1 Ko à 0x0800BC00, firmware d'interface DAPLink de 79 Ko à 0x0800C000, paramètres DAPLink de 1 Ko à 0x0801FC00](/img/diagrams/flash-stm32f103.svg)](pathname:///img/diagrams/flash-stm32f103.svg)

| Zone               | Adresse                 | Taille | Description                        |
| ------------------ | ----------------------- | ------ | ---------------------------------- |
| Bootloader         | 0x08000000 — 0x0800BBFF | 47 Ko  | Bootloader DAPLink (jamais touché) |
| Config zone        | 0x0800BC00 — 0x0800BFFF | 1 Ko   | Données usine persistantes         |
| Interface firmware | 0x0800C000 — 0x0801FBFF | 79 Ko  | Firmware DAPLink                   |
| DAPLink settings   | 0x0801FC00 — 0x0801FFFF | 1 Ko   | Paramètres DAPLink                 |

Les adresses viennent de [`daplink_addr.h`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/hic_hal/stm32/stm32f103xb/daplink_addr.h) et de [`steami_config.h`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/board/steami/steami_config.h). Elles sont les mêmes sur les trois releases, qui portent toutes un STM32F103CBT6. La flash s'efface par pages de 1 Ko : la config zone et les paramètres DAPLink occupent chacun une page.

La config zone occupe l'intervalle laissé entre le bootloader et le firmware d'interface. Une mise à jour depuis le lecteur **MAINTENANCE** remplace le firmware d'interface sans l'effacer. Le firmware d'interface, lui, ne réécrit jamais le bootloader (option `DAPLINK_BOOTLOADER_UPDATE` absente de la configuration STeaMi).

Les paramètres DAPLink gardent les options choisies en copiant un fichier de configuration sur le lecteur **STEAMI** : `AUTO_RST.CFG` ou `HARD_RST.CFG`, `AUTO_ON.CFG` ou `AUTO_OFF.CFG`, `OVFL_ON.CFG` ou `OVFL_OFF.CFG`, `COMP_ON.CFG` ou `COMP_OFF.CFG` ([`settings_rom.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/daplink/settings/settings_rom.c), [`vfs_user.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/daplink/drag-n-drop/vfs_user.c)). DAPLink ne prend ces fichiers en compte que si l'automatisation est déjà autorisée ou si le bouton de reset est appuyé pendant la copie.

## API MicroPython

Trois modules de [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) parlent au DAPLink. `DaplinkBridge` gère la liaison I2C ; `DaplinkFlash` et `SteamiConfig` passent par lui :

```text
steami_config  ──┐
                 ├──→  daplink_bridge  ──→  I2C (STM32F103)
daplink_flash  ──┘
```

### DaplinkBridge

Le pont gère toute la communication I2C avec le STM32F103 : identification, registres d'état et d'erreur, et accès à la config zone (1 Ko).

```python
from machine import I2C
from daplink_bridge import DaplinkBridge

i2c = I2C(1)
bridge = DaplinkBridge(i2c)

print("WHO_AM_I:", hex(bridge.device_id()))
print("Config zone :", bridge.has_config_zone())
```

| Méthode                            | Description                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `DaplinkBridge(i2c, address=0x3B)` | Créer le pont sur le bus I2C                                               |
| `device_id()`                      | Retourne WHO_AM_I (0x4C)                                                   |
| `busy()`                           | Retourne True si le pont est occupé                                        |
| `has_config_zone()`                | Retourne True si le firmware DAPLink a la config zone                      |
| `clear_config()`                   | Effacer la config zone                                                     |
| `write_config(data, offset=0)`     | Écrire dans la config zone (bytes ou str, offset de 0 à 1023)              |
| `read_config()`                    | Lire la config zone (octets jusqu'au premier 0xFF, `b""` si elle est vide) |

Les anciens firmwares DAPLink n'ont pas de config zone et se bloquent sur les commandes de configuration. Appeler `has_config_zone()` avant `read_config()`, `write_config()` ou `clear_config()`. Une fois connu, le résultat est gardé en mémoire et le test ne repasse pas sur le bus ; un pont qui ne répond pas (occupé, pas de réponse) donne False et sera testé de nouveau au prochain appel. `SteamiConfig` ne fait pas ce test lui-même.

### DaplinkFlash

`DaplinkFlash` gère le fichier de la flash externe W25Q64, que l'ordinateur voit sur le disque USB.

```python
from machine import I2C
from daplink_bridge import DaplinkBridge
from daplink_flash import DaplinkFlash

i2c = I2C(1)
bridge = DaplinkBridge(i2c)
flash = DaplinkFlash(bridge)
```

| Méthode                   | Description                       |
| ------------------------- | --------------------------------- |
| `DaplinkFlash(bridge)`    | Créer le driver sur un pont       |
| `set_filename(name, ext)` | Définir le fichier (format 8.3)   |
| `get_filename()`          | Retourne (name, ext)              |
| `clear_flash()`           | Effacer toute la flash W25Q64     |
| `write(data)`             | Écrire des données (bytes ou str) |
| `write_line(text)`        | Écrire une ligne (texte + \\n)    |
| `read_sector(sector)`     | Lire un secteur de 256 octets     |
| `read(length=None)`       | Lire le fichier courant           |

`clear_flash()` n'efface pas la config zone, qui se trouve dans la flash interne du STM32F103.

### Exemple : écrire des données CSV

```python
from machine import I2C
from daplink_bridge import DaplinkBridge
from daplink_flash import DaplinkFlash

i2c = I2C(1)
bridge = DaplinkBridge(i2c)
flash = DaplinkFlash(bridge)

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
from daplink_bridge import DaplinkBridge
from steami_config import SteamiConfig

i2c = I2C(1)
bridge = DaplinkBridge(i2c)
config = SteamiConfig(bridge)

if bridge.has_config_zone():
    config.load()
    print(f"Board: {config.board_name}")
    print(f"Revision: {config.board_revision}")
else:
    print("DAPLink sans config zone : mettre à jour le firmware")
```

| Propriété / Méthode                                  | Description                                     |
| ---------------------------------------------------- | ----------------------------------------------- |
| `SteamiConfig(bridge)`                               | Créer la config sur un pont                     |
| `load()`                                             | Charger la config depuis la flash               |
| `save()`                                             | Sauvegarder la config dans la flash             |
| `board_revision`                                     | Code de révision (int ou None)                  |
| `board_name`                                         | Nom de la carte (str ou None)                   |
| `set_temperature_calibration(sensor, gain, offset)`  | Stocker la calibration température              |
| `get_temperature_calibration(sensor)`                | Lire la calibration température                 |
| `apply_temperature_calibration(sensor_instance)`     | Appliquer la calibration à un capteur           |
| `set_magnetometer_calibration(hard_iron_x, …)`       | Stocker la calibration du LIS2MDL (6 valeurs)   |
| `get_magnetometer_calibration()`                     | Lire la calibration du LIS2MDL                  |
| `apply_magnetometer_calibration(lis2mdl_instance)`   | Appliquer la calibration au LIS2MDL             |
| `set_accelerometer_calibration(ox, oy, oz)`          | Stocker les décalages de l'accéléromètre (en g) |
| `get_accelerometer_calibration()`                    | Lire les décalages de l'accéléromètre           |
| `apply_accelerometer_calibration(ism330dl_instance)` | Appliquer les décalages à l'ISM330DL            |
| `set_boot_count(count)`                              | Fixer le compteur de démarrages                 |
| `get_boot_count()`                                   | Lire le compteur de démarrages (int ou None)    |
| `increment_boot_count()`                             | Ajouter 1 au compteur de démarrages             |

Les méthodes `set_*` et `increment_boot_count()` ne modifient que la copie en mémoire : `save()` l'écrit dans la config zone. Le code de révision est décrit dans [Révisions de la carte](../hardware/revisions#identifier-sa-version).

#### Capteurs supportés pour la calibration température

| Clé   | Capteur                                          |
| ----- | ------------------------------------------------ |
| `mag` | LIS2MDL                                          |
| `ism` | ISM330DL                                         |
| `hid` | WSEN-HIDS                                        |
| `pad` | WSEN-PADS                                        |
| `bme` | BME280                                           |
| `hts` | WSEN-HIDS (ancienne clé, lue pour compatibilité) |

La clé `hts` vient d'anciens outils de calibration, qui rangeaient sous ce nom la calibration du capteur d'humidité à l'adresse `0x5F`. Ce capteur est le WSEN-HIDS : aucune carte STeaMi ne porte de HTS221. `steami_config` lit et écrit toujours cette clé sous le nom `hts221`, pour relire les zones déjà écrites. Le driver [`steami`](./micropython#drivers-disponibles) s'en sert pour le WSEN-HIDS quand la clé `hid` manque ou ne contient que la calibration neutre (gain 1, décalage 0).

#### Format JSON de la config zone

```json
{
  "rev": 131,
  "name": "STeaMi-01",
  "tc": { "hid": { "g": 1.0, "o": -0.5 }, "pad": { "g": 1.0, "o": -1.73 } },
  "cm": { "hx": 12.3, "hy": -5.1, "hz": 0.8, "sx": 1.01, "sy": 0.98, "sz": 1.0 },
  "ca": { "ox": 0.01, "oy": -0.02, "oz": 0.03 },
  "bc": 0
}
```

| Clé    | Contenu                                                                  |
| ------ | ------------------------------------------------------------------------ |
| `rev`  | Code de révision de la carte                                             |
| `name` | Nom de la carte                                                          |
| `tc`   | Calibration température par capteur : gain `g`, offset `o`               |
| `cm`   | Calibration du magnétomètre : hard-iron `hx/hy/hz`, soft-iron `sx/sy/sz` |
| `ca`   | Décalages de l'accéléromètre en g : `ox/oy/oz`                           |
| `bc`   | Compteur de démarrages                                                   |

## Mise à jour du firmware

Le firmware DAPLink se met à jour depuis le lecteur **MAINTENANCE**, que présente le bootloader du STM32F103. Quand le DAPLink de la carte est plus ancien que celui retenu par le wiki, la page Téléverser du Codespace et les boutons du wiki qui se connectent à la carte affichent ces étapes (voir [Mettre à jour le DAPLink depuis la page](./arduino/codespace#mettre-à-jour-le-daplink-depuis-la-page)). Cette mise à jour n'efface pas le programme de la carte.

1. Télécharger [stm32f103xb_steami32_if_crc.bin](https://github.com/steamicc/DAPLink/releases/latest/download/stm32f103xb_steami32_if_crc.bin) (dernière release du DAPLink).
2. Débrancher le câble USB de la carte, puis le rebrancher en maintenant le bouton **Reset** enfoncé : un lecteur **MAINTENANCE** apparaît à la place du lecteur de la carte (**STEAMI**). Relâcher alors le bouton. Si une batterie est branchée, la débrancher aussi : sinon la carte reste alimentée et le lecteur **MAINTENANCE** n'apparaît pas.
3. Copier le fichier téléchargé sur le lecteur **MAINTENANCE**, puis attendre que le lecteur de la carte revienne.

Si le lecteur **MAINTENANCE** n'apparaît pas, ou pour ne pas débrancher la batterie, créer un fichier vide nommé `START_BL.ACT` sur le lecteur de la carte (**STEAMI**) : la carte redémarre sur le lecteur **MAINTENANCE**. Sous Windows, vérifier que le fichier ne s'appelle pas `START_BL.ACT.txt` (voir [le dépannage du Codespace](./arduino/codespace#le-bouton-redémarrer-la-carte-ne-fonctionne-pas)).

## Installation initiale (DapLink-EasyFlash)

Pour une carte neuve sans DAPLink, l'installation initiale se fait via une sonde SWD (ST-Link ou Black Magic Probe) avec l'outil [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash) :

1. Connecter la sonde SWD aux broches SWCLK/SWDIO du port debug
2. Connecter la carte via USB
3. Lancer DapLink-EasyFlash

L'outil effectue automatiquement :

- Déverrouillage du RDP du STM32F103
- Effacement de la flash
- Flash du bootloader
- Flash du firmware DAPLink

### Fichiers firmware

| Composant            | Lien                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Bootloader STM32F103 | [stm32f103xb_bl.bin](https://github.com/steamicc/DAPLink/releases/latest/download/stm32f103xb_bl.bin)                   |
| Firmware STeaMi      | [stm32f103xb_steami32_if.bin](https://github.com/steamicc/DAPLink/releases/latest/download/stm32f103xb_steami32_if.bin) |

Voir le [README DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash) pour les instructions détaillées et le câblage.

## Pile radio Bluetooth

La pile radio tourne sur le second cœur du STM32WB55, pas sur le DAPLink. Les outils qui l'installent passent par le DAPLink, à travers le câble USB, et le bouton **Vérifier la pile radio** du wiki demande le DAPLink proposé par le wiki (voir [Condition : le DAPLink du wiki](./pile-radio#condition--le-daplink-du-wiki)). Le choix de la pile et son installation sont décrits dans [Pile radio Bluetooth](./pile-radio).

## Voir aussi

- [Arduino — Fichier sur le disque USB](./arduino/capteurs#fichier-sur-le-disque-usb) — Drivers `SteamiDaplinkFlash` et `SteamiConfig`
- [Hardware — STM32F103](../hardware/main-components/stm32f103) — Détails du MCU interface
- [Hardware — Flash W25Q64](../hardware/main-components/w25q64) — Mémoire flash externe
- [Conception — Service et USB](../design/service-usb) — Exigences et justifications
- [Code source DAPLink](https://github.com/steamicc/DAPLink) — Firmware (branche `release_letssteam`)
- [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash) — Outil d'installation initiale
- [Pile radio Bluetooth](./pile-radio) — Choix et installation de la pile radio
- [Code source daplink_bridge](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_bridge) — Pont I2C MicroPython
- [Code source daplink_flash](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash) — Driver MicroPython
- [Code source steami_config](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config) — Module config
