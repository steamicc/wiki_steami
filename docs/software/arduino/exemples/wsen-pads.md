---
title: Exemples WSEN-PADS
sidebar_label: WSEN-PADS (pression)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

# Exemples WSEN-PADS : capteur de pression

Le WSEN-PADS, de Wurth Elektronik, mesure la **pression atmosphérique absolue**, c'est-à-dire le poids de l'air au-dessus de la carte, en hectopascals (hPa). Au niveau de la mer, elle vaut environ 1013 hPa ; elle baisse quand on monte, puisqu'il reste moins d'air au-dessus, et elle varie aussi avec la météo. Le capteur mesure aussi la température : la sienne, sur la carte, qui peut différer un peu de celle de l'air de la pièce.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Le WSEN-PADS (repère U12) équipe la **V1b** ; il figure aussi dans la nomenclature de la V1a, où son montage reste à confirmer (voir [Révisions de la carte](/docs/hardware/revisions#capteurs-internes)). La **V1c** ne l'a plus : la pression y est mesurée par le BME280. Sur une V1c, les trois exemples de cette page ne trouvent pas le capteur : ils écrivent `WSEN-PADS not detected — check wiring.` puis s'arrêtent. Ce n'est pas un problème de câblage, le composant est simplement absent. Ses caractéristiques, sa fiche technique et son schéma sont sur la page [Capteur de pression — WSEN-PADS](/docs/hardware/main-components/sensors/wsen-pads).

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → WSEN-PADS** de l'Arduino IDE. Ils écrivent leurs messages en anglais. Ils n'utilisent pas l'écran : ce qu'il affiche ne vient pas de l'exemple. La page [Capteurs et écran](../capteurs#pression-humidité-et-température) donne la façon la plus simple de lire la pression, avec la classe `SteamiPressure`, qui marche aussi sur une V1c ; ici, les exemples utilisent directement le driver du composant. Comme ils créent eux-mêmes ce driver, une calibration de température du WSEN-PADS enregistrée sur la carte ne s'applique pas à la température qu'ils affichent (voir [Calibrations](../carte#calibrations)) ; `setTemperatureOffset()` ou `calibrateTemperature()` permettent de la corriger à la main.

## Le driver en bref

Les trois exemples suivent le même schéma et n'utilisent que quatre fonctions du driver `SteamiWsenPads` :

- `SteamiWsenPads sensor(Steami.wire());` crée le driver sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, où le capteur répond à l'adresse `0x5D`.
- `begin()` attend 5 ms, vérifie que le capteur répond sur le bus, attend qu'il ait fini de démarrer (20 ms au plus), puis contrôle son identifiant (`0xB3`). Il le configure ensuite et le laisse **en veille** : après `begin()`, le capteur ne mesure pas encore. Si l'une de ces étapes échoue, `begin()` renvoie `false`, et les exemples écrivent `WSEN-PADS not detected — check wiring.` puis s'arrêtent.
- `setContinuous(ODR_1_HZ)` lance les mesures en continu, au rythme choisi : ici une mesure par seconde (`ODR` pour _output data rate_, le débit de mesures ; le capteur va jusqu'à `ODR_200_HZ`). Le capteur mesure ensuite tout seul, à son rythme. Comme `begin()`, elle active aussi la **mise à jour par bloc** : le capteur ne remplace pas une mesure pendant que le programme est en train de la lire, ce qui évite de mélanger les octets de deux mesures.
- `dataReady()` demande au capteur si une nouvelle mesure de pression **et** une nouvelle mesure de température sont prêtes.
- `read()` lit la dernière mesure et la renvoie dans une structure à deux champs : `pressure`, en hPa, et `temperature`, en °C. Le capteur donne la pression comme un nombre entier sur 24 bits, par pas de 1/4096 hPa, et la température en centièmes de degré : le driver fait la division. En mesure continue, `read()` n'attend pas et ne vérifie pas que la mesure est nouvelle : c'est le rôle de `dataReady()`, appelé avant. Si le capteur est en veille, `read()` lui demande d'abord une mesure unique et l'attend, jusqu'à 100 ms ; s'il ne répond pas à temps, elle renvoie `NAN` dans les deux champs.

Le driver propose d'autres réglages que les exemples n'utilisent pas : un filtre passe-bas sur la pression (`enableLowPass()`), un mode à faible bruit (`enableLowNoise()`) et un ajustement de la température (`setTemperatureOffset()`, `calibrateTemperature()`). `begin()` et `setContinuous()` réécrivent tout le registre où se règle le filtre passe-bas, ce qui le désactive : pour s'en servir, appeler `enableLowPass()` après `setContinuous()`.

Le capteur peut aussi signaler chaque nouvelle mesure sur une broche d'interruption, si on le configure pour cela ; le driver ne le fait pas. Sur la carte, cette ligne (`INT_PRESSURE`) n'arrive de toute façon qu'au point de test TP30 et n'est pas reliée au microcontrôleur (voir [Signaux d'interruption des capteurs](/docs/hardware/pin-mapping/internal-bus#signaux-dinterruption-des-capteurs)) : `dataReady()` lit l'état du capteur dans son registre `STATUS`, par le bus I²C.

## read_pressure_temperature {#read_pressure_temperature}

**Ce qu'on observe** : la console écrit une ligne par seconde environ, avec la pression et la température, par exemple `P=1008.42 hPa  T=24.31 C`. La pression change peu dans une pièce : en soulevant la carte d'un mètre, elle baisse d'environ 0,12 hPa, un écart qui devrait se voir sur la deuxième décimale, en comparant quelques lignes avant et après.

```cpp file=.external/arduino-steami/examples/WSEN-PADS/read_pressure_temperature/read_pressure_temperature.ino

```

**Comment ça marche** : c'est le squelette des trois exemples. Dans `setup()`, `begin()` vérifie et configure le capteur, qui reste en veille, puis `setContinuous(ODR_1_HZ)` le met en mesure continue, une fois par seconde. Dans `loop()`, le programme vient voir toutes les 10 ms si une mesure est prête ; dès qu'elle l'est, `read()` la lit, le programme l'écrit avec deux décimales, puis attend une seconde.

Comme le capteur mesure une fois par seconde, la mesure suivante est déjà prête à la fin de cette attente : la console reçoit une ligne à peu près à chaque mesure.

<EssayerExemple id="WSEN-PADS/read_pressure_temperature" />

## altitude {#altitude}

**Ce qu'on observe** : la console écrit une ligne par seconde environ, avec la pression et l'altitude estimée, par exemple `P=1000.00 hPa  alt=110.9 m`. Cette altitude peut être fausse de plusieurs dizaines de mètres selon la météo du jour, mais elle suit bien les changements de hauteur : en montant d'un étage, elle augmente d'environ 3 m.

```cpp file=.external/arduino-steami/examples/WSEN-PADS/altitude/altitude.ino

```

**Comment ça marche** : le capteur ne connaît pas l'altitude, il ne donne qu'une pression. C'est le programme qui la convertit, avec le modèle de l'**atmosphère standard internationale** : une atmosphère de référence à 1013,25 hPa et 15 °C au niveau de la mer, dont la température baisse de 6,5 °C par kilomètre. Dans ce modèle, l'altitude _h_ correspondant à une pression _P_ est :

```text
h = (T0 / L) × (1 − (P / P0)^(R × L / g))
```

avec `P0` = 1013,25 hPa (`seaLevelPressure`), `T0` = 288,15 K, soit 15 °C (`seaLevelTemp`), `L` = 0,0065 K/m (`lapseRate`), `g` = 9,80665 m/s² (`gravity`) et `R` = 287,058 J/(kg·K), la constante de l'air sec (`dryAirGasConst`). Le programme calcule l'exposant une fois pour toutes, `exponent` ≈ 0,1903, et `T0 / L` vaut environ 44 331 m : c'est la formule `44330 × (1 − (P / 1013,25)^0,1903)` qu'utilise aussi `altitude()` de la classe `SteamiPressure`. Par exemple, 1000 hPa donnent environ 111 m. Près du niveau de la mer, un écart de 1 hPa correspond à environ 8 m d'altitude.

La température mesurée n'entre pas dans le calcul : le modèle suppose toujours 15 °C au niveau de la mer.

La pression de référence `P0` est la vraie limite de cet exemple. La pression au niveau de la mer n'est pas toujours de 1013,25 hPa : elle change avec la météo, et chaque hPa d'écart décale l'altitude affichée de 8 m environ. Le commentaire en tête de l'exemple estime ce décalage à environ 80 m : l'altitude affichée est trop basse par temps anticyclonique (haute pression), trop haute par temps dépressionnaire. Pour une altitude juste un jour donné, il faut remplacer `seaLevelPressure` par la pression du jour ramenée au niveau de la mer (le **QNH**), donnée par une station météo proche, puis recompiler l'exemple, par exemple dans un [Codespace](../codespace). Les écarts d'altitude, eux, restent justes sans réglage, tant que la météo ne change pas entre les deux mesures.

<EssayerExemple id="WSEN-PADS/altitude" />

## floor_detector {#floor_detector}

**Ce qu'on observe** : au démarrage, la console écrit `Calibrating reference altitude (floor 0)...`. Pendant une dizaine de secondes, garder la carte immobile, à hauteur constante : la console écrit ensuite l'altitude de référence, par exemple `Reference altitude: 112.3 m`. Cet endroit devient l'étage 0. En emportant la carte un étage plus haut, par l'escalier ou l'ascenseur, la console écrit par exemple `Floor: 1  (Δ=1.8 m)` ; en redescendant, `Floor: 0  (Δ=1.0 m)`. La ligne apparaît dès que l'écart franchit le seuil (voir plus bas), souvent avant d'arriver à l'étage : le Δ affiché est l'écart d'altitude à ce moment-là, pas la hauteur de l'étage. Le programme n'écrit rien tant que l'étage ne change pas.

```cpp file=.external/arduino-steami/examples/WSEN-PADS/floor_detector/floor_detector.ino

```

**Comment ça marche** : l'exemple réutilise la formule de [altitude](#altitude), mais ne s'intéresse qu'à des **écarts d'altitude**. Il commence par une **calibration** : `averageAltitude()` fait la moyenne de 10 mesures (`CALIBRATION_SAMPLES`), qui arrivent une par seconde. Faire la moyenne de plusieurs mesures atténue leurs petites variations d'une seconde à l'autre. Comme l'exemple soustrait cette altitude de référence à chaque mesure, l'erreur due à la pression de référence `P0`, la même pour toutes les mesures, disparaît presque entièrement : pas besoin du QNH ici.

L'écart à la référence, `deltaFromBase`, est ensuite divisé par la hauteur d'un étage, `floorHeight` (2,8 m), et arrondi à l'étage le plus proche. Un étage de 2,8 m ne représente qu'environ 0,34 hPa de différence de pression.

Sans précaution, une carte posée pile à mi-hauteur entre deux étages (1,4 m) changerait d'étage à chaque petite variation de la mesure. L'exemple ajoute donc une **hystérésis** de 0,3 m (`hysteresis`) : avant d'arrondir, il rapproche l'écart de l'étage actuel. Pour passer de l'étage 0 à l'étage 1, l'écart doit atteindre 1,7 m ; pour revenir à l'étage 0, il doit redescendre sous 1,1 m. Entre les deux, l'étage ne change pas. Il en va de même à chaque limite entre deux étages, et aussi en dessous de l'étage 0 : la console peut afficher `Floor: -1`.

La référence est mesurée une seule fois, au démarrage. Si la pression extérieure change avec la météo, l'écart dérive : une baisse d'environ 0,2 hPa (1,7 m d'écart) suffit à faire « monter » la carte d'un étage sans qu'elle bouge. Le comptage reste donc fiable sur un trajet court, pas sur une journée ; pour repartir de l'étage actuel, appuyer sur le bouton Reset de la carte, qui relance la calibration. La hauteur d'étage est à adapter au bâtiment : le commentaire de l'exemple donne 2,7 à 3 m pour un logement, 3,5 à 4 m pour des bureaux.

<EssayerExemple id="WSEN-PADS/floor_detector" />
