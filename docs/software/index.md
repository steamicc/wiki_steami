---
title: Programmation
sidebar_position: 1
---

# Programmation

La carte STeaMi est programmable en plusieurs langages. Cette section documente les environnements de développement, les drivers et les exemples d'utilisation pour chaque composant.

## Premiers pas

Nouveau sur la carte STeaMi ? Commencez ici :

- [**Premiers pas**](./getting-started) — Connecter la carte, installer mpremote, lancer un premier programme, lire un capteur

## Langages

| Langage                           | Maturité  | Description                                        |
| --------------------------------- | --------- | -------------------------------------------------- |
| [**MicroPython**](./micropython/) | Complète  | 15 drivers, 52 exemples, framework de test         |
| [**CODAL**](./codal/)             | Partielle | Runtime C++ avec support des principaux composants |
| [**Arduino**](./arduino/)         | Minimale  | Support STM32duino de base, à développer           |

## Outils et firmware

- [**DAPLink**](./daplink) — Firmware du STM32F103 : protocole I2C, flash externe, config persistante, mise à jour
- [**Compatibilité par composant**](./compatibility) — Matrice détaillée du support par langage et par composant

## Ressources

- [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) — Drivers MicroPython (15 drivers, 52 exemples)
- [DAPLink](https://github.com/steamicc/DAPLink) — Firmware du STM32F103 (branche `release_letssteam`)
- [MicroPython](https://docs.micropython.org/en/latest/) — Documentation officielle MicroPython
- [stm32python.gitlab.io](https://stm32python.gitlab.io/fr/) — Tutoriels STM32 + MicroPython
