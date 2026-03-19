---
sidebar_position: 7
title: "FCT - Service et USB"
---

# Exigences fonctionnelles - Service et USB (FCT-55 a FCT-64)

## Port de service

| ID | Nom | Description |
|----|-----|-------------|
| FCT-55 | Service Port | Le systeme doit integrer un port de debogage et de chargement logiciel en usine. |
| FCT-56 | Service Port - SWD | Le port de service doit etre compatible avec les sondes SWD comme Black Magic Probe ou ST-Link. |
| FCT-57 | Service Port - One row connector | La connexion physique du port de service doit se faire uniquement par routage des signaux vers des pads du PCB (header 1 rangee). |
| FCT-58 | Service Port - Pinout | Brochage recommande du header 1 rangee : GND, SWCLK, 3V, SWDIO. Ne pas placer 3V et GND adjacents. |

## USB

| ID | Nom | Description |
|----|-----|-------------|
| FCT-59 | USB | Le systeme doit integrer un connecteur micro-USB. |
| FCT-60 | USB - Programming | Le systeme doit pouvoir charger son logiciel embarque a travers un port USB. |
| FCT-61 | USB - Connector | Le systeme doit avoir une prise micro-USB pour l'alimentation et la programmation. Un connecteur de type prise murale est recommande pour la robustesse. |
| FCT-62 (DAPLink) | USB - DAPLink | Le systeme doit se presenter comme un disque USB lorsqu'il est connecte via USB, et le glisser-deposer d'un fichier .hex/.bin declenche le flashage du MCU applicatif. |
| FCT-62 (Endpoints) | USB - Endpoints | Le firmware de la puce interface doit fournir quatre endpoints USB : HID (CMSIS-DAP), CDC (port serie), MSC (stockage de masse) et WebUSB. |
| FCT-63 | USB - Bootloader | Il est possible de mettre a jour la version de DAPLink. Cela se fait en utilisant le mode maintenance DFU (Device Firmware Update). |
| FCT-64 | USB - File System | Le systeme de fichiers flash presente sur le lecteur de la carte est entierement virtuel. Il n'est pas stocke dans la flash mais genere dynamiquement. |
