---
sidebar_position: 6
title: 'Révisions'
---

# Révisions de la carte

La STeaMi V1 existe en trois releases : **V1a**, **V1b** et **V1c**. Elles partagent l'essentiel de leur conception (microcontrôleurs STM32WB55 et STM32F103, capteurs de mouvement et de distance, boutons, audio, gestion de la batterie) et ne diffèrent que sur quelques fonctions.

Cette page est la référence pour savoir ce que contient chaque release. Dans le reste du wiki, seules les sections qui diffèrent sont présentées en onglets **V1a / V1b / V1c** ; le choix d'un onglet est mémorisé et appliqué à toutes les pages. Par défaut, le wiki affiche la V1c.

## Identifier sa version

La révision et le nom de la carte sont stockés dans la zone de configuration du STM32F103 (DAPLink). Ils peuvent être lus via le module `steami_config` en MicroPython :

```python
from steami_config import SteamiConfig
from machine import I2C

config = SteamiConfig(I2C(1))
print(f"Board: {config.board_name}")
print(f"Revision: {config.board_revision}")
```

Quelques repères visuels permettent aussi de distinguer les releases :

| Repère                     | V1a et V1b                                        | V1c                                |
| -------------------------- | ------------------------------------------------- | ---------------------------------- |
| Connecteur USB             | Micro-USB                                         | USB-C                              |
| Écran                      | OLED rond 128 x 128, monochrome                   | TFT rond 240 x 240, couleur        |
| Connecteurs I2C (J3/J4)    | JST PH, pas 2 mm                                  | JST SH, pas 1 mm (Qwiic/STEMMA QT) |
| Capteurs internes          | WSEN-PADS, WSEN-HIDS, APDS-9960                   | BME280 (pression, humidité, temp.) |
| Couleur du circuit imprimé | Vert (V1a et prototypes V1b), noir (V1b de série) | Noir                               |

Le circuit imprimé est vert jusqu'à l'indice B1 du circuit imprimé (cartes V1a et prototypes V1b) et noir à partir de l'indice B2, utilisé pour les V1b de série (voir [Indices du circuit imprimé](#indices-du-circuit-imprimé)).

## Releases et indices du schéma

Chaque release correspond à une série d'indices du schéma. Les premiers indices de chaque série ont servi à fabriquer quelques prototypes ; l'indice final est celui des cartes diffusées : **A1** pour la V1a, **B1** pour la V1b et **C1** pour la V1c.

| Indice | Release | Rôle      | Cartes fabriquées | Date du cartouche | Description du cartouche                                                   | Fichiers disponibles                                                                     |
| ------ | ------- | --------- | ----------------- | ----------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A      | V1a     | Prototype | 5                 | 19/08/2021        | Création                                                                   | Dossier de fabrication (schéma, nomenclature, Gerber, placement)                         |
| A1     | V1a     | Série     | 50                | 02/02/2022        | Update Power JACDAC                                                        | Schéma                                                                                   |
| B      | V1b     | Prototype | 5                 | 06/02/2024        | Update I2C1, USART1, RST, SPI1                                             | Aucun fichier propre                                                                     |
| B1     | V1b     | Série     | 100               | 27/06/2024        | R14 R15 4.7K add R110                                                      | [steami-reference-design](https://github.com/steamicc/steami-reference-design) (complet) |
| C      | V1c     | Prototype | 5                 | 17/07/2025        | Update Display, J4, J3, USB-C                                              | Dossier de fabrication (schéma, nomenclature, placement)                                 |
| C1     | V1c     | Série     | 400               | —                 | Variante de nomenclature de l'indice C (même schéma, même circuit imprimé) | Aucun                                                                                    |

Les dates et descriptions sont celles du cartouche des schémas Altium.

### Indices du circuit imprimé

Le circuit imprimé a ses propres indices, qui ne suivent pas exactement ceux du schéma. Son cartouche (plan d'assemblage de l'indice C) liste :

| Indice PCB | Date       | Description                      |
| ---------- | ---------- | -------------------------------- |
| A          | 16/12/2021 | Création                         |
| A1         | 01/02/2022 | Mise à jour Power JACDAC         |
| A2         | 31/03/2023 | Update LED5, Polygon, StackLayer |
| B          | 12/02/2023 | I2C bus, F103->I2C1&SPI2, RESET  |
| B1         | 27/06/2024 | Add R110 et R14 R15 4.7K         |
| B2         | 22/10/2024 | Update Impédance & doigt doré    |
| C          | 17/07/2025 | Update USB-C, Display, J3, J4    |

Les 100 cartes V1b de série associent le schéma B1 au circuit imprimé **B2** : PCB noir et connecteur de bord à doigts dorés. Les cartes V1c (C et C1) utilisent le circuit imprimé C, noir lui aussi.

### Fichiers manquants

Quand le fichier de l'indice final manque, les tableaux de cette page s'appuient sur l'indice précédent :

- **V1a** : schéma A1, mais nomenclature de l'indice A. Elle ne contient pas les composants ajoutés par l'indice A1 (alimentation Jacdac, voir plus bas) et peut différer des cartes V1a sur d'autres points.
- **V1c** : schéma de l'indice C, valable aussi pour C1, et nomenclature de l'indice C. Les composants modifiés par la nomenclature C1 ne sont pas encore documentés.

:::caution À confirmer

- La nomenclature de l'indice C1 (V1c diffusée) et celle de l'indice A1 (V1a diffusée) n'ont pas été retrouvées.
- Le dépôt [steami-reference-design](https://github.com/steamicc/steami-reference-design) ne contient que l'indice B1.
- L'indice du circuit imprimé des 50 cartes V1a de série (A1 ou A2) n'est pas connu.
- La date de l'indice B du circuit imprimé (12/02/2023) précède celle de l'indice B du schéma (06/02/2024) ; l'une des deux contient peut-être une erreur d'année.

:::

## Différences par fonction

Le tableau suivant liste toutes les fonctions qui diffèrent entre les releases. Tout ce qui n'y figure pas est commun aux trois.

### Écran

| Élément                 | V1a                                        | V1b                                    | V1c                                                  |
| ----------------------- | ------------------------------------------ | -------------------------------------- | ---------------------------------------------------- |
| Écran                   | OLED rond Winstar WEO128128BWPP3N00001 (1) | OLED rond Winstar WEO128128BWPP3N00001 | TFT rond Winstar WF0128BTYAA4DNN0                    |
| Contrôleur              | SSD1327                                    | SSD1327                                | GC9A01                                               |
| Résolution              | 128 x 128, 16 niveaux de gris              | 128 x 128, 16 niveaux de gris          | 240 x 240, couleur                                   |
| Connecteur J7           | Molex 52435-2471, 24 positions             | Molex 52435-2471, 24 positions         | F32R-1A7H1-11018, 18 positions                       |
| Alimentation de l'écran | +3V3 et +14V5 (élévateur LMR62421, U4)     | +3V3 et +14V5 (élévateur LMR62421, U4) | +3V3, rétroéclairage LED ; U4 et ses passifs retirés |
| Signaux SPI (STM32WB55) | Identiques                                 | Identiques                             | Identiques                                           |

(1) L'écran ne figure dans aucune nomenclature. Pour la V1a, la référence vient du dossier de conception ; le connecteur J7 et l'élévateur U4 de la nomenclature A sont identiques à ceux de la V1b.

### Capteurs internes

| Capteur                     | V1a (nomenclature A) | V1b                            | V1c                                                 |
| --------------------------- | -------------------- | ------------------------------ | --------------------------------------------------- |
| WSEN-PADS (pression, U12)   | Listé                | Monté                          | Retiré                                              |
| WSEN-HIDS (humidité, U13)   | Listé                | Monté                          | Retiré                                              |
| APDS-9960 (lumière, U15)    | Listé                | Monté                          | Retiré                                              |
| BME280 (U14)                | Listé                | Empreinte au schéma, non monté | Monté, I2C1, adresse 0x76 (« ou BME680 » au schéma) |
| BNO055 (U16) et quartz X3   | Listés               | Au schéma, non montés          | Retirés du schéma                                   |
| ISM330DLC, LIS2MDL, VL53L1X | Montés               | Montés                         | Montés                                              |

La nomenclature A liste à la fois le BME280, les deux capteurs Wurth et le BNO055, alors que le dossier de conception les présente comme des variantes de nomenclature. Les capteurs réellement montés sur les cartes V1a restent à confirmer.

### USB

| Élément        | V1a et V1b                    | V1c                           |
| -------------- | ----------------------------- | ----------------------------- |
| Connecteur J2  | Micro-USB GCT USB3080-30-00-A | USB-C UJ20-C-H-G-SMT-4-P16-TR |
| Résistances CC | —                             | R5 et R25, 5,1 kΩ             |
| Protection D1  | Wurth WE-TVS 824015           | Wurth 82400274                |

### Connecteurs I2C externes (J3, J4)

| Élément       | V1a et V1b                  | V1c                         |
| ------------- | --------------------------- | --------------------------- |
| Référence     | JST S4B-PH-SM4-TB, pas 2 mm | JST SM04B-SRSS-TB, pas 1 mm |
| Compatibilité | JST PH 4 broches            | Qwiic / STEMMA QT           |
| Bus           | I2C3 (PC0, PC1)             | I2C3 (PC0, PC1)             |

### Alimentation et microcontrôleurs

| Élément                 | V1a                                      | V1b                                    | V1c                        |
| ----------------------- | ---------------------------------------- | -------------------------------------- | -------------------------- |
| Alimentation Jacdac     | 5V, élévateur AP3015 (U22), ajouté en A1 | 5V, élévateur AP3015 (U22)             | 5V, élévateur AP3015 (U22) |
| Broche PB2 du STM32WB55 | `I2C_INT`                                | `ON/OFF_+3V3_STLINK`                   | `ON/OFF_+3V3_STLINK`       |
| Bus I2C1                | Pull-up R15/R16 non montées              | Pull-up R15/R16 4,7 kΩ, R106/R108 10 Ω | Identique V1b              |
| Reset côté STM32F103    | Tampon 74LVC1G07 (U18)                   | U18 retiré, MOSFET BSS8402DW (T4)      | Identique V1b              |

Toutes les cartes de série (A1, B1 et C1) utilisent un STM32WB55RG (1 Mo de flash, 256 Ko de SRAM). Les prototypes des indices A et C sont équipés d'un STM32WB55RC (256 Ko de flash), conformément à leur nomenclature ; pour l'indice A, ce choix reprend celui du dossier de conception.

Côté STM32WB55, le brochage est identique entre la V1b et la V1c. Entre la V1a et la V1b, seules la broche PB2 et les résistances du bus I2C1 changent.

### LEDs

| V1a et V1b | V1c          | Fonction                  |
| ---------- | ------------ | ------------------------- |
| LED2       | `LED_CHG`    | Charge batterie (rouge)   |
| LED3       | `LED_DAP`    | DAPLink (bleue)           |
| LED4       | `LED_COM`    | Communication (verte)     |
| LED5       | `LED_STATUS` | Statut ST-Link (bicolore) |
| LED6       | `LED_BLE`    | Bluetooth (bleue)         |
| LED7       | `LED_RBG`    | LED RGB utilisateur       |

Seuls les repères changent ; le câblage des LEDs est identique. `LED_RBG` est le repère tel qu'il est écrit dans le schéma C.

Le schéma comporte aussi, sur les trois releases, une LED verte LED1 (150060VS75000, avec R1 de 470 Ω) sur la feuille du chargeur BQ24075. Elle est listée dans les nomenclatures des indices A et C, mais pas dans celle de l'indice B1. Elle n'a été montée que sur les premiers prototypes de l'indice A : les autres cartes, y compris les V1b de série et les prototypes V1c, ne l'ont pas.

## Écarts aux exigences

Le [dossier de conception](../design/) liste les exigences de la carte. Certaines releases s'en écartent ; ces écarts sont signalés ici et dans les pages de conception concernées.

| Exigence       | Release  | Écart                                                                                                   |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| FCT-01, 59, 61 | V1c      | L'exigence impose un connecteur micro-USB ; la V1c utilise un connecteur USB-C.                         |
| FCT-16         | V1c      | Le contrôleur GC9A01 ne fait pas partie de la liste autorisée (SSD1327, ST7735, ILI9341, ILI9163C).     |
| FCT-43         | V1c      | Le capteur de lumière, couleur et geste (APDS-9960) est retiré.                                         |
| FCT-44         | V1c      | La pression est mesurée par le BME280, et non par un LPS22HH ou un WSEN-PADS.                           |
| FCT-45         | V1c      | L'humidité et la température sont mesurées par le BME280, et non par un HTS221 ou un WSEN-HIDS.         |
| FCT-52         | V1a, V1b | Les connecteurs J3 et J4 sont des JST PH au pas de 2 mm, incompatibles avec les câbles Qwiic/STEMMA QT. |

:::caution À confirmer

- **FCT-19 (V1c)** : le rétroéclairage de l'écran est relié à +3V3 et GND par R57 et R62, marquées non montées dans la nomenclature C.
- **ENV-01 (V1c)** : la plage de fonctionnement de l'écran TFT annoncée par les distributeurs (-20 °C à 70 °C) ne couvre pas les 85 °C exigés.

:::

## Voir aussi

- [Schémas et reference design](./schematic)
- [Conception et exigences](../design/)
- [Écran](./main-components/display)
