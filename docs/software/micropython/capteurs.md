---
title: Capteurs
sidebar_position: 5
---

import TOCInline from '@theme/TOCInline';
import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

<!-- cspell:ignore Würth minmax -->

# Capteurs en MicroPython

Cette page donne un programme MicroPython pour chaque fonction de la carte : température, humidité, pression, mouvement, boussole, distance, lumière et couleur, batterie. Chaque programme affiche ses mesures avec `print()`, dans la console du bouton **Essayer sur la carte** (voir [Essayer le code sur la carte](./essayer)), dans [Thonny](./thonny) ou dans [mpremote](./mpremote).

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Avant de commencer

Les programmes utilisent d'abord la couche [`steami`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami) de la bibliothèque [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib). Elle reconnaît la release de la carte (V1a, V1b ou V1c) et donne une **classe par fonction**, comme `Temperature` ou `Compass`, qui choisit le composant présent sur la carte. Un même programme tourne donc tel quel sur les trois releases. C'est l'équivalent MicroPython des classes `SteamiTemperature`, `SteamiCompass`… de la bibliothèque Arduino (voir la page [Capteurs](../arduino/capteurs) en Arduino).

Les pilotes des composants (`bme280`, `ism330dl`…) restent disponibles pour ce que les classes n'offrent pas, comme la proximité de l'APDS-9960 ou un réglage du composant : ils sont décrits à la fin de la page, dans [Aller plus loin : les pilotes](#aller-plus-loin--les-pilotes).

Ce qu'il faut savoir :

- **Rien à installer.** La couche `steami` et les pilotes sont inclus dans le firmware MicroPython de la carte (voir [Installation du firmware](./install)). Le bouton **Essayer sur la carte** propose d'installer ce firmware si la carte ne l'a pas.
- **Importer les noms un par un.** `from steami import Temperature` charge seulement ce dont la température a besoin : un programme ne dépense de la mémoire que pour les fonctions qu'il importe. `from steami import *` n'importe rien.
- **La même forme pour toutes les classes.** Créer l'objet ne touche pas à la carte. `begin()` cherche le composant et renvoie `True` s'il répond, `False` sinon ; une lecture faite avant `begin()` l'appelle d'elle-même. Ensuite, `chip()` donne le nom du composant utilisé (par exemple `"BME280"`), `is_available()` dit si la fonction marche et `error()` donne la raison d'un échec : `"not on this board"` (la release n'a pas ce composant), `"no answer"` (le composant ne répond pas)…
- **Une valeur à la place d'une mesure absente.** Si la fonction manque, les lectures ne lèvent pas d'erreur : elles renvoient une valeur donnée dans chaque section, le plus souvent `nan` (_not a number_), qui s'affiche `nan`. `math.isnan(valeur)` permet de la reconnaître. Une fonction qui a échoué n'est pas réessayée avant le redémarrage du programme.
- **Des messages codés.** La bibliothèque affiche une fois chaque problème, sur une ligne qui commence par `[STeaMi]` et finit par un code : `E10` quand un composant ne répond pas, `E20` quand la fonction n'existe pas sur cette release. Ce sont les mêmes codes qu'en Arduino (voir [Les messages](../arduino/carte#les-messages)).

## Quel composant répond selon la release

Les capteurs dépendent de la release de la carte (voir [Révisions de la carte](/docs/hardware/revisions#capteurs-internes)). La V1c, la seule release distribuée aujourd'hui, remplace les deux capteurs Würth (WSEN-HIDS et WSEN-PADS) et l'APDS-9960 par un seul BME280. Chaque classe utilise le composant de ce tableau :

| Fonction                                                          | Classes                      | V1a et V1b                 | V1c                 |
| ----------------------------------------------------------------- | ---------------------------- | -------------------------- | ------------------- |
| [Température](#température-humidité-pression)                     | `Temperature`                | WSEN-HIDS, sinon WSEN-PADS | BME280              |
| [Humidité](#température-humidité-pression)                        | `Humidity`                   | WSEN-HIDS                  | BME280              |
| [Pression](#température-humidité-pression)                        | `Pressure`                   | WSEN-PADS                  | BME280              |
| [Mouvement](#mouvement--accéléromètre-et-gyroscope)               | `Accelerometer`, `Gyroscope` | ISM330DL                   | ISM330DL            |
| [Boussole](#boussole--magnétomètre)                               | `Compass`, `Magnetometer`    | LIS2MDL                    | LIS2MDL             |
| [Distance](#distance--capteur-de-temps-de-vol)                    | `Distance`                   | VL53L1X                    | VL53L1X             |
| [Lumière, couleur, gestes](#lumière-couleur-et-gestes-v1a-et-v1b) | `Light`, `Color`, `Gesture`  | APDS-9960                  | aucun (message E20) |
| [Batterie](#batterie)                                             | `Battery`                    | BQ27441                    | BQ27441             |

La V1a et la V1b utilisent les mêmes composants. Une classe qui partage un composant avec une autre (`Accelerometer` et `Gyroscope`, par exemple) utilise le même pilote : il n'est créé qu'une fois.

### Reconnaître la carte

Ce programme de la bibliothèque affiche la release reconnue, d'où vient la réponse, puis l'état de chaque composant :

```python file=.external/micropython-steami-lib/lib/steami/examples/board_info.py

```

La release est cherchée une seule fois, dans cet ordre :

1. une release imposée par le programme, avec `Steami.begin("V1c")` (ou `"V1a"`, `"V1b"`) : rien n'est lu sur la carte ;
2. le code de révision enregistré dans la zone de configuration du DAPLink, s'il existe (voir [Identifier sa version](/docs/hardware/revisions#identifier-sa-version)) ;
3. sinon, les capteurs qui répondent sur le bus I²C : un BME280 désigne une V1c, un WSEN-HIDS, un WSEN-PADS ou un APDS-9960 une V1a ou une V1b, sans pouvoir les distinguer.

Sur une V1c, la première ligne affichée ressemble à `[STeaMi] Board V1c (read from the board config, revision 131)`. Dans un programme, `Steami.release_name()` donne la release en texte (`"V1c"`, ou `"unknown"` si aucun capteur n'a répondu), `Steami.is_v1c()` vaut `True` sur une V1c, et `Steami.has(Function.LIGHT)` dit à l'avance si la release possède une fonction (`Steami`, `Function` : `from steami import Function, Steami`).

## Température, humidité, pression

```python run
from time import sleep

from steami import Humidity, Pressure, Temperature

temperature = Temperature()
humidite = Humidity()
pression = Pressure()

for fonction in (temperature, humidite, pression):
    if fonction.begin():
        print("Composant :", fonction.chip())
    else:
        print("Pas de mesure :", fonction.error())

while True:
    print(
        "{:.1f} °C  {:.0f} %  {:.1f} hPa  {:.0f} m".format(
            temperature.read(), humidite.read(), pression.read(), pression.altitude()
        )
    )
    sleep(1)
```

`Temperature` donne la température en °C, `Humidity` l'humidité relative en % et `Pressure` la pression en hPa. Sur une V1c, les trois classes utilisent le BME280 et le programme affiche trois fois `Composant : BME280` ; sur une V1a ou une V1b, il affiche `WSEN-HIDS` pour la température et l'humidité, `WSEN-PADS` pour la pression. Si le capteur ne répond pas, les lectures renvoient `nan`.

`altitude()` donne l'altitude en mètres avec la pression standard au niveau de la mer, 1013,25 hPa. Pour une meilleure estimation, lui passer la pression du jour, ramenée au niveau de la mer : `pression.altitude(1020.0)`. La formule est la même sur toutes les releases.

La calibration de la température enregistrée dans la zone de configuration du DAPLink est appliquée d'elle-même (voir [Calibration](#calibration)). `temperature.set_offset(-0.5)` ajoute en plus un décalage, en °C, à chaque `read()` de cet objet.

## Mouvement : accéléromètre et gyroscope

```python run
from time import sleep_ms

from steami import Accelerometer, Gyroscope

accelerometre = Accelerometer()
gyroscope = Gyroscope()

if not accelerometre.begin():
    print("Pas d'accéléromètre :", accelerometre.error())

while True:
    a = accelerometre.read()
    r = gyroscope.read()
    print(
        "a = {:+.2f} {:+.2f} {:+.2f} g   rotation = {:+.0f} {:+.0f} {:+.0f} °/s".format(
            a.x, a.y, a.z, r.x, r.y, r.z
        )
    )
    if accelerometre.is_shaken():
        print("Secousse !")
    sleep_ms(200)
```

`Accelerometer` donne l'accélération en g, et `Gyroscope` la vitesse de rotation autour de chaque axe, en degrés par seconde. `read()` renvoie les trois axes dans un `Vector` (`a.x`, `a.y` et `a.z`, ou `x, y, z = a`), et `x()`, `y()`, `z()` un seul axe. Carte posée à plat, écran vers le haut, z vaut environ −1 g et la rotation reste proche de 0.

`begin()` règle l'accéléromètre sur ±8 g, sinon une secousse de plus de 2 g ne serait jamais vue. `strength()` est la norme des trois axes, environ 1 g au repos ; `is_shaken()` vaut `True` quand elle dépasse 2 g, et `is_shaken(3)` change ce seuil. Chaque appel fait sa propre mesure : dans le programme, `is_shaken()` ne relit pas les valeurs affichées juste avant. Si le capteur ne répond pas, les lectures renvoient `nan` (trois `nan` pour `read()`), et `is_shaken()` renvoie `False`.

## Boussole : magnétomètre

```python run
import math
from time import sleep_ms

from steami import Compass

boussole = Compass()

if boussole.begin():
    print("Calibration : tourner lentement la carte dans tous les sens pendant 12 s...")
    boussole.calibrate(12)
    print("Calibration terminée. Poser la carte à plat, écran vers le haut.")
else:
    print("Pas de boussole :", boussole.error())

while True:
    cap = boussole.heading()
    if math.isnan(cap):
        print("pas de cap")
    else:
        # Arrondir puis ramener entre 0 et 359 : 359,6 s'affiche 0, jamais 360.
        print(round(cap) % 360, "°", boussole.direction())
    sleep_ms(500)
```

Au démarrage, le programme calibre la boussole pendant 12 secondes : pendant ce temps, tourner lentement la carte dans tous les sens, puis la reposer à plat.

`Compass` donne le cap de la carte tenue à plat, écran vers le haut :

- `heading()` renvoie un angle en degrés, compté dans le sens des aiguilles d'une montre à partir du nord, de 0 à moins de 360. Il vaut 0 quand le haut de l'écran, du côté du connecteur USB, pointe vers le nord, 90 vers l'est, 180 vers le sud et 270 vers l'ouest.
- `direction()` renvoie la direction la plus proche parmi huit : `"N"`, `"NE"`, `"E"`, `"SE"`, `"S"`, `"SW"`, `"W"` ou `"NW"`. Chacune couvre 45° centrés sur elle : `"N"` va de 337,5° à 22,5°, `"NE"` de 22,5° à 67,5°, etc. `direction()` fait sa propre mesure : près de la limite entre deux secteurs, la direction affichée peut ne pas correspondre au cap affiché juste avant.

Le cap ne tient pas compte de l'inclinaison : une carte penchée donne un cap faux. Si le capteur ne répond pas, `heading()` renvoie `nan` et `direction()` un texte vide (`""`).

**Calibrer.** Le magnétomètre mesure aussi le champ magnétique de la carte elle-même, souvent plus fort que celui de la Terre (25 à 65 µT) : sans calibration, le cap est faux. Deux façons de calibrer :

- `boussole.calibrate(12)` mesure pendant 12 secondes, comme dans le programme ci-dessus. Cette calibration reste en mémoire vive : elle n'est pas enregistrée et se perd au redémarrage du programme. `calibrate(0)` ne fait rien.
- une calibration `cm` enregistrée dans la zone de configuration du DAPLink est appliquée d'elle-même au premier usage (voir [Calibration](#calibration)). Sur une carte qui en a une, retirer l'appel à `calibrate()` : il la remplacerait jusqu'au redémarrage.

Les objets métalliques, les aimants et les câbles proches faussent aussi la mesure : la boussole indique une direction, pas un cap précis au degré.

**Nord géographique.** Le cap est mesuré par rapport au nord magnétique. `boussole.set_declination(2.0)` ajoute la déclinaison magnétique du lieu, en degrés, positive vers l'est, pour viser le nord géographique ; elle ne dépasse pas quelques degrés en France métropolitaine. Cet appel peut se faire avant `begin()`.

### Le champ magnétique

```python run
from time import sleep_ms

from steami import Magnetometer

champ = Magnetometer()

if not champ.begin():
    print("Pas de magnétomètre :", champ.error())

while True:
    x, y, z = champ.read()
    print("{:.1f} {:.1f} {:.1f} µT, intensité {:.1f} µT".format(x, y, z, champ.strength()))
    sleep_ms(500)
```

`Magnetometer` donne le champ magnétique sur les trois axes, en µT, et `strength()` son intensité. Avant toute calibration, ces valeurs contiennent le champ propre de la carte et peuvent dépasser de loin le champ terrestre. Après une calibration (`cm` dans la zone de configuration, ou `calibrate()` comme pour la boussole), ce décalage est retiré : loin des aimants et du métal, `strength()` vaut alors environ 25 à 65 µT. `Magnetometer` et `Compass` partagent le même LIS2MDL : une calibration faite par l'une sert à l'autre. Si le capteur ne répond pas, les lectures renvoient `nan`.

## Distance : capteur de temps de vol

```python run
from time import sleep_ms

from steami import Distance

distance = Distance()

if not distance.begin():
    print("Pas de capteur de distance :", distance.error())

while True:
    mm = distance.read()
    if mm < 0:
        print("pas de mesure")
    else:
        print("{} mm ({:.1f} cm)".format(mm, mm / 10))
    sleep_ms(500)
```

Le VL53L1X mesure la distance de l'objet le plus proche en face de lui. `read()` donne la distance en millimètres, et `cm()` en centimètres. `read()` renvoie `-1`, et `cm()` renvoie `nan`, quand le capteur ne répond pas ou ne donne pas de résultat. Une vraie distance de 0 mm se lit aussi `-1`. Le capteur ne signale pas toujours une cible hors de portée : `read()` peut alors renvoyer un nombre de millimètres qui n'est pas une mesure fiable.

## Lumière, couleur et gestes (V1a et V1b)

Ces mesures demandent le capteur APDS-9960, présent sur la V1a et la V1b seulement : la V1c n'a pas de capteur de lumière, de couleur ni de gestes. Sur une V1c, le programme ci-dessous affiche le message `E20`, puis `Pas de capteur de lumière : not on this board`.

```python run
from time import sleep_ms

from steami import Color, Light

lumiere = Light()
couleur = Color()

if lumiere.begin():
    couleur.begin()
    while True:
        rouge, vert, bleu = couleur.read()
        print("lumière", lumiere.read(), " rouge", rouge, " vert", vert, " bleu", bleu)
        sleep_ms(500)
else:
    print("Pas de capteur de lumière :", lumiere.error())
```

`Light` et `Color` donnent des nombres bruts du capteur, sans unité, qui augmentent avec la lumière ; pas de lux. `couleur.read()` renvoie les trois composantes `(rouge, vert, bleu)`, et `red()`, `green()`, `blue()` en lisent une seule. `couleur.rgb()` donne la teinte, la plus forte composante ramenée à 255, prête à passer comme couleur à l'écran.

Les gestes de la main se lisent avec `Gesture` :

```python run
from time import sleep_ms

from steami import Gesture

geste = Gesture()

if geste.begin():
    print("Passer la main au-dessus du capteur.")
    while True:
        direction = geste.read(200)
        if direction != Gesture.NONE:
            print(direction)
        sleep_ms(10)
else:
    print("Pas de capteur de gestes :", geste.error())
```

`read()` renvoie `Gesture.LEFT`, `RIGHT`, `UP`, `DOWN`, `NEAR`, `FAR` ou `Gesture.NONE`, qui sont des textes (`Gesture.LEFT == "LEFT"`). `read(200)` lit le geste en cours pendant 200 ms au plus. S'il n'y a pas de main au-dessus du capteur, `read()` renvoie `Gesture.NONE` tout de suite : il n'attend pas qu'un geste commence. L'appeler donc à chaque tour de boucle. Sans délai, `read()` ne lit que ce que le capteur a déjà enregistré et peut couper un geste en cours.

`Gesture` met le capteur en détection de gestes : pendant qu'une main passe au-dessus, la lumière et la couleur ne sont plus mesurées, puis reprennent.

Sur une V1c, les trois classes affichent le message `E20` et leur `begin()` renvoie `False`, sans chercher l'APDS-9960 sur le bus I²C. `Light` renvoie alors `0`, `Color` `(0, 0, 0)` et `Gesture` `Gesture.NONE`.

## Batterie

```python run
from time import sleep

from steami import Battery

batterie = Battery()

if batterie.begin():
    while True:
        print(
            "{} %  {:.2f} V  {} mA{}".format(
                batterie.percent(),
                batterie.voltage(),
                batterie.current(),
                "  (en charge)" if batterie.is_charging() else "",
            )
        )
        sleep(2)
else:
    print("Pas de jauge :", batterie.error())
```

`percent()` donne la charge en %, `voltage()` la tension en volts et `current()` le courant moyen en mA, positif pendant la charge et négatif pendant la décharge. `is_charging()` vaut `True` quand le courant est positif.

La jauge BQ27441 est alimentée par la batterie : sans batterie (carte alimentée par l'USB seul), elle ne répond pas, `begin()` renvoie `False` et le message `E10` demande de brancher une batterie. Les lectures renvoient alors `0`, `nan`, `0` et `False`. Brancher la batterie, puis relancer le programme.

## Calibration

Trois calibrations peuvent être enregistrées dans la zone de configuration du DAPLink, une petite mémoire de la carte qui garde aussi son nom et sa révision (voir [SteamiConfig](../daplink#steamiconfig)) :

| Clé  | Calibration                                   | Classes qui l'appliquent  |
| ---- | --------------------------------------------- | ------------------------- |
| `tc` | Température : gain et décalage, par composant | `Temperature`             |
| `cm` | Magnétomètre                                  | `Compass`, `Magnetometer` |
| `ca` | Décalages de l'accéléromètre, en g            | `Accelerometer`           |

Les classes appliquent ces calibrations d'elles-mêmes, une fois par composant, au premier usage, même quand la release est imposée par `Steami.begin("V1c")`. Il n'y a rien à écrire dans le programme. Celui-ci indique quelles calibrations la carte a reçues :

```python run
from steami import Accelerometer, Compass, Steami, Temperature

for fonction in (Temperature(), Accelerometer(), Compass()):
    if fonction.begin():
        if Steami.calibrated(fonction.chip()):
            print(fonction.chip(), ": calibration appliquée")
        else:
            print(fonction.chip(), ": pas de calibration enregistrée")
    else:
        print("Pas de", type(fonction).__name__, ":", fonction.error())
```

Sans calibration enregistrée, les mesures restent celles du composant. Deux réglages s'ajoutent dans le programme, sans rien enregistrer :

- `Compass.calibrate()` et `Magnetometer.calibrate()` (voir [Boussole](#boussole--magnétomètre)) ;
- `Temperature.set_offset()` (voir [Température, humidité, pression](#température-humidité-pression)).

Ils sont perdus au redémarrage du programme. Pour qu'une calibration reste sur la carte, l'écrire dans la zone de configuration avec le module `steami_config` : ses exemples [`calibrate_temperature.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/calibrate_temperature.py), [`calibrate_magnetometer.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/calibrate_magnetometer.py) et [`calibrate_accelerometer.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/calibrate_accelerometer.py) mesurent, puis enregistrent le résultat. Ils modifient la carte de façon durable : la future page Stockage ([issue #20](https://github.com/steamicc/wiki_steami/issues/20)) décrira cet enregistrement ; en attendant, voir la section [SteamiConfig](../daplink#steamiconfig) de la page DAPLink.

## Aller plus loin : les pilotes

Chaque composant a son pilote dans micropython-steami-lib, inclus lui aussi dans le firmware. Il donne accès à tout ce que le composant sait faire : modes de mesure, filtres, proximité, point de rosée… Tous suivent les mêmes [conventions](./conventions) : le constructeur prend le bus I²C interne, `I2C(1)`, puis des méthodes comme `temperature()`, `pressure_hpa()` ou `acceleration_g()`.

| Pilote                                                                                  | Composant                           | Releases      | Exemples                                                                                        |
| --------------------------------------------------------------------------------------- | ----------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| [bme280](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bme280)       | Pression, humidité, température     | V1c           | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bme280/examples)    |
| [wsen-hids](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids) | Humidité, température               | V1a, V1b      | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-hids/examples) |
| [wsen-pads](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads) | Pression, température               | V1a, V1b      | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/wsen-pads/examples) |
| [ism330dl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl)   | Accéléromètre, gyroscope            | V1a, V1b, V1c | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/ism330dl/examples)  |
| [lis2mdl](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl)     | Magnétomètre                        | V1a, V1b, V1c | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/lis2mdl/examples)   |
| [vl53l1x](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x)     | Distance (temps de vol)             | V1a, V1b, V1c | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/vl53l1x/examples)   |
| [apds9960](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/apds9960)   | Lumière, couleur, gestes, proximité | V1a, V1b      | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/apds9960/examples)  |
| [bq27441](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bq27441)     | Jauge de batterie                   | V1a, V1b, V1c | [examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bq27441/examples)   |

Le README de chaque pilote, au lien de son nom, décrit toute son API.

**Pilote créé ou pilote partagé.** Un pilote créé dans le programme, comme `BME280(I2C(1))`, ne reçoit pas les calibrations de la zone de configuration. Dans un programme qui utilise aussi les classes par fonction, il crée un second objet pour le même composant et peut défaire les réglages des classes : le constructeur de `ISM330DL` remet par exemple l'accéléromètre sur ±2 g, alors que `Accelerometer` l'a réglé sur ±8 g. Dans ce cas, prendre plutôt le **pilote partagé** des classes :

```python
from steami import Chip, Steami

bme = Steami.bme280()  # le pilote partagé, ou None si le BME280 ne répond pas
Steami.calibrate(Chip.BME280)  # lui applique la calibration enregistrée, s'il y en a une
print(bme.dew_point())
```

`Steami.wsen_hids()`, `wsen_pads()`, `apds9960()`, `vl53l1x()`, `ism330dl()`, `lis2mdl()` et `bq27441()` donnent de la même façon les autres pilotes partagés.

Les programmes ci-dessous viennent des exemples de la bibliothèque.

### Pression, humidité et température

<ReleaseTabs>
<Release releases="v1a v1b">

Deux capteurs Würth : le WSEN-HIDS (humidité et température, adresse `0x5F`) et le WSEN-PADS (pression et température, adresse `0x5D`). Ces programmes ne tournent pas sur une V1c : ils n'ont pas de bouton **Essayer sur la carte**. Les lancer avec [Thonny](./thonny) ou [mpremote](./mpremote).

```python norun file=.external/micropython-steami-lib/lib/wsen-hids/examples/humidity_temperature.py

```

```python norun file=.external/micropython-steami-lib/lib/wsen-pads/examples/basic_reader.py

```

`read_one_shot()` du WSEN-HIDS lance une seule mesure et renvoie `(humidité, température)` ; `read()` du WSEN-PADS renvoie `(pression, température)`. Les exemples du WSEN-HIDS montrent aussi le chauffage intégré, qui sèche le capteur ([`heater_demo.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/wsen-hids/examples/heater_demo.py)) et le point de rosée ([`dew_point.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/wsen-hids/examples/dew_point.py)) ; ceux du WSEN-PADS une alerte quand la pression baisse sous un seuil ([`threshold_alert.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/wsen-pads/examples/threshold_alert.py)) et un détecteur d'étage ([`floor_detector.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/wsen-pads/examples/floor_detector.py)).

</Release>
<Release releases="v1c">

Un seul capteur, le BME280, à l'adresse `0x76`.

```python file=.external/micropython-steami-lib/lib/bme280/examples/basic_reader.py

```

`read_one_shot()` lance une seule mesure et renvoie `(température, pression, humidité)`. Le pilote donne aussi l'altitude (`altitude()`) et le point de rosée (`dew_point()`), en °C.

</Release>
</ReleaseTabs>

### Accéléromètre et gyroscope : ISM330DL

```python file=.external/micropython-steami-lib/lib/ism330dl/examples/basic_read.py

```

Le pilote règle l'accéléromètre sur ±2 g et le gyroscope sur ±250 °/s ; `configure_accel()` et `configure_gyro()` changent ces plages. `orientation()` renvoie la position de la carte en texte, par exemple `"SCREEN_UP"` posée à plat, écran vers le haut. Les exemples comprennent un niveau à bulle ([`spirit_level.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/ism330dl/examples/spirit_level.py)) et des jeux qui se pilotent en penchant la carte, comme un labyrinthe ([`maze_game.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/ism330dl/examples/maze_game.py)) : ils dessinent avec `steami.Screen`, sur l'écran de chaque release.

### Magnétomètre : LIS2MDL

```python file=.external/micropython-steami-lib/lib/lis2mdl/examples/basic_read.py

```

`magnetic_field_ut()` donne le champ en µT, sans retirer le champ propre de la carte. Pour un cap, le pilote offre `calibrate_minmax_3d()` (tourner la carte dans tous les sens pendant la mesure), puis `heading_flat_only()`, qui suit la même convention que `Compass.heading()` : 0° quand le haut de l'écran, du côté du connecteur USB, pointe vers le nord. `direction_label(cap)` donne l'une des huit directions. Les exemples comprennent un détecteur de métal ([`metal_detector.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/lis2mdl/examples/metal_detector.py)) et un capteur d'ouverture de porte avec un aimant ([`door_sensor.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/lis2mdl/examples/door_sensor.py)).

### Distance : VL53L1X

```python file=.external/micropython-steami-lib/lib/vl53l1x/examples/distance.py

```

`read()` renvoie la distance en millimètres ; ce programme l'affiche en continu. L'exemple [`proximity_alert.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/vl53l1x/examples/proximity_alert.py) fait sonner le buzzer quand un objet s'approche.

### Lumière, couleur, gestes et proximité : APDS-9960

<ReleaseTabs>
<Release releases="v1a v1b">

La proximité n'a pas de classe par fonction : elle se lit avec ce pilote. Ce programme ne tourne pas sur une V1c : il n'a pas de bouton **Essayer sur la carte**. Le lancer avec [Thonny](./thonny) ou [mpremote](./mpremote).

```python norun file=.external/micropython-steami-lib/lib/apds9960/examples/proximity.py

```

`proximity()` donne un nombre brut, de 0 à 255, qui augmente quand un objet s'approche du capteur. Les autres exemples lisent la lumière ([`ambient_light.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/apds9960/examples/ambient_light.py)) et les gestes ([`gesture.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/apds9960/examples/gesture.py)).

</Release>
<Release releases="v1c">

La V1c n'a pas de capteur de lumière, de couleur, de gestes ni de proximité : l'APDS-9960 a été retiré.

</Release>
</ReleaseTabs>

### Batterie : BQ27441

```python file=.external/micropython-steami-lib/lib/bq27441/examples/fuel_gauge.py

```

Sans batterie, la jauge n'est pas sur le bus I²C : le constructeur lève une erreur `OSError` qui demande de brancher une batterie. Le constructeur indique à la jauge la capacité de la batterie, 650 mAh par défaut ; pour une autre batterie, la passer en paramètre : `BQ27441(i2c, capacity_mAh=1000)`. L'exemple [`tamagotchi.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/bq27441/examples/tamagotchi.py) fait vivre un petit personnage selon la charge de la batterie, sur l'écran, avec le D-PAD et le buzzer.

## Microphone

Le microphone IMP34DT05 n'a pas encore de pilote dans le firmware MicroPython : cette page ne le couvre pas. En Arduino, voir la section [Microphone](../arduino/capteurs#microphone).

## Voir aussi

- [Capteurs en Arduino](../arduino/capteurs) : les mêmes fonctions avec la bibliothèque Arduino STeaMi
- [Révisions de la carte](/docs/hardware/revisions) : les composants de chaque release
- [Conventions API des drivers](./conventions) : la forme commune des pilotes
- [README de la couche `steami`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/README.md) : toute l'API des classes par fonction, en anglais
- [Exemples de la couche `steami`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami/examples) : un programme par fonction
