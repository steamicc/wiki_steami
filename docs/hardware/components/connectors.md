---
sidebar_position: 8
title: 'Connecteurs'
---

import OctopartButton from '@site/src/components/OctopartButton';

# Connecteurs

| Composant               | Description                                                                | Fabricant                                                           | Reference                                                                   | Qte | Datasheet |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- | --- | --------- |
| USB3080-30-00-A         | Connecteur micro-USB B, Bottom-SMT (V1a, V1b)                              | [GCT](https://gct.co/)                                              | USB3080-30-00-A <br/><OctopartButton q="USB3080-30-00-A" />                 | 1   | —         |
| 10114830-10102LF        | Connecteur batterie SMD 2 positions, pas 1.25 mm                           | [Amphenol](https://www.amphenol-cs.com/)                            | 10114830-10102LF <br/><OctopartButton q="10114830-10102LF" />               | 1   | —         |
| 52435-2471              | Connecteur FFC/FPC 24 positions, pas 0.50 mm (écran OLED, V1a, V1b)        | [Molex](https://www.molex.com/en-us/products/part-detail/524352471) | 52435-2471 <br/><OctopartButton q="52435-2471" />                           | 1   | —         |
| S4B-PH-SM4-TB(LF)(SN)   | Connecteur I2C JST PH 4 positions, pas 2.00 mm, angle droit SMD (V1a, V1b) | [JST](https://www.jst.com/)                                         | S4B-PH-SM4-TB(LF)(SN) <br/><OctopartButton q="S4B-PH-SM4-TB" />             | 2   | —         |
| UJ20-C-H-G-SMT-4-P16-TR | Connecteur USB-C 2.0, 16 broches, SMD (V1c)                                | [Same Sky](https://www.sameskydevices.com/)                         | UJ20-C-H-G-SMT-4-P16-TR <br/><OctopartButton q="UJ20-C-H-G-SMT-4-P16-TR" /> | 1   | —         |
| F32R-1A7H1-11018        | Connecteur FFC/FPC 18 positions (écran TFT, V1c)                           | —                                                                   | F32R-1A7H1-11018 <br/><OctopartButton q="F32R-1A7H1-11018" />               | 1   | —         |
| SM04B-SRSS-TB(LF)(SN)   | Connecteur Qwiic/STEMMA QT JST SH 4 positions, pas 1.00 mm, SMD (V1c)      | [JST](https://www.jst.com/)                                         | SM04B-SRSS-TB(LF)(SN) <br/><OctopartButton q="SM04B-SRSS-TB" />             | 2   | —         |

## Details

Voir les sous-pages connecteurs pour les details fonctionnels : [Connecteurs →](../main-components/connectors/)

### Connecteur USB

Le connecteur USB (J2) est un micro-USB GCT USB3080-30-00-A sur la V1a et la V1b, et un USB-C Same Sky UJ20-C-H-G-SMT-4-P16-TR sur la V1c. Il assure :

- Alimentation 5V de la carte
- Communication USB (DAPLink, WebUSB, Mass Storage)
- Programmation du microcontrôleur applicatif
- Port série virtuel (CDC)

### Connecteur batterie

Connecteur 2 broches au pas de 1.25 mm pour batterie LiPo 3.7V.

### Connecteur écran

Sur la V1a et la V1b, connecteur FFC/FPC 24 positions Molex 52435-2471 pour l'écran OLED Winstar WEO128128BWPP3N00001 :

- Type : Slider, angle droit, contact supérieur
- Pas : 0.50 mm

Sur la V1c, connecteur FFC/FPC 18 positions F32R-1A7H1-11018 pour l'écran TFT (voir [Écran](../main-components/display#connecteur-j7)).

### Connecteurs STEMMA/Qwiic

Deux connecteurs JST 4 broches pour capteurs I2C externes.

- Bus : I2C3 (SCL: PC0, SDA: PC1)
- Alimentation : 3.3V
- V1a et V1b : JST PH au pas de 2 mm, qui n'acceptent pas directement les câbles Adafruit STEMMA QT et SparkFun Qwiic
- V1c : JST SH au pas de 1 mm, compatibles avec les écosystèmes Adafruit STEMMA QT et SparkFun Qwiic
