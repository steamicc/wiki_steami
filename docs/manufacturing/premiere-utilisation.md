---
title: Première utilisation
sidebar_position: 4
---

# 17. Première utilisation

Cette page décrit l'état d'une carte préparée et qualifiée, tel que l'utilisateur le trouve en la recevant, et renvoie vers le guide qu'il suit ensuite. Elle sert à vérifier, avant l'envoi, que la carte est dans cet état.

## Ce que trouve l'utilisateur

| Élément                | État à la livraison                                                                                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lecteur **STEAMI**     | Apparaît dès que la carte est branchée en USB-C sur un ordinateur. Il contient les fichiers du DAPLink, dont `DETAILS.TXT`, et le fichier rangé dans la flash W25Q64 s'il y en a un (contenu **à définir**, voir [Flash W25Q64](./qualification/flash#après-le-test)) |
| DAPLink                | Version retenue par le wiki au moment de la préparation : le wiki ne propose pas de mise à jour tant qu'il n'a pas changé de version                                                                                                                                  |
| MicroPython            | Version retenue par le wiki au moment de la préparation : le bouton **Essayer sur la carte** lance directement les programmes, sans proposer d'installer MicroPython                                                                                                  |
| Pile radio             | BLE HCI Layer 1.20.0 : les exemples Bluetooth fonctionnent sans installation                                                                                                                                                                                          |
| Config zone            | Révision `131` et nom de la carte, lisibles avec le programme de [Identifier sa version](/docs/hardware/revisions#identifier-sa-version)                                                                                                                              |
| Programme au démarrage | Aucun programme de démonstration n'est prévu par les étapes de préparation : le `main.py` que crée MicroPython ne contient qu'un commentaire. Installer ou non un programme d'accueil est **à définir**                                                               |

## Premier programme

Pour son premier programme, l'utilisateur suit [Premier essai pas à pas](/docs/software/micropython/premier-essai) : il branche la carte, ouvre une page du wiki dans Chrome ou Edge et clique sur **Essayer sur la carte**. Comme la carte a déjà la bonne version de MicroPython, l'étape « Installer MicroPython, si la carte le demande » n'apparaît pas : la console s'ouvre directement. Avec un autre navigateur, le guide renvoie vers [Thonny](/docs/software/micropython/thonny) et [mpremote](/docs/software/micropython/mpremote).

Si le wiki est passé entre-temps à une version plus récente de MicroPython ou du DAPLink, le bouton propose la mise à jour, comme pour toute carte (voir [Essayer le code sur la carte](/docs/software/micropython/essayer#vérifications-avant-le-lancement)).

## Avant l'envoi

Dernières vérifications, faites sur une carte déjà qualifiée :

1. La configuration d'usine a été réécrite après la qualification, et sa relecture donne la révision `131` et le nom attendu (voir [Après la qualification](./preparation/configuration-usine#après-la-qualification)).
2. La carte branchée sur un ordinateur présente le lecteur **STEAMI**.
3. La version de MicroPython est celle du wiki (voir [Firmware MicroPython — Résultat attendu](./preparation/micropython#résultat-attendu)).
