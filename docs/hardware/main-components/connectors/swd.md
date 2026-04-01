---
sidebar_position: 5
title: 'Port SWD'
---

# Port SWD (debug)

Port de service pour la programmation et le débogage du STM32F103.

## Caractéristiques

| Caractéristique | Détail                       |
| --------------- | ---------------------------- |
| Protocole       | SWD (Serial Wire Debug)      |
| Connecteur      | Header 1 rangée, pas 1.27 mm |
| Compatibilité   | Black Magic Probe, ST-Link   |

## Brochage

| Broche | Signal | Pin STM32F103 |
| ------ | ------ | ------------- |
| 1      | GND    | —             |
| 2      | SWCLK  | PA14          |
| 3      | 3V3    | —             |
| 4      | SWDIO  | PA13          |

:::caution
Les broches 3V3 et GND ne sont pas adjacentes pour éviter tout risque de court-circuit.
:::

## Schémas

[![Schéma FP11-Port_JTAG](/img/schematics/FP11-Port_JTAG.png)](/docs/schematics/FP11-Port_JTAG.pdf)

- [Schéma Altium — FP11](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP11-Port_JTAG.SchDoc)

## Voir aussi

- [STM32F103 — MCU interface](../stm32f103)
- [Tous les connecteurs](./)
