---
title: Premier essai pas à pas
sidebar_label: Premier essai pas à pas
sidebar_position: 1
---

# Premier essai pas à pas

Ce guide montre, écran par écran, comment envoyer un exemple sur la carte depuis le wiki et lire ce qu'il affiche. Il prend pour exemple **BasicDistance**, le premier exemple de la page [VL53L1X](./vl53l1x) : la carte y mesure la distance de ce qui se trouve devant son capteur. Le même parcours vaut pour tous les exemples. Compter cinq minutes.

## Ce qu'il faut

- une carte STeaMi ;
- un câble USB qui transporte les données (certains câbles ne servent qu'à la charge) ;
- un ordinateur avec **Chrome** ou **Edge**. Avec un autre navigateur, voir [Sans Chrome ni Edge](#sans-chrome-ni-edge).

Rien à installer : l'exemple est déjà compilé.

## 1. Brancher la carte

Brancher le câble USB sur le connecteur de la carte, à gauche de l'écran sur la photo, puis sur l'ordinateur. La carte s'allume, et un lecteur nommé **STEAMI** apparaît sur l'ordinateur : il n'y a pas besoin de l'ouvrir.

![Carte STeaMi V1c vue de dessus, branchée en USB : le câble arrive sur la gauche de la partie ronde ; en haut de la partie ronde, le petit capteur VL53L1X marqué U11 laisse voir une lueur rouge, son émetteur infrarouge vu par l'appareil photo](/img/software/arduino/essayer-exemple-00-carte.jpg)

Le capteur de distance VL53L1X est le petit boîtier noir à deux fenêtres marqué **U11**, sur le bord de la partie ronde. C'est devant lui qu'il faudra approcher la main. Sur la photo, prise avec une webcam, son émetteur infrarouge brille en rouge ; à l'œil nu, il reste invisible.

## 2. Connecter la carte

Ouvrir la page [Exemples VL53L1X](./vl53l1x) et descendre jusqu'à l'exemple **BasicDistance**. Sous son code, cliquer sur **Connecter la carte**.

![Encadré sous le code de l'exemple, avec le bouton orange « Connecter la carte »](/img/software/arduino/essayer-exemple-01-connecter.png)

Le navigateur ouvre une fenêtre qui liste les cartes branchées. Cliquer sur **STeaMi CMSIS-DAP**, puis sur **Connexion**.

![Fenêtre du navigateur « … souhaite se connecter » (ici pendant un essai en local) : la liste contient STeaMi CMSIS-DAP, avec les boutons Annuler et Connexion](/img/software/arduino/essayer-exemple-02-choix-carte.png)

Une fois la carte connectée, chaque bouton **Connecter la carte** de la page devient **Téléverser**. La carte ne s'autorise qu'une fois par page.

## 3. Téléverser l'exemple

Cliquer sur **Téléverser**. Le message « Téléversement en cours… » s'affiche et les boutons restent grisés pendant l'envoi, qui dure moins de dix secondes.

![Encadré de l'exemple pendant l'envoi : bouton Téléverser grisé et message « Téléversement en cours… »](/img/software/arduino/essayer-exemple-03-televersement.png)

L'exemple remplace le programme qui était sur la carte, MicroPython compris : pour revenir à MicroPython, réinstaller son firmware (voir [Installation du firmware MicroPython](/docs/software/micropython/install)).

## 4. Lire la console

Quand « Programme téléversé. » apparaît, l'exemple tourne sur la carte. La console série s'ouvre sous le bouton et affiche ce que le programme écrit : ici, une distance environ cinq fois par seconde.

![Console sous l'exemple BasicDistance après le message « Programme téléversé. » : une suite de lignes « Distance: 104 mm », « Distance: 105 mm », « Distance: 106 mm »…](/img/software/arduino/essayer-exemple-04-console.png)

Approcher la main du capteur, puis l'éloigner : la distance suit. La console défile toute seule pour montrer les dernières lignes. Pour relire les précédentes, il suffit de la faire remonter : elle reste alors en place, et reprend le défilement une fois redescendue tout en bas.

L'écran de la carte ne change pas : les exemples VL53L1X ne s'en servent pas, et il garde l'image laissée par le programme précédent.

## 5. Essayer un autre exemple

Les autres exemples de la page se téléversent directement avec leur bouton **Téléverser**, sans reconnecter la carte. La console de l'exemple précédent disparaît, et celle du nouvel exemple s'ouvre sous lui.

En quittant les pages d'exemples, la carte est libérée au bout d'une seconde environ. Un [Codespace](../codespace) ou l'[Arduino IDE](../arduino-ide) peut alors s'en servir, sans fermer l'onglet du wiki.

## En cas d'erreur

Si la connexion ou l'envoi échoue, un message en rouge explique quoi faire, et un lien **Télécharger le .bin** apparaît dessous. Par exemple, après avoir fermé la fenêtre de choix sans sélectionner la carte :

![Encadré de l'exemple après une connexion annulée : message « Aucune carte choisie. », puis le lien « Télécharger le .bin » et la consigne « Glisser ce fichier sur le lecteur STEAMI de la carte. »](/img/software/arduino/essayer-exemple-05-erreur.png)

Le fichier téléchargé est le même programme : le glisser sur le lecteur **STEAMI**, comme décrit dans [Glisser le fichier sur le lecteur STEAMI](../codespace#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami). C'est la solution quand l'USB est bloqué sur un poste géré, ou sous Linux sans règle `udev` pour la carte (voir [Envoyer le programme sur la carte](../codespace#5-envoyer-le-programme-sur-la-carte)).

## Sans Chrome ni Edge

Firefox et Safari ne savent pas parler à la carte par USB. Le bouton est alors remplacé par le lien **Télécharger le .bin** :

![Encadré de l'exemple dans un navigateur sans WebUSB : seulement le lien « Télécharger le .bin » et la consigne « Glisser ce fichier sur le lecteur STEAMI de la carte. »](/img/software/arduino/essayer-exemple-06-sans-webusb.png)

Glisser le fichier sur le lecteur **STEAMI** : la carte redémarre et exécute l'exemple. La page ne peut pas afficher la console dans ce cas : pour lire ce qu'écrit l'exemple, ouvrir le moniteur série de l'Arduino IDE à 115200 bauds.
