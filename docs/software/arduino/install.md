---
title: Installation du firmware
sidebar_position: 1
---

# Installation de l'environnement Arduino

La bibliothèque **arduino-steami-lib** fournit les drivers Arduino/C++ nécessaires pour utiliser les capteurs et périphériques intégrés à la carte STeaMi.

Le dépôt utilise principalement **PlatformIO** pour compiler et téléverser les programmes. Les commandes courantes sont regroupées dans un `Makefile`.

## Prérequis

Pour utiliser le projet, vous devez disposer de :

- une carte **STeaMi** ;
- un câble USB permettant le transfert de données ;
- **Python 3** avec le module `venv` ;
- **Node.js** et `npm` ;
- `make` ;
- Git.

Sous Debian ou Ubuntu, le support des environnements virtuels Python peut être installé avec :

```bash
sudo apt install python3-venv
```

## Télécharger le projet

Cloner le dépôt GitHub puis ouvrir son dossier :

```bash
git clone https://github.com/steamicc/arduino-steami-lib.git
cd arduino-steami-lib
```

## Installer l'environnement de développement

Exécuter la commande suivante à la racine du dépôt :

```bash
make setup
```

Cette commande :

- crée un environnement Python virtuel dans `.venv/` ;
- installe PlatformIO ;
- installe `clang-format` et `clang-tidy` ;
- installe les dépendances Node.js ;
- active les hooks Git du projet.

Les versions des outils Python sont définies dans `requirements.txt`.

## Compiler le firmware

Pour compiler le firmware principal du dépôt :

```bash
make build
```

Cette commande exécute PlatformIO sur l'environnement STeaMi configuré dans le projet.

Elle compile notamment le programme principal situé dans `src/` ainsi que les drivers utilisés par celui-ci.

La compilation permet de vérifier que :

- la configuration de la carte est correcte ;
- les drivers sont compatibles entre eux ;
- le firmware peut être produit sans erreur.

## Téléverser le firmware

Connecter la carte STeaMi en USB, puis exécuter :

```bash
make upload
```

Cette commande compile le firmware si nécessaire, puis le téléverse sur la carte avec PlatformIO.

Le téléversement utilise le programmateur **CMSIS-DAP** intégré à la STeaMi.

Lorsqu'un port doit être précisé, il peut être fourni avec la variable `PORT` :

```bash
make upload PORT=/dev/ttyACM0
```

Sous Windows, le port utilise généralement la forme suivante :

```bash
make upload PORT=COM5
```

## Vérifier le firmware

Après le téléversement, ouvrir le moniteur série à `115200` bauds :

```bash
source .venv/bin/activate
pio device monitor -b 115200
```

Le programme principal du dépôt sert de test de compilation et de détection rapide des drivers intégrés.

Pour quitter le moniteur série, utiliser :

```text
Ctrl+C
```

## Compiler et téléverser un exemple

Le dépôt contient également des exemples propres à chaque driver.

### Lister les exemples

```bash
make list-examples
```

La commande retourne des cibles prêtes à être exécutées, par exemple :

```text
flash-hts221/read_temperature_humidity
flash-wsen-pads/altitude
flash-lis2mdl/compass
```

Il est possible de filtrer les résultats par driver :

```bash
make list-examples DRIVER=hts221
```

### Téléverser un exemple

Copier l'une des cibles affichées et la passer à `make` :

```bash
make flash-hts221/read_temperature_humidity
```

Cette commande :

1. compile l'exemple pour la carte STeaMi ;
2. téléverse le programme ;
3. ouvre le moniteur série à `115200` bauds.

## Capturer les messages de démarrage

Le moniteur série interactif peut manquer les premières lignes envoyées immédiatement après le redémarrage de la carte.

Pour capturer ces messages, remplacer `flash-` par `capture-` :

```bash
make capture-hts221/read_temperature_humidity
```

Cette commande téléverse l'exemple, ouvre le port série avant le redémarrage de la carte, puis capture la sortie pendant 10 secondes.

La durée peut être modifiée avec `DURATION` :

```bash
make capture-hts221/read_temperature_humidity DURATION=30
```

## Commandes principales

| Commande                          | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `make setup`                      | Installe l'environnement de développement complet.       |
| `make build`                      | Compile le firmware principal.                           |
| `make upload`                     | Compile et téléverse le firmware principal.              |
| `make list-examples`              | Liste les exemples disponibles.                          |
| `make flash-<driver>/<exemple>`   | Compile, téléverse et ouvre le moniteur série.           |
| `make capture-<driver>/<exemple>` | Compile, téléverse et capture les messages de démarrage. |
| `make test-native`                | Exécute les tests sur l'ordinateur, sans carte.          |
| `make test-hardware`              | Exécute les tests sur une carte STeaMi.                  |
| `make clean`                      | Supprime les fichiers de compilation.                    |
| `make help`                       | Affiche toutes les commandes disponibles.                |

## Dépannage

### La commande `make setup` échoue

Vérifier que Python peut créer un environnement virtuel :

```bash
python3 -m venv --help
```

Sous Debian ou Ubuntu, installer si nécessaire :

```bash
sudo apt install python3-venv
```

Vérifier également les installations de Node.js et npm :

```bash
node --version
npm --version
```

### La carte n'est pas détectée

Vérifier :

- que le câble USB permet le transfert de données ;
- que la carte est correctement alimentée ;
- que la STeaMi apparaît comme périphérique USB ;
- qu'aucun autre programme n'utilise déjà le port série.

Pour lister les périphériques détectés par PlatformIO :

```bash
source .venv/bin/activate
pio device list
```

### Le téléversement échoue sous Linux

Une erreur telle que :

```text
Error: unable to find CMSIS-DAP device
```

indique généralement que l'utilisateur ne dispose pas des permissions nécessaires pour accéder au programmateur intégré.

Des règles `udev` doivent alors être installées pour autoriser l'accès aux interfaces CMSIS-DAP de la carte.

La procédure complète est détaillée dans la page consacrée à PlatformIO.

## Voir aussi

- [Conventions de l'API](./conventions)
- [Dépôt arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib)

Cette version distingue maintenant clairement le **firmware principal** (`make build` / `make upload`) des **exemples individuels** (`make flash-...`).
