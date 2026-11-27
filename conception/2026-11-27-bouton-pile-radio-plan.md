# Bouton « Pile radio » sous les exemples BLE — plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** sous chaque `<EssayerExemple id="BLE/…" />`, un bouton **Vérifier la pile radio** qui lit la pile radio de la carte par WebUSB et, si elle manque ou est périmée, installe BLE HCI Layer v1.20.0 après confirmation.

**Architecture :** la procédure de DapLink-EasyFlash est reprise en JavaScript. La page flashe l'operator par la connexion DAP.js de `carte.mjs`, lui parle en JSON par la liaison série brute, puis flashe l'operator et la pile ensemble et envoie UPGRADE. La logique pure, le protocole de l'operator et le déroulement sont des modules `.mjs` testés avec `node --test` et une fausse liaison série. Le bouton et ses encarts s'ajoutent au composant `EssayerExemple`.

**Tech Stack :** Docusaurus 3.9 / React 19, DAP.js 2.3.0 (vendu dans `static/`), WebUSB, `node --test`, bash et pytest pour le prebuild.

**Spec :** `conception/2026-11-27-bouton-pile-radio-design.md` (issue [#237](https://github.com/steamicc/wiki_steami/issues/237)).

## Global Constraints

- Pile épinglée : `stm32wb5xxG_BLE_HCILayer_fw.hex` de DapLink-EasyFlash **v1.3**, sha256 `df6da5ab4e5ff47a9302e5f089fb2f5c207972e7234b6a812fe71a68f8ad9b24`, écrite de 0x080E0000 à 0x080F34F4, version attendue **1.20.0**.
- Operator : `wb55_operator.hex` (sha256 `0801ec7ec78dff3791061a748d64bd893ffc36a9c1c68b0df561a11037c56057`), à partir de 0x08000000 ; `wb55_operator_no_end.hex` (sha256 `81b2517f3e6e3752e740315de1c368326ecdada714dc03b3a087ab03f8a6d561`), le même sans enregistrement de fin.
- Source des fichiers : `https://raw.githubusercontent.com/steamicc/DapLink-EasyFlash/v1.3/wireless_stack/<nom>`, servis par le wiki sous `/pile-radio/`, sans texte de licence ajouté (choix de l'utilisateur).
- Protocole : 115200 bauds, commandes `STATUS\n`, `VERSION\n`, `DELETE\n`, `UPGRADE\n`, `START\n`, réponses JSON d'une ligne terminée par `\n`. STATUS toujours par deux. 1 s d'attente après chaque commande, trois essais pour STATUS et DELETE, 5 s d'attente avant UPGRADE, 10 s au plus par ligne pendant UPGRADE. Le premier `status 0` d'UPGRADE veut dire « commande acceptée ». Après l'acceptation : 60 s d'attente sans rien envoyer, puis relecture.
- FUS accepté : majeur 1 et mineur supérieur ou égal à 2. Tout autre FUS arrête le bouton et renvoie vers EasyFlash. Le bouton ne met **jamais** le FUS à jour.
- L'installation exige le DAPLink épinglé (`daplink.json`, release `2026-11-25.3`). Un DAPLink dont la version ne se lit pas compte comme non épinglé. La vérification reste possible avec « Plus tard ».
- Deux confirmations : avant la vérification (le programme de la carte est remplacé, MicroPython et ses fichiers compris), et avant l'installation.
- Le bouton n'apparaît que pour les ids `BLE/…`, et seulement avec WebUSB.
- Ne jamais toucher au DAPLink, à la zone de configuration ni aux octets d'option. Ne jamais écrire sous 0x080C4000 hors de l'operator.
- Pages : ton neutre (infinitif, ni tu ni vous), CSpell, markdownlint, prettier. Commits conventionnels en français, sans ligne d'attribution, un commit par étape logique.
- Carte : partagée. Une tâche qui touche la carte se fait par le contrôleur, avec un créneau demandé à wiki-steami-71 et l'accord explicite de l'utilisateur ; battery_status est remis à la fin.
- Base : `main`. carte.mjs ne gagne que du code nouveau, pour se rebaser sans conflit sur la reprise de carte de #236 (branche `docs/guide-essayer-micropython`).

## Review Focus

1. **Ligne série inattendue.** Lignes partielles, lignes vides, texte non JSON (bannière de l'operator, écho), ou JSON coupé en deux paquets : le lecteur de lignes recolle, ignore ce qui n'est pas du JSON, et ne prend jamais une ligne pour une autre réponse. Tests en Tâche 2.
2. **Carte débranchée ou perdue en plein parcours**, surtout entre DELETE et la fin d'UPGRADE : message qui dit l'état probable (pile peut-être effacée) et renvoie vers le bouton ou EasyFlash, sans réessai automatique. Tests en Tâche 4.
3. **UPGRADE qui ne finit pas** : aucune ligne pendant 10 s, ou un état de 0x10 à 0x3F qui dure après la relecture. Le parcours s'arrête avec un message, sans jamais envoyer DELETE ni reproposer l'installation. Tests en Tâches 3 et 4.
4. **DAPLink non épinglé ou illisible** : la vérification passe, mais **Installer** n'est pas proposé, et la mise à jour guidée s'affiche. Tests en Tâche 4.
5. **Autres boutons pendant le parcours** : Téléverser, un autre exemple, Déconnecter, quitter la page. Ces boutons sont inactifs pendant le parcours, et la page demande confirmation avant de se fermer pendant l'installation. Tests en Tâches 4 et 5.

---

### Task 0: Essai préalable sur la V1c (contrôleur, avec l'utilisateur)

**Faite le 2026-11-27** : résultats dans la section « Résultats de l'essai préalable » de la conception. Le flux du DAPLink accepte le .hex, chaque flash efface toute la flash non protégée sauf la pile, `current_ws` ne donne pas le type (la pile se reconnaît à `copro_fw_version` et à sa taille en secteurs), et seul `START` relance la pile après un double STATUS. Les étapes ci-dessous sont gardées pour mémoire ; le SWD a été abandonné (il échoue quand l'operator tourne), et les lectures de flash se sont faites depuis MicroPython.

Cette tâche n'est pas confiée à un sous-agent. Elle demande l'accord explicite de l'utilisateur, car STATUS fait passer le second cœur au FUS, et un créneau sur la carte.

**Files :**

- Create (hors dépôt, dans le scratchpad) : une page d'essai HTML qui charge DAP.js depuis le build du wiki et expose `connecter`, `flasher(url)`, `serie(commande)`, `lireMemoire(adresse, mots)` au CDP.
- Modify : `conception/2026-11-27-bouton-pile-radio-design.md` (résultats).

**Interfaces :**

- Produces : `CURRENT_WS_HCI_LAYER` (valeur de `current_ws` pour HCI Layer v1.20.0) et le codage de `ws_version` et de `fus_version`, relevés sur la carte. Également : le flux de flash du DAPLink accepte-t-il un `.hex` ? Efface-t-il toute la puce ? `START` relance-t-il la pile ?

- [ ] **Step 1 :** demander un créneau à wiki-steami-71 et l'accord de l'utilisateur pour STATUS, VERSION et START sur la V1c.
- [ ] **Step 2 :** Chrome sous Xvfb (`--ozone-platform=x11`), page d'essai. Relever la version du DAPLink (`0x9F`). Relire par SWD 32 octets en 0x080D8000 (témoin).
- [ ] **Step 3 :** flasher `wb55_operator.hex` par `dap.flash` avec le texte du .hex. Attendu : flash sans erreur.
- [ ] **Step 4 :** sur la liaison série, envoyer `VERSION` seul, puis `STATUS`, `STATUS`, `VERSION`, puis `START`. Noter chaque ligne brute, ce qui fixe `current_ws` et le codage des versions. Relire le témoin en 0x080D8000.
- [ ] **Step 5 :** flasher par le flux du DAPLink un .hex fait de `wb55_operator_no_end.hex` suivi de 16 octets connus en 0x080D0000 et d'un enregistrement de fin. Relire 0x080D0000 par SWD : les octets doivent y être, et le témoin en 0x080D8000 doit être inchangé.
- [ ] **Step 6 :** installer MicroPython par le bouton du wiki, puis lancer `import stm; print(stm.rfcore_fw_version(1))` et `import bluetooth; bluetooth.BLE().active(True)`. Attendu : (1, 20, 0, …) et aucune erreur.
- [ ] **Step 7 :** remettre battery_status par glisser-déposer et le vérifier sur la liaison série. Rendre la carte.
- [ ] **Step 8 :** reporter les résultats dans la conception (section Contraintes), puis committer : `docs(conception): résultats de l'essai préalable de la pile radio`.

Si le Step 3 ou le Step 5 échoue, ou si le Step 6 montre que la pile n'a pas été conservée, arrêter et revenir à la conception avec l'utilisateur. Les tâches suivantes ne démarrent pas.

### Task 1: Fichiers épinglés et prebuild

**Files :**

- Create : `pile-radio.json`
- Modify : `scripts/fetch-firmwares.sh`, `scripts/tests/test_fetch_firmwares.py`, `.gitignore` si `static/pile-radio/` n'y est pas couvert, `package.json` uniquement si un nouveau script est nécessaire.

**Interfaces :**

- Produces : au build, `static/pile-radio/operateur.hex` (copie de `wb55_operator.hex`), `static/pile-radio/installation.hex` (concaténation de `wb55_operator_no_end.hex` puis `stm32wb5xxG_BLE_HCILayer_fw.hex`) et `static/pile-radio/index.json` = `{"release": "v1.3", "pile": "BLE HCI Layer", "version": "1.20.0", "secteurs": 20}`.
- `pile-radio.json` = `{"release": "v1.3", "version": "1.20.0", "secteurs": 20, "fichiers": {"wb55_operator.hex": "<sha>", "wb55_operator_no_end.hex": "<sha>", "stm32wb5xxG_BLE_HCILayer_fw.hex": "<sha>"}}`, avec les empreintes des Global Constraints.

- [ ] **Step 1 : tests qui échouent**, dans `test_fetch_firmwares.py`, sur le modèle des tests DAPLink existants (serveur local, variable d'hôte). Variable `PILE_RADIO_URL_BASE`, par défaut `https://raw.githubusercontent.com`.
  - `test_pile_radio_installe_les_trois_fichiers` : `operateur.hex`, `installation.hex` et `index.json` présents. `installation.hex` égal à la concaténation exacte des deux fichiers. `index.json` avec les valeurs ci-dessus.
  - `test_pile_radio_sha_different_echoue` : un fichier modifié fait sortir le script en erreur, et l'existant reste en place.
  - `test_pile_radio_deja_presente_pas_de_telechargement` : rien n'est téléchargé quand tout est à jour.
- [ ] **Step 2 :** lancer `python3 -m pytest scripts/tests/test_fetch_firmwares.py -q`. Attendu : les trois nouveaux tests échouent.
- [ ] **Step 3 :** implémenter dans `fetch-firmwares.sh` une section `# --- Pile radio ---`, qui réutilise `telecharger` et `installer` (préparation dans `.external`, échange par renommage).
- [ ] **Step 4 :** relancer pytest, puis `bash scripts/fetch-firmwares.sh` (vrai téléchargement). Attendu : tous les tests passent, et les trois fichiers sont dans `static/pile-radio/`.
- [ ] **Step 5 :** commit `feat(configs): épingler la pile radio BLE HCI Layer d'EasyFlash v1.3`.

### Task 2: Logique pure de la pile radio

**Files :**

- Create : `src/components/PileRadio/logique.mjs`, `src/components/PileRadio/logique.test.mjs`

**Interfaces :**

- Produces :
  - `decoderVersion(entier) → { majeur, mineur, sous }` : octet 31-24 majeur, 23-16 mineur, 15-8 sous-version (Tâche 0 : 0x01020000 → 1.2.0, 0x01140002 → 1.20.0).
  - `decisionFus(fusVersion) → 'ok' | 'ancien' | 'inconnu'`.
  - `lirePileEnMarche(reponseVersion) → { version: string | null, secteurs: number }` : lit la réponse de VERSION envoyée **avant** le double STATUS. `version` est `copro_fw_version` (null s'il est vide ou « 0.0.0 »), et `secteurs` l'octet de poids faible de `ws_version` (Tâche 0 : 118292500 = 0x070D0014 → 20).
  - `decisionPile({ version, secteurs }, epinglee) → 'a-jour' | 'absente' | 'ancienne' | 'plus-recente' | 'autre'`, où `epinglee` = `{ version: '1.20.0', secteurs: 20 }`. Même version et même taille : `a-jour`. Version inférieure : `ancienne`. Version supérieure : `plus-recente`. Même version, autre taille : `autre`.
  - `etatFus(status) → 'repos' | 'pile' | 'fus' | 'service' | 'inconnu'` (0, 0x10-0x1F, 0x20-0x2F, 0x30-0x3F).
  - `texteErreurFus(code) → string`, en français, pour les codes 0x00 à 0x0A et 0x11, avec un texte générique pour les autres.
  - `class LecteurLignes { ajouter(octets: Uint8Array): object[] }` : recolle les paquets, coupe sur `\n`, retire `\r`, et ne rend que les lignes qui sont un objet JSON. Le reste est ignoré.

- [ ] **Step 1 : tests qui échouent**
  - `decoderVersion` : la valeur relevée pour le FUS 1.2.0 donne `{1,2,0}`, celle de la pile 1.20.0 donne `{1,20,0}`, et 0 donne `{0,0,0}`.
  - `decisionFus` : 0.x et 1.1 donnent `ancien`, 1.2 donne `ok`, 2.0 donne `inconnu`.
  - `lirePileEnMarche` : la ligne réelle de la Tâche 0 (`{"command": "Version", "status": 0, "fus_version": 0, "copro_fw_version": "1.20.0", "ws_version": 118292500}`) donne `{ version: '1.20.0', secteurs: 20 }` ; `copro_fw_version` vide ou « 0.0.0 » donne `version: null`.
  - `decisionPile` :
    - `version` null donne `absente` ;
    - 1.20.0 et 20 secteurs donne `a-jour` ;
    - 1.19.0 donne `ancienne`, 1.21.0 donne `plus-recente` ;
    - 1.20.0 et 25 secteurs donne `autre`.
  - `etatFus` : 0, 0x10, 0x1F, 0x20, 0x30, 0x3F et 0x40 donnent les états attendus.
  - `texteErreurFus(4)` mentionne le manque de place, et `texteErreurFus(0x99)` donne le texte générique.
  - `LecteurLignes` :
    - `{"a":1}\n` en deux paquets donne un seul objet ;
    - `\r\n` est accepté ;
    - une ligne non JSON est ignorée ;
    - deux lignes dans un seul paquet donnent deux objets ;
    - un tableau JSON est ignoré.
- [ ] **Step 2 :** `node --test src/components/PileRadio/logique.test.mjs`. Attendu : échec, module absent.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** relancer. Attendu : tout passe.
- [ ] **Step 5 :** commit `feat(software): logique de décision de la pile radio`.

### Task 3: Protocole de l'operator

**Files :**

- Create : `src/components/PileRadio/operateur.mjs`, `src/components/PileRadio/operateur.test.mjs`

**Interfaces :**

- Consumes : `LecteurLignes` (Tâche 2).
- Produces : `creerOperateur({ ecrire, ecouter, attendre }) → { statusDouble(), version(), supprimer(), relancer(), upgrade({ surLigne }) }`.
  - `ecrire(octets: Uint8Array) → Promise`, et `ecouter(fn(octets)) → retirer`, comme `carte.ecrireSerie` et `carte.ecouterSerie`.
  - `attendre(ms) → Promise` est injectable, pour les tests.
  - Chaque commande écrit `NOM\n`, attend 1 s, puis rend la première ligne JSON reçue.
  - `statusDouble()` envoie deux STATUS, avec trois essais chacun, et rend la seconde réponse. Comportement relevé en Tâche 0 : le premier répond `{"command": "Status", "status": 255, "error": 254}` (normal, ce n'est pas une erreur), le second ne répond souvent pas (le second cœur bascule), et un essai suivant, 2 s plus tard, répond `{"command": "Status", "status": 0, "last_fus_status": 0, "last_ws_status": 0, "current_ws": 1}`. La seconde réponse valable est celle qui contient `last_fus_status`.
  - `relancer()` envoie `START`, qui ne répond rien : elle se termine après 1 s, sans attendre de ligne.
  - `supprimer()` envoie DELETE avec trois essais.
  - `upgrade({ surLigne })` attend 5 s, envoie UPGRADE, appelle `surLigne(objet)` pour chaque ligne, et se termine sur le premier `status === 0` (acceptation) ou sur une ligne d'`error` non nul, qu'elle rejette avec `ErreurFus(code)`. Aucune ligne pendant 10 s : rejet avec `ErreurDelaiOperateur`.
  - `ErreurDelaiOperateur` et `ErreurFus` sont exportées.

- [ ] **Step 1 : tests qui échouent**, avec une fausse carte qui répond selon un script :
  - `statusDouble` : séquence réelle de la Tâche 0 (réponse 255/254, silence, puis réponse avec `last_fus_status`) rendue comme succès avec la dernière réponse ; premier STATUS sans réponse, réessayé, puis réussite ; trois échecs, rejet `ErreurDelaiOperateur`.
  - `relancer` : écrit `START\n` et se termine sans ligne reçue.
  - `version` : la ligne VERSION est rendue même précédée d'une ligne non JSON.
  - `upgrade` :
    - 5 s attendues avant l'écriture ;
    - `{"command":"Upgrade","status":0}` termine la commande ;
    - une ligne `error: 4` rejette `ErreurFus(4)` ;
    - un silence de 10 s rejette ;
    - `surLigne` reçoit chaque ligne.
  - Une réponse tardive, arrivée après un délai dépassé, n'est jamais prise pour la réponse de la commande suivante.
- [ ] **Step 2 :** lancer le fichier. Attendu : échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** relancer. Attendu : tout passe.
- [ ] **Step 5 :** commit `feat(software): protocole de l'operator d'EasyFlash`.

### Task 4: Déroulement (vérification et installation)

**Files :**

- Create : `src/components/PileRadio/deroulement.mjs`, `src/components/PileRadio/deroulement.test.mjs`
- Modify : `src/components/EssayerExemple/carte.mjs`, seulement si la Tâche 0 montre qu'il faut une fonction pour flasher un `.hex` texte. Ajouter alors une fonction nouvelle, sans changer `flasherFirmware`.

**Interfaces :**

- Consumes : `carte` (`flasherFirmware(id, url)`, `ecrireSerie`, `ecouterSerie`, `lireVersionDaplink`, `etat`), `creerOperateur`, la logique de la Tâche 2, et `lireFirmwareEpingle` et `decisionMiseAJour` de `src/components/EssayerMicroPython/logique.mjs`.
- Produces : `creerParcoursPile()`, qui renvoie une session observable sur le modèle de `creerSession` de `EssayerMicroPython/deroulement.mjs` :
  - méthodes `verifier(id, deps)`, `confirmer(choix)` et `annuler()` ;
  - état `{ etape, id, encart, message, erreur, decompte, versions }` ;
  - `etape` ∈ `repos | confirmation-verification | operateur | lecture | a-jour | proposition | daplink | suppression | ecriture | upgrade | attente | relecture | fini | erreur` ;
  - `estOccupee(etat)` vaut vrai de `operateur` à `relecture` ;
  - `DELAIS_PILE` = `{ apresCommande: 1000, avantUpgrade: 5000, ligneUpgrade: 10000, attenteApresUpgrade: 60000, relectureMax: 120000, pasRelecture: 10000 }`, injectable.
  - Indicateur de développement, documenté dans le code seulement : `localStorage['steami-pile-radio-forcer'] === '1'` fait proposer l'installation même quand la pile est à jour. Il sert à l'essai complet.

- Ordre des lectures (Tâche 0) : VERSION **avant** le double STATUS (version et taille de la pile, `lirePileEnMarche`), puis double STATUS, puis VERSION (version du FUS). Dès que le double STATUS a été envoyé, toute fin de parcours (à jour, refus du FUS, DAPLink non épinglé, Annuler, erreur, abandon du bloc) envoie `relancer()` tant que DELETE n'a pas été envoyé : une réinitialisation ne relance pas la pile.

- [ ] **Step 1 : tests qui échouent**, sur une fausse carte et un faux operator :
  - vérification sans confirmation : rien n'est flashé ;
  - FUS 1.1 : étape `erreur`, message qui renvoie vers EasyFlash, aucun DELETE, `START` envoyé ;
  - proposition puis `annuler()`, et DAPLink non épinglé puis « Plus tard » : `START` envoyé dans les deux cas ;
  - erreur de liaison série après le double STATUS : `START` tenté avant l'étape `erreur` ;
  - pile à jour : `START` envoyé, étape `a-jour` ;
  - pile absente et DAPLink épinglé : `proposition` ; `confirmer('installer')` enchaîne DELETE, flash d'`installation.hex`, upgrade, décompte de 60 s, `statusDouble`, `version`, `START`, et finit sur `fini` avec la version relue ;
  - pile absente et DAPLink non épinglé, ou illisible (`null`) : étape `daplink`, sans bouton installer ; `confirmer('plus-tard')` revient à `repos` sans rien installer ;
  - relecture avec un état 0x10 : nouvelles relectures toutes les 10 s jusqu'à 120 s, puis erreur, sans DELETE ;
  - `ErreurFus(4)` pendant l'upgrade : message en français avec le texte du code ;
  - carte perdue entre DELETE et la fin : message « pile peut-être effacée », aucun réessai ;
  - pendant le parcours, `estOccupee` est vrai et une seconde `verifier` est refusée ;
  - indicateur `forcer` : la pile à jour donne `proposition`.
- [ ] **Step 2 :** lancer. Attendu : échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** relancer, puis `npm run test:js`. Attendu : tout passe.
- [ ] **Step 5 :** commit `feat(software): déroulement de la vérification et de l'installation de la pile radio`.

### Task 5: Bouton et encarts dans EssayerExemple

**Files :**

- Create : `src/components/PileRadio/index.js`, le bloc React (bouton, encarts, décompte, messages), et `src/components/EssayerExemple/EtapesDaplink.js`, l'affichage de la mise à jour guidée du DAPLink déplacé depuis `EssayerMicroPython/index.js`, sans changement de rendu.
- Modify : `src/components/EssayerExemple/index.js` (rendu de `<PileRadio id={id} />` quand `id.startsWith('BLE/')` et que WebUSB est disponible), `src/components/EssayerMicroPython/index.js` (import du composant déplacé), `src/components/EssayerExemple/styles.module.css` si besoin.

**Interfaces :**

- Consumes : `creerParcoursPile`, `estOccupee`, `carte.etat`, et les URL `/pile-radio/operateur.hex`, `/pile-radio/installation.hex`, `/pile-radio/index.json`, `/daplink/firmware.json` et `/daplink/firmware.bin` par `useBaseUrl`.
- Textes, au ton neutre, choisis par l'implémenteur et approuvés en relecture :
  - les deux confirmations ;
  - la proposition, avec la version trouvée, la version à installer, la durée et les consignes (ne pas débrancher, ne pas appuyer sur RESET, ne pas fermer la page) ;
  - le refus pour cause de FUS ;
  - le message « à jour » ;
  - la fin, qui invite à téléverser l'exemple.

- [ ] **Step 1 :** déplacer `EtapesDaplink` et vérifier que `npm run test:js` passe et que la page MicroPython rend la même chose (build). Commit `refactor(software): mise à jour guidée du DAPLink partagée`.
- [ ] **Step 2 :** écrire le bloc. Bouton **Vérifier la pile radio**, inactif quand la carte n'est pas connectée ou que `carte.etat.occupee` ou `estOccupee` est vrai. Encarts avec focus et retour du focus sur le bouton, comme pour MicroPython. Décompte visible pendant `attente`. `beforeunload` actif de `suppression` à `relecture`. Pendant le parcours, Téléverser et Déconnecter sont inactifs dans tous les exemples de la page.
- [ ] **Step 3 :** `npm run test:js`, `npm run lint:js`, `npm run build`. Attendu : tout passe, et la page `docs/software/arduino/exemples/ble` contient six boutons **Vérifier la pile radio**. Les autres pages n'en ont aucun.
- [ ] **Step 4 :** commit `feat(software): bouton Vérifier la pile radio sous les exemples BLE`.

### Task 6: Pages

**Files :**

- Modify : `docs/software/pile-radio.md`, `docs/software/arduino/exemples/ble.md`, `.cspell/steami.txt` si un mot manque.

- [ ] **Step 1 :** dans `pile-radio.md`, ajouter une section **Depuis le wiki** avant « Installer la pile ». Elle dit :
  - où est le bouton ;
  - les deux confirmations, et le fait que le programme de la carte est remplacé ;
  - ce qui est installé (BLE HCI Layer 1.20.0) ;
  - la condition sur le DAPLink ;
  - les limites (FUS antérieur à 1.2, autres piles), qui renvoient vers EasyFlash ;
  - la durée mesurée en Tâche 7 ;
  - qu'il faut téléverser l'exemple ensuite.

  Mettre à jour le sommaire si la page en a un.

- [ ] **Step 2 :** dans `ble.md`, une phrase en tête : si `BLE.begin()` échoue, ou avant le premier essai sur une carte neuve, utiliser **Vérifier la pile radio**, avec un lien vers la section.
- [ ] **Step 3 :** `npm run lint:md` et `npm run lint:spell`. Attendu : 0 problème.
- [ ] **Step 4 :** commit `docs(software): installer la pile radio depuis le wiki`.

### Task 7: Essai complet dans Chrome (contrôleur, avec l'utilisateur)

Cette tâche n'est pas confiée à un sous-agent. Elle demande un créneau auprès de wiki-steami-71 et l'accord explicite de l'utilisateur pour la réinstallation.

- [ ] **Step 1 :** build et serveur local, Chrome sous Xvfb, page BLE. Vérification sur la V1c, qui a la pile : deux confirmations, message « à jour ». Ensuite, téléverser un exemple BLE qui démarre la radio sur V1c et lire `BLE.begin()` sur la console.
- [ ] **Step 2 :** avec l'accord de l'utilisateur, indicateur `forcer`, puis réinstallation de la même version. Mesurer la durée et noter les lignes d'UPGRADE et de relecture. Relire « à jour ». Refaire l'essai BLE.
- [ ] **Step 3 :** captures (bouton, confirmation, proposition, décompte, fin) dans `static/img/software/pile-radio-wiki-*.png`, recadrées. Reporter la durée mesurée dans `pile-radio.md`. Commit `docs(software): captures et durée de l'installation de la pile radio depuis le wiki`.
- [ ] **Step 4 :** remettre battery_status et le vérifier sur la liaison série, puis rendre la carte à wiki-steami-71.
- [ ] **Step 5 :** pousser la branche, ouvrir la PR qui ferme #237, et noter le résultat dans l'issue.
