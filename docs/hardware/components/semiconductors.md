---
sidebar_position: 6
title: 'Semi-conducteurs'
---

import OctopartButton from '@site/src/components/OctopartButton';

# Semi-conducteurs

:::info Release
Cette liste reprend la nomenclature de l'indice B1 (V1b). Les composants retirés ou modifiés sur la V1c sont listés dans [BOM complète](./#différences-selon-la-release).
:::

## Diodes de protection ESD

| Composant     | Description                                                 | Fabricant                                                        | Référence                                               | Qté | Repères                                                       | Datasheet |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- | --- | ------------------------------------------------------------- | --------- |
| WE-TVS_824015 | Protection ESD haute vitesse 5 uA 5 VDC                     | [Wurth](https://www.we-online.com/en/components/products/WE-TVS) | WE-TVS_824015 <br/><OctopartButton q="824015" />        | 1   | D1                                                            | —         |
| D5V0H1B2LP-7B | Protection ESD bidirectionnelle TVS                         | [Diodes Inc.](https://www.diodes.com/)                           | D5V0H1B2LP-7B <br/><OctopartButton q="D5V0H1B2LP-7B" /> | 5   | D2, D4, D10, D13, D24                                         | —         |
| ESD8351XV2T1G | Protection ESD unidirectionnelle, faible capacité, snapback | [onsemi](https://www.onsemi.com/)                                | ESD8351XV2T1G <br/><OctopartButton q="ESD8351XV2T1G" /> | 13  | D8, D9, D11, D12, D14, D16, D17, D18, D19, D20, D21, D22, D23 | —         |

## Diodes Schottky

| Composant     | Description                     | Fabricant                                 | Référence                                               | Qté | Repères         | Datasheet |
| ------------- | ------------------------------- | ----------------------------------------- | ------------------------------------------------------- | --- | --------------- | --------- |
| SS14HE        | Diode Schottky 40V 1A SDO-323HE | [onsemi](https://www.onsemi.com/)         | SS14HE <br/><OctopartButton q="SS14HE" />               | 1   | D25             | —         |
| XBS104S14R-G  | Diode Schottky 40V 1A SOD-123   | [Torex](https://www.torexsemi.com/)       | XBS104S14R-G <br/><OctopartButton q="XBS104S14R-G" />   | 1   | D3              | —         |
| CDBQR0140R-HF | Diode 40V 100 mA 0402C/SOD-923F | [Comchip](https://www.comchiptech.com/en) | CDBQR0140R-HF <br/><OctopartButton q="CDBQR0140R-HF" /> | 2   | D26, D27        | —         |
| MBR130HWTR    | Diode Schottky 30V 1A SOD-123   | [SMC Diode](https://www.smcdiode.com/)    | MBR130HWTR <br/><OctopartButton q="MBR130HWTR" />       | 4   | D5, D6, D7, D15 | —         |

## Transistors et MOSFET

| Composant     | Description                                | Fabricant                              | Référence                                               | Qté | Repères | Datasheet |
| ------------- | ------------------------------------------ | -------------------------------------- | ------------------------------------------------------- | --- | ------- | --------- |
| MMBT2222A-7-F | Transistor bipolaire NPN 40V 600 mA SOT-23 | [onsemi](https://www.onsemi.com/)      | MMBT2222A-7-F <br/><OctopartButton q="MMBT2222A-7-F" /> | 1   | T3      | —         |
| BSS119N-H6327 | MOSFET N-Channel 100V 190 mA SOT-23-3      | [Infineon](https://www.infineon.com/)  | BSS119N-H6327 <br/><OctopartButton q="BSS119N-H6327" /> | 2   | T1, T2  | —         |
| BSS8402DW-7-F | MOSFET N/P-CH 60V/-50V 200 mW SOT363       | [Diodes Inc.](https://www.diodes.com/) | BSS8402DW-7-F <br/><OctopartButton q="BSS8402DW-7-F" /> | 1   | T4      | —         |

## Fusible

| Composant      | Description                      | Fabricant                         | Référence                                                 | Qté | Repères | Datasheet |
| -------------- | -------------------------------- | --------------------------------- | --------------------------------------------------------- | --- | ------- | --------- |
| SF-0603SP125-2 | Fusible 50V 1.25A slow blow 0603 | [Bourns](https://www.bourns.com/) | SF-0603SP125-2 <br/><OctopartButton q="SF-0603SP125-2" /> | 1   | F1      | —         |
