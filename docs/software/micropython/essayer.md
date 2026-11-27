---
title: Essayer le code sur la carte
sidebar_label: Essayer sur la carte
sidebar_position: 1.5
---

import TOCInline from '@theme/TOCInline';

# Essayer le code MicroPython sur la carte

Sous certains programmes MicroPython du wiki, un bouton **Essayer sur la carte** lance le programme sur une carte STeaMi branchée à l'ordinateur, sans rien installer : ni Thonny, ni `mpremote`, ni firmware à télécharger à la main. Une console s'ouvre sous le programme et affiche ce qu'il écrit.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Où trouver le bouton

Le bouton apparaît sous les programmes MicroPython complets, qui peuvent tourner seuls :

- les exemples de la bibliothèque [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) repris dans le wiki, par exemple celui de l'accéléromètre dans [Premiers pas](../getting-started#lire-un-capteur). Ils reçoivent le bouton automatiquement, sauf ceux qui ont besoin d'un driver absent du firmware MicroPython (comme `hts221`) : ils ne pourraient pas tourner tels quels ;
- les programmes écrits directement dans une page et marqués comme exécutables par ses auteurs (voir [Marquer un bloc exécutable](#marquer-un-bloc-exécutable)).

Les extraits de code (quelques lignes qui ne tournent pas seules), les sessions du REPL (lignes qui commencent par `>>>`) et les commandes à taper dans un terminal n'ont pas de bouton.

Le bouton passe par WebUSB : il est prévu pour **Chrome** ou **Edge** sur un ordinateur. Firefox et Safari ne le proposent pas (voir [Sans Chrome ni Edge](#sans-chrome-ni-edge)).

## Lancer un programme

1. Brancher la carte à l'ordinateur avec un câble USB qui transporte les données (certains câbles ne servent qu'à la charge).
2. Fermer Thonny ou `mpremote` s'ils sont ouverts : ils occupent la carte.
3. Sous le programme, cliquer sur **Essayer sur la carte**. Le navigateur ouvre une fenêtre de connexion : choisir **STeaMi CMSIS-DAP**, puis cliquer sur **Connexion**. La carte n'est choisie qu'une fois : ensuite, même après un clic sur **Déconnecter** ou un rechargement de la page, la carte déjà autorisée est reprise sans cette fenêtre, tant qu'elle est la seule STeaMi autorisée. Pour essayer une autre carte, débrancher d'abord celle-ci. La connexion redémarre la carte : le programme qu'elle exécutait, par exemple son `main.py`, repart de zéro, puis le wiki l'interrompt.
4. Le wiki vérifie la carte (voir [Vérifications avant le lancement](#vérifications-avant-le-lancement)), puis lance le programme. La console s'ouvre sous le programme et affiche ce qu'il écrit avec `print()`. Une erreur Python (_traceback_) y est mise en évidence.
5. Cliquer sur **Arrêter** pour interrompre le programme. Lancer un autre programme de la page arrête d'abord celui qui tourne.

Le bouton **Déconnecter** libère la carte, pour que Thonny, `mpremote` ou un Codespace puisse s'en servir.

## Un programme lancé sans être enregistré

Le programme tourne dans la mémoire vive (RAM) de la carte, sans être enregistré : il disparaît quand la carte redémarre. Le `main.py` de la carte et les fichiers qu'elle contient ne sont pas touchés : au prochain démarrage, la carte exécute de nouveau son propre `main.py`.

Certains programmes ont besoin de fichiers annexes, par exemple un `pins.py` qui décrit les broches utilisées. Ces fichiers sont écrits dans un disque en RAM (`/ram`), jamais dans la mémoire flash de la carte : ils disparaissent avec le programme.

**Arrêter** interrompt le programme et redémarre MicroPython sans exécuter le `main.py` de la carte : l'essai suivant part de zéro. Le premier programme lancé après une connexion part aussi de zéro, même si la carte exécutait autre chose avant. Si la carte ne répond plus, appuyer sur le bouton **RESET** de la carte, puis réessayer.

## Vérifications avant le lancement

Avant de lancer le programme, le wiki vérifie le DAPLink de la carte (son firmware d'interface USB), puis la version de MicroPython.

### Mise à jour du DAPLink

Si le DAPLink de la carte est plus ancien que la version retenue par le wiki, un encart propose de le mettre à jour. Cette mise à jour n'est pas obligatoire : dans cet encart, **Plus tard** le masque jusqu'au rechargement de la page, et le programme est lancé.

Le DAPLink ne peut pas se mettre à jour lui-même : **Mettre à jour…** affiche les étapes à suivre à la main, les mêmes que [dans le Codespace](../arduino/codespace#mettre-à-jour-le-daplink-depuis-la-page) :

1. Cliquer sur **Télécharger le firmware** : le fichier `stm32f103xb_steami32_if_crc.bin` arrive dans le dossier des téléchargements.
2. Créer un fichier vide nommé `START_BL.ACT` sur le lecteur de la carte (**STEAMI**) : la carte redémarre et un lecteur **MAINTENANCE** apparaît à la place. La page indique alors que la carte a été déconnectée : c'est normal, les étapes restent affichées.
3. Copier le fichier téléchargé sur le lecteur **MAINTENANCE**, puis attendre que le lecteur de la carte revienne.
4. Cliquer de nouveau sur **Essayer sur la carte**, puis choisir la carte si la fenêtre de connexion s'ouvre.

Le bouton **Plus tard** sous les étapes les masque jusqu'au rechargement de la page, sans lancer le programme : cliquer ensuite de nouveau sur **Essayer sur la carte**. Si le lecteur MAINTENANCE n'apparaît pas, voir [le dépannage du Codespace](../arduino/codespace#le-bouton-redémarrer-la-carte-ne-fonctionne-pas).

### Installation de MicroPython

Le wiki affiche le code d'une version précise de la bibliothèque MicroPython STeaMi, celle du firmware qu'il propose d'installer. Une carte qui a cette version de MicroPython, ou une plus récente, lance le programme directement.

Si la carte n'a pas MicroPython (carte neuve, programme Arduino…) ou si sa version de MicroPython est plus ancienne, un encart propose de l'installer. Rien n'est installé sans un clic sur **Installer MicroPython** (suivi du numéro de version proposé). Après ce clic, le firmware est envoyé à la carte (une barre de progression suit l'envoi), la carte redémarre, puis le programme est lancé. L'installation dure moins d'une minute : pendant ce temps, ne pas débrancher la carte ni fermer la page, sinon la carte reste sans firmware. Après une installation interrompue, débrancher la carte (et sa batterie, s'il y en a une), la rebrancher, puis relancer l'installation.

:::warning

L'installation de MicroPython peut effacer les fichiers enregistrés sur la carte (système de fichiers de MicroPython, avec son `main.py`). Les copier sur l'ordinateur avant de cliquer sur **Installer MicroPython**, avec [Thonny](./thonny#gérer-les-fichiers) ou [mpremote](./mpremote#copier-des-fichiers-sur-la-carte).

:::

### Carte occupée

Si un autre outil utilise déjà la carte (Thonny, `mpremote`) ou si un programme en cours ignore l'interruption (Ctrl-C), MicroPython ne répond pas au wiki. Le wiki redémarre alors la carte une fois (à la connexion, c'est déjà fait) et lui laisse quelques secondes pour démarrer, en renvoyant l'interruption :

- si MicroPython répond, le programme est lancé ;
- si MicroPython démarre sans répondre, le wiki signale que la carte est occupée, sans proposer d'installation ;
- avec un DAPLink trop ancien, ce redémarrage n'est pas possible : l'encart d'installation peut alors apparaître même si MicroPython est installé, et il le rappelle (« Si MicroPython est déjà installé… »).

Quand la carte est signalée occupée, ou quand l'encart d'installation apparaît alors que MicroPython est déjà installé, ne pas installer : fermer l'outil, ou appuyer sur **RESET**, puis réessayer.

## Programmes qui modifient la carte

Quelques exemples modifient la carte de façon durable : ils effacent ou écrivent la mémoire flash externe du DAPLink (les fichiers du lecteur **STEAMI**), ou la zone de configuration de la carte, avec ses calibrations. Ces programmes gardent le bouton, mais le clic ouvre d'abord un encart qui dit ce qui sera modifié. Le programme n'est lancé qu'après **Lancer quand même** ; **Annuler** l'abandonne sans rien envoyer à la carte.

## Sur une V1c

Le firmware MicroPython ne gère pas l'écran rond de la V1c (GC9A01). Sur une V1c, un programme qui dessine à l'écran tourne quand même, mais l'écran reste noir. La console montre ce que le programme écrit. Les V1a et V1b ont un autre écran (SSD1327), géré par MicroPython.

Les capteurs WSEN-PADS, WSEN-HIDS et APDS-9960 ne sont pas montés sur la V1c : leurs exemples s'y arrêtent sur une erreur (voir [Révisions de la carte](/docs/hardware/revisions#capteurs-internes)).

## Sans Chrome ni Edge

Avec un navigateur qui ne sait pas parler à la carte par USB (Firefox, Safari), le bouton est remplacé par un renvoi vers [Thonny](./thonny) et [mpremote](./mpremote) : copier le programme dans Thonny, ou l'enregistrer dans un fichier et le lancer avec `mpremote run`.

## Dépannage

### La carte n'apparaît pas dans la fenêtre de connexion

Vérifier que le câble USB transporte les données (certains câbles ne servent qu'à la charge), puis débrancher et rebrancher la carte, au besoin sur un autre port. Le lecteur **STEAMI** doit apparaître sur l'ordinateur.

### Accès à la carte refusé

Le message « Accès à la carte refusé par le système » apparaît après le choix de la carte :

- sous Linux, il manque sans doute la règle `udev` qui donne au navigateur l'accès à l'interface du DAPLink : la procédure est décrite dans la section [Troubleshooting uploads](https://github.com/steamicc/arduino-steami-lib#troubleshooting-uploads) du dépôt arduino-steami-lib ;
- sinon, un autre onglet ou un autre programme utilise la carte (un autre onglet du wiki, un Codespace) : le fermer, puis réessayer.

### La carte est déjà utilisée par un autre onglet

Une seule page à la fois peut se connecter à la carte. Cliquer sur **Déconnecter** dans l'autre onglet, ou le fermer, puis réessayer.

### La carte a été déconnectée

La carte a été débranchée, ou elle a redémarré sur son lecteur **MAINTENANCE** (mise à jour du DAPLink). La rebrancher si besoin, puis cliquer de nouveau sur **Essayer sur la carte** : si la fenêtre de connexion s'ouvre, choisir la carte une nouvelle fois.

### En dernier recours

Si le bouton ne fonctionne toujours pas, lancer le programme avec [Thonny](./thonny) ou [mpremote](./mpremote) : ils passent par le port série de la carte, sans WebUSB.

## Enregistrer un programme sur la carte

Le bouton ne fait qu'essayer un programme. Pour qu'un programme reste sur la carte et démarre seul à chaque mise sous tension, l'enregistrer sur la carte sous le nom `main.py`, avec [Thonny](./thonny) ou [mpremote](./mpremote#copier-des-fichiers-sur-la-carte).

## Marquer un bloc exécutable

Cette section s'adresse aux auteurs du wiki. Un bloc de code Python d'une page reçoit le bouton s'il est marqué `run` après le nom du langage :

````markdown
```python run
from machine import I2C

i2c = I2C(1)
print(i2c.scan())
```
````

Ne marquer que des programmes complets, qui tournent seuls sur la carte : pas d'extrait, pas de session du REPL (`>>>`). Juste après une étape qui ouvre `mpremote repl`, prévenir le lecteur de quitter `mpremote` avant d'utiliser le bouton, ou ne pas marquer le bloc.

Les autres marques possibles, après `python` :

| Marque            | Effet                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run confirm="…"` | Le clic ouvre d'abord un encart avec ce texte, et le programme n'est lancé qu'après **Lancer quand même**. Obligatoire pour un programme qui modifie la carte de façon durable. Le texte dit précisément ce qui sera modifié, par exemple `confirm="Efface toute la flash externe de la carte."`.                                                                                                                                     |
| `run files=…`     | Fichiers annexes déposés dans `/ram` avant le lancement, séparés par des virgules, sans espace, par exemple `files=.external/micropython-steami-lib/lib/a.py,.external/b/pins.py`. Chemins sous `.external/` uniquement ; deux fichiers ne peuvent pas avoir le même nom. Taille totale limitée par le disque en RAM de la carte (32 ko, moins la place du système de fichiers) : le CI ne la vérifie pas. Se combine avec `confirm`. |
| `norun`           | Jamais de bouton, même pour un exemple inclus avec `file=` : l'emporte sur tout le reste.                                                                                                                                                                                                                                                                                                                                             |

Un exemple de la bibliothèque inclus avec `file=.external/micropython-steami-lib/lib/<driver>/examples/<nom>.py` reçoit le bouton sans marque `run`, sauf s'il importe un driver absent du firmware. S'il modifie la carte de façon durable, il porte aussi `confirm="…"`.

Le CI vérifie les blocs qui reçoivent le bouton : programme Python valide, aucun driver absent du firmware, fichiers annexes présents, `confirm` sur les programmes qui modifient la carte. Pour lancer la vérification avant de proposer une modification :

```bash
npm run lint:micropython-blocks
```

## Voir aussi

- [Premiers pas](../getting-started) : premier programme avec `mpremote`
- [Installation du firmware](./install) : installer MicroPython à la main
- [Thonny](./thonny) et [mpremote](./mpremote) : écrire, lancer et enregistrer des programmes
- [Exemples Arduino à essayer](/docs/software/arduino/exemples) : le bouton équivalent pour les programmes Arduino
