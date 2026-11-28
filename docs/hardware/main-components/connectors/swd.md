---
sidebar_position: 5
title: 'Port SWD'
---

# Port SWD (debug)

Port de service pour la programmation et le débogage du STM32F103 (puce d'interface DAPLink). Il porte le repère J8 et la sérigraphie « JTAG ».

## Caractéristiques

| Caractéristique | Détail                                                                |
| --------------- | --------------------------------------------------------------------- |
| Repère          | J8, sérigraphie « JTAG », face avant, à gauche au-dessus du joystick  |
| Protocole       | SWD (Serial Wire Debug)                                               |
| Empreinte       | 1 rangée de 5 trous métallisés (perçage 0,7 mm), au pas de 1,27 mm    |
| Équipement      | Aucun connecteur soudé                                                |
| Tension VREF    | +3V3_STLINK (alimentation du STM32F103), par la résistance R71 de 0 Ω |
| Protection      | Diodes ESD D16 à D19 (ESD8351XV2T1G) sur VREF, SWDIO, NRST et SWCLK   |
| Compatibilité   | Sondes SWD (Black Magic Probe, ST-Link), reliées fil à fil            |

## Brochage

Le symbole du schéma FP11 est un connecteur de 10 positions dont seules les broches impaires sont reliées. Sur le circuit imprimé, ces cinq broches forment une seule rangée.

| Position dans la rangée | Broche J8 | Signal       | Pin STM32F103 |
| ----------------------- | --------- | ------------ | ------------- |
| 1 (pastille carrée)     | 1         | GND          | —             |
| 2                       | 3         | VREF         | —             |
| 3                       | 5         | STLINK_SWDIO | PA13          |
| 4                       | 7         | STLINK_NRST  | NRST          |
| 5                       | 9         | STLINK_SWCLK | PA14          |

La pastille carrée, repère habituel de la broche 1, est à l'extrémité de la rangée la plus proche du connecteur de bord. Contrôler la continuité entre cette pastille et GND avant de souder ou de brancher une sonde.

:::note Nomenclature
Les nomenclatures donnent pour J8 un SAMTEC FTS-105-01-F-D, une embase de 2 rangées de 5 broches au pas de 1,27 mm, qui ne correspond pas à l'empreinte du circuit imprimé. Il figure parmi les [composants non montés](../../components/not-fitted.md) de la nomenclature B1, et il est absent des cartes V1c photographiées. Pour équiper le port, souder une barrette mâle traversante de 1 rangée de 5 broches au pas de 1,27 mm.
:::

La carte n'offre donc pas le connecteur Cortex Debug standard (2 × 5 broches). Relier la sonde fil à fil : GND, SWDIO, SWCLK et, selon la sonde, VREF (référence de tension) et NRST.

## Releases

Le port est identique sur la V1b et la V1c : même feuille FP11 dans les schémas B1 et C, même position et même empreinte dans les fichiers de placement des deux indices.

À l'indice A de la V1a, le dessin d'assemblage montre une autre empreinte : 2 x 5 pastilles au pas de 1,27 mm (PAJ801 à PAJ8010), faite pour l'embase SAMTEC FTS-105-01-F-D de la nomenclature A. Le brochage de la feuille FP11 est le même : seules les broches impaires sont reliées. Aucun dessin d'assemblage n'existe pour l'indice A1.

## Schémas

[![Schéma FP11-Port_JTAG](/img/schematics/FP11-Port_JTAG.png)](/docs/schematics/FP11-Port_JTAG.pdf)

- [Schéma Altium — FP11](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP11-Port_JTAG.SchDoc)

## Voir aussi

- [STM32F103 — MCU interface](../stm32f103)
- [Connecteurs externes — Port JTAG / SWD](../../pin-mapping/external-connectors.md#port-jtag--swd)
- [Conception — Service et USB](../../../design/service-usb.md)
- [Tous les connecteurs](./)
