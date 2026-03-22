---
title: Premiers pas
sidebar_position: 2
---

# Premiers pas

Guide de démarrage rapide pour la carte STeaMi avec MicroPython.

## Connecter la carte

1. Brancher la carte STeaMi à l'ordinateur via le câble **micro-USB**
2. La carte apparaît comme :
   - Un **disque USB** (STEAMI) — pour le drag-and-drop de firmware
   - Un **port série** (CDC) — pour la communication REPL

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

Créer un fichier `hello.py` :

```python
from machine import I2C
from time import sleep_ms

i2c = I2C(1)
devices = i2c.scan()
print(f"Peripheriques I2C detectes : {len(devices)}")
for addr in devices:
    print(f"  0x{addr:02X}")
```

L'exécuter sur la carte :

```bash
mpremote run hello.py
```

## Lire un capteur

Exemple : lire l'accéléromètre ISM330DL sans installation permanente.

```bash
mpremote mount lib/ism330dl run lib/ism330dl/examples/basic_read.py
```

Ou avec le code directement :

```python
from machine import I2C
from time import sleep_ms
from ism330dl import ISM330DL

i2c = I2C(1)
imu = ISM330DL(i2c)

while True:
    ax, ay, az = imu.acceleration_g()
    temp = imu.temperature_c()
    print(f"Accel: X={ax:+.2f} Y={ay:+.2f} Z={az:+.2f} g  Temp: {temp:.1f}°C")
    sleep_ms(500)
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
