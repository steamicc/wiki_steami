---
sidebar_position: 4
title: 'BOM complète'
---

# Bill of Materials (BOM)

Liste complète de tous les composants de la carte STeaMi, regroupés par catégorie. La carte contient 101 références distinctes.

:::info Release
Les tableaux de cette section reprennent la nomenclature de l'indice **B1** (V1b), publiée dans le [reference design](https://github.com/steamicc/steami-reference-design). Les composants propres à une release sont signalés dans chaque page ; les différences sont résumées [plus bas](#différences-selon-la-release).

La colonne « Repères » donne les repères de la nomenclature B1, et ceux de la nomenclature de l'indice C pour les lignes propres à la V1c. Un même repère peut donc désigner deux composants différents selon la release (par exemple J2, micro-USB sur la V1b et USB-C sur la V1c), et certains repères de l'indice B1 n'existent plus sur la V1c (voir [plus bas](#v1c-nomenclature-de-lindice-c)).
:::

Pour les composants actifs principaux avec liens datasheets, voir [Composants principaux](../main-components).

## Sommaire par catégorie

| Catégorie                                                          | Nombre de références |
| ------------------------------------------------------------------ | -------------------- |
| [Circuits integres](./integrated-circuits) (MCU, capteurs, PMIC)   | 21                   |
| [Resistances](./resistors)                                         | 22                   |
| [Condensateurs](./capacitors)                                      | 16                   |
| [Inductances et ferrites](./inductors)                             | 6                    |
| [Semi-conducteurs](./semiconductors) (diodes, transistors, MOSFET) | 9                    |
| [LEDs](./leds)                                                     | 5                    |
| [Connecteurs](./connectors)                                        | 5                    |
| [Composants mecaniques](./mechanical) (boutons, fusible)           | 5                    |
| [Écran et audio](./display-audio)                                  | 2                    |
| [Cristaux](./crystals)                                             | 3                    |
| [Batterie](./battery)                                              | 1                    |
| [Non montes (DNP)](./not-fitted)                                   | 6                    |

## Différences selon la release

### V1c (nomenclature de l'indice C)

Comparée à la nomenclature B1, la nomenclature de l'indice C (prototypes V1c) présente les différences suivantes. Celle de l'indice C1 (cartes V1c de série) n'a pas été retrouvée : elle peut différer sur quelques composants (voir [Révisions](../revisions)).

| Fonction        | Retiré                                      | Ajouté ou modifié                                                                                                                                  |
| --------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Écran           | J7 Molex 52435-2471 ; élévateur U4 LMR62421 | J7 F32R-1A7H1-11018 ; R57 et R62 (rétroéclairage) marquées non montées                                                                             |
| Capteurs        | U12 WSEN-PADS, U13 WSEN-HIDS, U15 APDS-9960 | U14 BME280, avec C59, C60 (100 nF) et R80 (0 Ω)                                                                                                    |
| USB             | J2 GCT USB3080-30-00-A ; D1 WE-TVS 824015   | J2 USB-C UJ20-C-H-G-SMT-4-P16-TR ; R5 et R25 à 5,1 kΩ (CC) ; D1 Wurth 82400274                                                                     |
| Connecteurs I2C | J3, J4 JST S4B-PH-SM4-TB                    | J3, J4 JST SM04B-SRSS-TB                                                                                                                           |
| LEDs            | Repères LED2 à LED7                         | Repères LED_CHG, LED_DAP, LED_COM, LED_STATUS, LED_BLE, LED_RBG (mêmes composants) ; LED1 verte et R1 (470 Ω) listées, mais LED1 non montée        |
| Microcontrôleur | —                                           | U6 référencé STM32WB55RX, avec le code distributeur d'un STM32WB55RC ; les prototypes C portent un STM32WB55RC, les cartes de série un STM32WB55RG |

Les composants passifs suivants ne figurent plus dans la nomenclature C : C6, C7, C8, C44, C45, C46, C47, C56, C57, C58, C62, C63, C64, D3, D4, L3, R24, R26, R27, R28, R79, R81, R83 et R86. Les condensateurs C73 et C74 (22 pF) changent de référence fabricant sans changer de valeur.

### V1a

La nomenclature de l'indice A1 (cartes V1a de série) n'a pas été retrouvée. La nomenclature de l'indice A (prototypes) liste notamment le tampon de reset U18 (74LVC1G07) à la place du MOSFET T4, ne monte pas les pull-up R15/R16 du bus I2C1, et liste à la fois les capteurs Wurth, le BME280 et le BNO055. Le détail est donné dans [Révisions](../revisions).
