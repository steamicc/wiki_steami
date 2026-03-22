---
sidebar_position: 4
title: 'Communication'
---

# Communication

## Exigences — Communication sans fil

| ID     | Nom         | Description                                                   | Implémentation                                                   |
| ------ | ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| FCT-28 | BLE         | Le systeme doit pouvoir communiquer par Bluetooth BLE 4.2.    | STM32WB55RG — BLE 5.2 (depasse l'exigence)                       |
| FCT-29 | BLE - Range | Le systeme necessite une portee physique BLE d'au moins 10 m. | Antenne interne + filtre MLPF-WB55-01E3                          |
| FCT-30 | OpenThread  | Le systeme doit pouvoir communiquer par OpenThread.           | STM32WB55RG — stack OpenThread integre                           |
| FCT-31 | ZigBee      | Le systeme doit pouvoir communiquer par ZigBee.               | STM32WB55RG — stack ZigBee integre                               |
| FCT-32 | Antenna     | Le systeme doit integrer une antenne interne.                 | Antenne integree + filtre RF MLPF-WB55-01E3 (passe-bas 2.45 GHz) |

## Exigences — Stockage

| ID     | Nom                           | Description                                                                | Implémentation                   |
| ------ | ----------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| FCT-33 | QSPI Flash                    | Le systeme doit integrer un stockage flash Quad-SPI de 64 Mbit.            | Winbond W25Q64JVZPIM             |
| FCT-34 | QSPI Flash - USB Mass Storage | Le stockage flash interne doit etre accessible a travers USB Mass Storage. | STM32F103 DAPLink (endpoint MSC) |

## Choix de conception

### Communication sans fil (FP6)

Le STM32WB55RG a ete choisi car il integre nativement les stacks BLE 5.2, OpenThread et ZigBee, satisfaisant les exigences FCT-28 a FCT-31 avec un seul composant. La version BLE 5.2 depasse l'exigence initiale (BLE 4.2) et apporte des ameliorations de debit et de portee.

- **Radio** : Transceiver 2.4 GHz integre au STM32WB55RG
- **Antenne** : Antenne interne integree sur le PCB
- **Filtre RF** : MLPF-WB55-01E3 (passe-bas 2.45 GHz) pour la conformite EMC
- **Horloge RF** : Quartz 32 MHz

### Memoire flash externe (FP15)

La memoire flash externe est connectee au microcontroleur d'interface (STM32F103) et non au MCU applicatif (STM32WB55). Ce choix permet l'acces USB Mass Storage via DAPLink sans solliciter le processeur principal.

- **Composant** : Winbond W25Q64JVZPIM
- **Capacite** : 64 Mbit (8 Mo)
- **Interface** : SPI / Quad-SPI (QPI, DTR)
- **Frequence** : jusqu'a 133 MHz
- **Temps d'acces** : 6 ns
- **Boitier** : 8-WSON (6x5)

#### Fonctionnalites

- **Acces stockage de masse** : La memoire flash est accessible via USB comme un peripherique de stockage de masse, permettant aux utilisateurs de recuperer les donnees facilement.
- **Format CSV** : Les donnees des capteurs sont stockees au format CSV, facilitant l'analyse avec des outils courants comme Excel.
- **Enregistrement de donnees** : Le microcontroleur d'interface gere l'ecriture et la recuperation des donnees, permettant un enregistrement continu sur de longues periodes.

#### Signaux SPI (vers STM32F103)

| Signal    | Test Point |
| --------- | ---------- |
| SPI1_SCK  | TP42       |
| SPI1_MOSI | TP40       |
| SPI1_MISO | TP41       |
| FLASH_CS  | TP39       |
| FLASH_RST | TP37       |
| FLASH_WP  | TP38       |

## Voir aussi

- [Hardware](../hardware/)
- [Composants — Circuits integres](../hardware/components/integrated-circuits)
- [Pin Mapping — Bus internes](../hardware/pin-mapping/internal-bus)
