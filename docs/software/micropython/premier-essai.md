---
title: Premier essai pas à pas
sidebar_label: Premier essai pas à pas
sidebar_position: 1.6
---

import TOCInline from '@theme/TOCInline';

# Premier essai pas à pas

Ce guide montre, écran par écran, comment lancer un programme MicroPython du wiki sur la carte, depuis le navigateur, et lire ce qu'il affiche. Il prend pour exemple le programme de l'accéléromètre de [Premiers pas](../getting-started#lire-un-capteur) : la carte y mesure son accélération, sa rotation et sa température deux fois par seconde. Le même parcours vaut pour tous les programmes qui ont le bouton **Essayer sur la carte**. Compter cinq minutes, une de plus si MicroPython doit être installé.

La page [Essayer le code sur la carte](./essayer) détaille chaque étape et les cas particuliers.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

:::note

Les captures ont été prises avec MicroPython v0.29.0, avant une retouche de l'avertissement d'installation, qui disait alors « peut effacer ». Le bouton d'installation affiche la version retenue par le wiki au moment de la lecture.

:::

## Ce qu'il faut

- une carte STeaMi ;
- un câble USB qui transporte les données (certains câbles ne servent qu'à la charge) ;
- un ordinateur avec **Chrome** ou **Edge**. Avec un autre navigateur, le bouton est remplacé par un renvoi vers [Thonny](./thonny) et [mpremote](./mpremote).

Rien à installer sur l'ordinateur. Fermer Thonny et `mpremote` s'ils sont ouverts : ils occupent la carte.

## 1. Brancher la carte

Brancher le câble USB sur la carte, puis sur l'ordinateur. La carte s'allume, et un lecteur nommé **STEAMI** apparaît sur l'ordinateur : il n'y a pas besoin de l'ouvrir.

## 2. Lancer l'essai

Ouvrir [Premiers pas](../getting-started#lire-un-capteur) et descendre jusqu'à **Lire un capteur**. Sous le programme, l'encadré montre le bouton **Essayer sur la carte** et l'état de la carte, « Carte : déconnectée ».

![Fin du programme de l'accéléromètre, puis l'encadré avec le bouton orange « Essayer sur la carte » et l'état « Carte : déconnectée »](/img/software/micropython/essayer-micropython-01-bouton.png)

Cliquer sur **Essayer sur la carte**. La première fois, le navigateur ouvre une fenêtre qui liste les cartes branchées. Cliquer sur **STeaMi CMSIS-DAP**, puis sur **Connexion**.

![Fenêtre du navigateur « … souhaite se connecter » (ici pendant un essai en local) : la liste contient STeaMi CMSIS-DAP, avec les boutons Annuler et Connexion](/img/software/micropython/essayer-micropython-02-choix-carte.png)

La carte n'est choisie qu'une fois. Ensuite, même après un rechargement de la page, la carte déjà autorisée est reprise sans cette fenêtre, tant qu'elle est la seule STeaMi autorisée qui est branchée.

L'état passe à « Carte : connexion… », puis à « Carte : connectée ». Le wiki vérifie alors la carte : son DAPLink, puis sa version de MicroPython.

## 3. Installer MicroPython, si la carte le demande

Une carte qui a déjà la bonne version de MicroPython passe directement à l'étape 4. Sinon (carte neuve, programme Arduino, version plus ancienne), un encart propose d'installer MicroPython.

![Encart d'installation sous le bouton : « Cette carte ne semble pas avoir MicroPython. Installer MicroPython v0.29.0 pour essayer cet exemple. », la durée, l'avertissement sur les fichiers de la carte, puis les boutons « Installer MicroPython v0.29.0 » et « Annuler »](/img/software/micropython/essayer-micropython-03-installer.png)

:::warning

L'installation efface les fichiers enregistrés sur la carte, `main.py` compris. Les copier avant sur l'ordinateur, avec [Thonny](./thonny#gérer-les-fichiers) ou [mpremote](./mpremote#copier-des-fichiers-sur-la-carte).

:::

Rien n'est installé sans un clic sur **Installer MicroPython**. Si MicroPython est déjà installé sur la carte mais qu'un autre outil la tient, ne pas installer : fermer l'outil, ou appuyer sur **RESET**, puis réessayer.

Après le clic, une barre de progression suit l'envoi du firmware. L'installation prend moins d'une minute (37 secondes sur une V1c). Pendant ce temps, ne pas débrancher la carte ni fermer la page.

![Encadré pendant l'installation : état « Carte : installation », barre de progression à 45 %, et le message « Installation de MicroPython (moins d'une minute) : ne pas débrancher la carte ni fermer la page… »](/img/software/micropython/essayer-micropython-04-installation.png)

À la fin, la carte redémarre et le programme est lancé.

## 4. Lire la console

Quand le programme tourne, l'état devient « Carte : programme en cours » et la console s'ouvre sous le bouton. Elle affiche ce que le programme écrit avec `print()` : ici, une ligne de mesures toutes les demi-secondes. Bouger la carte fait changer les valeurs de `A[g]` et de `G[dps]`.

![Console sous l'exemple : état « Carte : programme en cours », message « Programme en cours. » et des lignes « A[g]=(-0.03,-0.01,-1.00) G[dps]=(+1.0,-1.8,+0.2) T=20.6°C »](/img/software/micropython/essayer-micropython-05-console.png)

La console suit les dernières lignes. Pour relire les précédentes, la faire défiler : elle reste alors en place jusqu'au retour en bas.

Le programme tourne dans la mémoire vive de la carte, sans être enregistré : le `main.py` de la carte n'est pas touché.

## 5. Arrêter le programme

Ce programme ne s'arrête pas seul. Cliquer sur **Arrêter** : le message devient « Programme arrêté. » et la console garde ce qu'elle a reçu.

![Encadré après un clic sur Arrêter : état « Carte : connectée », message « Programme arrêté. » et la console avec les dernières mesures](/img/software/micropython/essayer-micropython-06-arret.png)

Lancer un autre programme de la page arrête aussi celui qui tourne. Le bouton **Déconnecter** libère la carte, pour que Thonny, `mpremote` ou un Codespace puisse s'en servir.

## Programmes qui modifient la carte

Quelques exemples modifient la carte de façon durable, par exemple en écrivant dans sa zone de configuration. Pour eux, le clic ouvre d'abord un encart qui dit ce qui sera modifié. Le programme n'est lancé qu'après **Lancer quand même**. **Annuler** l'abandonne sans rien envoyer à la carte.

![Encart de confirmation sous un programme (ici sur une page d'essai) : « Ce programme modifie la carte de façon durable. », ce qui sera modifié, puis les boutons « Lancer quand même » et « Annuler »](/img/software/micropython/essayer-micropython-07-confirmation.png)

## Quand le programme s'arrête sur une erreur

Une erreur Python arrête le programme. Le message « Le programme s'est arrêté sur une erreur : lire le message dans la console. » s'affiche, et la console montre le message d'erreur (_traceback_) en rouge, après ce que le programme a écrit avant.

![Programme d'essai qui lit valeurs[10] dans une liste de trois éléments : la console affiche « avant l'erreur », puis en rouge « Traceback (most recent call last): », la ligne qui donne le numéro de ligne 3, et « IndexError: list index out of range »](/img/software/micropython/essayer-micropython-08-erreur.png)

La ligne `File "<stdin>", line 3` donne le numéro de la ligne du programme où l'erreur s'est produite.

## En cas de problème

- **La fenêtre de connexion ne liste pas la carte** : vérifier le câble (un câble de charge seule ne suffit pas), puis rebrancher la carte.
- **« La carte ne répond pas »** : fermer Thonny ou `mpremote`, ou appuyer sur le bouton **RESET** de la carte, puis réessayer.
- **Un encart propose de mettre à jour le DAPLink** : suivre les étapes affichées, ou cliquer sur **Plus tard**. Voir [Mise à jour du DAPLink](./essayer#mise-à-jour-du-daplink).

Les autres cas sont décrits dans [Essayer le code sur la carte](./essayer#dépannage).
