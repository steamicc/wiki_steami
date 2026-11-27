---
title: Programmer avec PlatformIO
sidebar_position: 2.5
---

# Programmer avec PlatformIO

[PlatformIO](https://platformio.org/) est une extension de Visual Studio Code pour programmer des microcontrôleurs. Elle utilise le même langage et les mêmes bibliothèques que l'Arduino IDE, avec les outils d'un éditeur de code professionnel : complétion, navigation dans le code, plusieurs fichiers par projet, gestion de versions. C'est une bonne suite pour des élèves qui ont pris en main l'[Arduino IDE](./arduino-ide).

PlatformIO ne connaît pas encore la carte STeaMi : chaque projet contient sa définition, dans un fichier `boards/steami.json`. Le reste se règle dans le fichier `platformio.ini` du projet.

## Installer PlatformIO

1. Installer [Visual Studio Code](https://code.visualstudio.com/).
2. Dans l'onglet **Extensions**, rechercher **PlatformIO IDE** et l'installer.
3. Redémarrer Visual Studio Code. Une icône de tête de fourmi apparaît dans la barre latérale.

![Vue Extensions de Visual Studio Code : la recherche « platformio » affiche l'extension PlatformIO IDE, éditée par PlatformIO](/img/software/arduino/platformio-01-extension.png)

Au premier projet, PlatformIO télécharge tout seul le compilateur, le paquet STM32 et les bibliothèques : prévoir quelques minutes et un accès à Internet.

## Créer un projet STeaMi

Créer un dossier pour le projet, avec cette arborescence :

```text
mon-projet/
├── platformio.ini
├── boards/
│   └── steami.json
└── src/
    └── main.cpp
```

### platformio.ini

```ini
[env:steami]
platform = ststm32@^20
platform_packages =
  platformio/framework-arduinoststm32@~4.30100.0
board = steami
framework = arduino
monitor_speed = 115200
lib_deps =
  https://github.com/steamicc/arduino-steami.git#v0.41.0
```

- `platform_packages` choisit la version 3.1.0 du core STM32duino, celle qu'installe l'Arduino IDE : un programme se compile de la même façon dans les deux outils.
- `board = steami` désigne le fichier `boards/steami.json` du projet.
- `lib_deps` installe la bibliothèque STeaMi, qui contient les drivers de la carte, dans la version indiquée après `#` (voir les [versions publiées](https://github.com/steamicc/arduino-steami/releases)). PlatformIO installe aussi la bibliothèque STM32duinoBLE, dont elle dépend.
- D'autres bibliothèques s'ajoutent sur des lignes suivantes de `lib_deps`, avec leur nom dans le [registre PlatformIO](https://registry.platformio.org/) (par exemple `adafruit/Adafruit NeoPixel`).

![Projet STeaMi ouvert dans Visual Studio Code : l'explorateur montre boards/steami.json, src/main.cpp et platformio.ini, affiché dans l'éditeur](/img/software/arduino/platformio-02-projet.png)

### boards/steami.json

Ce fichier décrit la carte : microcontrôleur, mémoire, variante du core STM32duino, outils de téléversement. Il est identique à celui du dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib/blob/main/boards/steami.json).

```json
{
  "build": {
    "core": "stm32",
    "cpu": "cortex-m4",
    "extra_flags": "-DSTM32WB -DSTM32WB55xx",
    "f_cpu": "64000000L",
    "mcu": "stm32wb55rg",
    "product_line": "STM32WB55xx",
    "variant": "STM32WBxx/WB55R(C-E-G)V",
    "arduino": {
      "board": "STEAM32_WB55RG",
      "variant_h": "variant_STEAM32_WB55RG.h"
    }
  },
  "debug": {
    "default_tools": ["cmsis-dap"],
    "onboard_tools": ["cmsis-dap"],
    "jlink_device": "STM32WB55xx",
    "openocd_target": "stm32wbx",
    "svd_path": "STM32WB55_CM4.svd"
  },
  "frameworks": ["arduino"],
  "name": "STeaMi",
  "platform": "ststm32",
  "url": "https://www.steami.cc/",
  "vendor": "STeaMi",
  "upload": {
    "maximum_ram_size": 196608,
    "maximum_size": 524288,
    "protocol": "cmsis-dap",
    "protocols": ["cmsis-dap", "blackmagic", "jlink", "stlink"]
  }
}
```

### src/main.cpp

Les programmes de la [page Capteurs et écran](./capteurs) fonctionnent tels quels, avec une différence : un fichier `.cpp` doit commencer par `#include <Arduino.h>`, que l'Arduino IDE ajoute en coulisses.

```cpp
#include <Arduino.h>

void setup() {
  pinMode(LED_GREEN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(LED_GREEN, HIGH);
  Serial.println("allumée");
  delay(500);
  digitalWrite(LED_GREEN, LOW);
  delay(500);
}
```

Autre différence avec l'Arduino IDE : une fonction doit être déclarée avant d'être appelée. Placer ses fonctions au-dessus de `setup()`, ou déclarer leur prototype en haut du fichier.

## Compiler, téléverser, lire le port série

Ouvrir le dossier du projet dans Visual Studio Code (**Fichier → Ouvrir le dossier**). La barre d'état, en bas de la fenêtre, propose alors :

![Barre d'état de Visual Studio Code avec les boutons de PlatformIO : accueil, compiler (info-bulle « PlatformIO: Build »), téléverser, nettoyer, tester, moniteur série, terminal, environnement et port](/img/software/arduino/platformio-03-barre-etat.png)

| Bouton          | Action                                  | Commande équivalente |
| --------------- | --------------------------------------- | -------------------- |
| ✓ (Build)       | compiler                                | `pio run`            |
| → (Upload)      | compiler et téléverser                  | `pio run -t upload`  |
| prise (Monitor) | ouvrir le moniteur série à 115200 bauds | `pio device monitor` |

Le téléversement passe par l'interface **CMSIS-DAP** du DAPLink de la carte. Le moniteur série se ferme avec `Ctrl+C`.

![Terminal de Visual Studio Code après un téléversement : Programming Finished, Verified OK, puis SUCCESS](/img/software/arduino/platformio-04-televersement.png)

### Téléverser par le disque STEAMI

Si le téléversement CMSIS-DAP échoue (pilote ou droits manquants), PlatformIO peut copier le programme sur le disque **STEAMI**, comme un glisser-déposer. Ajouter à `platformio.ini` :

```ini
[env:steami_disque]
extends = env:steami
upload_protocol = mbed
upload_port = E:
```

`upload_port` est l'emplacement du disque STEAMI : une lettre de lecteur sous Windows (`E:`), `/Volumes/STeaMi` sous macOS, `/run/media/<utilisateur>/STeaMi` ou `/media/<utilisateur>/STeaMi` sous Linux. PlatformIO ne détecte pas ce disque tout seul : le chemin doit être indiqué.

Choisir ensuite l'environnement `steami_disque` dans la barre d'état avant de téléverser, ou lancer `pio run -e steami_disque -t upload`.

## Déboguer pas à pas

L'interface CMSIS-DAP du DAPLink sert aussi de sonde de débogage : pas besoin de matériel supplémentaire.

1. Poser un point d'arrêt en cliquant dans la marge, à gauche du numéro de ligne : un point rouge apparaît.
2. Ouvrir l'onglet **Exécuter et déboguer** et lancer la configuration **PIO Debug** (bouton vert, ou touche `F5`). PlatformIO compile une version de débogage et la téléverse.
3. Le programme s'arrête une première fois tout au début, dans le fichier `main.cpp` du core STM32, avant `setup()`. Cliquer sur **Continuer** (premier bouton de la barre de débogage, en haut de l'éditeur).
4. Le programme s'arrête sur le point d'arrêt. Les boutons de la barre de débogage avancent ligne par ligne, et le panneau de gauche affiche les variables et la pile des appels.

![Session PIO Debug arrêtée sur un point d'arrêt à la ligne 10 de loop() : la ligne est surlignée, la barre de débogage est en haut, la pile des appels montre loop puis main](/img/software/arduino/platformio-05-debogage.png)

Le bouton carré rouge de la barre de débogage arrête la session.

## Dépannage

### `Error: unable to find CMSIS-DAP device` sous Linux

Il manque les règles `udev` qui donnent accès à l'interface du DAPLink. La procédure est décrite dans la section [Troubleshooting uploads](https://github.com/steamicc/arduino-steami-lib#troubleshooting-uploads) du dépôt arduino-steami-lib. En attendant, le [téléversement par le disque STEAMI](#téléverser-par-le-disque-steami) fonctionne sans réglage.

### `Unknown board ID 'steami'`

Le fichier `boards/steami.json` est absent ou mal placé : il doit se trouver dans un dossier `boards` à côté de `platformio.ini`.

### Le moniteur série n'affiche rien

Vérifier `monitor_speed = 115200` dans `platformio.ini`. Les messages écrits dans `setup()` partent avant l'ouverture du moniteur : appuyer sur le bouton reset de la carte une fois le moniteur ouvert.

## Voir aussi

- [Bibliothèques STeaMi](./bibliotheques) : les drivers de chaque composant et le bus I²C interne.
- [Capteurs et écran](./capteurs) : un programme minimal pour chaque fonction, avec sa classe puis avec le driver du composant.
- [Développer les drivers](./contribuer) : pour modifier la bibliothèque STeaMi elle-même.
- [Documentation PlatformIO](https://docs.platformio.org/) : référence de `platformio.ini` et des commandes.
