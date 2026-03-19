---
sidebar_position: 10
title: "Interface visuelle"
---

# Interface visuelle

**Identifiant** : FP8

L'interface visuelle se compose d'un ecran OLED (WEO128128BWPP3N00001) pour l'affichage d'informations ou d'animations. De plus, des LEDs RGB et de statut fournissent un retour visuel sur l'etat du systeme, comme le statut Bluetooth ou le niveau de batterie.

## Ecran OLED

- **Composant** : Winstar WEO128128BWPP3N00001
- **Technologie** : OLED (blanc)
- **Resolution** : 128 x 128 pixels
- **Interface** : SPI1 (bus interne)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm (Molex 52435-2471)

### Signaux SPI de l'ecran

| Signal | Pin STM32WB55 |
|--------|---------------|
| SPI1_SCK_OLED | PA1 |
| SPI1_MOSI_OLED | PB5 |
| C_OLED_OR_SPI1_MISO | PB4 |
| CS_OLED | PD0 |
| RST_OLED | PA12 |

## LEDs

### LED RGB utilisateur

- **Composant** : Wurth 150505M173300 (LED RGB SMD 5050)
- LED_RED (LED_USER_RED) -> PC12
- LED_GREEN (LED_USER_GREEN) -> PC11
- LED_BLUE (LED_USER_BLUE) -> PC10

### LED Bluetooth

- LED_BLE (BOOT0/LED_BLE) -> PH3

### LEDs d'interface (STM32F103)

| LED | Signal | Pin STM32F103 |
|-----|--------|---------------|
| LED_CHG | LED_CHG_RED | - |
| LED_STATUS | LED_STLINK_STATUS | PA9 |
| LED_FLASH | LED_COM_GRN | PB1 |
| LED_DAPLINK | LED_DAP_BLUE | PA6 |
