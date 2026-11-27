# Bouton « Pile radio » sous les exemples BLE — conception

Issue : [#237](https://github.com/steamicc/wiki_steami/issues/237). Date : 2026-11-27.

## Intention

Les exemples BLE du wiki ne marchent que si la carte a une **pile radio** sur son second cœur. Une carte peut arriver sans pile : c'était le cas de la V1c d'essai, qui n'avait que le FUS, et `BLE.begin()` y renvoyait `0`. Aujourd'hui, pour installer la pile, il faut télécharger DapLink-EasyFlash, choisir le port série et la bonne pile dans une liste où l'option par défaut n'est pas la bonne, puis suivre un journal en anglais ([pile-radio.md](https://github.com/steamicc/wiki_steami/blob/main/docs/software/pile-radio.md)). Une personne qui veut seulement essayer un exemple BLE ne devrait pas avoir à faire tout cela.

Sous chaque exemple BLE, un bouton vérifie la pile radio de la carte depuis le navigateur. Si la pile manque ou est trop ancienne, il propose de l'installer. Comme le bouton « Essayer sur la carte » de MicroPython, il passe par WebUSB et la connexion DAP.js déjà ouverte par la page.

## Objectifs

- Sous chaque exemple BLE des pages Arduino (`<EssayerExemple id="BLE/…" />`), un bouton **Vérifier la pile radio**, à côté des boutons existants.
- Au clic, et après confirmation, la page charge le programme d'installation de DapLink-EasyFlash (l'« operator ») sur le premier cœur, puis lit par le port série la version du FUS et celle de la pile installée.
- Si la pile est la pile épinglée par le wiki (BLE HCI Layer, version épinglée ou plus récente), le dire, puis inviter à téléverser l'exemple.
- Si la pile manque, est plus ancienne ou est d'un autre type, proposer de l'installer. Rien ne s'installe sans un clic sur **Installer la pile radio**. L'installation reprend les étapes d'EasyFlash : DELETE, puis flash de l'operator avec l'image de la pile, puis UPGRADE, puis attente de la fin du travail du second cœur, puis nouvelle lecture des versions.
- Pendant l'installation : progression visible, consignes (ne pas débrancher, ne pas appuyer sur RESET, ne pas fermer la page), et messages d'erreur du FUS traduits en français.
- La page [pile-radio.md](https://github.com/steamicc/wiki_steami/blob/main/docs/software/pile-radio.md) présente le bouton comme le moyen le plus simple, et garde EasyFlash pour les autres cas.

## Non-objectifs

- La mise à jour du FUS. Si le FUS est antérieur à 1.2, le bouton s'arrête et renvoie vers EasyFlash, car une mise à jour du FUS ne peut pas être annulée.
- Les autres piles (Full, extended, Thread, Zigbee…). Seule BLE HCI Layer est proposée : selon l'utilisateur, c'est la seule qui marche à la fois avec Arduino (STM32duinoBLE) et MicroPython (NimBLE).
- Les exemples BLE MicroPython : le wiki n'en a pas encore. Le code de décision et de protocole reste indépendant du type de page, pour pouvoir servir plus tard sous un bloc MicroPython, mais aucun bloc MicroPython ne reçoit le bouton dans cette livraison.
- Un robot qui suit les releases d'EasyFlash : elles sont rares, et l'épinglage se change à la main.
- Le retour automatique au programme d'avant. Après la vérification ou l'installation, la carte garde l'operator jusqu'au prochain téléversement.

## Anti-objectifs (échec même si ça « marche »)

- Une carte laissée dans un état que la page ne sait pas expliquer : sans pile ni consigne, ou avec un FUS bloqué sans message.
- Une action irréversible sans confirmation explicite, ou la mise à jour du FUS, quelle que soit la raison.
- Une écriture dans la zone de la pile qui chevauche le système de fichiers MicroPython. Aujourd'hui, le système de fichiers finit à 0x080C0000. Après le déplacement prévu par wiki-steami-71, il finira à 0x080C4000.
- Toucher au DAPLink, à la zone de configuration ou aux octets d'option.
- Le bouton sous un exemple qui n'utilise pas la radio.

## Contraintes

- **Pile** : BLE_HCILayer v1.20.0 (`stm32wb5xxG_BLE_HCILayer_fw.hex` d'EasyFlash v1.3), 79 092 octets écrits de 0x080E0000 à 0x080F34F4. La pile ne bouge pas avec le travail sur les polices (wiki-steami-d8 et wiki-steami-71, 2026-11-27) : c'est le système de fichiers MicroPython qui monte de 16 Ko, et il restera 112 Ko libres sous la pile.
- **Programme d'installation** : `wb55_operator.hex` (81 116 octets à partir de 0x08000000), et `wb55_operator_no_end.hex`, le même sans enregistrement de fin Intel HEX, que EasyFlash met devant l'image de la pile pour tout flasher en une fois.
- **Protocole de l'operator** (EasyFlash `src/ui/tab_wireless_stack.rs` et `src/operator_tool.rs`, et les chaînes du binaire `wb55_operator_no_end.hex`) : liaison série à 115200 bauds, réponses JSON d'une ligne terminée par `\n`. Commandes : `STATUS\n`, `VERSION\n`, `DELETE\n` et `UPGRADE\n`, utilisées par EasyFlash, et `START\n` (relance la pile), `RESET\n` et `HELP\n`, qu'il n'utilise pas.
  - `VERSION` → `{"status", "fus_version", "copro_fw_version", "ws_version"}`. `fus_version` est un entier dont l'octet de poids fort est le majeur et le suivant le mineur.
  - `STATUS` a deux formes de réponse : `{"status", "error"}`, et `{"status", "last_fus_status", "last_ws_status", "current_ws"}`, lue dans l'en-tête de la table d'informations du FUS. `current_ws` donne le type de la pile installée.
  - UPGRADE répond d'abord `{"command": "Upgrade", "status"}` (acceptation de la commande, sans champ `error`), puis des lignes `{"command": "Upgrade(status)", "status", "error"}`. La valeur de status donne l'étape : 0x10 et plus, mise à jour de la pile en cours ; 0x20 et plus, mise à jour du FUS en cours ; 0x30 et plus, service en cours. EasyFlash s'arrête au premier `status == 0` : il ne voit que l'acceptation, pas le résultat du FUS.
  - Codes d'erreur du FUS de 0x00 à 0x11 : liste et textes dans `operator_error_string`.
  - STATUS doit être envoyé deux fois : le premier appel fait passer le second cœur de la pile au FUS, le second donne l'état réel.
  - EasyFlash attend 1 s après chaque commande avant de lire, fait jusqu'à trois essais pour STATUS et DELETE, attend 5 s avant UPGRADE, et donne 10 s par ligne pendant UPGRADE.
- **Après UPGRADE** : l'operator répond `status 0`, puis se tait pendant que le second cœur redémarre (mémoire du projet, essai du 2026-11-26). La page EasyFlash du wiki demande d'attendre encore une minute avant de débrancher. Ne pas réinitialiser la carte pendant ce temps.
- **Ordre imposé** : une pile installée protège sa zone de la flash. Il faut donc DELETE avant d'écrire la nouvelle image, et l'operator doit rester en 0x08000000 pour recevoir UPGRADE. D'où le flash de l'operator et de la pile ensemble, après DELETE.
- **Transport** : carte.mjs (connexion DAP.js partagée, `flasherFirmware`, écriture et lecture série brutes). `setSerialBaudrate` redémarre la carte : la page ne l'appelle qu'à la connexion, jamais pendant l'installation. Après un flash par DAP.js, la cible redémarre.
- **Activation et fenêtre de choix** : la connexion suit les règles de carte.mjs. La reprise d'une carte déjà autorisée (issue #236) est sur la branche `docs/guide-essayer-micropython`, pas encore dans `main` : partir de `main`, n'ajouter à carte.mjs que du code nouveau sans changer l'existant, et rebaser une fois #236 fusionnée.
- **Licence** : les images de la pile et l'operator sont des binaires de STMicroelectronics, redistribués par EasyFlash sans texte de licence. Le wiki les sert lui-même, comme EasyFlash, sans ajouter de texte de licence (choix de l'utilisateur). Les fichiers des releases GitHub ne sont pas téléchargeables depuis une page (pas d'en-têtes CORS) : il faut donc les servir depuis le wiki.
- **DAPLink** : l'installation exige le DAPLink épinglé (`daplink.json`, 2026-11-25.3), car un flash qui échoue après DELETE laisse la carte sans pile (choix de l'utilisateur). Voir Décision 3.
- **Partage de la carte** : la V1c est partagée entre sessions (créneau à demander à wiki-steami-71). Aucun essai réel qui touche à la pile sans l'accord explicite de l'utilisateur.
- **Wiki** : ton neutre (infinitif, ni tu ni vous), sommaire sur les pages longues, CSpell, markdownlint, prettier, tests `node --test`.

## Approches considérées

1. **Reprendre la procédure d'EasyFlash en JavaScript avec DAP.js (retenue).** La page flashe l'operator, lui parle par la liaison série de DAP.js, puis flashe l'operator et la pile ensemble. Elle réutilise l'outillage de l'installation MicroPython, sur une procédure déjà validée sur la V1c. Le risque est que le flux de flash du DAPLink (vendeur `FLASH_OPEN/WRITE/CLOSE` de DAP.js) n'accepte pas un .hex qui écrit à 0x080E0000, ou qu'il efface toute la puce. Un essai le lève avant toute autre chose (Décision 6).
2. **Un programme d'installation autonome**, écrit en C, qui contient la pile et s'installe tout seul. Le JavaScript serait plus simple, mais il faudrait maintenir un nouveau firmware dans un autre dépôt, et on s'éloignerait de la procédure vérifiée. Écartée.
3. **Piloter le FUS par SWD** (écriture en mémoire partagée et IPCC depuis le débogueur). Trop fragile. Écartée.

L'utilisateur a choisi l'option A pour l'affichage : le bouton est toujours visible sous les exemples BLE, la version se lit au clic, et le programme de la carte est remplacé par l'operator pour cette lecture. Il a choisi l'approche 1 pour la réalisation.

## Décisions

### 1. Fichiers épinglés

- `pile-radio.json` à la racine, sur le modèle de `micropython.json` et `daplink.json` : la release d'EasyFlash (`v1.3`), puis le nom et le sha256 de chaque fichier (`wb55_operator.hex`, `wb55_operator_no_end.hex`, `stm32wb5xxG_BLE_HCILayer_fw.hex`), et la version attendue de la pile (`1.20.0`, type HCI Layer).
- Le script de prebuild (dans `scripts/fetch-firmwares.sh` ou un script voisin) télécharge les trois fichiers au tag épinglé et vérifie leurs empreintes. Il les sert dans `/pile-radio/`, avec un `index.json` qui dit la version attendue. Le .hex fusionné (operator sans fin, puis la pile) est construit au build, pas dans le navigateur.

### 2. Où le bouton apparaît

- Tout `<EssayerExemple id="BLE/…" />` reçoit le bouton. Le préfixe de l'id suffit : pas de nouvelle marque à poser à la main.
- Le bouton n'est actif que lorsque la carte est connectée et qu'aucune opération ne tourne, comme **Téléverser**. Sans WebUSB, il n'apparaît pas, et la page renvoie vers [pile-radio.md](https://github.com/steamicc/wiki_steami/blob/main/docs/software/pile-radio.md).

### 3. Déroulement

1. Clic sur **Vérifier la pile radio**. Un encart dit que la vérification remplace le programme de la carte (MicroPython et ses fichiers compris), et propose **Continuer** ou **Annuler**. (Proposition de l'assistant : l'option A accepte l'effacement, mais une carte sous MicroPython peut contenir des fichiers de la personne.)
2. Flash de `wb55_operator.hex`, puis attente du démarrage, puis double STATUS, puis VERSION.
3. Décision (fonction pure, testée) :
   - FUS de majeur 0, ou 1 avec un mineur inférieur à 2 : arrêt. Message : le FUS est trop ancien pour le bouton, utiliser EasyFlash. Lien vers la page.
   - FUS de majeur supérieur à 1 : arrêt prudent, même message. (EasyFlash essaie quand même ; le wiki ne le fait pas.)
   - Pile HCI Layer (`current_ws`, lu dans la seconde réponse du double STATUS, égal à la valeur relevée sur la V1c par l'essai préalable) de version supérieure ou égale à l'épinglée : `START` pour relancer la pile, puis « La pile radio est à jour » et invitation à téléverser l'exemple. Si l'essai montre que HCI Layer et HCI Layer extended donnent le même `current_ws`, le noter comme limite dans pile-radio.md. (Décision de l'assistant.)
   - Sinon (pas de pile, ancienne version, autre type, `current_ws` inconnu) : encart de proposition. Si le DAPLink n'est pas l'épinglé, l'encart ne propose pas **Installer la pile radio**. Il explique pourquoi et propose la mise à jour guidée du DAPLink, celle du parcours MicroPython. Un DAPLink d'origine, dont la version ne se lit pas, compte comme non épinglé. La vérification, elle, reste possible avec « Plus tard ». Il donne la version trouvée (ou « aucune pile ») et celle qui sera installée, la durée, les consignes, et le fait que l'ancienne pile est effacée. Boutons **Installer la pile radio** et **Annuler**.
4. Installation : DELETE (trois essais), double STATUS, flash du .hex fusionné, 5 s d'attente, UPGRADE. La page suit ensuite les lignes JSON. Le premier `status 0` veut seulement dire « commande acceptée », pas « réussi ». Toute erreur non nulle s'affiche avec un texte français et un renvoi vers EasyFlash.
5. Après l'acceptation : attente d'une minute avec un décompte visible, sans rien envoyer à la carte. Ensuite : double STATUS, lecture de `error`, `last_fus_status` et `last_ws_status`, puis VERSION et `START`. (Décision de l'assistant.)
   - Un état de 0x10 à 0x3F veut dire que le second cœur travaille encore : attendre de nouveau, avec une limite de temps et un message. Ne jamais envoyer DELETE ni reproposer l'installation à ce moment-là.
   - L'installation ne se repropose que si le FUS est au repos (0x00) et qu'aucune pile n'est trouvée.
   - Si l'operator ne répond pas, le dire sans conclure à un échec, et conseiller de téléverser l'exemple, qui dira si `BLE.begin()` réussit.
6. Fin : l'état revient à « Carte : connectée », et un message invite à téléverser l'exemple.

### 4. Code

- `src/components/PileRadio/` (nom au choix du constructeur) : logique pure (décodage des versions, décision, textes d'erreur du FUS, lecture des lignes JSON) et déroulement testable avec une fausse liaison série, sur le modèle de `EssayerMicroPython/deroulement.mjs`.
- carte.mjs : ce qu'il faut pour flasher un .hex (si le flux du DAPLink l'accepte) et lire des lignes sur la liaison série. Aucun changement de comportement pour les pages Arduino et MicroPython existantes.
- `EssayerExemple/index.js` : le bouton et ses encarts pour les ids `BLE/…`, avec les mêmes règles de focus et d'état que le reste du composant.

### 5. Pages

- [pile-radio.md](https://github.com/steamicc/wiki_steami/blob/main/docs/software/pile-radio.md) : nouvelle section avant EasyFlash, « Depuis le wiki », qui explique le bouton, ses limites (FUS trop ancien, autres piles) et la durée mesurée.
- [ble.md](https://github.com/steamicc/wiki_steami/blob/main/docs/software/arduino/exemples/ble.md) : une phrase au début, qui dit quand utiliser le bouton.

### 6. Essais et livraison

- **Essai préalable, avant tout code** (avec l'accord de l'utilisateur, la carte demandée à wiki-steami-71). Il porte sur trois points :
  - DAP.js flashe `wb55_operator.hex` par le flux du DAPLink, puis VERSION répond par la liaison série de DAP.js ;
  - VERSION sur la V1c actuelle donne les valeurs attendues pour HCI Layer v1.20.0, ce qui fixe le décodage de `ws_version` et de `copro_fw_version` ;
  - le flash par DAP.js d'un .hex de 0x08000000 à 0x080F34F4 n'efface pas toute la puce et écrit bien à 0x080E0000.

  Ce dernier point se vérifie sans pile en jeu : écrire un .hex de test dans une zone libre au-dessus du système de fichiers et sous la pile (par exemple 0x080D0000), puis relire par SWD. Vérifier aussi qu'une zone hors du .hex (par exemple vers 0x080D8000, ou le système de fichiers MicroPython) garde son contenu, par une lecture SWD avant et après. Si toute la puce est effacée, ce n'est pas bloquant : la zone de la pile est protégée par le FUS, et l'étape 1 annonce déjà la perte des fichiers ; il suffit d'ajuster le texte. Vérifier enfin qu'une installation MicroPython ou un téléversement Arduino par DAP.js laisse la pile en place, en lisant `stm.rfcore_fw_version(1)` après.

  Sur la pile en place : double STATUS, VERSION, puis `START`, puis téléversement de BleBeacon et contrôle que `BLE.begin()` vaut 1. Essayer aussi VERSION sans STATUS, et une réinitialisation sans `START`. Si `START` ne suffit pas à relancer la pile, revenir à la conception.

  Si le flux refuse le .hex, revenir à la conception avant de coder, par exemple pour écrire en .bin aligné.

- **Essai complet sur la V1c, avec l'accord explicite de l'utilisateur** : réinstallation de la même version, en forçant la décision, puis vérification par un exemple BLE. battery_status est remis à la fin.
- Une issue, puis une PR pour la conception et une PR pour la réalisation, comme pour MicroPython.

## Laissé au constructeur

- Les libellés exacts des boutons et des messages, en restant au ton neutre.
- Le nom du dossier du composant et le découpage des modules.
- Les délais intermédiaires, qui reprennent ceux d'EasyFlash sauf mesure contraire.
