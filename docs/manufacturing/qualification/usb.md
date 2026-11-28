---
title: 13. USB
sidebar_position: 7
---

# 13. USB

**Ce que le test vérifie** : la carte se présente à l'ordinateur comme le périphérique USB composite que déclare le firmware DAPLink, et chacune de ses fonctions répond. Ce périphérique (VID 0x0D28, PID 0x0204, produit « STeaMi CMSIS-DAP ») regroupe quatre fonctions sur cinq interfaces, décrites dans [STM32F103 — Interfaces USB](/docs/hardware/main-components/stm32f103#interfaces-usb). Aucun scénario de micropython-steami-lib ne teste l'USB.

## Interfaces déclarées

Sous Linux, la commande suivante liste les interfaces du périphérique :

```bash
lsusb -v -d 0d28:0204
```

D'après la configuration du firmware ([`usb_config.c`](https://github.com/steamicc/DAPLink/blob/release_letssteam/source/hic_hal/stm32/stm32f103xb/usb_config.c)), la liste attendue est :

| Interface | Classe USB (`bInterfaceClass`) | Fonction                           |
| --------- | ------------------------------ | ---------------------------------- |
| 0         | 8, stockage de masse           | Lecteur **STEAMI**                 |
| 1         | 2, communication               | Port série CDC (contrôle)          |
| 2         | 10, données CDC                | Port série CDC (données)           |
| 3         | 3, HID                         | CMSIS-DAP v1                       |
| 4         | 255, propre au fabricant       | WebUSB (CMSIS-DAP pour navigateur) |

## Fonctions déjà utilisées par la préparation

La préparation se sert déjà de trois de ces fonctions, et la qualification de la dernière :

| Fonction          | Étape qui s'en sert                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stockage de masse | [Étape 5](../preparation/micropython) : copie du firmware MicroPython sur le lecteur **STEAMI**                                                                                                 |
| CMSIS-DAP (HID)   | Étapes [3](../preparation/fus) et [4](../preparation/pile-radio) : OpenOCD écrit l'opérateur et la pile radio par `interface/cmsis-dap.cfg`                                                     |
| Port série (CDC)  | Étapes 3 et 4 (commandes de l'opérateur), [étape 6](../preparation/configuration-usine) et tous les tests de qualification (`mpremote`)                                                         |
| WebUSB            | Aucune étape : lancer un bloc **Essayer sur la carte** du wiki depuis Chrome ou Edge, par exemple celui de [Vérifier l'installation](/docs/software/micropython/install#vérifier-linstallation) |

Une carte qui a passé toutes les étapes a donc prouvé le stockage de masse, CMSIS-DAP et le port série. Le bloc **Essayer sur la carte** prouve WebUSB : la carte apparaît sous le nom **STeaMi CMSIS-DAP** dans la fenêtre de connexion, et le programme écrit `sys.implementation` dans la console (voir [Premier essai pas à pas](/docs/software/micropython/premier-essai)).

## Résultat attendu

- `lsusb -v -d 0d28:0204` liste les cinq interfaces du tableau ;
- les étapes 3 à 6 et les tests de qualification ont abouti ;
- le bloc **Essayer sur la carte** s'exécute depuis Chrome ou Edge.

Les cinq interfaces ont été établies d'après la configuration du firmware : leur liste n'a pas encore été relevée sur une V1c avec `lsusb`.
