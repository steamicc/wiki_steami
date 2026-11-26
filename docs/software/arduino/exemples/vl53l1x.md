---
title: Exemples VL53L1X
sidebar_label: VL53L1X (distance)
---

import EssayerExemple from '@site/src/components/EssayerExemple';

# Exemples VL53L1X : capteur de distance

Le VL53L1X mesure la distance de ce qui se trouve devant lui par **temps de vol** (_time of flight_, ToF) : il envoie de brèves impulsions de lumière infrarouge invisible et chronomètre le temps qu'elles mettent à revenir après s'être réfléchies sur l'objet. La lumière parcourt 30 cm par nanoseconde : pour un objet à 15 cm, l'aller-retour dure une nanoseconde. Le capteur fait ce calcul lui-même et donne directement une distance en millimètres.

Sa portée va jusqu'à 4 m dans de bonnes conditions. Elle diminue avec un objet sombre ou en plein soleil (le soleil contient aussi de l'infrarouge), mais la distance mesurée dépend peu de la couleur de l'objet. Le capteur ne vise pas un point : il voit un cône d'environ 27°, et la distance donnée est celle de ce qui occupe ce cône. Ses caractéristiques, sa fiche technique et son schéma sont sur la page [Capteur de distance — VL53L1X](/docs/hardware/main-components/sensors/vl53l1x).

Le VL53L1X est monté sur les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)) : les cinq exemples de cette page marchent sur toutes les cartes. Il se trouve sur la face avant, sur le bord de la partie ronde, juste à droite de l'écran : c'est le petit boîtier à deux fenêtres marqué U11, l'une pour l'émetteur, l'autre pour le récepteur. À travers une webcam, on voit son émetteur infrarouge briller pendant les mesures, alors qu'il reste invisible à l'œil nu.

Ces exemples sont ceux de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → VL53L1X** de l'Arduino IDE. Ils écrivent leurs messages en anglais. Ils n'utilisent pas l'écran : il garde l'image laissée par le programme précédent, ce n'est pas une panne. La page [Capteurs et écran](../capteurs#distance--capteur-de-temps-de-vol) donne la façon la plus simple de lire la distance, avec la classe `SteamiDistance` ; ici, les exemples utilisent directement le driver du composant.

## Le driver en bref

Les cinq exemples suivent le même schéma et n'utilisent que quatre fonctions du driver `SteamiVL53L1X` :

- `SteamiVL53L1X sensor(Steami.wire());` crée le driver sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, où le capteur répond à l'adresse `0x29`.
- `begin()` redémarre le capteur, vérifie qu'il répond avec son identifiant (`0xEACC`), puis lui envoie la configuration par défaut fournie par STMicroelectronics : mode longue distance et toute la surface du récepteur. Cette configuration se termine par l'ordre de démarrer les mesures : après `begin()`, le capteur mesure déjà. Si le capteur ne répond pas, `begin()` renvoie `false` et les exemples écrivent `VL53L1X not detected` puis s'arrêtent.
- `startRanging()` demande des mesures en continu. Juste après `begin()`, il ne change rien, puisque le capteur mesure déjà : il rend ce démarrage explicite dans le programme, et sert surtout à relancer les mesures après un `stopRanging()`. Le capteur mesure ensuite tout seul, à son propre rythme : environ cinq mesures par seconde avec cette configuration.
- `dataReady()` demande au capteur si une nouvelle mesure est prête depuis la dernière lecture.
- `distanceMm()` lit la dernière mesure, en millimètres, puis l'acquitte : `dataReady()` reste faux jusqu'à la mesure suivante. Si aucune mesure n'est prête, la fonction relance d'abord les mesures, comme `startRanging()`, puis en attend une, jusqu'à une seconde environ, et renvoie `0` si rien n'arrive. Après un `stopRanging()`, un simple appel à `distanceMm()` remet donc le capteur en mesure.

Deux limites du driver comptent pour comprendre les exemples :

- Avec chaque distance, le capteur fournit un état de la mesure, qui dit si elle est valable. Le driver lit cet état avec la distance, mais n'en tient pas compte : quand rien n'est à portée, `distanceMm()` renvoie quand même un nombre, qui n'est pas fiable (comme `read()` de la classe `SteamiDistance`). Le driver ne renvoie lui-même `0` que lorsque son attente expire ; les exemples traitent tout `0` comme une absence de mesure.
- Le driver ne permet pas de changer le mode de distance, la durée de chaque mesure ni la partie du récepteur utilisée : il garde les réglages de la configuration par défaut.

Le capteur signale aussi chaque nouvelle mesure sur une ligne d'interruption reliée au microcontrôleur (`INT_DIST`, broche PB12). Le driver ne s'en sert pas : `dataReady()` lit l'état de cette ligne dans un registre du capteur, par le bus I²C.

## BasicDistance {#basicdistance}

**Ce que tu vas voir** : la console écrit `VL53L1X basic distance example`, puis la distance à chaque nouvelle mesure, environ cinq fois par seconde, par exemple `Distance: 182 mm`. Approche ta main du capteur puis éloigne-la : la valeur suit. Si rien n'est à portée, le nombre affiché n'a pas de sens.

```cpp file=.external/arduino-steami/examples/VL53L1X/BasicDistance/BasicDistance.ino

```

**Comment ça marche** : c'est le squelette des cinq exemples. Dans `setup()`, `begin()` vérifie et configure le capteur, qui mesure déjà, et `startRanging()` rend ce démarrage explicite. Dans `loop()`, le programme vient voir toutes les 50 ms si une mesure est prête, et ne la lit que dans ce cas.

Le capteur et le programme ont chacun leur rythme. Sans le test `dataReady()`, `distanceMm()` trouverait le plus souvent la mesure déjà lue : elle relancerait les mesures et attendrait la suivante, et le programme resterait bloqué dans cette attente au lieu de faire autre chose. Avec le test, chaque mesure est lue une seule fois, au premier tour de `loop()` qui suit son arrivée, et la console reçoit une ligne par mesure.

<EssayerExemple id="VL53L1X/BasicDistance" />

## ProximityAlarm {#proximityalarm}

**Ce que tu vas voir** : la console affiche les distances mesurées. Approche un doigt du capteur : quand la distance lue tombe à 30 mm ou moins, le buzzer sonne, et il se tait dès qu'elle remonte au-dessus.

```cpp file=.external/arduino-steami/examples/VL53L1X/ProximityAlarm/ProximityAlarm.ino

```

**Comment ça marche** : à chaque nouvelle mesure, le programme compare la distance à un seuil, `ALARM_THRESHOLD_MM` (sonne si `distance <= 30`), et décide en tout ou rien : son continu ou silence. `tone(SPEAKER, ALARM_TONE_HZ)`, sans durée, fait sonner le buzzer jusqu'au `noTone()` suivant (voir [Jouer un son](../premiers-programmes#jouer-un-son)).

Attention, ce seuil est très près du capteur : ST ne garantit ses mesures qu'à partir de 4 cm environ, et dans les tout premiers centimètres la distance lue peut être fausse, donc l'alarme peut ne pas sonner ou se couper.

La condition `distance > 0` traite `0` comme une absence de mesure, comme dans les autres exemples. Ici, `distanceMm()` n'est appelée qu'après `dataReady()` : l'attente du driver ne peut pas expirer, et la condition est une simple précaution. Un `0` lu à ce moment serait la distance brute donnée par le capteur, qui n'est pas fiable si près de lui.

<EssayerExemple id="VL53L1X/ProximityAlarm" />

## ParkingSensor {#parkingsensor}

**Ce que tu vas voir** : approche la main du capteur. Jusqu'à 20 cm, le buzzer bipe, de plus en plus vite à mesure que la main se rapproche, comme le radar de recul d'une voiture. Au-delà, il se tait. La console affiche chaque distance mesurée.

```cpp file=.external/arduino-steami/examples/VL53L1X/ParkingSensor/ParkingSensor.ino

```

**Comment ça marche** : là où ProximityAlarm décide en tout ou rien, ParkingSensor transforme la distance en rythme. `constrain()` ramène d'abord la distance entre 10 et 200 mm, puis `map()` la convertit en pause entre deux bips, proportionnellement : 10 ms à 10 mm, 700 ms à 200 mm, et par exemple 355 ms à mi-chemin.

Le programme ne s'arrête jamais avec `delay()` pour attendre le bip suivant. Il note l'heure du dernier bip avec `millis()` et, à chaque mesure, regarde si la pause est écoulée. `tone(SPEAKER, BEEP_TONE_HZ, BEEP_DURATION_MS)` joue un bip de 20 ms qui s'arrête tout seul, sans bloquer le programme : la lecture du capteur continue pendant le bip et pendant la pause.

Comme la décision de biper est prise à l'arrivée de chaque mesure, les bips ne peuvent pas être plus rapprochés que les mesures du capteur, environ 200 ms. En dessous de 6 cm environ, la pause calculée devient plus courte que cet intervalle, et le buzzer bipe alors à chaque mesure, environ cinq fois par seconde.

<EssayerExemple id="VL53L1X/ParkingSensor" />

## ObjectCounter {#objectcounter}

**Ce que tu vas voir** : pose la carte face à un mur ou à un meuble, à quelques dizaines de centimètres, et ne passe rien devant le capteur au démarrage, jusqu'à ce que la console affiche la distance du fond, par exemple `Background: 640 mm. Counting objects...` (quelques secondes). Passe ensuite la main, ou un objet, entre le capteur et le fond : chaque passage ajoute 1 au compteur, `Object detected! Count: 3`.

Si le fond est trop proche (5 cm ou moins) ou n'a pas pu être mesuré, l'exemple l'écrit et s'arrête : dégage le champ devant le capteur et appuie sur le bouton Reset de la carte.

```cpp file=.external/arduino-steami/examples/VL53L1X/ObjectCounter/ObjectCounter.ino

```

**Comment ça marche** : le programme ne cherche pas un objet à une distance fixe, mais quelque chose de plus proche que le fond. Il commence par une **calibration** : `measureBackground()` fait la moyenne de 20 mesures, en ignorant les `0`. Cette fonction appelle `distanceMm()` sans tester `dataReady()` : ici, c'est voulu, car quand aucune mesure n'est prête, `distanceMm()` relance les mesures puis attend elle-même la suivante. Le comptage s'adapte ainsi à la pièce : il marche aussi bien face à un mur proche que face à un meuble plus loin.

Un objet est compté quand la distance passe sous `fond - 50 mm`, et il n'est considéré comme reparti que quand elle remonte au-dessus de `fond - 30 mm`. Ces deux seuils différents forment une **hystérésis** : entre les deux, rien ne change. Avec un seul seuil, un objet tout juste à la limite ferait varier la mesure de quelques millimètres d'une lecture à l'autre, et serait compté plusieurs fois. La variable `objectPresent` fait que l'objet n'est compté qu'à son arrivée, pas à chaque mesure tant qu'il reste devant.

Comme le capteur voit un cône et non un fin faisceau, un objet peut être compté en passant sur le côté, sans couper l'axe du capteur : ce n'est pas une barrière lumineuse précise.

<EssayerExemple id="VL53L1X/ObjectCounter" />

## GestureDetection {#gesturedetection}

**Ce que tu vas voir** : passe la main devant le capteur, à moins de 15 cm, et retire-la aussitôt : la LED RGB s'allume en bleu et la console écrit `Wave: LED on`. Un deuxième passage l'éteint, `Wave: LED off`. Une main qui reste devant le capteur ne fait rien : il faut la retirer au-delà de 25 cm moins de 0,6 s après l'avoir approchée.

```cpp file=.external/arduino-steami/examples/VL53L1X/GestureDetection/GestureDetection.ino

```

**Comment ça marche** : le capteur ne reconnaît pas de geste, il ne donne qu'une distance. C'est le programme qui reconnaît le passage de la main dans la suite des distances, avec deux états : main proche (`handNear` vrai) ou non.

- Proche veut dire moins de 150 mm (`NEAR_MM`) sur deux mesures de suite (`NEAR_READINGS`) : une seule mesure aberrante ne déclenche rien.
- Loin veut dire plus de 250 mm (`FAR_MM`), ou une lecture à `0`, comptée comme une absence de mesure. De 150 à 250 mm, l'état ne change pas : c'est la même hystérésis que dans [ObjectCounter](#objectcounter).
- Le passage de proche à loin bascule la LED seulement s'il arrive au plus 600 ms (`WAVE_MAX_MS`) après la première mesure proche. Au-delà, la main est considérée comme posée devant le capteur, pas comme un geste.

À environ cinq mesures par seconde, les deux mesures proches et la mesure loin occupent déjà 0,4 s environ : la fenêtre de 600 ms laisse peu de marge, et un geste trop rapide passe entre deux mesures sans être vu. C'est pourquoi le programme lit chaque mesure dès qu'elle est prête : il n'attend 10 ms que quand aucune mesure n'est disponible. `LED_BLUE` est le canal bleu de la LED RGB (voir [Noms des broches](../premiers-programmes#noms-des-broches)).

<EssayerExemple id="VL53L1X/GestureDetection" />
