---
title: Exemples STEAMI_BOARD
sidebar_label: STEAMI_BOARD (classes par fonction)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore colour vline -->

# Exemples STEAMI_BOARD : classes par fonction

Les exemples STEAMI_BOARD ne portent pas sur un composant : ils montrent les **classes par fonction** de la bibliothèque STeaMi, comme `SteamiTemperature` ou `SteamiCompass`. Chaque classe mesure une grandeur (température, distance, cap…), ou dessine sur l'écran pour `SteamiDisplay` et `SteamiScreen`, et choisit elle-même le composant qui la sert sur la carte : le même programme tourne sur une V1a, une V1b ou une V1c.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Les composants changent d'une release à l'autre (voir [Révisions de la carte](/docs/hardware/revisions)). Sur la V1c, le BME280 mesure à lui seul la température, l'humidité et la pression, que se partagent le WSEN-HIDS et le WSEN-PADS sur la V1a et la V1b. Les autres composants de ces exemples sont sur les trois releases : l'ISM330DLC (mouvement), que la bibliothèque et la console appellent `ISM330DL`, le LIS2MDL (champ magnétique), le VL53L1X (distance), la jauge de batterie BQ27441 et l'extenseur MCP23009E du D-PAD. L'écran change lui aussi : un OLED de 128 × 128 pixels en niveaux de gris (SSD1327) sur la V1a et la V1b, un TFT couleur de 240 × 240 pixels (GC9A01) sur la V1c. Seuls **Light**, **Color** et **Gesture** demandent l'APDS-9960, prévu sur la V1a et la V1b et absent de la V1c : sur une V1c, ils montrent comment une classe signale une fonction absente. Les vingt-deux autres exemples marchent sur toutes les cartes : **ScreenGraph** et **WeatherStation** se servent de l'APDS-9960 quand la carte en a un, et s'en passent sur une V1c.

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → STEAMI_BOARD** de l'Arduino IDE. Ils écrivent leurs messages en anglais. Tous, sauf **Drawing**, **WeatherStation** et ceux dont le nom commence par **Screen**, laissent l'écran de côté : il garde l'image laissée par le programme précédent, ce n'est pas une panne. Les exemples **Screen…** et **WeatherStation** utilisent la classe `SteamiScreen`, et demandent une version récente de la bibliothèque : 0.38.0 pour ScreenTemperature, ScreenBattery et ScreenComfort, 0.40.0 pour les widgets ronds de ScreenGauge, ScreenCompass, ScreenWatch et ScreenFaces, 0.41.0 pour le graphe et le menu de ScreenGraph, ScreenMenu et WeatherStation, ou une version plus récente (voir l'encart « Version de la bibliothèque » de [Reconnaître la carte](../carte)). Depuis la version 0.40.0, le texte de l'écran de la V1c s'écrit dans la police Spleen, plus haute et avec les accents : les photos de cette page la montrent. La page [Capteurs et écran](../capteurs) détaille chaque classe et [Reconnaître la carte](../carte) ce qu'elles ont en commun ; cette page-ci explique ce que montre chaque exemple. Les pages d'exemples par composant, comme [VL53L1X](./vl53l1x), utilisent au contraire directement le driver du composant.

## Le driver en bref

Ces exemples n'appellent pas le driver d'un composant : ils passent par une classe par fonction, qui utilise le driver partagé de l'objet `Steami` (voir [Un programme pour toutes les cartes](../carte#un-programme-pour-toutes-les-cartes)). Ils suivent tous le même schéma :

- `SteamiTemperature temperature;` crée la classe en variable globale, sans toucher au matériel.
- `begin()`, dans `setup()`, reconnaît d'abord la release de la carte, une seule fois pour tout le programme : par le code de révision de la zone de configuration du DAPLink, sinon en interrogeant les capteurs (voir [Comment la carte est reconnue](../carte#comment-la-carte-est-reconnue)). La bibliothèque écrit alors la première ligne de la console, par exemple `[STeaMi] Board V1c (read from the board config, revision 131)` ou `[STeaMi] Board V1c (detected: BME280 at 0x76)`. `begin()` essaie ensuite le ou les composants qui servent la fonction sur cette release, garde le premier qui répond, lui applique la calibration de la zone de configuration s'il y en a une, et renvoie `true`.
- `chip()` donne le nom du composant retenu : chaque exemple l'écrit, par exemple `Temperature sensor: BME280`.
- Si `begin()` renvoie `false`, la bibliothèque écrit un message codé (voir [Les messages](../carte#les-messages)), puis l'exemple écrit le texte de `error()` : `no answer` quand le composant ne répond pas, `not on this board` quand la release n'a pas la fonction.
- Les lectures (`read()`, `heading()`, `percent()`…) renvoient alors une valeur d'absence : `NAN` (affiché `nan`), `-1`, `0` ou `false` selon la classe (voir [Quand une fonction manque](../carte#quand-une-fonction-manque)). Une fonction qui a échoué n'est pas réessayée avant le redémarrage de la carte.

Chaque appel de lecture interroge le composant : deux appels à la suite, comme `read()` puis `strength()`, font deux mesures distinctes. Les lignes de démarrage ne s'écrivent qu'une fois : pour les relire, appuyer sur le bouton Reset de la carte.

`SteamiDisplay`, la classe de l'écran, suit le même schéma avec deux différences. Elle n'a pas de `chip()`. Et son `error()` vaut `unknown board` quand la release reste inconnue, `no memory` quand l'image de l'écran ne tient pas en mémoire ; après un échec, ses fonctions de dessin et `show()` ne font rien. L'exemple [Drawing](#drawing) la détaille. `SteamiScreen` est une `SteamiDisplay` qui place elle-même titres, valeurs, barres et widgets ronds sur l'écran rond : les exemples [ScreenTemperature](#screentemperature), [ScreenBattery](#screenbattery), [ScreenComfort](#screencomfort), [ScreenGauge](#screengauge), [ScreenCompass](#screencompass), [ScreenWatch](#screenwatch), [ScreenFaces](#screenfaces), [ScreenGraph](#screengraph), [ScreenMenu](#screenmenu) et [WeatherStation](#weatherstation) s'en servent.

## Temperature {#temperature}

**Ce qu'on observe** : la console écrit le capteur utilisé, `Temperature sensor: BME280` sur une V1c, puis la température une fois par seconde, par exemple `23.4 C`.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Temperature/Temperature.ino

```

**Comment ça marche** : sur une V1c, `SteamiTemperature` utilise le [BME280](/docs/hardware/main-components/sensors/bme280). Sur une V1a ou une V1b, elle essaie le [WSEN-HIDS](/docs/hardware/main-components/sensors/wsen-hids), puis le [WSEN-PADS](/docs/hardware/main-components/sensors/wsen-pads) si le premier ne répond pas : les deux mesurent aussi la température. Le reste du programme est le même sur toutes les cartes ; seul `chip()` dit quel composant a répondu.

`read()` renvoie des degrés Celsius, avec la calibration `tc` de la zone de configuration quand elle existe (voir [Calibrations](../carte#calibrations)), ou `NAN` quand la mesure manque : l'exemple n'écrit alors rien. Le détail de la classe est dans [Pression, humidité et température](../capteurs#pression-humidité-et-température).

<EssayerExemple id="STEAMI_BOARD/Temperature" />

## Humidity {#humidity}

**Ce qu'on observe** : `Humidity sensor: BME280` sur une V1c, puis l'humidité une fois par seconde, par exemple `45.2 %RH`.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Humidity/Humidity.ino

```

**Comment ça marche** : `SteamiHumidity` utilise le BME280 sur une V1c et le WSEN-HIDS sur une V1a ou une V1b ; il n'y a pas de second choix, le WSEN-PADS ne mesurant pas l'humidité. `read()` donne l'**humidité relative**, en % (`%RH`) : la quantité de vapeur d'eau dans l'air, rapportée au maximum que l'air peut contenir à sa température. Elle change donc avec la température, même sans apport d'eau. Comme pour la température, une lecture manquée (`NAN`) n'écrit rien.

<EssayerExemple id="STEAMI_BOARD/Humidity" />

## Pressure {#pressure}

**Ce qu'on observe** : `Pressure sensor: BME280` sur une V1c, puis chaque seconde la pression et l'altitude qu'on en déduit, par exemple `1008.4 hPa, 41 m`.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Pressure/Pressure.ino

```

**Comment ça marche** : `SteamiPressure` utilise le BME280 sur une V1c et le WSEN-PADS sur une V1a ou une V1b. `read()` donne la pression de l'air en hectopascals. `altitude()` refait une mesure et la convertit en mètres, avec la même formule sur toutes les releases : `44330 × (1 − (P / 1013,25)^0,1903)`, où 1013,25 hPa est la pression standard au niveau de la mer.

Cette altitude n'est qu'une estimation : la pression au niveau de la mer change avec la météo, de plusieurs hectopascals d'un jour à l'autre, et près du niveau de la mer 1 hPa correspond à environ 8 m. L'altitude affichée peut donc être fausse de plusieurs dizaines de mètres et varier dans la journée sans que la carte bouge. `altitude(1020.0)`, avec la pression du jour ramenée au niveau de la mer, donne une meilleure estimation (voir [Pression, humidité et température](../capteurs#pression-humidité-et-température)).

<EssayerExemple id="STEAMI_BOARD/Pressure" />

## Distance {#distance}

**Ce qu'on observe** : `Distance sensor: VL53L1X`, puis une distance chaque seconde, par exemple `182 mm (18.2 cm)`. La main qui s'approche du capteur, sur le bord de la partie ronde à droite de l'écran, fait baisser la valeur. `no result` s'affiche quand le capteur ne donne pas de mesure à temps.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Distance/Distance.ino

```

**Comment ça marche** : `SteamiDistance` utilise le VL53L1X, présent sur les trois releases. `read()` appelle `distanceMm()` du driver (voir [le driver VL53L1X](./vl53l1x#le-driver-en-bref)) et renvoie des millimètres, ou `-1` quand le capteur ne répond pas ou que l'attente du driver expire. `cm()` divise par 10 le résultat d'un nouveau `read()` : les deux nombres d'une ligne viennent de deux mesures successives et peuvent différer de quelques millimètres.

Quand rien n'est à portée, `read()` renvoie quand même un nombre, qui n'est pas fiable : le driver ne tient pas compte de l'état de la mesure. Les exemples de la page [VL53L1X](./vl53l1x) vont plus loin avec ce capteur (alarme, radar de recul, compteur de passages).

<EssayerExemple id="STEAMI_BOARD/Distance" />

## Battery {#battery}

**Ce qu'on observe** : `Battery gauge: BQ27441`, puis chaque seconde la charge, la tension et le courant, par exemple `87 %, 3.95 V, 120 mA (charging)`. Le courant est positif pendant la charge, avec `(charging)` en fin de ligne.

Sans batterie, la console écrit `[STeaMi] SteamiBattery: the BQ27441 battery gauge (I2C 0x55) did not answer. Plug in a battery, then reset the board. (E10)`, puis `No battery gauge: no answer`, et plus rien ensuite. Brancher la batterie, puis appuyer sur le bouton Reset.

**Matériel** : une batterie branchée sur la carte.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Battery/Battery.ino

```

**Comment ça marche** : `SteamiBattery` utilise la [jauge BQ27441](/docs/hardware/main-components/power/bq27441), présente sur les trois releases. La jauge est alimentée par la batterie : sans elle, elle ne répond pas. C'est pourquoi la boucle teste `isAvailable()` avant d'écrire : sans jauge, elle n'écrit rien.

La jauge mesure elle-même la tension et le courant de la batterie, et en déduit la charge restante. `percent()` lit cette charge estimée, en % ; `voltage()` la tension, en volts ; `current()` le courant moyen, en milliampères. `isCharging()` refait une lecture du courant et renvoie `true` quand il est positif. Voir aussi [Batterie](../capteurs#batterie).

<EssayerExemple id="STEAMI_BOARD/Battery" />

## Accelerometer {#accelerometer}

**Ce qu'on observe** : `Accelerometer: ISM330DL`, puis cinq fois par seconde l'accélération sur les trois axes et sa norme, par exemple `x=0.01 y=-0.02 z=-1.00 g, strength 1.00`. Carte posée à plat, écran vers le haut, z vaut environ −1 g ; en penchant la carte, cette valeur passe sur x ou y, mais la norme reste proche de 1 g. Une secousse franche ajoute `SHAKEN` en fin de ligne.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Accelerometer/Accelerometer.ino

```

**Comment ça marche** : `SteamiAccelerometer` utilise l'[ISM330DLC](/docs/hardware/main-components/sensors/ism330dlc), présent sur les trois releases. Un accéléromètre mesure aussi la pesanteur : au repos, il ne mesure qu'elle, 1 g, dans la direction du sol. C'est ce qui permet de connaître l'inclinaison de la carte.

`begin()` règle le capteur sur ±8 g, à 104 mesures par seconde. Sur la plage de ±2 g que le driver choisit seul, chaque axe plafonnerait à 2 g et une forte secousse serait en grande partie masquée : ±8 g laisse la place de la mesurer. `read()` renvoie les trois axes dans un `SteamiVector`, avec la calibration `ca` de la zone de configuration si elle existe. `strength()` refait une mesure et en calcule la norme, `√(x² + y² + z²)` ; `isShaken()` en refait une troisième et vaut `true` au-dessus de 2 g. `SHAKEN` peut donc apparaître sur une ligne dont la norme affichée est inférieure à 2. Voir aussi [Mouvement](../capteurs#mouvement--accéléromètre-et-gyroscope).

<EssayerExemple id="STEAMI_BOARD/Accelerometer" />

## Gyroscope {#gyroscope}

**Ce qu'on observe** : `Gyroscope: ISM330DL`, puis cinq fois par seconde la vitesse de rotation autour des trois axes, par exemple `x=0.3 y=-0.2 z=0.1 dps`. Au repos, les valeurs restent proches de 0. En faisant tourner la carte posée à plat sur la table, z s'écarte de 0, puis revient près de 0 dès que la carte s'arrête.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Gyroscope/Gyroscope.ino

```

**Comment ça marche** : `SteamiGyroscope` utilise le même ISM330DLC que `SteamiAccelerometer`. Un gyroscope mesure une vitesse de rotation, en degrés par seconde (`dps`), et non un angle : une carte immobile, même penchée, donne des valeurs proches de 0. La classe garde le réglage du driver, ±250 degrés par seconde à 104 mesures par seconde : une rotation plus rapide dépasse la plage du capteur. Aucune calibration n'est appliquée au gyroscope : au repos, les valeurs ne sont pas exactement 0.

<EssayerExemple id="STEAMI_BOARD/Gyroscope" />

## Buttons {#buttons}

**Ce qu'on observe** : `Buttons ready.`, puis une ligne à chaque appui et à chaque relâchement des sept boutons : `A pressed`, `A released`, `UP pressed`… Un bouton maintenu n'écrit qu'une ligne `pressed`, puis `released` quand on le lâche. Un bouton déjà enfoncé au démarrage ne compte pas comme un appui : s'il est relâché ensuite, seule la ligne `released` s'écrit. Le bouton Reset ne fait pas partie des sept : il redémarre la carte.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Buttons/Buttons.ino

```

**Comment ça marche** : `SteamiButtons` lit A, B et MENU directement sur des broches du microcontrôleur, et les quatre flèches du D-PAD (`UP`, `DOWN`, `LEFT`, `RIGHT`) par l'extenseur MCP23009E, sur le bus I²C interne (voir [Boutons et buzzer](/docs/hardware/main-components/buttons-audio)). Le câblage est le même sur les trois releases.

`wasPressed()` ne renvoie `true` qu'une fois par appui : la classe retient l'appui, et l'appel le « consomme ». `wasReleased()` fait de même pour le relâchement. Chaque appel lit l'état des boutons, et un appui n'est vu que si un appel tombe pendant qu'il dure : la boucle lit tous les boutons puis n'attend que 5 ms, alors qu'une tape brève dure environ 100 ms. Un contact mécanique rebondit : la classe prend un changement d'état tout de suite, puis ignore les suivants pendant 20 ms, si bien qu'un appui ne compte qu'une fois.

Si l'extenseur ne répond pas, la console écrit `D-PAD unavailable: no answer` après le message `E10` : A, B et MENU marchent quand même, et les flèches restent relâchées. Voir aussi [Boutons et D-PAD](../capteurs#boutons-et-d-pad).

<EssayerExemple id="STEAMI_BOARD/Buttons" />

## Magnetometer {#magnetometer}

**Ce qu'on observe** : `Magnetometer: LIS2MDL. Press MENU to calibrate (12 s).`, puis deux fois par seconde le champ magnétique sur les trois axes et son intensité, par exemple `x=12.3 y=-40.1 z=-55.6 uT, strength 69.6`. Avant calibration, ces valeurs contiennent le champ propre de la carte et peuvent dépasser de loin le champ terrestre (25 à 65 µT).

Après un appui sur MENU, la console écrit `Calibrating: turn the board in every direction...` : tourner lentement la carte dans tous les sens pendant 12 secondes, jusqu'à `Calibration done.`. Loin des aimants et des objets métalliques, l'intensité vaut ensuite environ 25 à 65 µT ; elle change quand un aimant ou un objet en acier s'approche.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Magnetometer/Magnetometer.ino

```

**Comment ça marche** : `SteamiMagnetometer` utilise le [LIS2MDL](/docs/hardware/main-components/sensors/lis2mdl), présent sur les trois releases. `read()` convertit les valeurs brutes du capteur en microteslas (0,15 µT par unité) et retire le décalage dû au champ propre de la carte ; `strength()` refait une mesure et en calcule la norme.

Ce champ propre tourne avec la carte, alors que le champ terrestre garde sa direction. Pendant `calibrate(12)`, la classe fait 600 mesures, séparées par une pause de 20 ms, et retient le minimum et le maximum de chaque axe : leur milieu est le décalage dû à la carte. Pendant la calibration, un peu plus de 12 secondes, le programme est bloqué : il n'écrit rien et ne lit pas les boutons. La calibration reste en mémoire vive et se perd au redémarrage ; une calibration `cm` enregistrée dans la zone de configuration est, elle, appliquée par `begin()` (voir [Calibrations](../carte#calibrations)).

Pour ne pas manquer un appui sur MENU, la boucle ne s'endort pas une demi-seconde : elle lit le bouton toutes les 5 ms environ et n'écrit une ligne que si 500 ms se sont écoulées depuis la précédente, d'après `millis()`.

<EssayerExemple id="STEAMI_BOARD/Magnetometer" />

## Compass {#compass}

**Ce qu'on observe** : `Compass ready. Press MENU to calibrate (12 s).`, puis deux fois par seconde le cap de la carte, en degrés, suivi de la direction la plus proche, par exemple `273 deg W`. Tenir la carte à plat, écran vers le haut : le cap vaut 0 quand le haut de l'écran, le côté opposé au connecteur USB, pointe vers le nord, et 90 vers l'est. Sans calibration, le cap est faux : appuyer sur MENU et tourner la carte dans tous les sens pendant 12 secondes, comme pour [Magnetometer](#magnetometer).

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Compass/Compass.ino

```

**Comment ça marche** : `SteamiCompass` utilise le même LIS2MDL que `SteamiMagnetometer`. `heading()` calcule l'angle du champ magnétique dans le plan de la carte, avec la calibration : les décalages, comme pour le magnétomètre, et aussi une échelle par axe. Le cap ne tient pas compte de l'inclinaison : une carte penchée donne un cap faux. Il est compté à partir du nord magnétique, dans le sens des aiguilles d'une montre.

`direction()` refait une mesure et renvoie l'un des huit secteurs de 45° (`N`, `NE`, `E`…) : près d'une limite entre deux secteurs, la direction peut ne pas correspondre au cap écrit juste avant. L'exemple arrondit le cap au degré, puis le ramène sous 360 : 359,6 s'écrit 0. Si le capteur ne répond pas, `heading()` renvoie `NAN` et l'exemple écrit `no heading`. La précision obtenue sur une V1c et la déclinaison magnétique sont décrites dans [Boussole](../capteurs#boussole--magnétomètre).

<EssayerExemple id="STEAMI_BOARD/Compass" />

## Light {#light}

**Ce qu'on observe** : sur une V1a ou une V1b, `Light sensor: APDS-9960`, puis deux fois par seconde un nombre, par exemple `light 152`, qui augmente sous une lampe et diminue quand on masque le capteur.

Sur une V1c, la console écrit `[STeaMi] SteamiLight: this STeaMi is a V1c, it has no light sensor (APDS-9960 is on V1a/V1b only). read() will return 0. (E20)`, puis `No light sensor: not on this board`, et ensuite `light 0` deux fois par seconde.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Light/Light.ino

```

**Comment ça marche** : `SteamiLight` utilise l'[APDS-9960](/docs/hardware/main-components/sensors/apds9960) des V1a et V1b. `read()` renvoie le nombre brut de son canal « clair », une photodiode sans filtre de couleur : ce n'est pas une valeur en lux, mais il augmente avec la lumière reçue. Le premier `read()` met en marche la mesure de lumière et attend son premier résultat, une demi-seconde au plus.

Sur une V1c, `begin()` sait par la release que la fonction manque : il écrit le message `E20` sans chercher l'APDS-9960 sur le bus I²C. `read()` renvoie ensuite `0`, qu'on ne distingue pas de l'obscurité totale : pour les séparer, tester `isAvailable()`, ou `Steami.has(SteamiFunction::LIGHT)` (voir [Lumière, couleur et gestes](../capteurs#lumière-couleur-et-gestes)).

<EssayerExemple id="STEAMI_BOARD/Light" />

## Color {#color}

**Ce qu'on observe** : sur une V1a ou une V1b, `Colour sensor: APDS-9960`, puis deux fois par seconde trois nombres, par exemple `r=120 g=98 b=75`. Sur une V1c, la console écrit le message `E20` de `SteamiColor`, puis `No colour sensor: not on this board`, et ensuite `no result` deux fois par seconde.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Color/Color.ino

```

**Comment ça marche** : `SteamiColor` utilise le même APDS-9960 que `SteamiLight`. `read(r, g, b)` remplit les nombres bruts de trois photodiodes placées derrière un filtre rouge, vert et bleu, et renvoie `true`. Contrairement à `SteamiLight`, elle renvoie `false`, avec trois `0`, quand la mesure manque : l'exemple peut écrire `no result`.

Les trois nombres augmentent tous avec la quantité de lumière : c'est leur proportion qui renseigne sur la couleur, pas leur valeur. La classe offre aussi `rgb()`, qui divise les trois nombres par le plus grand et les ramène entre 0 et 255. La lecture se fige pendant que `SteamiGesture` suit une main, ce qui ne concerne que les programmes qui utilisent aussi cette classe.

<EssayerExemple id="STEAMI_BOARD/Color" />

## Gesture {#gesture}

**Ce qu'on observe** : sur une V1a ou une V1b, `Gesture sensor: APDS-9960`, puis une ligne à chaque geste reconnu quand une main balaie le capteur : `LEFT`, `RIGHT`, `UP` ou `DOWN`. Rien ne s'écrit tant qu'il n'y a pas de geste. Sur une V1c, la console écrit le message `E20` de `SteamiGesture`, puis `No gesture sensor: not on this board`, et plus rien ensuite.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Gesture/Gesture.ino

```

**Comment ça marche** : `SteamiGesture` utilise le même APDS-9960 que les deux exemples précédents. `begin()` met en marche son mode gestes : le capteur éclaire en infrarouge et mesure la lumière renvoyée par la main sur quatre photodiodes, haut, bas, gauche et droite. Le driver compare l'équilibre haut-bas et gauche-droite au début et à la fin du passage de la main : la façon dont il change donne la direction.

Le driver connaît aussi `NEAR` et `FAR`, que cite le commentaire en tête de l'exemple, mais il ne les donne qu'après au moins douze lots de mesures où cet équilibre change à peine, séparés par une pause de 30 ms. Or `read(200)` lit sept lots au plus et remet ces compteurs à zéro à chaque appel : avec cet exemple, `NEAR` et `FAR` ne peuvent pas apparaître.

`read(200)` renvoie `NONE` tout de suite s'il n'y a pas de geste en cours, sans attendre qu'un geste commence ; sinon, il suit le geste pendant 200 ms au plus. La boucle l'appelle donc sans pause. Pendant qu'une main est suivie, la lumière et la couleur ne sont plus mesurées. Le décodage des gestes n'a pas encore été vérifié sur une carte (voir [Lumière, couleur et gestes](../capteurs#lumière-couleur-et-gestes)).

<EssayerExemple id="STEAMI_BOARD/Gesture" />

## Drawing {#drawing}

**Ce qu'on observe** : l'écran affiche une galerie de formes, centrée sur la partie ronde de la carte. Un cercle gris foncé suit le bord de l'écran, et une jauge en arc de cercle, ouverte vers le bas, est remplie de vert sur sa moitié gauche. En haut, `STeaMi` s'écrit en blanc et, juste en dessous, `20°C é` en jaune. Au milieu, un rectangle bleu dans un cadre gris clair, à gauche, fait face à un disque rouge, à droite. En bas, un trait gris horizontal passe au-dessus d'un triangle jaune pointe en haut. Sur une V1c, ces formes sont en couleur ; sur une V1a ou une V1b, la même scène s'affiche en niveaux de gris, à la taille de l'écran, et la seconde ligne s'écrit `20°C e`, sans accent.

L'image ne change plus ensuite. Après la ligne de la release, par exemple `[STeaMi] Board V1c (read from the board config, revision 131)`, la console écrit toutes les deux secondes le temps mis à envoyer l'image à l'écran, en microsecondes : `show(): <durée> us`.

![Écran rond d'une V1c pendant l'exemple Drawing : à gauche, un arc vert clair, prolongé à droite par le fond gris foncé de la jauge ; en haut, STeaMi en blanc et 20°C é en jaune ; au milieu, un rectangle bleu à gauche et un disque rouge à droite, au-dessus d'un trait gris ; en bas, un triangle jaune pointe en haut](/img/software/arduino/steami-board-screen-drawing.jpg)

Sur la photo, prise avec une webcam, le fond gris foncé de la jauge se devine à droite, à la suite de l'arc vert.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Drawing/Drawing.ino

```

**Comment ça marche** : `SteamiDisplay screen;` crée la classe de l'écran, sans toucher au matériel. `screen.begin()` reconnaît la release, comme les autres classes, puis choisit l'écran de cette release : le GC9A01 sur une V1c (voir les [exemples GC9A01](./gc9a01)), le SSD1327 sur une V1a ou une V1b (voir les [exemples SSD1327](./ssd1327)). Il démarre l'écran avec une image en mémoire vive, sur laquelle se fait le dessin : 115 200 octets d'un seul bloc sur une V1c, 8 192 octets sur une V1a ou une V1b. C'est pourquoi l'exemple appelle `screen.begin()` au tout début de `setup()`, tant que la mémoire est encore libre.

Les coordonnées sont les pixels de l'écran : `(0, 0)` en haut à gauche, `x` vers la droite, `y` vers le bas. `centerX()`, `centerY()` et `radius()` donnent le centre et le rayon de l'écran rond : `(120, 120)` et 120 sur une V1c, `(64, 64)` et 64 sur une V1a ou une V1b. Le programme place chaque forme à partir du centre, avec des fractions du rayon `r` : le même code dessine la même scène sur les deux écrans. `s` vaut 2 sur l'écran de 240 pixels et 1 sur celui de 128 pixels : il ne règle que l'épaisseur des traits de la jauge. Le texte, lui, garde la taille de la police de l'écran : des caractères de 8 pixels de large et 16 de haut sur une V1c (la police Spleen, depuis la version 0.40.0 de la bibliothèque), de 8 × 8 pixels sur une V1a ou une V1b. `textWidth()` donne la largeur d'un texte en pixels, en comptant les caractères et non les octets : `°` et `é` occupent deux octets chacun en UTF-8, mais un seul caractère. Le programme s'en sert pour centrer les deux textes. `textHeight()` donne la hauteur d'une ligne, 16 pixels sur une V1c et 8 sur une V1a ou une V1b : la seconde ligne commence une ligne et demie sous la première. Sur une V1c, `é` est dessiné avec son accent ; sur une V1a ou une V1b, la police n'a pas de lettres accentuées et `é` s'affiche `e`. `°` a son propre dessin sur les deux écrans.

Les fonctions de dessin :

- `clear()` remplit l'image de noir.
- `circle(x, y, rayon, couleur)` trace un cercle ; avec `true` en dernier argument, un disque plein.
- `rect(x, y, w, h, couleur)` trace le contour d'un rectangle de `w` pixels de large et `h` de haut, dont le coin en haut à gauche est `(x, y)` ; avec `true`, un rectangle plein.
- `triangle(x0, y0, x1, y1, x2, y2, couleur, true)` remplit le triangle de ces trois sommets.
- `line(x1, y1, x2, y2, couleur)` trace un segment.
- `arc(x, y, rayon, début, étendue, couleur, épaisseur)` trace un morceau d'anneau. Les angles sont en degrés : 0 en haut, comme midi sur une montre, en tournant dans le sens des aiguilles. `rayon` est le bord extérieur, et l'épaisseur va vers l'intérieur. La jauge part de 225°, en bas à gauche : le fond, gris très foncé, s'étend sur 270° jusqu'en bas à droite ; le vert, sur 135°, s'arrête en haut.
- `text(texte, x, y, couleur)` écrit un texte dont le coin en haut à gauche du premier caractère est `(x, y)`. Un dernier argument facultatif, l'échelle (1 par défaut), l'agrandit autant de fois.
- `textHeight()` renvoie la hauteur d'une ligne de texte en pixels : 8 fois l'échelle sur l'écran de 128 pixels, 16 fois sur celui de 240. Pour empiler des lignes, elle remplace une hauteur écrite en dur, qui ne serait juste que sur un des deux écrans.

Ce qui dépasse de l'écran est coupé, sans erreur. Les couleurs sont des constantes `SteamiRgb` : `STEAMI_WHITE`, `STEAMI_GREEN`, `STEAMI_RED`… Sur une V1c, elles s'affichent telles quelles. Sur une V1a ou une V1b, chacune devient l'un des 16 niveaux de gris, d'après sa luminosité : le jaune et le vert, clairs, ressortent plus que le rouge et le bleu.

Comme avec les drivers des écrans, le dessin se fait dans l'image en mémoire, et rien n'apparaît avant `show()`, qui l'envoie en entier. `setup()` dessine la scène une seule fois ; `loop()` renvoie la même image toutes les deux secondes, seulement pour mesurer `show()` avec `micros()`. L'envoi prend au moins 58 ms environ sur une V1c et 8,2 ms sur une V1a ou une V1b, dont l'image est 14 fois plus petite.

Si `begin()` échoue, la bibliothèque écrit un message codé, puis l'exemple écrit `No screen:` suivi du texte de `error()`, et plus rien ensuite. Quand la release reste inconnue (message `E01`), le message est `[STeaMi] SteamiDisplay: cannot tell if this board is a V1a/V1b or a V1c. Add #define STEAMI_BOARD_V1C (or V1B) before #include <STeaMi.h>. (E30)`, puis `No screen: unknown board` : forcer la release (voir [Forcer la release](../carte#forcer-la-release)). Quand l'image de la V1c ne trouve pas 115 200 octets d'un seul bloc, le message est `E31`, puis `No screen: no memory`. Dans les deux cas, `loop()` teste `isAvailable()` et ne fait rien.

Cet exemple marche sur les trois releases. Les exemples GC9A01 et SSD1327, eux, appellent directement le driver de leur écran et ne marchent que sur leur release.

<EssayerExemple id="STEAMI_BOARD/Drawing" />

## ScreenTemperature {#screentemperature}

**Ce qu'on observe** : l'écran affiche `Temperature` en gris en haut, la température en grands chiffres blancs au centre, par exemple `21.6`, avec `°C` en gris clair juste en dessous, et le nom du capteur en gris foncé en bas : `BME280` sur une V1c. L'image est refaite deux fois par seconde. Sur une V1a ou une V1b, la même disposition s'affiche en niveaux de gris sur l'écran de 128 pixels, avec `WSEN-HIDS` en bas.

L'exemple n'écrit rien dans la console. Seule la bibliothèque y écrit la ligne de la release, par exemple `[STeaMi] Board V1c (read from the board config, revision 131)`, puis un message codé si l'écran ou le capteur manque.

![Écran rond d'une V1c pendant l'exemple ScreenTemperature : Temperature en gris en haut, 21.6 en grands chiffres blancs au centre, °C juste en dessous et BME280 en gris foncé en bas](/img/software/arduino/steami-board-screen-temperature.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenTemperature/ScreenTemperature.ino

```

**Comment ça marche** : `SteamiScreen` est une `SteamiDisplay` : `begin()`, `clear()`, `show()` et les fonctions de dessin de [Drawing](#drawing) s'utilisent de la même façon, et `screen.begin()` vient aussi au tout début de `setup()`, tant que la mémoire est encore libre (voir [Drawing](#drawing)). La classe ajoute des fonctions de mise en page, qui calculent elles-mêmes leur place sur l'écran rond : le programme ne donne aucune coordonnée. Chaque tour de `loop()` refait toute l'image : `clear()` la remplit de noir, les fonctions dessinent dans l'ordre des appels, puis `show()` l'envoie à l'écran.

- `title("Temperature")` écrit une ligne centrée en haut de l'écran, en gris (`STEAMI_GRAY`) par défaut.
- `value(temperature.read(), "°C")` écrit la valeur au centre de l'écran, en blanc, et son unité centrée en dessous, en gris clair. Un nombre à virgule (`float`) s'écrit avec un chiffre après le point, comme `27.2` ; `screen.setDecimals(2)` en donne deux, et 4 au plus. `NAN`, que `read()` renvoie quand la mesure manque, s'écrit `--`.
- `subtitle(temperature.chip())` écrit le nom du composant en bas, en gris foncé (`STEAMI_DARK`) par défaut.

Les positions et les marges sont données pour l'écran de 128 pixels, puis agrandies dans le rapport 240/128 sur une V1c, où les caractères sont deux fois plus hauts : 8 × 8 pixels pour le titre, l'unité et le sous-titre sur une V1a ou une V1b, 8 pixels de large et 16 de haut sur une V1c, dans la police Spleen (depuis la version 0.40.0 de la bibliothèque). Les chiffres de la valeur sont encore deux fois plus grands : 16 × 16 pixels sur l'écran de 128, 16 × 32 en gras sur celui de 240. Le même programme donne ainsi la même image sur les deux écrans. Aucun texte ne sort du cercle : une valeur trop large passe à des chiffres plus petits, et un texte qui ne tient toujours pas est coupé, sans points de suspension.

Si le capteur ne répond pas, la console reçoit un message de `SteamiTemperature` : `E11` quand la release vient de la zone de configuration ou d'un `#define` (le cas habituel), `E10` sinon (voir [Les messages](../carte#les-messages)). L'écran affiche `--` à la place de la valeur, sans nom en bas : `chip()` renvoie alors un texte vide, que `subtitle()` n'écrit pas. Si l'écran ne démarre pas, `screen.begin()` écrit les messages `E30` ou `E31` décrits dans [Drawing](#drawing), avec `SteamiScreen` à la place de `SteamiDisplay`, par exemple `[STeaMi] SteamiScreen: not enough RAM for the colour screen (115200 bytes in one block). Call screen.begin() first in setup(). (E31)`. L'exemple ne teste pas ce que renvoie `begin()` : après un échec, les fonctions de l'écran ne font rien et la boucle continue sans rien afficher.

<EssayerExemple id="STEAMI_BOARD/ScreenTemperature" />

## ScreenBattery {#screenbattery}

**Ce qu'on observe** : l'écran affiche `Battery` en haut, puis la charge de la batterie en grands chiffres, par exemple `100`, avec `%` en dessous, et une barre horizontale remplie de vert depuis la gauche, en proportion de la charge. En bas, deux lignes en gris foncé : la tension en millivolts, par exemple `4164 mV`, et `BQ27441`, le nom de la jauge. L'image est refaite chaque seconde. Sur une V1a ou une V1b, la même disposition s'affiche en niveaux de gris sur l'écran de 128 pixels, la partie remplie de la barre en gris clair.

Comme pour [ScreenTemperature](#screentemperature), la console ne reçoit que les lignes de la bibliothèque. Sans batterie, la jauge ne répond pas : la console écrit le message `E10` de `SteamiBattery` (voir [Battery](#battery)), et l'écran affiche `0`, une barre vide, dont seul le fond gris très foncé apparaît, et `--` à la place de la tension. Brancher la batterie, puis appuyer sur le bouton Reset.

![Écran rond d'une V1c pendant l'exemple ScreenBattery : Battery en haut, 100 en grands chiffres blancs, % en dessous, une barre verte pleine sur toute sa largeur, puis 4164 mV et BQ27441 en gris foncé en bas](/img/software/arduino/steami-board-screen-battery.jpg)

**Matériel** : une batterie branchée sur la carte.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenBattery/ScreenBattery.ino

```

**Comment ça marche** : `percent()` renvoie un nombre entier, de 0 à 100 : `value()` l'écrit sans décimale. Sans jauge, il vaut 0, d'où le `0` à l'écran, et non `--`. `voltage()` renvoie la tension en volts, ou `NAN` sans jauge. Le programme prépare lui-même le texte de la première ligne du bas dans `volts` : `snprintf` y écrit la tension arrondie en millivolts, suivie de `mV`, et le texte reste `--` quand la tension vaut `NAN`.

- `value(battery.percent(), "%", SteamiAt::CENTER, nullptr, STEAMI_WHITE, 2, -12)` précise tous les arguments, parce que le décalage vertical vient en dernier : la position (`CENTER`, le centre), l'étiquette (`nullptr` : aucune), la couleur, la taille (2, celle par défaut) et le décalage vertical. Ce décalage, `-12`, remonte la valeur de 12 pixels sur l'écran de 128 pixels, et de 22 sur celui de 240 : comme les positions, il se compte en pixels de l'écran de 128.
- `bar(battery.percent(), 100, -12, STEAMI_GREEN)` trace une barre horizontale centrée, sous le centre de l'écran et remontée du même décalage : 88 × 8 pixels sur l'écran de 128, 165 × 15 sur celui de 240. Son fond est gris très foncé (`STEAMI_GRID_DARK`) ; la partie remplie, en vert, part de la gauche et couvre la fraction `v / maxV` de la largeur, ici la charge sur 100. Une valeur hors de l'intervalle de 0 à `maxV` est ramenée à la borne la plus proche, et `NAN` laisse la barre vide. Sur l'écran en niveaux de gris, la partie remplie est éclaircie au besoin pour rester au moins 4 niveaux au-dessus du fond.
- `subtitle(volts, "BQ27441")` écrit deux lignes centrées en bas ; `subtitle()` en accepte trois au plus. `BQ27441` est un texte fixe du programme : il reste affiché même sans jauge.

Comme tout appel de lecture, chaque `percent()` interroge la jauge : le nombre et la barre viennent de deux lectures successives.

<EssayerExemple id="STEAMI_BOARD/ScreenBattery" />

## ScreenComfort {#screencomfort}

**Ce qu'on observe** : l'écran affiche `Comfort` en haut, puis deux valeurs côte à côte, de part et d'autre d'un trait vertical gris foncé : à gauche, la température, par exemple `21.5`, sous le petit mot `TEMP` et au-dessus de `°C` ; à droite, l'humidité, par exemple `30.6`, sous `HUM` et au-dessus de `%`. En bas, deux lignes en vert : `Comfortable` quand la température est entre 19 et 24 °C et l'humidité entre 40 et 60 %, `Uncomfortable` sinon, puis le nom du capteur d'humidité, `BME280` sur une V1c. L'image est refaite chaque seconde. Sur une V1a ou une V1b, la même disposition s'affiche en niveaux de gris sur l'écran de 128 pixels, avec `WSEN-HIDS` en bas.

La console ne reçoit que les lignes de la bibliothèque. Si un capteur ne répond pas, elle reçoit le message `E11` ou `E10` de sa classe, selon d'où vient la release, comme pour [ScreenTemperature](#screentemperature), et l'écran affiche `--` à la place de sa valeur et `Uncomfortable` ; sans capteur d'humidité, le nom du capteur n'apparaît pas.

![Écran rond d'une V1c pendant l'exemple ScreenComfort : Comfort en haut ; à gauche d'un trait vertical, TEMP, 21.5 et °C ; à droite, HUM, 30.6 et % ; en bas, Uncomfortable et BME280 en vert](/img/software/arduino/steami-board-screen-comfort.jpg)

Sur la photo, l'humidité de 30,6 % est sous 40 % : l'écran affiche `Uncomfortable`.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenComfort/ScreenComfort.ino

```

**Comment ça marche** : le programme lit une seule fois la température et l'humidité à chaque tour, dans `t` et `h` : l'écran et le test du confort utilisent les mêmes mesures. Ce test vaut `false` quand une mesure manque, car toute comparaison avec `NAN` est fausse : l'écran affiche alors `Uncomfortable`.

- `vline(x, y, h, couleur)` est une fonction de dessin de `SteamiDisplay` : elle trace un trait vertical de `h` pixels, de `(x, y)` vers le bas. Ici, le trait est sur la colonne du centre, part d'un demi-rayon au-dessus du centre et mesure un rayon : il est centré, et calculé à partir de `centerX()`, `centerY()` et `radius()` comme les formes de [Drawing](#drawing).
- `value(t, "°C", SteamiAt::W, "TEMP")` place la température à gauche (`W`, ouest) et `value(h, "%", SteamiAt::E, "HUM")` l'humidité à droite (`E`, est). Chacune reste dans sa moitié de l'écran, avec son étiquette au-dessus, en petites lettres grises de 5 × 7 pixels (6 × 12 sur l'écran de 240), et son unité en dessous.
- À gauche et à droite, toute valeur qui n'est pas plus large que `88.8` (trois chiffres ou signes et un point) reçoit la même taille de chiffres : 16 pixels de haut sur l'écran de 128 et 32 sur celui de 240, comme au centre. Les deux valeurs côte à côte ont donc la même taille. Une valeur plus large passe à des chiffres plus petits.
- `subtitle(..., humidity.chip(), STEAMI_GREEN)` écrit les deux lignes du bas en vert : la couleur, en dernier argument, vaut pour toutes les lignes, si bien que `Uncomfortable` s'écrit aussi en vert. Plus la ligne la plus longue est large, plus le bloc part haut, pour que chaque ligne tienne dans le cercle : avec `Uncomfortable`, plus long, il est plus haut qu'avec `Comfortable`.

`SteamiAt` nomme neuf positions : le centre, `CENTER`, et les huit points cardinaux `N`, `NE`, `E`, `SE`, `S`, `SW`, `W` et `NW`, le nord étant en haut de l'écran. `value()` et `text(texte, position)` les acceptent ; `title()` écrit au nord, et `subtitle()` part du sud.

<EssayerExemple id="STEAMI_BOARD/ScreenComfort" />

## ScreenGauge {#screengauge}

**Ce qu'on observe** : un anneau gris, ouvert en bas, suit le bord de l'écran. Il se remplit de gris clair depuis le bas à gauche, dans le sens des aiguilles d'une montre, en proportion de la distance mesurée devant la carte : vide à 0 mm, plein à 500 mm et au-delà. `0` et `500` s'écrivent en petits chiffres gris aux deux bouts de l'anneau. À l'intérieur, `Distance` en haut, la distance en grands chiffres blancs, par exemple `103`, avec `mm` en dessous, et `VL53L1X ToF` en gris foncé en bas. L'image est refaite plusieurs fois par seconde : une main qui s'approche du capteur, sur le bord de la partie ronde à droite de l'écran, vide l'anneau ; en s'éloignant, elle le remplit. Sur une V1a ou une V1b, la même disposition s'affiche en niveaux de gris sur l'écran de 128 pixels.

La console ne reçoit que les lignes de la bibliothèque. Si le capteur ne répond pas, elle reçoit le message `E10` de `SteamiDistance` ; `read()` renvoie alors `-1` : l'anneau reste vide et l'écran affiche `-1` et `mm`.

![Écran rond d'une V1c pendant l'exemple ScreenGauge : un anneau gris ouvert en bas, rempli de gris clair sur son premier cinquième depuis le bas à gauche, 0 et 500 aux deux bouts ; Distance en haut, 103 en grands chiffres blancs, mm en dessous et VL53L1X ToF en gris foncé en bas](/img/software/arduino/steami-board-screen-gauge.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenGauge/ScreenGauge.ino

```

**Comment ça marche** : à chaque tour, le programme lit une seule fois la distance, dans `d` : la jauge et le nombre viennent de la même mesure. L'ordre des appels compte, car un dessin passe par-dessus ceux qui le précèdent : la jauge vient juste après `clear()`, et le texte s'écrit ensuite par-dessus l'anneau.

- `gauge(d, 0, 500)` trace l'anneau de 270° et écrit ses deux bornes, `0` et `500`. Le fond de l'anneau est gris foncé (`STEAMI_DARK`) ; la partie remplie, gris clair (`STEAMI_LIGHT`) par défaut, couvre la fraction `(d − 0) / (500 − 0)` de l'anneau, ramenée entre 0 et 1. `NAN` laisse l'anneau vide. Un quatrième argument facultatif change la couleur du remplissage, comme le bleu de [WeatherStation](#weatherstation) ; avec une borne basse plus grande que la borne haute, l'anneau se remplit quand la valeur baisse.
- `gauge()` n'écrit ni la valeur ni son unité : `value(d, "mm")` s'en charge, comme dans [ScreenTemperature](#screentemperature). `d` est un entier : il s'écrit sans décimale.
- `title()` et `subtitle()` écrivent le haut et le bas de l'écran, à l'intérieur de l'anneau.

L'anneau fait 7 pixels d'épaisseur sur l'écran de 128 et 13 sur celui de 240. Sur l'écran en niveaux de gris, la partie remplie est éclaircie au besoin pour rester au moins 4 niveaux au-dessus du fond, comme pour `bar()`.

<EssayerExemple id="STEAMI_BOARD/ScreenGauge" />

## ScreenCompass {#screencompass}

**Ce qu'on observe** : une rose des vents remplit l'écran : deux cercles gris foncé, huit graduations et les lettres `N`, en blanc, `E`, `S` et `W`, en gris. Une aiguille la traverse : sa moitié nord, en gris clair, pointe vers `N`, l'autre moitié est gris foncé. Toute la rose tourne pour que `N` et l'aiguille montrent le nord, et les lettres restent droites. Tenir la carte à plat, écran vers le haut, puis la tourner lentement : la rose tourne dans l'autre sens, et `N` garde la direction du nord. Quand le haut de l'écran, le côté opposé au connecteur USB, pointe vers le nord, `N` est en haut ; quand il pointe vers l'est, `N` est à gauche. Sur une V1a ou une V1b, la même rose s'affiche en niveaux de gris sur l'écran de 128 pixels.

La console ne reçoit que les lignes de la bibliothèque. Si le magnétomètre ne répond pas, elle reçoit le message `E10` de `SteamiCompass`, et l'écran affiche la rose avec `N` en haut, sans aiguille.

![Écran rond d'une V1c pendant l'exemple ScreenCompass : une rose des vents à deux cercles et huit graduations, N en blanc à gauche, E en haut, S à droite et W en bas ; la moitié claire de l'aiguille pointe vers N, l'autre moitié, grise, vers S](/img/software/arduino/steami-board-screen-compass.jpg)

Sur la photo, le haut de l'écran pointe vers l'est : `N` est à gauche.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenCompass/ScreenCompass.ino

```

**Comment ça marche** : `compass.heading()` donne le cap de la carte, comme dans l'exemple [Compass](#compass) : la direction vers laquelle pointe le haut de l'écran, en degrés comptés depuis le nord magnétique, dans le sens des aiguilles d'une montre. `compass(cap)` dessine la rose tournée de ce cap, arrondi au degré, dans l'autre sens : à 90°, le nord est à gauche. `NAN`, que `heading()` renvoie quand le capteur manque, dessine la rose à 0°, sans aiguille. Un second argument facultatif change la couleur de la moitié nord de l'aiguille, gris clair (`STEAMI_LIGHT`) par défaut. La boucle refait l'image toutes les 50 ms, plus le temps de `show()` : l'aiguille suit la carte sans à-coups.

Le cap n'est juste qu'avec un magnétomètre calibré : sinon, le champ propre de la carte s'ajoute au champ terrestre et fausse la direction. Cet exemple ne lit pas le bouton MENU et ne calibre rien : il applique seulement la calibration `cm` de la zone de configuration de la carte, quand elle existe (voir [Calibrations](../carte#calibrations)). La calibration faite avec MENU dans l'exemple [Compass](#compass) reste en mémoire vive : elle se perd au redémarrage, donc aussi quand un autre programme est téléversé. Le cap ne tient pas compte de l'inclinaison : une carte penchée donne un cap faux.

<EssayerExemple id="STEAMI_BOARD/ScreenCompass" />

## ScreenWatch {#screenwatch}

**Ce qu'on observe** : une montre à aiguilles. Le cadran gris foncé porte douze graduations, plus longues à 12, 3, 6 et 9, et ces quatre chiffres en blanc. Les aiguilles des heures et des minutes sont gris clair, la trotteuse, plus fine, est grise. Au démarrage, la montre indique 10:10:30, puis la trotteuse avance d'un cran chaque seconde ; l'image est refaite deux fois par seconde. Un appui sur le bouton Reset la fait repartir de 10:10:30. Sur une V1a ou une V1b, la même montre s'affiche en niveaux de gris sur l'écran de 128 pixels.

La console ne reçoit que les lignes de la bibliothèque : l'exemple n'utilise aucun capteur.

![Écran rond d'une V1c pendant l'exemple ScreenWatch : un cadran à douze graduations avec les chiffres 12, 3, 6 et 9, les aiguilles des heures et des minutes en gris clair vers 10 h 10 et une trotteuse grise vers le bas à gauche](/img/software/arduino/steami-board-screen-watch.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenWatch/ScreenWatch.ino

```

**Comment ça marche** : la carte n'a pas d'horloge qui garde l'heure. L'heure de départ est écrite dans le programme, en secondes depuis minuit : `START` vaut `10 * 3600 + 10 * 60 + 30`, soit 10:10:30. `millis()` compte les millisecondes depuis le démarrage de la carte : `START + millis() / 1000` donne l'heure actuelle en secondes depuis minuit, que la boucle découpe en heures (`(s / 3600) % 24`), minutes (`(s / 60) % 60`) et secondes (`s % 60`). Pour une montre à l'heure, remplacer `10`, `10` et `30` dans `START` par l'heure à laquelle la carte démarrera, téléverser le programme, puis appuyer sur le bouton Reset à cette heure-là.

`watch(h, m, s)` dessine le cadran et les trois aiguilles. L'aiguille des heures avance avec les minutes, et celle des minutes avec les secondes, de degré en degré : à 10:30, l'aiguille des heures est à mi-chemin entre 10 et 11. Les heures vont de 0 à 23, les minutes et les secondes de 0 à 59 ; une valeur plus grande donne l'angle correspondant, si bien que `watch(25, 0, 0)` montre 1 h. Un quatrième argument facultatif change la couleur des aiguilles des heures et des minutes, gris clair (`STEAMI_LIGHT`) par défaut.

<EssayerExemple id="STEAMI_BOARD/ScreenWatch" />

## ScreenFaces {#screenfaces}

**Ce qu'on observe** : `Mood` (humeur) en haut, un visage en pixel art gris clair au centre, et le nom de l'humeur en bas, dans sa couleur. L'humeur dépend de la distance devant le capteur, sur le bord de la partie ronde à droite de l'écran :

- à moins de 50 mm, un visage surpris et `SURPRISED` en jaune ;
- de 50 à 150 mm, un visage souriant et `HAPPY` en vert ;
- de 150 à 300 mm, un visage endormi et `SLEEPING` en gris clair ;
- au-delà, un visage triste et `SAD` en rouge.

Approcher la main, puis l'éloigner, fait passer d'un visage à l'autre. Chaque appui sur le bouton A affiche ensuite les six visages intégrés, un par un, seuls en plein écran, sans titre : `HAPPY`, `SAD`, `SURPRISED`, `SLEEPING`, `ANGRY` (en colère) et `LOVE` (un cœur). L'appui suivant revient à l'humeur. Maintenir A appuyé jusqu'à ce que le visage change : la boucle ne lit le bouton qu'une fois par image, environ toutes les 110 ms sur une V1c, et un appui bref peut tomber entre deux lectures. Sur une V1a ou une V1b, la même disposition s'affiche en niveaux de gris sur l'écran de 128 pixels.

La console ne reçoit que les lignes de la bibliothèque. Si le capteur de distance ne répond pas, elle reçoit le message `E10` de `SteamiDistance` : `read()` renvoie `-1`, moins de 50, et l'écran reste sur `SURPRISED`. Le bouton A est relié directement au microcontrôleur : il marche même si l'extenseur du D-PAD ne répond pas.

![Écran rond d'une V1c pendant l'exemple ScreenFaces : Mood en haut, un visage souriant en gros carrés gris clair au centre et HAPPY en vert en bas](/img/software/arduino/steami-board-screen-faces.jpg)

![Les six visages de l'exemple ScreenFaces, photographiés l'un après l'autre sur l'écran d'une V1c, de gauche à droite : souriant, triste, surpris à la bouche ronde, endormi aux yeux en traits, en colère aux sourcils froncés, et un cœur](/img/software/arduino/steami-board-screen-faces-six.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenFaces/ScreenFaces.ino

```

**Comment ça marche** : `shown` dit ce que montre l'écran : de 0 à 5, le visage `FACES[shown]` seul ; 6, l'humeur, au démarrage. Chaque appui sur A l'augmente de 1, et `% 7` le ramène à 0 après 6.

- `face(SteamiFace::HAPPY)` dessine l'un des six visages intégrés de `SteamiFace` (`HAPPY`, `SAD`, `SURPRISED`, `SLEEPING`, `ANGRY`, `LOVE`), centré : une grille de 8 × 8 carrés pleins, de 11 pixels de côté sur l'écran de 128 et de 20 sur celui de 240. Il est gris clair (`STEAMI_LIGHT`) par défaut ; `face(SteamiFace::HAPPY, STEAMI_GREEN)` le dessine en vert.
- Avec `true` en second argument, `face(f, true)` dessine un visage plus petit, de carrés de 8 pixels (15 sur l'écran de 240), un peu remonté, pour laisser plus de place au titre et au sous-titre.
- `face(dessin)` dessine un visage personnel : un tableau de 8 octets, un par ligne de haut en bas, dont chaque bit allume un carré, le bit de poids fort (`0x80`) à gauche. Par exemple, `{0x00, 0x24, 0x24, 0x00, 0x00, 0x42, 0x3C, 0x00}` est le visage souriant.
- `subtitle("HAPPY", STEAMI_GREEN)` écrit le sous-titre dans la couleur donnée en dernier argument : le visage reste gris clair et seule l'humeur change de couleur.

<EssayerExemple id="STEAMI_BOARD/ScreenFaces" />

## ScreenGraph {#screengraph}

**Ce qu'on observe** : sur une V1c, `Pressure` en haut, puis la dernière pression mesurée en hectopascals, sans décimale, par exemple `997`, en blanc. En dessous, un cadre : un axe vertical à gauche, un axe horizontal en bas, `1050` en haut et `950` en bas, en petits chiffres gris foncé à l'intérieur du cadre, et une ligne pointillée au milieu, à 1000 hPa. La courbe, en gris clair, relie les 20 dernières mesures, une par seconde : la plus ancienne à gauche, la plus récente à droite. Elle avance donc vers la gauche, et montre les 20 dernières secondes. En bas, `BME280` et `20s window` (fenêtre de 20 secondes) en gris foncé. Au démarrage, avant que 20 mesures soient gardées, la courbe s'étale déjà sur toute la largeur du cadre, avec des points plus espacés.

La pression ne change presque pas en 20 secondes : la courbe reste plate, comme sur la photo. Sur une V1a ou une V1b, l'exemple trace à la place la lumière reçue par l'APDS-9960, de 0 à 1000, avec `Light` en haut et `APDS-9960` en bas, sur l'écran de 128 pixels en niveaux de gris : masquer le capteur avec la main fait plonger la courbe. Ce nombre brut n'est pas une valeur en lux (voir [Light](#light)).

La console ne reçoit que les lignes de la bibliothèque. Sur une V1c, il n'y a pas de message `E20` : l'exemple ne cherche pas le capteur de lumière sur une carte qui n'en a pas. Si le capteur de lumière d'une V1a ou d'une V1b ne répond pas au démarrage, l'exemple trace la pression. Si aucun capteur ne répond, chaque mesure vaut `NAN` : la courbe a un trou à sa place, l'écran affiche `--` à la place de la dernière valeur, et aucun nom de capteur en bas.

![Écran rond d'une V1c pendant l'exemple ScreenGraph : Pressure en haut, 997 en blanc, un cadre avec 1050 en haut à gauche et 950 en bas à gauche, une courbe plate en gris clair au milieu, puis BME280 et 20s window en gris foncé en bas](/img/software/arduino/steami-board-screen-graph.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenGraph/ScreenGraph.ino

```

**Comment ça marche** : `Steami.has(SteamiFunction::LIGHT)` dit si la release de la carte a un capteur de lumière, sans écrire de message (voir [Quand une fonction manque](../carte#quand-une-fonction-manque)). Sur une V1c, il vaut `false`, et `&&` n'appelle pas `light.begin()` : `hasLight` vaut `false`, et le programme lit la pression. Sur une V1a ou une V1b, `hasLight` vaut ce que renvoie `light.begin()`.

- `SteamiHistory<20> history;` garde les 20 dernières mesures dans la mémoire du programme, sans allocation dynamique : 4 octets par valeur, plus 4. `add(v)` ajoute la mesure la plus récente ; une fois 20 valeurs gardées, chaque ajout fait oublier la plus ancienne. Un `NAN` est gardé, et laisse un trou dans la courbe. La classe donne aussi `size()`, le nombre de valeurs gardées, `last()`, la plus récente, `history[0]`, la plus ancienne, et `clear()`, qui vide l'historique.
- `graph(history, 950, 1050)` dessine tout le reste du graphe : la partie entière de la dernière valeur au-dessus du cadre, les deux bornes à l'intérieur, la ligne pointillée du milieu, les axes et la courbe. Il ne faut pas y ajouter de `value()`, qui écrirait la valeur une seconde fois. Une valeur hors des bornes reste sur le bord du cadre : une lumière au-dessus de 1000 reste en haut. Avec moins de 2 mesures, le cadre s'affiche sans courbe.
- Un quatrième argument facultatif change la couleur de la courbe, gris clair (`STEAMI_LIGHT`) par défaut, comme le rouge de [WeatherStation](#weatherstation). `graph(tableau, n, min, max)` trace de la même façon les `n` valeurs d'un tableau de `float`, la plus ancienne en premier.
- `subtitle(..., "20s window")` écrit deux lignes en bas : le nom du capteur, puis la durée que montre la courbe.

<EssayerExemple id="STEAMI_BOARD/ScreenGraph" />

## ScreenMenu {#screenmenu}

**Ce qu'on observe** : `Menu` en haut, puis six éléments centrés, un par ligne, en gris : `Temperature`, `Humidity`, `Distance`, `Light`, `Battery` et `Proximity`. L'élément sélectionné s'écrit en blanc, précédé de `>`, sur une barre gris foncé dont les deux bouts suivent le cercle de l'écran. Au démarrage, c'est `Temperature`. Le bouton DOWN du D-PAD descend la barre d'un élément, UP la remonte. La liste boucle : DOWN sur `Proximity` revient à `Temperature`, UP sur `Temperature` passe à `Proximity`. Maintenir le bouton un court instant : un appui très bref peut tomber entre deux lectures.

Aucun bouton ne valide le choix : l'exemple montre seulement le déplacement de la sélection. Sur une V1a ou une V1b, l'écran de 128 pixels n'affiche que cinq lignes, en niveaux de gris : la liste défile pour garder l'élément sélectionné au milieu de ces cinq lignes.

La console ne reçoit que les lignes de la bibliothèque. Si l'extenseur du D-PAD ne répond pas, elle reçoit `[STeaMi] SteamiButtons: the MCP23009E D-PAD expander (I2C 0x20) did not answer. The A, B and MENU buttons still work. (E10)` : UP et DOWN se lisent comme relâchés, et le menu reste sur son premier élément.

![Écran rond d'une V1c pendant l'exemple ScreenMenu : Menu en haut, puis Temperature sélectionné en blanc sur une barre gris foncé, précédé d'un chevron, et en dessous Humidity, Distance, Light, Battery et Proximity en gris](/img/software/arduino/steami-board-screen-menu.jpg)

![Le même menu, Distance sélectionné, au milieu de la liste](/img/software/arduino/steami-board-screen-menu-distance.jpg)

![Le même menu, Proximity sélectionné, en bas de la liste : la barre, plus courte, suit le cercle de l'écran](/img/software/arduino/steami-board-screen-menu-proximity.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/ScreenMenu/ScreenMenu.ino

```

**Comment ça marche** : `ITEMS` est un tableau de textes, déclaré `const char* const`, et `selected` l'indice de l'élément sélectionné, de 0 à 5. UP et DOWN ne font que diminuer ou augmenter `selected`, sans tester les bornes : c'est `menu()` qui le ramène dans la liste.

- `menu(ITEMS, selected)` dessine la liste et renvoie l'indice ramené dans la liste : `-1` devient 5, le dernier élément, et 6 devient 0, le premier. D'où `selected = screen.menu(ITEMS, selected);`, qui range l'indice corrigé dans `selected`. `menu()` connaît le nombre d'éléments par la taille du tableau.
- Garder l'indice dans un `int`. Avec un indice `unsigned`, `long` ou `size_t`, le compilateur choisit l'autre forme de `menu()`, `menu(tableau, n, indice)`, qui prend le nombre d'éléments en deuxième argument : le programme compile, mais le menu se trompe.
- Un troisième argument facultatif change la couleur de l'élément sélectionné, blanc (`STEAMI_WHITE`) par défaut. Un élément trop large pour l'écran est coupé.

Pour faire de cette liste un vrai menu, tester `selected` dans le programme quand un autre bouton, par exemple A, est appuyé, et afficher alors la page de l'élément choisi.

<EssayerExemple id="STEAMI_BOARD/ScreenMenu" />

## WeatherStation {#weatherstation}

**Ce qu'on observe** : une station météo sur quatre pages, en commençant par la première :

- **Temperature** : `Temperature` en haut, la température au centre, par exemple `27.0`, et `°C` en dessous ;
- **Humidity** : une jauge bleue autour de l'écran, de `0` à `100`, avec `Humidity` en haut, l'humidité, par exemple `28.5`, et `%` en dessous ;
- **Pressure** : `Pressure` en haut, la dernière pression, par exemple `997`, puis le graphe des dernières pressions entre 950 et 1050 hPa, avec une courbe rouge, et `hPa` en bas ;
- **Compass** : la rose des vents de [ScreenCompass](#screencompass), seule, sans texte.

Le bouton RIGHT du D-PAD ou le bouton A passe à la page suivante, et revient à la première après la dernière. LEFT ou B revient à la page précédente. Sur une V1a ou une V1b, une main qui balaie le capteur de gestes vers la droite passe aussi à la page suivante. Maintenir le bouton un court instant : la boucle ne lit les boutons qu'une fois par image, toutes les 200 ms au moins, et environ 260 ms sur une V1c. Sur une V1a ou une V1b, les pages s'affichent en niveaux de gris sur l'écran de 128 pixels ; la jauge bleue y devient gris clair, pour se distinguer de son fond.

La pression est mesurée à chaque tour de la boucle, quelle que soit la page affichée : en arrivant sur la page Pressure, la courbe montre déjà les 40 dernières mesures, soit environ les 8 dernières secondes sur une V1a ou une V1b, et une dizaine sur une V1c, dont l'écran met plus de temps à s'afficher.

Au démarrage, sur une V1c, la console reçoit `[STeaMi] SteamiGesture: this STeaMi is a V1c, it has no gesture sensor (APDS-9960 is on V1a/V1b only). read() will return NONE. (E20)` : le programme continue avec les boutons seuls. Elle reçoit ensuite la liste des composants de la carte, comme dans [BoardInfo](#boardinfo) : `OK` pour ceux que l'exemple utilise, `not tried` pour les autres (mouvement, distance, batterie), `, calibrated` après un composant qui a reçu une calibration de la zone de configuration, et `GC9A01 screen OK` (`SSD1327 screen OK` sur une V1a ou une V1b). Si un capteur ne répond pas, sa page affiche `--` à la place de la valeur, la courbe de la pression a des trous, et la rose n'a pas d'aiguille.

![Écran rond d'une V1c pendant l'exemple WeatherStation, page Temperature : Temperature en haut, 27.0 en grands chiffres blancs et °C en dessous](/img/software/arduino/steami-board-screen-weather-temperature.jpg)

![Page Humidity : une jauge bleue remplie depuis le bas à gauche sur un fond gris, 0 et 100 à ses deux bouts, Humidity en haut, 28.5 en grands chiffres blancs et % en dessous](/img/software/arduino/steami-board-screen-weather-humidity.jpg)

![Page Pressure : Pressure en haut, 997 en blanc, un cadre avec 1050 en haut et 950 en bas, une courbe rouge plate au milieu et hPa en bas](/img/software/arduino/steami-board-screen-weather-pressure.jpg)

![Page Compass : la rose des vents seule, avec son aiguille, sans autre texte que les lettres N, E, S et W](/img/software/arduino/steami-board-screen-weather-compass.jpg)

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/WeatherStation/WeatherStation.ino

```

**Comment ça marche** : `page` donne la page affichée, de 0 à 3, et `PAGES` leurs titres. `(page + 1) % 4` passe à la suivante et revient à 0 après 3 ; `(page + 3) % 4` revient à la précédente, et passe de 0 à 3, sans nombre négatif. Chaque page reprend un widget des exemples précédents :

- la page 0 écrit la valeur avec `value()`, comme [ScreenTemperature](#screentemperature) ;
- la page 1 trace d'abord `gauge(h, 0, 100, STEAMI_BLUE)`, la jauge de [ScreenGauge](#screengauge) en bleu, puis écrit le titre et la valeur par-dessus ;
- la page 2 trace `graph(history, 950, 1050, STEAMI_RED)`, le graphe de [ScreenGraph](#screengraph) en rouge. `SteamiHistory<40>` garde ici les 40 dernières pressions ;
- la page 3 dessine `compass(compass.heading())`, comme [ScreenCompass](#screencompass) : la rose remplit l'écran, sans titre. La même remarque sur la calibration vaut ici.

`gesture.begin()` renvoie `false` sur une V1c, où l'APDS-9960 manque : `hasGesture` vaut alors `false`, et la boucle ne lit pas les gestes. `Steami.printInfo()`, appelé à la fin de `setup()`, écrit la liste des composants dans la console (voir [Afficher la carte détectée](../carte#afficher-la-carte-détectée)).

<EssayerExemple id="STEAMI_BOARD/WeatherStation" />

## BoardInfo {#boardinfo}

**Ce qu'on observe** : la console écrit une seule fois, au démarrage, la release reconnue, l'état de chaque composant I²C de cette release, puis celui de son écran. Sur une V1c, par exemple :

```text
[STeaMi] Board V1c (read from the board config, revision 131)
BME280 0x76 OK
ISM330DL 0x6B OK
LIS2MDL 0x1E OK
VL53L1X 0x29 OK
BQ27441 0x55 OK
MCP23009E 0x20 OK
GC9A01 screen not started
```

La première ligne finit par `(detected: BME280 at 0x76)` quand la zone de configuration du DAPLink ne donne pas de code de révision. Sans batterie, la jauge affiche `BQ27441 0x55 not responding`. Sur une V1a ou une V1b, la liste donne le WSEN-HIDS (`0x5F`), le WSEN-PADS (`0x5D`) et l'APDS-9960 (`0x39`) à la place du BME280, et la dernière ligne devient `SSD1327 screen not started`. Le programme ne fait ensuite plus rien.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/BoardInfo/BoardInfo.ino

```

**Comment ça marche** : cet exemple utilise directement l'objet `Steami`, sans classe par fonction. `Steami.begin()` reconnaît la release, dans cet ordre : une release forcée par le programme, puis le code de révision de la zone de configuration du DAPLink, puis les capteurs présents sur le bus I²C interne (le BME280 désigne une V1c ; le WSEN-HIDS, le WSEN-PADS ou l'APDS-9960 une V1a ou une V1b, sans pouvoir les distinguer : la release s'écrit alors `V1a/V1b`). La première ligne dit d'où vient la réponse.

La boucle parcourt ensuite toutes les fonctions de la carte, sauf l'écran. Pour chacune, `steamiRoute()` donne les composants qui peuvent la servir sur cette release, et `Steami.claim()` crée et démarre le driver de chacun, en retenant s'il répond. `Steami.printInfo()` liste enfin les composants I²C de la release, avec leur adresse et leur état : `OK` ou `not responding`. Sans cette boucle, un composant qu'aucune classe n'a encore demandé s'afficherait `not tried` (voir [Afficher la carte détectée](../carte#afficher-la-carte-détectée)). La dernière ligne donne l'écran de la release et son état : `not started`, puisque l'exemple ne s'en sert pas ; après un `begin()` de `SteamiDisplay`, comme dans [Drawing](#drawing), elle afficherait `OK`. Quand la release reste inconnue (message `E01`), la boucle essaie les neuf composants possibles, la liste les donne tous, et la ligne de l'écran n'apparaît pas. `claim()` n'applique pas les calibrations : `, calibrated` n'apparaît jamais dans cet exemple.

Quand une classe répond `no answer`, cet exemple montre quel composant ne répond pas. Le `#define STEAMI_BOARD_V1C`, en commentaire en tête du code, force la release (voir [Forcer la release](../carte#forcer-la-release)) : le programme téléversé depuis cette page ne le contient pas.

<EssayerExemple id="STEAMI_BOARD/BoardInfo" />
