---
title: PlatformIO (contributeurs)
sidebar_position: 6
---

# Développer les drivers avec PlatformIO

Cette page s'adresse aux personnes qui modifient les drivers ou en écrivent de nouveaux. Pour programmer la carte en classe, l'[Arduino IDE](./arduino-ide) suffit.

Le dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) se compile avec **PlatformIO**. Les commandes courantes passent par un `Makefile`, qui installe tous les outils dans un environnement Python local (`.venv/`).

:::note Systèmes pris en charge
Le `Makefile` est écrit pour Linux et macOS. Sous Windows, utiliser [WSL](https://learn.microsoft.com/fr-fr/windows/wsl/) ou appeler PlatformIO directement (extension PlatformIO de Visual Studio Code).
:::

## Prérequis

- une carte **STeaMi** et un câble USB de données ;
- **Python 3** avec le module `venv` (sous Debian ou Ubuntu : `sudo apt install python3-venv`) ;
- **Node.js** et `npm`, pour les hooks Git du projet ;
- `make` et Git.

## Installer l'environnement

```bash
git clone https://github.com/steamicc/arduino-steami-lib.git
cd arduino-steami-lib
make setup
```

`make setup` crée l'environnement Python `.venv/`, y installe PlatformIO, `clang-format` et `clang-tidy` (versions fixées dans `requirements.txt`), installe les dépendances Node.js et active les hooks Git.

Si Python est mis à jour sur la machine, l'environnement `.venv/` peut cesser de fonctionner (`No module named 'platformio'`). Il suffit alors de le supprimer et de relancer `make setup`.

## Compiler et téléverser le programme de test

Le dossier `src/` contient un programme de test qui vérifie la définition de la carte et l'édition de liens des drivers.

```bash
make build    # compiler
make upload   # compiler et téléverser
```

Le téléversement passe par l'interface CMSIS-DAP du DAPLink. La variable `PORT` vaut `/dev/ttyACM0` par défaut ; la changer si la carte apparaît sur un autre port :

```bash
make upload PORT=/dev/ttyACM1
```

## Téléverser un exemple

```bash
make list-examples                  # toutes les cibles disponibles
make list-examples DRIVER=lis2mdl   # filtrer par driver
```

Chaque ligne affichée est une cible prête à l'emploi, par exemple :

```text
flash-lis2mdl/DigitalCompass
flash-wsen-pads/altitude
```

```bash
make flash-lis2mdl/DigitalCompass
```

La commande compile l'exemple, le téléverse, puis ouvre le moniteur série à 115200 bauds (quitter avec `Ctrl+C`).

Le moniteur interactif manque souvent les premières lignes affichées au démarrage. Pour les capturer, remplacer `flash-` par `capture-` : la sortie est lue pendant 10 secondes, ou pendant la durée fixée par `DURATION` (en secondes) :

```bash
make capture-lis2mdl/DigitalCompass DURATION=30
```

Pour utiliser `pio` directement, activer d'abord l'environnement :

```bash
source .venv/bin/activate
pio device monitor -b 115200
```

## Tests

| Commande                | Rôle                                                      |
| ----------------------- | --------------------------------------------------------- |
| `make test-native`      | tests unitaires sur l'ordinateur, sans carte              |
| `make test-hardware`    | tests sur une carte STeaMi connectée                      |
| `make test-integration` | tests de comportement dans la durée, sur carte            |
| `make test-examples`    | compilation de tous les exemples                          |
| `make lint`             | formatage, en-têtes de licence et analyse statique        |
| `make ci`               | ensemble des vérifications faites en intégration continue |

`make help` liste toutes les commandes.

## Dépannage

### `Error: unable to find CMSIS-DAP device` sous Linux

Les règles `udev` installées par défaut ne donnent pas accès à l'interface utilisée par OpenOCD. La procédure (règles à installer, repli sur pyOCD) est décrite dans la section [Troubleshooting uploads](https://github.com/steamicc/arduino-steami-lib#troubleshooting-uploads) du README du dépôt.

### La carte n'est pas détectée

```bash
source .venv/bin/activate
pio device list
```

Si la carte n'apparaît pas, changer de câble : beaucoup de câbles USB ne transportent que la charge.

## Voir aussi

- [Conventions de l'API](./conventions)
- [CONTRIBUTING.md](https://github.com/steamicc/arduino-steami-lib/blob/main/CONTRIBUTING.md) : règles de contribution du dépôt
