---
sidebar_position: 13
title: "Interface de programmation et debogage"
---

# Interface de programmation et debogage

**Identifiant** : FP11

Une interface de programmation est fournie via un connecteur JTAG standard pour le debogage et le flashage du firmware sur le microcontroleur.

## Port de service (JTAG/SWD)

- **Compatibilite** : Sondes SWD telles que Black Magic Probe ou ST-Link
- **Connecteur** : Header 1 rangee, pas 1.27 mm

### Brochage recommande

| Broche | Signal | Pin STM32F103 |
|--------|--------|---------------|
| 1 | GND | - |
| 2 | SWCLK | PA14 |
| 3 | 3V3 | - |
| 4 | SWDIO | PA13 |

:::caution
Ne pas placer 3V et GND adjacents pour eviter tout risque de court-circuit.
:::
