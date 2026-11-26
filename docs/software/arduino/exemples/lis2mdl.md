---
title: Exemples LIS2MDL
sidebar_label: LIS2MDL (magnétomètre)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore Minmax -->

# Exemples LIS2MDL : magnétomètre et boussole

Le LIS2MDL est un **magnétomètre** : il mesure le champ magnétique qui le traverse, sur trois axes perpendiculaires x, y et z, et le driver donne chaque composante en microteslas (µT). Loin des aimants et du métal, ce champ est celui de la Terre, qui vaut de 25 à 65 µT selon le lieu. Il est dirigé vers le nord magnétique et, en France, il plonge vers le sol : sa composante verticale y est même plus forte que sa composante horizontale. Une boussole électronique se sert de la composante horizontale pour trouver le nord.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Le LIS2MDL est monté sur les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)) : les quatre exemples de cette page mesurent sur toutes les cartes. Seul DigitalCompass se sert aussi de l'écran, et seulement de celui des V1a et V1b. Les caractéristiques du capteur, sa fiche technique et son schéma sont sur la page [Magnétomètre — LIS2MDL](/docs/hardware/main-components/sensors/lis2mdl).

Le capteur mesure tout le champ qui le traverse, pas seulement celui de la Terre : celui des pièces aimantées de la carte elle-même, des aimants, des objets en fer ou en acier et des câbles proches s'y ajoute. Sans calibration, une V1c a ainsi lu 176 µT au total. C'est pourquoi deux des exemples commencent par une **calibration**, qui mesure ce champ propre à la carte pour le retirer.

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → LIS2MDL** de l'Arduino IDE. Ils écrivent leurs messages en anglais. La page [Capteurs et écran](../capteurs#boussole--magnétomètre) donne la façon la plus simple de lire le cap et le champ, avec les classes `SteamiCompass` et `SteamiMagnetometer`, qui appliquent d'elles-mêmes une calibration enregistrée sur la carte ; ici, les exemples utilisent directement le driver du composant, qui ne la reçoit pas.

## Le driver en bref

Les exemples créent tous le driver de la même façon et vérifient qu'il répond :

- `SteamiLIS2MDL magnetometer(Steami.wire());` crée le driver sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, où le capteur répond à l'adresse `0x1E`.
- `begin()` lit l'identifiant du capteur (`0x40`) et renvoie `false` s'il ne le trouve pas : les exemples écrivent alors `LIS2MDL not detected. Check the internal I2C bus.` et s'arrêtent. Sinon, il redémarre le capteur et le règle en **mode continu** à 10 mesures par seconde, avec la compensation en température du capteur activée. Après `begin()`, le capteur mesure déjà, tout seul.
- `setContinuous(hz)` choisit le nombre de mesures par seconde (10, 20, 50 ou 100 ; toute autre valeur donne 10) et laisse le capteur en mode continu.

Pour lire les mesures :

- `dataReady()` demande au capteur si une nouvelle mesure est arrivée.
- `magneticFieldUt()` lit les trois composantes x, y et z et les convertit en µT : chaque unité brute du capteur vaut 0,15 µT. Ces valeurs ne sont pas calibrées : elles contiennent le champ propre de la carte.
- `magnitudeUt()` fait sa propre lecture et renvoie l'intensité du champ, la longueur du vecteur : √(x² + y² + z²), en µT, sans calibration non plus.
- `temperature()` lit le thermomètre interne du capteur, qui lui sert à compenser ses mesures. Le driver compte 8 unités brutes par degré et fait correspondre la valeur brute 0 à 25 °C, un choix tiré de l'observation : la fiche technique ne garantit pas ce point de départ, et la température lue est indicative.

En mode continu, ces lectures n'attendent pas de nouvelle mesure : elles renvoient la dernière que le capteur a rangée dans ses registres. Un programme qui lit plus vite que le capteur ne mesure obtient donc plusieurs fois la même valeur. C'est pourquoi les exemples qui lisent toutes les 20 ms règlent le capteur à 50 mesures par seconde.

Pour la boussole :

- `calibrateMinmax2d(mesures, pauseMs)` et `calibrateMinmax3d(mesures, pauseMs)` calibrent le capteur pendant que la carte tourne, en relevant le minimum et le maximum de chaque axe. Ils rangent le résultat dans des variables du driver, `xOff`, `yOff`, `zOff` (le décalage de chaque axe, en unités brutes) et `xScale`, `yScale`, `zScale` (l'échelle de chaque axe) ; la version 2D ne touche pas à celles de z. La calibration reste en mémoire vive : elle se perd au redémarrage de la carte. [DigitalCompass](#digitalcompass) et [MagneticCalibration](#magneticcalibration) détaillent ce que chacune corrige.
- `headingFlatOnly()` lit le champ, lui applique la calibration et renvoie le **cap** de la carte posée à plat, en degrés : 0 quand le haut de l'écran (le côté opposé au connecteur USB) pointe vers le nord magnétique, puis 90 à l'est, 180 au sud et 270 à l'ouest, jamais 360.
- `directionLabel(cap)` renvoie la direction la plus proche parmi huit, `N`, `NE`, `E`, `SE`, `S`, `SW`, `W` et `NW` (W pour _west_, l'ouest). Chacune couvre 45° centrés sur elle : `N` va de 337,5° à 22,5°.
- `setHeadingFilter(alpha)` lisse le cap renvoyé par `headingFlatOnly()` : voir [DigitalCompass](#digitalcompass).

Le capteur peut signaler chaque nouvelle mesure sur une ligne d'interruption reliée au microcontrôleur (`INT_MAG`, broche PD1). Le driver ne l'active pas : `dataReady()` lit l'état du capteur dans un de ses registres, par le bus I²C.

## BasicReader {#basicreader}

**Ce qu'on observe** : la console écrit `LIS2MDL Basic Reader`, une ligne de titres, puis environ dix lignes par seconde, chacune avec cinq nombres séparés par des virgules : le champ sur x, y et z en µT, la température du capteur en °C et l'intensité du champ en µT, par exemple `-21.30,48.15,-160.20,27.38,168.62`. Quand on tourne la carte, les trois composantes changent ; quand on approche un aimant, elles bondissent.

```cpp file=.external/arduino-steami/examples/LIS2MDL/BasicReader/BasicReader.ino

```

**Comment ça marche** : `setContinuous(10)` reprend le réglage de `begin()`, 10 mesures par seconde, et le rend visible dans le programme. Dans `loop()`, le programme attend par pas de 10 ms que `dataReady()` annonce une nouvelle mesure, puis lit le champ, la température et l'intensité, et écrit une ligne. Le format, des nombres séparés par des virgules avec une ligne de titres, se colle tel quel dans un tableur.

Ces valeurs ne sont pas calibrées : l'intensité affichée contient le champ propre de la carte, et peut dépasser de loin les 25 à 65 µT du champ terrestre. Ce champ propre tourne avec la carte, alors que le champ terrestre garde sa direction : selon l'orientation, les deux s'ajoutent plus ou moins, et l'intensité change elle aussi quand on tourne la carte. Après une calibration, elle resterait à peu près constante.

`magnitudeUt()` ne reprend pas les trois composantes déjà lues : elle fait sa propre lecture du capteur. Au rythme de 10 mesures par seconde, cette lecture tombe presque toujours sur la même mesure.

<EssayerExemple id="LIS2MDL/BasicReader" />

## MetalDetector {#metaldetector}

**Ce qu'on observe** : la console écrit `Keep the board away from metal while baseline is calibrated...` ; pendant environ deux secondes, la carte doit rester immobile, loin de tout objet métallique. Elle écrit ensuite le champ de référence et le seuil, par exemple `Baseline: 168.40 uT, trigger delta: 33.68 uT`, puis une ligne par mesure, environ dix fois par seconde, avec l'intensité du champ, l'écart à la référence et `clear` ou `METAL NEARBY`. Quand on approche un aimant ou un objet en fer ou en acier (ciseaux, tournevis) tout près de la carte, l'écart grandit ; au-delà du seuil, la console écrit `METAL NEARBY` et le buzzer bipe, d'autant plus aigu que l'écart est grand.

```cpp file=.external/arduino-steami/examples/LIS2MDL/MetalDetector/MetalDetector.ino

```

**Comment ça marche** : ce détecteur ne cherche pas le métal lui-même : il guette une **variation de l'intensité du champ magnétique**. Un aimant ajoute son propre champ ; un objet en fer ou en acier concentre et dévie le champ terrestre autour de lui. L'aluminium, le cuivre, l'or ou l'acier inoxydable de certains couverts ne modifient pratiquement pas un champ qui ne varie pas : ce détecteur ne les voit pas.

Au démarrage, `averageMagnitude()` fait la moyenne de 100 intensités lues avec `magnitudeUt()`, une toutes les 20 ms, d'où le réglage à 50 mesures par seconde : c'est la référence, le champ sans objet. Le seuil vaut 20 % de cette référence, avec un minimum de 15 µT : `max(15.0f, baselineUt * 0.20f)`. Dans `loop()`, le programme compare chaque intensité à la référence ; si l'écart, en valeur absolue, dépasse le seuil, il joue un bip de 80 ms avec `tone(SPEAKER, …)` sur le buzzer (voir [Jouer un son](../premiers-programmes#jouer-un-son)). La fréquence du bip vaut 1000 Hz plus 15 Hz par µT d'écart, sans dépasser 3500 Hz. Comme `loop()` recommence toutes les 100 ms environ, les bips se suivent presque sans interruption tant que l'objet reste là.

Le champ n'est pas calibré : la référence contient le champ propre de la carte. Comme dans [BasicReader](#basicreader), l'intensité mesurée change quand on tourne la carte : pour que la détection ait un sens, garder la carte dans l'orientation qu'elle avait pendant la mesure de la référence et approcher l'objet d'elle. Un simple quart de tour de la carte peut suffire à déclencher l'alerte. L'effet d'un objet en fer diminue très vite avec la distance : il faut le passer à quelques centimètres de la carte, en cherchant l'endroit où la réaction est la plus forte.

<EssayerExemple id="LIS2MDL/MetalDetector" />

## DigitalCompass {#digitalcompass}

**Ce qu'on observe** : au démarrage, la console demande `Rotate the board flat in a full circle for calibration for 30 seconds...`. Il faut alors faire tourner la carte posée à plat, écran vers le haut, sur plusieurs tours complets, jusqu'au message `Calibration done.` (un peu plus de 20 secondes ; le message en annonce 30). La console écrit ensuite environ quatre lignes par seconde avec le cap en degrés et la direction, par exemple `92.4,E`.

Sur une V1a ou une V1b, l'écran OLED affiche aussi le démarrage et la calibration (`Calibrating`, `rotate flat`), puis `Compass`, le cap (par exemple `92.4 deg`) et la direction. Sur une V1c, l'écran n'est pas le même : lire le cap dans la console.

```cpp file=.external/arduino-steami/examples/LIS2MDL/DigitalCompass/DigitalCompass.ino

```

**Comment ça marche** : quand la carte tourne à plat, seules les composantes x et y du champ terrestre changent : le point (x, y) décrit un cercle. Le champ propre de la carte, lui, tourne avec elle : il s'ajoute toujours de la même façon à x et à y, et déplace tout le cercle loin de l'origine. C'est ce qu'on appelle l'effet **fer dur**. Sans correction, le cap calculé est faux.

`calibrateMinmax2d(1000, 20)` lit le champ 1000 fois, une fois toutes les 20 ms (d'où le réglage à 50 mesures par seconde), en notant le minimum et le maximum de x et de y. Le milieu de chaque intervalle donne le centre du cercle : ce sont les décalages `xOff` et `yOff`, que le driver retire ensuite de chaque mesure. Le driver calcule aussi une échelle, la moitié de l'étendue de chaque axe, mais il donne aux deux axes la moyenne des deux : x et y sont divisés par le même nombre, ce qui ne change pas l'angle. Cette calibration ne corrige donc que le décalage. Il faut des tours complets : sans eux, le minimum ou le maximum manque, et le centre est mal placé.

Ensuite, `headingFlatOnly()` retire le décalage, puis calcule l'angle entre le haut de l'écran et la composante horizontale du champ à partir de x et de y, avec la fonction `atan2()`. `directionLabel()` traduit ce cap en direction. Le cap n'est juste que carte à plat : une carte penchée mélange au calcul une part de la composante verticale du champ, qui est forte en France. Il est compté par rapport au nord magnétique, pas au nord géographique (voir [Capteurs et écran](../capteurs#boussole--magnétomètre)).

`setHeadingFilter(0.2f)` lisse le cap : chaque nouvel angle ne compte que pour 20 % dans le cap renvoyé, le reste vient des précédents. Le cap affiché tremble moins, mais il met quelques secondes à rattraper un changement d'orientation. Le driver ne fait pas la moyenne des angles eux-mêmes, mais des directions qu'ils représentent : une moyenne de 359° et de 1° donnerait 180°, le sud, alors que le filtre donne bien 0°.

L'écran OLED rond des V1a et V1b est un SSD1327, piloté par le driver `SteamiSSD1327`. La V1c a un écran couleur GC9A01, que cet exemple ne pilote pas. Le driver SSD1327 ne peut pas vérifier la présence de son écran : `begin()` renvoie toujours `true`, et le message `SSD1327 display not found, serial output only.` ne s'affiche jamais. Sur une V1c, le programme envoie donc quand même ses commandes, prévues pour un SSD1327 ; ce que montre alors l'écran couleur n'a pas été vérifié.

<EssayerExemple id="LIS2MDL/DigitalCompass" />

## MagneticCalibration {#magneticcalibration}

**Ce qu'on observe** : la console écrit `Hard-iron calibration`, demande de tourner la carte dans tous les sens, puis compte de 5 à 1 (`Starting in 5`…). Commencer à tourner la carte lentement dans toutes les directions pendant ce compte à rebours, et continuer pendant la mesure, `Calibrating for about 12 seconds...`, jusqu'à `Done.` : faces vers le haut et vers le bas, bords dressés, tours à plat. La console écrit alors les six valeurs de calibration, puis, environ quatre secondes plus tard, les indicateurs de qualité (`Calibration quality:`). Ensuite, deux fois par seconde, elle écrit le cap, la direction et le champ, par exemple `heading=271.3 deg direction=W field_uT=(-12.6, 37.1, -158.9)`.

Pour recommencer la calibration, appuyer sur le bouton Reset de la carte.

```cpp file=.external/arduino-steami/examples/LIS2MDL/MagneticCalibration/MagneticCalibration.ino

```

**Comment ça marche** : quand la carte tourne dans tous les sens, le point (x, y, z) parcourt une sphère, dont le rayon est l'intensité du champ terrestre. Le champ propre de la carte, l'effet fer dur, déplace le centre de cette sphère. `calibrateMinmax3d(600, 20)` lit le champ 600 fois, une fois toutes les 20 ms, soit un peu plus de 12 secondes, et note le minimum et le maximum de chaque axe :

- le **décalage** d'un axe (`xOff`, `yOff`, `zOff`) est le milieu entre son minimum et son maximum : c'est le centre de la sphère, retiré ensuite de chaque mesure ;
- l'**échelle** d'un axe (`xScale`, `yScale`, `zScale`) est la moitié de son étendue, et les mesures calibrées sont divisées par elle. Ici, chaque axe garde sa propre échelle : si un axe réagit plus fort que les autres, la sphère est étirée le long de cet axe, et cette division la ramène à une sphère de rayon 1.

Ces échelles corrigent une partie de l'effet **fer doux** : des pièces de la carte qui ne sont pas aimantées, mais qui dévient le champ terrestre et changent la sphère en ellipsoïde. La correction ne vaut que pour un ellipsoïde allongé le long des axes x, y et z : le driver n'a pas de correction pour un ellipsoïde penché, qui demanderait un calcul plus complet. Si la carte n'a pas été tournée dans tous les sens, un axe n'atteint pas son vrai minimum ou maximum, et son décalage et son échelle sont faux.

Après la calibration, `calibrateQuality(200, 20)` relit le champ calibré 200 fois, pendant environ 4 secondes. L'exemple ne dit pas quoi faire pendant ce temps ; ces indicateurs n'ont de sens que si la carte tourne à plat pendant la mesure, comme l'indique un commentaire du driver :

- `center` : la moyenne des valeurs calibrées sur x, y et z. Après des tours complets à plat, les deux premiers nombres sont proches de 0 si le décalage est bien corrigé ; le troisième ne l'est pas forcément, puisque z mesure alors la composante verticale du champ, qui ne change pas.
- `XY radius mean` et `std` : la distance moyenne au centre dans le plan x, y, et sa dispersion. Une dispersion faible devant la moyenne veut dire que les points forment un cercle bien centré. Si la calibration a vu tout le champ, ce rayon est nettement inférieur à 1 carte à plat, car il ne contient que la composante horizontale du champ.
- `anisotropy` : le rapport entre la plus grande et la plus petite variation de x et de y. Proche de 1, le cercle est rond ; nettement plus grand, il est aplati, ou la carte n'a pas tourné régulièrement.

Dans `loop()`, `headingFlatOnly()` calcule le cap avec cette calibration, les échelles de x et de y comprises. Le champ écrit à côté vient de `magneticFieldUt()`, qui n'applique pas la calibration : ce sont les valeurs brutes, en µT.

Les six valeurs écrites sont celles que prend `setCalibrateStep(xOff, yOff, zOff, xScale, yScale, zScale)` : un programme peut les recopier et les passer à cette fonction après `begin()`, pour réutiliser la calibration sans la refaire. Ce sont aussi les six valeurs de la calibration `cm` de la zone de configuration (voir [Calibrations](../carte#calibrations)), que `SteamiCompass` et `SteamiMagnetometer` appliquent d'eux-mêmes au démarrage. Le message `TODO steami_config` de la fin parle d'une fonction à venir pour les y enregistrer ; dans cette version de la bibliothèque, `config->setMagnetometerCalibration()` le permet déjà. L'exemple, lui, n'enregistre rien.

<EssayerExemple id="LIS2MDL/MagneticCalibration" />
