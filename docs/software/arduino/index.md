---
title: Arduino
sidebar_position: 5
---

# Arduino / STM32duino

Le support Arduino pour la carte STeaMi est minimal. La carte est compatible avec [STM32duino](https://github.com/stm32duino/Arduino_Core_STM32) mais les drivers spécifiques ne sont pas encore développés.

## État du support

| Composant            | Supporté |
| -------------------- | :------: |
| GPIO de base         |    ✅    |
| I2C / SPI / UART     |    ✅    |
| Capteurs spécifiques |    ❌    |
| Écran OLED           |    ❌    |
| Boutons (MCP23009)   |    ❌    |
| Flash (DAPLink)      |    ❌    |

## Installation de STM32duino

Voir le guide d'installation sur [stm32python.gitlab.io](https://stm32python.gitlab.io/fr/docs/Stm32duino/installation).

## Roadmap

Le support Arduino nécessite le développement de drivers pour chaque composant de la carte. Les contributions sont les bienvenues.

## Voir aussi

- [MicroPython](../micropython/) — Alternative avec support complet
- [CODAL](../codal/) — Alternative C++ avec support partiel
- [STM32duino](https://github.com/stm32duino/Arduino_Core_STM32) — Core Arduino pour STM32
- [Tutoriels STM32duino](https://stm32python.gitlab.io/fr/docs/Stm32duino) — Exercices et ressources
