---
title: Exemples IMP34DT05
sidebar_label: IMP34DT05 (microphone)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore Dbfs dbfs sinc -->

# Exemples IMP34DT05 : microphone

L'IMP34DT05 est un microphone **MEMS** : une minuscule membrane de silicium vibre avec la pression de l'air, et un circuit placé dans le même boîtier transforme ce mouvement en signal numérique. Il n'envoie pas des nombres, mais un flot de bits, en **modulation de densité d'impulsions** (_pulse density modulation_, PDM) : le microcontrôleur lui fournit une horloge, et le microphone répond par un bit, 0 ou 1, à chaque période. Plus la pression est forte à un instant, plus les 1 sont nombreux dans le flot. Le driver de la bibliothèque STeaMi transforme ce flot en échantillons sonores ordinaires.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Le microphone est omnidirectionnel : il capte le son de toutes les directions. Ses caractéristiques, sa fiche technique et son schéma sont sur la page [Microphone — IMP34DT05](/docs/hardware/main-components/sensors/imp34dt05).

L'IMP34DT05 est monté sur les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)) : les quatre exemples de cette page marchent sur toutes les cartes.

Ces exemples sont ceux de la bibliothèque STeaMi, à partir de sa version 0.39.0. Dans l'Arduino IDE, ils sont rangés dans **Fichier → Exemples → STeaMi → IM34DT05**, sans le P : le dossier du driver a gardé ce nom pour des raisons historiques, mais l'en-tête, la classe et les constantes portent le vrai nom du composant (`SteamiIMP34DT05.h`, `SteamiIMP34DT05`, `IMP34DT05_…`). Les exemples écrivent leurs messages en anglais. Ils n'utilisent pas l'écran : il garde l'image laissée par le programme précédent, ce n'est pas une panne. La page [Capteurs et écran](../capteurs#microphone) donne un programme minimal avec le même driver.

## Le driver en bref

Le microphone n'a ni registre, ni adresse I²C, ni identifiant : il n'est pas sur le [bus I²C interne](../bibliotheques#le-bus-ic-interne), et le driver se crée sans argument, `SteamiIMP34DT05 mic;`. Tout passe par deux broches du STM32WB55 :

- `MIC_CLK` (broche PA3) porte l'horloge du microphone, à **1,28 MHz** ;
- `MIC_IN` (broche PA10) reçoit le flot de bits, un bit par période d'horloge : 1,28 million de bits par seconde.

Le STM32WB55 lit ce flot avec l'interface PDM de son périphérique audio **SAI1**, et un transfert DMA le range en mémoire sans occuper le processeur. Chaque milliseconde, une interruption convertit le dernier bloc de bits en **16 échantillons PCM** de 16 bits signés : un nombre de −32 768 à 32 767 par échantillon, 16 000 échantillons par seconde (16 kHz). La conversion enchaîne trois filtres, repris de la bibliothèque audio de STMicroelectronics :

1. un filtre **sinc3** fait la moyenne pondérée des bits et n'en garde qu'une valeur sur 8 ;
2. un filtre **sinc4** affine le résultat et n'en garde qu'une valeur sur 10. Il applique aussi le volume, un gain numérique : 5 par défaut, qui multiplie le signal par 10 (+20 dB) ;
3. un filtre passe-haut retire la composante continue, le décalage constant qui n'est pas du son.

Il faut donc 8 × 10 = 80 bits pour un échantillon : 1,28 MHz / 80 = 16 kHz. Échantillonné à 16 kHz, le son garde ses fréquences jusqu'à 8 kHz, la moitié de la fréquence d'échantillonnage : c'est assez pour la voix, un sifflement ou le buzzer de la carte.

Les quatre exemples n'utilisent que quelques fonctions du driver :

- `begin()` configure SAI1 et le DMA, démarre l'horloge et attend les premiers échantillons, en 50 ms environ. L'interface lit deux microphones par fil de données, un sur chaque front de l'horloge : `begin()` cherche lequel des deux porte celui de la carte. Si aucun flot de bits n'arrive, ou si la carte n'est pas une STeaMi, `begin()` renvoie `false` et les exemples écrivent `Microphone not detected - check that this is a STeaMi board.` puis s'arrêtent.
- `setLevelWindowMs(ms)` règle la durée de la **fenêtre** sur laquelle le driver mesure le niveau sonore, 100 ms par défaut : une fenêtre courte (10 ms) attrape un claquement de mains, une fenêtre longue (200 ms ou plus) donne un niveau plus stable.
- `levelReady()` indique qu'une fenêtre s'est terminée depuis la dernière lecture du niveau.
- `level()` renvoie les valeurs de la dernière fenêtre terminée, ensemble : `rms`, `peak`, `dbfs` et `dbSpl`. `levelDbfs()` n'en renvoie qu'une. Avant la fin de la première fenêtre, ces valeurs valent `NAN`.
- `dominantFrequencyHz()` enregistre 32 ms de son et renvoie sa fréquence la plus forte, en hertz.

Le niveau sonore se donne de trois façons :

- **RMS** (_root mean square_, valeur efficace) : la racine de la moyenne des carrés des échantillons de la fenêtre, de 0 à 32 768. Elle mesure l'énergie du son, quel que soit le signe des échantillons. `peak` est la plus grande valeur absolue d'un échantillon de la fenêtre.
- **dBFS** (décibels par rapport à la pleine échelle) : `20 × log10(rms × √2 / 32768)`. 0 dBFS correspond à la sinusoïde la plus forte que les échantillons peuvent coder ; chaque baisse de 20 dB divise l'amplitude par 10. Une pièce calme donne autour de −60 dBFS, et la valeur ne descend jamais sous −120 dBFS.
- **dB SPL** (niveau de pression acoustique, l'unité d'un sonomètre) : une **estimation**, calculée à partir de la sensibilité donnée par la fiche technique, −26 dBFS pour 94 dB SPL, et du volume. Au volume par défaut, elle vaut simplement le niveau en dBFS plus 100. Le microphone n'est pas étalonné : la sensibilité varie d'un exemplaire à l'autre, et un sonomètre pondère les fréquences comme l'oreille, ce que le driver ne fait pas. Pour corriger l'écart avec un vrai sonomètre, `setLevelOffset(dB)` ajoute une correction fixe.

Au volume par défaut, un son de 94 dB SPL donne environ −6 dBFS, et le signal converti sature au-delà de 100 dB SPL environ : un son très fort tout près du microphone, comme le buzzer de la carte ou un claquement de mains à quelques centimètres, atteint le maximum des échantillons.

La conversion a un coût : elle tourne dans l'interruption, chaque milliseconde, tant que le microphone est en marche. Mesurée sur une V1c, elle prend **16,8 % du processeur** à 32 MHz, la fréquence du STM32WB55 sur la STeaMi. L'interruption a la priorité la plus basse : `tone()`, `Serial` et `Wire` passent avant elle. Un programme qui fait un gros travail en même temps, comme dessiner sur l'écran, est donc un peu ralenti, et un programme qui bloque les interruptions plus d'une milliseconde perd du son. Le driver occupe aussi SAI1 et le canal 1 du DMA1 : une autre bibliothèque qui s'en sert ne peut pas fonctionner en même temps que le microphone.

## SoundLevel {#soundlevel}

**Ce qu'on observe** : la console écrit `Microphone ready. RMS, dBFS, estimated dB SPL:`, puis une ligne cinq fois par seconde : la valeur efficace, le niveau en dBFS, le niveau estimé en dB SPL et une barre de 40 caractères qui suit le niveau. Dans une pièce ordinaire, le niveau reste par exemple entre −38 et −46 dBFS, et une ligne ressemble à ceci (les tabulations sont rendues par des espaces) :

```text
RMS 265 -38.8 dBFS      ~61 dB SPL      |#####################                   |
```

Parler, siffler ou claquer des mains près de la carte : la barre s'allonge, puis se raccourcit dès que le silence revient.

```cpp file=.external/arduino-steami/examples/IM34DT05/SoundLevel/SoundLevel.ino

```

**Comment ça marche** : `setLevelWindowMs(200)` règle la fenêtre de mesure à 200 ms : le driver termine une fenêtre cinq fois par seconde. `loop()` ne fait rien tant que `levelReady()` est faux ; dès qu'une fenêtre est terminée, `level()` donne ses quatre valeurs d'un coup, toutes calculées sur les mêmes échantillons, et remet `levelReady()` à faux jusqu'à la fenêtre suivante. Chaque fenêtre est ainsi écrite une seule fois. Le programme n'a jamais à lire les échantillons lui-même : l'interruption fait le calcul au fil de la conversion.

Les trois valeurs de la ligne se déduisent l'une de l'autre. Avec une valeur efficace de 265, le niveau vaut `20 × log10(265 × 1,414 / 32768)`, soit −38,8 dBFS, et l'estimation en dB SPL vaut −38,8 + 100, soit 61 dB SPL environ, le niveau d'une conversation.

`printBar()` place le niveau sur une échelle de −80 dBFS (barre vide) à 0 dBFS (barre pleine) : à −38,8 dBFS, la barre est remplie à un peu plus de la moitié, 21 caractères sur 40. Comme l'échelle est en décibels, la barre gagne 3 caractères chaque fois que l'amplitude du son double (+6 dB).

<EssayerExemple id="IM34DT05/SoundLevel" />

## ClapDetector {#clapdetector}

**Ce qu'on observe** : la console écrit `Clap your hands near the board.` Chaque claquement de mains près de la carte allume ou éteint la LED RGB en bleu, et la console écrit le numéro du claquement, la valeur du plus fort échantillon (`peak`) et le bruit de fond mesuré juste avant (`background RMS`), sous la forme `Clap #1  peak …  background RMS …`. Une voix ou un bruit continu, même fort, ne déclenche rien ; un claquement de doigts tout près ou un coup sur la table peut compter aussi.

```cpp file=.external/arduino-steami/examples/IM34DT05/ClapDetector/ClapDetector.ino

```

**Comment ça marche** : un claquement de mains est un son très bref et très fort : il dure quelques millisecondes. Pour ne pas le diluer dans une moyenne, le programme règle la fenêtre de mesure à 10 ms, et regarde le plus fort échantillon de chaque fenêtre, `peak`, plutôt que sa valeur efficace. Une fenêtre compte comme un claquement à deux conditions :

- **fort** : `peak` atteint au moins 8000 (`PEAK_MIN`), un quart environ de la valeur maximale d'un échantillon ;
- **soudain** : `peak` atteint au moins 8 fois le bruit de fond (`PEAK_RATIO`). Un son qui dure, comme une voix, fait monter le bruit de fond avec lui, et ne passe pas ce test.

Le bruit de fond, `background`, est une moyenne lente de la valeur efficace des fenêtres : à chaque fenêtre sans claquement, il ne fait que 2 % (`BACKGROUND_SMOOTHING`) du chemin vers la nouvelle valeur. Il suit ainsi les changements du bruit de la pièce en une demi-seconde environ (50 fenêtres de 10 ms), sans être emporté par un claquement isolé.

Après un claquement, le programme ignore le son pendant 300 ms (`HOLD_OFF_MS`) : l'écho du claquement sur les murs, et sa fin, ne comptent pas une deuxième fois. Si la pièce est bruyante ou si les claquements sont trop loin, ajuster `PEAK_MIN` et `PEAK_RATIO`. `LED_BLUE` est le canal bleu de la LED RGB (voir [Noms des broches](../premiers-programmes#noms-des-broches)).

<EssayerExemple id="IM34DT05/ClapDetector" />

## FrequencyMeter {#frequencymeter}

**Ce qu'on observe** : la console écrit `Make a sound: whistle, sing or play a note.`, puis trois ou quatre lignes par seconde. Quand un son assez fort arrive, une ligne donne sa fréquence dominante, la note la plus proche, l'écart avec cette note et le niveau, comme un accordeur. Pour un son de 440 Hz, le la du diapason, la ligne commence par `440.0 Hz  A4 +0 cents` ; pour un son de 3000 Hz, par `3000.0 Hz  F#7 +23 cents`. Sous −50 dBFS, la ligne est `(too quiet)`. Siffler, chanter une note, ou en jouer une avec un instrument ou une application de téléphone, près de la carte.

```cpp file=.external/arduino-steami/examples/IM34DT05/FrequencyMeter/FrequencyMeter.ino

```

**Comment ça marche** : `dominantFrequencyHz()` enregistre 512 échantillons, soit 32 ms de son, puis cherche la fréquence la plus forte avec une **transformée de Fourier rapide** (FFT). La FFT décompose le son en une somme de sinusoïdes et donne l'intensité de chacune, par pas de 16 000 / 512 = 31,25 Hz. Avant le calcul, une fenêtre de Hann adoucit le début et la fin de l'enregistrement, pour que la coupure ne crée pas de fausses fréquences ; après, le driver interpole autour du pic le plus fort, ce qui donne la fréquence à 1 Hz près environ. La fonction bloque le programme pendant 35 ms environ.

`levelDbfs()` donne ensuite le niveau de la dernière fenêtre de 50 ms (`setLevelWindowMs(50)`), presque le même moment que l'enregistrement. En dessous de −50 dBFS (`SILENCE_DBFS`), la fréquence « la plus forte » n'est que celle du bruit, et le programme écrit `(too quiet)`. Dans une pièce bruyante (ventilation, conversations), le bruit de fond peut dépasser ce seuil : la fréquence affichée saute alors d'une ligne à l'autre sans signification.

`printNote()` convertit la fréquence en note de la gamme tempérée : le numéro MIDI `69 + 12 × log2(f / 440)` compte les demi-tons depuis le la à 440 Hz (numéro 69). Le numéro entier le plus proche donne le nom de la note et son octave (`A4` pour le la du diapason, `C4` pour le do du milieu du piano) ; l'écart restant, multiplié par 100, donne l'écart en **cents**, le centième de demi-ton. Un écart de quelques cents ne s'entend presque pas.

Pour essayer avec le buzzer de la carte, rester entre 2000 et 4000 Hz : en dessous, l'appareil affiche une harmonique du son plutôt que le son lui-même (voir [BuzzerSelfTest](#buzzerselftest)). Un instrument, une voix ou une application de téléphone n'ont pas ce défaut.

<EssayerExemple id="IM34DT05/FrequencyMeter" />

## BuzzerSelfTest {#buzzerselftest}

**Ce qu'on observe** : la carte s'écoute elle-même. La console écrit le niveau du bruit de fond (`Background level:`), puis le buzzer joue cinq sons, de 2000 à 4000 Hz, et pour chacun la console écrit la fréquence jouée, la fréquence entendue par le microphone, le niveau et le verdict. Sur une V1c, par exemple :

```text
Played 2500 Hz, heard 2499.0 Hz (1 dBFS): PASS
…
Result: 5/5 tones recognised - SELF-TEST PASSED
```

Le test se joue une seule fois, au démarrage : appuyer sur le bouton Reset de la carte pour le relancer.

```cpp file=.external/arduino-steami/examples/IM34DT05/BuzzerSelfTest/BuzzerSelfTest.ino

```

**Comment ça marche** : pour chaque fréquence, `tone(BUZZER_PIN, played)` fait sonner le buzzer (voir [Jouer un son](../premiers-programmes#jouer-un-son)), le programme attend 100 ms que le son et les filtres se stabilisent, puis mesure trois fois la fréquence dominante avec `dominantFrequencyHz()`. `median3()` garde la valeur du milieu des trois : une mesure aberrante est écartée. Le son passe le test si la fréquence entendue est à moins de 2 % de la fréquence jouée (`TOLERANCE`). Ce test vérifie d'un coup que le buzzer et le microphone fonctionnent, et que la conversion du flot de bits donne la bonne fréquence.

La marge de 2 % vient de l'horloge : celle du microphone est tirée d'un oscillateur interne du STM32WB55, précis à 1 % environ. Dans les faits, la mesure est bien meilleure : sur une V1c, de 2 à 4 kHz, l'écart reste sous 0,1 %, comme les 2499,0 Hz entendus pour 2500 Hz joués.

Le niveau de 1 dBFS, au-dessus de 0 dBFS, montre que le buzzer, collé au microphone, sature le signal au volume par défaut : les échantillons atteignent leur maximum. Un signal écrêté, presque carré, a une valeur efficace plus grande que la sinusoïde qui sert de référence à 0 dBFS, d'où une valeur positive. La fréquence reste juste : l'écrêtage déforme l'onde sans changer sa période.

Pourquoi pas de son sous 2000 Hz ? Le buzzer est un petit piézo, qui **résonne** vers 3 kHz : il y vibre beaucoup plus fort qu'aux autres fréquences. `tone()` le commande avec un signal carré, qui contient, en plus de la fréquence jouée, ses multiples impairs (les **harmoniques** 3, 5…), et le piézo ajoute lui-même les multiples pairs. Pour un son grave, l'harmonique qui tombe près de 3 kHz sort plus fort que le son lui-même, et c'est elle que le microphone entend le plus. Sur une V1c, 1000 Hz est entendu à 3000 Hz (harmonique 3) et 1500 Hz à 3000 Hz (harmonique 2). Si une fréquence entendue est un multiple de la fréquence jouée, le programme l'indique, par exemple `FAIL (harmonic x2)`.

<EssayerExemple id="IM34DT05/BuzzerSelfTest" />
