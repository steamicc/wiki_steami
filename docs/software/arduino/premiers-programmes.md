---
title: Premiers programmes
sidebar_position: 3
---

import EssayerExemple from '@site/src/components/EssayerExemple';

# Premiers programmes

La LED RGB, les boutons A, B et MENU, le buzzer et le port série sont reliés directement au microcontrôleur STM32WB55. Ils s'utilisent avec les fonctions Arduino habituelles (`pinMode`, `digitalWrite`, `digitalRead`, `tone`, `Serial`), sans aucune bibliothèque à installer.

Les programmes de cette page fonctionnent à l'identique sur les V1a, V1b et V1c. Ils supposent l'Arduino IDE configuré comme indiqué dans [Installer l'Arduino IDE](./arduino-ide).

Les trois croquis de cette page sont repris dans le dépôt [arduino-steami-sample](https://github.com/steamicc/arduino-steami-sample), qui les compile pour la STeaMi et les republie sous licence GPL-3.0.

## Noms des broches

La définition de la carte fournit des noms prêts à l'emploi. Il est inutile de connaître les numéros de broches du microcontrôleur.

| Nom Arduino   | Élément de la carte          | Logique                        |
| ------------- | ---------------------------- | ------------------------------ |
| `LED_RED`     | LED RGB, canal rouge         | `HIGH` = allumée               |
| `LED_GREEN`   | LED RGB, canal vert          | `HIGH` = allumée               |
| `LED_BLUE`    | LED RGB, canal bleu          | `HIGH` = allumée               |
| `LED_BLE`     | LED bleue Bluetooth          | `HIGH` = allumée               |
| `A_BUTTON`    | bouton A (partagé avec P5)   | `LOW` = appuyé, pull-up        |
| `B_BUTTON`    | bouton B (partagé avec P11)  | `LOW` = appuyé, pull-up        |
| `MENU_BUTTON` | bouton MENU                  | `LOW` = appuyé, pull-up        |
| `SPEAKER`     | buzzer                       | `tone()` / `noTone()`          |
| `Serial`      | port série USB (via DAPLink) | 115200 bauds dans les exemples |

`LED_BUILTIN` désigne le canal bleu de la LED RGB.

Les quatre boutons directionnels (D-PAD) ne sont pas reliés directement au microcontrôleur : ils passent par un circuit d'extension d'entrées-sorties. Ils se lisent avec la classe `SteamiButtons` ou le driver `SteamiMCP23009E` de la bibliothèque STeaMi (voir [Capteurs](./capteurs#boutons-et-d-pad)).

## Faire clignoter la LED RGB

Le programme allume successivement les trois couleurs et écrit la couleur courante dans le moniteur série.

```cpp file=.external/arduino-steami-sample/examples/PREMIERS/ClignoterLed/ClignoterLed.ino

```

<EssayerExemple id="PREMIERS/ClignoterLed" source="sample" />

En allumant deux canaux en même temps, on obtient du jaune (rouge + vert), du cyan (vert + bleu) ou du magenta (rouge + bleu).

## Lire les boutons

Un bouton appuyé relie sa broche à la masse : la lecture donne `LOW`. Il faut donc activer la résistance de tirage interne avec `INPUT_PULLUP`, sinon la broche « flotte » quand le bouton est relâché.

```cpp file=.external/arduino-steami-sample/examples/PREMIERS/LireBoutons/LireBoutons.ino

```

<EssayerExemple id="PREMIERS/LireBoutons" source="sample" />

## Jouer un son

`tone(broche, fréquence)` produit un signal carré à la fréquence demandée, en hertz. `tone(broche, fréquence, durée)` s'arrête seul après la durée indiquée en millisecondes.

```cpp file=.external/arduino-steami-sample/examples/PREMIERS/JouerSon/JouerSon.ino

```

<EssayerExemple id="PREMIERS/JouerSon" source="sample" />

Pour jouer une mélodie, enchaîner des appels à `tone()` avec une durée, séparés par des `delay()` un peu plus longs que chaque note.

## Étapes suivantes

- [Bibliothèques STeaMi](./bibliotheques) : installer les drivers des capteurs.
- [Capteurs](./capteurs) : lire les capteurs de la carte.
- [Écran](./ecran) : dessiner et afficher des mesures sur l'écran rond.
