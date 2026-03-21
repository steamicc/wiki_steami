---
sidebar_position: 4
title: "Ecran OLED"
---

# Ecran OLED — WEO128128B

L'ecran OLED blanc 128x128 pixels est connecte au processeur applicatif via le bus SPI1 interne. Il utilise le controleur SSD1327 et est relie par un connecteur FFC/FPC 24 positions.

## Caracteristiques

| Caracteristique | Detail |
|---|---|
| Modele | Winstar WEO128128BWPP3N00001 |
| Fabricant | Winstar |
| Controleur | SSD1327 |
| Technologie | OLED (blanc) |
| Resolution | 128 x 128 pixels |
| Niveaux de gris | 4 bits (16 niveaux) |
| Interface | SPI1 (interne) |
| Connecteur | FFC/FPC 24 positions, pas 0.50 mm (Molex 52435-2471) |

## Signaux SPI

| Signal | Pin STM32WB55 |
|--------|---------------|
| SPI1_SCK_OLED | PA1 |
| SPI1_MOSI_OLED | PB5 |
| C_OLED_OR_SPI1_MISO | PB4 |
| CS_OLED | PD0 |
| RST_OLED | PA12 |

## Schemas

[![Schema FP8-Display_LEDs](/img/schematics/FP8-Display_LEDs.png)](/docs/schematics/FP8-Display_LEDs.pdf)


- [Schema Altium — FP8](https://github.com/steamicc/steami-reference-design/blob/main/Altium/STeaMi-FP8-Display_et_LED_statuts.SchDoc)

## Voir aussi

- [Driver MicroPython — ssd1327](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327)
- [Conception — Interface utilisateur](../../design/user-interface)
- [Vue d'ensemble du materiel](../)
