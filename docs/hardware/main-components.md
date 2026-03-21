---
sidebar_position: 3
title: "Composants principaux"
---

# Composants principaux

Les composants actifs de la carte STeaMi, regroupes par fonction. Pour la BOM complete (incluant passifs, connecteurs, etc.), voir la section [BOM](./components/).

## Microcontroleurs

| Composant | Description | Fabricant | Datasheet |
|-----------|-------------|-----------|-----------|
| STM32WB55RG | MCU applicatif — Cortex-M4 @ 64 MHz, 1 Mo Flash, 256 Ko SRAM, BLE 5.2 | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/stm32wb55rg.pdf) |
| STM32F103CBT6 | MCU interface — Cortex-M3 @ 72 MHz, 128 Ko Flash, DAPLink | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/stm32f103cb.pdf) |

## Capteurs

| Composant | Fonction | Fabricant | Datasheet |
|-----------|----------|-----------|-----------|
| ISM330DLCTR | Accelerometre/gyroscope 6 axes + temperature | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/ism330dlc.pdf) |
| VL53L1CXV0FY/1 | Distance Time-of-Flight, portee 4 m | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/vl53l1x.pdf) |
| LIS2MDLTR | Magnetometre 3 axes | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/lis2mdl.pdf) |
| WSEN-PADS (2511020213301) | Pression absolu 26-126 kPa, 24 bits | Wurth Elektronik | [Datasheet](https://www.we-online.com/en/components/products/WSEN-PADS) |
| WSEN-HIDS (2525020210001) | Humidite + temperature | Wurth Elektronik | [Datasheet](https://www.we-online.com/en/components/products/WSEN-HIDS) |
| APDS-9960 | Lumiere ambiante, couleur, geste, proximite | Broadcom | [Datasheet](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) |
| IMP34DT05 | Microphone MEMS PDM omnidirectionnel | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/imp34dt05.pdf) |

## Gestion d'alimentation

| Composant | Fonction | Fabricant | Datasheet |
|-----------|----------|-----------|-----------|
| BQ24075RGT | Chargeur batterie Li-Ion 1.5A, PowerPath | Texas Instruments | [Datasheet](https://www.ti.com/product/BQ24075) |
| BQ27441DRZR-G1A | Jauge de batterie Li-Ion, I2C | Texas Instruments | [Datasheet](https://www.ti.com/product/BQ27441-G1) |
| TPS63000DRCT | Convertisseur buck-boost 3.3V @ 1.2A | Texas Instruments | [Datasheet](https://www.ti.com/product/TPS63000) |
| LMR62421XMF | Boost 14.5V pour buzzer | Texas Instruments | [Datasheet](https://www.ti.com/product/LMR62421) |
| LD3985M33R | LDO 3.3V 150 mA | STMicroelectronics | [Datasheet](https://www.st.com/resource/en/datasheet/ld3985.pdf) |
| DIO7003LEST5 | Switch alimentation basse perte | DIOO Microcircuits | — |

## Autres circuits integres

| Composant | Fonction | Fabricant | Datasheet |
|-----------|----------|-----------|-----------|
| MCP23009-E/MG | Expandeur GPIO 8 bits, I2C | Microchip | [Datasheet](https://www.microchip.com/en-us/product/MCP23009) |
| W25Q64JVZPIM | Flash NOR 64 Mbit, SPI/QSPI | Winbond | [Datasheet](https://www.winbond.com/hq/product/code-storage-flash-memory/serial-nor-flash/?__locale=en&partNo=W25Q64JV) |
| MLPF-WB55-01E3 | Filtre RF passe-bas 2.45 GHz | STMicroelectronics | [Datasheet](https://www.st.com/en/emi-filtering-and-signal-conditioning/mlpf-wb55-01e3.html) |

## Ecran et audio

| Composant | Fonction | Fabricant |
|-----------|----------|-----------|
| WEO128128BWPP3N00001 | Ecran OLED 128x128 blanc, SPI | Winstar |
| SMT-0825-S-HT-R | Buzzer piezo SMD | PUI Audio |

## Voir aussi

- [BOM complete](./components/) — Tous les composants incluant passifs, connecteurs, mecaniques
- [Hardware](./) — Description detaillee de chaque sous-systeme
- [Conception](../design/) — Justification des choix de composants
