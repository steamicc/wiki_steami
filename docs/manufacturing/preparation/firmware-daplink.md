---
title: 2. Firmware DAPLink
sidebar_position: 2
---

# 2. Firmware DAPLink

Le firmware DAPLink (firmware d'interface) s'installe par le lecteur **MAINTENANCE** que présente le bootloader de l'[étape 1](./bootloader-daplink). Il s'écrit à 0x0800C000, après la config zone, et donne à la carte toutes ses fonctions USB : lecteur **STEAMI**, port série, CMSIS-DAP et WebUSB (voir [STM32F103 — Interfaces USB](/docs/hardware/main-components/stm32f103#interfaces-usb)). Les étapes suivantes en ont toutes besoin.

## Fichier

Le fichier est [`stm32f103xb_steami32_if_crc.bin`](https://github.com/steamicc/DAPLink/releases/download/2026-11-25.3/stm32f103xb_steami32_if_crc.bin), de la release 2026-11-25.3. C'est celui que le wiki épingle et que proposent la [mise à jour du DAPLink](/docs/software/daplink#mise-à-jour-du-firmware) et le Codespace. La documentation du DAPLink le désigne comme l'image à utiliser pour les nouvelles cartes, et indique que le fichier sans `_crc`, `stm32f103xb_steami32_if.bin`, ne doit pas servir ([`BUILD_OUTPUT.md`](https://github.com/steamicc/DAPLink/blob/release_letssteam/docs/BUILD_OUTPUT.md)). Le README de DapLink-EasyFlash cite encore ce dernier : choisir quand même la version `_crc`.

## Installation

Avec DapLink-EasyFlash, rien à faire de plus : après le bootloader, l'outil attend le lecteur **MAINTENANCE** et y copie le fichier choisi dans **Firmware file** (voir [Avec DapLink-EasyFlash](./bootloader-daplink#avec-daplink-easyflash)).

Sans l'outil, ou pour recommencer cette seule étape, copier le fichier sur le lecteur **MAINTENANCE**, comme pour une [mise à jour du DAPLink](/docs/software/daplink#mise-à-jour-du-firmware). Sur une carte qui sort de l'étape 1, le lecteur **MAINTENANCE** est déjà là ; sur une carte qui a déjà un firmware DAPLink, il s'obtient en branchant la carte, batterie débranchée, bouton **Reset** enfoncé.

Depuis un clone de [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib), le script [`deploy_usb.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/scripts/deploy_usb.py) trouve le lecteur par son nom sous Linux, macOS ou Windows, y copie le fichier puis vide les caches d'écriture :

```bash
python3 scripts/deploy_usb.py --label MAINTENANCE stm32f103xb_steami32_if_crc.bin
```

:::danger Cibles SWD du Makefile de micropython-steami-lib

Ne pas utiliser `make daplink-deploy-pyocd` ni `make daplink-deploy-openocd` pour installer le firmware par une sonde. Leur adresse, `DAPLINK_FLASH_ADDR ?= 0x08002000` dans [`env.mk`](https://github.com/steamicc/micropython-steami-lib/blob/main/env.mk), tombe dans la zone du bootloader, alors que le firmware d'interface commence à 0x0800C000 ([`daplink_addr.h`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/hic_hal/stm32/stm32f103xb/daplink_addr.h)). `make daplink-deploy-usb`, qui passe par le lecteur **MAINTENANCE**, n'est pas concerné.

:::

## Résultat attendu

Une fois la copie terminée, le bootloader lance le firmware : le lecteur **MAINTENANCE** disparaît et le lecteur **STEAMI** apparaît. Il contient `DETAILS.TXT`, qui donne notamment la version du bootloader et celle du firmware d'interface.

La release du firmware se lit par la commande CMSIS-DAP 0x9F, propre à la STeaMi. Sous Linux, depuis un clone de la branche `release_letssteam` du [DAPLink](https://github.com/steamicc/DAPLink/tree/release_letssteam) ([`steami_version.py`](https://github.com/steamicc/DAPLink/blob/release_letssteam/tools/steami_version.py), accès en écriture au périphérique `/dev/hidrawN` nécessaire) :

```bash
python3 tools/steami_version.py
```

Pour la release 2026-11-25.3, la dernière ligne attendue est `STM1: release 3, date 20261125`. Une release 0 signale un firmware compilé localement.

L'effacement complet de l'étape 1 a vidé la config zone : elle sera écrite à l'[étape 6](./configuration-usine).
