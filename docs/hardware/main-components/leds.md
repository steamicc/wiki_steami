---
sidebar_position: 9
title: 'LEDs'
---

# LEDs

La carte dispose de plusieurs LEDs pour le retour visuel : une LED RGB programmable par l'utilisateur, une LED Bluetooth, et des LEDs de status gérées par le processeur d'interface.

## LED RGB utilisateur

LED programmable par l'utilisateur pour afficher des informations visuelles.

| Caractéristique | Détail                |
| --------------- | --------------------- |
| Composant       | Wurth 150505M173300   |
| Type            | LED RGB SMD 5050      |
| LED_RED         | LED_USER_RED → PC12   |
| LED_GREEN       | LED_USER_GREEN → PC11 |
| LED_BLUE        | LED_USER_BLUE → PC10  |

## LED Bluetooth

Indique l'état de la connexion Bluetooth (clignotement pendant l'appairage).

| Caractéristique | Détail                                              |
| --------------- | --------------------------------------------------- |
| Signal          | LED_BLE (BOOT0/LED_BLE) → PH3                       |
| Comportement    | Clignotement 50% duty cycle pendant l'appairage BLE |

## LEDs d'interface (STM32F103)

LEDs gérées par le processeur d'interface pour indiquer l'état du système.

| LED         | Signal            | Pin STM32F103 | Fonction                    |
| ----------- | ----------------- | ------------- | --------------------------- |
| LED_CHG     | LED_CHG_RED       | —             | Charge de la batterie       |
| LED_STATUS  | LED_STLINK_STATUS | PA9           | Status système (verte)      |
| LED_FLASH   | LED_COM_GRN       | PB1           | Communication flash (verte) |
| LED_DAPLINK | LED_DAP_BLUE      | PA6           | Activité DAPLink (bleue)    |

## Comportement des LEDs système

| LED              | État                    | Signification          |
| ---------------- | ----------------------- | ---------------------- |
| LED alimentation | Verte fixe              | Alimentation connectée |
| LED alimentation | Verte clignotante (50%) | Batterie faible        |
| LED BLE          | Bleue clignotante (50%) | Appairage en cours     |
| LED charge       | Rouge                   | Batterie en charge     |

## Schémas

[![Schéma FP8-Display_LEDs](/img/schematics/FP8-Display_LEDs.png)](/docs/schematics/FP8-Display_LEDs.pdf)

- [Schéma Altium — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc)

## Voir aussi

- [Conception — Interface utilisateur](../../design/user-interface)
- [Pin Mapping — LEDs](../pin-mapping/leds)
- [Vue d'ensemble du matériel](../)
