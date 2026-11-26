---
title: Exemples WSEN-HIDS
sidebar_label: WSEN-HIDS (humidité)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

# Exemples WSEN-HIDS : capteur d'humidité et de température

Le WSEN-HIDS, de Wurth Elektronik, mesure l'**humidité relative** de l'air et sa **température**. L'humidité relative, en %, compare la vapeur d'eau que contient l'air au maximum qu'il pourrait contenir à cette température : à 100 %, l'air est saturé et l'eau se dépose en gouttes. Le capteur est capacitif : une fine couche qui absorbe plus ou moins de vapeur d'eau change la capacité d'un petit condensateur, que le composant mesure et convertit lui-même en nombre.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Ses caractéristiques, sa fiche technique et son schéma (repère U13) sont sur la page [Capteur d'humidité et température — WSEN-HIDS](/docs/hardware/main-components/sensors/wsen-hids).

Le WSEN-HIDS équipe la **V1b**. Pour la V1a, il figure dans la nomenclature, mais son montage reste à confirmer. Il est retiré sur la **V1c**, où le BME280 mesure l'humidité et la température (voir [Révisions de la carte](/docs/hardware/revisions#capteurs-internes)). Sur une V1c, les quatre exemples de cette page écrivent `WSEN-HIDS not detected — check wiring and I2C address.` puis ne font plus rien : pour la même chose sur une V1c, voir les exemples **STeaMi → BME280**, dont trois portent les mêmes noms (**BasicReader**, **ComfortZone**, **DewPointMonitor**).

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → WSEN-HIDS** de l'Arduino IDE. Ils écrivent leurs messages en anglais et n'utilisent pas l'écran. La page [Capteurs et écran](../capteurs#pression-humidité-et-température) donne la façon la plus simple de lire l'humidité et la température, avec les classes `SteamiHumidity` et `SteamiTemperature`, qui marchent sur les trois releases ; ici, les exemples utilisent directement le driver du composant.

## Le driver en bref

Les quatre exemples suivent le même schéma et n'utilisent que quelques fonctions du driver `SteamiWsenHids` :

- `SteamiWsenHids sensor(Steami.wire());` crée le driver sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, où le capteur répond à l'adresse `0x5F`.
- `begin()` lit le registre d'identité du capteur (`WHO_AM_I`), qui vaut toujours `0xBC` sur un WSEN-HIDS. Si la valeur lue est différente, par exemple parce qu'aucun composant ne répond, `begin()` renvoie `false` et les exemples écrivent `WSEN-HIDS not detected — check wiring and I2C address.` puis attendent sans fin. Sinon, `begin()` remet la moyenne interne à sa valeur par défaut et efface les commandes en cours (mesure unique, chauffage intégré) : le capteur a sa propre alimentation et n'est pas redémarré avec le microcontrôleur, il pourrait donc garder les réglages du programme précédent. Il lit ensuite la calibration d'usine du capteur (voir plus bas), puis le met en veille.
- `deviceId()` renvoie la valeur de ce registre d'identité, `0xBC`.
- `setContinuous(WSEN_HIDS_ODR_1_HZ)` réveille le capteur et lui fait mesurer tout seul, une fois par seconde. Le driver propose aussi 7 et 12,5 mesures par seconde (`WSEN_HIDS_ODR_7_HZ`, `WSEN_HIDS_ODR_12_5_HZ`). Il active en même temps le blocage des registres de sortie pendant une lecture (_Block Data Update_) : les deux octets d'une valeur viennent toujours de la même mesure.
- `dataReady()` lit le registre d'état du capteur et n'est vrai que si ses deux indicateurs, nouvelle humidité et nouvelle température, sont levés.
- `read()` lit l'humidité et la température de la même mesure et les renvoie ensemble : `reading.temperature` en °C, `reading.humidity` en %. Si le capteur est en veille, `read()` le réveille d'abord à 12,5 mesures par seconde et attend une mesure, jusqu'à 200 ms ; si rien n'arrive, il renvoie `NAN` pour les deux valeurs. Dans les exemples, le capteur mesure déjà, et `read()` lit directement ses registres.

Le capteur ne donne pas directement des °C et des % : il donne des nombres bruts. Chaque WSEN-HIDS garde en mémoire deux points de référence pour l'humidité et deux pour la température, mesurés en usine. `begin()` les lit, et `read()` convertit chaque nombre brut en traçant une droite entre ces deux points. L'humidité ainsi calculée est ramenée entre 0 et 100 %.

Deux points comptent pour comprendre les exemples :

- La moyenne remise par `begin()` est celle du démarrage du capteur : d'après le driver, chaque valeur donnée est la moyenne de 16 mesures internes pour la température et de 32 pour l'humidité. Le driver permet de la changer (`setAveraging()`), mais les exemples ne le font pas.
- Les exemples lisent la mesure du capteur sans la calibration de la température enregistrée dans la zone de configuration du DAPLink, contrairement à `SteamiTemperature` (voir [Capteurs et écran](../capteurs#pression-humidité-et-température)). Le driver permet d'ajouter un décalage (`setTemperatureOffset()`) ou une correction sur deux points (`calibrateTemperature()`), que les exemples n'utilisent pas non plus.

## BasicReader {#basicreader}

**Ce qu'on observe** : la console écrit `WSEN-HIDS detected (WHO_AM_I = 0xBC)`, puis, environ une fois par seconde, la température et l'humidité, par exemple `T = 22.41 C  |  H = 46.3 %`. En soufflant doucement sur la carte, l'humidité monte, puis redescend en quelques secondes.

```cpp file=.external/arduino-steami/examples/WSEN-HIDS/BasicReader/BasicReader.ino

```

**Comment ça marche** : c'est le squelette des quatre exemples. Dans `setup()`, `begin()` vérifie le capteur, `deviceId()` affiche son identité, et `setContinuous(WSEN_HIDS_ODR_1_HZ)` le met en mesure continue, une fois par seconde. Dans `loop()`, le programme demande toutes les 10 ms si une mesure est prête ; quand c'est le cas, il la lit avec `read()`, l'affiche, puis attend une seconde. Pendant cette seconde, le capteur a fait la mesure suivante : le test `dataReady()` suivant est le plus souvent vrai tout de suite, et la console reçoit une ligne par seconde environ.

`read()` lit les deux grandeurs d'un coup, plutôt que `temperature()` puis `humidity()`, qui feraient chacune leur propre lecture : la température et l'humidité affichées viennent ainsi de la même mesure.

<EssayerExemple id="WSEN-HIDS/BasicReader" />

## HumidityAlert {#humidityalert}

**Ce qu'on observe** : la console affiche la température et l'humidité, environ une fois par seconde. Quand l'humidité dépasse 70 %, par exemple en soufflant sur la carte, la console écrit en plus `Warning: humidity too high (mold risk).` et le buzzer fait deux bips ; il recommence à chaque mesure, tant que l'humidité reste au-dessus de 70 %.

```cpp file=.external/arduino-steami/examples/WSEN-HIDS/HumidityAlert/HumidityAlert.ino

```

**Comment ça marche** : c'est BasicReader avec un seuil. À chaque mesure, le programme compare l'humidité à `HUMIDITY_THRESHOLD` (bipe si `humidity > 70`). Le code y voit un risque de moisissures : dans une pièce où l'air reste longtemps aussi humide, l'eau peut se déposer sur les murs froids.

`buzzAlert()` joue deux bips de 200 ms à 1500 Hz. `tone(SPEAKER, 1500, 200)` lance un bip qui s'arrête tout seul, sans bloquer le programme (voir [Jouer un son](../premiers-programmes#jouer-un-son)) : c'est le `delay(300)` qui sépare les deux bips, avec 100 ms de silence entre eux.

<EssayerExemple id="WSEN-HIDS/HumidityAlert" />

## ComfortZone {#comfortzone}

**Ce qu'on observe** : la console écrit `Comfort zone monitor started.`, puis, environ une fois par seconde, la mesure suivie d'un verdict sur la pièce, par exemple `T = 22.41 C  |  H = 46.3 %  ->  Comfortable`. Le verdict est l'un de `Comfortable`, `Too cold`, `Too hot`, `Too dry` ou `Too humid`.

```cpp file=.external/arduino-steami/examples/WSEN-HIDS/ComfortZone/ComfortZone.ino

```

**Comment ça marche** : le capteur ne donne que deux nombres ; c'est `classifyComfort()` qui les place dans une zone de confort, un rectangle de températures et d'humidités jugées agréables à l'intérieur : de 18 à 26 °C et de 30 à 65 % d'humidité, limites comprises. Ces bornes sont celles choisies par l'exemple pour une pièce de climat tempéré.

La fonction ne donne qu'un verdict, et l'ordre des tests compte : la température est testée en premier. À 15 °C et 80 % d'humidité, le verdict est `Too cold`, sans mention de l'humidité. `Too dry` ou `Too humid` n'apparaissent que si la température est dans la zone.

<EssayerExemple id="WSEN-HIDS/ComfortZone" />

## DewPointMonitor {#dewpointmonitor}

**Ce qu'on observe** : la console écrit `Dew point monitor started.`, puis, environ une fois par seconde, la température, l'humidité et le **point de rosée**, par exemple `T = 20.00 C  |  H = 50.0 %  |  Td = 9.25 C`. Quand l'air est presque saturé, la console écrit en plus `Condensation risk is high.` et le buzzer fait un bip court, à chaque mesure.

```cpp file=.external/arduino-steami/examples/WSEN-HIDS/DewPointMonitor/DewPointMonitor.ino

```

**Comment ça marche** : le point de rosée `Td` est la température à laquelle il faudrait refroidir l'air pour qu'il soit saturé : toute surface plus froide que lui se couvre de buée. Avec 50 % d'humidité à 20 °C, il vaut environ 9 °C : un verre sorti du réfrigérateur s'embue, une bouteille à température ambiante non.

Le capteur ne mesure pas le point de rosée : `computeDewPoint()` le calcule à partir de la température `T` (en °C) et de l'humidité `RH` (en %), avec l'approximation de Magnus-Tetens :

- `γ = 17,27 × T / (237,7 + T) + ln(RH / 100)`
- `Td = 237,7 × γ / (17,27 − γ)`

Le logarithme n'existe pas pour une humidité nulle : le programme remplace toute humidité inférieure à 0,001 % par 0,001 % avant le calcul.

L'alerte se déclenche quand l'écart `T − Td` passe sous 2 °C : l'air est alors si près de la saturation qu'une surface à peine plus froide que lui, comme une vitre, se couvre de buée. D'après la formule, cela correspond à une humidité d'environ 88 % entre 15 et 25 °C : bien plus que le seuil de [HumidityAlert](#humidityalert). Le bip, `tone(SPEAKER, 2000, 150)`, dure 150 ms à 2000 Hz.

<EssayerExemple id="WSEN-HIDS/DewPointMonitor" />
