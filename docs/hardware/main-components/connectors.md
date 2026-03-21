---
sidebar_position: 7
title: "Connecteurs"
---

# Connecteurs

La carte STeaMi offre plusieurs options de connectivite pour les capteurs, actionneurs et accessoires externes.

## Connecteur Edge (micro:bit compatible)

Le connecteur edge fournit un acces aux broches P0-P20 avec support pour :
- 6 entrees analogiques (P0-P4, P10)
- GPIO numeriques
- SPI (P13-P15)
- I2C (P19-P20)
- PWM (P7, P10, P11)

## Connecteur STEMMA/Qwiic

Deux connecteurs JST 4 broches (pas 2 mm) pour capteurs I2C externes.

| Caracteristique | Detail |
|---|---|
| Type | JST 4-pin, pas 2 mm |
| Nombre | 2 |
| Bus | I2C3 (SCL: PC0, SDA: PC1) |

## Connecteur Jacdac

Interface serie pour la connexion de modules Jacdac.

| Caracteristique | Detail |
|---|---|
| Data | JACDAC_DATA (UART2_TX/RX) → PB6/PB7 |
| Alimentation | JACDAC_P : 5V |

## Pads crocodile

Pads accessibles avec des pinces crocodile autour de la carte :

| Pad | Fonction |
|-----|----------|
| P0, P1, P2 | Entrees analogiques |
| P24, P25, P28, P29 | GPIO via expandeur MCP23009 |
| 3V3, GND | Alimentation |

## Port SWD (debug)

Port de service pour la programmation et le debogage du STM32F103.

| Caracteristique | Detail |
|---|---|
| Protocole | SWD (Serial Wire Debug) |
| Connecteur | Header 1 rangee, pas 1.27 mm |
| Compatibilite | Black Magic Probe, ST-Link |

| Broche | Signal | Pin STM32F103 |
|--------|--------|---------------|
| 1 | GND | — |
| 2 | SWCLK | PA14 |
| 3 | 3V3 | — |
| 4 | SWDIO | PA13 |

:::caution
Les broches 3V3 et GND ne sont pas adjacentes pour eviter tout risque de court-circuit.
:::

## Bus SPI externe

| Signal | Pin STM32WB55 |
|--------|---------------|
| SPI2_SCK_EDGE (P13) | PB13 |
| SPI2_MISO_EDGE (P14) | PB14 |
| SPI2_MOSI_EDGE (P15) | PB15 |

## Bus UART serie

| Signal | Pin STM32WB55 |
|--------|---------------|
| SERIAL_TX (T_UART2_TX) | PB11 |
| SERIAL_RX (T_UART2_RX) | PB10 |

## Schemas

- [Schema complet (PDF)](https://github.com/steamicc/steami-reference-design/blob/main/PDF/STeaMi-Schematic.PDF)

- [Schema Altium — FP13 Ports specifiques](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP13-Port_Specifique.SchDoc)
- [Schema Altium — FP11 Port JTAG](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP11-Port_JTAG.SchDoc)

## Voir aussi

- [Pin Mapping — Edge connector](../pin-mapping/edge-connector)
- [Pin Mapping — Connecteurs externes](../pin-mapping/external-connectors)
- [Conception — Capteurs](../../design/sensors)
- [Vue d'ensemble du materiel](../)
