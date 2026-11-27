# Vérifier le DAPLink depuis le bouton « Essayer » des exemples Arduino — conception

Issue : [#256](https://github.com/steamicc/wiki_steami/issues/256). Date : 2026-11-27. Conception courte, validée par l'utilisateur le 2026-11-27.

## Intention

Le bouton **Essayer** des exemples Arduino (`src/components/EssayerExemple/`) téléverse l'exemple sans lire la version du firmware DAPLink de la carte. Une carte qui a un ancien DAPLink n'a donc jamais de proposition de mise à jour depuis les pages d'exemples. Le Codespace Arduino ([arduino-steami-devcontainer](https://github.com/steamicc/arduino-steami-devcontainer), page « Téléverser ») le fait déjà. Le bouton MicroPython (#235) et le bouton « Vérifier la pile radio » (#246) du wiki le font aussi. Le bouton Arduino doit faire de même, avec le même comportement que le Codespace.

## Objectifs

- Après **Connecter la carte**, lire la version du DAPLink et la comparer au DAPLink épinglé par le wiki (`daplink.json`, servi en `static/daplink/firmware.json`).
- Si le DAPLink de la carte est plus ancien, afficher sous les boutons l'encart des étapes guidées (`EtapesDaplink`), avec **Mettre à jour…** et **Plus tard**. La dernière étape est adaptée au bouton Arduino : cliquer sur **Connecter la carte**, puis sur **Téléverser**.
- Une phrase dans la page [Premier essai](https://github.com/steamicc/wiki_steami/blob/main/docs/software/arduino/exemples/premier-essai.md) explique l'encart.

## Non-objectifs

- Un robot qui suivrait les releases de [steamicc/DAPLink](https://github.com/steamicc/DAPLink) : l'épinglage reste manuel (`daplink.json`).
- Le comportement du bouton MicroPython et du bouton « Pile radio » : ils gardent leur règle actuelle. Le bouton MicroPython propose aujourd'hui la mise à jour à une carte qui n'est pas une STeaMi ; c'est un autre sujet.
- Une mise à jour en un clic depuis le navigateur : le bootloader du DAPLink n'expose qu'un lecteur USB, et Chrome refuse d'y écrire (essai du Codespace).

## Anti-objectifs

- Bloquer le téléversement : l'encart propose, il n'empêche rien, comme dans le Codespace.
- Proposer la mise à jour du DAPLink STeaMi à une carte qui n'est pas une STeaMi (un micro:bit a le même identifiant USB, `0x0d28`).
- Reposer la question à chaque bouton d'une même page après **Plus tard**.
- Afficher une erreur quand la lecture de la version échoue : la connexion continue normalement.

## Contraintes

- Commande vendeur `0x9F` du DAPLink STeaMi : `0x9F`, « STM1 », numéro (uint32 LE) et date `AAAAMMJJ` (uint32 LE). Un ancien DAPLink sans cette commande ne renvoie pas « STM1 » et compte comme plus ancien. Un numéro 0 est une compilation locale (« dev ») : rien à proposer.
- Ordre des versions : par date, puis par numéro, comme le Codespace et `decisionMiseAJour`.
- Pendant un téléversement, la carte est occupée : la lecture ne doit pas avoir lieu dans `flasher()`.

## Approches

1. **Dans le composant, juste après la connexion** (choisie). `Controles` attend `carte.connecter(...)`, puis lit la version et décide. C'est le moment où le Codespace vérifie, avant tout téléversement, et la file des échanges de `carte.mjs` rend la lecture sûre pendant la lecture du port série.
2. **Au clic sur Téléverser**, avant `carte.televerser`. Écartée : la question arriverait au moment où la personne veut voir son exemple tourner.
3. **Dans `carte.connecter()`**, avec la version gardée dans l'état de la connexion pour les trois boutons. Écartée pour cette livraison : elle changerait aussi les boutons MicroPython et Pile radio, qui vérifient déjà chacun de leur côté.

## Conception

- Réutiliser ce qui existe : `carte.lireVersionDaplink()` (`src/components/EssayerExemple/carte.mjs`), `lireVersionSteami`, `lireFirmwareEpingle` et `decisionMiseAJour` (`src/components/EssayerMicroPython/logique.mjs`), le composant `EtapesDaplink` (`src/components/EssayerExemple/EtapesDaplink.js`) avec sa prop `derniereEtape`, et `static/daplink/firmware.json`.
- Nouvelle règle, comme le Codespace (`estSteami`) : la carte est une STeaMi si le numéro de série USB commence par `0839`. Sinon, rien n'est affiché.
- Décision : `ancien` affiche l'encart ; `a-jour` et `dev` n'affichent rien ; une lecture qui échoue, un `firmware.json` absent ou invalide, ou une carte qui n'est pas une STeaMi n'affichent rien.
- **Plus tard** : un indicateur au niveau du module, partagé par tous les boutons Essayer de la page, jusqu'au rechargement.
- L'encart reste affiché si la carte se déconnecte (elle redémarre en mode MAINTENANCE pendant la mise à jour). Après la reconnexion, la vérification se refait et l'encart disparaît si la carte est à jour.
- Tests : fonctions pures (règle STeaMi, décision d'affichage) avec `node --test`, dans le style des tests existants de `EssayerExemple`.

## Laissé au constructeur

- L'endroit exact de la règle STeaMi (fonction pure exportée, à côté de `decisionMiseAJour` ou dans le module de `EssayerExemple`) et la façon dont `carte.mjs` expose le numéro de série.
- Le texte exact de la phrase de « Premier essai », au ton neutre du wiki.
