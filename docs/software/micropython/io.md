---
title: Entrées et sorties
sidebar_position: 5.4
---

import TOCInline from '@theme/TOCInline';

<!-- cspell:ignore frequence duree deinit -->

# Entrées et sorties en MicroPython

Cette page présente les entrées et les sorties de la carte STeaMi en MicroPython : les sept boutons, la LED RGB, le buzzer, les pads pour pinces crocodile de l'expandeur et les broches du connecteur edge, en entrée, en sortie, en entrée analogique et en PWM. Chaque programme affiche ce qu'il fait avec `print()`, dans la console du bouton **Essayer sur la carte** (voir [Essayer le code sur la carte](./essayer)), dans [Thonny](./thonny) ou dans [mpremote](./mpremote).

Les boutons, les LEDs, le buzzer, les pads et le connecteur edge sont câblés de la même façon sur les trois releases (voir [Révisions de la carte](/docs/hardware/revisions)) : les programmes de cette page tournent tels quels sur la V1a, la V1b et la V1c. Les noms de broches viennent du [fichier des broches](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/STEAM32_WB55RG/pins.csv) du firmware (fork [micropython-steami](https://github.com/steamicc/micropython-steami/tree/stm32-steami-rev1d-final), branche `stm32-steami-rev1d-final`) ; les fonctions `steami` viennent de la bibliothèque [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib), gelée dans ce firmware.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

## Ce qui est sur la carte

| Élément                                          | En MicroPython                                    | Broches                                                                  |
| ------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------ |
| [Boutons A, B et MENU](#boutons)                 | `steami.Buttons`, ou `machine.Pin`                | `A_BUTTON` (PA7), `B_BUTTON` (PA8), `MENU_BUTTON` (PA0)                  |
| [D-PAD (UP, DOWN, LEFT, RIGHT)](#boutons)        | `steami.Buttons`, ou le driver `mcp23009e`        | GP7, GP5, GP6 et GP4 de l'expandeur MCP23009E                            |
| [LED RGB et LED Bluetooth](#leds)                | `machine.Pin`                                     | `LED_RED` (PC12), `LED_GREEN` (PC11), `LED_BLUE` (PC10), `LED_BLE` (PH3) |
| [Buzzer](#buzzer)                                | `steami.tone()` et `steami.no_tone()`             | `SPEAKER` (PA11)                                                         |
| [Pads P24, P25, P28 et P29](#pads-de-lexpandeur) | `MCP23009Pin` et les constantes `steami.PAD_P24`… | GP2, GP3, GP0 et GP1 de l'expandeur MCP23009E                            |
| [Connecteur edge](#broches-du-connecteur-edge)   | `machine.Pin`, `machine.ADC`, `machine.PWM`       | `P0` à `P16`                                                             |

Les broches des boutons et des LEDs sont détaillées dans [Boutons](/docs/hardware/pin-mapping/buttons) et [LEDs](/docs/hardware/pin-mapping/leds), celles du connecteur dans [Broches du connecteur edge](/docs/hardware/pin-mapping/edge-connector).

## Boutons

La carte a sept boutons utilisateur : A, B et MENU, reliés directement au microcontrôleur, et les quatre flèches du D-PAD (UP, DOWN, LEFT, RIGHT), reliées à l'expandeur d'entrées-sorties MCP23009E du bus I²C interne. Tous sont actifs à l'état bas : un appui relie la broche à la masse.

La classe `Buttons` de la couche [`steami`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/steami) lit les sept boutons de la même façon, sans s'occuper de l'expandeur. C'est l'équivalent MicroPython de la classe `SteamiButtons` de la bibliothèque Arduino (voir [Boutons et D-PAD](../arduino/capteurs#boutons-et-d-pad) en Arduino).

### Lire les sept boutons

Ce programme de la bibliothèque affiche chaque appui et chaque relâchement :

```python file=.external/micropython-steami-lib/lib/steami/examples/buttons.py

```

Au lancement, il affiche `Buttons ready.`, puis une ligne par appui et par relâchement. Un appui bref sur A, puis deux appuis sur UP, donnent :

```text
Buttons ready.
A pressed (+1, total 1)
A released
UP pressed (+1, total 1)
UP released
UP pressed (+1, total 2)
UP released
```

Le premier nombre est le nombre d'appuis arrivés depuis le tour de boucle précédent, le second le total pour ce bouton depuis le lancement : chaque bouton a son propre total. Les noms des boutons sont des textes : `"A"`, `"B"`, `"MENU"`, `"UP"`, `"DOWN"`, `"LEFT"` et `"RIGHT"`. Un autre nom lève `ValueError`.

Si l'expandeur ne répond pas, `begin()` renvoie `False` et le programme affiche `D-pad unavailable:` suivi de la raison (`error()`) : A, B et MENU marchent quand même, et les flèches restent lues relâchées. Les appuis comptent à partir du premier appel qui lit les boutons (`is_pressed()`, `was_pressed()`, `get_presses()`…), pas à partir de `begin()` : un appui fait avant cet appel, ou un bouton déjà enfoncé à ce moment, ne compte pas.

### Les méthodes

| Méthode                        | Résultat                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `is_pressed(nom)`              | `True` tant que le bouton est enfoncé                                                                                                          |
| `was_pressed(nom)`             | `True` une fois par appui, depuis la question précédente pour ce bouton                                                                        |
| `was_released(nom)`            | `True` une fois par relâchement, depuis la question précédente pour ce bouton                                                                  |
| `get_presses(nom)`             | Le nombre d'appuis depuis le `get_presses()` précédent pour ce bouton, puis 0. Il s'arrête à 255, comme `get_presses()` sur la carte micro:bit |
| `wait_for_press(timeout_ms)`   | Attend un nouvel appui et renvoie le nom du bouton ; `None` au bout de `timeout_ms` millisecondes. Sans argument, attend sans limite           |
| `begin()`, `error()`, `chip()` | Comme pour les capteurs (voir [Avant de commencer](./capteurs#avant-de-commencer)) : `begin()` renvoie `True` si l'expandeur du D-PAD répond   |

`was_pressed()` et `was_released()` sont des drapeaux : plusieurs appuis entre deux questions n'en donnent qu'un. `get_presses()` compte chaque appui, indépendamment de `was_pressed()` et de `wait_for_press()` : c'est lui qu'utilise l'exemple ci-dessus. L'anti-rebond est le même qu'en Arduino : un changement est pris tout de suite, puis les rebonds des 20 ms qui suivent sont ignorés.

### Attendre un appui

`wait_for_press()` attend un nouvel appui sur l'un des sept boutons et renvoie son nom. Les appuis faits avant l'appel sont oubliés, et un bouton déjà enfoncé doit d'abord être relâché. Ce programme s'arrête après 10 secondes sans appui, ou sur MENU :

```python run
from steami import Buttons

boutons = Buttons()
boutons.begin()

print("Appuyer sur un bouton (MENU pour finir)")
while True:
    nom = boutons.wait_for_press(10000)
    if nom is None:
        print("Aucun appui depuis 10 s : fin")
        break
    print("Bouton", nom)
    if nom == "MENU":
        break
```

### Les appuis brefs entre deux appels

Un programme ne lit pas toujours les boutons à temps : il dessine sur l'écran, attend une mesure, ou dort. `Buttons` retrouve quand même, à l'appel suivant, un appui bref fait entre deux appels, quel que soit le temps écoulé :

- **A, B et MENU** : `begin()` met une interruption sur les deux fronts de chaque broche, qui fait l'anti-rebond au moment du front. Un appui bref donne, à l'appel suivant, `was_pressed()` et `was_released()` à `True`, et `is_pressed()` à `False`. `get_presses()` compte chacun des appuis faits entre deux appels.
- **D-PAD** : l'expandeur n'a pas d'interruption vers le microcontrôleur (sa broche `INT_EXPANDER`, PB0, partage la ligne d'interruption EXTI 0 avec MENU, PA0). Chaque appel lit le registre de capture de l'expandeur, qui garde le premier changement arrivé depuis la lecture précédente. Quand une lecture trouve un changement, l'appel relit l'expandeur 20 ms plus tard et ne garde que le niveau d'alors, pour ignorer les rebonds : cet appel dure 20 ms de plus, 40 ms au plus. Un appui bref sur une flèche donne alors la même chose que sur A. En revanche, **deux appuis sur les flèches entre deux lectures n'en donnent qu'un** : l'expandeur ne garde que le premier changement.

Ce programme lit les boutons une seule fois par seconde. Pendant chaque seconde, taper plusieurs fois sur A, puis sur UP :

```python run
from time import sleep

from steami import Buttons

boutons = Buttons()
boutons.begin()
boutons.get_presses("A")  # premier appel : les appuis comptent à partir d'ici

print("Taper plusieurs fois sur A ou sur UP, pendant 10 secondes")
for _ in range(10):
    sleep(1)  # une boucle lente : la carte fait autre chose pendant ce temps
    a = boutons.get_presses("A")
    haut = boutons.get_presses("UP")
    print("A : {} appui(s), UP : {} appui(s)".format(a, haut))
```

Chaque ligne donne tous les appuis sur A de la seconde écoulée, mais au plus un appui sur UP : une boucle qui doit compter les appuis rapides sur une flèche lit les boutons souvent, toutes les 5 ms par exemple, comme l'exemple [`buttons.py`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/examples/buttons.py).

Avec plusieurs objets `Buttons` dans un même programme, les appuis brefs faits entre deux appels vont à celui qui a été démarré ou appelé en dernier. Un seul objet suffit, partagé par tout le programme.

### Le D-PAD et les callbacks de l'expandeur

`Buttons` suit les quatre flèches avec `watch_changes()`, une méthode du driver [`mcp23009e`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e) : un suivi que les callbacks du programme ne remplacent pas. Le programme peut donc enregistrer ses propres callbacks sur une flèche, avec `interrupt_on_falling()` (appui), `interrupt_on_rising()` (relâchement) ou `interrupt_on_change()` (les deux) de l'expandeur partagé `Steami.mcp23009e()`, sans gêner `Buttons`. Les numéros des flèches sont dans `mcp23009e.const` : `MCP23009_BTN_UP` (GP7), `MCP23009_BTN_DOWN` (GP5), `MCP23009_BTN_LEFT` (GP6) et `MCP23009_BTN_RIGHT` (GP4).

Sans interruption vers le microcontrôleur, ces callbacks sont appelés pendant les appels de `Buttons` : la boucle du programme doit continuer à lire les boutons. Une exception levée par un callback est affichée et n'arrête pas l'appel.

```python run
from time import sleep_ms, ticks_diff, ticks_ms

from mcp23009e.const import MCP23009_BTN_UP
from steami import Buttons, Steami

boutons = Buttons()
if not boutons.begin():
    raise SystemExit("D-PAD absent : " + boutons.error())

appuis_callback = 0


def haut_appuye():
    # Appelé pendant un appel de boutons, à chaque appui sur UP.
    global appuis_callback
    appuis_callback += 1


Steami.mcp23009e().interrupt_on_falling(MCP23009_BTN_UP, haut_appuye)

print("Appuyer sur UP pendant 15 secondes")
appuis_buttons = 0
debut = ticks_ms()
while ticks_diff(ticks_ms(), debut) < 15000:
    if boutons.was_pressed("UP"):
        appuis_buttons += 1
        print("UP : callback {}, Buttons {}".format(appuis_callback, appuis_buttons))
    sleep_ms(5)
Steami.mcp23009e().disable_interrupt(MCP23009_BTN_UP)
```

Le callback et `was_pressed()` voient les mêmes appuis : les deux nombres avancent ensemble. `disable_interrupt()` retire seulement les callbacks du programme : `Buttons` continue à suivre la flèche. Après un `reset()` de l'expandeur, ou un `power_on()` qui suit un `power_off()`, l'appel suivant de `Buttons` remet en place le suivi des flèches (tant que l'expandeur est éteint, elles sont lues relâchées).

:::caution La ligne d'interruption 0

Les exemples du driver `mcp23009e` qui créent l'expandeur avec `MCP23009E(..., interrupt_pin=Pin("INT_EXPANDER"))` (`reaction_timer.py`, `sleep_on_button.py`) prennent la ligne EXTI 0, celle de MENU. Dans un même programme que `Buttons`, si l'expandeur a pris la ligne en premier, MENU n'est plus lu qu'à chaque appel ; si `Buttons` l'a prise en premier, le `Pin.irq()` suivant lève `OSError`. Pour suivre le D-PAD à côté de `Buttons`, passer par `Steami.mcp23009e()`, comme ci-dessus.

:::

### Sans la couche `steami`

A, B et MENU se lisent aussi avec `machine.Pin`, en entrée avec la résistance de tirage (`Pin.PULL_UP`) : `value()` vaut 0 quand le bouton est enfoncé.

```python
from machine import Pin

bouton_a = Pin("A_BUTTON", Pin.IN, Pin.PULL_UP)
print("A enfoncé" if bouton_a.value() == 0 else "A relâché")
```

Ce code lit le niveau à l'instant de l'appel, sans anti-rebond ni mémoire des appuis brefs. Les interruptions de broche (`Pin.irq()`) et leurs règles sont décrites dans [Sujets avancés](./avance#timers-et-interruptions). Ne pas mélanger `Buttons` et un `Pin.irq()` sur ces trois boutons : `Buttons` prend déjà leurs lignes d'interruption (EXTI 7, 8 et 0).

## LEDs

La couche `steami` n'a pas de classe pour les LEDs : elles se pilotent avec `machine.Pin`, en sortie. Elles sont actives à l'état haut : `value(1)` ou `on()` allume, `value(0)` ou `off()` éteint.

| Nom de broche | LED                  | Broche du STM32WB55 |
| ------------- | -------------------- | ------------------- |
| `LED_RED`     | LED RGB, canal rouge | PC12                |
| `LED_GREEN`   | LED RGB, canal vert  | PC11                |
| `LED_BLUE`    | LED RGB, canal bleu  | PC10                |
| `LED_BLE`     | LED bleue Bluetooth  | PH3                 |

Le programme suivant affiche les sept couleurs que donnent les trois canaux de la LED RGB, allumés ou éteints :

```python run
from time import sleep_ms

from machine import Pin

rouge = Pin("LED_RED", Pin.OUT)
vert = Pin("LED_GREEN", Pin.OUT)
bleu = Pin("LED_BLUE", Pin.OUT)

COULEURS = (
    ("rouge", 1, 0, 0),
    ("vert", 0, 1, 0),
    ("bleu", 0, 0, 1),
    ("jaune", 1, 1, 0),
    ("cyan", 0, 1, 1),
    ("magenta", 1, 0, 1),
    ("blanc", 1, 1, 1),
)

try:
    for nom, r, v, b in COULEURS:
        print(nom)
        rouge.value(r)
        vert.value(v)
        bleu.value(b)
        sleep_ms(800)
finally:
    rouge.off()
    vert.off()
    bleu.off()
```

Les broches des LEDs ne sont reliées à aucun canal de timer du STM32WB55 : `machine.PWM` les refuse, et l'intensité de chaque canal ne se règle pas. Le firmware nomme aussi les trois canaux `LED1` (rouge), `LED2` (vert) et `LED3` (bleu) : ce sont les LEDs du module `pyb`, `pyb.LED(1)` à `pyb.LED(3)`, avec `on()`, `off()` et `toggle()`.

Pour faire clignoter une LED pendant que le programme fait autre chose, utiliser un timer : voir l'exemple de [`machine.Timer`](./avance#machinetimer).

## Buzzer

Le buzzer de la carte (un transducteur piézo, sur la broche `SPEAKER`) se pilote avec deux fonctions de la couche `steami`, les mêmes qu'en Arduino :

- `tone(frequence)` joue un signal carré à cette fréquence, en hertz, jusqu'au prochain `tone()` ou `no_tone()` ;
- `tone(frequence, duree_ms)` s'arrête seul au bout de cette durée, en millisecondes, **sans bloquer** : le programme continue pendant le son ;
- `no_tone()` coupe le son ; une fréquence de 0 ou moins le coupe aussi.

Un nouveau `tone()` remplace le son en cours et sa durée. Pour enchaîner des notes, attendre la fin de chacune avec `sleep_ms()` avant la suivante :

```python run
from time import sleep_ms

from steami import no_tone, tone

DO, RE, MI = 262, 294, 330  # fréquences en hertz
AIR = (DO, DO, DO, RE, MI, RE, DO, MI, RE, RE, DO)  # Au clair de la lune

try:
    for note in AIR:
        tone(note, 250)  # s'arrête seul après 250 ms
        sleep_ms(300)  # 50 ms de silence entre deux notes
finally:
    no_tone()
```

Le bloc `try` … `finally` coupe le buzzer même si le programme est interrompu par Ctrl-C ou par **Arrêter**. Depuis la PR [#506](https://github.com/steamicc/micropython-steami-lib/pull/506) de micropython-steami-lib, l'arrêt d'une note jouée avec une durée ne coupe jamais la note suivante, même s'il arrive en retard (voir [Les règles des callbacks](./avance#les-règles-des-callbacks)).

Le buzzer est piloté en PWM par le canal 4 du timer 1 du microcontrôleur, créé au premier `tone()` (voir [buzzer.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/steami/buzzer.py)). Les broches P7 et P11 du connecteur passent par le même timer : ne pas utiliser `tone()` en même temps qu'un PWM sur ces broches (voir [Sortie PWM](#sortie-pwm)).

## Pads de l'expandeur

Les quatre pads pour pinces crocodile P24, P25, P28 et P29 ne sont pas des broches du microcontrôleur : ce sont les GPIO 0 à 3 de l'expandeur MCP23009E. Ils se pilotent avec la classe `MCP23009Pin` du driver `mcp23009e`, qui s'utilise comme `machine.Pin`, sur l'expandeur partagé `Steami.mcp23009e()`. Les constantes de la couche `steami` donnent le numéro de GPIO de chaque pad ([const.py](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/steami/const.py)) :

| Pad | Constante | GPIO de l'expandeur |
| --- | --------- | ------------------- |
| P28 | `PAD_P28` | GP0                 |
| P29 | `PAD_P29` | GP1                 |
| P24 | `PAD_P24` | GP2                 |
| P25 | `PAD_P25` | GP3                 |

Les sorties de l'expandeur sont à drain ouvert : elles tirent le courant vers la masse (25 mA au plus par broche) mais n'en fournissent pas. Une LED se branche donc entre le 3V3 et le pad, et s'allume quand le pad est mis à 0. En entrée, `MCP23009Pin.PULL_UP` active la résistance de tirage : le pad lit 1 en l'air, 0 relié à la masse.

Ce programme de la bibliothèque allume une LED branchée sur P28 et fait biper le buzzer tant que P24 est relié à la masse. Câblage : une LED en série avec une résistance de 220 Ω, entre le 3V3 (anode) et P28 (cathode), et un fil à pince crocodile entre P24 et un pad GND.

```python file=.external/micropython-steami-lib/lib/steami/examples/pads.py

```

`Steami.mcp23009e()` renvoie `None` si l'expandeur ne répond pas : le programme s'arrête alors avec un message. Sans câblage, il affiche `P24 open: LED off` et attend. Le pad repasse à 1 à la fin (`finally`), ce qui éteint la LED.

## Broches du connecteur edge

Le connecteur edge, au format micro:bit, expose les broches `P0` à `P16` du microcontrôleur, plus P19 et P20 (bus I²C externe). Elles se pilotent avec le module `machine` de MicroPython, par leur nom : `Pin("P0")`. Leur rôle et la broche du STM32WB55 qui correspond à chacune sont donnés dans [Broches du connecteur edge](/docs/hardware/pin-mapping/edge-connector). Les anneaux de P0, P1, P2, 3V3 et GND acceptent une pince crocodile ; les autres broches demandent un adaptateur pour connecteur edge.

Quelques broches sont déjà utilisées sur la carte :

- **P5 et P11** sont les broches des boutons A et B (PA7 et PA8), avec leurs résistances de tirage sur la carte : un appui sur le bouton met la broche à 0. Ne pas les utiliser en sortie, ni dans un programme qui utilise `Buttons`.
- **P13, P14 et P15** portent le bus SPI externe, **P19 et P20** le bus I²C externe : voir [Communication](./communication). Pour P19 et P20, utiliser les noms `I2C_EXT_SCL` et `I2C_EXT_SDA` (voir [P19 et P20](./communication#les-liaisons-de-la-carte)).

### Sortie numérique

`Pin("P0", Pin.OUT)` met la broche en sortie : `value(1)` ou `on()` la met à 3,3 V, `value(0)` ou `off()` à 0 V. Câblage : une LED en série avec une résistance de 220 Ω, entre P0 (anode) et GND (cathode).

```python run
from time import sleep_ms

from machine import Pin

led = Pin("P0", Pin.OUT)

try:
    for _ in range(10):
        led.on()
        sleep_ms(250)
        led.off()
        sleep_ms(250)
finally:
    led.off()
```

Une broche du microcontrôleur fournit au plus quelques milliampères : une LED avec sa résistance, oui ; un moteur ou un relais, non (passer par un transistor ou une carte de puissance).

### Entrée numérique

`Pin("P1", Pin.IN, Pin.PULL_UP)` met la broche en entrée avec la résistance de tirage interne : elle lit 1 en l'air et 0 reliée à la masse. `Pin.PULL_DOWN` fait l'inverse, et `Pin.IN` seul la laisse flotter. Câblage : un fil à pince crocodile sur P1, à toucher au pad GND.

```python run
from time import sleep_ms, ticks_diff, ticks_ms

from machine import Pin

contact = Pin("P1", Pin.IN, Pin.PULL_UP)

print("Relier P1 à GND, pendant 15 secondes")
dernier = None
debut = ticks_ms()
while ticks_diff(ticks_ms(), debut) < 15000:
    niveau = contact.value()
    if niveau != dernier:
        print("P1 relié à GND" if niveau == 0 else "P1 en l'air")
        dernier = niveau
    sleep_ms(20)
```

Pour réagir à un changement sans lire la broche en boucle, utiliser une interruption (`Pin.irq()`, voir [Sujets avancés](./avance#pinirq--interruption-sur-une-broche)).

### Entrée analogique

`machine.ADC` mesure la tension d'une broche analogique : P0 à P4 et P10. `read_u16()` donne un nombre de 0 (0 V) à 65535 (la tension d'alimentation du microcontrôleur, environ 3,3 V). Câblage : un potentiomètre, ses deux bornes extrêmes sur 3V3 et GND, son curseur sur P2.

```python run
from time import sleep_ms

from machine import ADC, Pin

capteur = ADC(Pin("P2"))

for _ in range(20):
    brut = capteur.read_u16()
    print("{:5d}  {:.2f} V".format(brut, brut * 3.3 / 65535))
    sleep_ms(500)
```

La tension sur une broche ne doit jamais dépasser 3,3 V. Une broche en l'air donne une valeur qui dérive : relier P2 à GND donne une valeur proche de 0, et à 3V3 une valeur proche de 65535.

### Sortie PWM

`machine.PWM` produit un signal carré dont la fréquence (`freq`, en hertz) et le rapport cyclique (`duty_u16`, de 0 à 65535) se règlent : de quoi faire varier la luminosité d'une LED ou piloter un servomoteur. Le firmware choisit le canal de timer d'après la broche ([machine_pwm.c](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/machine_pwm.c) et le [tableau des fonctions des broches](https://github.com/steamicc/micropython-steami/blob/stm32-steami-rev1d-final/ports/stm32/boards/stm32wb55_af.csv)) :

| Broche | Canal de timer | Remarque                                                  |
| ------ | -------------- | --------------------------------------------------------- |
| P10    | TIM16, canal 1 | Timer pour elle seule : la broche à choisir en premier    |
| P7     | TIM1, canal 2  | Même timer que le buzzer : pas de `tone()` pendant le PWM |
| P11    | TIM1, canal 1  | Bouton B, et même timer que le buzzer                     |
| P5     | TIM17, canal 1 | Bouton A                                                  |
| P1, P8 | TIM2, canal 1  | Même canal : les deux broches donnent le même signal      |
| P3     | TIM2, canal 3  | Même timer que P1 et P8 : même fréquence                  |

Les autres broches du connecteur n'ont pas de canal de timer : `PWM(Pin("P0"))` lève `ValueError`. Câblage : une LED en série avec une résistance de 220 Ω, entre P10 (anode) et GND (cathode), avec un adaptateur pour connecteur edge.

```python run
from time import sleep_ms

from machine import PWM, Pin

led = PWM(Pin("P10"), freq=1000, duty_u16=0)

try:
    for _ in range(3):
        for niveau in range(0, 65536, 4096):  # la LED s'allume peu à peu
            led.duty_u16(niveau)
            sleep_ms(30)
        for niveau in range(65535, -1, -4096):  # puis s'éteint peu à peu
            led.duty_u16(niveau)
            sleep_ms(30)
finally:
    led.deinit()
```

`deinit()` arrête le signal et libère le canal. Pour un servomoteur, régler `freq=50` et une impulsion de 1 à 2 ms avec `duty_ns()` (en nanosecondes : `led.duty_ns(1500000)` pour 1,5 ms).

## Voir aussi

- [Premiers programmes](../arduino/premiers-programmes) : la LED RGB, les boutons et le buzzer en Arduino
- [Sujets avancés](./avance#timers-et-interruptions) : timers, interruptions de broche et règles des callbacks
- [Écran](./ecran) : afficher l'état des boutons ou une mesure
- [Communication](./communication) : bus I²C et SPI du connecteur edge, liaisons série
- [Boutons](/docs/hardware/pin-mapping/buttons), [LEDs](/docs/hardware/pin-mapping/leds) et [Broches du connecteur edge](/docs/hardware/pin-mapping/edge-connector) : le câblage de la carte
- [README de la couche `steami`](https://github.com/steamicc/micropython-steami-lib/blob/main/lib/steami/README.md) et [driver `mcp23009e`](https://github.com/steamicc/micropython-steami-lib/tree/main/lib/mcp23009e) : la référence complète
