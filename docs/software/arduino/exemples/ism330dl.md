---
title: Exemples ISM330DL
sidebar_label: ISM330DL (mouvement)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

# Exemples ISM330DL : accéléromètre et gyroscope

L'ISM330DL réunit deux capteurs de mouvement dans une même puce. L'**accéléromètre** mesure l'accélération le long de trois axes, x, y et z, en **g** : 1 g vaut 9,81 m/s², l'accélération de la pesanteur. Le **gyroscope** mesure la vitesse de rotation autour de ces trois axes, en **degrés par seconde** (dps) : 360 dps, c'est un tour complet en une seconde. La puce mesure aussi sa propre température.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Un accéléromètre immobile ne mesure pas 0 : il ressent le support qui l'empêche de tomber, et mesure 1 g dirigé vers le haut. C'est ce qui permet de savoir comment la carte est tenue : l'axe vertical mesure environ +1 g ou −1 g, selon son sens, et les deux autres environ 0. Carte posée à plat, écran vers le haut, l'axe z mesure environ −1 g : il est donc orienté vers le dos de la carte. Pour les axes x et y, le plus simple est de les repérer avec [BasicReader](#basicreader), en posant la carte sur chacun de ses bords. Le gyroscope, lui, ne mesure que la rotation en cours : carte immobile, il donne environ 0, quelle que soit sa position.

Le composant monté sur la carte est l'ISM330DLC de STMicroelectronics (référence ISM330DLCTR) ; la bibliothèque l'appelle ISM330DL. Il est monté sur les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)) : les trois exemples de cette page marchent sur toutes les cartes. Ses caractéristiques, sa fiche technique et son schéma sont sur la page [Accéléromètre / Gyroscope — ISM330DLC](/docs/hardware/main-components/sensors/ism330dlc).

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → ISM330DL** de l'Arduino IDE. Ils écrivent leurs messages en anglais. Ils n'utilisent pas l'écran : il garde l'image laissée par le programme précédent, ce n'est pas une panne. La page [Capteurs](../capteurs#mouvement--accéléromètre-et-gyroscope) donne la façon la plus simple de lire le mouvement, avec les classes `SteamiAccelerometer` et `SteamiGyroscope` ; ici, les exemples utilisent directement le driver du composant.

## Le driver en bref

Les trois exemples créent le driver de la même façon et utilisent ces fonctions du driver `SteamiISM330DL` :

- `SteamiISM330DL imu(Steami.wire());` crée le driver sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, où le composant répond à l'adresse `0x6B`.
- `begin()` vérifie que le composant répond avec son identifiant (`0x6A`), le redémarre, puis règle ses deux capteurs : 104 mesures par seconde chacun, une plage de ±2 g pour l'accéléromètre et de ±250 dps pour le gyroscope. Après `begin()`, le composant mesure en continu, à son propre rythme. Si le composant ne répond pas, `begin()` renvoie `false` et les exemples écrivent `ISM330DL not detected.` puis s'arrêtent.
- `accelerationG(v)` range l'accélération des trois axes, en g, dans une variable `SteamiISM330DL::Vector3` (`v.x`, `v.y` et `v.z`). Le composant donne pour chaque axe un nombre entier, de −32768 à 32767, que le driver multiplie par 0,061 millième de g, la sensibilité de la plage ±2 g. Cette plage est la plus fine, mais une secousse vive la dépasse : la valeur plafonne alors vers 2 g. `accelerationMs2(v)`, que les exemples n'utilisent pas, donne la même accélération en m/s², multipliée par 9,80665.
- `gyroscopeDps(v)` range de la même façon la vitesse de rotation autour des trois axes, en dps : le nombre entier est multiplié par 8,75 millièmes de dps. Un geste vif du poignet peut dépasser la plage de ±250 dps : la valeur plafonne alors. `gyroscopeRads(v)`, que les exemples n'utilisent pas non plus, donne la même vitesse en radians par seconde.
- `temperature(t)` range la température de la puce, en °C, calculée par 25 + (nombre brut / 256).
- `orientation(o)` et `motion(m)` interprètent ces mesures : la première déduit de l'accélération la position de la carte, la seconde déduit du gyroscope le type de rotation en cours. Elles sont détaillées avec les exemples [Orientation](#orientation) et [Motion](#motion). `orientationToString()` et `motionToString()` transforment leur résultat en texte, comme `SCREEN_UP`, pour l'écrire sur la console.

Toutes ces fonctions de lecture renvoient `true` si la lecture a réussi, et `false` si le composant n'a pas répondu ; dans ce cas, la variable n'est pas remplie, et les exemples n'affichent rien pour ce tour.

Deux points du driver comptent pour comprendre les exemples :

- Une lecture n'attend pas de nouvelle mesure : elle lit la dernière que le composant a rangée dans ses registres. À 104 mesures par seconde, il en arrive une nouvelle toutes les 10 ms environ : avec les pauses de 100 ou 300 ms des exemples, chaque lecture est récente. En revanche, ce qui se passe entre deux lectures n'est pas vu.
- Le driver créé dans le programme garde la plage de ±2 g et ne reçoit pas la calibration `ca` de la zone de configuration du DAPLink. La classe `SteamiAccelerometer`, elle, règle l'accéléromètre sur ±8 g et applique cette calibration (voir [Capteurs](../capteurs#mouvement--accéléromètre-et-gyroscope)).

Le composant peut aussi signaler ses mesures sur une ligne d'interruption reliée au microcontrôleur (`INT_ACC`, broche PC13). Le driver ne s'en sert pas : tout passe par le bus I²C.

## BasicReader {#basicreader}

**Ce qu'on observe** : la console écrit `ISM330DL ready.`, puis, environ trois fois par seconde, un bloc en trois parties : l'accélération sur les trois axes, sous `Acceleration (g)`, la vitesse de rotation, sous `Gyroscope (dps)`, et la température. Carte posée à plat, écran vers le haut, immobile, un bloc ressemble par exemple à ceci :

```text
Acceleration (g)
X: -0.029
Y: -0.014
Z: -1.004

Gyroscope (dps)
X: 1.01
Y: -1.85
Z: 0.20

Temperature: 22.1 °C
```

Z vaut environ −1 g, X et Y environ 0, et les trois vitesses de rotation restent proches de 0, à 1 ou 2 dps près. Le tout premier bloc, écrit juste après le démarrage, peut s'écarter des suivants : sur la carte essayée, il donnait `Z: -0.252`, puis `Z: -1.004` dès le bloc suivant (voir plus bas). Posée sur un de ses bords, c'est X ou Y qui s'approche de +1 g ou de −1 g : c'est ainsi qu'on repère les axes. Quand on fait tourner la carte, les vitesses de rotation s'écartent de 0 le temps du mouvement, puis y reviennent.

```cpp file=.external/arduino-steami/examples/ISM330DL/BasicReader/BasicReader.ino

```

**Comment ça marche** : le programme appelle les trois lectures à la suite et n'écrit le bloc que si les trois ont réussi : avec `&&`, une lecture qui échoue arrête la suite, et rien n'est écrit pour ce tour. Il écrit l'accélération au millième de g et la vitesse de rotation au centième de dps.

Au repos, quelle que soit la position de la carte, la pesanteur se répartit entre les trois axes : la longueur du vecteur, √(x² + y² + z²), reste proche de 1 g. Les valeurs ne tombent pas exactement sur 0 ou 1 g : chaque axe a un petit décalage propre à la puce, que la calibration `ca` sert à corriger. De même, le gyroscope immobile donne de petites valeurs, rarement exactement 0 : sur la carte essayée, posée sur une table, environ 1 dps autour de x, −1,8 dps autour de y et 0,2 dps autour de z, à peu près les mêmes d'un bloc à l'autre.

Le premier bloc vient d'une lecture faite aussitôt après `begin()`. Comme une lecture n'attend pas de nouvelle mesure, elle peut tomber avant que le composant, qui vient d'être redémarré, ait rangé une mesure stable dans ses registres : la valeur lue est alors fausse. Dès le tour suivant, 300 ms plus tard, les mesures sont régulières.

La température est celle de la puce, pas forcément celle de l'air autour de la carte. Le driver la donne sans correction.

<EssayerExemple id="ISM330DL/BasicReader" />

## Orientation {#orientation}

**Ce qu'on observe** : la console écrit `Rotate the board...`, puis une ligne à chaque changement de position. Posée à plat, écran vers le haut, la carte écrit `Orientation: SCREEN_UP` ; retournée, écran vers la table, `SCREEN_DOWN`. Posée sur un de ses bords, elle écrit `TOP_EDGE_DOWN`, `BOTTOM_EDGE_DOWN`, `RIGHT_EDGE_DOWN` ou `LEFT_EDGE_DOWN`. Penchée à mi-chemin entre deux de ces positions, elle écrit `MOVING`.

```cpp file=.external/arduino-steami/examples/ISM330DL/Orientation/Orientation.ino

```

**Comment ça marche** : `orientation()` lit l'accélération en g et compare chaque axe à un seuil de 0,75 g, dans cet ordre :

| Condition                              | Résultat           |
| -------------------------------------- | ------------------ |
| z > 0,75 g                             | `SCREEN_DOWN`      |
| z < −0,75 g                            | `SCREEN_UP`        |
| x > 0,75 g                             | `TOP_EDGE_DOWN`    |
| x < −0,75 g                            | `BOTTOM_EDGE_DOWN` |
| y > 0,75 g                             | `RIGHT_EDGE_DOWN`  |
| y < −0,75 g                            | `LEFT_EDGE_DOWN`   |
| tous les axes entre −0,75 g et +0,75 g | `MOVING`           |

Au repos, un axe dépasse 0,75 g quand il est à moins de 41° environ de la verticale. Deux axes ne peuvent pas dépasser ce seuil en même temps, puisque 0,75² + 0,75² dépasse 1 : l'ordre des tests ne compte que pendant un mouvement. Les noms des bords sont ceux que le driver associe aux axes x et y ; BasicReader permet de vérifier quel axe correspond à quel bord.

Malgré son nom, `MOVING` ne détecte pas un mouvement : il veut dire qu'aucun axe n'est proche de la verticale. Une carte immobile, penchée à 45°, donne `MOVING`. À l'inverse, pendant une secousse, l'accéléromètre mesure aussi le mouvement de la main, et le résultat peut changer plusieurs fois : la position n'a de sens que carte immobile.

Le programme lit la position toutes les 300 ms et ne l'écrit que quand elle change, grâce à la variable `lastOrientation`. Elle vaut `MOVING` au départ : une position nette est donc écrite dès le début, une carte penchée n'est annoncée que quand elle prend une position nette. La toute première lecture, faite aussitôt après `begin()`, peut tomber avant que l'accéléromètre ait une mesure stable (voir [BasicReader](#basicreader)) : elle donne alors `MOVING`, qui n'est pas écrit, et la position arrive au tour suivant, 300 ms plus tard. Ces premières lignes arrivent bien dans la console : juste après le téléversement, une carte posée à plat, écran vers le haut, affiche :

```text
Rotate the board...
Orientation: SCREEN_UP
```

<EssayerExemple id="ISM330DL/Orientation" />

## Motion {#motion}

**Ce qu'on observe** : la console écrit `Move the board...`, puis rien tant que la carte ne tourne pas. Quand elle tourne, une ligne donne le type de rotation et sa vitesse, par exemple `Motion: TURNING_RIGHT (85.3 dps)` ; quand elle s'arrête, `Motion: STABLE`. Faire pivoter la carte à plat sur la table donne `TURNING_RIGHT` ou `TURNING_LEFT` selon le sens ; la pencher vers un côté ou l'autre donne `TILTING_LEFT`, `TILTING_RIGHT`, `TILTING_UP` ou `TILTING_DOWN`. Une carte qui reste penchée sans bouger donne `STABLE` : le gyroscope mesure la rotation, pas la position.

```cpp file=.external/arduino-steami/examples/ISM330DL/Motion/Motion.ino

```

**Comment ça marche** : `motion()` lit la vitesse de rotation en dps et ne retient que l'axe qui tourne le plus vite, avec un seuil de 10 dps :

- si la rotation autour de z est la plus rapide des trois et dépasse 10 dps, le résultat est `TURNING_RIGHT` quand elle est positive, `TURNING_LEFT` quand elle est négative ;
- sinon, si la rotation autour de x est plus rapide que celle autour de y : `TILTING_LEFT` au-dessus de +10 dps, `TILTING_RIGHT` en dessous de −10 dps ;
- sinon, pour la rotation autour de y : `TILTING_DOWN` au-dessus de +10 dps, `TILTING_UP` en dessous de −10 dps ;
- dans tous les autres cas, `STABLE`.

La fonction range le type dans le champ `type` de la variable `SteamiISM330DL::Motion`, et dans son champ `value` la vitesse de l'axe retenu, sans son signe. Le seuil de 10 dps écarte les rotations très lentes, moins d'un tour en 36 s, et les petites valeurs que le gyroscope donne au repos : 2 dps au plus sur la carte essayée, bien en dessous du seuil. Une rotation qui combine plusieurs axes est nommée d'après le plus rapide. Les noms des sens (droite, gauche, haut, bas) sont ceux que le driver associe au signe de chaque axe.

Le programme lit le gyroscope toutes les 100 ms et n'écrit une ligne que quand le type de rotation change, grâce à la variable `lastMotion`. Elle vaut `STABLE` au départ : carte immobile, la console n'écrit rien après `Move the board...`, et c'est bien ce qu'elle montre juste après le téléversement, carte posée sur une table. La vitesse écrite est celle de la première lecture du nouveau mouvement : elle n'est pas mise à jour tant que la carte continue de tourner dans le même sens. Comme chaque lecture ne voit que la vitesse de l'instant, un coup très bref, entre deux lectures, peut passer inaperçu.

<EssayerExemple id="ISM330DL/Motion" />
