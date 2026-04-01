---
sidebar_position: 3
title: 'Interface utilisateur'
---

# Interface utilisateur

## Exigences — LEDs indicatrices

| ID     | Nom                                     | Description                                                                                                                                                                                                                    | Implémentation                                 |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| FCT-10 | RGB system indicator LED                | Le système doit pouvoir informer l'utilisateur de son état de fonctionnement grâce à des LEDs RGB.                                                                                                                             | LED RGB Wurth 150505M173300 + LEDs status F103 |
| FCT-11 | RGB system indicator LED (extinction)   | Le système doit pouvoir éteindre toutes les LEDs indicatrices après 30 secondes si aucune interaction n'est détectée.                                                                                                          | Gestion logicielle                             |
| FCT-12 | RGB system indicator LED (comportement) | La LED RGB système doit clignoter en bleu (duty cycle 50%) pendant l'appairage BLE. La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectée et clignoter (duty cycle 50%) en cas de batterie faible. | LED_BLE (PH3) + LED_CHG                        |
| FCT-13 | RGB user indicator LED                  | La LED RGB utilisateur peut être programmée par l'utilisateur. C'est la responsabilité de l'utilisateur de gérer son comportement.                                                                                             | LED RGB sur PC10/PC11/PC12                     |
| FCT-14 | Power LED                               | La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectée. Elle doit clignoter (duty cycle 50%) en cas de batterie faible.                                                                             | LED_STATUS (PA9 sur F103)                      |

## Exigences — Écran

| ID     | Nom                  | Description                                                                                               | Implémentation                                        |
| ------ | -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| FCT-15 | Display              | Le système doit pouvoir afficher des informations graphiques ou textuelles sur un écran haute résolution. | OLED Winstar WEO128128BWPP3N00001                     |
| FCT-16 | Display - Controller | Le contrôleur d'écran doit être SSD1327, ST7735, ILI9341 ou ILI9163C.                                     | SSD1327 (OLED)                                        |
| FCT-17 | Display - SPI        | Le contrôleur doit être connecté sur le bus SPI.                                                          | SPI1 interne                                          |
| FCT-18 | Display - Resolution | La résolution de l'écran doit être d'au moins 128x128.                                                    | 128 x 128 pixels                                      |
| FCT-19 | Display - Backlight  | L'écran pourrait intégrer un rétro-éclairage LED pour améliorer la lisibilité en extérieur.               | OLED auto-émissif (pas de rétro-éclairage nécessaire) |

## Exigences — Boutons

| ID     | Nom                                  | Description                                                                                                                                                                       | Implémentation                                       |
| ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| FCT-20 | User buttons - BLE Pairing           | Le système doit pouvoir appairer un appareil BLE si la durée d'appui sur le bouton Menu (PA0) dépasse un seuil défini.                                                            | Bouton Menu (PA0) — appui long                       |
| FCT-21 | User buttons - Arcade requirement    | Le système nécessite 7 boutons utilisateur au total : gauche, haut, droite, bas (en configuration d-pad), A, B et Menu.                                                           | D-pad via MCP23009 + A/B GPIO + Menu GPIO            |
| FCT-22 | User buttons - Pull-up               | Les 4 boutons directionnels, les boutons A/B et le bouton Menu seront connectés avec des résistances de pull-up.                                                                  | Résistances pull-up externes                         |
| FCT-23 | User buttons - Placement constraints | La disposition recommandée est d'avoir les boutons directionnels en configuration d-pad avec les boutons A et B placés séparément.                                                | ALPS SKRHABE010 (joystick 4 directions) + C&K PTS636 |
| FCT-24 | User buttons - Menu function         | Une des fonctions du bouton Menu est de quitter le mode veille basse consommation. Pour un MCU avec capacité de réveil, le bouton Menu doit être connecté à une broche de réveil. | Menu sur PA0 (broche wake)                           |
| FCT-25 | Reset button                         | Le système doit pouvoir redémarrer via un bouton poussoir RESET.                                                                                                                  | Bouton reset                                         |
| FCT-26 | Power button                         | Le système doit pouvoir être allumé et éteint par le bouton poussoir d'alimentation si la batterie est présente.                                                                  | Bouton power                                         |

## Exigences — Audio

| ID     | Nom   | Description                                                                                | Implémentation                   |
| ------ | ----- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| FCT-27 | Audio | Le système peut optionnellement produire un signal audio. Sortie audio mono un seul canal. | Buzzer PUI Audio SMT-0825-S-HT-R |

## Choix de conception

### Interface visuelle (FP8)

#### Écran OLED

L'écran OLED blanc 128x128 pixels offre un affichage haute qualité sans rétro-éclairage.

- **Composant** : Winstar WEO128128BWPP3N00001
- **Technologie** : OLED (blanc)
- **Résolution** : 128 x 128 pixels
- **Interface** : SPI1 (bus interne)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm (Molex 52435-2471)

**Signaux SPI de l'écran :**

| Signal              | Pin STM32WB55 |
| ------------------- | ------------- |
| SPI1_SCK_OLED       | PA1           |
| SPI1_MOSI_OLED      | PB5           |
| C_OLED_OR_SPI1_MISO | PB4           |
| CS_OLED             | PD0           |
| RST_OLED            | PA12          |

#### LED RGB utilisateur

- **Composant** : Wurth 150505M173300 (LED RGB SMD 5050)
- LED_RED (LED_USER_RED) → PC12
- LED_GREEN (LED_USER_GREEN) → PC11
- LED_BLUE (LED_USER_BLUE) → PC10

#### LED Bluetooth

- LED_BLE (BOOT0/LED_BLE) → PH3

#### LEDs d'interface (STM32F103)

| LED         | Signal            | Pin STM32F103 |
| ----------- | ----------------- | ------------- |
| LED_CHG     | LED_CHG_RED       | -             |
| LED_STATUS  | LED_STLINK_STATUS | PA9           |
| LED_FLASH   | LED_COM_GRN       | PB1           |
| LED_DAPLINK | LED_DAP_BLUE      | PA6           |

### Boutons de contrôle (FP9)

Le système nécessite 7 boutons utilisateur au total. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour économiser des broches MCU.

#### Boutons directionnels (via MCP23009)

| Bouton | Broche MCP23009 | PCB   |
| ------ | --------------- | ----- |
| UP     | GP7             | Up    |
| DOWN   | GP5             | Down  |
| LEFT   | GP6             | Left  |
| RIGHT  | GP4             | Right |

- **Composant** : ALPS SKRHABE010 (joystick 4 directions avec push central)

#### Boutons A et B (GPIO directs)

| Bouton   | Signal              | Pin STM32WB55 |
| -------- | ------------------- | ------------- |
| A_BUTTON | GPIO1_EDGE_BOUTON_A | PA7 (= P5)    |
| B_BUTTON | GPIO6_EDGE_BOUTON_B | PA8 (= P11)   |

- **Composant** : C&K PTS636 SM25J SMTR LFS / PTS647SM38SMTR2LFS

#### Bouton Menu

| Bouton      | Signal      | Pin STM32WB55 |
| ----------- | ----------- | ------------- |
| MENU_BUTTON | MENU_BOUTON | PA0           |

- Fonction secondaire : réveil du mode basse consommation
- Fonction secondaire : appairage BLE (appui long à l'allumage)

### Sortie audio (FP10)

Un buzzer piézo permet la génération de sons. Il est alimenté par un boost converter dédié (14.5V) car la tension 3.3V standard est insuffisante pour un transducteur piézo.

- **Composant** : PUI Audio SMT-0825-S-HT-R
- **Type** : Transducteur piézo montage en surface
- **Tension** : 3.6V pic-à-pic
- **Signal** : BEEPER_OUT → PA11 (STM32WB55)
- **Alimentation** : Boost converter LMR62421 (14.5V)
- **Sortie** : Mono, un seul canal

## Voir aussi

- [Hardware](../hardware/)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
- [Pin Mapping — LEDs](../hardware/pin-mapping/leds)
- [Pin Mapping — Boutons](../hardware/pin-mapping/buttons)
