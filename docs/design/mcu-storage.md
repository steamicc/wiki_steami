---
sidebar_position: 5
title: 'MCU et stockage'
---

# Microcontroleur et stockage

## Exigences

| ID     | Nom                     | Description                                                                                                                                      | Implémentation          |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| FCT-35 | Microcontroller         | Le systeme doit integrer un microcontroleur ARM Cortex-M STM32WB55 de STMicroelectronics.                                                        | STM32WB55RG (Cortex-M4) |
| FCT-36 | Microcontroller - RAM   | Le systeme doit integrer un MCU avec suffisamment de RAM pour effectuer des operations graphiques de base (minimum pour un framebuffer 128x128). | 256 Ko SRAM             |
| FCT-37 | Microcontroller - Flash | Le systeme doit integrer un MCU avec au moins 512 Ko de memoire flash.                                                                           | 1 Mo Flash              |
| FCT-38 | Microcontroller - Speed | Le systeme doit integrer un MCU avec une vitesse de processeur d'au moins 64 MHz.                                                                | ARM Cortex-M4 @ 64 MHz  |
| FCT-39 | Internal sensors - Bus  | Tous les capteurs internes doivent etre connectes sur le premier bus I2C.                                                                        | I2C1 (PB8/PB9)          |

## Choix de conception

### Microcontroleur applicatif (FP6)

Le STM32WB55RG a ete selectionne pour ses capacites multiprotocoles sans fil (BLE, OpenThread, ZigBee) tout en offrant des performances suffisantes pour les operations graphiques et le traitement des capteurs.

- **Composant** : STMicroelectronics STM32WB55RG
- **Coeur** : ARM Cortex-M4 @ 64 MHz
- **Memoire Flash** : 1 Mo (depasse l'exigence de 512 Ko)
- **RAM** : 256 Ko SRAM
- **Communication sans fil** : Bluetooth BLE 5.2, OpenThread, ZigBee
- **Antenne** : Antenne interne integree
- **Filtre RF** : MLPF-WB55-01E3 (passe-bas 2.45 GHz)
- **Horloge** : Quartz 32 MHz + Quartz 32 KHz (RTC)
- **Boitier** : VFQFPN68

### Bus et peripheriques

Le MCU organise ses peripheriques sur plusieurs bus pour separer les usages internes et externes :

- **I2C1** (interne) : capteurs, jauge batterie — partage avec le STM32F103
- **I2C3** (externe) : connecteur edge, STEMMA/Qwiic
- **SPI1** (interne) : ecran OLED
- **SPI2** (externe) : connecteur edge
- **UART** : communication serie avec le microcontroleur interface

### Pourquoi un bus I2C unique pour les capteurs (FCT-39) ?

Regrouper tous les capteurs internes sur I2C1 simplifie le routage PCB et permet au STM32F103 (DAPLink) d'acceder egalement aux capteurs via le meme bus. Chaque capteur possede sa propre ligne d'interruption pour eviter le polling.

## Voir aussi

- [Hardware](../hardware/)
- [Composants — Circuits integres](../hardware/components/integrated-circuits)
- [Pin Mapping — Bus internes](../hardware/pin-mapping/internal-bus)
- [Conception — Communication](./communication)
