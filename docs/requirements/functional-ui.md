---
sidebar_position: 3
title: "FCT - Interface utilisateur"
---

# Exigences fonctionnelles - Interface utilisateur (FCT-10 a FCT-27)

## LEDs indicatrices

| ID | Nom | Description |
|----|-----|-------------|
| FCT-10 | RGB system indicator LED | Le systeme doit pouvoir informer l'utilisateur de son etat de fonctionnement grace a des LEDs RGB. |
| FCT-11 | RGB system indicator LED (extinction) | Le systeme doit pouvoir eteindre toutes les LEDs indicatrices apres 30 secondes si aucune interaction n'est detectee. |
| FCT-12 | RGB system indicator LED (comportement) | La LED RGB systeme doit clignoter en bleu (duty cycle 50%) pendant l'appairage BLE. La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectee et clignoter (duty cycle 50%) en cas de batterie faible. |
| FCT-13 | RGB user indicator LED | La LED RGB utilisateur peut etre programmee par l'utilisateur. C'est la responsabilite de l'utilisateur de gerer son comportement. |
| FCT-14 | Power LED | La LED d'alimentation doit rester verte fixe lorsque l'alimentation est connectee. Elle doit clignoter (duty cycle 50%) en cas de batterie faible. |

## Ecran

| ID | Nom | Description |
|----|-----|-------------|
| FCT-15 | Display | Le systeme doit pouvoir afficher des informations graphiques ou textuelles sur un ecran haute resolution. |
| FCT-16 | Display - Controller | Le controleur d'ecran doit etre ST7735, ILI9341 ou ILI9163C. |
| FCT-17 | Display - SPI | Le controleur doit etre connecte sur le bus SPI. |
| FCT-18 | Display - Resolution | La resolution de l'ecran doit etre d'au moins 128x128. |
| FCT-19 | Display - Backlight | L'ecran pourrait integrer un retro-eclairage LED pour ameliorer la lisibilite en exterieur. |

## Boutons

| ID | Nom | Description |
|----|-----|-------------|
| FCT-20 | User buttons - BLE Pairing | Le systeme doit pouvoir appairer un appareil BLE si la duree d'appui sur le bouton d'allumage depasse un seuil defini. |
| FCT-21 | User buttons - Arcade requirement | Le systeme necessite 7 boutons utilisateur au total : gauche, haut, droite, bas (en configuration d-pad), A, B et Menu. |
| FCT-22 | User buttons - Pull-up | Les 4 boutons directionnels, les boutons A/B et le bouton Menu seront connectes avec des resistances de pull-up. |
| FCT-23 | User buttons - Placement constraints | La disposition recommandee est d'avoir les boutons directionnels en configuration d-pad avec les boutons A et B places separement. |
| FCT-24 | User buttons - Menu function | Une des fonctions du bouton Menu est de quitter le mode veille basse consommation. Pour un MCU avec capacite de reveil, le bouton Menu doit etre connecte a une broche de reveil. |
| FCT-25 | Reset button | Le systeme doit pouvoir redemarrer via un bouton poussoir RESET. |
| FCT-26 | Power button | Le systeme doit pouvoir etre allume et eteint par le bouton poussoir d'alimentation si la batterie est presente. |

## Audio

| ID | Nom | Description |
|----|-----|-------------|
| FCT-27 | Audio | Le systeme peut optionnellement produire un signal audio. Sortie audio mono un seul canal. |
