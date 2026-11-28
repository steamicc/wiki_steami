---
sidebar_position: 4
title: 'WSEN-PADS'
---

# Capteur de pression — WSEN-PADS

:::info Release
Ce capteur équipe la **V1b** ; pour la V1a, il figure dans la nomenclature de l'indice A mais son montage reste à confirmer. Il est retiré sur la **V1c**, où le [BME280](./bme280) mesure la pression, l'humidité et la température (voir [Révisions](../../revisions#capteurs-internes)).
:::

Capteur de pression absolue avec haute résolution 24 bits. Permet de mesurer la pression atmosphérique et d'estimer l'altitude.

## Caractéristiques

| Caractéristique | Détail                                                                        |
| --------------- | ----------------------------------------------------------------------------- |
| Modèle          | [2511020213301](https://www.we-online.com/en/components/products/WSEN-PADS_1) |
| Fabricant       | Wurth Elektronik                                                              |
| Plage           | 26 kPa à 126 kPa (absolu)                                                     |
| Résolution      | 24 bits                                                                       |
| Interface       | I2C / SPI                                                                     |
| Adresse I2C     | 0x5D (7 bits)                                                                 |
| Boîtier         | 10-WFLGA                                                                      |
| Datasheet       | [WSEN-PADS](https://www.we-online.com/en/components/products/WSEN-PADS_1)     |

## Schémas

[![Schéma FP12-Capteurs](/img/schematics/FP12-Capteurs.png)](/docs/schematics/FP12-Capteurs.pdf)

- [Schéma Altium — FP12](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP12-Capteur_interne.SchDoc)

## Voir aussi

- [Driver MicroPython — wsen-pads](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads)
- [Tous les capteurs](./)
