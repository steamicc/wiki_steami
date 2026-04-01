---
sidebar_position: 7
title: 'Alimentation'
---

# Broches d'alimentation

## Broches 3V3 (alimentation 3.3V)

| Pin        | Interface             | Type |
| ---------- | --------------------- | ---- |
| 3V3_P17    | Edge Connector        | 3V3  |
| 3V3_P18    | Edge Connector        | 3V3  |
| 3V3        | Edge Connector / Croc | 3V3  |
| 3V3_P23    | Pad crocodile         | 3V3  |
| 3V3_P30    | Pad crocodile         | 3V3  |
| STEMMA_3V3 | STEMMA/Qwiic (x2)     | 3V3  |

## Broches GND (masse)

| Pin        | Interface             | Type |
| ---------- | --------------------- | ---- |
| GND_P21    | Edge Connector        | GND  |
| GND_P22    | Edge Connector        | GND  |
| GND        | Edge Connector / Croc | GND  |
| GND_P26    | Pad crocodile         | GND  |
| GND_P27    | Pad crocodile         | GND  |
| STEMMA_GND | STEMMA/Qwiic (x2)     | GND  |
| JTAG_GND   | Port JTAG             | GND  |
| JACDAC_D   | Jacdac                | GND  |

## Alimentation Jacdac

| Pin      | Signal    | Description                         |
| -------- | --------- | ----------------------------------- |
| JACDAC_P | 5V_JD_PWR | Alimentation 5V pour modules Jacdac |

## Rails d'alimentation internes

| Rail        | Description                        | Test Points                            |
| ----------- | ---------------------------------- | -------------------------------------- |
| +5V_USB     | 5V après protection ESD et ferrite | TP50                                   |
| VBUS        | Broche VBUS du connecteur USB      | TP53, TP54                             |
| PACK_OUT    | Sortie batterie avant BQ27441      | TP1                                    |
| VDD         | Tension après BQ27441              | TP52                                   |
| +3V3@1200mA | 3.3V principal (TPS63000)          | TP2, TP4, TP55, TP60, TP62, TP13, TP14 |
| SYST        | Tension avant régulateur TPS63000  | TP3                                    |
| +14V5@100mA | 14.5V boost (LMR62421) pour buzzer | TP5                                    |
| +3V3_STLINK | 3.3V pour le STLink                | TP46                                   |
| VBAT_ON_OFF | Signal SYSOFF du BQ24075           | TP51                                   |
| POWER       | Sortie alimentation après BQ24075  | TP49                                   |
