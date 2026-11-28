---
sidebar_position: 7
title: 'Service et USB'
---

import { Release, ReleaseSelector, ReleaseValue } from '@site/src/components/ReleaseTabs';

# Service et USB

Les exigences sont communes aux trois releases de la carte. Quand l'implémentation diffère, la colonne « Implémentation » affiche la release choisie ci-dessous ; les écarts sont détaillés dans [Révisions](../hardware/revisions#écarts-aux-exigences).

<ReleaseSelector />

## Exigences — Port de service

| ID     | Nom                              | Description                                                                                                                       | Implémentation                                                                                                                |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| FCT-55 | Service Port                     | Le système doit intégrer un port de débogage et de chargement logiciel en usine.                                                  | Port SWD J8 : 1 rangée de 5 trous au pas de 1,27 mm, sans connecteur soudé                                                    |
| FCT-56 | Service Port - SWD               | Le port de service doit être compatible avec les sondes SWD comme Black Magic Probe ou ST-Link.                                   | SWD (SWCLK PA14, SWDIO PA13 sur F103)                                                                                         |
| FCT-57 | Service Port - One row connector | La connexion physique du port de service doit se faire uniquement par routage des signaux vers des pads du PCB (header 1 rangée). | Conforme : 5 trous métallisés en une rangée (J8), aucun connecteur monté                                                      |
| FCT-58 | Service Port - Pinout            | Brochage recommandé du header 1 rangée : GND, SWCLK, 3V, SWDIO. Ne pas placer 3V et GND adjacents.                                | Ordre différent : GND, VREF, SWDIO, NRST, SWCLK (broches 1, 3, 5, 7 et 9 de J8) ; VREF et GND ne sont pas aux deux extrémités |

## Exigences — USB

| ID                 | Nom               | Description                                                                                                                                                            | Implémentation                                                                                                                                                                                    |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FCT-59             | USB               | Le système doit intégrer un connecteur micro-USB.                                                                                                                      | <ReleaseValue><Release releases="v1a v1b">Connecteur micro-USB GCT USB3080-30-00-A</Release><Release releases="v1c">**Écart** : connecteur USB-C UJ20-C-H-G-SMT-4-P16-TR</Release></ReleaseValue> |
| FCT-60             | USB - Programming | Le système doit pouvoir charger son logiciel embarqué à travers un port USB.                                                                                           | DAPLink drag-and-drop                                                                                                                                                                             |
| FCT-61             | USB - Connector   | Le système doit avoir une prise micro-USB pour l'alimentation et la programmation. Un connecteur de type prise murale est recommandé pour la robustesse.               | <ReleaseValue><Release releases="v1a v1b">Connecteur micro-USB robuste</Release><Release releases="v1c">**Écart** : connecteur USB-C</Release></ReleaseValue>                                     |
| FCT-62 (DAPLink)   | USB - DAPLink     | Le système doit se présenter comme un disque USB lorsqu'il est connecté via USB, et le glisser-déposer d'un fichier .hex/.bin déclenche le flashage du MCU applicatif. | Firmware DAPLink sur STM32F103                                                                                                                                                                    |
| FCT-62 (Endpoints) | USB - Endpoints   | Le firmware de la puce interface doit fournir quatre endpoints USB : HID (CMSIS-DAP), CDC (port série), MSC (stockage de masse) et WebUSB.                             | 4 endpoints DAPLink                                                                                                                                                                               |
| FCT-63             | USB - Bootloader  | Il est possible de mettre à jour la version de DAPLink. Cela se fait en utilisant le mode maintenance DFU (Device Firmware Update).                                    | Mode DFU du STM32F103                                                                                                                                                                             |
| FCT-64             | USB - File System | Le système de fichiers flash présenté sur le lecteur de la carte est entièrement virtuel. Il n'est pas stocké dans la flash mais généré dynamiquement.                 | Système de fichiers virtuel DAPLink                                                                                                                                                               |

## Choix de conception

### Interface de programmation (FP11)

Le port de service J8 utilise le protocole SWD (Serial Wire Debug). Il se présente comme une rangée de 5 trous métallisés au pas de 1,27 mm, sans connecteur soudé.

- **Compatibilité** : sondes SWD telles que Black Magic Probe ou ST-Link, reliées fil à fil
- **Connecteur** : aucun ; le symbole du schéma FP11 compte 10 positions, dont seules les broches impaires sont reliées

| Broche J8 | Signal       | Pin STM32F103 |
| --------- | ------------ | ------------- |
| 1         | GND          | -             |
| 3         | VREF         | -             |
| 5         | STLINK_SWDIO | PA13          |
| 7         | STLINK_NRST  | NRST          |
| 9         | STLINK_SWCLK | PA14          |

VREF vient de +3V3_STLINK par R71 (0 Ω). Détails, empreinte et sources dans [Port SWD](../hardware/main-components/connectors/swd.md).

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

#### Mise à jour du bootloader

Il est possible de mettre à jour la version de DAPLink en utilisant le mode maintenance DFU.

#### Système de fichiers virtuel

Le système de fichiers flash présenté sur le lecteur de la carte est entièrement virtuel. Il n'est pas stocké dans la flash mais généré dynamiquement.

## Voir aussi

- [Hardware](../hardware/)
- [Programmation — DAPLink](../software/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
