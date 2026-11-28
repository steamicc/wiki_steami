---
title: Premiers pas
sidebar_position: 2
---

# Premiers pas

Guide de démarrage rapide pour la carte STeaMi avec MicroPython.

## Connecter la carte

1. Brancher la carte STeaMi à l'ordinateur via un câble **USB** : micro-USB pour la V1a et la V1b, USB-C pour la V1c (voir [Révisions](../hardware/revisions#identifier-sa-version))
2. La carte apparaît comme :
   - Un **disque USB** (STEAMI) — pour le drag-and-drop de firmware
   - Un **port série** (CDC) — pour la communication REPL

Ces deux interfaces viennent du firmware DAPLink du STM32F103. Pendant ce temps, le STM32WB55 démarre le programme de sa flash, ici MicroPython. Le détail de chaque étape est dans [STM32F103 — Chaîne de démarrage](../hardware/main-components/stm32f103#chaîne-de-démarrage).

[![Chaîne de démarrage de la STeaMi V1c : le STM32F103 lance le firmware DAPLink, qui présente le lecteur STEAMI et le port série, programme le STM32WB55 par SWD puis le relance ; le STM32WB55 démarre en flash sur MicroPython ou sur un croquis Arduino](/img/diagrams/chaine-demarrage.svg)](pathname:///img/diagrams/chaine-demarrage.svg)

## Installer mpremote

[mpremote](https://docs.micropython.org/en/latest/reference/mpremote.html) est l'outil officiel MicroPython pour interagir avec la carte depuis le terminal.

```bash
pip install mpremote
```

Vérifier la connexion :

```bash
mpremote connect list
```

## Premier programme

### Méthode 1 : REPL interactif

Ouvrir un terminal REPL sur la carte :

```bash
mpremote repl
```

Taper du code Python directement :

```python
from machine import I2C
i2c = I2C(1)
print(i2c.scan())
```

Cela affiche la liste des adresses I2C des périphériques connectés sur le bus interne.

### Méthode 2 : Exécuter un script

Quitter d'abord le REPL de la méthode 1 (`Ctrl+]`) : tant que `mpremote repl` est ouvert, il occupe la carte. Avec Chrome ou Edge, le bouton **Essayer sur la carte** sous le programme ci-dessous le lance aussi depuis la page, sans fichier ni terminal (voir [Essayer le code sur la carte](./micropython/essayer)).

Créer un fichier `hello.py` :

```python run
from machine import I2C

i2c = I2C(1)
devices = i2c.scan()
print(f"Périphériques I2C détectés : {len(devices)}")
for addr in devices:
    print(f"  0x{addr:02X}")
```

L'exécuter sur la carte :

```bash
mpremote run hello.py
```

## Lire un capteur

Exemple : lire l'accéléromètre ISM330DL sans installation permanente. Depuis la racine d'un clone de [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) :

```bash
mpremote mount lib/ism330dl run lib/ism330dl/examples/basic_read.py
```

Contenu de `lib/ism330dl/examples/basic_read.py` :

```python file=.external/micropython-steami-lib/lib/ism330dl/examples/basic_read.py

```

## Installer un driver

### Temporaire (mpremote mount)

Monter le dossier du driver et exécuter un script :

```bash
mpremote mount lib/ism330dl run lib/ism330dl/examples/basic_read.py
```

Le driver est disponible pendant l'exécution mais pas stocké sur la carte.

### Permanent (copier sur la carte)

Copier le driver sur le système de fichiers de la carte :

```bash
mpremote cp -r lib/ism330dl/ism330dl :lib/
```

Le driver est alors disponible en permanence, même après redémarrage.

## Limite RAM

Le STM32WB55 dispose de 256 Ko de RAM. L'utilisation simultanée de plusieurs drivers peut saturer la mémoire. Quelques conseils :

- Ne charger que les drivers nécessaires
- Utiliser `gc.collect()` régulièrement
- Préférer `mpremote mount` pour le développement (pas de copie sur la flash interne)

Voir [issue #175](https://github.com/steamicc/micropython-steami-lib/issues/175) pour plus de détails.

## Étapes suivantes

- [MicroPython](./micropython/) — Installation du firmware, conventions API, tutoriels par composant
- [DAPLink](./daplink) — Firmware interface, protocole I2C, flash externe
- [Hardware](../hardware/) — Description détaillée du matériel
