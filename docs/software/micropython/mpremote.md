---
title: mpremote
sidebar_position: 2
---

# mpremote

[mpremote](https://docs.micropython.org/en/latest/reference/mpremote.html) est l'outil officiel MicroPython pour interagir avec la carte depuis le terminal. C'est l'outil recommandé pour le développement sur la carte STeaMi.

## Installation

```bash
pip install mpremote
```

## Commandes essentielles

### Lister les cartes connectées

```bash
mpremote connect list
```

### Ouvrir le REPL

```bash
mpremote repl
```

Quitter avec `Ctrl+]`.

### Exécuter un script

```bash
mpremote run mon_script.py
```

### Monter un dossier local

Permet d'utiliser des drivers sans les copier sur la carte :

```bash
mpremote mount lib/ism330dl run lib/ism330dl/examples/basic_read.py
```

Le contenu du dossier `lib/ism330dl` est disponible comme si il était sur la carte, uniquement pendant l'exécution.

### Copier des fichiers sur la carte

```bash
mpremote cp mon_fichier.py :
mpremote cp -r lib/ism330dl/ism330dl :lib/
```

### Lister les fichiers sur la carte

```bash
mpremote ls
mpremote ls :lib/
```

### Supprimer un fichier

```bash
mpremote rm :main.py
```

### Réinitialiser la carte

```bash
mpremote reset
```

### Entrer en mode bootloader

```bash
mpremote bootloader
```

## Combinaison de commandes

mpremote permet de chaîner plusieurs commandes :

```bash
mpremote mount lib/ism330dl run examples/basic_read.py
mpremote cp -r lib/ism330dl/ism330dl :lib/ + reset
```

## Workflow de développement recommandé

1. **Développement** : utiliser `mpremote mount` pour tester sans copier
2. **Déploiement** : utiliser `mpremote cp -r` pour installer les drivers
3. **Debug** : utiliser `mpremote repl` pour le REPL interactif

## Voir aussi

- [Documentation officielle mpremote](https://docs.micropython.org/en/latest/reference/mpremote.html)
- [Premiers pas](../getting-started) — Guide de démarrage
- [Thonny](./thonny) — Alternative graphique
