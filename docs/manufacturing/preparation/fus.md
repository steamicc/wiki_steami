---
title: 3. Mise à jour du FUS
sidebar_position: 3
---

# 3. Mise à jour du FUS

Le FUS (_Firmware Upgrade Services_) est le programme de STMicroelectronics qui tourne sur le second cœur du STM32WB55 et installe les piles radio ([documentation ST](https://wiki.st.com/stm32mcu/wiki/Connectivity:STM32WB_FUS)). La version du FUS livrée avec les puces neuves n'est pas connue à l'avance : cette étape l'amène à la version **1.2.0**, celle avec laquelle la pile radio de l'[étape 4](./pile-radio) a été vérifiée sur une V1c.

Le bouton **Vérifier la pile radio** du wiki ne met jamais le FUS à jour (voir [Limites](/docs/software/pile-radio#limites)). En fabrication, la mise à jour passe donc par DapLink-EasyFlash, qui la fait d'office avant d'installer la pile.

:::warning

Une mise à jour du FUS ne peut pas être annulée. Pendant qu'elle a lieu, ne pas débrancher la carte et ne pas appuyer sur **Reset**.

:::

## L'opérateur

DapLink-EasyFlash ne parle pas directement au FUS. Il écrit d'abord sur le premier cœur un programme relais, l'**opérateur** (`wireless_stack/wb55_operator.hex`), par OpenOCD et l'interface CMSIS-DAP du DAPLink de la carte ([`configs/wb5x.cfg`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/configs/wb5x.cfg)). L'opérateur reçoit ensuite des commandes texte par le port série du DAPLink, à 115 200 bauds, et répond en JSON. Ce n'est pas un programme officiel de ST ; ses sources sont dans [codal-steami-samples](https://github.com/steamicc/codal-steami-samples/tree/main/samples/Peripherals/FUS_WS_Operator) :

| Commande  | Effet                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| `VERSION` | Donne la version du FUS et celle de la pile radio                              |
| `STATUS`  | Donne l'état du FUS (`SHCI_C2_FUS_GetState`)                                   |
| `DELETE`  | Efface la pile radio installée                                                 |
| `UPGRADE` | Demande au FUS d'installer l'image écrite en flash (nouveau FUS ou pile radio) |
| `START`   | Démarre la pile radio                                                          |
| `RESET`   | Redémarre le STM32WB55                                                         |
| `HELP`    | Liste les commandes                                                            |

## Déroulement

Cette étape et la suivante se font dans le même passage de l'onglet **Wireless Stack**, décrit dans [Pile radio](./pile-radio#avec-daplink-easyflash). Après l'écriture de l'opérateur (ligne `Flash operator` du journal), l'outil lit la version du FUS (ligne `FUS update`) et décide ([`tab_wireless_stack.rs`](https://github.com/steamicc/DapLink-EasyFlash/blob/main/src/ui/tab_wireless_stack.rs)) :

| FUS lu     | Ce que fait l'outil                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| 0.x        | Installe `stm32wb5xxG_FUS_fw_for_fus_0_5_3.hex`, puis relit la version                                   |
| 1.0 ou 1.1 | Installe `stm32wb5xxG_FUS_fw.hex` (FUS 1.2.0), puis relit la version                                     |
| 1.2        | Écrit `FUS is up to date` et passe à la pile radio                                                       |
| 2.x        | Écrit `FUS is ahead ! Let's give it a try. But it could fail...` et tente quand même d'installer la pile |
| Autre      | Écrit `Unknown FUS version. Abort.` et s'arrête                                                          |

Chaque installation du FUS apparaît comme `Flash FUS (attempt 1/3)` dans le journal, suivie de `Send UPGRADE command`. L'outil relit la version après chaque installation, et abandonne au bout de trois essais (`FUS upgrade did not converge after 3 attempts. Aborting.`) : la pile radio n'est alors pas installée. Ce qu'il faut faire d'une carte arrêtée à cette étape est **à définir**.

## Résultat attendu

Le journal contient `FUS is up to date` avant `Delete current wireless stack`. Une fois MicroPython installé (étape 5), la version se relit sur la carte :

```bash
mpremote connect /dev/ttyACM0 exec "import stm; print(stm.rfcore_fw_version(0))"
```

Le résultat commence par `(1, 2, 0` (voir [Vérifier la pile installée](/docs/software/pile-radio#vérifier-la-pile-installée)). Le test [Bluetooth](../qualification/bluetooth) refait cette lecture.
