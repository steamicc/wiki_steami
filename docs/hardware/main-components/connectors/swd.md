---
sidebar_position: 5
title: 'Port SWD'
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Port SWD (debug)

Port de service pour la programmation et le débogage du STM32F103 (puce d'interface DAPLink). Il porte le repère J8 et la sérigraphie « JTAG ».

## Caractéristiques

| Caractéristique | Détail                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repère          | J8, sérigraphie « JTAG », face avant, à gauche au-dessus du joystick                                                                                  |
| Protocole       | SWD (Serial Wire Debug)                                                                                                                               |
| Empreinte       | V1b et V1c : 1 rangée de 5 trous métallisés (perçage 0,7 mm), au pas de 1,27 mm ; V1a : 2 × 5 pastilles au pas de 1,27 mm, voir [Releases](#releases) |
| Équipement      | Aucun connecteur soudé sur les cartes V1b et V1c photographiées ; non vérifiable pour la V1a                                                          |
| Tension VREF    | +3V3_STLINK (alimentation du STM32F103), par la résistance R71 de 0 Ω                                                                                 |
| Protection      | Diodes ESD D16 à D19 (ESD8351XV2T1G) sur VREF, SWDIO, NRST et SWCLK                                                                                   |
| Compatibilité   | Sondes SWD (Black Magic Probe, ST-Link), reliées fil à fil                                                                                            |

## Brochage

Le symbole du schéma FP11 est un connecteur de 10 positions dont seules les broches impaires sont reliées (indices A1, B1 et C). Sur le circuit imprimé de la V1b et de la V1c, ces cinq broches forment une seule rangée. Sur celui de la V1a, elles forment la colonne intérieure d'une empreinte de 2 × 5 pastilles, à la même place et dans le même ordre (voir [Releases](#releases)).

| Position dans la rangée | Broche J8 | Signal       | Pin STM32F103 |
| ----------------------- | --------- | ------------ | ------------- |
| 1 (pastille carrée)     | 1         | GND          | —             |
| 2                       | 3         | VREF         | —             |
| 3                       | 5         | STLINK_SWDIO | PA13          |
| 4                       | 7         | STLINK_NRST  | NRST          |
| 5                       | 9         | STLINK_SWCLK | PA14          |

La pastille carrée, repère habituel de la broche 1, est à l'extrémité de la rangée la plus proche du connecteur de bord. Contrôler la continuité entre cette pastille et GND avant de souder ou de brancher une sonde.

:::note Nomenclature
Les nomenclatures A, B1 et C donnent pour J8 un SAMTEC FTS-105-01-F-D, une embase de 2 rangées de 5 broches au pas de 1,27 mm. En V1b et en V1c, elle ne correspond pas à l'empreinte du circuit imprimé, qui n'a qu'une rangée de 5 trous. En V1a, l'empreinte est bien celle de cette embase, mais le contour de la carte traverse sa colonne paire.

Seule la nomenclature B1 classe J8 parmi les [composants non montés](../../components/not-fitted.md). Les nomenclatures A et C le placent dans la liste principale, donc comme monté, mais les cartes V1b et V1c photographiées n'ont aucun connecteur sur J8. Pour la V1a, l'équipement n'est pas vérifiable.

Pour équiper le port d'une V1b ou d'une V1c, souder une barrette mâle traversante de 1 rangée de 5 broches au pas de 1,27 mm.
:::

Aucune release n'offre donc le connecteur Cortex Debug standard (2 × 5 broches) : même en V1a, la colonne paire n'est pas reliée. Relier la sonde fil à fil : GND, SWDIO, SWCLK et, selon la sonde, VREF (référence de tension) et NRST.

## Releases

<ReleaseTabs>
<Release releases="v1a">

Les fichiers de fabrication VerA (16/12/2021) donnent pour J8 une empreinte de 2 × 5 pastilles au pas de 1,27 mm, celle de l'embase FTS-105-01-F-D de la nomenclature (10 positions).

- **Broches reliées** : seules les broches impaires, sur la colonne intérieure, sont routées : GND, VREF, SWDIO, NRST et SWCLK, comme en V1b et V1c (feuille FP11 de l'indice A1). La pastille 1 est carrée.
- **Colonne paire** : les broches 2 à 10 n'ont aucune piste, et le contour de la carte traverse cette colonne.
- **Position** : les cinq broches utiles ont la même position et le même ordre qu'en V1b et V1c.
- **Perçage** : aucun fichier VerA disponible ne donne le diamètre de perçage.
- **Équipement** : aucune photo identifiée d'une V1a ne permet de savoir si J8 était soudé.

</Release>
<Release releases="v1b v1c">

Le port est identique sur la V1b et la V1c : même feuille FP11 dans les schémas B1 et C, même position et même empreinte de 5 pastilles en une rangée dans les fichiers de placement des deux indices (face avant, x = -22,5692, y = -34,4724, rotation 84°).

</Release>
</ReleaseTabs>

## Schémas

[![Schéma FP11-Port_JTAG](/img/schematics/FP11-Port_JTAG.png)](/docs/schematics/FP11-Port_JTAG.pdf)

- [Schéma Altium — FP11](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP11-Port_JTAG.SchDoc)

## Voir aussi

- [STM32F103 — MCU interface](../stm32f103)
- [Connecteurs externes — Port JTAG / SWD](../../pin-mapping/external-connectors.md#port-jtag--swd)
- [Conception — Service et USB](../../../design/service-usb.md)
- [Tous les connecteurs](./)
