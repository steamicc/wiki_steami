---
title: Écran
sidebar_position: 5.2
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';
import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore colour hline vline -->

# Écran

L'écran rond de la STeaMi change avec la release (voir [Les écrans de la carte](/docs/hardware/main-components/display) et [Révisions](/docs/hardware/revisions)) : un OLED de 128 × 128 pixels en 16 niveaux de gris (contrôleur SSD1327) sur une V1a ou une V1b, un TFT couleur de 240 × 240 pixels (contrôleur GC9A01) sur une V1c. La bibliothèque STeaMi le pilote avec deux classes, qui choisissent elles-mêmes l'écran de la release : le même programme dessine la même image sur les trois cartes.

- `SteamiDisplay` dessine des formes et du texte, en pixels (version 0.37.0 de la bibliothèque).
- `SteamiScreen` est une `SteamiDisplay` qui place elle-même titres, valeurs et barres sur l'écran rond (version 0.38.0). La version 0.40.0 y ajoute les widgets ronds : jauge, boussole, montre et visages ; la version 0.41.0 le graphe, avec `SteamiHistory`, et le menu.

Depuis la version 0.40.0, le texte de l'écran de la V1c s'écrit dans la police Spleen : des caractères de 8 pixels de large et 16 de haut, avec les lettres accentuées.

Avant de commencer, installer la bibliothèque **STeaMi**, version 0.41.0 ou plus récente, depuis le gestionnaire de bibliothèques (voir [Bibliothèques STeaMi](./bibliotheques)). Avec une version plus ancienne, la compilation s'arrête sur `SteamiScreen.h: No such file or directory` ou sur `has no member named 'gauge'` (ou le nom d'une autre fonction), ou encore sur `'SteamiHistory' was not declared in this scope` : l'encart « Version de la bibliothèque » de [Reconnaître la carte](./carte) donne la version demandée par chaque fonction et la façon de mettre à jour. Les programmes affichent leurs messages d'erreur dans le moniteur série, à 115200 bauds.

Les exemples de la bibliothèque qui utilisent ces classes sont dans **Fichier → Exemples → STeaMi → STEAMI_BOARD** : la page [Exemples STEAMI_BOARD](./exemples/steami-board) les explique un par un, avec une photo de l'écran et un bouton pour les envoyer sur la carte.

Les croquis suivis d'un bouton **Téléverser** viennent du dépôt [arduino-steami-sample](https://github.com/steamicc/arduino-steami-sample), où chacun est compilé pour la STeaMi. Ils y sont republiés sous licence GPL-3.0. Le bouton envoie sur la carte le programme compilé.

Sur cette page :

<TOCInline toc={toc} />

## Dessiner avec SteamiDisplay

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranBonjour/EcranBonjour.ino

```

<EssayerExemple id="ECRAN/EcranBonjour" source="sample" />

`begin()` reconnaît la release, comme les classes des capteurs, puis démarre son écran : le SSD1327 sur une V1a ou une V1b, le GC9A01 sur une V1c. Le même programme dessine la même image sur les deux : `centerX()`, `centerY()` et `radius()` donnent le centre et le rayon de l'écran rond, `(64, 64)` et 64 sur une V1a ou une V1b, `(120, 120)` et 120 sur une V1c ; `width()` et `height()` donnent sa taille en pixels, `(0, 0)` étant le coin en haut à gauche, `x` vers la droite et `y` vers le bas. Placer les formes à partir du centre, avec des fractions du rayon, donne ainsi la même scène sur les deux écrans.

Le dessin se fait dans une image en mémoire, et rien n'apparaît avant l'appel à `show()`, qui l'envoie en entier à l'écran. Ce qui dépasse de l'écran est coupé, sans erreur. Les fonctions de dessin :

- `clear(couleur)` remplit l'image, de noir par défaut ;
- `pixel(x, y, couleur)` allume un pixel ;
- `line(x1, y1, x2, y2, couleur)` trace un segment, `hline(x, y, w, couleur)` un trait horizontal de `w` pixels et `vline(x, y, h, couleur)` un trait vertical de `h` pixels ;
- `rect(x, y, w, h, couleur)`, `circle(cx, cy, r, couleur)` et `triangle(x0, y0, x1, y1, x2, y2, couleur)` tracent un contour, et une forme pleine avec `true` en dernier argument ;
- `arc(cx, cy, r, début, étendue, couleur, épaisseur)` trace un morceau d'anneau : les angles sont en degrés, 0 en haut comme midi sur une montre, en tournant dans le sens des aiguilles ; `r` est le bord extérieur, et l'épaisseur va vers l'intérieur ;
- `text(texte, x, y, couleur)` écrit un texte (voir [Le texte](#le-texte)).

`show()` prend au moins 58 ms environ sur une V1c, dont l'image fait 115 200 octets, et 8,2 ms environ sur une V1a ou une V1b, dont l'image est 14 fois plus petite : c'est ce qui limite la vitesse d'une animation. `rotate(true)` retourne l'image de 180°, `invert(true)` inverse l'écran, `powerOff()` et `powerOn()` l'éteignent et le rallument.

L'exemple [Drawing](./exemples/steami-board#drawing) dessine une galerie de formes avec cette classe.

### Les couleurs

Les couleurs sont des valeurs `SteamiRgb`. Sur une V1c, elles s'affichent telles quelles ; sur une V1a ou une V1b, chacune devient l'un des 16 niveaux de gris de l'écran, de 0 (noir) à 15 (blanc), d'après sa luminosité. La bibliothèque en nomme dix :

| Constante          | Rouge, vert, bleu | Niveau de gris (V1a, V1b) |
| ------------------ | ----------------- | :-----------------------: |
| `STEAMI_BLACK`     | 0, 0, 0           |             0             |
| `STEAMI_GRID_DARK` | 51, 51, 51        |             3             |
| `STEAMI_DARK`      | 102, 102, 102     |             6             |
| `STEAMI_BLUE`      | 85, 85, 255       |             6             |
| `STEAMI_RED`       | 255, 85, 85       |             8             |
| `STEAMI_GRAY`      | 153, 153, 153     |             9             |
| `STEAMI_LIGHT`     | 187, 187, 187     |            11             |
| `STEAMI_GREEN`     | 119, 255, 119     |            12             |
| `STEAMI_YELLOW`    | 255, 255, 85      |            14             |
| `STEAMI_WHITE`     | 255, 255, 255     |            15             |

Une autre couleur s'écrit avec ses trois composantes, de 0 à 255 : `SteamiRgb orange(255, 128, 0);`, ou `{255, 128, 0}` partout où une couleur est attendue. `SteamiRgb::gray(8)` donne un niveau de gris, de 0 à 15. Un nombre seul n'est pas une couleur : écrire `SteamiRgb::gray(15)`, et non `15`.

Les fonctions de dessin ne corrigent jamais une couleur : sur l'écran en niveaux de gris, `STEAMI_BLUE` sur `STEAMI_DARK` est invisible, puisque les deux donnent le niveau 6. Les widgets de `SteamiScreen`, eux, éclaircissent au besoin la partie remplie d'une barre ou d'une jauge et l'élément sélectionné d'un menu, pour qu'ils restent au moins 4 niveaux au-dessus de leur fond.

### Le texte

`text(texte, x, y, couleur)` écrit un texte dont le coin en haut à gauche du premier caractère est `(x, y)`. Le texte n'est coupé que par les bords de l'écran, pas par le cercle. La police dépend de l'écran :

- sur une V1a ou une V1b, des caractères de 8 × 8 pixels, sans les accents : `é` s'affiche `e` ;
- sur une V1c, depuis la version 0.40.0, la police Spleen, en caractères de 8 pixels de large et 16 de haut, avec les lettres accentuées.

`°` est dessiné sur les deux écrans. Les lettres accentuées du français (`à`, `â`, `ç`, `é`, `è`, `ê`, `ë`, `î`, `ï`, `ô`, `ù`, `û`, `ü`, `ÿ`, ainsi que `ä` et `ö`) et leurs majuscules sont dessinées sur une V1c et ramenées à la lettre simple sur une V1a ou une V1b. Tout autre caractère s'affiche `?`.

Un dernier argument facultatif, l'échelle (1 par défaut), agrandit le texte autant de fois. `textWidth(texte)` donne la largeur d'un texte en pixels, la même sur les deux écrans : 8 pixels par caractère à l'échelle 1, en comptant les caractères et non les octets (`é` occupe deux octets mais un seul caractère). `textHeight()` donne la hauteur d'une ligne : 8 pixels sur une V1a ou une V1b, 16 sur une V1c, fois l'échelle. Le programme ci-dessus s'en sert pour centrer le texte. Pour empiler des lignes, `textHeight()` remplace une hauteur écrite en dur, qui ne serait juste que sur un des deux écrans :

```cpp
const int16_t h = ecran.textHeight();      // 8 sur une V1a ou une V1b, 16 sur une V1c
ecran.text("Ligne 1", 20, 50);
ecran.text("Ligne 2", 20, 50 + h);         // juste en dessous, sur les deux écrans
```

`SteamiDisplay::CHAR_H`, qui vaut 8, ne donne la hauteur d'une ligne que sur l'écran de 128 pixels : depuis la version 0.40.0, utiliser `textHeight()`, qui demande cette version.

### Si l'écran ne démarre pas

Si `begin()` échoue, la bibliothèque écrit un message codé dans le moniteur série (voir [Les messages](./carte#les-messages)), `error()` le résume, et les fonctions de dessin et `show()` ne font plus rien :

- `E30`, quand la release reste inconnue : `[STeaMi] SteamiDisplay: cannot tell if this board is a V1a/V1b or a V1c. Add #define STEAMI_BOARD_V1C (or V1B) before #include <STeaMi.h>. (E30)`, et `error()` vaut `unknown board`. Forcer alors la release (voir [Forcer la release](./carte#forcer-la-release)).
- `E31`, sur une V1c, quand l'image de l'écran couleur ne trouve pas 115 200 octets de mémoire vive d'un seul bloc : `[STeaMi] SteamiDisplay: not enough RAM for the colour screen (115200 bytes in one block). Call screen.begin() first in setup(). (E31)`, et `error()` vaut `no memory`. Une V1a ou une V1b, dont l'image ne fait que 8 192 octets, n'écrit jamais ce message.

C'est pourquoi `begin()` s'appelle au tout début de `setup()`, tant que la mémoire est encore libre, et jamais dans l'initialisation d'une variable globale. Si le programme dessine sans avoir appelé `begin()`, le premier dessin démarre l'écran. Avec `SteamiScreen`, les messages commencent par `SteamiScreen:` au lieu de `SteamiDisplay:`.

## Mettre en page avec SteamiScreen

Pour afficher une mesure sans calculer de coordonnées, `SteamiScreen` place elle-même le texte sur l'écran rond :

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranHumidite/EcranHumidite.ino

```

<EssayerExemple id="ECRAN/EcranHumidite" source="sample" />

`SteamiScreen` demande la version 0.38.0 de la bibliothèque. C'est une `SteamiDisplay` : `begin()`, `clear()`, `show()`, `error()`, les couleurs, le texte et les fonctions de dessin ci-dessus restent disponibles. Chaque tour de `loop()` refait toute l'image : `clear()` la remplit de noir, les fonctions dessinent dans l'ordre des appels, et un dessin plus tardif passe par-dessus les précédents, puis `show()` envoie l'image.

Elle ajoute des fonctions qui calculent leur place à partir de la taille de l'écran :

- `title(texte)` écrit une ligne en haut, en gris (`STEAMI_GRAY`) par défaut ; un titre de 11 caractères au plus reste tout en haut ;
- `subtitle(ligne1, ligne2, ligne3)` écrit une à trois lignes en bas, en gris foncé (`STEAMI_DARK`) par défaut ;
- `value(v, unité)` écrit un nombre en grands chiffres blancs, avec son unité en dessous ; un `float` s'écrit avec un chiffre après le point (`setDecimals()` en change le nombre, 4 au plus), un entier sans décimale, et `NAN` s'écrit `--` ;
- `bar(v, max)` trace une barre horizontale sous le centre, remplie de la gauche en proportion de `v / max` (100 par défaut), vide pour `NAN` ;
- `text(texte, position)` écrit un texte à une position de l'écran, coupé à ce qui tient dans le cercle.

La position est l'une des neuf constantes `SteamiAt` : `CENTER` et les points cardinaux `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`, le nord en haut. `value()` l'accepte aussi, avec une étiquette en petites lettres au-dessus : `value(t, "°C", SteamiAt::W, "TEMP")` place une température à gauche ; deux valeurs côte à côte, à `W` et `E`, gardent la même taille. Chaque fonction accepte une couleur en argument facultatif, comme `title("Pression", STEAMI_YELLOW)` ou `bar(h, 100, STEAMI_GREEN)`.

Positions et marges sont données pour l'écran de 128 pixels et agrandies dans le rapport 240/128 sur celui de la V1c, où le texte est deux fois plus haut : le même programme donne la même image sur les deux écrans. `maxChars()` donne le nombre de caractères qui tiennent sur toute la largeur de l'écran : 16 sur une V1a ou une V1b, 30 sur une V1c ; sur l'écran rond, seule la ligne du milieu est aussi large. Aucun texte ne sort du cercle : une valeur trop large passe à des chiffres plus petits, un texte trop long est coupé, sans points de suspension.

Les exemples [ScreenTemperature](./exemples/steami-board#screentemperature), [ScreenBattery](./exemples/steami-board#screenbattery) et [ScreenComfort](./exemples/steami-board#screencomfort) affichent ainsi une température, la charge de la batterie avec une barre, et deux valeurs côte à côte.

## Les widgets

Depuis la version 0.40.0 de la bibliothèque, `SteamiScreen` dessine des widgets à la mesure de l'écran rond : une jauge, une boussole, une montre et des visages. La version 0.41.0 y ajoute un graphe et un menu. Ils se dessinent eux aussi entre `clear()` et `show()`, dans l'ordre des appels.

### Jauge

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranJauge/EcranJauge.ino

```

<EssayerExemple id="ECRAN/EcranJauge" source="sample" />

`gauge(v, min, max)` trace un anneau de 270° près du bord, ouvert en bas, sur un fond gris foncé (`STEAMI_DARK`). Il se remplit depuis le bas à gauche, dans le sens des aiguilles d'une montre, en proportion de `v` entre `min` et `max`, et les deux bornes s'écrivent en petits chiffres à ses deux bouts. Une valeur hors des bornes est ramenée à la plus proche ; `NAN` laisse l'anneau vide ; avec `min` plus grand que `max`, l'anneau se remplit quand la valeur baisse. La couleur du remplissage, gris clair (`STEAMI_LIGHT`) par défaut, vient en quatrième argument ; un cinquième argument facultatif donne l'épaisseur de l'anneau, en pixels de l'écran utilisé (7 sur l'écran de 128, 13 sur celui de 240 par défaut).

`gauge()` n'écrit ni la valeur ni son unité : appeler `value()` après lui, pour que le texte passe par-dessus l'anneau. Exemple à essayer : [ScreenGauge](./exemples/steami-board#screengauge).

### Boussole

```cpp
ecran.clear();
ecran.compass(boussole.heading());    // boussole est une SteamiCompass
ecran.show();
```

`compass(cap)` dessine une rose des vents qui remplit l'écran : deux cercles, huit graduations, les lettres `N`, en blanc, `E`, `S` et `W`, en gris, et une aiguille. Le cap est la direction vers laquelle pointe le haut de l'écran, en degrés comptés depuis le nord dans le sens des aiguilles d'une montre, comme le donne `heading()` de `SteamiCompass` (voir [Boussole](./capteurs#boussole--magnétomètre)). Toute la rose tourne pour que `N` et l'aiguille montrent le nord, et les lettres restent droites : à un cap de 90°, le haut de l'écran vers l'est, `N` est à gauche. `NAN`, que `heading()` renvoie quand le capteur manque, dessine la rose sans aiguille. Un second argument change la couleur de la moitié nord de l'aiguille.

Le cap n'est juste qu'avec un magnétomètre calibré et une carte tenue à plat (voir [Calibrations](./carte#calibrations)). Exemple à essayer : [ScreenCompass](./exemples/steami-board#screencompass).

### Montre

```cpp
const uint32_t DEPART = 14 * 3600UL + 30 * 60;   // 14:30:00, l'heure du démarrage

void loop() {
  uint32_t s = DEPART + millis() / 1000;          // secondes depuis minuit
  ecran.clear();
  ecran.watch((s / 3600) % 24, (s / 60) % 60, s % 60);
  ecran.show();
  delay(500);
}
```

`watch(h, m, s)` dessine une montre à aiguilles : un cadran à douze graduations, les chiffres 12, 3, 6 et 9, les aiguilles des heures et des minutes, gris clair par défaut, et une trotteuse grise. Les heures vont de 0 à 23, les minutes et les secondes de 0 à 59. La carte n'a pas d'horloge qui garde l'heure : le programme part d'une heure écrite à la main et compte les secondes avec `millis()`, depuis le démarrage de la carte. Exemple à essayer : [ScreenWatch](./exemples/steami-board#screenwatch).

### Visages

```cpp
const uint8_t SOURIRE[8] = {0x00, 0x24, 0x24, 0x00, 0x00, 0x42, 0x3C, 0x00};

ecran.clear();
ecran.face(SteamiFace::LOVE, STEAMI_RED);   // un des six visages intégrés, en rouge
// ou : ecran.face(SOURIRE);                // un dessin personnel
ecran.show();
```

`face()` dessine un visage en pixel art, centré : une grille de 8 × 8 carrés pleins, gris clair (`STEAMI_LIGHT`) par défaut. `SteamiFace` nomme six visages intégrés : `HAPPY`, `SAD`, `SURPRISED`, `SLEEPING`, `ANGRY` et `LOVE` (un cœur). Un dessin personnel est un tableau de 8 octets, un par ligne de haut en bas, dont chaque bit allume un carré, le bit de poids fort (`0x80`) à gauche : `SOURIRE` ci-dessus est le visage `HAPPY`. Avec `true` en second argument, `face(SteamiFace::HAPPY, true)` dessine un visage plus petit et un peu remonté, qui laisse la place à un titre et à un sous-titre. Exemple à essayer : [ScreenFaces](./exemples/steami-board#screenfaces).

### Graphe et historique

Depuis la version 0.41.0 de la bibliothèque, `graph()` trace la courbe des dernières mesures. Ce programme montre la pression des 30 dernières secondes :

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranGraphe/EcranGraphe.ino

```

<EssayerExemple id="ECRAN/EcranGraphe" source="sample" />

`SteamiHistory<N>` garde les `N` dernières valeurs dans la mémoire du programme, sans allocation dynamique : 4 octets par valeur, plus 4. `add(v)` ajoute la plus récente ; une fois `N` valeurs gardées, chaque ajout fait oublier la plus ancienne. `size()` donne le nombre de valeurs gardées, `last()` la plus récente, `historique[0]` la plus ancienne, et `clear()` vide l'historique.

`graph(historique, min, max)` dessine un cadre, avec un axe à gauche et un axe en bas, les bornes `max` en haut et `min` en bas, à l'intérieur du cadre, et une ligne pointillée au milieu. La courbe va de la plus ancienne valeur, à gauche, à la plus récente, à droite : elle avance vers la gauche à chaque mesure. Une valeur `NAN` laisse un trou, et une valeur hors des bornes reste sur le bord du cadre. Tant que l'historique n'est pas plein, la courbe s'étale déjà sur toute la largeur ; avec moins de 2 valeurs, le cadre s'affiche sans courbe. `graph()` écrit aussi la partie entière de la dernière valeur au-dessus du cadre (`--` quand elle manque) : il ne faut pas y ajouter de `value()`. Un quatrième argument change la couleur de la courbe, et `graph(tableau, n, min, max)` trace de la même façon les `n` valeurs d'un tableau de `float`, la plus ancienne en premier.

Exemples à essayer : [ScreenGraph](./exemples/steami-board#screengraph), et la page Pressure de [WeatherStation](./exemples/steami-board#weatherstation).

### Menu

Depuis la version 0.41.0 de la bibliothèque, `menu()` affiche une liste dans laquelle le D-PAD déplace la sélection :

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranMenu/EcranMenu.ino

```

<EssayerExemple id="ECRAN/EcranMenu" source="sample" />

`menu(ELEMENTS, choix)` écrit les éléments un par ligne, centrés, en gris ; l'élément sélectionné s'écrit en blanc, précédé de `>`, sur une barre gris foncé dont les bouts suivent le cercle. L'écran de 128 pixels montre 5 lignes, celui de 240 en montre 6 : une liste plus longue défile pour garder la sélection visible. Un élément trop large est coupé.

Le programme ne teste pas les bornes : `menu()` ramène l'indice dans la liste et le renvoie, `-1` devenant le dernier élément et le nombre d'éléments le premier. D'où l'affectation du programme, qui range l'indice corrigé dans `choix` à chaque tour. Garder l'indice dans un `int` : avec un `unsigned`, un `long` ou un `size_t`, le compilateur choisit l'autre forme de `menu()`, `menu(tableau, n, indice)`, qui prend le nombre d'éléments en deuxième argument, et le menu se trompe. Un troisième argument change la couleur de l'élément sélectionné.

`menu()` ne fait que déplacer la sélection : pour ouvrir l'élément choisi, tester `choix` quand un autre bouton, par exemple A, est appuyé. Exemples à essayer : [ScreenMenu](./exemples/steami-board#screenmenu), et [WeatherStation](./exemples/steami-board#weatherstation), qui réunit plusieurs widgets sur quatre pages que le D-PAD fait défiler.

## De MicroPython à Arduino

Les widgets de `SteamiScreen` reprennent ceux de la [bibliothèque MicroPython de la STeaMi](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen), avec les mêmes noms et les mêmes rôles. Seule l'écriture change :

| MicroPython                                               | Arduino                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `screen = Screen(display)`                                | `SteamiScreen screen;` puis `screen.begin();` au début de `setup()`     |
| `screen.value(v, unit="%", at="W", label="HUM", color=C)` | `screen.value(v, "%", SteamiAt::W, "HUM", C)`                           |
| `screen.subtitle("a", "b", color=C)`                      | `screen.subtitle("a", "b", C)` (trois lignes au plus)                   |
| `screen.bar(v, max_val=100, color=C)`                     | `screen.bar(v, 100, C)`                                                 |
| `screen.text("x", at="NE", scale=2)`                      | `screen.text("x", SteamiAt::NE, STEAMI_WHITE, 2)`                       |
| `screen.gauge(v, min_val, max_val, color=C)`              | `screen.gauge(v, min, max, C)`                                          |
| `screen.graph(data, min_val, max_val)`                    | `screen.graph(historique, min, max)` avec un `SteamiHistory<N>`         |
| `screen.menu(items, selected=i)`                          | `i = screen.menu(ITEMS, i);` (taille du tableau déduite, indice ramené) |
| `screen.face("happy", color=C)`                           | `screen.face(SteamiFace::HAPPY, C)`                                     |
| `"N"`, `"NE"`… `"CENTER"` ; `BLACK`… `YELLOW`             | `SteamiAt::N`… `SteamiAt::CENTER` ; `STEAMI_BLACK`… `STEAMI_YELLOW`     |
| `screen.center`, `screen.radius`, `screen.width`          | `centerX()`, `centerY()`, `radius()`, `width()`                         |

## Avec les drivers SSD1327 et GC9A01

Le driver de l'écran de chaque release offre ce que la classe n'a pas, comme les 16 niveaux de gris en valeurs brutes ou les couleurs RGB565 du GC9A01. Il ne marche que sur une carte qui a cet écran.

<ReleaseTabs>
<Release releases="v1a v1b">

Écran OLED rond 128 × 128, 16 niveaux de gris (contrôleur SSD1327). Driver : bibliothèque STeaMi.

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranDriverSsd1327/EcranDriverSsd1327.ino

```

<EssayerExemple id="ECRAN/EcranDriverSsd1327" source="sample" />

Le dessin se fait en mémoire (`fill`, `pixel`, `line`, `fillRect`, `text`) ; rien n'apparaît avant l'appel à `show()`. Les couleurs vont de `0` (noir) à `15` (blanc).

Exemples à essayer sur la carte : [Exemples SSD1327](./exemples/ssd1327).

</Release>
<Release releases="v1c">

Écran TFT rond 240 × 240 en couleur (contrôleur GC9A01). Driver : bibliothèque STeaMi.

```cpp file=.external/arduino-steami-sample/examples/ECRAN/EcranDriverGc9a01/EcranDriverGc9a01.ino

```

<EssayerExemple id="ECRAN/EcranDriverGc9a01" source="sample" />

Le dessin se fait en mémoire, avec les mêmes fonctions que l'écran des V1a et V1b (`fill`, `pixel`, `line`, `fillRect`, `text`) ; rien n'apparaît avant l'appel à `show()`. Les couleurs sont au format RGB565 : constantes `GC9A01_RED`, `GC9A01_BLUE`, `GC9A01_YELLOW`…, ou `SteamiGC9A01::color565(r, g, b)` à partir de valeurs de 0 à 255.

`text(texte, x, y, couleur)` écrit avec une petite police de 5 × 7 pixels, 6 pixels par caractère, sans option de taille ; `(x, y)` est le coin en haut à gauche de la première lettre. Les lettres accentuées ne s'affichent pas.

L'écran est rond : les coins de l'image ne s'affichent pas. Le plus grand carré entièrement visible va de `(36, 36)` à `(203, 203)`.

L'image occupe 115 200 octets de mémoire vive, plus de la moitié de celle disponible pour un programme. Cette mémoire est réservée par `begin()` pendant l'exécution : le rapport de compilation de l'IDE ne la compte pas. Si l'écran reste noir dans un programme plus gros, c'est que la mémoire manque.

Les exemples **STeaMi → GC9A01** reprennent ceux de l'écran des V1a et V1b, en couleur (**color_palette**, **rotating_3d_cube**…).

Exemples à essayer sur la carte : [Exemples GC9A01](./exemples/gc9a01).

</Release>
</ReleaseTabs>

## Voir aussi

- [Capteurs](./capteurs) : un programme minimal pour chaque capteur de la carte.
- [Reconnaître la carte](./carte) : la reconnaissance de la release, les calibrations et les messages.
- [Exemples STEAMI_BOARD](./exemples/steami-board) : les exemples de `SteamiDisplay` et `SteamiScreen`, avec une photo de l'écran.
- [Les écrans de la carte](/docs/hardware/main-components/display) : le matériel des deux écrans.
