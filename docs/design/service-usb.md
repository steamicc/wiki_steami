---
sidebar_position: 7
title: 'Service et USB'
---

import { Release, ReleaseSelector, ReleaseValue } from '@site/src/components/ReleaseTabs';

# Service et USB

Les exigences sont communes aux trois releases de la carte. Quand l'implémentation diffère, la colonne « Implémentation » affiche la release choisie ci-dessous ; les écarts sont détaillés dans [Révisions](../hardware/revisions#écarts-aux-exigences).

<ReleaseSelector />

## Exigences — Port de service

| ID     | Nom                              | Description                                                                                                                                                                        | Implémentation                        |
| ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| FCT-55 | Service Port                     | Le système doit intégrer un port de débogage et de chargement logiciel en usine.                                                                                                   | Header SWD 1 rangée, pas 1.27 mm      |
| FCT-56 | Service Port - SWD               | Le port de service doit être compatible avec les sondes SWD comme Black Magic Probe ou ST-Link.                                                                                    | SWD (SWCLK PA14, SWDIO PA13 sur F103) |
| FCT-57 | Service Port - One row connector | La connexion physique du port de service doit se faire uniquement en routant les signaux vers un connecteur d'une rangée sur le PCB (cotes ci-dessous).                            | Header 1 rangée 4 broches             |
| FCT-58 | Service Port - Pinout            | Brochage recommandé du header d'une rangée : GND, SWCLK, 3V, SWDIO. Ne pas placer 3V et GND aux deux extrémités : un connecteur branché à l'envers ferait passer -3 V dans le MCU. | GND(1), SWCLK(2), 3V3(3), SWDIO(4)    |

:::note Cotes du connecteur (FCT-57, FCT-58)

- **Pas de 0,1″** (FCT-57) : trous percés à 40 mil, dont le centre est à exactement 0,1″ du bord de la carte. Un header mâle de deux rangées s'enfiche dans ces trous par son côté court, et des câbles femelles se branchent sur son côté long. Le header se plie un peu, ce qui force un bon contact électrique ; l'enficher de préférence en commençant par le bord.
- **Broches supplémentaires** (FCT-58) : une seconde broche GND peut être ajoutée à droite pour rendre le connecteur symétrique du point de vue de l'alimentation. Une broche RESET, ou une broche de journal (SWO ou autre), s'ajoute aussi à droite.
- **Sens de branchement** (FCT-58) : avec un câble de deux rangées dans une rangée de trous, seul compte le côté de la carte (dessus ou dessous) par lequel le câble est branché, ce qui se remarque facilement. Un connecteur retourné ne fait aucun contact électrique.
- **Pas de 0,05″** (FCT-58), quand la place manque : si le connecteur est en haut de la carte, GND est à gauche, sur une pastille carrée. Les meilleurs résultats ont été obtenus avec un perçage de 22 mil et des trous centrés à 52 mil du bord. Les tolérances sont bien plus serrées qu'au pas de 0,1″, mais le montage fonctionne. Le connecteur occupe alors 5 mm x 2 mm au bord de la carte.

Ces cotes sont celles de l'exigence. Le port réellement monté sur la carte est décrit dans [Port SWD](../hardware/main-components/connectors/swd).

:::

## Exigences — USB

| ID                 | Nom               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Implémentation                                                                                                                                                                                    |
| ------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FCT-59             | USB               | Le système doit intégrer un connecteur micro-USB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | <ReleaseValue><Release releases="v1a v1b">Connecteur micro-USB GCT USB3080-30-00-A</Release><Release releases="v1c">**Écart** : connecteur USB-C UJ20-C-H-G-SMT-4-P16-TR</Release></ReleaseValue> |
| FCT-60             | USB - Programming | Le système doit pouvoir charger son logiciel embarqué à travers un port USB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | DAPLink drag-and-drop                                                                                                                                                                             |
| FCT-61             | USB - Connector   | Le système doit avoir une prise micro-USB pour l'alimentation et la programmation. Une prise à pattes de fixation traversantes est souhaitée pour la solidité, surtout sur les cartes nues, sans boîtier. Il est prévu d'ajouter une protection ESD sur les lignes de données USB et une diode Zener pour écrêter VBUS et limiter les surtensions au branchement.                                                                                                                                                                                                                                                                | <ReleaseValue><Release releases="v1a v1b">Connecteur micro-USB robuste</Release><Release releases="v1c">**Écart** : connecteur USB-C</Release></ReleaseValue>                                     |
| FCT-62 (DAPLink)   | USB - DAPLink     | Le système doit se présenter comme un disque USB lorsqu'il est connecté via USB, et le glisser-déposer d'un fichier .hex/.bin déclenche le flashage du MCU applicatif.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Firmware DAPLink sur STM32F103                                                                                                                                                                    |
| FCT-62 (Endpoints) | USB - Endpoints   | Le firmware de la puce interface doit fournir quatre endpoints USB : HID (CMSIS-DAP), CDC (port série), MSC (stockage de masse) et WebUSB.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 4 endpoints DAPLink                                                                                                                                                                               |
| FCT-63             | USB - Bootloader  | La version de DAPLink peut être mise à jour par le bootloader DAPLink : DAPLink est donc compilé deux fois pour la carte. En mode bootloader, qui sert à mettre à jour le firmware d'interface, le lecteur s'appelle MAINTENANCE ; les fichiers hex qui y sont déposés sont écrits dans la flash du MCU d'interface (le texte d'origine nomme le KL27) et doivent contenir une image de DAPLink ou équivalente. En mode interface, qui cible le STM32WB55, le lecteur s'appelle STEAM32 et les fichiers hex déposés sont écrits dans la flash du MCU cible.                                                                      | Bootloader DAPLink du STM32F103 (lecteur MAINTENANCE)                                                                                                                                             |
| FCT-64             | USB - File System | Le système de fichiers présenté sur le lecteur de la carte est entièrement virtuel : aucune mémoire réelle ne le stocke, ce qui explique que le lecteur s'éjecte après l'écriture de nouveaux fichiers. Un fichier déposé sur le lecteur STEAM32 n'est pas écrit en flash, comme sur une clé USB, mais transmis au MCU cible. Fichiers virtuels : DETAILS.TXT (version de DAPLink installée et informations de diagnostic) et STEAM32.HTM (lien vers steam32.org pour démarrer). Après un flashage, un fichier FAIL.TXT peut donner la cause de l'échec ; le fichier error.c des sources DAPLink aide à interpréter ces erreurs. | Système de fichiers virtuel DAPLink (lecteur STEAMI)                                                                                                                                              |

## Choix de conception

### Interface de programmation (FP11)

Le port de service utilise le protocole SWD (Serial Wire Debug) avec un connecteur minimal 4 broches au pas 1.27 mm.

- **Compatibilité** : Sondes SWD telles que Black Magic Probe ou ST-Link
- **Connecteur** : Header 1 rangée, pas 1.27 mm

| Broche | Signal | Pin STM32F103 |
| ------ | ------ | ------------- |
| 1      | GND    | -             |
| 2      | SWCLK  | PA14          |
| 3      | 3V3    | -             |
| 4      | SWDIO  | PA13          |

:::caution
Les broches 3V3 et GND ne sont pas adjacentes pour éviter tout risque de court-circuit lors du branchement.
:::

### Microcontrôleur interface (FP14)

Le STM32F103 est dédié à la gestion USB et fait office d'interface entre l'ordinateur et le MCU applicatif. Il exécute le firmware DAPLink (comme le micro:bit).

- **Composant** : STMicroelectronics STM32F103CBT6
- **Cœur** : ARM Cortex-M3 @ 72 MHz
- **Mémoire Flash** : 128 Ko
- **Firmware** : DAPLink
- **Horloge** : Quartz 8 MHz

#### Endpoints USB

Le firmware DAPLink fournit quatre endpoints USB :

| Endpoint | Protocole          | Fonction                                        |
| -------- | ------------------ | ----------------------------------------------- |
| HID      | CMSIS-DAP          | Débogage du MCU applicatif                      |
| CDC      | Port série virtuel | Communication série avec le MCU et l'ordinateur |
| MSC      | Stockage de masse  | Flash virtuel — drag-and-drop programming       |
| WebUSB   | Interface web      | Interaction directe depuis un navigateur        |

#### Compatibilité WebUSB

Le microcontrôleur d'interface supporte WebUSB, qui permet aux utilisateurs d'interagir avec la carte directement depuis un navigateur web, sans nécessité de logiciel dédié ou de pilotes.

#### Support DAPLink

Comme le micro:bit, la carte STeaMi utilise le firmware DAPLink, qui permet la programmation et le débogage faciles de la carte via USB. Les utilisateurs peuvent flasher du nouveau firmware ou du code en utilisant des outils de développement standard tels que MicroPython, Mbed Studio ou Microsoft MakeCode.

#### Communication série

Le microcontrôleur d'interface fournit une interface série pour la communication avec le microcontrôleur principal (via UART) et l'ordinateur hôte.

#### Mise à jour du DAPLink

Le firmware DAPLink se met à jour depuis le lecteur **MAINTENANCE**, que présente le bootloader DAPLink du STM32F103. Ce bootloader n'est pas une interface USB DFU : il se présente comme un disque de stockage de masse, sur lequel copier le nouveau firmware. La procédure est décrite dans [DAPLink](../software/daplink#mise-à-jour-du-firmware).

#### Système de fichiers virtuel

Le système de fichiers flash présenté sur le lecteur de la carte est entièrement virtuel. Il n'est pas stocké dans la flash mais généré dynamiquement.

## Voir aussi

- [Hardware](../hardware/)
- [Programmation — DAPLink](../software/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
