---
title: Exemples DAPLINK_FLASH
sidebar_label: DAPLINK_FLASH (fichier sur le lecteur USB)
---

import EssayerExemple from '@site/src/components/EssayerExemple';
import TOCInline from '@theme/TOCInline';

# Exemples DAPLINK_FLASH : fichier sur le lecteur USB

Le DAPLink est le second microcontrôleur de la carte, un STM32F103 : c'est lui qui fait apparaître le lecteur **STEAMI** sur l'ordinateur et qui transmet les programmes au microcontrôleur principal. Il garde aussi **un fichier** dans une mémoire flash externe de 8 Mo, la W25Q64, et le montre sur le lecteur **STEAMI** comme un fichier ordinaire. Un programme Arduino peut écrire dans ce fichier et le relire : c'est un moyen simple d'enregistrer des mesures et de les récupérer ensuite sur l'ordinateur, sans câble série ni carte SD.

Sur cette page :

<TOCInline toc={toc} maxHeadingLevel={2} />

Le programme Arduino tourne sur le microcontrôleur principal, le STM32WB55, qui n'est pas relié à cette mémoire : elle est branchée au STM32F103. Le programme ne touche donc jamais la mémoire lui-même. Il envoie des commandes au DAPLink par le [bus I²C interne](../bibliotheques#le-bus-ic-interne) de la carte, à l'adresse `0x3B` (ajouter des octets à la fin du fichier, lire un bloc du fichier…), et c'est le DAPLink qui lit ou écrit la flash. Le protocole et ses commandes sont décrits sur la page [DAPLink](/docs/software/daplink), la mémoire sur la page [Flash W25Q64](/docs/hardware/main-components/w25q64).

Le DAPLink (STM32F103) équipe les trois releases de la carte, **V1a, V1b et V1c** (voir [Révisions de la carte](/docs/hardware/revisions)). La mémoire W25Q64 et la liaison I²C entre le DAPLink et le microcontrôleur principal sont prévues par la conception de la carte (voir [Conception — MCU et stockage](/docs/design/mcu-storage)). L'exemple de cette page a été conçu pour la V1c et devrait aussi marcher sur V1a et V1b, sans que cela ait été vérifié sur ces cartes. La relecture du fichier par le programme demande toutefois un firmware DAPLink récent (voir [data_logger](#data_logger)).

Cet exemple est celui de la bibliothèque STeaMi, dans **Fichier → Exemples → STeaMi → DAPLINK_FLASH** de l'Arduino IDE. Il écrit ses messages en anglais. Il n'utilise pas l'écran : il garde l'image laissée par le programme précédent, ce n'est pas une panne. La section [Fichier sur le disque USB](../capteurs#fichier-sur-le-disque-usb) de la page Capteurs et écran donne un programme plus court qui écrit dans le même fichier, et les règles à connaître sur son nom, sa mise à jour sur le lecteur et son effacement.

## Le driver en bref

Le fichier se pilote avec deux classes de la bibliothèque STeaMi, l'une posée sur l'autre :

- `SteamiDaplinkBridge bridge(Steami.wire());` crée le **pont** : la liaison I²C avec le DAPLink, à l'adresse `0x3B`. Il sait envoyer une commande, attendre que le DAPLink ait fini (registre d'état) et lire son registre d'erreur. Il sert aussi au driver `SteamiConfig`, qui lit la zone de configuration du DAPLink.
- `SteamiDaplinkFlash flash(bridge);` crée le driver du fichier, qui passe par ce pont.

L'exemple utilise cinq fonctions du driver `SteamiDaplinkFlash` :

- `begin()` vérifie que le DAPLink répond sur le bus I²C et que son identifiant vaut `0x4C`. Elle ne vérifie ni la mémoire ni la version du firmware. Si le DAPLink ne répond pas ou ne donne pas cet identifiant, elle renvoie `false` et l'exemple écrit `DAPLink bridge not found.` puis ne fait plus rien.
- `getFilename(name)` demande au DAPLink le nom du fichier, au format 8.3 des clés USB : 8 caractères au plus pour le nom, 3 pour l'extension. Elle les range dans `name.name` et `name.ext`, sans les espaces de remplissage. Elle renvoie `false` si aucun nom n'a jamais été donné (la zone du nom est vide) ou si le DAPLink ne répond pas.
- `setFilename("LOG", "CSV")` donne un nom au fichier. Le driver passe les lettres en majuscules et refuse un nom trop long ou contenant un caractère interdit (`.`, `,`, `:`, `*`, `?`…). Après l'envoi, il relit le nom pour vérifier qu'il a bien été enregistré, et renvoie `false` sinon. Changer le nom n'efface pas le contenu.
- `read(content, sizeof(content))` relit le fichier depuis son début, par blocs de 256 octets appelés **secteurs** : une commande de lecture par secteur, avec une attente de 100 ms pour laisser le DAPLink préparer sa réponse. Elle s'arrête à la fin du fichier ou quand le tableau est plein (ici 1024 octets), et renvoie le nombre d'octets lus. Le texte lu n'est pas terminé par un caractère nul : l'exemple l'affiche avec `Serial.write(content, length)`, qui prend la longueur.
- `writeLine(text)` ajoute `text` puis un retour à la ligne à la **fin** du fichier. Le texte part en morceaux de 30 octets au plus, un par commande d'écriture, et le driver attend après chacun que le DAPLink l'ait écrit. Elle renvoie le nombre d'octets écrits, retour à la ligne compris ; au premier refus du DAPLink (fichier plein, par exemple), elle s'arrête et renvoie moins.

Deux propriétés de la mémoire expliquent le fonctionnement du fichier :

- Une flash effacée contient des octets `0xFF`, et le fichier s'arrête au premier `0xFF`. C'est ainsi que le DAPLink trouve la fin du fichier : avant chaque ajout, il la cherche en parcourant la mémoire, ce qui prend quelques secondes quand le fichier est presque plein. Pour la même raison, le fichier ne peut pas contenir l'octet `0xFF` ; le texte, lui, n'en contient jamais.
- Une flash ne se réécrit pas comme une mémoire vive : un octet déjà écrit ne peut plus être modifié sans effacer d'abord tout un bloc de la mémoire. Le DAPLink ne permet donc que deux façons de modifier le fichier, et le driver n'en propose pas d'autre : l'ajout à la fin (`write()`, `writeLine()`) et l'effacement complet, `clearFlash()`, que l'exemple n'appelle pas. Le fichier peut atteindre 8 384 512 octets : les 8 Mo de la mémoire, moins les 4 derniers Ko, qui gardent le nom.

## data_logger {#data_logger}

**Ce qu'on observe** : quand le fichier est encore vide et sans nom, la console écrit `Current content (first 0 bytes):` suivi d'une ligne vide, puis, toutes les 10 secondes environ, une ligne comme `Logged: 20,517` : le nombre de secondes depuis le démarrage du programme, puis la valeur lue sur l'entrée analogique `A0`. Chacune de ces lignes est ajoutée au fichier du lecteur **STEAMI**.

Quand le fichier a déjà un nom, la console commence par l'afficher, par exemple `File: LOG.CSV`, puis recopie le début du fichier (1024 octets au plus) : à chaque nouveau démarrage, on y retrouve le début du relevé, c'est-à-dire l'en-tête et les premières lignes enregistrées. Dès que le fichier dépasse 1024 octets, ce ne sont donc plus les lignes les plus récentes qui s'affichent.

**Matériel** : pour que la deuxième colonne ait un sens, un capteur analogique (par exemple une photorésistance montée en pont diviseur entre 3,3 V et GND) relié à la broche **P3** du connecteur de bord, qui n'a pas de pastille crocodile : il faut un adaptateur pour connecteur de type micro:bit (voir [Broches du connecteur de bord](/docs/hardware/pin-mapping/edge-connector)). Sans rien de branché, l'exemple fonctionne aussi, mais la broche est en l'air et la valeur enregistrée n'a pas de signification.

```cpp file=.external/arduino-steami/examples/DAPLINK_FLASH/data_logger/data_logger.ino

```

**Comment ça marche** : `setup()` prépare le fichier en trois temps.

1. **Le nom.** `getFilename()` demande le nom actuel. S'il existe, l'exemple le garde et l'affiche ; sinon, `setFilename("LOG", "CSV")` nomme le fichier **LOG.CSV**. L'exemple ne renomme donc jamais un fichier qui a déjà un nom : si un autre programme l'a appelé, par exemple, `MESURES.CSV`, les lignes s'ajoutent à ce fichier-là, sous ce nom. Si le nommage échoue, l'exemple écrit `Could not name the file.` et ne fait plus rien.
2. **La relecture.** `read()` lit au plus les 1024 premiers octets du fichier, soit quatre secteurs, et l'exemple les recopie sur la console.
3. **L'en-tête.** Si le fichier est vide (0 octet lu), l'exemple écrit la ligne d'en-tête `seconds,light`, les noms des deux colonnes du fichier CSV. Si le fichier contient déjà des lignes, il n'écrit pas d'en-tête et les nouvelles lignes s'ajoutent à la suite.

Ensuite, `loop()` fabrique une ligne `secondes,valeur` avec `snprintf()` : `millis() / 1000` donne le temps écoulé depuis le démarrage du programme, en secondes, et `analogRead(A0)` la tension de la broche : l'exemple ne change pas la résolution du convertisseur, donc avec la résolution par défaut de 10 bits, un nombre de 0 à 1023, proportionnel à la tension entre 0 V et la tension de référence de la carte (3,3 V attendus). Sur la carte STeaMi, `A0` est la broche **P3** du connecteur de bord : malgré le nom de la colonne, `light`, la carte ne mesure ici aucune lumière par elle-même. `writeLine()` ajoute la ligne au fichier. L'exemple compare le nombre d'octets écrits à la longueur de la ligne plus un (le retour à la ligne) : s'ils sont égaux, il écrit `Logged: …`, sinon `Write failed (flash full?).`. Puis `delay(10000)` attend 10 secondes. Comme chaque écriture attend le DAPLink, l'intervalle entre deux lignes est un peu plus long que 10 secondes.

À chaque démarrage, le compteur de secondes repart de 0, mais aucun nouvel en-tête n'est écrit : dans le fichier, une nouvelle série se reconnaît à ce retour à 0. L'exemple n'efface jamais le fichier. Tant qu'il reste sur la carte, chaque mise sous tension ajoute des lignes ; à environ une dizaine d'octets toutes les 10 secondes, il faudrait plusieurs mois de fonctionnement continu pour remplir la mémoire. Pour repartir d'un fichier vide, un programme doit appeler `flash.clearFlash()` (voir [Fichier sur le disque USB](../capteurs#fichier-sur-le-disque-usb)).

**Avec un ancien firmware DAPLink** : le driver demande chaque secteur par un numéro sur deux octets, que les anciens firmwares refusent (ils attendent un seul octet). Avec un tel firmware, `read()` renvoie 0 : la console affiche `Current content (first 0 bytes):` à chaque démarrage, et l'exemple réécrit l'en-tête `seconds,light` dans le fichier à chaque fois. La page [Capteurs et écran](../capteurs#fichier-sur-le-disque-usb) indique la version de firmware nécessaire, et la page [DAPLink](/docs/software/daplink#mise-à-jour-du-firmware) comment le mettre à jour.

:::info Le fichier LOG.CSV sur le lecteur STEAMI

**Où le trouver.** Le fichier apparaît sur le lecteur **STEAMI**, le même que celui où l'on glisse les fichiers `.bin`, sous le nom **LOG.CSV**, ou sous le nom qu'un autre programme lui a donné avant (l'exemple ne le renomme pas).

**Comment le lire.** Le lecteur montre le fichier tel qu'il était au démarrage du DAPLink : les lignes ajoutées depuis n'y apparaissent pas tout de suite. Pour les voir, débrancher le câble USB, et aussi la batterie si elle est branchée (elle garde le DAPLink alimenté), puis rebrancher. Le bouton Reset ne suffit pas. Le rebranchement redémarre aussi l'exemple, qui reprend l'enregistrement. Le fichier s'ouvre ensuite avec un éditeur de texte ou un tableur ; selon les réglages régionaux, le tableur peut demander de préciser que le séparateur des colonnes est la virgule.

**Ce qu'il contient.** Du texte, une mesure par ligne, les deux valeurs séparées par une virgule :

```text
seconds,light
0,517
10,522
20,519
0,520
10,518
```

La première ligne est l'en-tête, écrite quand le fichier était vide. Chaque ligne suivante donne le nombre de secondes depuis le démarrage du programme et la valeur lue sur `A0` (broche P3), de 0 à 1023. Le retour du compteur à une petite valeur, ici de `20` à `0`, marque un nouveau démarrage de la carte. Les valeurs de cet extrait sont données pour l'exemple.

:::

<EssayerExemple id="DAPLINK_FLASH/data_logger" />
