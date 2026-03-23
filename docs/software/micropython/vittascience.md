---
title: Vittascience
sidebar_position: 9
---

# Vittascience

[Vittascience](https://fr.vittascience.com/steami/) est un environnement de programmation en ligne qui permet de coder en blocs (type Scratch) ou directement en MicroPython.

## Fonctionnalités

- Programmation par **blocs visuels** (type Scratch)
- Programmation en **MicroPython** (éditeur de code)
- Mode **hybride** : blocs et code affichés simultanément
- **Simulateur** intégré pour tester sans carte physique
- **Console série** intégrée
- Connexion directe à la carte via **Web USB**

## Prérequis

- **Navigateur** : Chrome, Edge ou autre navigateur basé sur Chromium (Web USB requis)
- **Firmware MicroPython** installé sur la carte STeaMi
- Connexion USB

:::caution
Vittascience nécessite un navigateur Chromium. Firefox et Safari ne supportent pas le Web USB.
:::

## Utilisation

1. Aller sur [fr.vittascience.com/steami](https://fr.vittascience.com/steami/)
2. Sélectionner la carte STM32 (NUCLEO-WB55 ou STeaMi si disponible)
3. Connecter la carte via USB
4. Cliquer sur **Connecter** (autoriser la connexion Web USB)
5. Programmer en blocs ou en Python
6. Cliquer sur **Exécuter** pour envoyer le code à la carte

## Intérêt pédagogique

Vittascience est particulièrement adapté pour :

- L'apprentissage de la programmation (transition blocs → texte)
- Les cours de technologie au collège et lycée
- Le prototypage rapide sans installation locale

## Voir aussi

- [mpremote](./mpremote) — Outil en ligne de commande
- [Thonny](./thonny) — Éditeur graphique local
- [Premiers pas](../getting-started) — Guide de démarrage
- [Vittascience](https://fr.vittascience.com/steami/) — Accès à la plateforme
