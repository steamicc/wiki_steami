---
sidebar_position: 3
title: 'Interface utilisateur'
---

import ReleaseTabs, { Release, ReleaseSelector, ReleaseValue } from '@site/src/components/ReleaseTabs';

# Interface utilisateur

Les exigences sont communes aux trois releases de la carte. Quand l'implémentation diffère, la colonne « Implémentation » affiche la release choisie ci-dessous ; les écarts sont détaillés dans [Révisions](../hardware/revisions#écarts-aux-exigences).

<ReleaseSelector />

## Exigences — LEDs indicatrices

| ID     | Nom                                     | Description                                                                                                                                                                          | Implémentation                                               |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| FCT-10 | RGB system indicator LED                | Le système doit pouvoir informer l'utilisateur de son état de fonctionnement grâce à des LEDs RGB.                                                                                   | LED RGB Wurth 150505M173300 + LEDs status F103               |
| FCT-11 | RGB system indicator LED (extinction)   | Le système doit pouvoir éteindre toutes les LEDs indicatrices après 30 secondes lorsqu'il est alimenté par sa batterie interne.                                                      | Gestion logicielle                                           |
| FCT-12 | RGB system indicator LED (comportement) | La LED RGB système doit clignoter (duty cycle 50%) en bleu pendant l'appairage BLE (advertising et connexion), en rouge en cas d'erreur système et en vert pendant la programmation. | LED_BLE (PH3), bleue : pas de rouge ni de vert sur cette LED |
| FCT-13 | RGB user indicator LED                  | La LED RGB utilisateur peut être programmée par l'utilisateur. C'est la responsabilité de l'utilisateur de gérer son comportement.                                                   | LED RGB sur PC10/PC11/PC12                                   |
| FCT-14 | Power LED                               | La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectée. Elle doit clignoter (duty cycle 50%) en cas de batterie faible.                                   | LED_STATUS (PA9 sur F103)                                    |

## Exigences — Écran

| ID     | Nom                  | Description                                                                                               | Implémentation                                                                                                                                                                                                                    |
| ------ | -------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FCT-15 | Display              | Le système doit pouvoir afficher des informations graphiques ou textuelles sur un écran haute résolution. | <ReleaseValue><Release releases="v1a v1b">OLED rond Winstar WEO128128BWPP3N00001</Release><Release releases="v1c">TFT rond Winstar WF0128BTYAA4DNN0</Release></ReleaseValue>                                                      |
| FCT-16 | Display - Controller | Le contrôleur d'écran doit être ST7735, ILI9341 ou ILI9163C.                                              | <ReleaseValue><Release releases="v1a v1b">**Écart** : SSD1327 (OLED)</Release><Release releases="v1c">**Écart** : GC9A01 (TFT)</Release></ReleaseValue>                                                                           |
| FCT-17 | Display - SPI        | Le contrôleur doit être connecté sur le bus SPI.                                                          | SPI1 interne                                                                                                                                                                                                                      |
| FCT-18 | Display - Resolution | La résolution de l'écran doit être d'au moins 128x128.                                                    | <ReleaseValue><Release releases="v1a v1b">128 x 128 pixels</Release><Release releases="v1c">240 x 240 pixels</Release></ReleaseValue>                                                                                             |
| FCT-19 | Display - Backlight  | L'écran pourrait intégrer un rétro-éclairage LED pour améliorer la lisibilité en extérieur.               | <ReleaseValue><Release releases="v1a v1b">OLED auto-émissif (pas de rétro-éclairage nécessaire)</Release><Release releases="v1c">Rétro-éclairage LED (VLED+ / VLED- par R57 et R62, montage à confirmer)</Release></ReleaseValue> |

## Exigences — Boutons

| ID     | Nom                                  | Description                                                                                                                                                                                                                                                                                                                               | Implémentation                                                                                                                   |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FCT-20 | User buttons - BLE Pairing           | Le système doit pouvoir appairer un appareil BLE si le bouton poussoir est maintenu appuyé pendant au moins 3 secondes.                                                                                                                                                                                                                   | Bouton Menu (PA0) — appui long                                                                                                   |
| FCT-21 | User buttons - Arcade requirement    | Le système nécessite 7 boutons utilisateur au total : gauche, haut, droite, bas (en configuration d-pad), A, B et Menu.                                                                                                                                                                                                                   | D-pad via MCP23009 + A/B GPIO + Menu GPIO                                                                                        |
| FCT-22 | User buttons - Pull-up               | Les 4 boutons directionnels, les boutons A/B et le bouton Menu sont reliés à des broches GPIO du MCU, comme entrées numériques. La configuration logicielle accepte des boutons actifs à l'état haut ou à l'état bas. Si le MCU dispose de résistances de pull-up ou de pull-down internes, des pull-up externes ne sont pas nécessaires. | Résistances pull-up externes                                                                                                     |
| FCT-23 | User buttons - Placement constraints | La disposition recommandée place les boutons directionnels en « d-pad » à gauche de la carte et les boutons A et B à droite, A au-dessus et à droite de B. Le bouton Menu se place de préférence près des autres boutons, et le bouton Reset à côté du connecteur USB.                                                                    | ALPS SKRHABE010 (joystick 4 directions, SW2) + C&K PTS647SM38SMTR2LFS (A = SW5, B = SW4, Menu = SW3)                             |
| FCT-24 | User buttons - Menu function         | Une des fonctions du bouton Menu est de quitter le mode veille basse consommation. Pour un MCU avec capacité de réveil, le bouton Menu doit être connecté à une broche de réveil.                                                                                                                                                         | Menu sur PA0 (broche wake)                                                                                                       |
| FCT-25 | Reset button                         | Le système doit pouvoir redémarrer via un bouton poussoir RESET.                                                                                                                                                                                                                                                                          | Bouton Reset SW1, C&K PTS636 SM25J SMTR LFS, monté en face arrière                                                               |
| FCT-26 | Power button                         | Le système doit pouvoir être allumé et éteint par le bouton poussoir d'alimentation si celui-ci est maintenu appuyé pendant au moins 3 secondes.                                                                                                                                                                                          | **Écart** : aucun bouton d'alimentation. La batterie est coupée par U21 (DIO7003), commandé par VBAT_ON/OFF sur PA7 du STM32F103 |

## Exigences — Audio

| ID     | Nom   | Description                                                                                                                                                                                                                                                              | Implémentation                   |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| FCT-27 | Audio | Le système peut optionnellement produire un signal audio. Une sortie audio mono, sur un seul canal, demande un DAC ou une PWM avec DMA. La sortie audio correspondante du MCU doit être reliée à un amplificateur, puis à un haut-parleur intégré ou à une prise casque. | Buzzer PUI Audio SMT-0825-S-HT-R |

## Choix de conception

### Interface visuelle (FP8)

#### Écran

<ReleaseTabs>
<Release releases="v1a v1b">

L'écran OLED rond blanc 128x128 pixels offre un affichage auto-émissif, sans rétro-éclairage.

- **Composant** : Winstar WEO128128BWPP3N00001
- **Technologie** : OLED (blanc)
- **Résolution** : 128 x 128 pixels
- **Interface** : SPI1 (bus interne)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm (Molex 52435-2471)

Le SSD1327 ne fait pas partie des contrôleurs listés par l'exigence FCT-16 : c'est un écart documenté dans [Révisions](../hardware/revisions#écarts-aux-exigences).

</Release>
<Release releases="v1c">

L'écran TFT rond 240x240 pixels affiche en couleur, avec un rétro-éclairage LED.

- **Composant** : Winstar WF0128BTYAA4DNN0
- **Contrôleur** : GC9A01
- **Résolution** : 240 x 240 pixels
- **Interface** : SPI1 (bus interne)
- **Connecteur** : FFC/FPC 18 positions (F32R-1A7H1-11018)

Le GC9A01 ne fait pas partie des contrôleurs listés par l'exigence FCT-16 : c'est un écart documenté dans [Révisions](../hardware/revisions#écarts-aux-exigences).

</Release>
</ReleaseTabs>

Le détail par release est donné dans la page [Écran](../hardware/main-components/display).

**Signaux SPI de l'écran (identiques pour les trois releases) :**

| Signal                | Pin STM32WB55 |
| --------------------- | ------------- |
| SPI1_SCK_OLED         | PA1           |
| SPI1_MOSI_OLED        | PB5           |
| D/C_OLED_OR_SPI1_MISO | PB4           |
| CS_OLED               | PD0           |
| RST_OLED              | PA12          |

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

Seuls les repères sérigraphiés des LEDs changent entre les releases (LED2 à LED7 sur les premières cartes) ; leur câblage est identique (voir [Révisions](../hardware/revisions#leds)).

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

- **Composant** : C&K PTS647SM38SMTR2LFS (SW5 pour A, SW4 pour B), comme le bouton Menu (SW3)

Le C&K PTS636 SM25J SMTR LFS des nomenclatures est le bouton Reset SW1, monté en face arrière.

#### Bouton Menu

| Bouton      | Signal      | Pin STM32WB55 |
| ----------- | ----------- | ------------- |
| MENU_BUTTON | MENU_BOUTON | PA0           |

- Fonction secondaire : réveil du mode basse consommation
- Fonction secondaire : appairage BLE (appui long à l'allumage)

#### Alimentation

La carte n'a pas de bouton d'alimentation, sur aucune release : c'est un écart à l'exigence FCT-26. Les schémas et les nomenclatures des indices A, A1, B1 et C ne comptent que cinq boutons (SW1 Reset, SW2 joystick, SW3 Menu, SW4 B, SW5 A). L'alimentation par la batterie est coupée par l'interrupteur U21 (DIO7003), commandé par le signal VBAT_ON/OFF sur la broche PA7 du STM32F103. Aucune source ne montre que le bouton Reset SW1 sert à l'allumage.

### Sortie audio (FP10)

Un buzzer piézo permet la génération de sons. Il est alimenté en +3V3 par R68 (0 Ω) et commandé par le transistor MOSFET T2, avec une diode de roue libre D15. Ce montage est identique sur les trois releases.

- **Composant** : PUI Audio SMT-0825-S-HT-R
- **Type** : Transducteur piézo montage en surface
- **Tension** : 3.6V pic-à-pic
- **Signal** : BEEPER_OUT → PA11 (STM32WB55), sur la grille de T2 (BSS119N)
- **Alimentation** : +3V3
- **Sortie** : Mono, un seul canal

## Voir aussi

- [Hardware](../hardware/)
- [Révisions de la carte](../hardware/revisions)
- [Écran](../hardware/main-components/display)
- [Composants — Circuits intégrés](../hardware/components/integrated-circuits)
- [Pin Mapping — LEDs](../hardware/pin-mapping/leds)
- [Pin Mapping — Boutons](../hardware/pin-mapping/buttons)
