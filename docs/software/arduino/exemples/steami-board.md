---
title: Exemples STEAMI_BOARD
sidebar_label: STEAMI_BOARD (classes par fonction)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore colour -->

# Exemples STEAMI_BOARD : classes par fonction

Les exemples STEAMI_BOARD ne portent pas sur un composant : ils montrent les **classes par fonction** de la bibliothèque STeaMi, comme `SteamiTemperature` ou `SteamiCompass`. Chaque classe mesure une grandeur (température, distance, cap…) et choisit elle-même le composant qui la mesure sur la carte : le même programme tourne sur une V1a, une V1b ou une V1c.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Les composants changent d'une release à l'autre (voir [Révisions de la carte](/docs/hardware/revisions)). Sur la V1c, le BME280 mesure à lui seul la température, l'humidité et la pression, que se partagent le WSEN-HIDS et le WSEN-PADS sur la V1a et la V1b. Les autres composants de ces exemples sont sur les trois releases : l'ISM330DL (mouvement), le LIS2MDL (champ magnétique), le VL53L1X (distance), la jauge de batterie BQ27441 et l'extenseur MCP23009E du D-PAD. Seuls **Light**, **Color** et **Gesture** demandent l'APDS-9960, qui n'existe que sur la V1a et la V1b : sur une V1c, ils montrent comment une classe signale une fonction absente. Les onze autres exemples marchent sur toutes les cartes.

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → STEAMI_BOARD** de l'Arduino IDE. Ils écrivent leurs messages en anglais et n'utilisent pas l'écran : il garde l'image laissée par le programme précédent, ce n'est pas une panne. La page [Capteurs et écran](../capteurs) détaille chaque classe et [Reconnaître la carte](../carte) ce qu'elles ont en commun ; cette page-ci explique ce que montre chaque exemple. Les pages d'exemples par composant, comme [VL53L1X](./vl53l1x), utilisent au contraire directement le driver du composant.

## Le driver en bref

Ces exemples n'appellent pas le driver d'un composant : ils passent par une classe par fonction, qui utilise le driver partagé de l'objet `Steami` (voir [Un programme pour toutes les cartes](../carte#un-programme-pour-toutes-les-cartes)). Ils suivent tous le même schéma :

- `SteamiTemperature temperature;` crée la classe en variable globale, sans toucher au matériel.
- `begin()`, dans `setup()`, reconnaît d'abord la release de la carte, une seule fois pour tout le programme : par le code de révision de la zone de configuration du DAPLink, sinon en interrogeant les capteurs (voir [Comment la carte est reconnue](../carte#comment-la-carte-est-reconnue)). La bibliothèque écrit alors la première ligne de la console, par exemple `[STeaMi] Board V1c (read from the board config, revision 131)` ou `[STeaMi] Board V1c (detected: BME280 at 0x76)`. `begin()` essaie ensuite le ou les composants qui servent la fonction sur cette release, garde le premier qui répond, lui applique la calibration de la zone de configuration s'il y en a une, et renvoie `true`.
- `chip()` donne le nom du composant retenu : chaque exemple l'écrit, par exemple `Temperature sensor: BME280`.
- Si `begin()` renvoie `false`, la bibliothèque écrit un message codé (voir [Les messages](../carte#les-messages)), puis l'exemple écrit le texte de `error()` : `no answer` quand le composant ne répond pas, `not on this board` quand la release n'a pas la fonction.
- Les lectures (`read()`, `heading()`, `percent()`…) renvoient alors une valeur d'absence : `NAN` (affiché `nan`), `-1`, `0` ou `false` selon la classe (voir [Quand une fonction manque](../carte#quand-une-fonction-manque)). Une fonction qui a échoué n'est pas réessayée avant le redémarrage de la carte.

Chaque appel de lecture interroge le composant : deux appels à la suite, comme `read()` puis `strength()`, font deux mesures distinctes. Les lignes de démarrage ne s'écrivent qu'une fois : pour les relire, appuyer sur le bouton Reset de la carte.

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

**Comment ça marche** : `SteamiAccelerometer` utilise l'[ISM330DL](/docs/hardware/main-components/sensors/ism330dlc), présent sur les trois releases. Un accéléromètre mesure aussi la pesanteur : au repos, il ne mesure qu'elle, 1 g, dans la direction du sol. C'est ce qui permet de connaître l'inclinaison de la carte.

`begin()` règle le capteur sur ±8 g, à 104 mesures par seconde ; sur la plage de ±2 g que le driver choisit seul, une secousse de plus de 2 g ne serait jamais vue. `read()` renvoie les trois axes dans un `SteamiVector`, avec la calibration `ca` de la zone de configuration si elle existe. `strength()` refait une mesure et en calcule la norme, `√(x² + y² + z²)` ; `isShaken()` en refait une troisième et vaut `true` au-dessus de 2 g. `SHAKEN` peut donc apparaître sur une ligne dont la norme affichée est inférieure à 2. Voir aussi [Mouvement](../capteurs#mouvement--accéléromètre-et-gyroscope).

<EssayerExemple id="STEAMI_BOARD/Accelerometer" />

## Gyroscope {#gyroscope}

**Ce qu'on observe** : `Gyroscope: ISM330DL`, puis cinq fois par seconde la vitesse de rotation autour des trois axes, par exemple `x=0.3 y=-0.2 z=0.1 dps`. Au repos, les valeurs restent proches de 0. En faisant tourner la carte posée à plat sur la table, z s'écarte de 0, puis y revient dès que la carte s'arrête.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Gyroscope/Gyroscope.ino

```

**Comment ça marche** : `SteamiGyroscope` utilise le même ISM330DL que `SteamiAccelerometer`. Un gyroscope mesure une vitesse de rotation, en degrés par seconde (`dps`), et non un angle : une carte immobile, même penchée, donne des valeurs proches de 0. La classe garde le réglage du driver, ±250 degrés par seconde à 104 mesures par seconde : une rotation plus rapide dépasse la plage du capteur. Aucune calibration n'est appliquée au gyroscope : au repos, les valeurs ne sont pas exactement 0.

<EssayerExemple id="STEAMI_BOARD/Gyroscope" />

## Buttons {#buttons}

**Ce qu'on observe** : `Buttons ready.`, puis une ligne à chaque appui et à chaque relâchement des sept boutons : `A pressed`, `A released`, `UP pressed`… Un bouton maintenu n'écrit qu'une ligne `pressed`, puis `released` quand on le lâche. Un bouton déjà enfoncé au démarrage ne compte pas comme un appui. Le bouton Reset ne fait pas partie des sept : il redémarre la carte.

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

**Ce qu'on observe** : sur une V1a ou une V1b, `Gesture sensor: APDS-9960`, puis une ligne à chaque geste reconnu quand une main passe au-dessus du capteur : `LEFT`, `RIGHT`, `UP`, `DOWN`, `NEAR` ou `FAR`. Rien ne s'écrit tant qu'il n'y a pas de geste. Sur une V1c, la console écrit le message `E20` de `SteamiGesture`, puis `No gesture sensor: not on this board`, et plus rien ensuite.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/Gesture/Gesture.ino

```

**Comment ça marche** : `SteamiGesture` utilise le même APDS-9960 que les deux exemples précédents. `begin()` met en marche son mode gestes : le capteur éclaire en infrarouge et mesure la lumière renvoyée par la main sur quatre photodiodes, haut, bas, gauche et droite. Le driver compare l'équilibre haut-bas et gauche-droite au début et à la fin du passage de la main : la façon dont il change donne la direction. `NEAR` et `FAR` sont prévus pour une main qui s'approche ou s'éloigne sans balayer le capteur.

`read(200)` renvoie `NONE` tout de suite s'il n'y a pas de geste en cours, sans attendre qu'un geste commence ; sinon, il suit le geste pendant 200 ms au plus. La boucle l'appelle donc sans pause. Pendant qu'une main est suivie, la lumière et la couleur ne sont plus mesurées. Le décodage des gestes n'a pas encore été vérifié sur une carte (voir [Lumière, couleur et gestes](../capteurs#lumière-couleur-et-gestes)).

<EssayerExemple id="STEAMI_BOARD/Gesture" />

## BoardInfo {#boardinfo}

**Ce qu'on observe** : la console écrit une seule fois, au démarrage, la release reconnue et l'état de chaque composant I²C de cette release. Sur une V1c, par exemple :

```text
[STeaMi] Board V1c (read from the board config, revision 131)
BME280 0x76 OK
ISM330DL 0x6B OK
LIS2MDL 0x1E OK
VL53L1X 0x29 OK
BQ27441 0x55 OK
MCP23009E 0x20 OK
```

La première ligne finit par `(detected: BME280 at 0x76)` quand la zone de configuration du DAPLink ne donne pas de code de révision. Sans batterie, la jauge affiche `BQ27441 0x55 not responding`. Sur une V1a ou une V1b, la liste donne le WSEN-HIDS (`0x5F`), le WSEN-PADS (`0x5D`) et l'APDS-9960 (`0x39`) à la place du BME280. Le programme ne fait ensuite plus rien.

```cpp file=.external/arduino-steami/examples/STEAMI_BOARD/BoardInfo/BoardInfo.ino

```

**Comment ça marche** : cet exemple utilise directement l'objet `Steami`, sans classe par fonction. `Steami.begin()` reconnaît la release, dans cet ordre : une release forcée par le programme, puis le code de révision de la zone de configuration du DAPLink, puis les capteurs présents sur le bus I²C interne (le BME280 désigne une V1c ; le WSEN-HIDS, le WSEN-PADS ou l'APDS-9960 une V1a ou une V1b, sans pouvoir les distinguer : la release s'écrit alors `V1a/V1b`). La première ligne dit d'où vient la réponse.

La boucle parcourt ensuite toutes les fonctions de la carte, sauf l'écran. Pour chacune, `steamiRoute()` donne les composants qui peuvent la servir sur cette release, et `Steami.claim()` crée et démarre le driver de chacun, en retenant s'il répond. `Steami.printInfo()` liste enfin les composants I²C de la release, avec leur adresse et leur état : `OK` ou `not responding`. Sans cette boucle, un composant qu'aucune classe n'a encore demandé s'afficherait `not tried` (voir [Afficher la carte détectée](../carte#afficher-la-carte-détectée)). Quand la release reste inconnue (message `E01`), la boucle essaie les neuf composants possibles, et la liste les donne tous. `claim()` n'applique pas les calibrations : `, calibrated` n'apparaît jamais dans cet exemple.

Quand une classe répond `no answer`, cet exemple montre quel composant ne répond pas. Le `#define STEAMI_BOARD_V1C`, en commentaire en tête du code, force la release (voir [Forcer la release](../carte#forcer-la-release)) : le programme téléversé depuis cette page ne le contient pas.

<EssayerExemple id="STEAMI_BOARD/BoardInfo" />
