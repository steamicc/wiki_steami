---
title: Exemples STEAMI_CONFIG
sidebar_label: STEAMI_CONFIG (configuration du DAPLink)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

# Exemples STEAMI_CONFIG : zone de configuration du DAPLink

La STeaMi a deux microcontrôleurs : le STM32WB55, qui exécute les programmes, et le STM32F103, qui exécute le firmware [DAPLink](/docs/software/daplink) et gère la liaison USB avec l'ordinateur. Le firmware DAPLink réserve dans la mémoire flash du STM32F103 une **zone de configuration** de 1 Ko, qui garde des informations propres à chaque carte : son code de révision, son nom et les calibrations de ses capteurs. Ces informations y sont écrites sous forme de texte JSON, et le programme de la carte les lit par le bus I²C interne.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Comme la zone se trouve dans le STM32F103, et non dans le STM32WB55, elle ne change pas quand un nouveau programme est téléversé, MicroPython compris. Le STM32F103 est présenté sur la page [STM32F103CBT6 — Microcontrôleur interface](/docs/hardware/main-components/stm32f103), et la façon dont sa mémoire flash est découpée, sur la page [DAPLink](/docs/software/daplink#architecture-flash-f103).

Le STM32F103 et son firmware DAPLink sont présents sur les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)). Le programme lit toutefois la zone par le bus I²C interne, comme l'exemple [DAPLINK_FLASH](./daplink-flash) : le raccordement du STM32F103 à ce bus n'apparaît qu'à l'indice B du circuit imprimé (voir [Indices du circuit imprimé](/docs/hardware/revisions#indices-du-circuit-imprimé)), et sa présence sur la V1a, dont le circuit imprimé est de la série A, n'est donc pas établie. Sur une carte où le STM32F103 ne répond pas sur ce bus, l'exemple écrit `DAPLink bridge not detected.` La zone de configuration, elle, dépend de la version du firmware DAPLink : les firmwares plus anciens n'en ont pas, et il faut alors [mettre à jour le firmware](/docs/software/daplink#mise-à-jour-du-firmware). Une zone présente ne contient pas forcément tous les champs : d'après la page [Révisions de la carte](/docs/hardware/revisions#identifier-sa-version), les cartes déjà distribuées n'ont pas encore de code de révision.

Cet exemple est celui de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → STEAMI_CONFIG** de l'Arduino IDE. Il écrit ses messages en anglais. Il n'utilise pas l'écran : il garde l'image laissée par le programme précédent, ce n'est pas une panne. La bibliothèque se sert elle-même de cette zone : elle y lit le code de révision pour reconnaître la carte (voir [Comment la carte est reconnue](../carte#comment-la-carte-est-reconnue)), et les classes par fonction y prennent les calibrations de leurs capteurs (voir [Calibrations](../carte#calibrations)). Ici, l'exemple lit la zone directement, avec le driver `SteamiConfig`.

## Le driver en bref

L'exemple utilise deux drivers : `SteamiDaplinkBridge`, qui parle au STM32F103 par le bus I²C, et `SteamiConfig`, qui lit la zone de configuration à travers lui.

- `SteamiDaplinkBridge bridge(Steami.wire());` crée le driver du pont sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, où le STM32F103 répond à l'adresse `0x3B`. `SteamiConfig config(bridge);` crée le driver de la zone de configuration, qui passera par ce pont.
- `bridge.begin()` vérifie que le STM32F103 répond sur le bus, puis lit son identifiant, qui doit valoir `0x4C`. Sinon, il renvoie `false`.
- `config.begin()` refait ce contrôle, puis vérifie que le firmware DAPLink possède une zone de configuration. Les firmwares qui n'en ont pas se bloquent quand ils reçoivent une commande de configuration accompagnée de paramètres : le driver ne leur en envoie donc jamais. Il leur demande à la place une opération sans risque, la lecture du secteur 0 de la mémoire flash externe, avec un numéro de secteur sur deux octets. Un firmware récent la fait sans erreur ; un firmware sans zone de configuration n'attend qu'un octet pour ce numéro et signale une erreur. Si la réponse n'est pas un « pas d'erreur » net, `config.begin()` renvoie `false`.
- `config.load()` lit le texte de la zone et le décode. Le STM32F103 envoie la zone par blocs, et le driver s'arrête au premier octet `0xFF`, la valeur d'une mémoire flash effacée, qui marque la fin du texte. Le driver garde ensuite en mémoire, dans l'objet `config`, chaque champ trouvé. Une zone vide n'est pas une erreur : `load()` renvoie `true`, sans aucun champ. `load()` renvoie `false` si le texte ne commence pas par `{` ou ne finit pas par `}`, ou si une calibration de température n'a pas ses deux valeurs.
- `boardRevision()`, `boardName()`, `bootCount()`, `getTemperatureCalibration()`, `getMagnetometerCalibration()` et `getAccelerometerCalibration()` ne lisent plus rien sur la carte : elles donnent la copie faite par `load()`. Chacune renvoie `true` et remplit la variable passée en paramètre quand le champ est dans la zone, et `false` sinon, sans toucher à cette variable.

Le texte de la zone est court : chaque champ a une clé de quelques lettres. Dans `tc`, chaque capteur a sa propre clé : `hts` pour le HTS221, `mag` pour le LIS2MDL, `ism` pour l'ISM330DL, `hid` pour le WSEN-HIDS, `pad` pour le WSEN-PADS et `bme` pour le BME280. La section [Calibrations](../carte#calibrations) de la page Reconnaître la carte indique quelles calibrations les classes par fonction appliquent.

| Clé    | Contenu                                                                               | Fonction de lecture             |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------- |
| `rev`  | code de révision de la carte, un nombre entier                                        | `boardRevision()`               |
| `name` | nom de la carte, un texte                                                             | `boardName()`                   |
| `bc`   | compteur de démarrages, un entier positif ou nul                                      | `bootCount()`                   |
| `tc`   | calibrations de température, une par capteur : gain `g` et décalage `o`               | `getTemperatureCalibration()`   |
| `cm`   | calibration du magnétomètre : décalages `hx`, `hy`, `hz` et échelles `sx`, `sy`, `sz` | `getMagnetometerCalibration()`  |
| `ca`   | calibration de l'accéléromètre : décalages `ox`, `oy`, `oz`, en g                     | `getAccelerometerCalibration()` |

Par exemple, une zone qui contient `{"rev":131,"name":"STeaMi-01","tc":{"bme":{"g":1,"o":-0.5}}}` donne un code de révision, un nom et une calibration de température pour le BME280, et rien d'autre.

Le driver sait aussi écrire la zone, avec les fonctions `set…()` puis `save()`, qui efface toute la zone avant d'y réécrire tous les champs gardés en mémoire. L'exemple ne s'en sert pas : il ne fait que lire, et ne modifie rien sur la carte. Pour écrire un code de révision ou une calibration, voir [Corriger le code de révision](../carte#corriger-le-code-de-révision).

## show_config {#show_config}

**Ce qu'on observe** : au démarrage, le programme écrit une seule fois dans la console le contenu de la zone de configuration, un champ par ligne. Chaque champ absent de la zone est suivi de `(not set)`. Par exemple, avec la zone donnée plus haut :

```text
Board revision: 131 (V1c, index 1)
Board name:     STeaMi-01
Boot count:     (not set)
Temperature calibration (gain / offset):
  hts221: (not set)
  lis2mdl: (not set)
  ism330dl: (not set)
  wsen_hids: (not set)
  wsen_pads: (not set)
  bme280: 1.0000 / -0.5000
Magnetometer calibration: (not set)
Accelerometer calibration: (not set)
```

Avec une zone vide, chaque champ affiche `(not set)`. Le programme ne fait plus rien ensuite. Si la console reste vide, ou pour relire la zone, appuyer sur le bouton Reset de la carte.

Si la carte ne peut pas être lue, une seule ligne s'affiche, à la place des autres :

- `DAPLink bridge not detected.` : le STM32F103 n'a pas répondu sur le bus I²C, ou pas avec l'identifiant attendu ;
- `This board's DAPLink firmware has no config zone: update it.` : le firmware DAPLink n'a pas de zone de configuration, ou n'a pas répondu clairement au test de `config.begin()` ; le [mettre à jour](/docs/software/daplink#mise-à-jour-du-firmware) ;
- `The config zone does not hold valid JSON.` : la zone contient un texte que le driver ne sait pas décoder.

```cpp file=.external/arduino-steami/examples/STEAMI_CONFIG/show_config/show_config.ino

```

**Comment ça marche** : tout se passe dans `setup()`, et `loop()` est vide. Le programme prévoit d'abord d'attendre la console série, au plus 2 secondes (`while (!Serial && millis() < 2000)`), une précaution utile sur les cartes à port USB natif. Sur la STeaMi, `Serial` passe par le DAPLink et se déclare prêt dès `Serial.begin()` : la boucle s'arrête aussitôt, le programme n'attend pas, et une console ouverte après le démarrage peut manquer ses lignes. Il franchit ensuite trois étapes, chacune pouvant arrêter le programme avec son message : `bridge.begin()` pour joindre le STM32F103, `config.begin()` pour s'assurer que son firmware a une zone de configuration, puis `config.load()` pour lire et décoder la zone. Il interroge enfin chaque champ, et écrit `(not set)` quand la fonction renvoie `false`.

Le code de révision est un nombre à trois chiffres : les centaines donnent la génération, les dizaines la release (1 pour a, 2 pour b, 3 pour c) et les unités l'indice du schéma, 0 pour un prototype (voir [Identifier sa version](/docs/hardware/revisions#identifier-sa-version)). La fonction `printRevision()` de l'exemple fait ce décodage elle-même : `131` s'affiche `131 (V1c, index 1)` et `130` s'affiche `130 (V1c, prototype)`. Un nombre qui n'est pas de la génération 1 ou dont la release n'est pas a, b ou c est suivi de `(unknown code)`, comme le `3` écrit par d'anciens exemples.

Les calibrations de température sont demandées pour les six capteurs que le driver connaît, quelle que soit la release de la carte. Le programme désigne chaque capteur par une constante du driver, comme `STEAMI_CONFIG_SENSOR_BME280`, qui vaut `"bme280"` : c'est ce nom qui s'affiche. Dans la zone, le même capteur est rangé sous une clé plus courte, `bme` ; le driver fait la correspondance. Le gain et le décalage s'affichent avec quatre décimales ; la température corrigée vaut `mesure × gain + décalage`.

Les décalages du magnétomètre sont en valeurs brutes du capteur et s'affichent avec deux décimales, comme ses échelles. Les décalages de l'accéléromètre, en g, s'affichent avec quatre décimales. Pour ces deux calibrations, une valeur qui manque dans la zone prend sa valeur neutre : 0 pour un décalage, 1 pour une échelle.

Une lecture ratée en cours de route, par exemple un bloc qui n'arrive pas, arrête la lecture sans signaler d'erreur. Si rien n'a été lu, la zone paraît vide, et chaque champ affiche `(not set)`. Si la lecture s'arrête au milieu du texte, celui-ci ne finit en général plus par `}` et le message `The config zone does not hold valid JSON.` s'affiche ; mais sur une zone longue, lue en plusieurs blocs, la coupure peut tomber juste après un `}` intérieur, et seuls les derniers champs disparaissent alors, sans message d'erreur. Une zone qui semble vide sur une carte calibrée, ou à laquelle manquent des calibrations attendues, mérite donc une seconde lecture, avec le bouton Reset, avant toute écriture.

Ni la bibliothèque STeaMi ni ses exemples n'écrivent le compteur de démarrages `bc` : il n'apparaît que si un programme l'a écrit, par exemple avec `incrementBootCount()` suivi de `save()`.

<EssayerExemple id="STEAMI_CONFIG/show_config" />
