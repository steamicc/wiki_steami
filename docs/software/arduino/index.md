---
title: Arduino
sidebar_position: 5
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';

# Arduino

La carte STeaMi se programme en C++ avec l'Arduino IDE. Elle fait partie des cartes officiellement prises en charge par le paquet **STM32 MCU based boards** de STMicroelectronics ([STM32duino](https://github.com/stm32duino/Arduino_Core_STM32)), sous le nom **STeaMi Board**.

- La LED RGB, les boutons A, B et MENU, le buzzer et le port série s'utilisent avec les fonctions Arduino standard, sans bibliothèque.
- Les autres composants (accéléromètre, magnétomètre, capteurs de distance, de pression, d'humidité et de lumière, D-PAD, jauge de batterie, écran) se pilotent avec des drivers. Ils sont réunis dans la bibliothèque **STeaMi** du gestionnaire de bibliothèques (développée dans [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib)).

:::info Support en cours de développement
Le support Arduino couvre les composants des trois releases, V1a, V1b et V1c, sauf le microphone, qui n'est pas encore pris en charge. Pour le microphone, voir [MicroPython](../micropython/).
:::

## Par où commencer

1. [**Installer l'Arduino IDE**](./arduino-ide) : ajouter la carte STeaMi et téléverser un premier programme.
   - Sans pouvoir installer de logiciel : [**Programmer sans installation**](./codespace), depuis un navigateur, avec un GitHub Codespace.
2. [**Premiers programmes**](./premiers-programmes) : LED RGB, boutons et buzzer, sans bibliothèque.
3. [**Bibliothèques STeaMi**](./bibliotheques) : installer la bibliothèque STeaMi depuis le gestionnaire de bibliothèques et comprendre le bus I²C interne.
4. [**Capteurs et écran**](./capteurs) : pour chaque capteur, un programme minimal avec sa classe par fonction, le même sur V1a, V1b et V1c (la V1c n'a ni lumière, ni couleur, ni gestes), puis avec le driver du composant ; l'écran avec sa classe `SteamiDisplay` ou son driver ; le disque USB et le Bluetooth avec leur driver.
5. [**Exemples à essayer**](./exemples/) : les exemples de la bibliothèque expliqués un par un et envoyés sur la carte depuis la page, sans rien installer. Pour commencer : [**Premier essai pas à pas**](./exemples/premier-essai).

Pour aller plus loin :

- [**Reconnaître la carte**](./carte) : comment la bibliothèque reconnaît la V1a, la V1b et la V1c, les calibrations et les messages.
- [**Conventions de l'API**](./conventions) : ce que les drivers ont en commun.
- [**Programmer avec PlatformIO**](./platformio) : Visual Studio Code et PlatformIO, pour des projets plus ambitieux.
- [**Développer les drivers**](./contribuer) : compiler et tester la bibliothèque STeaMi, écrire de nouveaux drivers.

## État du support

### Sur toutes les releases

| Fonction                     | Composant | Comment                           | Exemples du driver |
| ---------------------------- | --------- | --------------------------------- | :----------------: |
| LED RGB, LED Bluetooth       | —         | Arduino standard (`digitalWrite`) |         —          |
| Boutons A, B et MENU         | —         | Arduino standard (`digitalRead`)  |         —          |
| Buzzer                       | —         | Arduino standard (`tone`)         |         —          |
| Port série USB               | DAPLink   | Arduino standard (`Serial`)       |         —          |
| Accéléromètre et gyroscope   | ISM330DL  | bibliothèque STeaMi               |         3          |
| Magnétomètre                 | LIS2MDL   | bibliothèque STeaMi               |         4          |
| Distance                     | VL53L1X   | bibliothèque STeaMi               |         5          |
| D-PAD                        | MCP23009E | bibliothèque STeaMi               |         5          |
| Jauge de batterie            | BQ27441   | bibliothèque STeaMi               |         2          |
| Bluetooth Low Energy         | STM32WB55 | bibliothèque STM32duinoBLE        |         6          |
| Microphone                   | IM34DT05  | non pris en charge                |         —          |
| Flash externe, configuration | DAPLink   | bibliothèque STeaMi               |         2          |

### Selon la release

<ReleaseTabs>
<Release releases="v1a v1b">

| Fonction                              | Composant | Comment             | Exemples du driver |
| ------------------------------------- | --------- | ------------------- | :----------------: |
| Pression                              | WSEN-PADS | bibliothèque STeaMi |         3          |
| Humidité et température               | WSEN-HIDS | bibliothèque STeaMi |         4          |
| Lumière, couleur, proximité et gestes | APDS-9960 | bibliothèque STeaMi |         4          |
| Écran OLED 128 × 128                  | SSD1327   | bibliothèque STeaMi |         11         |

</Release>
<Release releases="v1c">

| Fonction                          | Composant | Comment             | Exemples du driver |
| --------------------------------- | --------- | ------------------- | :----------------: |
| Pression, humidité et température | BME280    | bibliothèque STeaMi |         5          |
| Écran TFT couleur 240 × 240       | GC9A01    | bibliothèque STeaMi |         10         |
| Lumière, couleur et gestes        | —         | absent de la V1c    |         —          |

</Release>
</ReleaseTabs>

Le détail de chaque composant par langage est dans la [matrice de compatibilité](../compatibility).

## Voir aussi

- [Premiers pas](../getting-started) : découverte de la carte
- [Révisions de la carte](/docs/hardware/revisions) : différences entre V1a, V1b et V1c
- [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib) : dépôt des drivers Arduino
- [Documentation Arduino](https://docs.arduino.cc/) : référence du langage et de l'IDE
- [Tutoriels STM32duino](https://stm32python.gitlab.io/fr/docs/Stm32duino) : exercices et ressources
