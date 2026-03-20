---
sidebar_position: 7
title: "Service et USB"
---

# Service et USB

## Exigences — Port de service

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-55 | Service Port | Le systeme doit integrer un port de debogage et de chargement logiciel en usine. | Header SWD 1 rangee, pas 1.27 mm |
| FCT-56 | Service Port - SWD | Le port de service doit etre compatible avec les sondes SWD comme Black Magic Probe ou ST-Link. | SWD (SWCLK PA14, SWDIO PA13 sur F103) |
| FCT-57 | Service Port - One row connector | La connexion physique du port de service doit se faire uniquement par routage des signaux vers des pads du PCB (header 1 rangee). | Header 1 rangee 4 broches |
| FCT-58 | Service Port - Pinout | Brochage recommande du header 1 rangee : GND, SWCLK, 3V, SWDIO. Ne pas placer 3V et GND adjacents. | GND(1), SWCLK(2), 3V3(3), SWDIO(4) |

## Exigences — USB

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-59 | USB | Le systeme doit integrer un connecteur micro-USB. | Connecteur micro-USB |
| FCT-60 | USB - Programming | Le systeme doit pouvoir charger son logiciel embarque a travers un port USB. | DAPLink drag-and-drop |
| FCT-61 | USB - Connector | Le systeme doit avoir une prise micro-USB pour l'alimentation et la programmation. Un connecteur de type prise murale est recommande pour la robustesse. | Connecteur micro-USB robuste |
| FCT-62 (DAPLink) | USB - DAPLink | Le systeme doit se presenter comme un disque USB lorsqu'il est connecte via USB, et le glisser-deposer d'un fichier .hex/.bin declenche le flashage du MCU applicatif. | Firmware DAPLink sur STM32F103 |
| FCT-62 (Endpoints) | USB - Endpoints | Le firmware de la puce interface doit fournir quatre endpoints USB : HID (CMSIS-DAP), CDC (port serie), MSC (stockage de masse) et WebUSB. | 4 endpoints DAPLink |
| FCT-63 | USB - Bootloader | Il est possible de mettre a jour la version de DAPLink. Cela se fait en utilisant le mode maintenance DFU (Device Firmware Update). | Mode DFU du STM32F103 |
| FCT-64 | USB - File System | Le systeme de fichiers flash presente sur le lecteur de la carte est entierement virtuel. Il n'est pas stocke dans la flash mais genere dynamiquement. | Systeme de fichiers virtuel DAPLink |

## Choix de conception

### Interface de programmation (FP11)

Le port de service utilise le protocole SWD (Serial Wire Debug) avec un connecteur minimal 4 broches au pas 1.27 mm.

- **Compatibilite** : Sondes SWD telles que Black Magic Probe ou ST-Link
- **Connecteur** : Header 1 rangee, pas 1.27 mm

| Broche | Signal | Pin STM32F103 |
|--------|--------|---------------|
| 1 | GND | - |
| 2 | SWCLK | PA14 |
| 3 | 3V3 | - |
| 4 | SWDIO | PA13 |

:::caution
Les broches 3V3 et GND ne sont pas adjacentes pour eviter tout risque de court-circuit lors du branchement.
:::

### Microcontroleur interface (FP14)

Le STM32F103 est dedie a la gestion USB et fait office d'interface entre l'ordinateur et le MCU applicatif. Il execute le firmware DAPLink (comme le micro:bit).

- **Composant** : STMicroelectronics STM32F103CBT6
- **Coeur** : ARM Cortex-M3 @ 72 MHz
- **Memoire Flash** : 128 Ko
- **Firmware** : DAPLink
- **Horloge** : Quartz 8 MHz

#### Endpoints USB

Le firmware DAPLink fournit quatre endpoints USB :

| Endpoint | Protocole | Fonction |
|----------|-----------|----------|
| HID | CMSIS-DAP | Debogage du MCU applicatif |
| CDC | Port serie virtuel | Communication serie avec le MCU et l'ordinateur |
| MSC | Stockage de masse | Flash virtuel — drag-and-drop programming |
| WebUSB | Interface web | Interaction directe depuis un navigateur |

#### Compatibilite WebUSB

Le microcontroleur d'interface supporte WebUSB, qui permet aux utilisateurs d'interagir avec la carte directement depuis un navigateur web, sans necessite de logiciel dedie ou de pilotes.

#### Support DAPLink

Comme le micro:bit, la carte STeaMi utilise le firmware DAPLink, qui permet la programmation et le debogage faciles de la carte via USB. Les utilisateurs peuvent flasher du nouveau firmware ou du code en utilisant des outils de developpement standard tels que MicroPython, Mbed Studio ou Microsoft MakeCode.

#### Communication serie

Le microcontroleur d'interface fournit une interface serie pour la communication avec le microcontroleur principal (via UART) et l'ordinateur hote.

#### Mise a jour du bootloader

Il est possible de mettre a jour la version de DAPLink en utilisant le mode maintenance DFU.

#### Systeme de fichiers virtuel

Le systeme de fichiers flash presente sur le lecteur de la carte est entierement virtuel. Il n'est pas stocke dans la flash mais genere dynamiquement.

## Voir aussi

- [Hardware](../hardware/)
- [Software — DAPLink](../software/)
- [Composants — Circuits integres](../components/integrated-circuits)
