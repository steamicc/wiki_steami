---
sidebar_position: 16
title: "Microcontroleur interface"
---

# Microcontroleur interface

**Identifiant** : FP14

Le microcontroleur d'interface est un microcontroleur dedie dont le role principal est de gerer les connexions USB, faciliter la programmation et gerer la communication serie avec le microcontroleur principal et l'ordinateur de l'utilisateur.

## Caracteristiques

- **Composant** : STMicroelectronics STM32F103CBT6
- **Coeur** : ARM Cortex-M3 @ 72 MHz
- **Memoire Flash** : 128 Ko
- **Firmware** : DAPLink
- **Horloge** : Quartz 8 MHz

## Fonctions

### Gestion USB

Le microcontroleur d'interface gere la connectivite USB, permettant a la carte STEAM32 d'apparaitre comme un peripherique de stockage de masse lorsqu'elle est connectee a un ordinateur. Cette fonctionnalite simplifie la recuperation des donnees des capteurs et la programmation de la carte.

Le firmware fournit quatre endpoints USB :
- **HID** : CMSIS-DAP pour le debogage
- **CDC** : Port serie virtuel pour la communication
- **MSC** : Stockage de masse (flash virtuel)
- **WebUSB** : Interface web directe

### Compatibilite WebUSB

Le microcontroleur d'interface supporte WebUSB, qui permet aux utilisateurs d'interagir avec la carte directement depuis un navigateur web, sans necessite de logiciel dedie ou de pilotes.

### Support DAPLink

Comme le micro:bit, la carte STEAM32 utilise le firmware DAPLink, qui permet la programmation et le debogage faciles de la carte via USB. Les utilisateurs peuvent flasher du nouveau firmware ou du code en utilisant des outils de developpement standard tels que MicroPython, Mbed Studio ou Microsoft MakeCode.

### Communication serie

Le microcontroleur d'interface fournit egalement une interface serie pour la communication avec le microcontroleur principal (via UART) et l'ordinateur hote.

### Mise a jour du bootloader

Il est possible de mettre a jour la version de DAPLink en utilisant le mode maintenance DFU.

## Systeme de fichiers

Le systeme de fichiers flash presente sur le lecteur de la carte est entierement virtuel. Il n'est pas stocke dans la flash mais genere dynamiquement.
