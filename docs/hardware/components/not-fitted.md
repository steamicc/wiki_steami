---
sidebar_position: 13
title: 'Non montés (DNP)'
---

# Composants non montés (DNP)

Ces composants sont prévus sur le PCB mais ne sont pas montés en production standard.

| Composant             | Description                                           | Fabricant | Référence      | Qté | Repères                                                                             |
| --------------------- | ----------------------------------------------------- | --------- | -------------- | --- | ----------------------------------------------------------------------------------- |
| Resistor 0 Ohm - 0603 | Strap non monté                                       | -         | -              | 17  | R3, R7, R9, R29, R32, R51, R70, R75, R76, R77, R78, R82, R85, R92, R107, R109, R115 |
| Resistor 0 Ohm - 0402 | Strap non monté                                       | NC        | NC             | 2   | R90, R101                                                                           |
| FTS-103-01-F-S        | Header bas profil 3 positions 1 rangée, pas 1.27 mm   | SAMTEC    | FTS-103-01-F-S | 1   | J9                                                                                  |
| FTS-105-01-F-D        | Header bas profil 10 positions 2 rangées, pas 1.27 mm | SAMTEC    | FTS-105-01-F-D | 1   | J8                                                                                  |

## Notes

- Cette liste est celle de la nomenclature B1. Dans la nomenclature de l'indice C, R57 et R62, qui relient le rétroéclairage de l'écran TFT à +3V3 et à GND, sont aussi marquées non montées ; leur état sur les cartes V1c de série reste à confirmer (voir [Écran](../main-components/display#connecteur-j7)).
- Dans la nomenclature de l'indice A (V1a), 21 résistances sont marquées non montées (NI) : R3, R7, R9, R15, R16, R29, R32, R51, R70, R75, R76, R77, R78, R82, R85, R92, R103, R107, R109, R115 et R116. Par rapport à la B1, R15, R16, R103 et R116 sont donc aussi non montées, alors qu'elles sont montées en B1 et en C. À l'inverse, R90 (100 kΩ) et R101 (0 Ω) sont montées en V1a. R78, R82 et R85 sont non montées comme en B1.
- Les straps 0 Ohm non montés sont des emplacements réservés pour des configurations alternatives du PCB.
- Seule la nomenclature B1 classe J8 et J9 en « Non câblé ». Les nomenclatures A et C les placent dans la liste principale, donc comme montés, mais les cartes V1b et V1c photographiées n'ont aucun connecteur sur J8 ni sur J9. Pour la V1a, ce point n'est pas vérifiable : la photo de la carte au circuit imprimé vert (onglet V1a de la page [Matériel](../index.md)) les montre absents, mais rien n'indique qu'il s'agit d'une V1a.
- Seul J8 est le port de service SWD (débogage et programmation du STM32F103), voir [Port SWD](../main-components/connectors/swd.md).
- J9 (FTS-103-01-F-S) est un port série 3 broches du STM32F103, en face arrière : broche 1 = GND, broche 2 = RX, broche 3 = TX. Il est relié à l'UART3 du F103 sur PB11 (RX) et PB10 (TX) en V1a (indices A et A1), à l'USART1 sur PB7 (RX) et PB6 (TX) en V1b et V1c. Il peut être ajouté pour le développement.
- J8 : en V1b et V1c, l'empreinte est une rangée de 5 trous au pas de 1,27 mm et ne correspond pas à l'embase FTS-105-01-F-D de la nomenclature (2 rangées) : souder une barrette de 1 × 5. En V1a, l'empreinte compte 2 × 5 pastilles, celle de la FTS-105-01-F-D, mais le contour de la carte traverse sa colonne paire (voir [Port SWD](../main-components/connectors/swd.md#releases)).
