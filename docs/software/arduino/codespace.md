---
title: Programmer sans installation (Codespace)
sidebar_position: 2
---

# Programmer sans installation (Codespace)

Ce tutoriel montre, pas à pas, comment compiler un programme Arduino et le téléverser sur la carte STeaMi **sans rien installer** sur l'ordinateur : tout se passe dans un navigateur, grâce à un [GitHub Codespace](https://docs.github.com/fr/codespaces) (un poste de travail virtuel hébergé par GitHub). L'image du Codespace contient déjà le compilateur, les drivers STeaMi et leurs exemples.

## Pour qui

- Une classe ou un atelier où l'on ne peut pas installer l'Arduino IDE (postes verrouillés, Chromebooks, ordinateurs personnels des élèves).
- Quelqu'un qui veut essayer la carte en dix minutes, sans configuration.

Si vous pouvez installer des logiciels, l'[Arduino IDE](./arduino-ide) reste le choix le plus direct, et il fonctionne sans connexion Internet.

## Prérequis

- Une carte STeaMi (V1a, V1b ou V1c) et un câble USB qui transporte les données.
- Un compte [GitHub](https://github.com/signup) gratuit. GitHub exige **13 ans minimum**.
- Le quota gratuit de GitHub Codespaces : **120 heures-cœur par mois**, soit 60 heures d'utilisation d'un Codespace à 2 cœurs. Il passe à **180 heures-cœur** (90 heures sur 2 cœurs) avec le [GitHub Student Developer Pack](https://education.github.com/pack). Voir [Limites](#limites).
- Pour la page Téléverser : le navigateur **Chrome** ou **Edge**. Sans lui, la [méthode du lecteur STEAMI](#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami) convient.

## 1. Créer son dépôt

Le Codespace s'ouvre sur un dépôt GitHub : **le vôtre**, copie du modèle `arduino-steami-starter`. C'est là que votre travail sera sauvegardé.

1. Ouvrir le modèle : [github.com/steamicc/arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter).
2. Cliquer sur **Use this template**, puis sur **Create a new repository**.

   ![Page du modèle arduino-steami-starter sur GitHub, avec le bouton « Use this template » déplié : les choix « Create a new repository » et « Open in a codespace »](/img/software/arduino/codespace-01-use-this-template.png)

3. Choisir un nom pour le dépôt, laisser le propriétaire (votre compte), puis cliquer sur **Create repository**.

   ![Formulaire « Create a new repository » prérempli avec le modèle steamicc/arduino-steami-starter, un propriétaire, un nom de dépôt et la visibilité Public](/img/software/arduino/codespace-02-nouveau-depot.png)

:::warning Ne pas choisir « Open in a codespace » ici
Cette entrée du même menu ouvre un Codespace sur le modèle lui-même : il n'est pas à vous et vous ne pourriez pas y sauvegarder votre travail. Passez toujours par **Create a new repository**.
:::

## 2. Ouvrir le Codespace

1. Dans **votre** nouveau dépôt, cliquer sur **Code**, ouvrir l'onglet **Codespaces**, puis cliquer sur **Create codespace on main**.

   ![Menu « Code » d'un dépôt GitHub, onglet Codespaces, avec le bouton « Create codespace on main »](/img/software/arduino/codespace-03-creer-codespace.png)

2. Attendre. La création prend environ **2 minutes** (114 à 127 secondes mesurées sur 2 cœurs). Les fois suivantes, la reprise d'un Codespace arrêté prend environ 30 secondes.
3. Si VS Code demande « Faites-vous confiance aux auteurs des fichiers de ce dossier ? », cliquer sur **Approuver le dossier et continuer** : c'est votre propre dépôt.

   ![Boîte de dialogue de VS Code « Faites-vous confiance aux auteurs des fichiers de ce dossier ? » avec le bouton vert « Approuver le dossier et continuer »](/img/software/arduino/codespace-04-confiance-auteurs.png)

## 3. Le Codespace ouvert

Le Codespace affiche VS Code dans le navigateur : l'explorateur de fichiers à gauche, le `README.md` au centre et un **terminal** en bas. Le terminal affiche un message de bienvenue qui rappelle les commandes `steami-*`.

![Codespace ouvert : explorateur de fichiers, aperçu du README et terminal avec le message de bienvenue qui liste les commandes steami-exemples, steami-compiler, steami-copier, steami-televerser et steami-sauver](/img/software/arduino/codespace-05-codespace-ouvert.png)

Toutes les actions de ce tutoriel se font avec ces commandes, tapées dans le terminal :

| Commande                           | Rôle                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| `steami-exemples [filtre]`         | liste les exemples des drivers, sous la forme `driver/Exemple` |
| `steami-compiler [driver/Exemple]` | compile le programme du dossier `src/`, ou un exemple tel quel |
| `steami-copier driver/Exemple`     | copie un exemple dans `src/` pour le modifier                  |
| `steami-televerser`                | prépare l'envoi du programme compilé vers la carte             |
| `steami-sauver ["message"]`        | sauvegarde le travail sur GitHub                               |

Le terminal est un shell **zsh** (avec oh-my-zsh). L'historique des commandes est conservé : la flèche vers le haut rappelle les commandes précédentes, même après l'arrêt et la reprise du Codespace.

## 4. Lister et compiler un exemple

Les exemples viennent des drivers de la bibliothèque [arduino-steami-lib](https://github.com/steamicc/arduino-steami-lib). Pour ne voir que ceux du magnétomètre :

```bash
steami-exemples lis2mdl
```

```text
lis2mdl/BasicReader
…
```

Pour compiler l'exemple `lis2mdl/BasicReader` tel quel, sans toucher à vos fichiers :

```bash
steami-compiler lis2mdl/BasicReader
```

Une vingtaine de secondes plus tard, la compilation se termine par :

```text
✅ lis2mdl/BasicReader compilé : firmware.bin prêt (steami-televerser pour l'envoyer sur la carte)
```

Sans argument, `steami-compiler` compile le programme de votre dossier `src/`. Au départ, c'est le programme du modèle : il fait clignoter la LED verte et écrit `Bonjour STeaMi !`, puis un compteur, sur la liaison série. La capture suivante montre cette compilation du programme du modèle : les lignes `Compiling`, la taille occupée, `[SUCCESS]`, puis le message final. Le dossier `.steami/` apparaît alors dans l'explorateur ; il contient `firmware.bin`, le programme prêt à être envoyé.

![Terminal après steami-compiler : lignes Compiling et Linking, utilisation de la mémoire RAM et Flash, ligne [SUCCESS] et message « src compilé : firmware.bin prêt »](/img/software/arduino/codespace-07-compilation.png)

## 5. Envoyer le programme sur la carte

Une fois `firmware.bin` prêt, il existe deux méthodes, à égalité. Choisissez selon votre poste :

| Votre situation                                                                      | Méthode conseillée                                                         |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Chrome ou Edge, WebUSB autorisé                                                      | [Page Téléverser](#méthode-1--la-page-téléverser) (avec console série)     |
| Firefox, Safari ou un autre navigateur                                               | [Lecteur STEAMI](#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami) |
| WebUSB désactivé par l'établissement (poste géré)                                    | [Lecteur STEAMI](#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami) |
| Linux sans règle `udev` pour la carte (Chrome n'a pas le droit d'ouvrir le port USB) | [Lecteur STEAMI](#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami) |

### Méthode 1 : la page Téléverser

Cette méthode envoie le programme directement depuis le navigateur par USB (WebUSB) et affiche la console série.

1. Dans le terminal, lancer :

   ```bash
   steami-televerser
   ```

   La commande démarre un petit serveur et affiche les deux méthodes, avec l'adresse de la page Téléverser :

   ```text
   Deux façons d'envoyer le programme sur la carte :

     Méthode 1 : la page Téléverser
       Ouvrez cette adresse dans un onglet de Chrome ou d'Edge :
       https://<nom-du-codespace>-8080.app.github.dev/

     Méthode 2 : le glisser-déposer
       Clic droit sur .steami/firmware.bin → Download,
       puis glissez le fichier sur le lecteur STEAMI.
   ```

   Vous pouvez aussi ouvrir l'onglet **Ports** du panneau du bas, repérer la ligne du port **8080** (processus `steami_serveur.py`) et cliquer sur l'icône en forme de globe, **Ouvrir dans un navigateur**.

   ![Onglet Ports de VS Code : la ligne du port 8080 avec le processus steami_serveur.py et l'icône « Ouvrir dans un navigateur »](/img/software/arduino/codespace-06-onglet-ports.png)

2. La page Téléverser doit s'ouvrir **dans un onglet de Chrome ou d'Edge**.
3. Brancher la carte en USB, puis cliquer sur **Connecter la carte**. Chrome ouvre une fenêtre : choisir **STeaMi CMSIS-DAP** et cliquer sur **Connexion**.

   ![Fenêtre de Chrome « souhaite se connecter » avec le périphérique STeaMi CMSIS-DAP sélectionné et le bouton Connexion, devant la page « Téléverser sur la STeaMi »](/img/software/arduino/codespace-08-connecter-carte.png)

4. Cliquer sur **Téléverser**. Une barre de progression avance, avec le message « Téléversement en cours… ».

   ![Page Téléverser pendant l'envoi : état « Carte connectée », barre de progression à environ 15 % et message « Téléversement en cours… »](/img/software/arduino/codespace-09-televersement-en-cours.png)

5. Quand le message « Programme téléversé. » apparaît, la carte redémarre toute seule et exécute le nouveau programme. La **console série** affiche ce que le programme écrit avec `Serial.print()` : ici `Bonjour STeaMi !`, puis un compteur.

   ![Page Téléverser terminée : barre de progression pleine, message « Programme téléversé. » et console série affichant « Bonjour STeaMi ! » puis 0 et 1](/img/software/arduino/codespace-10-programme-televerse.png)

### Autre méthode : glisser le fichier sur le lecteur STEAMI

Cette méthode fonctionne avec n'importe quel navigateur. Elle ne passe pas par WebUSB : on télécharge `firmware.bin` sur l'ordinateur, puis on le copie sur le lecteur USB que la carte présente.

1. Dans l'explorateur du Codespace, déplier le dossier `.steami`, faire un clic droit sur `firmware.bin` et choisir **Télécharger…** (**Download…** en anglais).

   ![Menu contextuel du fichier .steami/firmware.bin dans l'explorateur de VS Code, avec l'entrée « Télécharger… » en surbrillance](/img/software/arduino/codespace-11-telecharger-firmware.png)

2. Brancher la carte : elle apparaît comme un lecteur nommé **STEAMI**, qui contient seulement `STEAMI.HTM` et `DETAILS.TXT`.

   ![Gestionnaire de fichiers montrant le lecteur STEAMI avec les deux fichiers STEAMI.HTM et DETAILS.TXT](/img/software/arduino/codespace-12-lecteur-steami.png)

3. Glisser `firmware.bin` (dans le dossier des téléchargements du navigateur) sur ce lecteur. Une fois la copie terminée, la carte redémarre toute seule.

   ![Lecteur STEAMI après la copie : le fichier firmware.bin est présent à côté de STEAMI.HTM et DETAILS.TXT](/img/software/arduino/codespace-13-firmware-copie.png)

Cette méthode n'affiche pas de console série (voir [Lire la sortie série](#lire-la-sortie-série)).

## 6. Modifier l'exemple

Pour partir d'un exemple et le changer, le copier d'abord dans `src/` :

```bash
steami-copier lis2mdl/BasicReader
```

```text
→ git status --porcelain -- src
✅ lis2mdl/BasicReader copié dans src/
```

Ouvrir ensuite les fichiers de `src/` dans l'explorateur, les modifier, puis compiler le dossier `src/` (sans argument) et téléverser comme précédemment :

```bash
steami-compiler
steami-televerser
```

:::note Une copie ne se fait pas par-dessus un travail non sauvegardé
Si `src/` contient des modifications pas encore sauvegardées, `steami-copier` s'arrête pour ne rien écraser. Lancez d'abord `steami-sauver`, ou ajoutez l'option `--remplacer` pour les écraser volontairement.
:::

## 7. Sauvegarder son travail

Le Codespace n'est pas votre ordinateur : sa sauvegarde, c'est GitHub. Pour enregistrer votre travail dans votre dépôt :

```bash
steami-sauver "essai : exemple BasicReader"
```

```text
→ git add -A
→ git commit -m "essai : exemple BasicReader"
→ git push
✅ Travail sauvegardé sur GitHub, branche main.
```

Entre ces lignes, `git` affiche ses propres messages. Sans message, la sauvegarde est nommée « sauvegarde ». Le résultat apparaît dans l'historique de votre dépôt sur github.com.

## Lire la sortie série

- Avec la **page Téléverser**, la console série est intégrée : elle affiche tout ce que le programme écrit avec `Serial.print()` (la vitesse est de 115200 bauds, comme dans tous les exemples STeaMi).
- Avec la méthode du **lecteur**, la copie du fichier n'ouvre aucune console : pour lire la sortie série, il faut la page Téléverser (Chrome ou Edge).

## Tuteur IA

Le Codespace contient un tuteur IA : **GitHub Copilot Chat**, dans le panneau de discussion de VS Code. Il est configuré pour aider à comprendre, pas pour faire le travail à la place de l'élève.

### Ce que fait le tuteur

- **Il explique** une notion avec une image concrète, pose des questions pour faire réfléchir, et donne l'aide par étapes : un indice avant un exemple, et jamais le programme complet.
- **Il aide à lire une erreur** : il demande la **première** erreur affichée par `steami-compiler` (les suivantes viennent souvent de la première), l'explique en français simple, puis laisse l'élève corriger. Pour un programme qui compile mais se comporte mal, il propose d'ajouter des `Serial.println` et de lire la console série.
- **Il propose des quiz** : deux skills sont fournis, « approfondir une notion » (explication détaillée) et « quiz thématique » (questions corrigées une à une, avec un score).
- **Il ne modifie aucun fichier** et ne lance pas `steami-sauver` ni `steami-copier` : une garde (`.agents/garde-tuteur.py`) refuse ces actions. Il peut lire les fichiers et lancer `steami-compiler`, `steami-exemples` et `steami-televerser`. C'est l'élève qui écrit son code dans `src/` et qui sauvegarde.
- **La complétion automatique est désactivée exprès** : seul le chat est disponible, pour que l'élève écrive lui-même son code.

Exemples de questions à poser :

- « C'est quoi `loop()` ? »
- « Voici ma première erreur de compilation : peux-tu m'expliquer ce qu'elle veut dire ? »
- « Fais-moi un quiz sur les boucles. »

### Pour les enseignants

Le tuteur se règle avec des fichiers du dépôt modèle, créé à partir de [arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter) et distribué avec Classroom 50 (voir [Conseils pour la classe](#conseils-pour-la-classe)).

- **L'énoncé du TP** se met dans le `README.md` du dépôt modèle.
- **Le contexte du TP** (thème, notions déjà vues, exercices dans l'ordre, ce que le tuteur ne doit pas donner) se complète dans la section « Contexte du TP » de `AGENTS.md`. Il ne faut **pas** y écrire les solutions : élèves et tuteur lisent ce fichier.
- **Les instructions du tuteur** sont dans `AGENTS.md` et `.github/copilot-instructions.md`. Le bloc de tutorat est commun aux deux fichiers et doit rester **identique** (un test du modèle le vérifie).

### Accéder à Copilot

**Copilot Free** suffit pour commencer, avec un nombre de requêtes limité par mois. Avec le [Student Developer Pack](#conseils-pour-la-classe) validé, l'élève peut en général obtenir **Copilot Pro** gratuitement, mais l'avantage **ne s'active pas tout seul** :

1. Attendre l'e-mail de GitHub Education, qui peut arriver quelques jours après la validation du Pack.
2. Réclamer l'avantage Copilot depuis la page des avantages GitHub Education du compte.
3. Vérifier dans **Settings → Copilot** que l'offre affichée n'est plus « Free ».

Si l'offre reste « Free » après environ 72 heures, se déconnecter puis se reconnecter à GitHub. Si cela ne change rien, [contacter le support GitHub Education](https://support.github.com/contact/education). Ces étapes changent parfois : en cas de doute, suivre les indications affichées par GitHub.

## Limites

- **Pas de débogage** pas à pas : le Codespace compile et téléverse, il ne pilote pas de sonde. Pour déboguer, voir la page [PlatformIO](./platformio) sur un poste installé.
- **Quota** : 120 heures-cœur par mois (60 heures sur 2 cœurs). Un Codespace allumé consomme le quota, même sans activité. Voir [Conseils pour la classe](#conseils-pour-la-classe).
- **Codespaces inactifs supprimés** : GitHub arrête un Codespace après une période d'inactivité et supprime ceux qui restent inutilisés longtemps. Ce qui n'a pas été sauvegardé avec `steami-sauver` est alors perdu.
- **Connexion Internet** nécessaire pendant toute la séance.

## Dépannage

### La page Téléverser reste blanche, ou affiche « WebUSB indisponible »

Ouvrir l'adresse dans un onglet de **Chrome ou d'Edge**. Dans un autre navigateur, ou si WebUSB est désactivé sur le poste, passer à la [méthode du lecteur](#autre-méthode--glisser-le-fichier-sur-le-lecteur-steami).

### « Commit impossible » avec `gpg: signing failed`

L'option **GPG verification** de GitHub Codespaces est activée sur le compte. Soit ajouter le dépôt aux dépôts de confiance (**Settings → Codespaces → GPG verification**), soit désactiver l'option, puis relancer `steami-sauver`.

### « Le push a échoué »

Le Codespace est probablement ouvert sur le modèle `steamicc/arduino-steami-starter` au lieu de **votre** dépôt. Créer son dépôt avec **Use this template → Create a new repository** (voir [l'étape 1](#1-créer-son-dépôt)), puis ouvrir un Codespace sur ce dépôt.

### La carte n'est pas proposée dans la fenêtre de Chrome

Vérifier le câble (beaucoup de câbles ne transportent que la charge) et que la carte est bien branchée. Si le problème persiste, utiliser la méthode du lecteur. Pour un redémarrage de la carte qui ne se fait pas, voir [le problème connu du DAPLink](https://github.com/steamicc/DAPLink/issues/10).

## Conseils pour la classe

- **Préparer avant la séance** : chaque élève crée son dépôt et son compte à l'avance, puis ouvre un Codespace une première fois (2 minutes). La reprise en classe ne prend ensuite qu'une trentaine de secondes.
- **Vérifier le réseau** : l'établissement doit autoriser l'accès à `*.github.dev` (le Codespace et la page Téléverser en dépendent), ainsi qu'à `github.com`. À tester avant le cours.
- **Arrêter le Codespace** en fin de séance : indicateur **Codespaces** en bas à gauche, puis **Stop Current Codespace**. Un Codespace allumé consomme le quota.
- **Sauvegarder** avec `steami-sauver` avant d'arrêter.
- **Faire demander le Student Developer Pack** : les élèves inscrits dans un établissement peuvent faire vérifier leur statut auprès de [GitHub Education](https://education.github.com/pack). Le compte d'un élève vérifié dispose alors de **180 heures-cœur de Codespaces par mois** au lieu de 120, l'équivalent d'un compte GitHub Pro. La vérification demande un justificatif de scolarité et peut prendre quelques jours : la lancer bien avant la première séance. Une fois le Pack validé, l'élève peut aussi activer Copilot Pro : voir [Accéder à Copilot](#accéder-à-copilot).
- **Préparer un TP avec Classroom 50** : partir du modèle [arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter) pour créer le dépôt modèle du TP, avec l'énoncé dans le `README.md` et le programme de départ dans `src/`. Classroom 50 crée ensuite le dépôt de chaque élève à partir de ce modèle. L'image du Codespace est publiée et commune à toutes les copies, donc le Codespace de chaque élève démarre aussi vite que celui du modèle, sans prebuild. Dans l'organisation de classe (**Settings → Codespaces**), régler **Codespace ownership** sur **User ownership** : chaque Codespace est alors décompté du quota personnel de l'élève, et un budget Codespaces de l'organisation à 0 $ ne bloque pas leur création.

## Aller plus loin

- Le modèle [arduino-steami-starter](https://github.com/steamicc/arduino-steami-starter) et l'image du Codespace, [arduino-steami-devcontainer](https://github.com/steamicc/arduino-steami-devcontainer), sont publiés sur GitHub.
- [Premiers programmes](./premiers-programmes) : LEDs, boutons et buzzer.
- [Bibliothèques STeaMi](./bibliotheques) : les drivers des capteurs.
- [Installer l'Arduino IDE](./arduino-ide) : l'alternative avec une installation locale.
