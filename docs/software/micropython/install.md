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

## Vérifier l'installation

Ouvrir un terminal REPL :

```bash
mpremote repl
```

Le prompt MicroPython `>>>` doit apparaître. Taper les lignes ci-dessous.

Avec Chrome ou Edge, le bouton **Essayer sur la carte** sous ces lignes les lance aussi depuis la page, sans terminal (voir [Essayer le code sur la carte](./essayer)). Quitter d'abord `mpremote` (`Ctrl+]`) : tant qu'il est ouvert, il occupe la carte.

```python run
import sys
print(sys.implementation)
print(sys.platform)
```

## Voir aussi

- [Premiers pas](../getting-started) — Guide de démarrage rapide
- [mpremote](./mpremote) — Outil en ligne de commande
- [DAPLink](../daplink) — Firmware interface et mise à jour
