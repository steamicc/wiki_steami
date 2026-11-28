---
title: Stockage
sidebar_position: 7
---

import TOCInline from '@theme/TOCInline';
import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Stockage : fichiers, disque USB et configuration

Un programme MicroPython peut garder des données d'un démarrage à l'autre à trois endroits de la carte STeaMi :

| Stockage                                                | Mémoire                                                                                                      | Taille                | Depuis le programme                | Depuis l'ordinateur                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- | ---------------------------------- | ------------------------------------------ |
| [Fichiers de la carte](#les-fichiers-de-la-carte-flash) | flash interne du [STM32WB55](/docs/hardware/main-components/stm32wb55), qui exécute MicroPython              | 256 Ko                | `open()`, module `os`              | [Thonny](./thonny), [mpremote](./mpremote) |
| [Fichier du disque USB](#le-fichier-du-disque-usb)      | flash externe [W25Q64](/docs/hardware/main-components/w25q64), gérée par le DAPLink                          | 8 Mo, un seul fichier | `daplink_flash`                    | lecteur **STEAMI**, en lecture seule       |
| [Zone de configuration](#la-zone-de-configuration)      | flash interne du [STM32F103](/docs/hardware/main-components/stm32f103), qui exécute le [DAPLink](../daplink) | 1 Ko                  | `Steami.config()`, `steami_config` | aucun accès direct                         |

Les fichiers de la carte servent aux programmes (`main.py`) et aux données du programme ; le fichier du disque USB, à un relevé de mesures que l'ordinateur ouvre comme un fichier ordinaire ; la zone de configuration, au code de révision de la carte, à son nom et aux [calibrations des capteurs](#les-calibrations-des-capteurs).

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

:::warning

Les programmes de cette page qui écrivent dans une mémoire flash n'ont pas de bouton **Essayer sur la carte** : ils modifient la carte de façon durable. Les copier dans [Thonny](./thonny) ou dans un fichier lancé avec [`mpremote run`](./mpremote#exécuter-un-script), après avoir lu les mises en garde de leur section. Les programmes qui ne font que lire ont le bouton (voir [Essayer le code sur la carte](./essayer)).

:::

Les exemples de cette page tournent sans changement sur une V1a, une V1b ou une V1c : les trois releases ont le même STM32WB55, la même flash W25Q64 et le même STM32F103. Seules les [calibrations de la température](#calibrer-la-température) changent de capteur d'une release à l'autre.

## Les fichiers de la carte (/flash)

MicroPython range ses fichiers dans un système de fichiers monté sous `/flash`, dans 256 Ko de la flash interne du STM32WB55 (à partir de l'adresse `0x08084000`, d'après le [script d'édition de liens de la carte](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/stm32wb55xg_steami.ld)). Au démarrage, MicroPython exécute `boot.py` puis `main.py` s'ils s'y trouvent (voir [Enregistrer un programme sur la carte](./essayer#enregistrer-un-programme-sur-la-carte)). Les drivers de la bibliothèque STeaMi ne prennent pas de place dans `/flash` : ils sont intégrés au firmware.

Ces fichiers ne sont pas visibles sur le lecteur **STEAMI** : ce lecteur, présenté par le DAPLink, ne montre que ses fichiers d'information (comme `DETAILS.TXT`) et le [fichier de la W25Q64](#le-fichier-du-disque-usb). Pour les voir depuis l'ordinateur, passer par Thonny ([Gérer les fichiers](./thonny#gérer-les-fichiers)) ou par mpremote ([Lister les fichiers sur la carte](./mpremote#lister-les-fichiers-sur-la-carte)).

### Lister les fichiers et la place libre

Ce programme ne modifie rien : il affiche le contenu de `/flash` et la place qui reste.

```python run
import os

print("Fichiers de /flash :", os.listdir("/flash"))

infos = os.statvfs("/flash")
taille = infos[1] * infos[2]  # taille d'un bloc × nombre de blocs
libre = infos[1] * infos[3]  # taille d'un bloc × blocs libres
print("Taille : {} Ko, libre : {} Ko".format(taille // 1024, libre // 1024))
```

Le système de fichiers garde pour lui une partie des 256 Ko : la taille affichée est un peu plus petite.

### Écrire un fichier

`open()` écrit un fichier comme sous Python sur un ordinateur. Ce programme ajoute dix mesures de température au fichier `/flash/mesures.csv`, une par seconde, avec la classe `Temperature` de la [couche `steami`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami), qui choisit le capteur de la carte (BME280 sur une V1c, WSEN-HIDS sur une V1a ou une V1b) :

```python
from time import sleep

from steami import Temperature

temperature = Temperature()

with open("/flash/mesures.csv", "a") as fichier:  # "a" : ajouter à la fin
    for seconde in range(10):
        fichier.write("{};{:.2f}\n".format(seconde, temperature.read()))
        sleep(1)

print("10 mesures ajoutées à /flash/mesures.csv")
```

Avant de lancer un programme qui écrit dans `/flash` :

- **Le mode compte.** `"a"` ajoute les lignes à la fin du fichier ; `"w"` efface d'abord tout le fichier. Un programme lancé deux fois avec `"w"` perd le premier relevé.
- **Fermer le fichier.** Les données ne sont sûres qu'une fois le fichier fermé, ce que fait la sortie du bloc `with`. Une coupure d'alimentation ou un appui sur **Reset** pendant l'écriture peut laisser le fichier incomplet.
- **Écrire peu souvent.** Une page de flash ne supporte qu'un nombre limité d'effacements (de l'ordre de 10 000 pour le STM32WB55). Regrouper les mesures et écrire une ligne toutes les quelques secondes, pas à chaque tour d'une boucle rapide.
- **Ne pas remplacer `main.py` par erreur.** Écrire dans un fichier nommé `main.py` ou `boot.py` change ce que la carte exécute au démarrage.

### Relire un fichier

Ce programme ne fait que lire : il affiche le fichier écrit plus haut, ou un message s'il n'existe pas encore.

```python run
try:
    with open("/flash/mesures.csv") as fichier:
        for ligne in fichier:
            print(ligne.rstrip())
except OSError:
    print("Pas encore de fichier /flash/mesures.csv")
```

Pour copier le fichier sur l'ordinateur : `mpremote cp :mesures.csv .` (voir [mpremote](./mpremote#copier-des-fichiers-sur-la-carte)), ou le menu **Fichiers** de [Thonny](./thonny#gérer-les-fichiers). `mpremote rm :mesures.csv` le supprime.

Le bouton **Essayer sur la carte** dépose les fichiers annexes d'un programme dans un disque en mémoire vive, `/ram`, qui disparaît au redémarrage (voir [Un programme lancé sans être enregistré](./essayer#un-programme-lancé-sans-être-enregistré)). Rien de ce qui est écrit dans `/ram` ne survit à un redémarrage.

## Le fichier du disque USB

Le DAPLink, le second microcontrôleur de la carte, fait apparaître le lecteur **STEAMI** sur l'ordinateur. Il garde un seul fichier dans la flash externe W25Q64 de 8 Mo. Un programme MicroPython y ajoute des lignes avec le driver [`daplink_flash`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash), et l'ordinateur ouvre ensuite ce fichier depuis le lecteur, par exemple dans un tableur. La couche `steami` n'a pas de classe pour ce fichier : le driver se crée sur le bus I²C interne de la carte, `Steami.i2c()`, à travers le pont [`daplink_bridge`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_bridge). Le protocole entre les deux microcontrôleurs est décrit dans [DAPLink — Protocole I2C](../daplink#protocole-i2c).

### Lire le fichier

Cet exemple de la bibliothèque ([`read_file.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/read_file.py)) affiche le nom et le contenu du fichier, sans le modifier :

```python file=.external/micropython-steami-lib/lib/daplink_flash/examples/read_file.py

```

La lecture demande un firmware DAPLink de mars 2026 ou plus récent : avec un firmware plus ancien, le fichier paraît vide au programme. Le [mettre à jour](../daplink#mise-à-jour-du-firmware) corrige le problème. `read()` lit le fichier par secteurs de 256 octets, avec une pause de 200 ms par secteur : compter environ une seconde par kilo-octet. `read(1000)` ne lit que les 1000 premiers octets.

### Écrire dans le fichier

Ce programme ajoute trente mesures de température au fichier, une par seconde, et le nomme `TEMP.CSV` :

```python
from time import sleep

from daplink_bridge import DaplinkBridge
from daplink_flash import DaplinkFlash
from steami import Steami, Temperature

fichier = DaplinkFlash(DaplinkBridge(Steami.i2c()))
fichier.set_filename("TEMP", "CSV")  # TEMP.CSV sur le lecteur STEAMI

temperature = Temperature()
fichier.write_line("secondes;temperature")
for seconde in range(30):
    fichier.write_line("{};{:.2f}".format(seconde, temperature.read()))
    sleep(1)

print("30 lignes ajoutées à TEMP.CSV")
```

Ce qu'il faut savoir sur ce fichier :

- **Un seul fichier.** `set_filename()` le renomme sans effacer son contenu : un autre programme écrit dans ce même fichier. Le nom compte 8 caractères au plus et l'extension 3 ; les minuscules deviennent des majuscules.
- **Les lignes s'ajoutent.** Chaque lancement du programme ajoute ses lignes après les précédentes, et le compteur repart à 0 : l'en-tête `secondes;temperature` sépare les séries. Le fichier peut atteindre 8 Mo moins 4 Ko (le dernier secteur de 4 Ko garde le nom) ; au-delà, `write()` lève une erreur `OSError`.
- **Voir le fichier à jour.** Le lecteur **STEAMI** montre le fichier tel qu'il était au démarrage du DAPLink, en lecture seule, et ne le montre pas s'il est vide. Pour voir les nouvelles lignes, débrancher le câble USB, et aussi la batterie si elle est branchée (elle garde le DAPLink alimenté), puis rebrancher. Le bouton **Reset** ne suffit pas.
- **Vider le fichier.** `fichier.clear_flash()` efface le contenu et garde le nom. L'appeler volontairement, et pas au début d'un programme qui démarre seul (`main.py`) : le relevé serait effacé à chaque démarrage. L'effacement prend de moins d'une seconde à une vingtaine de secondes selon la taille du fichier ; la commande suivante attend sa fin.

`clear_flash()` ne touche ni aux fichiers de `/flash`, ni à la zone de configuration.

### Autres exemples du driver

Dans [lib/daplink_flash/examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash/examples) :

| Exemple                                                                                                                    | Ce qu'il fait                                                                      | Modifie la carte                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`flash_info.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/flash_info.py)   | Affiche l'identifiant du pont, ses registres d'état et le nom du fichier           | non                                                                |
| [`read_file.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/read_file.py)     | Affiche le fichier                                                                 | non                                                                |
| [`write_csv.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/write_csv.py)     | Nomme le fichier `DATA.CSV`, l'efface, puis y écrit quatre lignes                  | **oui** : le fichier précédent est effacé                          |
| [`sensor_log.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/sensor_log.py)   | Nomme le fichier `SENSORS.CSV`, l'efface, y écrit 200 lignes simulées et les relit | **oui** : le fichier précédent est effacé                          |
| [`erase_flash.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/erase_flash.py) | Efface le fichier                                                                  | **oui** : le fichier est effacé                                    |
| [`config_zone.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/config_zone.py) | Teste la zone de configuration                                                     | **oui** : efface **toute la zone de configuration**, voir plus bas |

## La zone de configuration

La zone de configuration est une page de 1 Ko de la flash interne du STM32F103, entre le bootloader et le firmware du DAPLink. Elle garde, au format JSON :

- le code de révision de la carte (`rev`), qui dit si c'est une V1a, une V1b ou une V1c (voir [Identifier sa version](/docs/hardware/revisions#identifier-sa-version)) ;
- le nom de la carte (`name`) ;
- les [calibrations des capteurs](#les-calibrations-des-capteurs) (`tc`, `cm`, `ca`) ;
- un compteur de démarrages (`bc`).

Le détail du format est donné dans [DAPLink — Format JSON de la config zone](../daplink#format-json-de-la-config-zone). Les bibliothèques MicroPython et [Arduino](../arduino/carte#calibrations) lisent les mêmes clés : une calibration faite avec l'une sert à l'autre.

### Lire la configuration

`Steami.config()` renvoie la configuration de la carte, chargée au premier appel, ou `None` si le firmware DAPLink n'a pas de zone de configuration (les anciens firmwares) ou si la zone est illisible. Ce programme ne modifie rien :

```python run
from steami import Steami

Steami.begin()  # reconnaît la release, au besoin par la zone de configuration
config = Steami.config()
if config is None:
    print("Pas de zone de configuration : mettre à jour le DAPLink")
else:
    print("Nom de la carte :", config.board_name)
    print("Code de révision :", config.board_revision)
    print("Release :", Steami.release_name(), "- trouvée par :", Steami.origin())
```

`board_name` et `board_revision` valent `None` quand la zone ne contient pas ces valeurs. `Steami.origin()` vaut `config` quand la release vient du code de révision, `probe` quand elle a été reconnue à ses capteurs (voir le [README de `steami`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/README.md#release)).

L'exemple [`show_config.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/show_config.py) de `steami_config` affiche toute la zone : révision décodée, nom, calibrations, compteur de démarrages et contenu brut. Il ne modifie rien :

```python file=.external/micropython-steami-lib/lib/steami_config/examples/show_config.py

```

Ce programme crée lui-même le pont et la configuration : `SteamiConfig(DaplinkBridge(I2C(1)))`. Sans la couche `steami`, appeler `bridge.has_config_zone()` avant `load()` sur une carte dont le DAPLink est ancien : sur ces firmwares, les commandes de la zone de configuration bloquent le pont (voir [DaplinkBridge](../daplink#daplinkbridge)). `Steami.config()` fait ce test.

### Modifier la configuration

:::danger

`save()` efface toute la zone de configuration, puis y écrit la copie que le programme a en mémoire : révision, nom, calibrations et compteur de démarrages. Avant un `save()` :

- lancer d'abord `show_config.py` et noter ce qu'il affiche. Une lecture ratée ressemble à une zone vide : `save()` effacerait alors les calibrations ;
- ne pas interrompre le programme (bouton **Reset**, câble USB, **Arrêter**) pendant `save()` : entre l'effacement et l'écriture, la zone est vide.

:::

Les méthodes `set_…` et les affectations comme `config.board_name = "…"` ne changent que la copie en mémoire ; `save()` l'écrit dans la zone. Ce programme corrige le code de révision et le nom de la carte. Choisir le code de la carte dans le tableau [Identifier sa version](/docs/hardware/revisions#identifier-sa-version) (`111`, `121` ou `131` pour une carte de série) :

```python
from steami import Steami

config = Steami.config()
if config is None:
    print("Pas de zone de configuration : mettre à jour le DAPLink")
else:
    print("Avant :", config.board_revision, config.board_name)
    config.board_revision = 131  # code de CETTE carte
    config.board_name = "STeaMi-07"
    config.save()  # réécrit toute la zone
    print("Enregistré")
```

Le code de révision s'écrit une seule fois, par exemple par l'enseignant. Au démarrage suivant, `Steami.begin()` affiche `[STeaMi] Board V1c (read from the board config, revision 131)`.

Les autres méthodes de `SteamiConfig` (calibrations, compteur de démarrages) sont listées dans [DAPLink — SteamiConfig](../daplink#steamiconfig) et dans le [README de `steami_config`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/README.md).

## Les calibrations des capteurs

La zone de configuration peut garder une calibration pour plusieurs capteurs :

| Clé  | Contenu                                                                        | Capteur                                         | Mesures corrigées par `steami`                                      |
| ---- | ------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------- |
| `tc` | gain `g` et décalage `o` de la température, par capteur (`bme`, `hid`, `pad`…) | BME280, WSEN-HIDS, WSEN-PADS, LIS2MDL, ISM330DL | `Temperature`                                                       |
| `ca` | décalages `ox`, `oy`, `oz` de l'accéléromètre, en g                            | ISM330DL                                        | `Accelerometer`                                                     |
| `cm` | décalages `hx`, `hy`, `hz` et échelles `sx`, `sy`, `sz` du magnétomètre        | LIS2MDL                                         | `Magnetometer` (décalages seuls), `Compass` (décalages et échelles) |

La température corrigée vaut `mesure × gain + décalage`.

### Une calibration appliquée sans rien faire

Les classes de la couche `steami` appliquent ces calibrations automatiquement, une fois par capteur, à leur démarrage (`begin()` ou première mesure), même quand la release est forcée : le programme n'a rien à faire. `Steami.print_info()` ajoute alors `, calibrated` à la ligne du capteur, par exemple `BME280 0x76 OK, calibrated`. Ce programme ne modifie rien : il fait une mesure avec trois classes, puis affiche l'état des capteurs.

```python run
from steami import Accelerometer, Magnetometer, Steami, Temperature

print("Température :", Temperature().read(), "°C")
print("Accélération :", Accelerometer().read())
print("Champ magnétique :", Magnetometer().read())
Steami.print_info()
```

Sans zone de configuration, ou sans calibration pour un capteur, les mesures ne changent pas. Un driver créé dans le programme, comme `BME280(I2C(1))`, ne reçoit pas la calibration : pour des mesures calibrées, garder les classes de `steami`, ou le driver partagé (`Steami.bme280()`) après `Steami.calibrate(Chip.BME280)`. Les décalages de température de `mag` et `ism` ne sont appliqués par aucune classe : ils servent aux programmes qui lisent la température du LIS2MDL ou de l'ISM330DL avec leur driver et `config.apply_temperature_calibration(driver)`.

Les outils de calibration sont dans [lib/steami_config/examples](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config/examples). Ils **écrivent dans la zone de configuration** avec `save()` : lire les mises en garde de [Modifier la configuration](#modifier-la-configuration) avant de les lancer.

### Calibrer la température

L'outil [`calibrate_temperature.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/calibrate_temperature.py) prend un capteur de la carte comme référence et donne aux autres un décalage pour qu'ils mesurent comme lui. Laisser d'abord la carte quelques minutes à température stable, loin d'une source de chaleur (main, lampe, ordinateur). La référence dépend de la release :

<ReleaseTabs>
<Release releases="v1a v1b">

La référence est le WSEN-HIDS (clé `hid`, gain 1 et décalage 0). L'outil calcule un décalage pour le WSEN-PADS (`pad`), le LIS2MDL (`mag`) et l'ISM330DL (`ism`). Il retire aussi l'ancienne clé `hts`, que d'anciennes versions de l'outil écrivaient pour le WSEN-HIDS.

</Release>
<Release releases="v1c">

La référence est le BME280 (clé `bme`, gain 1 et décalage 0), seul capteur de température d'environnement de la V1c. L'outil calcule un décalage pour le LIS2MDL (`mag`) et l'ISM330DL (`ism`).

</Release>
</ReleaseTabs>

L'outil reconnaît la release avec `Steami.begin()` : le même fichier tourne sur les trois releases. Il s'arrête sans rien écrire si la release est inconnue ou si la carte n'a pas de zone de configuration.

```python file=.external/micropython-steami-lib/lib/steami_config/examples/calibrate_temperature.py norun

```

Cet outil ne corrige pas la référence elle-même : il aligne les capteurs de la carte entre eux. Pour corriger la référence d'après un thermomètre, enregistrer son gain et son décalage avec `config.set_temperature_calibration("bme280", gain, offset)` (ou `"wsen_hids"` sur une V1a ou une V1b), puis `config.save()`.

`Temperature.set_offset()` de la couche `steami` corrige aussi la mesure, mais seulement pour cet objet et jusqu'au redémarrage : rien n'est écrit dans la zone de configuration.

### Calibrer l'accéléromètre

L'outil [`calibrate_accelerometer.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/calibrate_accelerometer.py) mesure les décalages de l'ISM330DL pendant que la carte est posée à plat, écran vers le haut, immobile. Il enregistre les décalages `ox`, `oy` et `oz` (clé `ca`), puis relit la zone et affiche cinq mesures corrigées. La carte doit rester immobile pendant les deux secondes d'attente et les deux secondes de mesure.

### Calibrer la boussole

L'outil [`calibrate_magnetometer.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/calibrate_magnetometer.py) guide la calibration du LIS2MDL sur l'écran de la carte (`steami.Screen`, sur les trois releases) : appuyer sur **MENU**, puis tourner la carte dans toutes les directions pendant les 12 secondes d'acquisition. Il enregistre les décalages et les échelles (clé `cm`), puis relit la zone et affiche cinq caps.

`Compass.calibrate()` et `Magnetometer.calibrate()` de la couche `steami` font la même mesure, mais gardent le résultat en mémoire jusqu'au redémarrage : rien n'est écrit dans la zone de configuration.

### Programmes à éviter sur une carte calibrée

Ces exemples écrivent dans la zone de configuration sans calibrer :

- [`daplink_flash/examples/config_zone.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/daplink_flash/examples/config_zone.py) efface **toute** la zone de configuration et y laisse des données de test : le code de révision, le nom et les calibrations sont perdus ;
- [`steami_config/examples/populate_demo_config.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/populate_demo_config.py) remplace toute la configuration par des valeurs fictives, réservées aux essais ;
- [`steami_config/examples/boot_counter.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami_config/examples/boot_counter.py) ajoute 1 au compteur de démarrages et réécrit toute la zone à chaque lancement. Enregistré comme `main.py`, il réécrit la zone à chaque démarrage : la flash du STM32F103 ne supporte qu'un nombre limité d'effacements.

Avant de les lancer, noter ce qu'affiche `show_config.py` : les valeurs se réécrivent ensuite avec les méthodes `set_…` de `SteamiConfig`, puis `save()`.

## Ce qui survit à une mise à jour

Chaque mémoire a son propre microcontrôleur : une mise à jour n'efface que la mémoire du microcontrôleur qu'elle reprogramme.

| Données                                   | Installation de MicroPython | Mise à jour du DAPLink | `clear_flash()`               |
| ----------------------------------------- | --------------------------- | ---------------------- | ----------------------------- |
| Fichiers de `/flash` (`main.py`, relevés) | **effacés**                 | gardés                 | gardés                        |
| Fichier du disque USB (W25Q64)            | gardé                       | gardé                  | **contenu effacé**, nom gardé |
| Zone de configuration (calibrations)      | gardée                      | gardée                 | gardée                        |
| [Pile radio Bluetooth](../pile-radio)     | gardée                      | gardée                 | gardée                        |

- **Installation de MicroPython** (par le bouton du wiki, voir [Installation de MicroPython](./essayer#installation-de-micropython), ou en déposant le fichier `.hex` sur le lecteur **STEAMI**, voir [Installation du firmware](./install)). Elle efface toute la flash du STM32WB55 avant d'écrire le firmware, sauf la pile radio : `main.py` et les autres fichiers de `/flash` disparaissent, et MicroPython crée un système de fichiers neuf au démarrage suivant. Le DAPLink fait cet effacement complet pour tout fichier déposé sur le lecteur ([`flash_manager.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/daplink/drag-n-drop/flash_manager.c) : la STeaMi n'active pas l'effacement page par page). Il en va de même quand un programme Arduino remplace MicroPython, ou pour la [vérification de la pile radio](../pile-radio) depuis le wiki. Copier d'abord les fichiers sur l'ordinateur, par exemple avec `mpremote cp :main.py .` ou avec [Thonny](./thonny#gérer-les-fichiers).
- **Mise à jour du DAPLink** depuis le lecteur **MAINTENANCE** (voir [DAPLink — Mise à jour du firmware](../daplink#mise-à-jour-du-firmware)). Elle remplace le firmware d'interface du STM32F103 sans effacer la zone de configuration, placée hors de cette partie de la flash (voir [Architecture flash F103](../daplink#architecture-flash-f103)). Elle ne touche ni la flash du STM32WB55 ni la W25Q64.
- **Installation initiale avec DapLink-EasyFlash** (voir [DAPLink — Installation initiale](../daplink#installation-initiale-daplink-easyflash)). Elle déverrouille et efface toute la flash du STM32F103 : la zone de configuration est perdue, avec le code de révision et les calibrations. Noter d'abord ce qu'affiche `show_config.py` pour les réécrire ensuite.

## Voir aussi

- [DAPLink](../daplink) : protocole I2C du pont, API de `daplink_bridge`, `daplink_flash` et `steami_config`, format de la zone de configuration
- [Arduino — Fichier sur le disque USB](../arduino/capteurs#fichier-sur-le-disque-usb) et [Arduino — Calibrations](../arduino/carte#calibrations) : les mêmes mémoires en Arduino
- [Hardware — STM32F103](/docs/hardware/main-components/stm32f103) et [Flash W25Q64](/docs/hardware/main-components/w25q64)
- [Révisions de la carte](/docs/hardware/revisions#identifier-sa-version) : codes de révision
- Code source : [daplink_bridge](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_bridge), [daplink_flash](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/daplink_flash), [steami_config](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_config), [steami](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami)
