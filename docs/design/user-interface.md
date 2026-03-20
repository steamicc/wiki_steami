---
sidebar_position: 3
title: "Interface utilisateur"
---

# Interface utilisateur

## Exigences — LEDs indicatrices

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-10 | RGB system indicator LED | Le systeme doit pouvoir informer l'utilisateur de son etat de fonctionnement grace a des LEDs RGB. | LED RGB Wurth 150505M173300 + LEDs status F103 |
| FCT-11 | RGB system indicator LED (extinction) | Le systeme doit pouvoir eteindre toutes les LEDs indicatrices apres 30 secondes si aucune interaction n'est detectee. | Gestion logicielle |
| FCT-12 | RGB system indicator LED (comportement) | La LED RGB systeme doit clignoter en bleu (duty cycle 50%) pendant l'appairage BLE. La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectee et clignoter (duty cycle 50%) en cas de batterie faible. | LED_BLE (PH3) + LED_CHG |
| FCT-13 | RGB user indicator LED | La LED RGB utilisateur peut etre programmee par l'utilisateur. C'est la responsabilite de l'utilisateur de gerer son comportement. | LED RGB sur PC10/PC11/PC12 |
| FCT-14 | Power LED | La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectee. Elle doit clignoter (duty cycle 50%) en cas de batterie faible. | LED_STATUS (PA9 sur F103) |

## Exigences — Ecran

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-15 | Display | Le systeme doit pouvoir afficher des informations graphiques ou textuelles sur un ecran haute resolution. | OLED Winstar WEO128128BWPP3N00001 |
| FCT-16 | Display - Controller | Le controleur d'ecran doit etre SSD1327, ST7735, ILI9341 ou ILI9163C. | SSD1327 (OLED) |
| FCT-17 | Display - SPI | Le controleur doit etre connecte sur le bus SPI. | SPI1 interne |
| FCT-18 | Display - Resolution | La resolution de l'ecran doit etre d'au moins 128x128. | 128 x 128 pixels |
| FCT-19 | Display - Backlight | L'ecran pourrait integrer un retro-eclairage LED pour ameliorer la lisibilite en exterieur. | OLED auto-emissif (pas de retro-eclairage necessaire) |

## Exigences — Boutons

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-20 | User buttons - BLE Pairing | Le systeme doit pouvoir appairer un appareil BLE si la duree d'appui sur le bouton Menu (PA0) depasse un seuil defini. | Bouton Menu (PA0) — appui long |
| FCT-21 | User buttons - Arcade requirement | Le systeme necessite 7 boutons utilisateur au total : gauche, haut, droite, bas (en configuration d-pad), A, B et Menu. | D-pad via MCP23009 + A/B GPIO + Menu GPIO |
| FCT-22 | User buttons - Pull-up | Les 4 boutons directionnels, les boutons A/B et le bouton Menu seront connectes avec des resistances de pull-up. | Resistances pull-up externes |
| FCT-23 | User buttons - Placement constraints | La disposition recommandee est d'avoir les boutons directionnels en configuration d-pad avec les boutons A et B places separement. | ALPS SKRHABE010 (joystick 4 directions) + C&K PTS636 |
| FCT-24 | User buttons - Menu function | Une des fonctions du bouton Menu est de quitter le mode veille basse consommation. Pour un MCU avec capacite de reveil, le bouton Menu doit etre connecte a une broche de reveil. | Menu sur PA0 (broche wake) |
| FCT-25 | Reset button | Le systeme doit pouvoir redemarrer via un bouton poussoir RESET. | Bouton reset |
| FCT-26 | Power button | Le systeme doit pouvoir etre allume et eteint par le bouton poussoir d'alimentation si la batterie est presente. | Bouton power |

## Exigences — Audio

| ID | Nom | Description | Implémentation |
|----|-----|-------------|----------------|
| FCT-27 | Audio | Le systeme peut optionnellement produire un signal audio. Sortie audio mono un seul canal. | Buzzer PUI Audio SMT-0825-S-HT-R |

## Choix de conception

### Interface visuelle (FP8)

#### Ecran OLED

L'ecran OLED blanc 128x128 pixels offre un affichage haute qualite sans retro-eclairage.

- **Composant** : Winstar WEO128128BWPP3N00001
- **Technologie** : OLED (blanc)
- **Resolution** : 128 x 128 pixels
- **Interface** : SPI1 (bus interne)
- **Connecteur** : FFC/FPC 24 positions, pas 0.50 mm (Molex 52435-2471)

**Signaux SPI de l'ecran :**

| Signal | Pin STM32WB55 |
|--------|---------------|
| SPI1_SCK_OLED | PA1 |
| SPI1_MOSI_OLED | PB5 |
| C_OLED_OR_SPI1_MISO | PB4 |
| CS_OLED | PD0 |
| RST_OLED | PA12 |

#### LED RGB utilisateur

- **Composant** : Wurth 150505M173300 (LED RGB SMD 5050)
- LED_RED (LED_USER_RED) → PC12
- LED_GREEN (LED_USER_GREEN) → PC11
- LED_BLUE (LED_USER_BLUE) → PC10

#### LED Bluetooth

- LED_BLE (BOOT0/LED_BLE) → PH3

#### LEDs d'interface (STM32F103)

| LED | Signal | Pin STM32F103 |
|-----|--------|---------------|
| LED_CHG | LED_CHG_RED | - |
| LED_STATUS | LED_STLINK_STATUS | PA9 |
| LED_FLASH | LED_COM_GRN | PB1 |
| LED_DAPLINK | LED_DAP_BLUE | PA6 |

### Boutons de controle (FP9)

Le systeme necessite 7 boutons utilisateur au total. Les boutons directionnels passent par l'expandeur GPIO MCP23009 pour economiser des broches MCU.

#### Boutons directionnels (via MCP23009)

| Bouton | Broche MCP23009 | PCB |
|--------|-----------------|-----|
| UP | GP7 | Up |
| DOWN | GP5 | Down |
| LEFT | GP6 | Left |
| RIGHT | GP4 | Right |

- **Composant** : ALPS SKRHABE010 (joystick 4 directions avec push central)

#### Boutons A et B (GPIO directs)

| Bouton | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| A_BUTTON | GPIO1_EDGE_BOUTON_A | PA7 (= P5) |
| B_BUTTON | GPIO6_EDGE_BOUTON_B | PA8 (= P11) |

- **Composant** : C&K PTS636 SM25J SMTR LFS / PTS647SM38SMTR2LFS

#### Bouton Menu

| Bouton | Signal | Pin STM32WB55 |
|--------|--------|---------------|
| MENU_BUTTON | MENU_BOUTON | PA0 |

- Fonction secondaire : reveil du mode basse consommation
- Fonction secondaire : appairage BLE (appui long a l'allumage)

### Sortie audio (FP10)

Un buzzer piezo permet la generation de sons. Il est alimente par un boost converter dedie (14.5V) car la tension 3.3V standard est insuffisante pour un transducteur piezo.

- **Composant** : PUI Audio SMT-0825-S-HT-R
- **Type** : Transducteur piezo montage en surface
- **Tension** : 3.6V pic-a-pic
- **Signal** : BEEPER_OUT → PA11 (STM32WB55)
- **Alimentation** : Boost converter LMR62421 (14.5V)
- **Sortie** : Mono, un seul canal

## Voir aussi

- [Hardware](../hardware/)
- [Composants — Circuits integres](../components/integrated-circuits)
- [Pin Mapping — LEDs](../pin-mapping/leds)
- [Pin Mapping — Boutons](../pin-mapping/buttons)
