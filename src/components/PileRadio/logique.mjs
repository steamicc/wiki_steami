// Logique pure du bouton « Vérifier la pile radio » (BLE) : décodage des
// réponses de l'operator, décisions sur le FUS et sur la pile. Sans DOM ni
// WebUSB, pour se tester seule (logique.test.mjs).

// Une version du coprocesseur tient dans un entier : octet 31-24 majeur,
// 23-16 mineur, 15-8 sous-version (0x01020000 -> 1.2.0, 0x01140002 -> 1.20.0).
export function decoderVersion(entier) {
  return {
    majeur: (entier >>> 24) & 0xff,
    mineur: (entier >>> 16) & 0xff,
    sous: (entier >>> 8) & 0xff,
  };
}

// Le bouton ne met jamais le FUS à jour : seul 1.x avec x >= 2 est accepté.
export function decisionFus({ majeur, mineur }) {
  if (majeur === 1) return mineur >= 2 ? 'ok' : 'ancien';
  if (majeur === 0) return 'ancien';
  return 'inconnu';
}

// Réponse de VERSION envoyée avant le double STATUS. `ws_version` garde la
// taille de la pile en secteurs dans son octet de poids faible
// (118292500 = 0x070D0014 -> 20).
export function lirePileEnMarche(reponseVersion) {
  const brute = reponseVersion?.copro_fw_version;
  const version = typeof brute === 'string' && brute !== '' && brute !== '0.0.0' ? brute : null;
  return { version, secteurs: (reponseVersion?.ws_version ?? 0) & 0xff };
}

function composantes(version) {
  return version.split('.').map((n) => Number.parseInt(n, 10) || 0);
}

function comparerVersions(a, b) {
  const ca = composantes(a);
  const cb = composantes(b);
  for (let i = 0; i < Math.max(ca.length, cb.length); i++) {
    const ecart = (ca[i] ?? 0) - (cb[i] ?? 0);
    if (ecart !== 0) return Math.sign(ecart);
  }
  return 0;
}

// epinglee : { version: '1.20.0', secteurs: 20 }.
export function decisionPile({ version, secteurs }, epinglee) {
  if (version === null) return 'absente';
  const ecart = comparerVersions(version, epinglee.version);
  if (ecart < 0) return 'ancienne';
  if (ecart > 0) return 'plus-recente';
  return secteurs === epinglee.secteurs ? 'a-jour' : 'autre';
}

// Octet de statut du FUS : 0 repos, 0x1_ pile, 0x2_ FUS, 0x3_ service.
export function etatFus(status) {
  if (status === 0) return 'repos';
  if (status >= 0x10 && status <= 0x1f) return 'pile';
  if (status >= 0x20 && status <= 0x2f) return 'fus';
  if (status >= 0x30 && status <= 0x3f) return 'service';
  return 'inconnu';
}

const ERREURS_FUS = {
  0x00: 'Aucune erreur.',
  0x01: 'Image introuvable dans la mémoire.',
  0x02: "Image corrompue : sa somme de contrôle n'est pas bonne.",
  0x03: "Image non authentique : sa signature n'est pas reconnue.",
  0x04: "Pas assez de place en mémoire pour l'image.",
  0x05: "Image non autorisée : la version n'est pas acceptée.",
  0x06: 'Image trop ancienne par rapport à celle déjà installée.',
  0x07: 'Image incompatible avec le FUS installé.',
  0x08: 'Erreur de la mémoire flash pendant la mise à jour.',
  0x09: 'Mise à jour refusée : la mémoire est protégée.',
  0x0a: 'Mise à jour interrompue : le coprocesseur a redémarré.',
  0x11: 'Le FUS signale une erreur après la mise à jour.',
};

export function texteErreurFus(code) {
  return (
    ERREURS_FUS[code] ??
    `Erreur inconnue du FUS (code 0x${code.toString(16).toUpperCase().padStart(2, '0')}).`
  );
}

// Recolle les paquets reçus de la carte, coupe sur « \n », retire « \r » et
// ne rend que les lignes qui sont un objet JSON ; le reste est ignoré.
export class LecteurLignes {
  #decodeur = new TextDecoder();
  #reste = '';

  ajouter(octets) {
    this.#reste += this.#decodeur.decode(octets, { stream: true });
    const lignes = this.#reste.split('\n');
    this.#reste = lignes.pop();
    const objets = [];
    for (const ligne of lignes) {
      try {
        const valeur = JSON.parse(ligne.replace(/\r$/, ''));
        if (valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)) {
          objets.push(valeur);
        }
      } catch {
        // Ligne qui n'est pas du JSON : ignorée.
      }
    }
    return objets;
  }
}
