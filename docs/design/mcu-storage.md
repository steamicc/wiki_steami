---
sidebar_position: 5
title: 'MCU et stockage'
---

# Microcontrôleur et stockage

## Exigences

| ID     | Nom                     | Description                                                                                                                                      | Implémentation          |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| FCT-35 | Microcontrôleur         | Le système doit intégrer un microcontrôleur ARM Cortex-M STM32WB55 de STMicroelectronics.                                                        | STM32WB55RG (Cortex-M4) |
| FCT-36 | Microcontrôleur - RAM   | Le système doit intégrer un MCU avec suffisamment de RAM pour effectuer des opérations graphiques de base (minimum pour un framebuffer 128x128). | 256 Ko SRAM             |
| FCT-37 | Microcontrôleur - Flash | Le système doit intégrer un MCU avec au moins 512 Ko de mémoire flash.                                                                           | 1 Mo Flash              |
| FCT-38 | Microcontrôleur - Speed | Le système doit intégrer un MCU avec une vitesse de processeur d'au moins 64 MHz.                                                                | ARM Cortex-M4 @ 64 MHz  |
| FCT-39 | Internal sensors - Bus  | Tous les capteurs internes doivent être connectés sur le premier bus I2C.                                                                        | I2C1 (PB8/PB9)          |

## Choix de conception

### Microcontrôleur applicatif (FP6)

Le STM32WB55RG a été sélectionné pour ses capacités multiprotocoles sans fil (BLE, OpenThread, ZigBee) tout en offrant des performances suffisantes pour les opérations graphiques et le traitement des capteurs.

- **Composant** : STMicroelectronics STM32WB55RG
- **Cœur** : ARM Cortex-M4 @ 64 MHz
- **Mémoire Flash** : 1 Mo (dépasse l'exigence de 512 Ko)
- **RAM** : 256 Ko SRAM
- **Communication sans fil** : Bluetooth BLE 5.2, OpenThread, ZigBee
- **Antenne** : Antenne interne intégrée
- **Filtre RF** : MLPF-WB55-01E3 (passe-bas 2.45 GHz)
- **Horloge** : Quartz 32 MHz + Quartz 32 KHz (RTC)
- **Boîtier** : VFQFPN68

### Bus et périphériques

Le MCU organise ses périphériques sur plusieurs bus pour séparer les usages internes et externes :

- **I2C1** (interne) : capteurs, jauge batterie — partagé avec le STM32F103
- **I2C3** (externe) : connecteur edge, STEMMA/Qwiic
- **SPI1** (interne) : écran OLED
- **SPI2** (externe) : connecteur edge
- **UART** : communication série avec le microcontrôleur interface

### Pourquoi un bus I2C unique pour les capteurs (FCT-39) ?

Regrouper tous les capteurs internes sur I2C1 simplifie le routage PCB et permet au STM32F103 (DAPLink) d'accéder également aux capteurs via le même bus. Chaque capteur possède sa propre ligne d'interruption pour éviter le polling.

## Voir aussi

- [Hardware](../hardware/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
- [Pin Mapping — Bus internes](../hardware/pin-mapping/internal-bus)
- [Conception — Communication](./communication)
