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
