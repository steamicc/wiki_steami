---
title: Exemples BLE
sidebar_label: BLE (Bluetooth)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore rssi trilaterate -->

# Exemples BLE : Bluetooth Low Energy

Avant le premier essai sur une carte neuve, ou si `BLE.begin()` échoue, cliquer sur **Vérifier la pile radio**, sous chaque exemple : le bouton lit la pile radio de la carte et l'installe si besoin (voir [Depuis le wiki](/docs/software/pile-radio#depuis-le-wiki)).

Le Bluetooth Low Energy (BLE) permet à la carte d'échanger avec d'autres appareils par radio, dans la bande des 2,4 GHz. Les exemples de cette page n'en utilisent que la forme la plus simple, sans connexion : une carte **diffuse des annonces** (_advertising_), de courts paquets radio répétés à intervalle régulier, et une autre carte **les écoute** (_scan_) en mesurant la force du signal reçu, le **RSSI** (_Received Signal Strength Indicator_). Plus les deux cartes sont proches, plus le signal reçu est fort : de ce RSSI, les exemples tirent une proximité, puis une distance, puis une position dans une pièce.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

La radio est intégrée au microcontrôleur principal, le [STM32WB55](/docs/hardware/main-components/stm32wb55), avec une antenne intégrée au circuit imprimé. Elle est la même sur les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)). Un seul exemple dépend de la release : **BleBeacon** diffuse la température du capteur WSEN-HIDS, présent seulement sur les V1a et V1b.

Le STM32WB55 a deux cœurs : le programme Arduino tourne sur le premier, le second fait fonctionner la radio avec son propre firmware, la **pile radio** (_wireless stack_). Les exemples ont donc besoin d'une pile Bluetooth installée sur la carte. Pour les STM32WB, le [README de la bibliothèque STM32duinoBLE](https://github.com/stm32duino/STM32duinoBLE#readme) demande le firmware **BLE HCILayer** (fichier `stm32wbxx_BLE_HCILayer_fw.bin`). Il s'installe depuis le navigateur avec le bouton **Vérifier la pile radio**, sous chaque exemple de cette page (voir [Pile radio Bluetooth](/docs/software/pile-radio#depuis-le-wiki)). Sur une V1c où ce firmware était installé (version 1.20.0), `BLE.begin()` a réussi dans tous les exemples qui l'atteignent : la console a continué jusqu'au menu ou jusqu'à la ligne `Scanning...` (`Scanning for beacons...` pour certains). Seul BleBeacon s'est arrêté avant, faute de capteur WSEN-HIDS. Si `BLE.begin()` échoue, il renvoie `0` : les exemples écrivent alors `BLE init failed!` et s'arrêtent. Sans pile radio, ce message n'arrive pas tout de suite : d'après le code de la bibliothèque, elle attend jusqu'à 10 s la réponse du second cœur avant d'abandonner, et certaines de ses attentes n'ont pas de limite, si bien que la console peut aussi rester muette. Quand, après une dizaine de secondes, la console n'est pas allée jusqu'au menu, jusqu'à cette ligne `Scanning` ou, pour BleBeacon, jusqu'à `BLE Beacon ready.`, ou que `BLE init failed!` apparaît, vérifier d'abord la pile radio avec le bouton **Vérifier la pile radio**.

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → BLE** de l'Arduino IDE. Ils écrivent leurs messages en anglais. Ils n'utilisent ni l'écran, qui garde l'image laissée par le programme précédent, ni la LED Bluetooth. La section [Bluetooth](../capteurs#bluetooth) de la page Capteurs et écran les présente en une phrase ; ici, chacun est détaillé.

Sauf BleBeacon, tous ces exemples demandent **plusieurs cartes** : des balises qui émettent, et une carte qui écoute. Les récepteurs reconnaissent les balises à leur nom :

| Exemple          | Rôle de la carte              | Nom émis ou cherché               | Cartes en tout                      |
| ---------------- | ----------------------------- | --------------------------------- | ----------------------------------- |
| BleBeacon        | balise                        | émet `STeaMi-Beacon`              | 1 (V1a ou V1b)                      |
| BleRssiProximity | récepteur                     | cherche `STeaMi-Beacon`           | 2 : une balise BleBeacon + celle-ci |
| BleHotCold       | balise ou récepteur, au choix | émet ou cherche `STeaMi-Treasure` | 2, avec le même programme           |
| BleRssiMapper    | récepteur                     | cherche `Beacon_M1` à `Beacon_M3` | 3 ou 4 : 2 ou 3 balises + celle-ci  |
| BleTrilateration | récepteur                     | cherche `Beacon_M1` à `Beacon_M3` | 4 : 3 balises + celle-ci            |
| BleIndoorMap     | récepteur                     | cherche `Beacon_M1` à `Beacon_M3` | 4 : 3 balises + celle-ci            |

Aucun exemple de la bibliothèque n'émet tels quels les noms `Beacon_M1`, `Beacon_M2` et `Beacon_M3`. Pour BleRssiMapper, BleTrilateration et BleIndoorMap, les balises exécutent une copie modifiée de BleBeacon, dans un [Codespace](../codespace) ou dans l'[Arduino IDE](../arduino-ide) : remplacer le nom `STeaMi-Beacon` par `Beacon_M1`, `Beacon_M2` ou `Beacon_M3`, un par balise.

Sur une V1c, la copie doit en plus se passer du capteur WSEN-HIDS : retirer `#include <SteamiWsenHids.h>` et la déclaration de `sensor`, le bloc de `setup()` qui appelle `sensor.begin()` et `setContinuous()`, et, dans `loop()`, la lecture de la température (`temp`, `tempRaw`, `data`) ainsi que les trois lignes `Serial.print()` et `Serial.println()` qui l'affichent. Supprimer aussi l'appel à `setManufacturerData()`, ou lui passer des octets fixes, et afficher à la place une simple ligne, par exemple `Serial.println("Advertising");`. Le nom suffit aux récepteurs, qui ne lisent pas ces données.

Dans une salle où plusieurs groupes travaillent en même temps, toutes les balises d'un même exemple émettent le même nom, et un récepteur mélange alors leurs signaux dans une seule moyenne. Donner à chaque groupe ses propres noms, à la fois dans ses balises et dans son récepteur, puis recompiler : les programmes téléversés depuis cette page gardent les noms d'origine. BleRssiMapper coupe à 15 caractères les noms qu'il écrit dans son CSV.

Pour programmer plusieurs cartes depuis cette page, les brancher une par une : brancher la première, cliquer sur **Connecter la carte**, téléverser, puis la débrancher. La page indique que la carte a été débranchée ; brancher la suivante et cliquer de nouveau sur **Connecter la carte**. Une carte programmée garde son programme : il suffit ensuite de l'alimenter, par sa batterie ou par un câble USB.

BleHotCold et BleRssiMapper ont besoin de commandes, des caractères envoyés à la carte par la liaison série ; BleIndoorMap fonctionne sans, mais accepte `c` et `h`. La console de cette page ne fait qu'afficher ce que la carte écrit : pour envoyer ces caractères, utiliser un moniteur série, par exemple celui de l'Arduino IDE, à 115200 bauds. Avant de l'ouvrir, quitter cette page pour une page sans exemple à essayer : la page libère alors la carte, et les deux ne la lisent pas en même temps.

## Le driver en bref

Les exemples ne passent pas par un driver STeaMi : ils utilisent la bibliothèque **STM32duinoBLE** (`#include <STM32duinoBLE.h>`), l'adaptation par ST de la bibliothèque ArduinoBLE, que l'Arduino IDE propose d'installer avec la bibliothèque STeaMi (voir [Bibliothèques STeaMi](../bibliotheques)). Elle fournit l'objet `BLE`, qui représente la radio de la carte, et la classe `BLEDevice`, qui représente un appareil entendu.

Pour démarrer la radio :

- `BLE.begin()` démarre le second cœur et lui demande de lancer la pile Bluetooth, puis réinitialise la radio et la configure. Il renvoie `1` si tout s'est bien passé, `0` si une étape a échoué.
- `BLE.poll()` traite les messages arrivés de la radio. `BLE.available()` l'appelle déjà lui-même ; les exemples l'appellent en plus à chaque tour de `loop()`.

Côté balise, qui émet :

- `BLE.setLocalName(nom)` choisit le nom diffusé, celui que les récepteurs comparent.
- `BLE.setDeviceName(nom)` donne aussi ce nom à l'appareil dans sa table d'attributs (GATT), que seul un appareil connecté peut lire. Les balises des exemples refusent les connexions : cet appel n'a pas d'effet visible ici.
- `BLE.setAdvertisingInterval(n)` règle l'intervalle entre deux annonces, en unités de 0,625 ms : `160` donne 100 ms, `100` donne 62,5 ms.
- `BLE.setConnectable(false)` fait émettre des annonces sans accepter de connexion : la carte est une **balise** (_beacon_).
- `BLE.setManufacturerData(identifiant, données, longueur)` ajoute à l'annonce des « données du fabricant » : un identifiant d'entreprise sur deux octets, suivi d'octets libres.
- `BLE.advertise()` assemble l'annonce et lance la diffusion. Ensuite, c'est la radio qui émet toute seule, à l'intervalle choisi, même pendant un `delay()`. `BLE.stopAdvertise()` arrête la diffusion.

Côté récepteur, qui écoute :

- `BLE.scan(true)` lance l'écoute, en continu (la radio écoute 20 ms toutes les 20 ms). Avec `true`, chaque annonce reçue est signalée, et pas seulement la première de chaque appareil : c'est indispensable pour suivre l'évolution du RSSI. `BLE.stopScan()` arrête l'écoute.
- `BLE.available()` rend le prochain appareil entendu et le retire de la liste des appareils en attente. Quand la liste est vide, il rend un `BLEDevice` vide, faux dans un test : d'où la boucle `while ((device = BLE.available()))`, qui vide la liste à chaque tour de `loop()`. La liste ne garde qu'une entrée par appareil, mise à jour à chaque annonce : entre deux tours, un appareil n'est rendu qu'une fois, avec sa dernière mesure.
- `device.localName()` renvoie le nom diffusé par l'appareil, ou une chaîne vide s'il n'en diffuse pas.
- `device.rssi()` renvoie le RSSI du dernier paquet reçu de cet appareil, en dBm : un nombre négatif, d'autant plus proche de 0 que le signal est fort.

Un détail de la bibliothèque explique comment le nom arrive au récepteur. Une annonce contient au plus 31 octets ; STM32duinoBLE y met les données du fabricant, mais range le nom dans un second paquet, la **réponse au scan**. La balise ne l'envoie qu'à un récepteur qui la lui demande juste après avoir reçu l'annonce : c'est ce que fait `BLE.scan()`, qui fait un scan dit actif. `BLE.available()` ne rend une balise qu'une fois sa réponse reçue, et le RSSI lu ensuite est celui de cette réponse.

## BleBeacon {#blebeacon}

**Ce qu'on observe** : la console écrit `WSEN-HIDS ready.` puis `BLE Beacon ready.`, puis chaque seconde la température diffusée, par exemple `Advertising — T = 23.47 C`. Ce que la carte émet se voit depuis un autre appareil. Dans une application de scan BLE sur téléphone, comme nRF Connect ou LightBlue, une balise nommée `STeaMi-Beacon` apparaît, avec deux octets de données du fabricant, d'identifiant `0x0059`, qui changent avec la température.

Sur une V1c, qui n'a pas de WSEN-HIDS, la console écrit seulement `WSEN-HIDS not detected — check wiring.` et l'exemple s'arrête, avant même de démarrer la radio : il n'y a pas de câblage à vérifier, le capteur est simplement absent. C'est ce qu'affiche une V1c d'essai juste après le téléversement.

**Matériel** : une carte V1a ou V1b. Pour voir les annonces : un téléphone avec une application de scan BLE, ou une deuxième carte avec [BleRssiProximity](#blerssiproximity).

```cpp file=.external/arduino-steami/examples/BLE/BleBeacon/BleBeacon.ino

```

**Comment ça marche** : `setup()` prépare d'abord le capteur. `begin()` vérifie qu'il répond, puis `setContinuous(WSEN_HIDS_ODR_1_HZ)` le fait mesurer tout seul, une fois par seconde ; `temperature()` lit ensuite la dernière mesure. Vient ensuite la radio : `BLE.begin()`, le nom, une annonce toutes les 100 ms (`160` × 0,625 ms) et `setConnectable(false)`, qui fait de la carte une balise.

Une annonce transporte peu d'octets. Plutôt qu'un nombre à virgule sur quatre octets, le programme envoie la température multipliée par 100, en nombre entier sur deux octets, l'octet de poids fort d'abord : 23,47 °C devient 2347, soit `09 2B` en hexadécimal. Un récepteur retrouve la température en divisant par 100. `setManufacturerData()` place ces deux octets dans les données du fabricant, après l'identifiant `0x0059`. Cet identifiant est attribué à Nordic Semiconductor : l'exemple l'emprunte, un produit réel utiliserait celui de son propre fabricant.

À chaque tour de `loop()`, le programme arrête la diffusion, change les données, puis la relance avec `advertise()`. Il attend ensuite une seconde avec `delay(1000)` ; pendant ce temps, la radio continue d'émettre toute seule toutes les 100 ms. Chaque température est donc répétée une dizaine de fois avant la suivante.

<EssayerExemple id="BLE/BleBeacon" />

## BleRssiProximity {#blerssiproximity}

**Ce qu'on observe** : après `BLE RSSI Proximity Scanner`, `Looking for: STeaMi-Beacon` et `Scanning...`, la console écrit une ligne à chaque annonce reçue de la balise, plusieurs fois par seconde, sous forme de jauge : `RSSI: -52 dBm | [===========>        ] 63%`. Quand les deux cartes se rapprochent, le RSSI monte vers -30 dBm et la jauge se remplit ; quand elles s'éloignent, ou qu'une main ou un corps passe entre elles, elle se vide. Tant que la balise n'est pas reçue, rien ne s'affiche après `Scanning...` : c'est ce qu'écrit une carte seule, sans balise à portée, par exemple une V1c d'essai.

**Matériel** : deux cartes. L'une, une V1a ou une V1b, exécute [BleBeacon](#blebeacon) ; l'autre, de n'importe quelle release, exécute BleRssiProximity. Avec seulement des V1c, la balise est une copie de BleBeacon sans le capteur (voir le tableau en tête de page).

```cpp file=.external/arduino-steami/examples/BLE/BleRssiProximity/BleRssiProximity.ino

```

**Comment ça marche** : `BLE.scan(true)` lance l'écoute. À chaque tour de `loop()`, le programme vide la liste des appareils entendus avec `BLE.available()` et ne garde que celui dont `localName()` vaut `STeaMi-Beacon` : les autres appareils Bluetooth de la pièce (téléphones, montres, écouteurs) sont ignorés.

Le RSSI varie beaucoup d'un paquet à l'autre, même quand rien ne bouge : le signal se réfléchit sur les murs et les meubles, et son trajet change avec l'orientation des cartes et les obstacles. Le programme fait donc la moyenne des 5 dernières valeurs (`RSSI_SAMPLES`), une **moyenne glissante** : elle lisse les variations, au prix d'un léger retard.

`rssiToProximity()` convertit ensuite la moyenne en pourcentage, de façon linéaire : -90 dBm (`RSSI_FAR`) donne 0 %, -30 dBm (`RSSI_NEAR`) donne 100 %, -60 dBm donne 50 %, et les valeurs au-delà sont ramenées à 0 ou 100 %. Ce pourcentage n'est pas une distance. En dBm, le signal perd à peu près la même quantité chaque fois que la distance double : la jauge baisse donc vite tout près de la balise, puis de plus en plus lentement. Les deux seuils sont fixés dans le code, pas mesurés : [BleTrilateration](#bletrilateration) montre comment passer du RSSI à une distance.

<EssayerExemple id="BLE/BleRssiProximity" />

## BleHotCold {#blehotcold}

**Ce qu'on observe** : au démarrage, la console affiche un menu, `=== BLE Hot/Cold ===`, `1 - TREASURE (beacon)`, `2 - SEEKER  (scanner)`, `Enter your choice:`. Le menu n'apparaît qu'une fois la radio démarrée par `BLE.begin()` ; une V1c d'essai, seule, l'affiche juste après le téléversement, puis attend un caractère sans rien écrire d'autre. Envoyer `1` à une carte en fait le trésor : elle écrit `TREASURE mode — advertising as: STeaMi-Treasure`, puis `Broadcasting... (reset to change mode)` toutes les 2 s. Envoyer `2` à l'autre en fait le chercheur : `SEEKER mode — scanning for: STeaMi-Treasure`. Dès qu'il reçoit le trésor, le buzzer du chercheur bipe, plus aigu et plus vite à mesure qu'il s'en approche, et sa console écrit quatre fois par seconde la zone, le RSSI moyen et la jauge : `HOT | RSSI: -52 dBm | [===========>        ] 63%`.

| Zone       | Proximité     | RSSI moyen       | Son                                       |
| ---------- | ------------- | ---------------- | ----------------------------------------- |
| `COLD`     | moins de 25 % | -76 dBm et moins | 440 Hz, un bip de 80 ms toutes les 880 ms |
| `WARM`     | 25 à 49 %     | de -75 à -61 dBm | 600 Hz, un bip toutes les 480 ms          |
| `HOT`      | 50 à 74 %     | de -60 à -46 dBm | 800 Hz, un bip toutes les 280 ms          |
| `BURNING!` | 75 % et plus  | -45 dBm et plus  | 1200 Hz, un bip toutes les 160 ms         |

Un autre caractère que `1` ou `2` fait écrire `Invalid choice.` et réafficher le menu ; les fins de ligne envoyées par le moniteur série sont ignorées. Le rôle ne se choisit qu'une fois : pour en changer, appuyer sur le bouton Reset, qui ramène au menu. Si le menu a défilé avant l'ouverture du moniteur série, la carte attend quand même son `1` ou son `2`.

Si le trésor s'éteint ou s'éloigne trop, le chercheur garde la dernière zone : il continue de biper et d'afficher la dernière valeur reçue.

**Matériel** : deux cartes, de n'importe quelle release, avec le même programme BleHotCold, et un moniteur série pour chacune, pour choisir son rôle (la console de cette page ne peut pas envoyer de caractère, voir plus haut).

```cpp file=.external/arduino-steami/examples/BLE/BleHotCold/BleHotCold.ino

```

**Comment ça marche** : un seul programme, deux rôles, choisis par le caractère lu dans `loop()`.

Le trésor, `runTreasure()`, est une balise comme [BleBeacon](#blebeacon), sans données : le nom `STeaMi-Treasure`, une annonce toutes les 62,5 ms (`100` × 0,625 ms), pas de connexion. Il tourne ensuite dans une boucle sans fin, qui appelle `BLE.poll()` et écrit son message toutes les 2 s.

Le chercheur, `runSeeker()`, reprend [BleRssiProximity](#blerssiproximity) : même filtre sur le nom, même moyenne des 5 dernières valeurs, même conversion de -90 dBm à -30 dBm en pourcentage. `zoneFor()` choisit ensuite la zone et son son.

La difficulté est de biper sans cesser d'écouter. Un `delay()` entre deux bips bloquerait la lecture des annonces, et le son suivrait un RSSI en retard. `buzzerTick()` est donc une petite **machine à états** : appelée à chaque tour de boucle, elle regarde avec `millis()` s'il est temps de commencer ou d'arrêter le son, puis rend la main aussitôt. `tone(SPEAKER, fréquence)`, sans durée, fait sonner le buzzer jusqu'au `noTone()` suivant (voir [Jouer un son](../premiers-programmes#jouer-un-son)). Si la zone change au milieu d'un bip, la fréquence change tout de suite. L'affichage est limité à une ligne toutes les 250 ms (`PRINT_PERIOD_MS`), pour ne pas noyer la console.

<EssayerExemple id="BLE/BleHotCold" />

## BleRssiMapper {#blerssimapper}

**Ce qu'on observe** : la console affiche l'aide (`=== BLE RSSI Room Mapper ===`, `r → record current point`, `s → stop and print CSV`, `h → help`), puis `Scanning for beacons...`. Toutes les 2 s, elle donne le RSSI moyen de chaque balise entendue, par exemple `Point #1 | Beacons: Beacon_M1=-67dBm  Beacon_M3=-80dBm`, où `#1` est le numéro du prochain point. Tant qu'aucune balise n'a été entendue, la ligne s'arrête après `Beacons:` : une V1c d'essai, seule, écrit `Point #1 | Beacons:` toutes les 2 s.

En chaque endroit de la pièce où l'on veut une mesure, envoyer `r` : le programme enregistre un point, `Recording point #1 (2 beacons)`, suivi d'une ligne par balise, `Beacon_M1, -67`. Si aucune balise n'a encore été entendue, il écrit `No beacon seen — move closer and retry.`. Envoyer `s` termine : l'écoute s'arrête et la console écrit toutes les mesures au format CSV, entre `=== CSV OUTPUT — copy and save as rssi_map.csv ===` et `=== END OF CSV ===`, puis le total, par exemple `Total: 5 points, 12 rows.`. `h` réaffiche l'aide ; tout autre caractère fait écrire `Unknown command. Send 'h' for help.`.

Après `s`, `r` n'enregistre plus rien (il reçoit la réponse `Unknown command`) et `s` réécrit le CSV. Les mesures sont gardées en mémoire vive : le bouton Reset repart de zéro, et les efface.

**Matériel** : trois ou quatre cartes. Deux ou trois balises nommées `Beacon_M1`, `Beacon_M2` et `Beacon_M3` (une copie modifiée de BleBeacon, voir le tableau en tête de page), posées dans la pièce, et cette carte, déplacée d'un point à l'autre et reliée à un ordinateur portable avec un moniteur série.

```cpp file=.external/arduino-steami/examples/BLE/BleRssiMapper/BleRssiMapper.ino

```

**Comment ça marche** : le programme ne calcule rien, il relève. `beaconIndex()` reconnaît chaque balise à son nom, et chacune a sa propre moyenne glissante des 5 dernières valeurs. À chaque `r`, le programme ajoute, pour chaque balise entendue, une ligne `point_id,beacon_name,rssi` à un tableau de 150 lignes (50 points de 3 balises) ; une fois le tableau plein, plus rien n'est ajouté.

Le programme ne connaît pas la position des points : noter, pour chaque numéro, l'endroit de la pièce où il a été pris. Le CSV, ouvert dans un tableur, montre alors comment le signal de chaque balise baisse avec la distance et derrière les obstacles. Ces relevés servent aussi à régler les constantes de [BleTrilateration](#bletrilateration) : le RSSI mesuré à 1 m d'une balise, et la vitesse à laquelle il baisse avec la distance.

Une balise entendue une fois reste comptée, avec sa dernière moyenne, même quand elle n'est plus reçue : la ligne d'état et les points enregistrés réutilisent alors cette ancienne valeur.

<EssayerExemple id="BLE/BleRssiMapper" />

## BleTrilateration {#bletrilateration}

**Ce qu'on observe** : au démarrage, la console écrit `BLE Trilateration Indoor Positioning` et la position des balises en centimètres, `Beacon_M1 = (0, 0)`, `Beacon_M2 = (420, 0)`, `Beacon_M3 = (330, 278)`, puis `Scanning...`. Ensuite, toutes les demi-secondes :

- tant que les trois balises n'ont pas été entendues : `Waiting for beacons (2/3 seen)...`, avec le nombre de balises déjà entendues ; une carte seule, sans balise à portée, écrit `Waiting for beacons (0/3 seen)...` deux fois par seconde ;
- puis la distance estimée de chaque balise, par exemple `Distances: Beacon_M1=185cm  Beacon_M2=310cm  Beacon_M3=220cm`, et la position estimée de la carte, `Position: X=210cm  Y=140cm` ;
- environ toutes les deux secondes, une carte de la pièce en caractères, 42 × 28 points, un caractère pour 10 cm : les balises `1` et `3`, et la position estimée `X`. La dernière colonne de cette carte correspond à 410-419 cm : la balise M2, à 420 cm, tombe juste à droite, et le `2` n'y apparaît pas.

Quand une balise est trop faible (estimée à plus de 4,30 m), sa distance s'affiche `n/acm` (pour « n/a », non disponible) et la console écrit `At least one beacon signal too weak — skipping trilateration.`. Quand la position calculée est aberrante, la console écrit `Trilateration failed — aberrant result rejected.`.

**Matériel** : quatre cartes et un mètre ruban. Trois balises nommées `Beacon_M1`, `Beacon_M2` et `Beacon_M3` (une copie modifiée de BleBeacon, voir le tableau en tête de page), posées aux positions du code : M1 dans un coin, M2 à 4,20 m de M1 le long d'un mur, M3 à 3,30 m le long de ce mur et 2,78 m vers l'intérieur de la pièce. La quatrième carte exécute BleTrilateration et se déplace entre les balises. Pour d'autres positions, ou pour d'autres réglages, modifier les constantes du programme et le recompiler.

```cpp file=.external/arduino-steami/examples/BLE/BleTrilateration/BleTrilateration.ino

```

**Comment ça marche** : le programme passe du RSSI à une position en trois étapes.

**Du RSSI à la distance.** `rssiToDistance()` utilise le modèle d'affaiblissement en fonction de la distance (_log-distance path loss_) : distance en mètres = 10 ^ ((RSSI à 1 m − RSSI) / (10 × n)). Le RSSI à 1 m (`RSSI_REF`) est celui reçu à un mètre de la balise. L'exposant `n` (`PATH_LOSS_N`) dit à quelle vitesse le signal baisse : 2 en champ libre, davantage à l'intérieur, à cause des murs et des obstacles. Chaque balise a ses deux valeurs ; d'après le commentaire du code, l'auteur les a mesurées sur place, avec un téléphone. Pour M1 (-75 dBm et n = 3,99), -75 dBm donne 100 cm et -87 dBm environ 200 cm. Au-delà de 430 cm (`MAX_DIST_CM`), la distance est jugée peu fiable et la fonction renvoie -1. Le RSSI est d'abord lissé, sur les 8 dernières valeurs de chaque balise.

**De trois distances à une position.** Chaque distance place la carte sur un cercle autour d'une balise ; la carte est là où les trois cercles se croisent. `trilaterate()` écrit l'équation des trois cercles, puis soustrait la première aux deux autres : les termes en x² et y² disparaissent, et il reste deux équations du premier degré en x et y (coefficients `A` à `F`), résolues par les formules de Cramer. Comme les distances sont bruitées, les trois cercles ne se croisent presque jamais en un seul point : ce calcul donne quand même un point de compromis. Le résultat est rejeté si les balises sont alignées (le dénominateur est nul) ou s'il tombe à plus de 550 cm (`MAX_VALID_CM`) du centre du triangle des balises.

**Le lissage de la position.** `applyFilter()` mélange chaque nouvelle estimation à la position précédente : 15 % de la nouvelle (`ALPHA`), 85 % de l'ancienne. Il ignore en plus les déplacements de moins de 15 cm (`MIN_MOVE_CM`). Comme le déplacement vaut 15 % de l'écart, la position affichée ne bouge que quand la nouvelle estimation s'en écarte de plus de 1 m : le `X` est stable, mais suit lentement.

Ce lissage a une exception. Le programme marque l'absence de position par une abscisse négative (`filteredX` vaut -1 au départ). Quand la position retenue passe à gauche de M1 (x négatif), ce qui arrive facilement près de cette balise avec des distances bruitées, elle est donc traitée comme « pas encore de position » : la console l'écrit quand même, par exemple `Position: X=-30cm  Y=40cm`, mais le `X` n'apparaît pas sur la carte, et l'estimation suivante est reprise telle quelle, sans lissage.

Une balise entendue une fois reste comptée, avec son dernier RSSI : si elle s'éteint, le calcul continue avec cette ancienne valeur. [BleIndoorMap](#bleindoormap) corrige ce point.

<EssayerExemple id="BLE/BleTrilateration" />

## BleIndoorMap {#bleindoormap}

**Ce qu'on observe** : au démarrage, la console écrit l'aide, `=== BLE Indoor Map ===`, `c → clear trail and reset position`, `h → help`, puis la position des balises en centimètres, `Beacon layout (cm):`, `M1 = (0, 0)`, `M2 = (420, 0)`, `M3 = (330, 278)`, et enfin `Scanning for beacons...`. Vient ensuite le même calcul que [BleTrilateration](#bletrilateration), présenté sous forme de carte, redessinée toutes les demi-secondes, sous le titre `+------ BLE Indoor Map ------+` :

- un cadre de 44 × 30 caractères, un caractère pour 10 cm, avec les balises `1`, `2` et `3`, la position estimée `X` et, en `.`, les cinq positions précédentes ;
- la position, `Position: X=210cm  Y=140cm`, ou `Position: waiting for all 3 beacons...` tant qu'il n'y en a pas, par exemple juste après `c`, ou quand la position retenue est à gauche de M1 (voir plus bas) ;
- l'état de chaque balise, par exemple `Beacon_M1: OK  RSSI=-86dBm  dist=188cm  age=0s`, ou `NOT SEEN` ; `dist=-1cm` signale une balise trop faible pour donner une distance ;
- le rappel des commandes : `c` efface la trace et la position (`Trail cleared.`), `h` réaffiche l'aide et la position des balises.

Une carte seule, sans balise à portée, dessine un cadre vide, avec seulement les balises `1`, `2` et `3`, et écrit `Position: waiting for all 3 beacons...` puis `Beacon_M1: NOT SEEN` et de même pour les deux autres balises. Lors d'un essai sur une V1c, la première carte est arrivée incomplète, coupée par la marque `<DAPLink:Overflow>` : le programme écrit chaque carte d'un seul coup, plus de 1500 caractères, et l'interface USB de la carte (DAPLink), qui relaie la liaison série, a perdu une partie de ces caractères. Une carte tronquée de cette façon ne signale pas une erreur du calcul.

Chaque carte commence par les codes `\033[2J\033[H`, qui, dans un terminal qui les comprend (codes ANSI), effacent l'écran et ramènent le curseur en haut : la carte reste alors en place et s'anime. La console de cette page n'interprète pas ces codes : les cartes s'y affichent les unes sous les autres. Le moniteur série de l'Arduino IDE ne les interprète pas non plus, à notre connaissance, et empile lui aussi les cartes. Pour une carte animée, utiliser un terminal qui comprend les codes ANSI, comme `pio device monitor` (celui de la fiche d'activité), `screen` ou PuTTY, à 115200 bauds.

**Matériel** : comme pour [BleTrilateration](#bletrilateration), trois balises `Beacon_M1` à `Beacon_M3` aux positions du code et cette carte, avec un terminal pour voir la carte animée et envoyer `c` et `h`. La bibliothèque fournit une fiche d'activité en anglais, [BleIndoorMap.md](https://github.com/steamicc/arduino-steami/blob/main/examples/BLE/BleIndoorMap/BleIndoorMap.md) : installation des balises, étalonnage et déroulé d'une séance en classe.

```cpp file=.external/arduino-steami/examples/BLE/BleIndoorMap/BleIndoorMap.ino

```

**Comment ça marche** : le calcul est celui de BleTrilateration, avec les mêmes constantes : moyenne glissante, conversion du RSSI en distance, trilatération, lissage de la position. Les différences portent sur la façon de suivre les balises et sur l'affichage :

- Une balise qui n'a pas été reçue depuis 5 s (`BEACON_TIMEOUT_MS`) passe à `NOT SEEN`, qu'elle soit éteinte ou simplement hors de portée, et la position n'est plus recalculée tant qu'elle n'est pas revenue : le `X` reste à sa dernière place.
- Comme dans BleTrilateration, une position retenue à gauche de M1 (x négatif) compte comme « pas de position » : elle n'est pas lissée, et la carte affiche `Position: waiting for all 3 beacons...` sans `X`, même si les trois balises sont reçues.
- Les échecs (balise trop faible, position aberrante) ne sont pas signalés : la carte garde simplement la dernière position.
- À chaque déplacement du `X`, l'ancienne position est gardée dans un tableau de 5 cases réutilisées en boucle : c'est la trace.
- La colonne d'un point vaut 1 + x / 10 et sa ligne est comptée à partir du bas ; un point hors du cadre est ramené contre son bord.

<EssayerExemple id="BLE/BleIndoorMap" />
