---
title: Premiers programmes
sidebar_position: 3
---

# Premiers programmes

La LED RGB, les boutons A, B et MENU, le buzzer et le port série sont reliés directement au microcontrôleur STM32WB55. Ils s'utilisent avec les fonctions Arduino habituelles (`pinMode`, `digitalWrite`, `digitalRead`, `tone`, `Serial`), sans aucune bibliothèque à installer.

Les programmes de cette page fonctionnent à l'identique sur les V1a, V1b et V1c. Ils supposent l'Arduino IDE configuré comme indiqué dans [Installer l'Arduino IDE](./arduino-ide).

## Noms des broches

La définition de la carte fournit des noms prêts à l'emploi. Il est inutile de connaître les numéros de broches du microcontrôleur.

| Nom Arduino   | Élément de la carte          | Logique                        |
| ------------- | ---------------------------- | ------------------------------ |
| `LED_RED`     | LED RGB, canal rouge         | `HIGH` = allumée               |
| `LED_GREEN`   | LED RGB, canal vert          | `HIGH` = allumée               |
| `LED_BLUE`    | LED RGB, canal bleu          | `HIGH` = allumée               |
| `LED_BLE`     | LED bleue Bluetooth          | `HIGH` = allumée               |
| `A_BUTTON`    | bouton A (partagé avec P5)   | `LOW` = appuyé, pull-up        |
| `B_BUTTON`    | bouton B (partagé avec P11)  | `LOW` = appuyé, pull-up        |
| `MENU_BUTTON` | bouton MENU                  | `LOW` = appuyé, pull-up        |
| `SPEAKER`     | buzzer                       | `tone()` / `noTone()`          |
| `Serial`      | port série USB (via DAPLink) | 115200 bauds dans les exemples |

`LED_BUILTIN` désigne le canal bleu de la LED RGB.

Les quatre boutons directionnels (D-PAD) ne sont pas reliés directement au microcontrôleur : ils passent par un circuit d'extension d'entrées-sorties. Ils se lisent avec la classe `SteamiButtons` ou le driver `SteamiMCP23009E` de la bibliothèque STeaMi (voir [Capteurs](./capteurs#boutons-et-d-pad)).

## Faire clignoter la LED RGB

Le programme allume successivement les trois couleurs et écrit la couleur courante dans le moniteur série.

```cpp
// Fait clignoter la LED RGB en rouge, vert puis bleu.
void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(LED_RED, HIGH);
  Serial.println("Rouge");
  delay(500);
  digitalWrite(LED_RED, LOW);

  digitalWrite(LED_GREEN, HIGH);
  Serial.println("Vert");
  delay(500);
  digitalWrite(LED_GREEN, LOW);

  digitalWrite(LED_BLUE, HIGH);
  Serial.println("Bleu");
  delay(500);
  digitalWrite(LED_BLUE, LOW);
}
```

En allumant deux canaux en même temps, on obtient du jaune (rouge + vert), du cyan (vert + bleu) ou du magenta (rouge + bleu).

## Lire les boutons

Un bouton appuyé relie sa broche à la masse : la lecture donne `LOW`. Il faut donc activer la résistance de tirage interne avec `INPUT_PULLUP`, sinon la broche « flotte » quand le bouton est relâché.

```cpp
// A allume le rouge, B le vert, MENU le bleu.
void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  // Un bouton appuyé relie la broche à la masse : on active le pull-up interne.
  pinMode(A_BUTTON, INPUT_PULLUP);
  pinMode(B_BUTTON, INPUT_PULLUP);
  pinMode(MENU_BUTTON, INPUT_PULLUP);
}

void loop() {
  digitalWrite(LED_RED, digitalRead(A_BUTTON) == LOW);
  digitalWrite(LED_GREEN, digitalRead(B_BUTTON) == LOW);
  digitalWrite(LED_BLUE, digitalRead(MENU_BUTTON) == LOW);
}
```

## Jouer un son

`tone(broche, fréquence)` produit un signal carré à la fréquence demandée, en hertz. `tone(broche, fréquence, durée)` s'arrête seul après la durée indiquée en millisecondes.

```cpp
// Joue une note tant que le bouton A est appuyé.
void setup() {
  pinMode(A_BUTTON, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(A_BUTTON) == LOW) {
    tone(SPEAKER, 440);  // la 440 Hz
  } else {
    noTone(SPEAKER);
  }
}
```

Pour jouer une mélodie, enchaîner des appels à `tone()` avec une durée, séparés par des `delay()` un peu plus longs que chaque note.

## Étapes suivantes

- [Bibliothèques STeaMi](./bibliotheques) : installer les drivers des capteurs.
- [Capteurs](./capteurs) : lire les capteurs de la carte.
- [Écran](./ecran) : dessiner et afficher des mesures sur l'écran rond.
