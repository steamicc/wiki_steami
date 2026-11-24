---
title: Installer l'Arduino IDE
sidebar_position: 1
---

# Installer l'Arduino IDE

La carte STeaMi est reconnue par l'Arduino IDE grâce au paquet **STM32 MCU based boards** (core [STM32duino](https://github.com/stm32duino/Arduino_Core_STM32)), maintenu par STMicroelectronics. Ce paquet contient une définition officielle de la carte, nommée **STeaMi Board**. Aucune autre installation n'est nécessaire pour faire clignoter une LED, lire un bouton ou jouer un son.

:::tip Rien à installer ?
Si l'ordinateur ne permet pas d'installer l'Arduino IDE (poste de classe verrouillé, Chromebook), il existe une alternative qui fonctionne dans un navigateur : [Programmer sans installation (Codespace)](./codespace).
:::

## Prérequis

- une carte STeaMi (V1a, V1b ou V1c) ;
- un câble USB qui transporte les données, pas seulement la charge (micro-USB sur V1a et V1b, USB-C sur V1c) ;
- l'[Arduino IDE 2](https://www.arduino.cc/en/software) installé sur l'ordinateur (Windows, macOS ou Linux).

## 1. Ajouter le gestionnaire de cartes STM32

1. Ouvrir **Fichier → Préférences** (sous macOS : **Arduino IDE → Settings**).
2. Dans **URL de gestionnaire de cartes supplémentaires**, ajouter l'adresse suivante (une URL par ligne si d'autres sont déjà présentes) :

   ```text
   https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json
   ```

3. Valider avec **OK**.

## 2. Installer le paquet STM32

1. Ouvrir le **gestionnaire de cartes** (icône de carte dans la barre latérale, ou **Outils → Carte → Gestionnaire de carte**).
2. Rechercher **STM32 MCU based boards** et cliquer sur **Installer**.

Le téléchargement est volumineux (compilateur ARM compris) : prévoir quelques minutes.

## 3. Choisir la carte et le mode de téléversement

Dans le menu **Outils** :

| Réglage           | Valeur à choisir                            |
| ----------------- | ------------------------------------------- |
| Carte             | **STM32 MCU based boards → STeaMi Board**   |
| Board part number | **STeaMi** (valeur par défaut)              |
| Upload method     | **Mass Storage** (valeur par défaut)        |
| Port              | le port série de la carte (voir ci-dessous) |

Les autres réglages du menu peuvent rester à leur valeur par défaut. Le mode **Mass Storage** copie le programme compilé sur le disque USB **STEAMI** que la carte présente à l'ordinateur, exactement comme un glisser-déposer. Il ne demande aucun pilote ni outil supplémentaire.

Le port série apparaît sous la forme `COM3` (Windows), `/dev/cu.usbmodem…` (macOS) ou `/dev/ttyACM0` (Linux). Il sert au moniteur série, pas au téléversement.

## 4. Premier téléversement

1. Coller ce programme dans une nouvelle fenêtre :

   ```cpp
   void setup() {
     pinMode(LED_GREEN, OUTPUT);
   }

   void loop() {
     digitalWrite(LED_GREEN, HIGH);
     delay(500);
     digitalWrite(LED_GREEN, LOW);
     delay(500);
   }
   ```

2. Cliquer sur **Téléverser** (flèche vers la droite).
3. Une fois la copie terminée, la carte redémarre et la LED RGB clignote en vert.

## 5. Ouvrir le moniteur série

Les programmes affichent leurs messages avec `Serial.print()`. Pour les lire, ouvrir **Outils → Moniteur série** et choisir **115200 bauds**, la vitesse utilisée par tous les exemples STeaMi.

Le port série passe par le microcontrôleur d'interface (DAPLink), qui le relie à `Serial` côté programme.

## Dépannage

### Le téléversement ne trouve pas le disque STEAMI

- Vérifier que le disque **STEAMI** apparaît dans l'explorateur de fichiers. S'il n'apparaît pas, changer de câble : beaucoup de câbles ne transportent que la charge.
- Sous Linux, le disque doit être monté (l'ouvrir une fois dans le gestionnaire de fichiers suffit en général).
- En dernier recours, passer par un glisser-déposer manuel : **Croquis → Exporter les binaires compilés**, puis copier le fichier `.bin` produit dans le dossier du croquis sur le disque **STEAMI**.

### Le moniteur série n'affiche rien

- Vérifier la vitesse : **115200 bauds**.
- Les messages écrits dans `setup()` partent avant l'ouverture du moniteur. Appuyer sur le bouton reset de la carte une fois le moniteur ouvert pour les revoir.

### Accès au port série refusé sous Linux

Ajouter l'utilisateur au groupe `dialout`, puis se déconnecter et se reconnecter :

```bash
sudo usermod -aG dialout $USER
```

## Étapes suivantes

- [Premiers programmes](./premiers-programmes) : LEDs, boutons et buzzer, sans bibliothèque.
- [Bibliothèques STeaMi](./bibliotheques) : installer la bibliothèque STeaMi, qui contient les drivers des capteurs.
