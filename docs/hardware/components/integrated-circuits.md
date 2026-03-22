---
sidebar_position: 2
title: "Circuits integres"
---

import OctopartButton from '@site/src/components/OctopartButton';

# Circuits integres

## Microcontroleurs

| Composant | Description | Fabricant | Reference | Qte | Datasheet |
|-----------|-------------|-----------|-----------|-----|-----------|
| [STM32WB55RG](../main-components/stm32wb55) | MCU applicatif ARM Cortex-M4, 64 MHz, 1 Mo Flash, 256 Ko SRAM, BLE 5.2 | [STMicroelectronics](https://www.st.com/en/microcontrollers-microprocessors/stm32wb55rg.html) | STM32WB55RG <br/><OctopartButton q="STM32WB55RG" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/stm32wb55rg.pdf) |
| [STM32F103CBT6](../main-components/stm32f103) | MCU interface ARM Cortex-M3, 72 MHz, 128 Ko Flash (DAPLink) | [STMicroelectronics](https://www.st.com/en/microcontrollers-microprocessors/stm32f103cb.html) | STM32F103CBT6 <br/><OctopartButton q="STM32F103CBT6" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/stm32f103cb.pdf) |

## Capteurs

| Composant | Description | Fabricant | Reference | Qte | Datasheet |
|-----------|-------------|-----------|-----------|-----|-----------|
| [ISM330DLCTR](../main-components/sensors/ism330dlc) | Accelerometre/gyroscope 6 axes + temperature, I2C/SPI | [STMicroelectronics](https://www.st.com/en/mems-and-sensors/ism330dlc.html) | ISM330DLCTR <br/><OctopartButton q="ISM330DLCTR" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/ism330dlc.pdf) |
| [VL53L1CXV0FY/1](../main-components/sensors/vl53l1x) | Capteur de distance Time-of-Flight, portee 4 m, I2C | [STMicroelectronics](https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html) | VL53L1CXV0FY/1 <br/><OctopartButton q="VL53L1CXV0FY" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/vl53l1x.pdf) |
| [LIS2MDLTR](../main-components/sensors/lis2mdl) | Magnetometre 3 axes, magnetoresistif, I2C | [STMicroelectronics](https://www.st.com/en/mems-and-sensors/lis2mdl.html) | LIS2MDLTR <br/><OctopartButton q="LIS2MDLTR" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/lis2mdl.pdf) |
| [2511020213301](../main-components/sensors/wsen-pads) | Capteur de pression absolu 26-126 kPa, 24 bits, I2C/SPI | [Wurth Elektronik](https://www.we-online.com/en/components/products/WSEN-PADS) | 2511020213301 <br/><OctopartButton q="2511020213301" /> | 1 | — |
| [2525020210001](../main-components/sensors/wsen-hids) | Capteur humidite + temperature, I2C/SPI | [Wurth Elektronik](https://www.we-online.com/en/components/products/WSEN-HIDS) | 2525020210001 <br/><OctopartButton q="2525020210001" /> | 1 | — |
| [APDS-9960](../main-components/sensors/apds9960) | Capteur lumiere ambiante, couleur, geste, proximite, I2C | [Broadcom](https://www.broadcom.com/products/optical-sensors/integrated-ambient-light-and-proximity-sensors/apds-9960) | APDS-9960 <br/><OctopartButton q="APDS-9960" /> | 1 | — |
| [IMP34DT05](../main-components/sensors/imp34dt05) | Microphone MEMS PDM omnidirectionnel | [STMicroelectronics](https://www.st.com/en/mems-and-sensors/imp34dt05.html) | IMP34DT05 <br/><OctopartButton q="IMP34DT05" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/imp34dt05.pdf) |

## Gestion d'alimentation (PMIC)

| Composant | Description | Fabricant | Reference | Qte | Datasheet |
|-----------|-------------|-----------|-----------|-----|-----------|
| [BQ24075RGT](../main-components/power/bq24075) | Chargeur batterie Li-Ion 1.5A avec PowerPath | [Texas Instruments](https://www.ti.com/product/BQ24075) | BQ24075RGT <br/><OctopartButton q="BQ24075RGT" /> | 1 | — |
| [BQ27441DRZR-G1A](../main-components/power/bq27441) | Jauge de batterie Li-Ion, I2C | [Texas Instruments](https://www.ti.com/product/BQ27441-G1) | BQ27441DRZR-G1A <br/><OctopartButton q="BQ27441DRZR" /> | 1 | — |
| [TPS63000DRCT](../main-components/power/) | Convertisseur buck-boost 1.8A, ajustable | [Texas Instruments](https://www.ti.com/product/TPS63000) | TPS63000DRCT <br/><OctopartButton q="TPS63000DRCT" /> | 1 | — |
| [LMR62421XMF](../main-components/power/) | Regulateur step-up 24V 2.1A | [Texas Instruments](https://www.ti.com/product/LMR62421) | LMR62421XMF_NOPB <br/><OctopartButton q="LMR62421XMF_NOPB" /> | 1 | — |
| AP3015AKTR-G1 | Convertisseur step-down double | [Diodes Inc.](https://www.diodes.com/part/view/AP3015A) | AP3015AKTR-G1 <br/><OctopartButton q="AP3015AKTR-G1" /> | 1 | — |
| [LD3985M33R](../main-components/power/) | Regulateur LDO 3.3V 150 mA | [STMicroelectronics](https://www.st.com/en/power-management/ld3985.html) | LD3985M33R <br/><OctopartButton q="LD3985M33R" /> | 1 | [PDF](https://www.st.com/resource/en/datasheet/ld3985.pdf) |
| [DIO7003LEST5](../main-components/power/) | Switch de distribution d'alimentation 5.5V basse perte | [DIOO Microcircuits](https://www.dioo.com/#/ProductsDetail?id=1500) | DIO7003LEST5 <br/><OctopartButton q="DIO7003LEST5" /> | 1 | [PDF](https://www.dioo.com/uploads/product/20210527/39809ef9c4aeae798493447426d5dd7c.pdf) |

## Autres circuits integres

| Composant | Description | Fabricant | Reference | Qte | Datasheet |
|-----------|-------------|-----------|-----------|-----|-----------|
| [MCP23009-E/MG](../main-components/buttons-audio) | Expandeur GPIO 8 bits, I2C | [Microchip](https://www.microchip.com/en-us/product/MCP23009) | MCP23009-E/MG <br/><OctopartButton q="MCP23009-E/MG" /> | 1 | — |
| [W25Q64JVZPIM](../main-components/w25q64) | Flash NOR 64 Mbit, SPI/QSPI, 133 MHz | [Winbond](https://www.winbond.com/hq/product/code-storage-flash-memory/serial-nor-flash/?__locale=en&partNo=W25Q64JV) | W25Q64JVZPIM <br/><OctopartButton q="W25Q64JVZPIM" /> | 1 | — |
| MLPF-WB55-01E3 | Filtre RF passe-bas 2.45 GHz pour BLE | [STMicroelectronics](https://www.st.com/en/emi-filtering-and-signal-conditioning/mlpf-wb55-01e3.html) | MLPF-WB55-01E3 <br/><OctopartButton q="MLPF-WB55-01E3" /> | 1 | — |
