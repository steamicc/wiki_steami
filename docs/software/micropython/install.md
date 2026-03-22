---
title: Installation du firmware
sidebar_position: 1
---

# Installation du firmware MicroPython

Le firmware MicroPython pour la carte STeaMi est basé sur le port STM32WB55 de MicroPython.

## Prérequis

- Carte STeaMi connectée via USB
- Le firmware DAPLink fonctionnel sur le STM32F103 (installé en usine)

## Méthode 1 : Drag-and-drop (recommandée)

La carte STeaMi apparaît comme un disque USB (STEAMI) grâce au firmware DAPLink.

1. Télécharger le fichier firmware `.hex` depuis les [releases](https://github.com/steamicc/micropython-steami-lib/releases)
2. Glisser-déposer le fichier `.hex` sur le disque STEAMI
3. La carte redémarre automatiquement avec MicroPython

## Méthode 2 : Via mpremote

Si le firmware MicroPython est déjà installé, on peut le mettre à jour via mpremote :

```bash
mpremote bootloader
```

Cela redémarre la carte en mode bootloader USB. Ensuite, glisser-déposer le nouveau firmware.

## Vérifier l'installation

Ouvrir un terminal REPL :

```bash
mpremote repl
```

Le prompt MicroPython `>>>` doit apparaître. Taper :

```python
import sys
print(sys.implementation)
print(sys.platform)
```

## Voir aussi

- [Premiers pas](../getting-started) — Guide de démarrage rapide
- [mpremote](./mpremote) — Outil en ligne de commande
- [DAPLink](../daplink) — Firmware interface et mise à jour
