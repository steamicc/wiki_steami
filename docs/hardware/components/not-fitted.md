---
sidebar_position: 13
title: 'Non montés (DNP)'
---

# Composants non montés (DNP)

Ces composants sont prévus sur le PCB mais ne sont pas montés en production standard.

| Composant             | Description                                           | Fabricant | Reference      | Qte | Repères                                                                             |
| --------------------- | ----------------------------------------------------- | --------- | -------------- | --- | ----------------------------------------------------------------------------------- |
| Resistor 0 Ohm - 0603 | Strap non monté                                       | -         | -              | 17  | R3, R7, R9, R29, R32, R51, R70, R75, R76, R77, R78, R82, R85, R92, R107, R109, R115 |
| Resistor 0 Ohm - 0402 | Strap non monté                                       | NC        | NC             | 2   | R90, R101                                                                           |
| FTS-103-01-F-S        | Header bas profil 3 positions 1 rangée, pas 1.27 mm   | SAMTEC    | FTS-103-01-F-S | 1   | J9                                                                                  |
| FTS-105-01-F-D        | Header bas profil 10 positions 2 rangées, pas 1.27 mm | SAMTEC    | FTS-105-01-F-D | 1   | J8                                                                                  |

## Notes

- Cette liste est celle de la nomenclature B1. Dans la nomenclature de l'indice C, R57 et R62, qui relient le rétroéclairage de l'écran TFT à +3V3 et à GND, sont aussi marquées non montées ; leur état sur les cartes V1c de série reste à confirmer (voir [Écran](../main-components/display#connecteur-j7)).

- Les straps 0 Ohm non montés sont des emplacements réservés pour des configurations alternatives du PCB
- Les headers SAMTEC sont destinés au port de service JTAG/SWD (debug et programmation en usine). Ils ne sont pas soudés en production standard mais peuvent être ajoutés pour le développement
