---
title: Sujets avancés
sidebar_position: 7.5
---

import ReleaseTabs, { Release } from '@site/src/components/ReleaseTabs';
import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore asyncio aioble onewire bytearray readinto readfrom memoryview deinit etat blit lightsleep deepsleep powerctrl delai -->

# Sujets avancés

Cette page rassemble ce qui sert quand un programme MicroPython grossit : la mémoire vive (RAM) disponible et le code gelé dans le firmware, les timers et les interruptions, le code natif pour aller plus vite, la mise en veille, l'horloge temps réel, le chien de garde et `asyncio`.

Tout ce qui est décrit ici a été vérifié dans le code du firmware de la carte : le fork [steamicc/micropython-steami](https://github.com/steamicc/micropython-steami/tree/stm32-steami-rev1d-final) (branche `stm32-steami-rev1d-final`, carte `STEAM32_WB55RG`, MicroPython 1.29) et la bibliothèque [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) qui y est gelée. Les chiffres valent pour la release v0.38.5 du firmware. Le firmware est le même sur les V1a, V1b et V1c : les programmes de cette page tournent sur les trois, sauf mention contraire.

Les programmes marqués d'un bouton **Essayer sur la carte** se lancent depuis la page (voir [Essayer sur la carte](./essayer)). Les autres, qui redémarrent la carte ou ne s'arrêtent pas d'eux-mêmes, sont à enregistrer sur la carte avec [Thonny](./thonny) ou [mpremote](./mpremote).

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Mémoire

### Ce que contient la RAM

Le STM32WB55RG a 256 Ko de SRAM, en trois blocs : SRAM1 (192 Ko), SRAM2a et SRAM2b (32 Ko chacun). Le cœur radio (Cortex-M0+) se sert de SRAM2 : MicroPython n'y place que les tampons d'échange avec lui, 10 Ko dans chaque bloc. Tout le reste du programme vit dans SRAM1, découpée ainsi par le [script d'édition de liens](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/stm32wb55xg_steami.ld) de la carte :

| Zone de SRAM1                                    | Taille (v0.38.5) |
| ------------------------------------------------ | ---------------- |
| Données du firmware (code C), au début de la RAM | 17 104 octets    |
| Tas de MicroPython                               | 159 016 octets   |
| Pile                                             | 16 384 octets    |
| Cache du système de fichiers, à la fin de la RAM | 4 096 octets     |
| Réserve au-dessus de la pile                     | 8 octets         |
| **Total**                                        | 196 608 octets   |

Le tas reçoit tous les objets Python : variables, listes, chaînes, modules importés, tampons de l'écran. Le ramasse-miettes y garde ses propres tables : il reste **155 328 octets** pour les objets. Ce chiffre est la somme `gc.mem_free() + gc.mem_alloc()` : il est calculé à partir du firmware de la release v0.38.5 (adresses de fin des variables et de la pile lues dans le binaire, puis découpage du tas fait par `gc_init()`). Le même calcul donne la même valeur pour la v0.28.0.

Une partie du tas est déjà prise au démarrage, puis chaque import et chaque objet en prend un peu plus. Sur une V1c, avec le firmware de la v0.28.0, la [PR #447](https://github.com/steamicc/micropython-steami-lib/pull/447) de micropython-steami-lib a mesuré ces valeurs de `gc.mem_free()`, après `gc.collect()` :

| Situation                                                      | Octets libres   |
| -------------------------------------------------------------- | --------------- |
| Avant tout import                                              | 153 920         |
| Après `from steami import Temperature` et une lecture          | 130 672         |
| Les 13 classes de `steami` importées                           | 121 984         |
| Exemple Bluetooth `ble/beacon` en marche, lisant `Temperature` | environ 102 750 |

La [PR #454](https://github.com/steamicc/micropython-steami-lib/pull/454) a mesuré 91 808 octets libres avec ce même exemple Bluetooth en marche et l'écran de la V1c démarré : l'écran et le Bluetooth tiennent ensemble.

### Mesurer la mémoire libre

Le module `gc` donne l'état du tas :

- `gc.collect()` lance le ramasse-miettes : il libère les objets que plus rien n'utilise. L'appeler juste avant une mesure, sinon `gc.mem_free()` compte encore ces objets comme occupés ;
- `gc.mem_free()` donne le nombre d'octets libres du tas, `gc.mem_alloc()` le nombre d'octets occupés ;
- `micropython.mem_info()` affiche un résumé : pile utilisée, tas occupé et libre, plus grand bloc libre d'un seul tenant.

```python run
import gc

import micropython

gc.collect()
print("Tas pour les objets :", gc.mem_free() + gc.mem_alloc(), "octets")
print("Libre au départ :", gc.mem_free(), "octets")

from steami import Temperature  # noqa: E402

temperature = Temperature()
print("Température :", temperature.read(), "°C")
gc.collect()
print("Libre après Temperature :", gc.mem_free(), "octets")

micropython.mem_info()
```

La première ligne affiche 155 328 octets avec le firmware v0.38.5. Les octets libres dépendent de ce que la carte a déjà chargé : mesurer au début du programme, puis après chaque import, pour voir ce que coûte chacun.

Un tas plein donne l'erreur `MemoryError: memory allocation failed, allocating N bytes`. Elle peut arriver alors que `gc.mem_free()` annonce plus que `N` octets libres : un objet a besoin d'un bloc d'un seul tenant, et un tas morcelé par beaucoup de petits objets n'en a plus d'assez grand. `micropython.mem_info()` donne la taille du plus grand bloc libre (`max free sz`, comptée en blocs de 16 octets).

### Le code gelé dans le firmware

Les drivers de la carte et le paquet `steami` sont **gelés** dans le firmware : compilés en bytecode au moment de la construction du firmware et rangés dans la mémoire flash. Le [manifeste de la carte](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/manifest.py) gèle :

- les 16 paquets de micropython-steami-lib, dont `steami`, `steami_screen`, `ssd1327`, `gc9a01` et les drivers des capteurs (la liste est dans le [tableau des drivers](/docs/software/micropython#drivers-disponibles) ; `im34dt05` n'en fait pas partie) ;
- `asyncio` et `aioble` (Bluetooth), et les modules `time`, `dht` et `onewire` de micropython-lib.

Importer un module gelé ne coûte que les objets qu'il crée (fonctions, classes, constantes) : son bytecode reste dans la flash. Un fichier `.py` copié sur la carte, au contraire, est compilé dans la RAM à chaque import, et le compilateur a lui-même besoin de mémoire pendant ce temps. C'est ce qui arrivait dans le problème [#175](https://github.com/steamicc/micropython-steami-lib/issues/175) de micropython-steami-lib : les drivers étaient alors lus depuis l'ordinateur (`mpremote mount`) et compilés dans la RAM de la carte, et l'import de `lis2mdl`, après cinq autres drivers, échouait avec une `MemoryError`. Gelés, ils ne passent plus par cette compilation.

Les modules gelés sont compilés avec l'option `-O3` de `mpy-cross` ([mpconfigboard.mk](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/mpconfigboard.mk)) : leurs `assert` sont retirés. La zone de la flash réservée au firmware fait 528 Ko ; le système de fichiers de la carte (`/flash`) a 256 Ko.

L'ordre de recherche des modules est `sys.path` : `['', '.frozen', '/flash', '/flash/lib']`, où `''` désigne le dossier courant, `/flash` au démarrage. Un fichier `steami_screen.py` posé à la racine de `/flash` passe donc **avant** la version gelée, ce qui permet d'essayer une version modifiée d'un driver ; dans `/flash/lib`, il serait ignoré, car la version gelée est trouvée d'abord. Pour revenir à la version gelée, supprimer le fichier.

Pour un gros programme personnel, deux moyens d'économiser la RAM de compilation :

- le précompiler en `.mpy` sur l'ordinateur avec `mpy-cross`, dans la même version que le firmware (MicroPython 1.29), puis copier le `.mpy` sur la carte à la place du `.py` : l'import charge le bytecode sans compiler ;
- le geler dans un firmware personnel : ajouter le module au manifeste, puis reconstruire le firmware avec la cible `make micropython-firmware` du dépôt [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib/blob/main/Makefile).

### Économiser la mémoire

- **N'importer que ce qui sert.** Le paquet `steami` charge ses modules à la demande : `from steami import Temperature` ne charge que la carte, les constantes et la température, avec le driver du capteur de la carte. `from steami import *` n'importe rien : nommer les classes voulues.
- **Réserver les gros tampons en premier.** L'image de l'écran est le plus gros objet d'un programme courant, et il lui faut un bloc d'un seul tenant. `steami.Screen()` ne réserve rien ; `begin()`, ou le premier dessin, réserve l'image. Appeler `screen.begin()` au tout début du programme, avant que le tas ne se morcelle. Si l'image ne trouve pas sa place, le message d'erreur E31 s'affiche sur la console et les dessins ne font rien.
- **Réutiliser les tampons.** Créer un `bytearray` une fois, puis le remplir avec les méthodes `readinto()` (SPI, UART, fichiers) ou `readfrom_mem_into()` (I²C) au lieu de créer un nouvel objet à chaque lecture ; découper un tampon avec `memoryview(tampon)[a:b]` plutôt qu'avec `tampon[a:b]`, qui copie.
- **Éviter les objets créés en boucle.** Une concaténation de chaînes ou une f-string crée une nouvelle chaîne ; un nombre à virgule (`float`) est lui aussi un objet du tas, créé à chaque calcul.
- **Nommer les constantes avec `const()`.** `_SEUIL = const(100)`, avec un nom qui commence par `_`, est remplacé par sa valeur à la compilation et ne prend pas de place dans le module.
- **Lancer `gc.collect()` avant une grosse allocation**, pour lui laisser la plus grande place possible.

La taille de l'image de l'écran dépend de la release :

<ReleaseTabs>
<Release releases="v1a v1b">

Écran SSD1327 de 128 × 128 pixels, 16 niveaux de gris : l'image fait **8 192 octets** (deux pixels par octet). Voir le [README de ssd1327](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/ssd1327/README.md).

</Release>
<Release releases="v1c">

Écran GC9A01 de 240 × 240 pixels : l'image fait **28 800 octets**, avec 16 couleurs (deux pixels par octet). Le driver y ajoute une bande de conversion de 7 680 octets, réservée en même temps. Une image en couleurs complètes (RGB565) ferait 115 200 octets et ne tiendrait pas à côté du Bluetooth. Voir la section Memory du [README de gc9a01](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/gc9a01/README.md#memory).

</Release>
</ReleaseTabs>

```python run
import gc

from steami import Screen

screen = Screen()
screen.begin()  # réserve l'image de l'écran avant le reste du programme
gc.collect()
print("Écran :", screen.chip(), screen.width, "x", screen.height)
print("État :", screen.error() or "OK")
print("Libre après l'écran :", gc.mem_free(), "octets")
```

## Timers et interruptions

Un timer appelle une fonction à intervalle régulier ; une interruption de broche l'appelle quand le niveau d'une broche change. Dans les deux cas, la fonction appelée, le **callback**, interrompt le programme principal : elle suit des règles particulières (voir [Les règles des callbacks](#les-règles-des-callbacks)).

### `machine.Timer`

Sur la carte, `machine.Timer` est un timer logiciel ([machine_timer.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/extmod/machine_timer.c)), cadencé par l'interruption système de 1 ms :

- `Timer(period=250, callback=f)` appelle `f(timer)` toutes les 250 ms (`mode=Timer.PERIODIC`, par défaut) ; `mode=Timer.ONE_SHOT` l'appelle une seule fois ; `freq=4` donne la fréquence en hertz au lieu de la période ;
- la résolution est la milliseconde : une période plus courte est ramenée à 1 ms ;
- le seul identifiant accepté est `-1`, celui par défaut : `Timer(0)` lève `ValueError` ;
- `timer.deinit()` arrête le timer ; `timer.init(...)` le relance avec d'autres réglages ;
- `hard=False` (par défaut) : le callback est mis en file d'attente puis exécuté par l'interpréteur ; `hard=True` : il est exécuté dans l'interruption elle-même.

```python run
from time import sleep

from machine import Pin, Timer

led = Pin("LED_GREEN", Pin.OUT)
appels = 0


def clignoter(timer):
    global appels
    appels += 1
    led.value(not led.value())


timer = Timer(period=250, callback=clignoter)
try:
    sleep(3)  # le programme principal attend, le timer fait clignoter la LED
finally:
    timer.deinit()
    led.off()
print("Appels du callback :", appels)
```

La LED verte clignote pendant 3 secondes, puis le programme affiche le nombre d'appels, environ 12. Le bloc `try` … `finally` arrête le timer même si le programme est interrompu par Ctrl-C : sans lui, un timer continue de tourner après un Ctrl-C, jusqu'au redémarrage logiciel suivant (Ctrl-D, ou **Arrêter** sur le wiki).

Les timers matériels du microcontrôleur servent à d'autres usages : le buzzer de la carte, par exemple, est piloté en PWM par le timer 1 (voir [buzzer.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/steami/buzzer.py)).

### `Pin.irq` : interruption sur une broche

`Pin.irq(handler, trigger, hard=False)` appelle `handler(pin)` à chaque front de la broche : `Pin.IRQ_FALLING` (passage à 0), `Pin.IRQ_RISING` (passage à 1), ou les deux, par défaut. Les boutons A, B et Menu sont reliés directement au microcontrôleur (voir [Boutons](/docs/hardware/pin-mapping/buttons)), avec les mêmes broches sur les trois releases ; ils sont actifs à l'état bas : l'appui donne un front descendant.

```python run
from time import sleep

from machine import Pin

bouton_a = Pin("A_BUTTON", Pin.IN, Pin.PULL_UP)
fronts = 0


def appui(pin):
    global fronts
    fronts += 1


bouton_a.irq(appui, Pin.IRQ_FALLING)
print("Appuyer sur A pendant 10 secondes")
try:
    sleep(10)
finally:
    bouton_a.irq(None)  # retire l'interruption
print("Fronts descendants :", fronts)
```

Un appui peut compter plusieurs fois : le contact du bouton rebondit pendant quelques millisecondes et chaque rebond est un front. Pour compter les appuis, ignorer les fronts qui suivent le précédent de moins de 20 ms environ (`time.ticks_ms()` et `time.ticks_diff()`).

Les interruptions de broche passent par les lignes EXTI du microcontrôleur : une ligne par **numéro** de broche, partagée entre les ports. Deux broches de même numéro ne peuvent pas avoir chacune une interruption : la seconde lève `OSError` (`IRQ resource already taken by Pin(...)`). Sur la carte, cela concerne :

| Ligne | Broches                                                               |
| ----- | --------------------------------------------------------------------- |
| 0     | `MENU_BUTTON` (PA0) et `INT_EXPANDER` (PB0, interruption des flèches) |
| 7     | `A_BUTTON` (PA7), qui est aussi la broche `P5` du connecteur          |
| 8     | `B_BUTTON` (PA8), qui est aussi la broche `P11` du connecteur         |

Les flèches ne sont pas reliées au microcontrôleur : elles passent par l'expandeur MCP23009E, qui signale un changement sur `INT_EXPANDER` (voir le [driver mcp23009e](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e)). Une interruption sur cette broche prend donc la ligne 0, celle du bouton Menu.

### Les règles des callbacks

Un callback **logiciel** (`hard=False`, le réglage par défaut) n'est pas exécuté dans l'interruption : celle-ci le met dans une file d'attente, et l'interpréteur l'exécute entre deux instructions Python du programme principal. Il peut donc créer des objets, afficher avec `print()`, utiliser le bus I²C. En contrepartie :

- il peut être retardé, le temps que l'instruction en cours se termine (une écriture longue sur l'écran, par exemple) ;
- la file a 8 places : si elle est pleine, l'appel est perdu ;
- une exception levée par le callback est affichée sur la console, et le timer ou l'interruption continue ;
- `deinit()` ne retire pas un appel déjà mis dans la file : il sera quand même exécuté. Le buzzer de `steami` en tient compte : la fonction qui coupe un son vérifie qu'elle correspond bien au son en cours, pour qu'un arrêt en retard ne coupe pas un son plus récent ([buzzer.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/steami/buzzer.py), PR [#506](https://github.com/steamicc/micropython-steami-lib/pull/506)).

Un callback **matériel** (`hard=True`) est exécuté dans l'interruption, sans délai. Le firmware y verrouille le ramasse-miettes ([extint.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/extint.c), [mpirq.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/shared/runtime/mpirq.c)) :

- **aucune création d'objet** : pas de liste qui grandit, pas de chaîne construite, pas de calcul avec des `float`, pas de `print()` d'une valeur calculée. Écrire dans une variable globale ou dans une case d'un tableau créé à l'avance, avec des entiers ;
- rester court : le programme principal est arrêté pendant ce temps ;
- une exception **désactive** le callback : l'interruption de broche n'est plus appelée, un timer périodique s'arrête. Pour voir le détail de l'erreur, réserver d'abord un tampon avec `micropython.alloc_emergency_exception_buf(100)` ;
- pour faire le reste du travail hors de l'interruption, le confier à `micropython.schedule(fonction, argument)` : `fonction(argument)` est exécutée ensuite comme un callback logiciel. Si la file est pleine, `schedule()` lève `RuntimeError`, ce qui désactive aussi le callback.

```python run
from time import sleep, ticks_ms

import micropython
from machine import Pin

micropython.alloc_emergency_exception_buf(100)

bouton_b = Pin("B_BUTTON", Pin.IN, Pin.PULL_UP)
appuis = 0


def signaler(instant):
    # Exécutée hors de l'interruption : print() et calculs sont permis.
    print("B pressé à", instant, "ms, appui n°", appuis)


def appui(pin):
    # Callback matériel : un entier, pas d'objet créé.
    global appuis
    appuis += 1
    micropython.schedule(signaler, ticks_ms())


bouton_b.irq(appui, Pin.IRQ_FALLING, hard=True)
print("Appuyer sur B pendant 10 secondes")
try:
    sleep(10)
finally:
    bouton_b.irq(None)
```

Une variable partagée entre un callback matériel et le programme principal peut changer entre deux lectures. Pour lire ou modifier plusieurs valeurs ensemble sans être interrompu, encadrer l'accès par `etat = machine.disable_irq()` et `machine.enable_irq(etat)`, le plus brièvement possible.

## Aller plus vite : `native` et `viper`

L'interpréteur exécute le bytecode instruction par instruction. Le firmware de la carte sait aussi compiler une fonction en code machine ARM (Thumb-2) au moment où elle est définie, avec un décorateur :

- `@micropython.native` : la même fonction Python, compilée en code machine. Tout le langage reste permis ; le gain vient de la suppression de la boucle de l'interpréteur ;
- `@micropython.viper` : un code machine plus direct, pour les calculs sur des entiers et les tampons. Les variables entières sont des mots machine de 32 bits, et les annotations `ptr8`, `ptr16` et `ptr32` donnent un accès direct aux octets ou aux mots d'un `bytearray` ;
- `@micropython.asm_thumb` existe aussi, pour écrire une fonction directement en assembleur.

```python run
import time

import micropython


def somme(n):
    total = 0
    for i in range(n):
        total += i
    return total


@micropython.native
def somme_native(n):
    total = 0
    for i in range(n):
        total += i
    return total


@micropython.viper
def somme_viper(n: int) -> int:
    total = 0
    for i in range(n):
        total += i
    return total


for nom, fonction in (("bytecode", somme), ("native", somme_native), ("viper", somme_viper)):
    debut = time.ticks_us()
    resultat = fonction(10000)
    duree = time.ticks_diff(time.ticks_us(), debut)
    print(nom, ":", resultat, "en", duree, "µs")

# Les entiers de viper font 32 bits : au-delà, le calcul déborde.
print("somme(100000) :", somme(100000))
print("somme_viper(100000) :", somme_viper(100000))
```

Les trois fonctions donnent 49 995 000 pour `n = 10000` ; les durées s'affichent sur la console. Pour `n = 100000`, la somme (4 999 950 000) dépasse ce que tient un entier de 32 bits : `somme_viper()` renvoie un résultat faux, alors que `somme()` donne le bon.

Le driver de l'écran de la V1c utilise `viper` pour convertir son image en couleurs : la fonction `_to_rgb565()` de [gc9a01/device.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/gc9a01/gc9a01/device.py). Mesurée sur une V1c, la conversion d'une bande de 16 lignes prend 3,6 ms en `viper`, contre 7,1 ms avec la méthode `FrameBuffer.blit()` qu'elle a remplacée (voir le [README de gc9a01](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/gc9a01/README.md#memory)).

À garder en tête :

- le code machine occupe plus de place en RAM que le bytecode : réserver `native` et `viper` aux quelques fonctions qui tournent le plus souvent ;
- en `viper`, un entier sort de la plage de 32 bits sans erreur (il déborde), et un accès par pointeur hors du tampon n'est pas vérifié : il lit ou écrit à côté ;
- la vitesse dépend surtout de ce que fait la boucle : mesurer avant et après avec `time.ticks_us()`, comme ci-dessus. Le microcontrôleur tourne à 64 MHz : `machine.freq()` donne les fréquences de ses horloges.

## Économie d'énergie

Le firmware offre trois niveaux d'attente, du plus léger au plus profond :

| Fonction                 | Ce qui s'arrête                                  | Ce qui réveille                                                               | Après le réveil                           |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------- |
| `machine.idle()`         | Le processeur, jusqu'à la prochaine interruption | N'importe quelle interruption, dont celle de 1 ms du système                  | Le programme continue                     |
| `machine.lightsleep(ms)` | Les horloges du microcontrôleur (mode Stop)      | La fin du délai `ms` (horloge RTC), ou une interruption de broche (`Pin.irq`) | Le programme continue, RAM conservée      |
| `machine.deepsleep(ms)`  | Presque tout le microcontrôleur (mode Standby)   | La fin du délai `ms` (horloge RTC), ou le bouton Reset                        | La carte redémarre : `boot.py`, `main.py` |

Sans argument, `lightsleep()` et `deepsleep()` n'ont pas de délai : sans autre réglage de l'horloge RTC, seule une interruption de broche réveille `lightsleep()`, et seul le bouton Reset réveille `deepsleep()`.

Seul le microcontrôleur STM32WB55 s'endort : l'écran, les capteurs et le DAPLink restent alimentés. Pour économiser vraiment, éteindre aussi ce qui peut l'être, par exemple avec la méthode `power_off()` des drivers de capteurs (voir les [conventions des drivers](./conventions)). Le wiki ne donne pas de consommation mesurée dans ces modes.

### `lightsleep` : veille légère

Pendant `lightsleep()`, la RAM est conservée et le programme reprend à la ligne suivante. Le code du firmware ([powerctrl.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/powerctrl.c)) entraîne ces effets :

- l'interruption système de 1 ms est coupée : les `machine.Timer` ne se déclenchent pas, et `time.ticks_ms()` n'avance pas pendant la veille. Pour mesurer la durée de la veille, lire l'horloge RTC avant et après ;
- la liaison série de la console ne réveille pas la carte : un Ctrl-C, ou **Arrêter** sur le wiki, n'agit qu'au réveil. Toujours donner un délai à `lightsleep()` pendant la mise au point ;
- une interruption de broche réveille la carte : le bouton Menu (PA0, ligne EXTI 0) a été câblé pour cela.

```python run
from machine import RTC, Pin, lightsleep

menu = Pin("MENU_BUTTON", Pin.IN, Pin.PULL_UP)
reveil = [False]  # créé à l'avance : le callback matériel n'alloue rien


def appui(pin):
    reveil[0] = True


def secondes(dt):
    # dt = (année, mois, jour, jour de la semaine, h, min, s, µs)
    return dt[4] * 3600 + dt[5] * 60 + dt[6] + dt[7] / 1_000_000


menu.irq(appui, Pin.IRQ_FALLING, hard=True)
rtc = RTC()
print("Veille de 10 s, ou jusqu'à un appui sur Menu")
avant = rtc.datetime()
lightsleep(10_000)
apres = rtc.datetime()
menu.irq(None)

print("Réveil par", "le bouton Menu" if reveil[0] else "la fin du délai")
print("Durée de la veille : {:.1f} s".format(secondes(apres) - secondes(avant)))
```

L'exemple [sleep_on_button.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/mcp23009e/examples/sleep_on_button.py) du driver mcp23009e réveille de même la carte par les flèches, à travers l'interruption de l'expandeur.

### `deepsleep` : veille profonde

`deepsleep()` coupe presque tout le microcontrôleur et vide la RAM : au réveil, la carte **redémarre** comme après un appui sur Reset, et exécute de nouveau `boot.py` puis `main.py`. Avant de s'endormir, le firmware arrête le Bluetooth. `machine.reset_cause()` vaut alors `machine.DEEPSLEEP_RESET`, ce qui permet au programme de savoir qu'il sort de veille.

Deux limites du firmware actuel :

- seule l'horloge RTC (le délai `ms`) et le bouton Reset réveillent la carte. Le bouton Menu est relié à la broche de réveil PA0 du microcontrôleur, mais le firmware n'active pas cette broche avant la veille profonde (point noté « TODO » dans `powerctrl_enter_standby_mode()` de [powerctrl.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/powerctrl.c)) : pour un réveil par le bouton Menu, utiliser `lightsleep()` ;
- les variables sont perdues. Pour garder quelques nombres d'un réveil à l'autre, `machine.mem_backup()` donne les registres de sauvegarde de l'horloge RTC, des mots de 32 bits conservés pendant la veille (leur nombre est `len(machine.mem_backup())`) ; pour davantage, écrire un fichier.

Ce programme est fait pour être enregistré sous le nom `main.py` : il allume la LED bleue une seconde, compte ses réveils, puis dort 10 secondes, sans fin. Il n'a pas de bouton **Essayer** : la carte redémarre à chaque réveil, et le wiki perd le programme.

```python
from time import sleep

import machine
from machine import Pin

sauvegarde = machine.mem_backup()
if machine.reset_cause() == machine.DEEPSLEEP_RESET:
    sauvegarde[0] += 1
else:
    sauvegarde[0] = 0  # mise sous tension ou Reset : compteur remis à zéro
print("Réveils :", sauvegarde[0])

led = Pin("LED_BLUE", Pin.OUT)
led.on()
sleep(1)
led.off()

# Bouton B tenu pendant que la LED est allumée : pas de veille,
# la console reste disponible.
if Pin("B_BUTTON", Pin.IN, Pin.PULL_UP).value() == 0:
    print("B appuyé : pas de veille")
else:
    machine.deepsleep(10_000)
```

Un `main.py` qui se rendort aussitôt laisse peu de temps pour reprendre la main : garder une échappatoire comme le bouton B ci-dessus. Un `sys.exit()` dans `main.py` ne suffit pas : le firmware le traite comme un redémarrage logiciel, qui relance `main.py`.

:::warning Le bouton A au démarrage

Ne pas utiliser le bouton A comme échappatoire : le firmware le lit dès le démarrage, avant `boot.py`. Tenu pendant un démarrage (mise sous tension, bouton Reset, réveil de `deepsleep`), il fait entrer la carte dans le choix du mode de démarrage, la fonction `update_reset_mode()` de [boardctrl.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boardctrl.c) : le mode change toutes les 0,6 s environ, et relâcher le bouton choisit le mode en cours : démarrage normal, puis mode sans échec (sans `boot.py` ni `main.py`), puis **réinitialisation du système de fichiers, qui efface tous les fichiers de la carte**.

:::

## Horloge temps réel (RTC)

L'horloge temps réel du microcontrôleur est cadencée par le quartz de 32 kHz de la carte. `machine.RTC().datetime()` donne la date et l'heure sous la forme `(année, mois, jour, jour de la semaine, heures, minutes, secondes, microsecondes)`, avec le jour de la semaine de 1 (lundi) à 7 (dimanche).

```python run
from machine import RTC

rtc = RTC()
annee, mois, jour, jour_semaine, h, m, s, us = rtc.datetime()
print("{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(annee, mois, jour, h, m, s))
```

Tant qu'elle n'a pas été réglée, l'horloge part du 1er janvier 2015 à 0 h, la valeur posée par le firmware ([rtc.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/rtc.c)). Une fois lancée, elle continue à travers un appui sur Reset et une veille profonde : le firmware ne la remet à zéro que si elle ne tourne pas. Pour la régler :

- depuis l'ordinateur : `mpremote rtc --set` copie l'heure de l'ordinateur sur la carte ;
- dans un programme : `rtc.datetime((2026, 11, 28, 6, 14, 30, 0, 0))` (samedi 28 novembre 2026, 14 h 30).

L'exemple `watch` de `steami_screen` dessine une montre à aiguilles avec cette horloge, sur l'écran de chaque release :

```python file=.external/micropython-steami-lib/lib/steami_screen/examples/watch.py

```

## Chien de garde (watchdog)

Le chien de garde redémarre la carte si le programme ne le « nourrit » pas à temps : il sert à relancer un programme bloqué (bus qui ne répond plus, boucle infinie), par exemple sur une station de mesure laissée seule.

```python
from time import sleep

from machine import WDT

wdt = WDT(timeout=5000)  # redémarre la carte après 5 s sans feed()
while True:
    # ... mesure, envoi ...
    wdt.feed()
    sleep(1)
```

Le firmware utilise le chien de garde indépendant (IWDG) du microcontrôleur ([machine_wdt.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/machine_wdt.c)) :

- `timeout` va de 1 à 32 767 ms (5 000 ms par défaut) ; au-delà, `WDT()` lève `ValueError` ;
- une fois lancé, il **ne s'arrête plus** jusqu'au redémarrage de la carte : ni `del wdt`, ni Ctrl-C, ni un redémarrage logiciel (Ctrl-D, **Arrêter** sur le wiki) ne l'arrêtent. C'est pourquoi ce programme n'a pas de bouton **Essayer** : après l'arrêt du programme, la carte redémarrerait toute seule ;
- après un redémarrage par le chien de garde, `machine.reset_cause()` vaut `machine.WDT_RESET` ;
- ne pas mettre la carte en veille plus longtemps que le délai : nourrir le chien de garde avant chaque `lightsleep()`, et garder des veilles plus courtes que `timeout`.

## `asyncio` : plusieurs tâches à la fois

`asyncio` fait tourner plusieurs tâches dans un même programme, chacune à son rythme, sans timer ni callback : une tâche s'interrompt à chaque `await` et laisse la main aux autres. Le paquet est gelé dans le firmware ; c'est aussi sur lui que repose `aioble`, la bibliothèque Bluetooth.

Le programme suivant fait trois choses en même temps, pendant 30 secondes : il fait clignoter la LED bleue, affiche la température sur l'écran toutes les deux secondes et compte les appuis sur le bouton A. Il passe par `steami.Screen` et `steami.Temperature` : le même programme tourne sur V1a, V1b et V1c.

```python run
import asyncio

from machine import Pin
from steami import Screen, Temperature

screen = Screen()
screen.begin()
temperature = Temperature()
led = Pin("LED_BLUE", Pin.OUT)
bouton_a = Pin("A_BUTTON", Pin.IN, Pin.PULL_UP)

# Un ThreadSafeFlag peut être levé depuis une interruption.
appui = asyncio.ThreadSafeFlag()
bouton_a.irq(lambda pin: appui.set(), Pin.IRQ_FALLING, hard=True)


async def clignoter():
    while True:
        led.on()
        await asyncio.sleep_ms(100)
        led.off()
        await asyncio.sleep_ms(900)


async def afficher():
    while True:
        screen.clear()
        screen.title("asyncio")
        screen.value(temperature.read(), label="Temp", unit="C")
        screen.show()
        await asyncio.sleep(2)


async def compter():
    appuis = 0
    while True:
        await appui.wait()
        appuis += 1
        print("Appuis sur A :", appuis)


async def main():
    asyncio.create_task(clignoter())
    asyncio.create_task(afficher())
    asyncio.create_task(compter())
    await asyncio.sleep(30)  # fin du programme après 30 s


try:
    asyncio.run(main())
finally:
    bouton_a.irq(None)
    led.off()
    asyncio.new_event_loop()  # efface les tâches restantes
```

Ce qu'il faut savoir :

- les tâches se partagent le temps de façon **coopérative** : une tâche qui ne fait pas d'`await` bloque toutes les autres. Dans une tâche, attendre avec `await asyncio.sleep()` ou `await asyncio.sleep_ms()`, jamais avec `time.sleep()`. Un appel long sans `await`, comme `screen.show()` (environ 74 ms sur la V1c), retarde d'autant les autres tâches ;
- `asyncio.ThreadSafeFlag` est le pont entre une interruption et les tâches : le callback appelle `set()`, une tâche attend avec `await flag.wait()`. Un `asyncio.Event` ordinaire ne doit pas être levé depuis une interruption ;
- `asyncio.run()` laisse les tâches non terminées dans la boucle d'événements : `asyncio.new_event_loop()` les efface, pour qu'un nouveau lancement depuis le REPL reparte d'une boucle vide ;
- `asyncio.wait_for(tache, delai)` borne la durée d'une attente, `asyncio.gather()` attend plusieurs tâches.

## Voir aussi

- [Essayer sur la carte](./essayer) : lancer les programmes de cette page depuis le wiki
- [Conventions API des drivers](./conventions) : `power_off()`, lectures et réveil des capteurs
- [Boutons](/docs/hardware/pin-mapping/buttons) et [LEDs](/docs/hardware/pin-mapping/leds) : les broches utilisées par les exemples
- [STM32WB55](/docs/hardware/main-components/stm32wb55) : le microcontrôleur de la carte
- [Pile radio Bluetooth](../pile-radio) : la pile du cœur radio, qui se sert de SRAM2
- [Fork du firmware](https://github.com/steamicc/micropython-steami/tree/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG) : la configuration de la carte `STEAM32_WB55RG`
