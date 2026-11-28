---
sidebar_position: 3
title: 'Jacdac'
---

# Connecteur Jacdac

Interface série pour la connexion de modules Jacdac.

## Caractéristiques

| Caractéristique | Détail                              |
| --------------- | ----------------------------------- |
| Data            | JACDAC_DATA (UART2_TX/RX) → PB6/PB7 |
| Périphérique    | USART1 du STM32WB55                 |
| Alimentation    | JACDAC_P : 5V                       |

`UART2_TX` et `UART2_RX` sont les noms des nets du schéma. Le périphérique du STM32WB55 relié à PB6 (TX) et PB7 (RX) est l'USART1. Le firmware MicroPython et la variante Arduino nomment ces broches `JACDAC_DATA_TX` et `JACDAC_DATA_RX`.

## Voir aussi

- [Tous les connecteurs](./)
