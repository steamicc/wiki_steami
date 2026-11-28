---
title: 1. Bootloader DAPLink
sidebar_position: 1
---

import TOCInline from '@theme/TOCInline';

# 1. Bootloader DAPLink

Le bootloader DAPLink est le premier programme qui démarre sur le STM32F103. Il occupe les 47 premiers Ko de sa flash, à partir de 0x08000000, et présente le lecteur **MAINTENANCE** qui sert ensuite à installer et à mettre à jour le firmware DAPLink (voir [Chaîne de démarrage](/docs/hardware/main-components/stm32f103#chaîne-de-démarrage)).

C'est la seule étape qui demande une sonde externe : sur une carte neuve, le STM32F103 est vide, et aucun programme ne peut l'écrire par l'USB. Elle n'est faite qu'une fois : le firmware DAPLink ne réécrit jamais le bootloader (voir [Architecture flash F103](/docs/software/daplink#architecture-flash-f103)).

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Matériel

- une sonde **ST-Link** (ST-LINK/V2 ou équivalent). Les scripts OpenOCD de DapLink-EasyFlash ([`configs/f1x-*.cfg`](https://github.com/steamicc/DapLink-EasyFlash/tree/main/configs)) chargent `interface/stlink.cfg` : une autre sonde (Black Magic Probe, J-Link) demanderait d'autres scripts ;
- un accès au port SWD **J8** du STM32F103. Les cartes V1c photographiées n'ont pas de connecteur soudé sur J8 : souder une barrette mâle de 1 rangée de 5 broches au pas de 1,27 mm, ou appuyer des contacts à ressort sur les trous (voir [Port SWD](/docs/hardware/main-components/connectors/swd)). Le montage retenu pour la série est **à définir** ;
- un câble USB-C qui transporte les données ;
- [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash/releases) : l'archive `xpack` de son système (Linux ou Windows), qui contient OpenOCD.

## Fichier

Le fichier du bootloader est [`stm32f103xb_bl.bin`](https://github.com/steamicc/DAPLink/releases/download/2026-11-25.3/stm32f103xb_bl.bin), de la release du DAPLink retenue par le wiki (2026-11-25.3, voir [Versions retenues](../#versions-retenues)). Il fait 48 128 octets, soit 0xBC00 : exactement la zone du bootloader, de 0x08000000 à 0x0800BBFF. Le fichier du firmware de l'[étape 2](./firmware-daplink), `stm32f103xb_steami32_if_crc.bin`, se télécharge en même temps : DapLink-EasyFlash enchaîne les deux étapes.

## Câblage

Relier la sonde à J8 fil à fil, comme sur le schéma de câblage du [README de DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash/blob/main/README_fr.md#steami) (photographié sur une carte verte, V1a ou V1b : J8 a la même position et le même ordre sur la V1c).

| Position sur J8     | Signal       | Broche de la sonde ST-Link |
| ------------------- | ------------ | -------------------------- |
| 1 (pastille carrée) | GND          | GND                        |
| 2                   | VREF         | 3.3V                       |
| 3                   | STLINK_SWDIO | SWDIO                      |
| 4                   | STLINK_NRST  | RST                        |
| 5                   | STLINK_SWCLK | SWCLK                      |

La pastille carrée est à l'extrémité de la rangée la plus proche du connecteur de bord. Contrôler la continuité entre cette pastille et GND avant le premier branchement.

Le README demande de câbler la sonde et de la brancher à l'ordinateur **avant** de brancher la carte en USB.

## Avec DapLink-EasyFlash

L'onglet **DAPLink** de l'outil fait les étapes 1 et 2 en un seul passage ([`tab_daplink.rs`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/src/ui/tab_daplink.rs)) :

1. Lancer DapLink-EasyFlash et ouvrir l'onglet **DAPLink**.
2. **Bootloader file** : choisir `stm32f103xb_bl.bin`.
3. **Firmware file** : choisir `stm32f103xb_steami32_if_crc.bin`.
4. Laisser **(Optional) User program** vide : MicroPython s'installe à l'[étape 5](./micropython). Le champ **Target mount name** ne sert que s'il y a un programme utilisateur.
5. **Timeout (s) for mount points** : temps d'attente du lecteur **MAINTENANCE**, 10 s par défaut.
6. Appuyer sur **Start**.

Le journal enchaîne alors :

| Ligne du journal               | Ce que fait l'outil                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `Unlock target`                | Lève la protection en lecture du STM32F103 (`stm32f1x unlock 0`)                          |
| `Erase target`                 | Efface toute sa flash (`stm32f1x mass_erase 0`), config zone comprise                     |
| `Flash bootloader`             | Écrit le bootloader à 0x08000000 et le vérifie (`program … verify reset exit 0x08000000`) |
| `Wait for 'MAINTENANCE' drive` | Attend le lecteur du bootloader, qui démarre seul faute de firmware d'interface           |
| `Copy firmware to MAINTENANCE` | Copie le firmware DAPLink : c'est l'[étape 2](./firmware-daplink)                         |
| `No user file. Skip.`          | Aucun programme utilisateur à copier                                                      |

## En ligne de commande

Les trois premières lignes du journal correspondent à trois appels d'OpenOCD, avec les scripts [`f1x-unlock.cfg`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/configs/f1x-unlock.cfg), [`f1x-mass-erase.cfg`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/configs/f1x-mass-erase.cfg) et [`f1x-flash.cfg`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/configs/f1x-flash.cfg). Les mêmes commandes, sans l'interface graphique :

```bash
openocd -f interface/stlink.cfg -f target/stm32f1x.cfg \
  -c "reset_config none separate" -c "init" -c "reset halt" \
  -c "stm32f1x unlock 0" -c "reset halt" -c "exit"

openocd -f interface/stlink.cfg -f target/stm32f1x.cfg \
  -c "reset_config none separate" -c "init" -c "reset halt" \
  -c "stm32f1x mass_erase 0" -c "reset halt" -c "exit"

openocd -f interface/stlink.cfg -f target/stm32f1x.cfg \
  -c "transport select hla_swd" -c "reset_config none separate" \
  -c "init" -c "reset halt" \
  -c "program stm32f103xb_bl.bin verify reset exit 0x08000000"
```

Ces commandes reprennent les scripts de l'outil ; elles n'ont pas encore été lancées telles quelles sur une V1c.

Le dépôt micropython-steami-lib a aussi une cible `make daplink-deploy-bootloader`, qui compile le bootloader depuis les sources puis l'écrit à 0x08000000 avec pyOCD et une sonde externe (voir son [`Makefile`](https://github.com/steamicc/micropython-steami-lib/blob/main/Makefile)). Pour une série, le fichier de la release évite de compiler.

## Résultat attendu

Après `Flash bootloader`, le STM32F103 redémarre sur le bootloader. Comme le firmware d'interface manque, le bootloader reste actif et le lecteur **MAINTENANCE** apparaît sur l'ordinateur ([`main_bootloader.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/daplink/bootloader/main_bootloader.c)). Si l'outil affiche `TIMEOUT : The device 'MAINTENANCE' was not found.`, vérifier le câble USB (données), puis augmenter le délai.

La sonde peut ensuite être retirée : les étapes suivantes passent toutes par le câble USB.
