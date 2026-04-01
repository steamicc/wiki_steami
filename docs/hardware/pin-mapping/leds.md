---
sidebar_position: 4
title: 'LEDs'
---

# LEDs

La carte STeaMi intègre plusieurs LEDs pour l'indication de statut et l'utilisation programmable.

## LED RGB utilisateur

La LED RGB peut être programmée par l'utilisateur.

| LED       | Signal         | Pin STM32WB55 |
| --------- | -------------- | ------------- |
| LED_RED   | LED_USER_RED   | PC12          |
| LED_GREEN | LED_USER_GREEN | PC11          |
| LED_BLUE  | LED_USER_BLUE  | PC10          |

**Composant** : Wurth 150505M173300 (LED RGB SMD 5050)

## LED Bluetooth

| LED     | Signal        | Pin STM32WB55 |
| ------- | ------------- | ------------- |
| LED_BLE | BOOT0/LED_BLE | PH3           |

Comportement :

- Clignotement bleu (duty cycle 50%) pendant l'appairage BLE
- Éteinte après 30 secondes d'inactivité

## LEDs d'interface (STM32F103)

Ces LEDs sont gérées par le microcontrôleur d'interface et indiquent l'état du système.

| LED         | Signal            | Pin STM32F103 | PCB  | Description                   |
| ----------- | ----------------- | ------------- | ---- | ----------------------------- |
| LED_CHG     | LED_CHG_RED       | -             | LED2 | Indicateur de charge batterie |
| LED_DAPLINK | LED_DAP_BLUE      | PA6           | LED3 | Indicateur DAPLink actif      |
| LED_FLASH   | LED_COM_GRN       | PB1           | LED4 | Activité communication/flash  |
| LED_STATUS  | LED_STLINK_STATUS | PA9           | LED5 | Statut général STLink         |

## LED d'alimentation

- La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectée
- La LED d'alimentation doit clignoter (duty cycle 50%) en cas de batterie faible

## Composants LED

| Composant                     | Référence    | Couleur    | Quantité |
| ----------------------------- | ------------ | ---------- | -------- |
| Wurth 150060RS75000           | LED 0603     | Rouge      | 1        |
| Wurth 150060BS75000           | LED 0603     | Bleu       | 2        |
| Wurth 150060VS75000           | LED 0603     | Vert       | 1        |
| Kingbright APHBM2012LSURKZGKC | LED bicolore | Rouge/Vert | 1        |
| Wurth 150505M173300           | LED RGB 5050 | RGB        | 1        |
