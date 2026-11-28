---
title: Préparation
sidebar_position: 2
---

# Préparation d'une carte

Les six étapes de préparation installent, dans l'ordre, les programmes des deux microcontrôleurs, puis écrivent la configuration d'usine. Chaque étape s'appuie sur la précédente : le bootloader DAPLink présente le lecteur **MAINTENANCE** qui reçoit le firmware DAPLink, ce firmware donne l'accès USB au STM32WB55 dont ont besoin le FUS, la pile radio et MicroPython, et MicroPython exécute le script qui écrit la configuration.

| N°  | Étape                                          | Microcontrôleur et zone écrite                | Ce qui prouve que l'étape a réussi                                      |
| --- | ---------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | [Bootloader DAPLink](./bootloader-daplink)     | STM32F103, 0x08000000 (47 Ko)                 | Le lecteur **MAINTENANCE** apparaît                                     |
| 2   | [Firmware DAPLink](./firmware-daplink)         | STM32F103, 0x0800C000 (79 Ko)                 | Le lecteur **STEAMI** apparaît ; la release se lit par la commande 0x9F |
| 3   | [Mise à jour du FUS](./fus)                    | STM32WB55, second cœur (zone réservée au FUS) | Journal « FUS is up to date » ; FUS 1.2.0                               |
| 4   | [Pile radio](./pile-radio)                     | STM32WB55, second cœur                        | Journal « Wireless stack is now flashed ! » ; pile 1.20.0               |
| 5   | [Firmware MicroPython](./micropython)          | STM32WB55, premier cœur                       | `steami.version` donne la version installée                             |
| 6   | [Configuration d'usine](./configuration-usine) | STM32F103, config zone à 0x0800BC00 (1 Ko)    | `board_revision` et `board_name` relus                                  |

Les adresses du STM32F103 sont détaillées dans [DAPLink — Architecture flash F103](/docs/software/daplink#architecture-flash-f103).

:::caution Procédure non déroulée sur une V1c de série

Ces pages décrivent la procédure d'après les dépôts cités dans chacune d'elles. Elle reste à dérouler en entier sur une V1c de série ; seule l'installation de la pile radio a déjà été vérifiée sur une V1c.

:::
