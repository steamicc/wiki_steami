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

Sous chaque [exemple BLE Arduino](/docs/software/arduino/exemples/ble), le bouton **Vérifier la pile radio** lit la pile installée sur la carte et, si besoin, installe la pile BLE HCI Layer 1.20.0, sans autre outil que le navigateur. Il apparaît sous les boutons **Téléverser** et **Connecter la carte**, dans un navigateur compatible WebUSB (Chrome ou Edge), grisé tant que la carte n'est pas connectée avec **Connecter la carte**.

1. Cliquer sur **Vérifier la pile radio**. Une première question prévient que la vérification remplace le programme de la carte par un programme de lecture, et qu'elle efface toute la mémoire du programme : MicroPython et ses fichiers compris. La pile radio, elle, n'est pas touchée. Cliquer sur **Continuer**, ou sur **Annuler** pour ne rien changer.
2. Le bouton lit les versions du FUS et de la pile radio. Si la pile installée est celle du wiki, le message « La pile radio est à jour » s'affiche, et il reste à téléverser l'exemple.
3. Si la pile manque, est plus ancienne ou est d'un autre type, une seconde question indique la pile trouvée et celle qui sera installée, en effaçant l'ancienne, s'il y en a une. Cliquer sur **Installer la pile radio** pour lancer l'installation, qui prend quelques minutes, ou sur **Annuler**. Pendant l'installation, ne pas débrancher la carte, ne pas appuyer sur RESET et ne pas fermer la page : un décompte indique le temps restant pendant l'attente de la fin du travail du second cœur.
4. Une fois la pile relue, le bouton affiche qu'elle est installée. **Téléverser ensuite l'exemple** : le programme de lecture occupe encore la carte, et l'exemple le remplace.

Si la carte a déjà une pile plus récente que celle du wiki, la seconde question le signale et met en avant **Annuler** : le FUS peut refuser de revenir à une version plus ancienne.

### Condition : le DAPLink du wiki

L'installation exige que la carte ait le DAPLink proposé par le wiki, car une installation interrompue avec un autre DAPLink peut laisser la carte sans pile radio. Sinon, la question ne propose pas **Installer la pile radio** : elle propose **Mettre à jour le DAPLink…**, qui guide la mise à jour pas à pas, puis il suffit de cliquer de nouveau sur **Vérifier la pile radio**. Un DAPLink d'origine, dont la version ne se lit pas, compte comme non conforme. **Plus tard** ferme la question : la vérification a eu lieu, l'installation est reportée.

### Limites

Le bouton n'installe que la pile BLE HCI Layer 1.20.0. Pour une autre pile (Full, extended, Thread, Zigbee…), passer par [DapLink-EasyFlash](#installer-la-pile). Une pile d'un autre type que BLE HCI Layer 1.20.0 est remplacée par celle-ci, mais seulement après confirmation dans la seconde question.

Dans les deux cas suivants, le bouton n'installe rien et renvoie vers DapLink-EasyFlash :

- un FUS antérieur à la version 1.2, ou de version majeure 2 et plus : le bouton ne met **jamais** le FUS à jour ;
- une pile radio arrêtée qui ne redémarre pas.

Si l'installation échoue, ou si la pile relue n'est pas celle attendue ou manque, le bouton le signale et renvoie aussi vers DapLink-EasyFlash. Si cela survient après l'effacement de l'ancienne pile, la carte peut se retrouver sans pile radio.

Dans tous les cas, le programme de la carte a été remplacé : téléverser l'exemple pour l'essayer.

## Installer la pile

Ce chemin reste valable pour tous les cas que le bouton ne traite pas. La pile s'installe avec [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash), sous Linux ou Windows. Il suffit du câble USB : l'outil passe par le DAPLink de la carte, sans sonde externe.

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
