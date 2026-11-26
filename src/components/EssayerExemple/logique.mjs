// Fonctions pures du composant EssayerExemple (sans DOM, testables avec node).
// etatWebUSB, messageErreur et TamponLignes viennent de la page « Téléverser » du Codespace
// (steamicc/arduino-steami-devcontainer, .devcontainer/source/flasher/).

// 'absent' : le navigateur n'a pas WebUSB (Firefox, Safari) ;
// 'iframe' : WebUSB existe mais la page est dans un cadre (aperçu de
// Codespaces), où l'accès USB est interdit.
export function etatWebUSB(nav, estFenetrePrincipale) {
  if (!nav?.usb) return 'absent';
  if (!estFenetrePrincipale) return 'iframe';
  return 'ok';
}

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
  if (nom === 'SecurityError') {
    return "Le navigateur indique : accès à la carte refusé. Autorisez l'USB pour ce site, puis réessayez.";
  }
  if (nom === 'NetworkError' && /claim interface/i.test(message)) {
    return 'La carte est déjà utilisée par un autre onglet ou un autre programme : fermez-le puis réessayez.';
  }
  if (
    /transfer error|controlTransfer(In|Out)|transfer(In|Out)|device unavailable|disconnected/i.test(
      message,
    )
  ) {
    return 'La carte a été débranchée ou elle est utilisée par un autre onglet : rebranchez-la, puis réessayez.';
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

const ECHECS = {
  connexion: 'La connexion à la carte a échoué',
  televersement: 'Le téléversement a échoué',
  console: 'La lecture de la console série a échoué',
};

// Message à afficher pour une erreur survenue pendant une étape (connexion,
// televersement ou console). messageErreur reste identique à la copie du
// Codespace : ce qu'il ne traduit pas (erreurs de DAP.js, comme « Flash error »)
// devient une phrase en français qui dit quoi faire, suivie du message d'origine.
export function messageFrancais(err, etape = 'televersement') {
  if (err?.name === 'ErreurLecteur') return err.message;
  const brut = err?.message || String(err);
  const traduit = messageErreur(err);
  if (traduit !== brut) return traduit;
  const echec = ECHECS[etape] ?? ECHECS.televersement;
  return `${echec} : débrancher et rebrancher la carte, puis réessayer. (${brut})`;
}

// Télécharge le .bin d'un exemple. cache: 'no-cache' revalide auprès du
// serveur : après un changement de version, on n'envoie pas un ancien .bin
// gardé par le navigateur.
export async function telechargerExemple(href, recuperer = fetch) {
  let reponse;
  try {
    reponse = await recuperer(href, { cache: 'no-cache' });
    if (reponse.ok) return await reponse.arrayBuffer();
  } catch {
    throw new ErreurLecteur(
      "Impossible de télécharger l'exemple : vérifier la connexion à Internet, puis réessayer.",
    );
  }
  throw new ErreurLecteur(
    `Exemple introuvable sur le wiki (erreur ${reponse.status}) : recharger la page, puis réessayer.`,
  );
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
// - 'deconnectee' : pas de carte connectée, y compris pendant une tentative
//   de connexion (la fenêtre de choix est ouverte, le bouton est grisé) ;
// - 'televersement' : carte connectée et réservée par un téléversement,
//   téléchargement du .bin compris ;
// - 'programme' : carte connectée et libre, le dernier téléversement réussi
//   est celui de cet exemple, et la console série est lue (elle l'est
//   toujours quand la carte est connectée et libre) ; seul l'exemple dont le
//   programme tourne l'affiche ;
// - 'connectee' : les autres cas, carte connectée.
export function statutCarte({ connectee, occupee, programmeActif }, id) {
  if (!connectee) return 'deconnectee';
  if (occupee) return 'televersement';
  if (programmeActif === id) return 'programme';
  return 'connectee';
}

export const LIBELLES_STATUT = Object.freeze({
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

export function texteProgression(progression) {
  const pct = pourcentage(progression);
  return pct === null ? '' : `${pct}\u00a0%`;
}

// DAP.js émet une progression par paquet USB (des centaines par
// téléversement) : l'état ne change que quand le pourcentage affiché change.
export function progressionChangee(avant, apres) {
  return pourcentage(avant) !== pourcentage(apres);
}

// Intervalle minimal entre deux clignotements du voyant d'activité série :
// la console est lue toutes les 10 ms, sans limite la page se redessinerait
// à chaque paquet.
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
