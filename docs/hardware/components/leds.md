---
sidebar_position: 7
title: 'LEDs'
---

import OctopartButton from '@site/src/components/OctopartButton';

# LEDs

| Composant                                | Description                | Fabricant                                                         | Reference                                                         | Couleur    | Qte | Datasheet |
| ---------------------------------------- | -------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- | --- | --------- |
| 150060RS75000                            | LED CMS 0603               | [Wurth](https://www.we-online.com/en/components/products/WL-SMCW) | 150060RS75000 <br/><OctopartButton q="150060RS75000" />           | Rouge      | 1   | —         |
| 150060BS75000                            | LED CMS 0603               | [Wurth](https://www.we-online.com/en/components/products/WL-SMCW) | 150060BS75000 <br/><OctopartButton q="150060BS75000" />           | Bleu       | 2   | —         |
| 150060VS75000                            | LED CMS 0603               | [Wurth](https://www.we-online.com/en/components/products/WL-SMCW) | 150060VS75000 <br/><OctopartButton q="150060VS75000" />           | Vert       | 1   | —         |
| APHBM2012LSURKZGKC                       | LED bicolore 2x1.25 mm SMD | [Kingbright](https://www.kingbrightusa.com/)                      | APHBM2012LSURKZGKC <br/><OctopartButton q="APHBM2012LSURKZGKC" /> | Rouge/Vert | 1   | —         |
| [150505M173300](../main-components/leds) | LED RGB SMD 5050           | [Wurth](https://www.we-online.com/en/components/products/WL-SMCW) | 150505M173300 <br/><OctopartButton q="150505M173300" />           | RGB        | 1   | —         |

## Utilisation

Les repères des LEDs changent selon la release (LED2 à LED7 sur la V1a et la V1b, LED_CHG, LED_DAP, LED_COM, LED_STATUS, LED_BLE et LED_RBG sur la V1c), mais les composants sont les mêmes (voir [Révisions](../revisions#leds)).

Une LED verte supplémentaire, LED1 (150060VS75000, avec R1 de 470 Ω), figure au schéma près du chargeur BQ24075 sur les trois releases. Elle est listée dans les nomenclatures des indices A et C, mais pas dans celle de l'indice B1 reprise ici. Elle n'a été montée que sur les premiers prototypes de l'indice A : toujours allumée, elle était gênante.

- **150060RS75000** (Rouge) : LED de charge batterie (LED_CHG)
- **150060BS75000** (Bleu x2) : LED DAPLink + LED Bluetooth
- **150060VS75000** (Vert) : LED communication flash
- **APHBM2012LSURKZGKC** (Rouge/Vert) : LED statut DAPLink
- **[150505M173300](../main-components/leds)** (RGB) : LED utilisateur programmable
