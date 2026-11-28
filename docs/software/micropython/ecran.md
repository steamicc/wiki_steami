---
title: Écran
sidebar_position: 5.2
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore blit framebuf viper -->

# Écran

L'écran rond de la STeaMi change avec la release (voir [Les écrans de la carte](/docs/hardware/main-components/display) et [Révisions](/docs/hardware/revisions)) : un OLED de 128 × 128 pixels en 16 niveaux de gris (contrôleur SSD1327) sur une V1a ou une V1b, un TFT couleur de 240 × 240 pixels (contrôleur GC9A01) sur une V1c. En MicroPython, la classe `Screen` du paquet [`steami`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami) reconnaît la release et pilote l'écran de la carte : le même programme dessine la même image sur les deux écrans, mise à l'échelle.

`steami.Screen` offre toute l'interface de la bibliothèque [`steami_screen`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen) : des formes et du texte en pixels, et des widgets qui se placent seuls sur l'écran rond (titre, valeur, barre, jauge, graphe, menu, boussole, montre, visages). Les drivers `ssd1327` et `gc9a01`, présentés [en fin de page](#avec-les-drivers-ssd1327-et-gc9a01), ne servent que pour ce que la classe n'offre pas.

Les programmes de cette page demandent un firmware MicroPython v0.31.0 ou plus récent : avant cette version, `text_height()` n'existe pas et le texte de la V1c n'a pas d'accents. Le bouton **Essayer sur la carte** propose au besoin d'installer la version suivie par le wiki (voir [Essayer le code sur la carte](./essayer)). Ce qui change sur une V1c, en particulier la police du texte, est résumé dans la section [Sur une V1c](./essayer#sur-une-v1c) de la page Essayer : cette page-ci ne le reprend que là où il change un programme.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Premier programme

```python run
from steami import Screen

screen = Screen()
screen.begin()  # réserve l'image en mémoire, au début du programme

screen.clear()
screen.title("STeaMi")
screen.value(21.5, unit="°C", label="TEMP")
screen.subtitle("Bonjour !")
screen.show()
```

`Screen()` ne touche pas au matériel. `begin()` reconnaît la release, démarre l'écran et réserve en mémoire vive l'image dans laquelle le programme dessine ; si le programme ne l'appelle pas, le premier dessin le fait. Toutes les instances de `Screen` dessinent sur le même écran.

Le dessin se fait dans cette image, et rien n'apparaît avant l'appel à `show()`, qui l'envoie en entier à l'écran. Ce qui dépasse de l'écran est coupé, sans erreur. `clear()` remplit l'image de noir, ou d'une autre couleur passée en argument, et les fonctions dessinent dans l'ordre des appels : un dessin plus tardif passe par-dessus les précédents.

### Si l'écran ne démarre pas

`begin()` renvoie `True` quand l'écran est prêt. Sinon, la bibliothèque écrit un message codé dans la console, `error()` le résume, et les fonctions de dessin et `show()` ne font plus rien, sans erreur Python :

- `E30`, quand la release reste inconnue : `error()` vaut `"unknown board"`. Forcer alors la release au début du programme avec `Steami.begin("V1c")` (ou `"V1b"`), après `from steami import Steami`.
- `E31`, quand l'image ne trouve pas assez de mémoire vive d'un seul bloc : 28 800 octets sur une V1c, 8 192 sur une V1a ou une V1b. `error()` vaut `"no memory"`.

C'est pourquoi `begin()` s'appelle au tout début du programme, avant que la mémoire ne soit morcelée par d'autres objets.

```python
from steami import Screen

screen = Screen()
if not screen.begin():
    print("Écran indisponible :", screen.error())
print("Écran :", screen.chip())  # GC9A01 sur une V1c, SSD1327 sur une V1a ou une V1b
```

## Coordonnées et mise à l'échelle

`(0, 0)` est le coin en haut à gauche de l'image, `x` va vers la droite et `y` vers le bas. Les propriétés de `Screen` donnent la géométrie de l'écran de la carte :

| Propriété                       | V1a, V1b (128 px) | V1c (240 px) |
| ------------------------------- | :---------------: | :----------: |
| `screen.width`, `screen.height` |        128        |     240      |
| `screen.center`                 |     (64, 64)      |  (120, 120)  |
| `screen.radius`                 |        64         |     120      |
| `screen.k`                      |         1         |      2       |
| `screen.u(56)`                  |        56         |     105      |

Les widgets et le texte placé à une position cardinale sont conçus pour l'écran de 128 pixels et agrandis sur celui de 240 : leurs traits et leurs caractères le sont par le facteur `screen.k`, leurs positions dans le rapport 240/128. Les formes et le texte placé en `(x, y)` prennent, eux, des pixels réels. Pour qu'un dessin garde les mêmes proportions sur les deux écrans, placer les formes à partir de `center` et de `radius`, ou convertir une longueur donnée pour l'écran de 128 pixels avec `screen.u(v)` (`v × largeur / 128`, arrondi vers zéro).

### Les formes

```python run
from steami import Screen
from steami_screen import BLUE, DARK, GREEN, WHITE, YELLOW

screen = Screen()
screen.begin()
cx, cy = screen.center  # (64, 64) sur une V1a ou une V1b, (120, 120) sur une V1c
r = screen.radius  # 64 ou 120

screen.clear()
screen.circle(cx, cy, r - 1, DARK)  # le bord de l'écran rond
screen.line(cx - r, cy, cx + r, cy, GREEN)  # diamètre horizontal
screen.line(cx, cy - r, cx, cy + r, GREEN)  # diamètre vertical
screen.rect(cx - r // 2, cy - r // 2, r, r, BLUE)  # carré autour du centre
screen.circle(cx, cy, r // 4, YELLOW, fill=True)  # disque plein au centre
screen.rect(cx + r // 2, cy + r // 4, r // 4, r // 4, WHITE, fill=True)
screen.pixel(cx - r // 2 - 4, cy - r // 2 - 4, WHITE)
screen.show()
```

Les fonctions de dessin, en pixels réels :

- `pixel(x, y, couleur)` allume un pixel ;
- `line(x1, y1, x2, y2, couleur)` trace un segment ;
- `rect(x, y, w, h, couleur)` trace le contour d'un rectangle de `w` × `h` pixels, et un rectangle plein avec `fill=True` ;
- `circle(cx, cy, r, couleur)` trace un cercle, et un disque avec `fill=True` ;
- `text(texte, at=(x, y))` écrit un texte (voir [Le texte](#le-texte)).

La couleur est facultative : blanc par défaut. L'écran est rond : les coins de l'image ne s'affichent pas.

## Le texte

```python run
from steami import Screen
from steami_screen import GRAY, YELLOW

screen = Screen()
screen.begin()
cx, cy = screen.center
h1 = screen.text_height()  # 8 sur une V1a ou une V1b, 16 sur une V1c
h2 = screen.text_height(2)  # la hauteur d'une ligne à l'échelle 2

# Trois lignes centrées : deux à l'échelle 1, une à l'échelle 2
lignes = [("Lundi", 1), ("Été", 1), ("23°C", 2)]
y = cy - (2 * h1 + h2) // 2

screen.clear()
for ligne, echelle in lignes:
    largeur = len(ligne) * 8 * echelle  # 8 pixels par caractère et par échelle
    screen.text(ligne, at=(cx - largeur // 2, y), scale=echelle)
    y += screen.text_height(echelle)
screen.text("Nord", at="N", color=YELLOW)  # positions cardinales
screen.text("Sud", at="S", color=GRAY)
screen.show()
print("Caractères par ligne :", screen.max_chars)
```

`text(texte, at, color, scale)` écrit un texte, blanc à l'échelle 1 par défaut. `at` prend deux formes :

- un couple `(x, y)`, en pixels réels : le coin en haut à gauche du premier caractère ;
- une position cardinale de l'écran rond : `"CENTER"` (par défaut) ou `"N"`, `"NE"`, `"E"`, `"SE"`, `"S"`, `"SW"`, `"W"`, `"NW"`, le nord en haut. Le texte y est agrandi par `screen.k` et centré ; sur une V1c, un texte trop long pour le cercle est coupé.

La police dépend de l'écran : des caractères de 8 × 8 pixels sur une V1a ou une V1b, la police Spleen de 8 × 16 pixels sur une V1c, chacun multiplié par `scale`. Un caractère garde donc 8 pixels de large sur les deux écrans, mais pas la même hauteur :

- `len(texte) * 8 * scale` donne la largeur d'un texte, la même sur les deux écrans : la bibliothèque n'a pas de fonction pour la calculer ;
- `screen.text_height(scale)` donne la hauteur d'une ligne : 8 × `scale` sur une V1a ou une V1b, 16 × `scale` sur une V1c. Pour empiler des lignes, s'en servir plutôt que d'un pas écrit en dur, qui ne serait juste que sur un des deux écrans ;
- `screen.max_chars` donne le nombre de caractères qui tiennent dans la largeur à l'échelle 1 : 16 sur une V1a ou une V1b, 30 sur une V1c. Sur l'écran rond, seule la ligne du milieu est aussi large.

Les lettres accentuées du français et le signe `°` s'affichent sur une V1c ; sur une V1a ou une V1b, une lettre accentuée devient sa lettre de base (`Été` s'affiche `Ete`) et `°` un petit rond. La section [Sur une V1c](./essayer#sur-une-v1c) de la page Essayer détaille ces différences, avec les autres caractères.

## Les couleurs

```python run
from steami import Screen
from steami_screen import BLUE, DARK, GRAY, GREEN, LIGHT, RED, WHITE, YELLOW

ORANGE = (255, 165, 0)  # une couleur de la palette de la V1c, sans constante
couleurs = [WHITE, LIGHT, GRAY, DARK, RED, GREEN, BLUE, YELLOW, ORANGE]

screen = Screen()
screen.begin()
cx, cy = screen.center
bande = screen.u(10)  # 10 pixels sur l'écran de 128, 18 sur celui de 240
haut = cy - len(couleurs) * bande // 2

screen.clear()
for i, couleur in enumerate(couleurs):
    screen.rect(0, haut + i * bande, screen.width, bande, couleur, fill=True)
screen.show()
```

Une couleur est un triplet `(rouge, vert, bleu)` de valeurs de 0 à 255. `steami_screen` en nomme neuf :

| Constante | Rouge, vert, bleu | Niveau de gris (V1a, V1b) |
| --------- | ----------------- | :-----------------------: |
| `BLACK`   | 0, 0, 0           |             0             |
| `DARK`    | 102, 102, 102     |             6             |
| `BLUE`    | 85, 85, 255       |             6             |
| `RED`     | 255, 85, 85       |             8             |
| `GRAY`    | 153, 153, 153     |             9             |
| `LIGHT`   | 187, 187, 187     |            11             |
| `GREEN`   | 119, 255, 119     |            12             |
| `YELLOW`  | 255, 255, 85      |            14             |
| `WHITE`   | 255, 255, 255     |            15             |

L'écran ne les affiche pas de la même façon selon la release :

<ReleaseTabs>
<Release releases="v1a v1b">

Chaque couleur devient l'un des 16 niveaux de gris de l'écran, de 0 (noir) à 15 (blanc), d'après sa luminosité. Deux couleurs peuvent donner le même niveau : `BLUE` sur `DARK` est invisible, puisque les deux donnent le niveau 6.

</Release>
<Release releases="v1c">

L'image de l'écran couleur tient en 28 800 octets parce que chaque pixel y est l'une des 16 couleurs d'une palette fixe : une image de 115 200 octets en couleurs complètes ne tiendrait pas en mémoire à côté du Bluetooth. Les neuf constantes sont dans cette palette, avec `(51, 51, 51)`, un gris très sombre, et six autres couleurs : cyan `(85, 255, 255)`, magenta `(255, 85, 255)`, orange `(255, 165, 0)`, vert foncé `(0, 128, 0)`, rouge foncé `(128, 0, 0)` et bleu foncé `(0, 0, 128)`.

Une autre couleur s'affiche comme la couleur la plus proche de la palette, ce qui peut surprendre : `(0, 255, 0)` est plus proche du vert foncé `(0, 128, 0)` que de `GREEN`, et s'affiche donc en vert foncé. Pour une couleur exacte, utiliser les constantes ou les triplets de la palette.

</Release>
</ReleaseTabs>

Les fonctions de dessin ne corrigent jamais une couleur. Les widgets, eux, éclaircissent au besoin la partie remplie d'une barre ou d'une jauge et l'élément sélectionné d'un menu, pour qu'ils restent visibles sur leur fond en niveaux de gris.

## Les widgets

Les widgets calculent leur place à partir de la taille de l'écran : le même appel donne la même image sur les deux écrans. Ils se dessinent eux aussi entre `clear()` et `show()`, dans l'ordre des appels. Chacun accepte une couleur en argument facultatif `color=`.

### Titre, valeur et barre

```python file=.external/micropython-steami-lib/lib/steami_screen/examples/comfort_bar_demo.py

```

Ce programme affiche la température de la carte, lue par `steami.Temperature` (BME280 sur une V1c, WSEN-HIDS sur une V1a ou une V1b), avec une barre qui se remplit jusqu'à 40 °C.

- `title(texte)` écrit une ligne en haut, en gris (`GRAY`) par défaut ;
- `subtitle(ligne1, ligne2, …)` écrit une ou plusieurs lignes en bas, en gris foncé (`DARK`) par défaut ;
- `value(v, unit=…, label=…)` écrit une valeur en grands chiffres blancs, avec son unité en dessous et une étiquette en petites lettres au-dessus. Un `float` qui vaut `nan` ou qui est trop grand s'écrit `--`. `at="W"` ou `at="E"` place la valeur à gauche ou à droite, pour en afficher deux côte à côte ; `scale` (2 par défaut) règle la taille des chiffres ; sur une V1c, elle diminue d'elle-même quand la valeur est trop large ;
- `bar(v, max_val=100)` trace une barre horizontale sous le centre, remplie de la gauche en proportion de `v / max_val`, vide pour `nan` ou une valeur négative. `y_offset`, en pixels de l'écran de 128, la déplace vers le bas, ou vers le haut s'il est négatif.

D'autres exemples de la bibliothèque utilisent ces widgets : [hello_world.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/examples/hello_world.py), un compteur, et [station_env.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/examples/station_env.py), une station de température, d'humidité et de pression.

### Jauge

```python run
from time import sleep_ms

from steami import Distance, Screen

screen = Screen()
screen.begin()
distance = Distance()

while True:
    mm = distance.read()  # -1 quand aucune cible n'est vue
    screen.clear()
    screen.gauge(mm, min_val=0, max_val=1000)  # d'abord la jauge...
    screen.value(mm if mm >= 0 else "--", unit="mm")  # ... puis le texte par-dessus
    screen.title("Distance")
    screen.show()
    sleep_ms(100)
```

`gauge(v, min_val=0, max_val=100)` trace un anneau de 270° près du bord, ouvert en bas, sur un fond gris foncé. Il se remplit depuis le bas à gauche, dans le sens des aiguilles d'une montre, en proportion de `v` entre `min_val` et `max_val`, et les deux bornes s'écrivent en petits chiffres à ses deux bouts. Une valeur hors des bornes est ramenée à la plus proche, et `nan` laisse l'anneau vide. `arc_width` règle l'épaisseur de l'anneau, en pixels réels.

`gauge()` n'écrit ni la valeur ni son unité : appeler `value()` et `title()` après lui, pour que le texte passe par-dessus l'anneau. L'exemple [gauge_demo.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/examples/gauge_demo.py) change la couleur et l'épaisseur de la jauge selon la distance.

### Graphe

```python run
from time import sleep_ms

from steami import Distance, Screen

screen = Screen()
screen.begin()
distance = Distance()
mesures = []

while True:
    mm = distance.read()  # -1 quand aucune cible n'est vue
    if mm >= 0:
        mesures.append(mm)
        if len(mesures) > 30:
            mesures.pop(0)  # garde les 30 dernières mesures
    screen.clear()
    screen.graph(mesures, min_val=0, max_val=1000)
    screen.subtitle("Distance")
    screen.show()
    sleep_ms(500)
```

`graph(liste, min_val=0, max_val=100)` dessine un cadre avec ses bornes et une ligne pointillée au milieu, puis la courbe des valeurs de la liste, de la plus ancienne, à gauche, à la plus récente, à droite. Une valeur `nan` laisse un trou ; avec moins de deux valeurs, le cadre s'affiche sans courbe. Le programme garde lui-même la liste des dernières mesures : `pop(0)` fait oublier la plus ancienne.

`graph()` écrit aussi la partie entière de la dernière valeur au-dessus du cadre (`--` quand la liste est vide) : ne pas y ajouter de `value()`. Sur l'écran de 128 pixels, un `title()` chevauche cette valeur : mettre la légende en bas, avec `subtitle()`.

### Menu

```python run
from time import sleep_ms

from steami import Screen

screen = Screen()
screen.begin()

elements = ["Accueil", "Mesures", "Graphe", "Boussole", "Montre", "Réglages", "À propos"]
choix = 0

while True:
    screen.clear()
    screen.menu(elements, selected=choix)
    screen.show()
    choix = (choix + 1) % len(elements)  # l'indice reste dans la liste
    sleep_ms(800)
```

`menu(liste, selected=i)` écrit les éléments un par ligne, en gris ; l'élément d'indice `i` s'écrit en blanc, précédé de `>`, sur une barre gris foncé. L'écran de 128 pixels montre 6 lignes, celui de 240 en montre 5 : une liste plus longue défile pour garder la sélection visible. `menu()` ne vérifie pas l'indice : le programme le garde lui-même entre 0 et `len(liste) - 1`, comme le fait ici le `%`.

Ce programme fait défiler la sélection tout seul. Pour la déplacer avec le D-PAD de la carte, voir l'exemple [ddap_menu.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/examples/ddap_menu.py).

### Boussole

```python run
from time import sleep_ms

from steami import Compass, Screen

screen = Screen()
screen.begin()
boussole = Compass()

while True:
    cap = boussole.heading()  # nan quand le magnétomètre ne répond pas
    screen.clear()
    screen.compass(cap)
    screen.show()
    sleep_ms(100)
```

`compass(cap)` dessine une rose des vents qui remplit l'écran, avec les lettres `N`, `E`, `S` et `W` et une aiguille. Le cap est la direction vers laquelle pointe le haut de l'écran, du côté du connecteur USB, en degrés comptés depuis le nord dans le sens des aiguilles d'une montre : 0° quand le haut de l'écran pointe vers le nord. C'est ce que donne `heading()` de `steami.Compass`. Toute la rose tourne pour que `N` et l'aiguille montrent le nord, et les lettres restent droites : à un cap de 90°, le haut de l'écran vers l'est, `N` est à gauche. `nan` dessine la rose sans aiguille.

Le cap n'est juste qu'avec une carte tenue à plat et un magnétomètre calibré. La calibration enregistrée dans la carte est appliquée d'elle-même ; sinon, `boussole.calibrate()` en fait une pendant 12 secondes, à appeler avant la boucle en tournant la carte dans toutes les directions. Elle reste dans le driver jusqu'au prochain redémarrage, sans rien écrire dans la carte.

### Montre

```python run
import time

from steami import Screen

DEPART = 14 * 3600 + 30 * 60  # 14:30:00, l'heure affichée au démarrage

screen = Screen()
screen.begin()
debut = time.ticks_ms()

while True:
    s = DEPART + time.ticks_diff(time.ticks_ms(), debut) // 1000
    screen.clear()
    screen.watch(s // 3600 % 24, s // 60 % 60, s % 60)
    screen.show()
    time.sleep_ms(500)
```

`watch(heures, minutes, secondes)` dessine une montre à aiguilles : un cadran à douze graduations, les chiffres 12, 3, 6 et 9, les aiguilles des heures et des minutes et une trotteuse. Ce programme part d'une heure écrite à la main et compte les secondes depuis son démarrage. L'exemple [watch.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/examples/watch.py) lit à la place l'horloge interne de la carte (`machine.RTC`), qui doit avoir été mise à l'heure.

### Visages

```python file=.external/micropython-steami-lib/lib/steami_screen/examples/face_gallery.py

```

`face(nom)` dessine un visage en pixel art, centré : une grille de 8 × 8 carrés pleins, gris clair (`LIGHT`) par défaut. Six visages sont intégrés : `"happy"`, `"sad"`, `"surprised"`, `"sleeping"`, `"angry"` et `"love"` (un cœur). Avec `compact=True`, le visage est plus petit et un peu remonté, pour laisser la place à un titre et à un sous-titre.

Un dessin personnel est une suite de 8 octets, un par ligne de haut en bas, dont chaque bit allume un carré, le bit de poids fort (`0x80`) à gauche :

```python run
from steami import Screen
from steami_screen import RED

CLIN_D_OEIL = (0x00, 0x04, 0x64, 0x00, 0x00, 0x42, 0x3C, 0x00)

screen = Screen()
screen.begin()
screen.clear()
screen.face(CLIN_D_OEIL, compact=True)
screen.title("Salut", color=RED)
screen.show()
```

## Rafraîchir l'écran

`show()` envoie toute l'image à l'écran, même si un seul pixel a changé. Dans une boucle, le plus simple est de refaire toute l'image à chaque tour, comme les programmes ci-dessus : `clear()`, les dessins, puis `show()`. Pour ne changer qu'une zone, l'effacer d'abord avec un rectangle plein de la couleur du fond, `rect(x, y, w, h, BLACK, fill=True)`, puis la redessiner : `show()` envoie quand même toute l'image.

La durée de `show()` limite la vitesse d'une animation :

<ReleaseTabs>
<Release releases="v1a v1b">

L'image fait 8 192 octets (deux pixels par octet), envoyés sur le bus SPI à 10 MHz : le transfert seul dure environ 6,6 ms.

</Release>
<Release releases="v1c">

`show()` prend environ 74 ms, mesurées sur la carte : une animation redessinée à chaque image dépasse donc à peine 13 images par seconde, moins le temps du dessin. L'image de 28 800 octets est convertie en couleurs de l'écran 16 lignes à la fois, puis envoyée sur le bus SPI à 32 MHz, le maximum du bus sur la STeaMi.

`show()` n'est pas synchronisé avec le balayage de l'écran, dont le signal de synchronisation n'est pas câblé sur la carte : dans une animation rapide, une image peut s'afficher à moitié ancienne et à moitié nouvelle (déchirement).

</Release>
</ReleaseTabs>

## Performances

- **Mémoire vive** : l'image occupe 28 800 octets sur une V1c (plus 7 680 octets pour la conversion vers l'écran), 8 192 sur une V1a ou une V1b. `begin()` la réserve d'un seul bloc : l'appeler au début du programme évite l'erreur `E31` (voir [Si l'écran ne démarre pas](#si-lécran-ne-démarre-pas)).
- **Code natif** : les parties lentes de la bibliothèque sont écrites avec l'émetteur `@micropython.viper`, qui compile une fonction Python en code machine : la conversion de l'image de la V1c pour l'écran (3,6 ms par bande de 16 lignes, contre 7,1 ms auparavant) et l'écriture du texte Spleen. Les détails et les mesures sont dans le [README du driver gc9a01](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/gc9a01/README.md#memory) et dans celui de [`steami_screen`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/README.md#gc9a01-round-colour-screen).
- **Dans un programme** : une boucle Python qui appelle `pixel()` pour chaque point est lente ; préférer `rect(…, fill=True)`, `line()` ou `circle()`, qui tracent des lignes entières. Pour un calcul de pixels vraiment lourd, la documentation MicroPython explique [comment accélérer un programme](https://docs.micropython.org/en/latest/reference/speed_python.html), avec `@micropython.native` et `@micropython.viper`.
- **Cadence** : une boucle qui redessine l'écran plus vite que `show()` ne l'envoie ne gagne rien ; une pause de 100 à 500 ms, comme dans les programmes de cette page, suffit pour afficher une mesure.

## Avec les drivers SSD1327 et GC9A01

Le driver de l'écran de chaque release offre ce que `steami.Screen` n'a pas, comme les niveaux de gris en valeurs brutes, les méthodes complètes de `framebuf` ou le réglage du contraste. Il ne marche que sur une carte qui a cet écran. Un programme utilise soit `steami.Screen`, soit le driver : les deux à la fois réserveraient deux images en mémoire pour le même écran.

<ReleaseTabs>
<Release releases="v1a v1b">

Écran OLED rond 128 × 128, 16 niveaux de gris (contrôleur SSD1327). Driver : [`ssd1327`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327).

```python
import ssd1327
from machine import SPI, Pin

spi = SPI(1)
dc = Pin("DATA_COMMAND_DISPLAY")
res = Pin("RST_DISPLAY")
cs = Pin("CS_DISPLAY")
display = ssd1327.WS_OLED_128X128_SPI(spi, dc, res, cs)  # dc, res, cs : dans cet ordre

display.fill(0)
display.text("Hello World !", 12, 60, 15)
display.framebuf.ellipse(64, 64, 60, 60, 8)  # les autres méthodes de framebuf
display.show()
```

Le dessin se fait en mémoire (`fill`, `pixel`, `line`, `fill_rect`, `text`, `scroll`, et toutes les méthodes de `display.framebuf`) ; rien n'apparaît avant l'appel à `show()`. Les couleurs sont les niveaux de gris, de `0` (noir) à `15` (blanc). `contrast(0…255)`, `invert(True)` et `rotate(True)` règlent l'affichage, `power_off()` et `power_on()` éteignent et rallument l'écran.

Les [16 exemples du driver](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ssd1327/examples) (texte, formes, défilement, image, cube en 3D…) ne tournent que sur une V1a ou une V1b.

</Release>
<Release releases="v1c">

Écran TFT rond 240 × 240 en couleur (contrôleur GC9A01). Driver : [`gc9a01`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/gc9a01).

```python file=.external/micropython-steami-lib/lib/gc9a01/examples/palette.py

```

Créer l'objet ne touche ni aux broches ni au bus : `init()` démarre l'écran et l'efface. Le dessin se fait en mémoire (`fill`, `pixel`, `line`, `rect`, `fill_rect`, `text`, `blit`, et toutes les méthodes de `display.framebuf`) ; rien n'apparaît avant l'appel à `show()`. Les couleurs sont les indices de la palette, de 0 à 15, et non des triplets : ce programme les affiche toutes. `text()` écrit avec la police de 8 × 8 pixels de `framebuf`, sans accents. `power_off()` et `power_on()` éteignent et rallument l'écran ; le rétroéclairage reste toujours allumé.

</Release>
</ReleaseTabs>

## Voir aussi

- [Essayer le code sur la carte](./essayer) : le bouton **Essayer sur la carte**, et la section [Sur une V1c](./essayer#sur-une-v1c).
- [Écran en Arduino](../arduino/ecran) : les mêmes widgets avec `SteamiScreen`, et la [correspondance entre MicroPython et Arduino](../arduino/ecran#de-micropython-à-arduino).
- [Les écrans de la carte](/docs/hardware/main-components/display) : le matériel des deux écrans.
- [README de `steami_screen`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_screen/README.md) : la référence complète de l'interface, en anglais.
