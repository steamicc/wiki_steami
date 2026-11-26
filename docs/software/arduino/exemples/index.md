---
title: Exemples à essayer
sidebar_label: Exemples
sidebar_position: 5.5
---

# Exemples à essayer sur la carte

La bibliothèque STeaMi est livrée avec des exemples, rangés par composant (dans l'Arduino IDE : **Fichier → Exemples → STeaMi**). Ces pages les reprennent un par un, pour que tu comprennes ce que fait chacun et comment il se sert du driver de son composant. Pour chaque exemple, tu trouveras :

- **Ce que tu vas voir** sur la carte, et ce qu'il faut faire pour que l'exemple réagisse ;
- **Matériel**, quand l'exemple demande plus que la carte ;
- le code complet de l'exemple ;
- **Comment ça marche** : les fonctions du driver qu'il appelle et ce qu'elles montrent du composant ;
- un bouton pour l'envoyer sur ta carte depuis la page.

Tu n'as rien à installer ni à compiler : chaque exemple est déjà compilé, et le programme envoyé correspond exactement au code affiché, issu de la même version de la bibliothèque. Les pages se lisent aussi sans carte.

## Essayer un exemple

Avec **Chrome** ou **Edge** sur un ordinateur :

1. Branche la carte à l'ordinateur avec un câble USB qui transporte les données (certains câbles ne servent qu'à la charge).
2. Sous un exemple, clique sur **Connecter la carte**. Le navigateur ouvre une fenêtre de connexion : choisis **STeaMi CMSIS-DAP**, puis clique sur **Connexion**. Tu n'autorises la carte qu'une fois par page : tu peux ensuite essayer tous les exemples de la page sans recommencer. Quand tu passes à une page sans exemple à essayer, la carte est libérée : un Codespace ou l'Arduino IDE peut alors s'en servir.
3. Clique sur **Téléverser**. Quand le message « Programme téléversé. » apparaît, la carte redémarre et exécute l'exemple. La console série s'ouvre sous l'exemple et affiche ce que le programme écrit.

L'exemple remplace le programme qui était sur la carte, MicroPython compris : pour revenir à MicroPython, réinstalle son firmware (voir [Installation du firmware MicroPython](/docs/software/micropython/install)).

Avec un navigateur qui ne sait pas parler à la carte par USB (Firefox, Safari), le bouton est remplacé par un lien **Télécharger le .bin** : copie ce fichier sur le lecteur **STEAMI** de la carte, comme décrit dans [Glisser le fichier sur le lecteur STEAMI](../codespace#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami). La page ne peut pas afficher la console dans ce cas : pour lire ce qu'écrit l'exemple, ouvre le moniteur série de l'Arduino IDE à 115200 bauds.

Si Chrome ou Edge n'arrive pas à se connecter à la carte, un message d'erreur s'affiche sous l'exemple, suivi du lien **Télécharger le .bin** : glisse ce fichier sur le lecteur **STEAMI**, comme avec Firefox. C'est le cas quand l'USB est bloqué sur un poste géré, ou sous Linux sans règle `udev` pour la carte (voir [Envoyer le programme sur la carte](../codespace#5-envoyer-le-programme-sur-la-carte)).

Pour modifier un exemple, ouvre-le dans un [Codespace](../codespace), où la bibliothèque et ses exemples sont déjà installés, ou dans l'[Arduino IDE](../arduino-ide), après avoir installé la [bibliothèque STeaMi](../bibliotheques).

## Les composants

Les composants dépendent de la release de la carte (voir [Révisions de la carte](/docs/hardware/revisions)). Les pages d'exemples sont rédigées une à une ; les composants sans lien n'ont pas encore la leur.

### Sur la V1c

La V1c est la carte diffusée aujourd'hui. Elle a les composants communs aux trois releases, plus le BME280 et l'écran GC9A01.

| Composant            | Ce que montrent les exemples                                                      | Cartes                                                |
| -------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [VL53L1X](./vl53l1x) | distance par temps de vol                                                         | V1a, V1b, V1c                                         |
| BME280               | pression, humidité et température                                                 | V1c                                                   |
| GC9A01               | écran TFT rond, couleur, 240 × 240                                                | V1c                                                   |
| STEAMI_BOARD         | classes par fonction, qui choisissent le composant présent sur la carte           | V1a, V1b, V1c (lumière, couleur et gestes : V1a, V1b) |
| ISM330DL             | accéléromètre et gyroscope                                                        | V1a, V1b, V1c                                         |
| LIS2MDL              | magnétomètre et boussole                                                          | V1a, V1b, V1c                                         |
| BQ27441              | jauge de batterie                                                                 | V1a, V1b, V1c                                         |
| MCP23009E            | D-PAD (boutons directionnels)                                                     | V1a, V1b, V1c                                         |
| BLE                  | Bluetooth Low Energy                                                              | V1a, V1b, V1c                                         |
| DAPLINK_FLASH        | fichier gardé par le DAPLink dans sa mémoire flash, visible sur le lecteur STEAMI | V1a, V1b, V1c                                         |
| STEAMI_CONFIG        | zone de configuration du DAPLink (révision, calibrations)                         | V1a, V1b, V1c                                         |

### Sur les V1a et V1b seulement

| Composant | Ce que montrent les exemples                   | Cartes   |
| --------- | ---------------------------------------------- | -------- |
| SSD1327   | écran OLED rond, 16 niveaux de gris, 128 × 128 | V1a, V1b |
| APDS9960  | lumière, couleur, proximité et gestes          | V1a, V1b |
| WSEN-HIDS | humidité et température                        | V1a, V1b |
| WSEN-PADS | pression                                       | V1a, V1b |
