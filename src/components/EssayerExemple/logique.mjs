// Fonctions pures du composant EssayerExemple (sans DOM, testables avec node).
// etatWebUSB, messageErreur et TamponLignes viennent de la page « Téléverser » du Codespace
// (steamicc/arduino-steami-devcontainer, .devcontainer/source/flasher/). Les messages de
// messageErreur s'en écartent volontairement : ton neutre (infinitifs, sans « vous »), comme le
// reste du wiki, et conseil corrigé pour un accès refusé (SecurityError).

// 'absent' : le navigateur n'a pas WebUSB (Firefox, Safari) ;
// 'iframe' : WebUSB existe mais la page est dans un cadre (aperçu de
// Codespaces), où l'accès USB est interdit.
export function etatWebUSB(nav, estFenetrePrincipale) {
  if (!nav?.usb) return 'absent';
  if (!estFenetrePrincipale) return 'iframe';
  return 'ok';
}

// La fenêtre de choix a déjà donné l'accès au site : un refus vient du
// système (Linux sans règle udev) ou d'un autre programme qui tient la carte.
export const TEXTE_ACCES_REFUSE =
  "Accès à la carte refusé par le système. Sous Linux, il manque sans doute la règle udev de la carte : l'installer, ou glisser le .bin ci-dessous sur le lecteur STEAMI (voir la page Codespace). Sinon, un autre programme ou onglet utilise la carte (Arduino IDE, Codespace…) : le fermer, puis réessayer.";

// Messages de la connexion partagée (carte.mjs), écrits pour les pages
// Arduino. Exportés pour que le composant MicroPython les reformule
// (traduireMessageCarte) : il n'a ni bouton « Connecter la carte » ni .bin.
export const MESSAGE_SANS_CARTE = 'Aucune carte connectée : cliquer sur « Connecter la carte ».';
export const MESSAGE_FLASH_EN_COURS = 'Téléversement en cours : attendre la fin, puis réessayer.';
export const MESSAGE_DEBRANCHEE =
  'La carte a été débranchée : la rebrancher, puis cliquer sur « Connecter la carte ».';
export const MESSAGE_DAPJS_INTROUVABLE =
  'Impossible de charger la bibliothèque de téléversement : vérifier la connexion à Internet, puis réessayer.';

// Traduit les erreurs de Chrome (WebUSB et DAP.js) en français.
export function messageErreur(err) {
  const nom = err?.name || '';
  const message = err?.message || String(err);

  if (nom === 'NotFoundError' && /No device selected/i.test(message)) {
    return 'Aucune carte choisie.';
  }
  if (nom === 'NotFoundError' && /disconnected/i.test(message)) {
    return 'La carte a été débranchée.';
  }
  if (nom === 'SecurityError' && /permissions policy/i.test(message)) {
    return "Le navigateur interdit l'USB dans cet aperçu : ouvrir la page dans un onglet du navigateur.";
  }
  if (nom === 'SecurityError') return TEXTE_ACCES_REFUSE;
  if (nom === 'NetworkError' && /claim interface/i.test(message)) {
    return 'La carte est déjà utilisée par un autre onglet ou un autre programme : le fermer, puis réessayer.';
  }
  if (
    /transfer error|controlTransfer(In|Out)|transfer(In|Out)|device unavailable|disconnected/i.test(
      message,
    )
  ) {
    return 'La carte a été débranchée ou elle est utilisée par un autre onglet : la rebrancher, puis réessayer.';
  }
  return message;
}

// Erreur dont le message est déjà en français et dit quoi faire : affichée telle quelle.
export class ErreurLecteur extends Error {
  constructor(message) {
    super(message);
    this.name = 'ErreurLecteur';
  }
}

// Conseil ajouté aux erreurs de DAP.js. Avec une batterie branchée,
// l'interface USB de la carte (son DAPLink) reste alimentée quand on débranche
// le câble : seule, cette coupure ne la remet pas à zéro, et le dialogue
// USB peut rester décalé (« Bad response for 8 -> 17 ») tant que l'interface
// n'a pas redémarré.
export const CONSEIL_REINITIALISATION =
  "débrancher le câble USB et, s'il y en a une, la batterie, attendre quelques secondes, puis rebrancher et réessayer.";

export const ECHECS = Object.freeze({
  connexion: 'La connexion à la carte a échoué',
  televersement: 'Le téléversement a échoué',
  console: 'La lecture de la console série a échoué',
  ecriture: "L'envoi à la carte a échoué",
  redemarrage: 'Le redémarrage de la carte a échoué',
});

// Message à afficher pour une erreur survenue pendant une étape (connexion,
// televersement, console, ecriture ou redemarrage). Ce que messageErreur ne traduit pas (erreurs de
// DAP.js, comme « Flash error ») devient une phrase en français qui dit quoi
// faire, suivie du message d'origine.
export function messageFrancais(err, etape = 'televersement') {
  if (err?.name === 'ErreurLecteur') return err.message;
  const brut = err?.message || String(err);
  const traduit = messageErreur(err);
  if (traduit !== brut) return traduit;
  const echec = ECHECS[etape] ?? ECHECS.televersement;
  return `${echec} : ${CONSEIL_REINITIALISATION} (${brut})`;
}

// Télécharge un .bin du wiki. cache: 'no-cache' revalide auprès du
// serveur : après un changement de version, on n'envoie pas un ancien .bin
// gardé par le navigateur. quoi / introuvable : ce qui est téléchargé, pour
// les messages d'erreur.
async function telechargerBin(href, recuperer, { quoi, introuvable }) {
  let reponse;
  try {
    reponse = await recuperer(href, { cache: 'no-cache' });
    if (reponse.ok) return await reponse.arrayBuffer();
  } catch {
    throw new ErreurLecteur(
      `Impossible de télécharger ${quoi} : vérifier la connexion à Internet, puis réessayer.`,
    );
  }
  throw new ErreurLecteur(
    `${introuvable} sur le wiki (erreur ${reponse.status}) : recharger la page, puis réessayer.`,
  );
}

// Télécharge le .bin d'un exemple.
export function telechargerExemple(href, recuperer = fetch) {
  return telechargerBin(href, recuperer, { quoi: "l'exemple", introuvable: 'Exemple introuvable' });
}

// Télécharge le firmware MicroPython épinglé par le wiki.
export function telechargerFirmware(href, recuperer = fetch) {
  return telechargerBin(href, recuperer, {
    quoi: 'MicroPython',
    introuvable: 'Firmware MicroPython introuvable',
  });
}

// La console suit les nouvelles lignes tant que le lecteur est en bas ; s'il
// est remonté pour relire, on le laisse où il est. Même règle que la page du
// Codespace (app.js).
export function estEnBas({ scrollTop, clientHeight, scrollHeight }, marge = 4) {
  return scrollTop + clientHeight >= scrollHeight - marge;
}

// La carte se libère quand plus aucun composant n'est affiché, jamais pendant
// une connexion ou un téléversement.
export function peutLiberer({ abonnes, occupee, connectee }) {
  return abonnes === 0 && peutDeconnecter({ occupee, connectee });
}

// Le bouton « Déconnecter » ne sert que carte connectée, et jamais pendant
// une connexion ou un téléversement : un flash interrompu peut laisser la
// carte inutilisable.
export function peutDeconnecter({ occupee, connectee }) {
  return !occupee && connectee;
}

// Tampon de lignes pour la console série : le flux arrive par morceaux
// arbitraires, on ne rend que des lignes complètes.
export class TamponLignes {
  #maxLignes;
  #lignes = [];
  #reste = '';

  constructor(maxLignes = 2000) {
    this.#maxLignes = maxLignes;
  }

  // Ajoute un morceau de texte et renvoie les lignes qu'il vient de compléter.
  ajouter(texte) {
    const morceaux = (this.#reste + texte).split('\n');
    this.#reste = morceaux.pop();
    this.#lignes.push(...morceaux);
    if (this.#lignes.length > this.#maxLignes) {
      this.#lignes.splice(0, this.#lignes.length - this.#maxLignes);
    }
    return morceaux;
  }

  vider() {
    this.#lignes = [];
    this.#reste = '';
  }

  get lignes() {
    return [...this.#lignes];
  }
}

// id : « COMPOSANT/NomExemple », par exemple « VL53L1X/GestureDetection ».
export function idValide(id) {
  return typeof id === 'string' && /^[A-Z0-9_-]+\/[A-Za-z0-9_]+$/.test(id);
}

export function urlBin(id) {
  return `/exemples-arduino/${id}.bin`;
}

export function nomFichier(id) {
  return `${id.split('/').pop()}.bin`;
}

// État de la carte affiché sous chaque exemple, avec une pastille de couleur
// et toujours un libellé :
// - 'connexion' : tentative de connexion en cours (la fenêtre de choix est
//   ouverte ou DAP.js se connecte, le bouton est grisé) ;
// - 'deconnectee' : pas de carte connectée ;
// - 'televersement' : carte connectée et réservée par un téléversement,
//   téléchargement du .bin compris ;
// - 'programme' : carte connectée et libre, le dernier téléversement réussi
//   est celui de cet exemple, et la console série est lue (elle l'est
//   toujours quand la carte est connectée et libre) ; seul l'exemple dont le
//   programme tourne l'affiche ;
// - 'connectee' : les autres cas, carte connectée.
export function statutCarte({ connexion, connectee, occupee, programmeActif }, id) {
  if (connexion) return 'connexion';
  if (!connectee) return 'deconnectee';
  if (occupee) return 'televersement';
  if (programmeActif === id) return 'programme';
  return 'connectee';
}

// Message annoncé (région aria-live) sous l'exemple id, null s'il n'y en a
// pas. Seul l'exemple cliqué en dernier en a un :
// - pendant un téléversement lancé depuis lui ;
// - « Programme téléversé. » quand son programme tourne ;
// - « Carte connectée. » après une connexion réussie depuis lui, tant
//   qu'aucun exemple n'a été téléversé : l'état de la carte n'a pas de
//   région aria-live, c'est la seule annonce de la connexion.
// Jamais avec une erreur, qui s'annonce elle-même.
export function messageStatut(etat, id) {
  if (etat.dernierClic !== id || etat.erreur) return null;
  if (statutCarte(etat, id) === 'televersement') return 'Téléversement en cours…';
  if (!etat.connectee || etat.occupee) return null;
  if (etat.programmeActif === id) return 'Programme téléversé.';
  if (etat.programmeActif === null) return 'Carte connectée.';
  return null;
}

// Le voyant d'activité série accompagne la console : il n'est affiché que
// sous l'exemple dont le programme tourne, ou, tant qu'aucun exemple n'a été
// téléversé (le programme d'avant tourne encore), sous l'exemple cliqué en
// dernier. Sinon, chaque exemple de la page aurait son voyant, qui clignoterait
// pour un programme qui n'est pas le sien.
export function voyantVisible({ connectee, programmeActif, dernierClic }, id) {
  if (!connectee) return false;
  return programmeActif === null ? dernierClic === id : programmeActif === id;
}

export const LIBELLES_STATUT = Object.freeze({
  connexion: 'connexion…',
  deconnectee: 'déconnectée',
  connectee: 'connectée',
  televersement: 'téléversement',
  programme: 'programme en cours',
});

// Progression du flash (0 à 1, émise par DAP.js) en pourcentage entier,
// arrondi vers le bas : 100 % seulement quand DAP.js annonce la fin.
// null : pas de téléversement en cours.
export function pourcentage(progression) {
  if (progression === null || progression === undefined) return null;
  const valeur = Number(progression);
  if (!Number.isFinite(valeur)) return 0;
  return Math.min(100, Math.max(0, Math.floor(valeur * 100)));
}

export const TEXTE_PREPARATION = 'Préparation de la carte…';

// Ce qu'affiche la barre pendant un téléversement. DAP.js n'émet de
// progression qu'une fois l'écriture commencée : avant (téléchargement du
// .bin, connexion au processeur, effacement), elle reste à null ou à 0 pendant
// plusieurs secondes. La barre est alors indéterminée (valeur : null, la
// <progress> n'a pas d'attribut value) avec le texte TEXTE_PREPARATION ; elle
// passe au pourcentage dès qu'il n'est plus nul.
export function affichageProgression(progression) {
  const pct = pourcentage(progression);
  if (!pct) return { valeur: null, texte: TEXTE_PREPARATION };
  return { valeur: pct, texte: `${pct}\u00a0%` };
}

// DAP.js émet une progression par paquet USB (des centaines par
// téléversement) : l'état ne change que quand le pourcentage affiché change.
export function progressionChangee(avant, apres) {
  return pourcentage(avant) !== pourcentage(apres);
}

// Intervalle minimal entre deux clignotements du voyant d'activité série :
// la console est lue en continu, par paquets de 62 octets au plus ; sans
// limite, la page se redessinerait à chaque paquet.
export const INTERVALLE_ACTIVITE_MS = 100;

// Faut-il signaler les données série arrivées à l'instant maintenant (ms) ?
// derniere : instant du dernier signal, null s'il n'y en a pas encore eu.
// Les données reçues moins de intervalle ms après un signal ne font pas
// clignoter le voyant : un flux continu le fait clignoter au plus dix fois
// par seconde. Une horloge qui recule (heure du système changée) signale
// aussi, pour que le voyant ne reste pas éteint.
export function activiteASignaler(maintenant, derniere, intervalle = INTERVALLE_ACTIVITE_MS) {
  if (derniere === null || maintenant < derniere) return true;
  return maintenant - derniere >= intervalle;
}
