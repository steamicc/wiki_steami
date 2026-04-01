---
sidebar_position: 7
title: 'Service et USB'
---

# Service et USB

## Exigences — Port de service

| ID     | Nom                              | Description                                                                                                                       | Implémentation                        |
| ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| FCT-55 | Service Port                     | Le système doit intégrer un port de débogage et de chargement logiciel en usine.                                                  | Header SWD 1 rangée, pas 1.27 mm      |
| FCT-56 | Service Port - SWD               | Le port de service doit être compatible avec les sondes SWD comme Black Magic Probe ou ST-Link.                                   | SWD (SWCLK PA14, SWDIO PA13 sur F103) |
| FCT-57 | Service Port - One row connector | La connexion physique du port de service doit se faire uniquement par routage des signaux vers des pads du PCB (header 1 rangée). | Header 1 rangée 4 broches             |
| FCT-58 | Service Port - Pinout            | Brochage recommandé du header 1 rangée : GND, SWCLK, 3V, SWDIO. Ne pas placer 3V et GND adjacents.                                | GND(1), SWCLK(2), 3V3(3), SWDIO(4)    |

## Exigences — USB

| ID                 | Nom               | Description                                                                                                                                                            | Implémentation                      |
| ------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| FCT-59             | USB               | Le système doit intégrer un connecteur micro-USB.                                                                                                                      | Connecteur micro-USB                |
| FCT-60             | USB - Programming | Le système doit pouvoir charger son logiciel embarqué à travers un port USB.                                                                                           | DAPLink drag-and-drop               |
| FCT-61             | USB - Connector   | Le système doit avoir une prise micro-USB pour l'alimentation et la programmation. Un connecteur de type prise murale est recommandé pour la robustesse.               | Connecteur micro-USB robuste        |
| FCT-62 (DAPLink)   | USB - DAPLink     | Le système doit se présenter comme un disque USB lorsqu'il est connecté via USB, et le glisser-déposer d'un fichier .hex/.bin déclenche le flashage du MCU applicatif. | Firmware DAPLink sur STM32F103      |
| FCT-62 (Endpoints) | USB - Endpoints   | Le firmware de la puce interface doit fournir quatre endpoints USB : HID (CMSIS-DAP), CDC (port série), MSC (stockage de masse) et WebUSB.                             | 4 endpoints DAPLink                 |
| FCT-63             | USB - Bootloader  | Il est possible de mettre à jour la version de DAPLink. Cela se fait en utilisant le mode maintenance DFU (Device Firmware Update).                                    | Mode DFU du STM32F103               |
| FCT-64             | USB - File System | Le système de fichiers flash présenté sur le lecteur de la carte est entièrement virtuel. Il n'est pas stocké dans la flash mais généré dynamiquement.                 | Système de fichiers virtuel DAPLink |

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

#### Mise à jour du bootloader

Il est possible de mettre à jour la version de DAPLink en utilisant le mode maintenance DFU.

#### Système de fichiers virtuel

Le système de fichiers flash présenté sur le lecteur de la carte est entièrement virtuel. Il n'est pas stocké dans la flash mais généré dynamiquement.

## Voir aussi

- [Hardware](../hardware/)
- [Programmation — DAPLink](../software/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
