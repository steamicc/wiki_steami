// Décisions pures du bouton « Essayer sur la carte » (MicroPython), sans
// accès à la carte ni au DOM : le composant les appelle avant de lancer le code.

// --- Firmware MicroPython ---------------------------------------------------

// Compare deux versions « vX.Y.Z » numériquement (v0.28.10 > v0.28.9).
export function comparerVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

// carte : { micropython, version } où version vaut « vX.Y.Z », « dev » ou null
// (MicroPython sans steami.version). epinglee : version épinglée par le wiki.
// 'dev' (build local) ne reçoit jamais de proposition de mise à jour.
export function decisionFirmware(carte, epinglee) {
  if (!carte.micropython) return 'absent';
  if (carte.version === null || carte.version === undefined) return 'ancien';
  if (carte.version === 'dev') return 'dev';
  return comparerVersions(carte.version, epinglee) < 0 ? 'ancien' : 'a-jour';
}

// Carte muette : le REPL n'a pas répondu. Si la bannière MicroPython apparaît
// après un reset, un autre outil (Thonny, mpremote) ou un programme qui bloque
// Ctrl-C tient la carte : ne jamais proposer d'installer.
export function diagnosticSansInvite({ banniereVue }) {
  return banniereVue ? 'occupee' : 'absent';
}

// --- DAPLink ----------------------------------------------------------------
// Repris de arduino-steami-devcontainer, .devcontainer/source/flasher/support.js
// (mêmes signatures, mêmes règles).

// Réponse (DataView) à la commande vendeur 0x9F : octet 0 = commande répétée,
// octets 1-4 = « STM1 », 5-8 = numéro, 9-12 = date (entiers 32 bits little-endian).
export function lireVersionSteami(reponse) {
  if (!reponse || reponse.byteLength < 13) return null;
  const marque = String.fromCharCode(
    reponse.getUint8(1),
    reponse.getUint8(2),
    reponse.getUint8(3),
    reponse.getUint8(4),
  );
  if (marque !== 'STM1') return null;
  return { numero: reponse.getUint32(5, true), date: reponse.getUint32(9, true) };
}

export function lireFirmwareEpingle(json) {
  if (!json || typeof json.release !== 'string') return null;
  if (!Number.isInteger(json.numero) || json.numero <= 0) return null;
  if (!Number.isInteger(json.date) || json.date < 19700101 || json.date > 99991231) return null;
  return { release: json.release, numero: json.numero, date: json.date };
}

export function decisionMiseAJour(version, epingle) {
  if (!version) return 'ancien';
  if (version.numero === 0) return 'dev';
  // Ordre par (date, numéro) : un redémarrage du run_number GitHub ne doit pas
  // transformer une régression en « mise à jour ».
  if (version.date !== epingle.date) return version.date < epingle.date ? 'ancien' : 'a-jour';
  return version.numero < epingle.numero ? 'ancien' : 'a-jour';
}

// --- Textes -----------------------------------------------------------------

// raison : 'absent' (pas de MicroPython, un programme Arduino par exemple)
// ou 'ancien' (MicroPython plus ancien que la version épinglée, ou sans
// steami.version).
export function texteInstallation(version, raison) {
  const constat =
    raison === 'absent'
      ? "Cette carte n'a pas MicroPython."
      : 'La version de MicroPython de cette carte est plus ancienne que celle du wiki.';
  return `${constat} Installer MicroPython ${version} pour essayer cet exemple.`;
}

// Mesuré le 2026-11-27 sur la V1c dans Chrome 158 : 37 s du clic sur
// « Installer » à la sortie du programme. DAP.js envoie le .bin (environ
// 520 ko) par paquets de 62 octets, après l'effacement complet de la puce.
export const TEXTE_DUREE_INSTALLATION =
  "L'installation dure moins d'une minute : pendant ce temps, ne pas débrancher la carte ni fermer la page.";

export const TEXTE_EFFACEMENT =
  "Attention : l'installation peut effacer les fichiers enregistrés sur la carte. Les copier avant de continuer.";

export const TEXTE_CARTE_OCCUPEE =
  "La carte ne répond pas : un autre outil (Thonny, mpremote) ou un programme en cours peut la tenir. Fermer l'outil, ou appuyer sur RESET, puis réessayer.";

export function texteMiseAJourDaplink(release) {
  return `Une mise à jour du DAPLink de cette carte est disponible (release ${release}).`;
}
