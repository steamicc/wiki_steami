---
title: Arduino
sidebar_position: 5
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Arduino

La carte STeaMi se programme en C++ avec l'Arduino IDE. Elle fait partie des cartes officiellement prises en charge par le paquet **STM32 MCU based boards** de STMicroelectronics ([STM32duino](https://github.com/stm32duino/Arduino_Core_STM32)), sous le nom **STeaMi Board**.

- La LED RGB, les boutons A, B et MENU, le buzzer et le port série s'utilisent avec les fonctions Arduino standard, sans bibliothèque.
- Les capteurs, le D-PAD, la jauge de batterie et l'écran demandent des drivers, développés dans le dépôt [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib).

:::info Support en cours de développement
Le support Arduino couvre la plupart des composants des V1a et V1b. Sur la V1c, le capteur BME280 et l'écran couleur n'ont pas encore de driver STeaMi : ils s'utilisent avec des bibliothèques existantes (Adafruit BME280, GFX Library for Arduino). Le microphone, la mémoire flash externe et la configuration persistante ne sont pas encore pris en charge. Pour un support complet, voir [MicroPython](../micropython/).
:::

## Par où commencer

1. [**Installer l'Arduino IDE**](./arduino-ide) : ajouter la carte STeaMi et téléverser un premier programme.
2. [**Premiers programmes**](./premiers-programmes) : LED RGB, boutons et buzzer, sans bibliothèque.
3. [**Bibliothèques STeaMi**](./bibliotheques) : installer les drivers et comprendre le bus I²C interne.
4. [**Capteurs et écran**](./capteurs) : un programme minimal pour chaque composant.

Pour aller plus loin :

- [**Conventions de l'API**](./conventions) : ce que les drivers ont en commun.
- [**PlatformIO (contributeurs)**](./platformio) : compiler et tester les drivers, en écrire de nouveaux.

## État du support

### Sur toutes les releases

| Fonction                     | Composant | Comment                           | Exemples du driver |
| ---------------------------- | --------- | --------------------------------- | :----------------: |
| LED RGB, LED Bluetooth       | —         | Arduino standard (`digitalWrite`) |         —          |
| Boutons A, B et MENU         | —         | Arduino standard (`digitalRead`)  |         —          |
| Buzzer                       | —         | Arduino standard (`tone`)         |         —          |
| Port série USB               | DAPLink   | Arduino standard (`Serial`)       |         —          |
| Accéléromètre et gyroscope   | ISM330DL  | driver `ism330dl`                 |         3          |
| Magnétomètre                 | LIS2MDL   | driver `lis2mdl`                  |         4          |
| Distance                     | VL53L1X   | driver `vl53l1x`                  |    0 (à venir)     |
| D-PAD                        | MCP23009E | driver `mcp23009e`                |         5          |
| Jauge de batterie            | BQ27441   | driver `bq27441`                  |    0 (à venir)     |
| Bluetooth Low Energy         | STM32WB55 | bibliothèque STM32duinoBLE        | 6 (dans le dépôt)  |
| Microphone                   | IM34DT05  | non pris en charge                |         —          |
| Flash externe, configuration | DAPLink   | non pris en charge (en cours)     |         —          |

### Selon la release

<ReleaseTabs>
<Release releases="v1a v1b">

| Fonction                              | Composant | Comment            | Exemples du driver |
| ------------------------------------- | --------- | ------------------ | :----------------: |
| Pression                              | WSEN-PADS | driver `wsen-pads` |         3          |
| Humidité et température               | WSEN-HIDS | driver `wsen-hids` |         4          |
| Lumière, couleur, proximité et gestes | APDS-9960 | driver `apds9960`  |         4          |
| Écran OLED 128 × 128                  | SSD1327   | driver `ssd1327`   |         11         |

</Release>
<Release releases="v1c">

| Fonction                          | Composant | Comment                                                                   | Exemples du driver |
| --------------------------------- | --------- | ------------------------------------------------------------------------- | :----------------: |
| Pression, humidité et température | BME280    | bibliothèque Adafruit BME280 (driver STeaMi à venir)                      |         —          |
| Écran TFT couleur 240 × 240       | GC9A01    | bibliothèque GFX Library for Arduino, à confirmer (driver STeaMi à venir) |         —          |
| Lumière, couleur et gestes        | —         | absent de la V1c                                                          |         —          |

</Release>
</ReleaseTabs>

Le détail de chaque composant par langage est dans la [matrice de compatibilité](../compatibility).

## Voir aussi

- [Premiers pas](../getting-started) : découverte de la carte
- [Révisions de la carte](/docs/hardware/revisions) : différences entre V1a, V1b et V1c
- [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) : dépôt des drivers Arduino
- [Documentation Arduino](https://docs.arduino.cc/) : référence du langage et de l'IDE
- [Tutoriels STM32duino](https://stm32python.gitlab.io/fr/docs/Stm32duino) : exercices et ressources
