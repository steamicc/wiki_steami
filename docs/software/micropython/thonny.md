---
title: Thonny
sidebar_position: 8
---

# Thonny

[Thonny](https://thonny.org/) est un éditeur Python graphique adapté aux débutants, avec un support intégré de MicroPython.

## Fonctionnalités

- Éditeur de code avec coloration syntaxique
- REPL MicroPython intégré
- Gestionnaire de fichiers (carte ↔ ordinateur)
- Débogueur pas-à-pas
- Installation de packages MicroPython
- Disponible sur Windows, macOS et Linux

## Installation

Télécharger depuis [thonny.org](https://thonny.org/) ou via pip :

```bash
pip install thonny
```

## Configuration pour la carte STeaMi

1. Ouvrir Thonny
2. Menu **Outils** → **Options** → **Interpréteur**
3. Sélectionner **MicroPython (generic)**
4. Choisir le port série de la carte STeaMi (ex: `/dev/ttyACM0` ou `COMx`)
5. Cliquer **OK**

Le REPL MicroPython apparaît dans le panneau inférieur.

## Utilisation

### Écrire et exécuter du code

1. Écrire le code dans l'éditeur
2. Cliquer sur le bouton **Run** (ou F5)
3. Choisir **MicroPython device** comme destination

### Gérer les fichiers

Le panneau **Fichiers** (menu **Affichage** → **Fichiers**) permet de :

- Voir les fichiers sur la carte et sur l'ordinateur
- Glisser-déposer des fichiers entre les deux
- Créer, renommer et supprimer des fichiers

### Installer des drivers

1. Copier le dossier du driver (ex: `ism330dl/`) vers la carte via le panneau Fichiers
2. Le driver est disponible dans `lib/` sur la carte

## Voir aussi

- [mpremote](./mpremote) — Alternative en ligne de commande
- [Vittascience](./vittascience) — IDE en ligne avec programmation par blocs
- [Premiers pas](../getting-started) — Guide de démarrage
- [Documentation Thonny](https://thonny.org/)
