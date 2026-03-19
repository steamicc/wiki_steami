---
sidebar_position: 17
title: "Memoire flash"
---

# Memoire flash

**Identifiant** : FP15

La memoire flash est un module de memoire non volatile externe connecte au microcontroleur d'interface, concu pour stocker les donnees des capteurs collectees par la carte STEAM32.

## Caracteristiques

- **Composant** : Winbond W25Q64JVZPIM
- **Capacite** : 64 Mbit (8 Mo)
- **Interface** : SPI / Quad-SPI (QPI, DTR)
- **Frequence** : jusqu'a 133 MHz
- **Temps d'acces** : 6 ns
- **Boitier** : 8-WSON (6x5)

## Fonctionnalites

- **Acces stockage de masse** : La memoire flash est accessible via USB comme un peripherique de stockage de masse, permettant aux utilisateurs de recuperer les donnees facilement.
- **Format CSV** : Les donnees des capteurs sont stockees au format CSV, facilitant l'analyse avec des outils courants comme Excel.
- **Enregistrement de donnees** : Le microcontroleur d'interface gere l'ecriture et la recuperation des donnees, permettant un enregistrement continu sur de longues periodes.
- **Accessible via USB Mass Storage** : Le stockage flash interne est accessible a travers le protocole USB Mass Storage.

## Signaux SPI (vers STM32F103)

| Signal | Test Point |
|--------|-----------|
| SPI1_SCK | TP42 |
| SPI1_MOSI | TP40 |
| SPI1_MISO | TP41 |
| FLASH_CS | TP39 |
| FLASH_RST | TP37 |
| FLASH_WP | TP38 |
