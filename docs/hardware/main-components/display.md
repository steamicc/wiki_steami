---
sidebar_position: 4
title: 'Écran'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Écran

L'écran est connecté au processeur applicatif (STM32WB55) via le bus SPI1 interne et relié par un connecteur FFC/FPC (J7). Le modèle d'écran dépend de la release : OLED rond monochrome sur la V1a et la V1b, TFT rond en couleur sur la V1c. Le câblage côté microcontrôleur est le même pour les trois releases (voir [Révisions](../revisions)).

## Caractéristiques

<ReleaseTabs>
<Release releases="v1a v1b">

| Caractéristique | Détail                                               |
| --------------- | ---------------------------------------------------- |
| Modèle          | Winstar WEO128128BWPP3N00001                         |
| Fabricant       | Winstar                                              |
| Contrôleur      | SSD1327                                              |
| Technologie     | OLED rond (blanc)                                    |
| Résolution      | 128 x 128 pixels                                     |
| Niveaux de gris | 4 bits (16 niveaux)                                  |
| Interface       | SPI1 (interne)                                       |
| Connecteur      | FFC/FPC 24 positions, pas 0.50 mm (Molex 52435-2471) |
| Alimentation    | +3V3 et +14V5 (élévateur LMR62421, U4)               |

Pour la V1a, la référence de l'écran est celle du dossier de conception ; la nomenclature A contient le même connecteur J7 et le même élévateur U4 que la V1b.

</Release>
<Release releases="v1c">

| Caractéristique | Détail                                                     |
| --------------- | ---------------------------------------------------------- |
| Modèle          | Winstar WF0128BTYAA4DNN0 (sans dalle tactile)              |
| Fabricant       | Winstar                                                    |
| Contrôleur      | GC9A01                                                     |
| Technologie     | TFT IPS rond, rétroéclairage LED                           |
| Diagonale       | 1,28 pouce                                                 |
| Résolution      | 240 x 240 pixels                                           |
| Interface       | SPI1 (interne)                                             |
| Connecteur      | FFC/FPC 18 positions (F32R-1A7H1-11018)                    |
| Alimentation    | +3V3 ; l'élévateur LMR62421 (U4) des V1a et V1b est retiré |

La référence de l'écran ne figure ni dans le schéma ni dans la nomenclature C : elle vient des échanges avec le bureau d'études lors de la conception de l'indice C. Le contrôleur, la diagonale et la technologie du panneau proviennent des fiches distributeurs du WF0128BTYAA4DNN0.

</Release>
</ReleaseTabs>

## Signaux SPI

Les signaux et les broches du STM32WB55 sont identiques pour les trois releases. Sur la V1c, les noms de signaux conservent le suffixe `_OLED` bien que l'écran soit un TFT.

| Signal                | Pin STM32WB55 | Test Point |
| --------------------- | ------------- | ---------- |
| SPI1_SCK_OLED         | PA1           | TP22       |
| SPI1_MOSI_OLED        | PB5           | TP23       |
| D/C_OLED_OR_SPI1_MISO | PB4           | TP24       |
| CS_OLED               | PD0           | TP20       |
| RST_OLED              | PA12          | TP21       |

L'écran ne renvoie aucune donnée : PB4 sert de ligne D/C (donnée ou commande) et non de MISO (voir [Signaux](../pin-mapping/signals)). Le schéma suivant relie ces broches au connecteur J7, dont le brochage change avec l'écran. Cliquer sur l'image pour l'ouvrir en grand.

<ReleaseTabs>
<Release releases="v1a v1b">

[![Schéma du câblage SPI1 des STeaMi V1a et V1b : le STM32WB55 pilote un écran OLED SSD1327 par le bus SPI1 (SCK PA1, MOSI PB5, CS PD0) et les GPIO D/C (PB4) et RST (PA12), à travers les broches 10, 11, 12, 15 et 16 du connecteur J7 à 24 positions ; écran alimenté en +3V3 et en +14V5 (élévateur U4)](/img/diagrams/ecran-spi-v1a-v1b.svg)](pathname:///img/diagrams/ecran-spi-v1a-v1b.svg)

</Release>
<Release releases="v1c">

[![Schéma du câblage SPI1 de la STeaMi V1c : le STM32WB55 pilote un écran TFT GC9A01 par le bus SPI1 (SCK PA1, MOSI PB5, CS PD0) et les GPIO D/C (PB4) et RST (PA12), à travers les broches 10 à 13 et 15 du connecteur J7 à 18 positions ; rétroéclairage toujours allumé, relié au +3V3 par R57 et à la masse par R62, sans broche du microcontrôleur](/img/diagrams/ecran-spi-v1c.svg)](pathname:///img/diagrams/ecran-spi-v1c.svg)

</Release>
</ReleaseTabs>

## Connecteur J7

<ReleaseTabs>
<Release releases="v1a v1b">

Connecteur Molex 52435-2471, 24 positions au pas de 0,50 mm. Il reçoit les signaux SPI ci-dessus ainsi que les alimentations +3V3 et +14V5. Brochage d'après les schémas des indices A, A1 et B1, identiques pour J7 :

| Broche J7                 | Signal                | Remarque                   |
| ------------------------- | --------------------- | -------------------------- |
| 2, 23                     | +14V5                 | Élévateur LMR62421 (U4)    |
| 3                         | —                     | Vers GND par C45 (4,7 µF)  |
| 4, 5                      | +3V3                  |                            |
| 9                         | —                     | Vers GND par R57 (1,15 MΩ) |
| 10                        | CS_OLED               |                            |
| 11                        | RST_OLED              |                            |
| 12                        | D/C_OLED_OR_SPI1_MISO |                            |
| 13                        | —                     | Vers GND par R62 (0 Ω)     |
| 15                        | SPI1_SCK_OLED         |                            |
| 16                        | SPI1_MOSI_OLED        |                            |
| 1, 6 à 8, 14, 18 à 22, 24 | GND                   |                            |
| 17                        | —                     | Non connectée              |

</Release>
<Release releases="v1c">

Connecteur F32R-1A7H1-11018, 18 positions. Broches utilisées d'après le schéma indice C :

| Broche J7 | Signal                | Remarque                     |
| --------- | --------------------- | ---------------------------- |
| 7         | VLED+                 | Vers +3V3 par R57            |
| 8         | VLED-                 | Vers GND par R62             |
| 9, 18     | GND                   |                              |
| 10        | CS_OLED               |                              |
| 11        | SPI1_SCK_OLED         |                              |
| 12        | SPI1_MOSI_OLED        |                              |
| 13        | D/C_OLED_OR_SPI1_MISO |                              |
| 14        | TE                    | Non relié au microcontrôleur |
| 15        | RST_OLED              |                              |
| 16        | +3V3                  |                              |

Aucune broche du STM32WB55 ne commande le rétroéclairage : il est toujours allumé (voir le [README du driver gc9a01](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/gc9a01/README.md)).

:::caution À confirmer

R57 et R62, qui alimentent le rétroéclairage, sont marquées non montées (NC) dans la nomenclature C. Leur valeur sur les cartes fabriquées reste à confirmer.

:::

</Release>
</ReleaseTabs>

## Schémas

<ReleaseTabs>
<Release releases="v1a v1b">

Schéma indice B1 :

[![Schéma FP8-Display_LEDs](/img/schematics/FP8-Display_LEDs.png)](/docs/schematics/FP8-Display_LEDs.pdf)

- [Schéma Altium — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc)

</Release>
<Release releases="v1c">

Le schéma indice C (feuille FP8, page 9/16) n'est pas encore publié dans le dépôt [steami-reference-design](https://github.com/steamicc/steami-reference-design).

</Release>
</ReleaseTabs>

## Voir aussi

<ReleaseTabs>
<Release releases="v1a v1b">

- [Driver MicroPython — ssd1327](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327)

</Release>
<Release releases="v1c">

- [Driver MicroPython — gc9a01](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/gc9a01), dans le firmware depuis la v0.30.0
- [steami_screen](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen) — `steami.Screen`, le même programme sur les écrans des trois releases ; depuis la v0.31.0, texte en polices Spleen avec accents sur la V1c (voir [Essayer sur la carte](/docs/software/micropython/essayer#sur-une-v1c) et la section [Fonts](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/README.md#fonts) du README)

</Release>
</ReleaseTabs>

- [Révisions de la carte](../revisions)
- [Conception — Interface utilisateur](../../design/user-interface)
- [Vue d'ensemble du matériel](../)
