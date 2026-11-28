---
title: 4. Pile radio
sidebar_position: 4
---

# 4. Pile radio

La pile radio est le firmware Bluetooth du second cœur du STM32WB55. La STeaMi utilise la pile **BLE HCI Layer**, en version **1.20.0** : c'est celle que demande la bibliothèque Arduino STM32duinoBLE, et elle fonctionne aussi avec le Bluetooth de MicroPython. Le choix de la pile et l'installation pas à pas, avec les captures de l'outil, sont décrits dans [Pile radio Bluetooth](/docs/software/pile-radio) ; cette page ne donne que ce que la fabrication demande en plus.

## Avec DapLink-EasyFlash

La pile s'installe avec l'onglet **Wireless Stack** de [DapLink-EasyFlash](https://github.com/steamicc/DapLink-EasyFlash/releases), v1.3 ou plus récente, en suivant [Installer la pile](/docs/software/pile-radio#installer-la-pile). Seul le câble USB est nécessaire : l'outil passe par le DAPLink installé aux étapes 1 et 2.

- **Wireless Stack** : **BLE HCI Layer**. La v1.4.0 la présélectionne ; la v1.3 présélectionne la version _extended_, qui n'a pas été essayée sur la STeaMi.
- **Serial port** : le port série de la carte (`/dev/ttyACM0` sous Linux, `COM…` sous Windows).

Le même passage fait l'[étape 3](./fus), puis enchaîne ([`tab_wireless_stack.rs`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/src/ui/tab_wireless_stack.rs)) :

| Ligne du journal                  | Ce que fait l'outil                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Delete current wireless stack`   | Commande `DELETE` de l'opérateur : efface la pile en place, s'il y en a une                                         |
| `Send UPGRADE command`            | Après l'écriture de l'opérateur suivi de la pile (`stm32wb5xxG_BLE_HCILayer_fw.hex`), demande au FUS de l'installer |
| `Wireless stack is now flashed !` | Installation terminée                                                                                               |

Attendre encore une minute après `Wireless stack is now flashed !` avant de débrancher la carte : le second cœur finit d'installer la pile. L'installation complète a duré environ une minute sur une V1c, plus cette minute d'attente (voir [Installer la pile](/docs/software/pile-radio#installer-la-pile)).

L'outil laisse l'opérateur sur le premier cœur : l'[étape 5](./micropython) le remplace par MicroPython.

## Pourquoi pas le bouton du wiki

Le bouton **Vérifier la pile radio** installe la même pile depuis Chrome ou Edge, mais il ne met jamais le FUS à jour et refuse un FUS antérieur à la version 1.2 (voir [Limites](/docs/software/pile-radio#limites)). Sur une carte neuve, dont le FUS n'est pas connu, DapLink-EasyFlash fait les deux étapes d'un coup.

## Résultat attendu

Le journal se termine par `Wireless stack is now flashed !`. Une fois MicroPython installé, la version de la pile se relit sur la carte :

```bash
mpremote connect /dev/ttyACM0 exec "import stm; print(stm.rfcore_fw_version(1))"
```

Le résultat commence par `(1, 20, 0` ; `(0, 0, 0, 0, 0)` signifie qu'aucune pile n'est installée (voir [Vérifier la pile installée](/docs/software/pile-radio#vérifier-la-pile-installée)). Le test [Bluetooth](../qualification/bluetooth) refait cette lecture.
