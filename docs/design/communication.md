---
sidebar_position: 4
title: 'Communication'
---

# Communication

## Exigences — Communication sans fil

| ID     | Nom         | Description                                                   | Implémentation                                                   |
| ------ | ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| FCT-28 | BLE         | Le système doit pouvoir communiquer par Bluetooth BLE 4.2.    | STM32WB55RG — BLE 5.2 (dépasse l'exigence)                       |
| FCT-29 | BLE - Range | Le système nécessite une portée physique BLE d'au moins 10 m. | Antenne interne + filtre MLPF-WB55-01E3                          |
| FCT-30 | OpenThread  | Le système doit pouvoir communiquer par OpenThread.           | STM32WB55RG — stack OpenThread intégré                           |
| FCT-31 | ZigBee      | Le système doit pouvoir communiquer par ZigBee.               | STM32WB55RG — stack ZigBee intégré                               |
| FCT-32 | Antenna     | Le système doit intégrer une antenne interne.                 | Antenne intégrée + filtre RF MLPF-WB55-01E3 (passe-bas 2.45 GHz) |

## Exigences — Stockage

| ID     | Nom                           | Description                                                                | Implémentation                   |
| ------ | ----------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| FCT-33 | QSPI Flash                    | Le système doit intégrer un stockage flash Quad-SPI de 64 Mbit.            | Winbond W25Q64JVZPIM             |
| FCT-34 | QSPI Flash - USB Mass Storage | Le stockage flash interne doit être accessible à travers USB Mass Storage. | STM32F103 DAPLink (endpoint MSC) |

## Choix de conception

### Communication sans fil (FP6)

Le STM32WB55RG a été choisi car il intègre nativement les stacks BLE 5.2, OpenThread et ZigBee, satisfaisant les exigences FCT-28 à FCT-31 avec un seul composant. La version BLE 5.2 dépasse l'exigence initiale (BLE 4.2) et apporte des améliorations de débit et de portée.

- **Radio** : Transceiver 2.4 GHz intégré au STM32WB55RG
- **Antenne** : Antenne interne intégrée sur le PCB
- **Filtre RF** : MLPF-WB55-01E3 (passe-bas 2.45 GHz) pour la conformité EMC
- **Horloge RF** : Quartz 32 MHz

### Mémoire flash externe (FP15)

La mémoire flash externe est connectée au microcontrôleur d'interface (STM32F103) et non au MCU applicatif (STM32WB55). Ce choix permet l'accès USB Mass Storage via DAPLink sans solliciter le processeur principal.

- **Composant** : Winbond W25Q64JVZPIM
- **Capacité** : 64 Mbit (8 Mo)
- **Interface** : SPI / Quad-SPI (QPI, DTR)
- **Fréquence** : jusqu'à 133 MHz
- **Temps d'accès** : 6 ns
- **Boîtier** : 8-WSON (6x5)

#### Fonctionnalités

- **Accès stockage de masse** : La mémoire flash est accessible via USB comme un périphérique de stockage de masse, permettant aux utilisateurs de récupérer les données facilement.
- **Format CSV** : Les données des capteurs sont stockées au format CSV, facilitant l'analyse avec des outils courants comme Excel.
- **Enregistrement de données** : Le microcontrôleur d'interface gère l'écriture et la récupération des données, permettant un enregistrement continu sur de longues périodes.

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
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
- [Pin Mapping — Bus internes](../hardware/pin-mapping/internal-bus)
