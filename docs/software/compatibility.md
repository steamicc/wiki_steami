---
title: Compatibilité par composant
sidebar_position: 7
---

# Compatibilité par composant

Matrice détaillée du support de chaque composant de la carte STeaMi selon l'environnement de programmation maintenu, MicroPython ou Arduino. Les composants qui n'existent que sur certaines releases portent leur release entre parenthèses ; les autres sont communs aux trois releases, V1a, V1b et V1c (voir [Révisions](/docs/hardware/revisions)).

| Composant                                       | MicroPython | Arduino |
| ----------------------------------------------- | :---------: | :-----: |
| Accéléromètre (ISM330DL)                        |     ✅      |   ✅    |
| Magnétomètre (LIS2MDL)                          |     ✅      |   ✅    |
| Distance (VL53L1X)                              |     ✅      |   ✅    |
| Pression (WSEN-PADS, V1a et V1b)                |     ✅      |   ✅    |
| Humidité/Temp (WSEN-HIDS, V1a et V1b)           |     ✅      |   ✅    |
| Pression/Humidité/Temp (BME280, V1c)            |     ✅      |   ✅    |
| Lumière/Geste (APDS-9960, V1a et V1b)           |     ✅      |   ✅    |
| Microphone (IMP34DT05)                          |     ❌      |   ✅    |
| Écran OLED (SSD1327, V1a et V1b)                |     ✅      |   ✅    |
| Écran TFT couleur (GC9A01, V1c)                 |     ✅      |   ✅    |
| Boutons (MCP23009)                              |     ✅      |   ✅    |
| Jauge batterie (BQ27441)                        |     ✅      |   ✅    |
| Flash externe (DAPLink)                         |     ✅      |   ✅    |
| Config persistante                              |     ✅      |   ✅    |
| Détection de la release, même programme partout |     ✅      |   ✅    |
| GPIO de base                                    |     ✅      |   ✅    |
| I2C / SPI / UART                                |     ✅      |   ✅    |
| Bluetooth BLE                                   |     🔶      |   🔶    |

✅ Complet · 🔶 Partiel · ❌ Non supporté

CODAL et MakeCode ne sont plus suivis pour la STeaMi et n'apparaissent donc plus dans ce tableau. L'état du support CODAL, relevé avant cet arrêt, reste consultable dans la page historique [CODAL et MakeCode](./codal/).

La V1c n'a pas de capteur de lumière, de couleur ni de gestes : l'APDS-9960 est retiré.

## Composants de la V1c

Les deux composants propres à la V1c, le capteur BME280 et l'écran TFT rond GC9A01, sont gérés en MicroPython et en Arduino. Pour chaque fonction, la version indiquée est la première de la bibliothèque qui l'apporte (en MicroPython, la première dont le firmware la contient) ; la dernière version publiée contient tout ce tableau.

| Fonction                                      | MicroPython ([micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib/releases))                                                                                                                              | Arduino ([arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib/releases))                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pression, humidité et température (BME280)    | driver [bme280](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/bme280), intégré au firmware depuis la v0.13.1                                                                                                  | `SteamiBME280`, depuis la v0.29.0 (voir [Capteurs](./arduino/capteurs))                                                                                                                                                                                                  |
| Écran TFT couleur 240 × 240 (GC9A01)          | driver [gc9a01](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/gc9a01) et `steami.Screen` ([steami_screen](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami_screen)), depuis la v0.30.0 | `SteamiGC9A01`, depuis la v0.27.0 (voir [Écran](./arduino/ecran))                                                                                                                                                                                                        |
| Détection de la release, classes par fonction | paquet [steami](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami) (`Temperature`, `Compass`…), intégré au firmware depuis la v0.28.2                                                                      | `SteamiBoard` (détection) depuis la v0.31.0 ; classes par fonction depuis la v0.32.0 (`SteamiTemperature`…) et la v0.34.0 (`SteamiCompass`…) ; dessin sur l'écran (SSD1327 ou GC9A01) par `SteamiBoard` depuis la v0.37.0 (voir [Reconnaître la carte](./arduino/carte)) |

Avec les classes par fonction, un même programme tourne sans changement sur V1a, V1b et V1c : la bibliothèque reconnaît la release, puis choisit le bon capteur (BME280 ou WSEN-HIDS et WSEN-PADS) et le bon écran (GC9A01 ou SSD1327).

## Précisions

- **Microphone en MicroPython** : le dossier [im34dt05](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/im34dt05) de micropython-steami-lib est réservé, mais ne contient pas encore de driver (issue [micropython-steami-lib#45](https://github.com/steamicc/micropython-steami-lib/issues/45)). En Arduino, la classe `SteamiIMP34DT05` le gère depuis la v0.39.0 (voir [Capteurs](./arduino/capteurs#microphone)).
- **Bluetooth** : il demande une pile radio, installée à part sur le second cœur du STM32WB55 (voir [Pile radio Bluetooth](./pile-radio)). En Arduino, il passe par la bibliothèque STM32duinoBLE, en dehors de la bibliothèque STeaMi ; l'exemple BleBeacon lit le WSEN-HIDS et ne fonctionne que sur V1a et V1b. En MicroPython, un scan Bluetooth voit les appareils voisins sur la V1c, mais micropython-steami-lib ne fournit ni driver ni exemple Bluetooth.
- **Flash externe et config persistante** : elles passent par le firmware DAPLink du STM32F103, le même sur les trois releases ([DAPLink](https://github.com/steamicc/DAPLink), branche `release_letssteam`). Les anciens firmwares DAPLink n'ont pas de config zone : voir [DAPLink](./daplink) pour la mise à jour.

## Voir aussi

- [MicroPython](./micropython/) — Langage le plus complet (17 drivers)
- [Arduino](./arduino/) — Support partiel, en cours de développement
- [CODAL et MakeCode](./codal/) — Page historique, environnements plus suivis
