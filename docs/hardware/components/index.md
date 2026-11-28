---
sidebar_position: 4
title: 'BOM complète'
---

# Bill of Materials (BOM)

Liste complète de tous les composants de la carte STeaMi, regroupés par catégorie. La nomenclature B1 contient 98 références distinctes (99 lignes, la ligne R90/R101 apparaissant à la fois dans la section montée et dans la section non câblée).

:::info Release
Les tableaux de cette section reprennent la nomenclature de l'indice **B1** (V1b), publiée dans le [reference design](https://github.com/steamicc/steami-reference-design). Les composants propres à une release sont signalés dans chaque page ; les différences sont résumées [plus bas](#différences-selon-la-release).

La colonne « Repères » donne les repères de la nomenclature B1, et ceux de la nomenclature de l'indice C pour les lignes propres à la V1c. Un même repère peut donc désigner deux composants différents selon la release (par exemple J2, micro-USB sur la V1b et USB-C sur la V1c), et certains repères de l'indice B1 n'existent plus sur la V1c (voir [plus bas](#v1c-nomenclature-de-lindice-c)).
:::

Pour les composants actifs principaux avec liens datasheets, voir [Composants principaux](../main-components).

## Sommaire par catégorie

| Catégorie                                                                   | Nombre de références           |
| --------------------------------------------------------------------------- | ------------------------------ |
| [Circuits intégrés](./integrated-circuits) (MCU, capteurs, PMIC)            | 20 (dont le BME280 de la V1c)  |
| [Résistances](./resistors)                                                  | 26                             |
| [Condensateurs](./capacitors)                                               | 16                             |
| [Inductances et ferrites](./inductors) (dont le filtre de mode commun)      | 7                              |
| [Semi-conducteurs](./semiconductors) (diodes, transistors, MOSFET, fusible) | 11                             |
| [LEDs](./leds)                                                              | 5                              |
| [Connecteurs](./connectors)                                                 | 7 (dont 3 lignes V1c)          |
| [Composants mécaniques](./mechanical) (boutons, joystick)                   | 3                              |
| [Écran et audio](./display-audio)                                           | 3 (dont l'écran TFT de la V1c) |
| [Cristaux](./crystals)                                                      | 3                              |
| [Batterie](./battery)                                                       | 1                              |
| [Non montés (DNP)](./not-fitted)                                            | 4                              |

Ces nombres sont ceux des lignes des tableaux de chaque page : ils comprennent quelques lignes propres à la V1c et ne correspondent donc pas exactement au nombre de références de la nomenclature B1.

## Différences selon la release

### V1c (nomenclature de l'indice C)

Comparée à la nomenclature B1, la nomenclature de l'indice C (prototypes V1c) présente les différences suivantes. Celle de l'indice C1 (cartes V1c de série) n'a pas été retrouvée : elle peut différer sur quelques composants (voir [Révisions](../revisions)).

| Fonction        | Retiré                                      | Ajouté ou modifié                                                                                                                                                                |
| --------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Écran           | J7 Molex 52435-2471 ; élévateur U4 LMR62421 | J7 F32R-1A7H1-11018 ; R57 et R62 (rétroéclairage) marquées non montées                                                                                                           |
| Capteurs        | U12 WSEN-PADS, U13 WSEN-HIDS, U15 APDS-9960 | U14 BME280, avec C59, C60 (100 nF) et R80 (0 Ω)                                                                                                                                  |
| USB             | J2 GCT USB3080-30-00-A ; D1 WE-TVS 824015   | J2 USB-C UJ20-C-H-G-SMT-4-P16-TR ; R5 et R25 à 5,1 kΩ (CC) ; D1 Wurth 82400274                                                                                                   |
| Connecteurs I2C | J3, J4 JST S4B-PH-SM4-TB                    | J3, J4 JST SM04B-SRSS-TB                                                                                                                                                         |
| LEDs            | Repères LED2 à LED7                         | Repères LED_CHG, LED_DAP, LED_COM, LED_STATUS, LED_BLE, LED_RBG (mêmes composants) ; LED1 verte et R1 (470 Ω) listées dans la section non câblée : ni LED1 ni R1 ne sont montées |
| Microcontrôleur | —                                           | U6 référencé STM32WB55RX, avec le code distributeur d'un STM32WB55RC ; les prototypes C portent un STM32WB55RC, les cartes de série un STM32WB55RG                               |

Les composants suivants ne figurent plus dans la nomenclature C : C6, C7, C8, C44, C45, C46, C47, C56, C57, C58, C62, C63, C64, D3, D4, L3, R24, R26, R27, R28, R78, R79, R81, R82, R83, R85 et R86 (R78, R82 et R85 sont des straps non montés de la B1). Les condensateurs C73 et C74 (22 pF) changent de référence fabricant sans changer de valeur.

### V1a

La nomenclature de l'indice A1 (cartes V1a de série) n'a pas été retrouvée. Comparée à la nomenclature B1, la nomenclature de l'indice A (prototypes V1a) présente les différences suivantes.

Différences déjà décrites dans [Révisions](../revisions) :

- tampon de reset U18 (74LVC1G07) à la place du MOSFET T4, pull-up R15/R16 du bus I2C1 non montées ;
- capteurs Wurth, BME280 (U14) et BNO055 listés ensemble, avec deux quartz 32 kHz 830062558 (X2 et X3) au lieu d'un seul (X2) ;
- LED1 verte et R1 (470 Ω) dans la section montée ;
- U6 référencé STM32WB55RX, avec le code distributeur d'un STM32WB55RC, comme dans la nomenclature C ;
- pas d'alimentation 5 V Jacdac : U22 (AP3015), L5, D25, R56, R59, C85, C86 et C87 sont absents de la nomenclature A et ont été ajoutés par l'indice A1 du schéma.

Autres différences de la nomenclature A :

| Élément                      | Nomenclature A (V1a)                                                                    | Nomenclature B1 (V1b)                                            |
| ---------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Port SWD J8 et connecteur J9 | Section montée                                                                          | Section non câblée                                               |
| R90 et R101                  | Montées : R90 = 100 kΩ, R101 = 0 Ω                                                      | Non montées                                                      |
| Straps NI                    | 21 : ceux de la B1, plus R15, R16, R103 et R116                                         | 17                                                               |
| C53 (220 nF)                 | Murata GCM155R71C224KE02D, 16 V, 0402                                                   | KEMET C0603C224K9RACTU, 6,3 V, 0603                              |
| R47                          | 22 Ω (ERJ2RKD22R0X, avec R86)                                                           | 220 Ω (ERJ-2GEJ221X)                                             |
| R81 (0 Ω)                    | 0402, Yageo RC0402JR-100RL                                                              | 0603, Vishay CRCW06030000Z0EAC                                   |
| R102 et R106                 | 4,7 kΩ ; pas de R108, ni dans la nomenclature A ni dans les schémas A et A1             | R102 = 100 kΩ ; R106 et R108 = 10 Ω                              |
| Quantités                    | 100 nF ×43, 1 µF ×12 (avec C68), 15 pF ×6 (avec C61 et C65), 10 kΩ ×8 (avec R87 et R88) | Voir [Condensateurs](./capacitors) et [Résistances](./resistors) |
