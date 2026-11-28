---
title: Fabrication
sidebar_position: 1
---

import TOCInline from '@theme/TOCInline';

# Fabrication : préparer et qualifier une carte

Une carte qui sort de l'assemblage n'a aucun programme : ni DAPLink sur le STM32F103, ni pile radio ni MicroPython sur le STM32WB55. Cette section décrit tout ce qu'il faut faire entre l'assemblage et la remise de la carte à un utilisateur : installer les programmes des deux microcontrôleurs, écrire la configuration d'usine, puis vérifier chaque fonction de la carte.

Elle vise la série de 400 cartes **V1c** (indice C1, voir [Révisions](/docs/hardware/revisions#releases-et-indices-du-schéma)), seule release en cours de diffusion. Les mêmes étapes valent pour une V1a ou une V1b ; les tests qui diffèrent sont présentés par release.

Elle s'adresse à la personne qui prépare les cartes, et à celle qui doit remettre en état une carte dont le DAPLink ne démarre plus. Pour un utilisateur qui veut seulement mettre à jour sa carte, les pages [DAPLink](/docs/software/daplink#mise-à-jour-du-firmware), [Pile radio Bluetooth](/docs/software/pile-radio) et [Premier essai pas à pas](/docs/software/micropython/premier-essai) suffisent.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

:::caution État de la procédure

Cette procédure est rassemblée à partir des dépôts [DAPLink](https://github.com/steamicc/DAPLink/tree/release_letssteam), [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash) et [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib), et des pages du wiki. Elle n'a pas encore été déroulée en entier sur une V1c de série. Seule l'installation de la pile radio a été vérifiée sur une V1c (voir [Pile radio Bluetooth](/docs/software/pile-radio#installer-la-pile)). Les points qu'aucune source ne règle encore sont signalés « à définir » dans chaque page.

:::

## Matériel nécessaire

| Matériel                               | Usage                                                                                                                                                                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sonde SWD ST-Link (ST-LINK/V2)         | Étape 1 seulement : écrire le bootloader du STM32F103 par son port SWD (J8). Les scripts de DapLink-EasyFlash sont écrits pour une sonde ST-Link.                                                                                                                                                  |
| Accès au port J8                       | Les cartes V1c photographiées n'ont pas de connecteur sur J8 (voir [Port SWD](/docs/hardware/main-components/connectors/swd)) : barrette de 5 broches au pas de 1,27 mm, ou contacts à ressort. Le montage retenu pour la série est **à définir**.                                                 |
| Câble USB-C qui transporte les données | Toutes les étapes : alimentation, lecteurs **MAINTENANCE** et **STEAMI**, port série, CMSIS-DAP.                                                                                                                                                                                                   |
| Ordinateur sous Linux ou Windows       | [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash) n'existe pas pour macOS. Les tests de qualification se lancent depuis un terminal, avec Python ([micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib)). Chrome ou Edge pour vérifier la fonction WebUSB. |
| Batterie LiPo (facultative)            | Les tests de la jauge BQ27441 et de la tension batterie ne passent qu'avec une batterie branchée. Brancher ou non une batterie pendant la qualification est **à définir**.                                                                                                                         |

## Vue d'ensemble du processus

[![Schéma du processus de préparation d'une STeaMi V1c : PCB assemblé, bootloader DAPLink par SWD avec une sonde ST-Link, firmware DAPLink par le lecteur MAINTENANCE, mise à jour du FUS et pile radio BLE HCI Layer 1.20.0 avec DapLink-EasyFlash, firmware MicroPython par le lecteur STEAMI, configuration d'usine dans la config zone du STM32F103, dix tests de qualification, configuration d'usine réécrite, carte prête](/img/diagrams/preparation-carte.svg)](pathname:///img/diagrams/preparation-carte.svg)

| N°   | Étape                                                      | Outil                                    | Liaison                                  |
| ---- | ---------------------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| 1    | [Bootloader DAPLink](./preparation/bootloader-daplink)     | DapLink-EasyFlash, onglet DAPLink        | Sonde ST-Link sur J8 (SWD du STM32F103)  |
| 2    | [Firmware DAPLink](./preparation/firmware-daplink)         | DapLink-EasyFlash, même passage          | USB, lecteur **MAINTENANCE**             |
| 3    | [Mise à jour du FUS](./preparation/fus)                    | DapLink-EasyFlash, onglet Wireless Stack | USB : CMSIS-DAP et port série du DAPLink |
| 4    | [Pile radio](./preparation/pile-radio)                     | DapLink-EasyFlash, même passage          | USB : CMSIS-DAP et port série du DAPLink |
| 5    | [Firmware MicroPython](./preparation/micropython)          | Copie sur le lecteur                     | USB, lecteur **STEAMI**                  |
| 6    | [Configuration d'usine](./preparation/configuration-usine) | `mpremote`                               | USB, port série (REPL)                   |
| 7–16 | [Qualification](./qualification/)                          | `make test-…` de micropython-steami-lib  | USB, port série (REPL)                   |
| 17   | [Première utilisation](./premiere-utilisation)             | —                                        | —                                        |

Les étapes 3 et 4 se font dans un seul passage de DapLink-EasyFlash, comme les étapes 1 et 2. Plusieurs scénarios de qualification effacent la zone de configuration du STM32F103 : l'étape 6 est donc à refaire après la qualification (voir [Configuration d'usine](./preparation/configuration-usine#après-la-qualification)).

## Versions retenues

Les versions sont celles que le wiki épingle dans les fichiers [`daplink.json`](https://github.com/steamicc/wiki_steami/blob/main/daplink.json), [`pile-radio.json`](https://github.com/steamicc/wiki_steami/blob/main/pile-radio.json) et [`micropython.json`](https://github.com/steamicc/wiki_steami/blob/main/micropython.json) de son dépôt : ce sont aussi celles que les boutons du wiki installent ou demandent. Les relire avant une série, car elles suivent les nouvelles releases.

| Programme                      | Version                                                                               | Fichiers                                                                                                                                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bootloader et firmware DAPLink | Release [2026-11-25.3](https://github.com/steamicc/DAPLink/releases/tag/2026-11-25.3) | [`stm32f103xb_bl.bin`](https://github.com/steamicc/DAPLink/releases/download/2026-11-25.3/stm32f103xb_bl.bin), [`stm32f103xb_steami32_if_crc.bin`](https://github.com/steamicc/DAPLink/releases/download/2026-11-25.3/stm32f103xb_steami32_if_crc.bin) |
| FUS du STM32WB55               | 1.2.0                                                                                 | Fourni par DapLink-EasyFlash (`wireless_stack/stm32wb5xxG_FUS_fw.hex`)                                                                                                                                                                                 |
| Pile radio                     | BLE HCI Layer 1.20.0                                                                  | Fournie par DapLink-EasyFlash v1.3 ou plus récente (`wireless_stack/stm32wb5xxG_BLE_HCILayer_fw.hex`)                                                                                                                                                  |
| Firmware MicroPython           | [v0.38.0](https://github.com/steamicc/micropython-steami-lib/releases/tag/v0.38.0)    | [`steami-micropython-firmware-v0.38.0.hex`](https://github.com/steamicc/micropython-steami-lib/releases/download/v0.38.0/steami-micropython-firmware-v0.38.0.hex)                                                                                      |

## Ce qui reste à définir

- le montage qui donne accès à J8 en série (barrette soudée ou contacts à ressort) ;
- la règle de nommage des cartes (`board_name`) ;
- la présence d'une batterie pendant la qualification ;
- les tests sans scénario : LEDs d'état, microphone, contrôle visuel de l'écran V1c, scan Bluetooth, connecteurs STEMMA/Qwiic et Jacdac, continuité des broches du connecteur de bord (banc de test à concevoir) ;
- ce que la carte contient à la livraison : programme de démonstration, fichier du lecteur **STEAMI** ;
- la trace gardée pour chaque carte (rapport de test, numéro).

## Voir aussi

- [DAPLink](/docs/software/daplink) — firmware d'interface, config zone, mise à jour
- [Pile radio Bluetooth](/docs/software/pile-radio) — choix et installation de la pile
- [STM32F103 — Chaîne de démarrage](/docs/hardware/main-components/stm32f103#chaîne-de-démarrage)
- [Points de test](/docs/hardware/pin-mapping/test-points)
- [Tests de micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib/blob/main/tests/TESTING.md)
