---
title: 5. Firmware MicroPython
sidebar_position: 5
---

# 5. Firmware MicroPython

Le firmware MicroPython s'écrit sur le premier cœur du STM32WB55, à la place de l'opérateur laissé par l'[étape 4](./pile-radio). Il contient tous les drivers de [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib), compilés dans le firmware (modules _frozen_) : les étapes suivantes n'ont aucun fichier à copier sur la carte.

Un utilisateur installe MicroPython depuis le navigateur, avec le bouton **Essayer sur la carte** (voir [Premier essai pas à pas](/docs/software/micropython/premier-essai#3-installer-micropython-si-la-carte-le-demande)) ou par une copie de fichier (voir [Installation du firmware](/docs/software/micropython/install)). En fabrication, la copie de fichier se prête mieux à une série : elle ne demande ni navigateur ni clic.

## Fichier

Le firmware est celui de la release du dépôt micropython-steami-lib retenue par le wiki, aujourd'hui [v0.38.0](https://github.com/steamicc/micropython-steami-lib/releases/tag/v0.38.0) : [`steami-micropython-firmware-v0.38.0.hex`](https://github.com/steamicc/micropython-steami-lib/releases/download/v0.38.0/steami-micropython-firmware-v0.38.0.hex) ou sa version `.bin`. La release contient aussi un fichier `steami-daplink-firmware-v0.38.0` : ne pas le confondre avec le firmware DAPLink de l'[étape 2](./firmware-daplink), qui vient des releases du dépôt DAPLink.

## Installation

Copier le fichier sur le lecteur **STEAMI** de la carte. Le DAPLink écrit le STM32WB55 par SWD, puis le redémarre sur le nouveau programme (voir [Chaîne de démarrage](/docs/hardware/main-components/stm32f103#chaîne-de-démarrage)).

Depuis un clone de micropython-steami-lib, le script [`deploy_usb.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/scripts/deploy_usb.py) trouve le lecteur de la carte, y copie le fichier et vide les caches d'écriture :

```bash
python3 scripts/deploy_usb.py steami-micropython-firmware-v0.38.0.bin
```

L'effacement et l'écriture de la flash du STM32WB55 n'effacent pas la pile radio du second cœur (voir [Pile radio Bluetooth](/docs/software/pile-radio)).

## Résultat attendu

Une fois le lecteur revenu, la version de la bibliothèque compilée dans le firmware se lit par le port série, comme le fait le bouton **Essayer sur la carte** :

```bash
mpremote connect /dev/ttyACM0 exec "from steami.version import VERSION; print(VERSION)"
```

La réponse attendue est `v0.38.0`. Un firmware compilé localement répond `dev`.

Les lectures du FUS et de la pile radio, prévues aux étapes [3](./fus#résultat-attendu) et [4](./pile-radio#résultat-attendu), se font à partir d'ici.
