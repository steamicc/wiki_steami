---
title: Pile radio Bluetooth
sidebar_position: 8
---

import TOCInline from '@theme/TOCInline';

# Pile radio Bluetooth

Le STM32WB55 a deux cœurs. Le programme (Arduino, MicroPython…) tourne sur le premier. La radio Bluetooth est pilotée par le second, qui exécute une **pile radio** fournie par STMicroelectronics. Cette pile s'installe à part, une seule fois : téléverser un programme ou changer de firmware ne l'efface pas.

Sans pile radio, le Bluetooth ne démarre pas. En Arduino, `BLE.begin()` (bibliothèque STM32duinoBLE) renvoie `0`. Le reste de la carte fonctionne normalement.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Quelle pile choisir

Installer la pile **BLE HCI Layer**. C'est celle que demande la bibliothèque [STM32duinoBLE](https://github.com/stm32duino/STM32duinoBLE), et elle fonctionne aussi avec le Bluetooth de MicroPython.

L'outil d'installation propose par défaut **BLE HCI Layer extended** : ne pas la choisir. Elle n'a pas été essayée sur la STeaMi.

## Vérifier la pile installée

En MicroPython, `stm.rfcore_fw_version()` donne la version du FUS, le programme de ST qui installe les piles, et celle de la pile radio :

```python run
import stm

print(stm.rfcore_fw_version(0))  # FUS, par exemple (1, 2, 0, 0, 0)
print(stm.rfcore_fw_version(1))  # pile radio, par exemple (1, 20, 0, 0, 2)
```

Une pile radio en `(0, 0, 0, 0, 0)` signifie qu'aucune pile n'est installée.

## Depuis le wiki

Sous chaque [exemple BLE Arduino](/docs/software/arduino/exemples/ble), le bouton **Vérifier la pile radio** lit la pile installée sur la carte et, si besoin, installe la pile BLE HCI Layer 1.20.0, sans autre outil que le navigateur. Il apparaît sous le bouton **Connecter la carte** (remplacé par **Téléverser** et **Déconnecter** une fois la carte connectée), dans un navigateur compatible WebUSB (Chrome ou Edge). Il reste grisé tant que la carte n'est pas connectée.

![Encadré sous un exemple BLE, carte déconnectée : bouton orange « Connecter la carte », état « Carte : déconnectée », et le bouton grisé « Vérifier la pile radio »](/img/software/pile-radio-wiki-01-bouton.png)

1. Cliquer sur **Vérifier la pile radio**. Une première question prévient que la vérification remplace le programme de la carte par un programme de lecture, et qu'elle efface toute la mémoire du programme : MicroPython et ses fichiers compris. La pile radio, elle, n'est pas touchée. Cliquer sur **Continuer**, ou sur **Annuler** pour ne rien changer.

   ![Première question sous le bouton : la vérification remplace le programme de la carte par un programme de lecture et efface toute la mémoire du programme, la pile radio n'est pas touchée ; boutons « Continuer » et « Annuler »](/img/software/pile-radio-wiki-02-confirmation.png)

2. Le bouton écrit le programme de lecture sur la carte, puis lit les versions du FUS et de la pile radio : une vingtaine de secondes en tout. Si la pile installée est celle du wiki, le message « La pile radio est à jour » s'affiche, et il reste à téléverser l'exemple. La console, sous le message, montre les réponses du programme de lecture. Ces lignes servent au dépannage : seul le message au-dessus de la console donne le résultat, même si une ligne contient le mot `error`.

   ![Fin de la vérification : « La pile radio est à jour (BLE HCI Layer 1.20.0). Téléverser l'exemple pour l'essayer. », suivi des réponses du programme de lecture dans la console](/img/software/pile-radio-wiki-03-a-jour.png)

3. Si la pile manque, est plus ancienne ou est d'un autre type, une seconde question indique la pile trouvée et celle qui sera installée, en effaçant l'ancienne, s'il y en a une. Cliquer sur **Installer la pile radio** pour lancer l'installation, ou sur **Annuler**. **Annuler** n'installe rien et ne change pas la pile radio, mais le programme de lecture occupe encore la carte : téléverser l'exemple pour l'essayer.

   ![Seconde question : la pile BLE HCI Layer 1.20.0 sera installée à la place de l'ancienne, qui sera effacée ; l'installation dure environ une minute et demie ; consigne de ne pas débrancher la carte, de ne pas appuyer sur RESET et de ne pas fermer la page ; boutons « Installer la pile radio » et « Annuler »](/img/software/pile-radio-wiki-04-proposition.png)

   L'installation dure une minute et demie (94 secondes sur une V1c). Le bouton télécharge d'abord la nouvelle pile depuis le wiki et vérifie son empreinte : si elle ne correspond pas, rien n'est effacé. Il efface ensuite l'ancienne pile, écrit la nouvelle sur la carte (une barre de progression suit l'écriture), puis le FUS l'installe. Pendant tout ce temps, ne pas débrancher la carte, ne pas appuyer sur RESET et ne pas fermer la page.

   ![Écriture de la nouvelle pile : état « Carte : téléversement », barre de progression et message « Écriture de la nouvelle pile radio sur la carte… »](/img/software/pile-radio-wiki-05-ecriture.png)

   Pendant que le FUS installe la pile, un décompte d'une minute indique le temps restant.

   ![Attente de la fin de l'installation : « Le FUS installe la pile radio. Pendant l'installation, ne pas débrancher la carte, ne pas appuyer sur RESET et ne pas fermer la page. », puis « Temps restant : 60 s »](/img/software/pile-radio-wiki-06-attente.png)

4. Une fois la pile relue, le bouton affiche qu'elle est installée. Cliquer ensuite sur **Téléverser** sous l'exemple : le programme de lecture occupe encore la carte, et l'exemple le remplace.

   ![Fin de l'installation : « Pile radio BLE HCI Layer 1.20.0 installée. Téléverser l'exemple pour l'essayer. », suivi des réponses du programme de lecture dans la console](/img/software/pile-radio-wiki-07-fin.png)

Si la carte a déjà une pile plus récente que celle du wiki, la seconde question le signale et met en avant **Annuler** : le FUS peut refuser de revenir à une version plus ancienne.

### Condition : le DAPLink du wiki

L'installation exige que la carte ait le DAPLink proposé par le wiki, car une installation interrompue avec un autre DAPLink peut laisser la carte sans pile radio. Sinon, la question ne propose pas **Installer la pile radio** : elle propose **Mettre à jour le DAPLink…**, qui guide la mise à jour pas à pas, puis il suffit de cliquer de nouveau sur **Vérifier la pile radio**. Un DAPLink d'origine, dont la version ne se lit pas, compte comme non conforme. **Plus tard** ferme la question : la vérification a eu lieu, l'installation est reportée.

### Limites

Le bouton n'installe que la pile BLE HCI Layer 1.20.0. Pour une autre pile (Full, extended, Thread, Zigbee…), passer par [DapLink-EasyFlash](#installer-la-pile). Une pile d'un autre type que BLE HCI Layer 1.20.0 est remplacée par celle-ci, mais seulement après confirmation dans la seconde question.

Dans les deux cas suivants, le bouton n'installe rien et renvoie vers DapLink-EasyFlash :

- un FUS antérieur à la version 1.2, ou de version majeure 2 et plus : le bouton ne met **jamais** le FUS à jour ;
- une pile radio arrêtée qui ne redémarre pas.

Si l'installation échoue, ou si la pile relue n'est pas celle attendue ou manque, le bouton le signale et renvoie aussi vers DapLink-EasyFlash. Si cela survient après l'effacement de l'ancienne pile, la carte peut se retrouver sans pile radio.

Si le FUS ne répond pas à la commande d'installation, le bouton attend quand même la minute prévue, puis relit la pile : la pile relue dit si l'installation a réussi.

Si la carte est débranchée avant l'effacement de l'ancienne pile, rien n'est installé : la rebrancher, cliquer sur **Connecter la carte**, puis de nouveau sur **Vérifier la pile radio**.

Dans tous les cas, le programme de la carte a été remplacé : téléverser l'exemple pour l'essayer.

## Installer la pile

Ce chemin reste valable pour tous les cas que le bouton ne traite pas, et pour une carte qui n'est pas branchée à un ordinateur avec Chrome ou Edge. La pile s'installe avec [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash), sous Linux ou Windows. Il suffit du câble USB : l'outil passe par le DAPLink de la carte, sans sonde externe.

1. Télécharger l'archive `xpack` de l'outil pour son système depuis les [releases](https://github.com/steamicc/DapLink-EasyFlash/releases), en version v1.3 ou plus récente : les versions précédentes n'installent pas de pile radio. L'archive contient OpenOCD.
2. Brancher la carte, puis lancer l'outil et ouvrir l'onglet **Wireless Stack**.
3. Choisir le port série de la carte : `/dev/ttyACM0` sous Linux, `COM…` sous Windows. Le bouton **Refresh** met la liste à jour.
4. Dans la liste **Wireless Stack**, choisir **BLE HCI Layer**, juste sous la version extended proposée par défaut.

   ![Onglet Wireless Stack de DapLink-EasyFlash, liste des piles ouverte : BLE HCI Layer extended est affichée par défaut, et la ligne BLE HCI Layer, juste en dessous, est surlignée](/img/software/pile-radio-01-choix-pile.png)

   Avant de lancer l'installation, l'onglet doit afficher **BLE HCI Layer** et le port série de la carte :

   ![Onglet Wireless Stack prêt : Wireless Stack sur BLE HCI Layer, Serial port sur /dev/ttyACM0 - STeaMi CMSIS-DAP, avec les boutons Refresh et Start](/img/software/pile-radio-02-pret.png)

5. Appuyer sur **Start**. Le journal s'affiche sous le bouton, et l'installation dure environ une minute. Elle est terminée quand la dernière ligne indique `Wireless stack is now flashed !`. Attendre encore une minute avant de débrancher la carte : le second cœur finit alors d'installer la pile. Pendant tout ce temps, ne pas débrancher la carte et ne pas appuyer sur Reset.

   ![Journal de fin d'installation : écriture de l'image vérifiée (Verified OK), commande UPGRADE envoyée, état FUS_STATE_IDLE sans erreur, puis la ligne « Wireless stack is now flashed ! »](/img/software/pile-radio-03-fin.png)

6. Téléverser ensuite un programme ou le firmware MicroPython : l'outil laisse sur la carte son propre programme d'installation.

L'outil installe d'abord son programme d'installation sur le premier cœur. Il met le FUS à jour s'il est antérieur à la version 1.2, puis efface l'ancienne pile et installe la nouvelle. Une mise à jour du FUS ne peut pas être annulée.

La procédure a été vérifiée sur une V1c avec DapLink-EasyFlash v1.3 : pile BLE HCI Layer v1.20.0, FUS 1.2.0. Ensuite, `BLE.begin()` renvoie `1`, et un scan Bluetooth en MicroPython voit les appareils voisins.

## Autres outils

L'outil WebUSB [webusb-wireless-stack](https://github.com/steamicc/steami-tools/tree/main/webusb-wireless-stack) du dépôt steami-tools installe aussi le FUS et une pile radio depuis Chrome ou Edge. Il propose d'autres piles (BLE Stack full ou light, Thread, Zigbee, piles combinées), qui n'ont pas été essayées avec les bibliothèques Arduino et MicroPython de la STeaMi : pour le Bluetooth, préférer BLE HCI Layer, avec le bouton du wiki ou avec DapLink-EasyFlash.
