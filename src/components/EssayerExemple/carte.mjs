// Connexion à la carte, partagée par tous les <EssayerExemple> de la page.
// DAP.js (global DAPjs) n'est chargé qu'au premier clic sur « Connecter la carte ».
// Le wiki est une application d'une seule page : ce module vit aussi longtemps
// que l'onglet. La carte est donc libérée quand plus aucun <EssayerExemple>
// n'est affiché, pour qu'un Codespace ou l'Arduino IDE puisse s'en servir,
// ou tout de suite avec le bouton « Déconnecter ».
//
// Le composant MicroPython s'en sert aussi : il écrit sur le port série
// (ecrireSerie), écoute les octets bruts de la carte (ecouterSerie), flashe le
// firmware (flasherFirmware), lit la version du DAPLink (lireVersionDaplink)
// et redémarre la carte (redemarrer).
//
// Port série : une boucle sur dap.serialRead(), pas startSerialRead() de
// DAP.js. Mesuré sur la V1c : son événement EVENT_SERIAL_DATA décode lui-même
// l'UTF-8 (les octets bruts sont perdus) et startSerialRead(10) lit au plus
// 62 octets toutes les 10 ms, moins vite que l'UART à 115 200 bauds : le
// DAPLink perd alors des données (« <DAPLink:Overflow> »). La boucle relit
// tout de suite tant que des octets arrivent et ne fait une pause
// (PAUSE_LECTURE_MS) que quand rien n'attend.
//
// Une commande USB à la fois : DAP.js n'ordonne pas ses commandes entre elles,
// et une lecture série glissée au milieu d'une écriture ou d'un flash peut
// désynchroniser le DAPLink. Toutes passent donc par une file (executer) : la
// boucle de lecture, serialWrite, send(0x9f), reset() et flash(). La boucle
// est en plus arrêtée pendant un flash : il est long, et la console doit être
// vidée entre l'ancien programme et le nouveau.
import {
  ErreurLecteur,
  MESSAGE_DAPJS_INTROUVABLE,
  MESSAGE_DEBRANCHEE,
  MESSAGE_FLASH_EN_COURS,
  MESSAGE_SANS_CARTE,
  TamponLignes,
  activiteASignaler,
  messageFrancais,
  peutDeconnecter,
  peutLiberer,
  progressionChangee,
  telechargerFirmware,
} from './logique.mjs';
import { lireVersionSteami } from '../EssayerMicroPython/logique.mjs';

const VENDOR_ID_DAPLINK = 0x0d28;
const BAUDS = 115200;
const URL_DAPJS = '/vendor/dapjs-2.3.0/dap.umd.js';

// Délai avant de libérer la carte quand le dernier composant disparaît :
// passer d'une page d'exemples à une autre démonte les composants puis en
// monte d'autres, sans qu'il faille se reconnecter.
export const DELAI_LIBERATION_MS = 1000;

// Pause de la boucle de lecture série quand rien n'arrive.
export const PAUSE_LECTURE_MS = 5;

// Le DAPLink refuse les écritures série de plus de 62 octets (« Bad status
// for 8 -> 255 »).
export const PAQUET_SERIE = 62;

// Commande vendeur du DAPLink STeaMi qui renvoie sa version.
const COMMANDE_VERSION = 0x9f;

export const ETAT_INITIAL = Object.freeze({
  connectee: false,
  occupee: false,
  // Tentative de connexion en cours : fenêtre de choix ouverte, puis
  // connexion de DAP.js. occupee l'est aussi.
  connexion: false,
  // Exemple d'où vient la dernière action : lui seul affiche le statut et l'erreur.
  dernierClic: null,
  // Exemple dont le programme tourne sur la carte : lui seul affiche la console.
  programmeActif: null,
  lignes: [],
  erreur: null,
  // Avancement du flash, de 0 à 1 ; null hors téléversement.
  progression: null,
  // Nombre de signaux d'activité série depuis le démarrage du programme :
  // chaque changement fait clignoter le voyant. Au plus un signal par
  // INTERVALLE_ACTIVITE_MS (voir activiteASignaler).
  activite: 0,
});

const tampon = new TamponLignes();
const abonnes = new Set();
// Écouteurs des octets bruts du port série (ecouterSerie).
const ecouteursSerie = new Set();

let dap = null;
let peripherique = null;
let boucle = null; // lecture série en cours (demarrerSerie), null si arrêtée
// Fin de la dernière commande USB de la connexion : la suivante l'attend.
let file = Promise.resolve();
// Rejetée quand la connexion est perdue ou fermée (voir executerSansAttendre).
let perte = null;
let flashEnCours = false;
// Appareil de la dernière connexion perdue (voir ecouterDeconnexion).
let appareilPerdu = null;
let promesseDapjs = null; // partagée : le script n'est injecté qu'une fois
let ecouteDeconnexion = false;
let rafPlanifie = false;
let minuterieLiberation = null;
let liberation = null; // promesse de la libération en cours
let derniereActivite = null; // instant (ms) du dernier signal d'activité série

let etat = ETAT_INITIAL;

function changer(partie) {
  etat = { ...etat, ...partie };
  for (const fn of [...abonnes]) fn(etat);
}

// Au plus une mise à jour de la console par image.
function planifierLignes() {
  if (rafPlanifie) return;
  rafPlanifie = true;
  const quandPret =
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout;
  quandPret(() => {
    rafPlanifie = false;
    changer({ lignes: tampon.lignes });
  });
}

// Données série reçues (nombre d'octets) : fait clignoter le voyant, au plus
// une fois par INTERVALLE_ACTIVITE_MS pour ne pas redessiner la page à chaque
// paquet.
function signalerActivite(nombre) {
  if (!nombre) return;
  const maintenant = Date.now();
  if (!activiteASignaler(maintenant, derniereActivite)) return;
  derniereActivite = maintenant;
  changer({ activite: etat.activite + 1 });
}

// Nouveau programme ou nouvelle connexion : le voyant repart éteint.
function oublierActivite() {
  derniereActivite = null;
}

function chargerDapjs(src) {
  if (typeof window.DAPjs !== 'undefined') return Promise.resolve();
  if (!promesseDapjs) {
    promesseDapjs = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => {
        promesseDapjs = null; // permet de réessayer
        script.remove();
        reject(new ErreurLecteur(MESSAGE_DAPJS_INTROUVABLE));
      };
      document.head.append(script);
    });
  }
  return promesseDapjs;
}

// Ferme une connexion, même à moitié ouverte : disconnect() de DAP.js ne
// ferme rien si connect() a échoué en route, d'où le close() de l'appareil,
// qui rend l'interface USB. La carte peut déjà être partie.
async function fermer(connexion, appareil) {
  await connexion?.disconnect().catch(() => {});
  await appareil?.close().catch(() => {});
}

// Retient la fermeture en cours : connecter() l'attend avant d'ouvrir la
// carte, sinon le close() de l'ancienne connexion pourrait fermer la nouvelle.
function suivreLiberation(promesse) {
  const suivie = promesse.finally(() => {
    if (liberation === suivie) liberation = null;
  });
  liberation = suivie;
  return suivie;
}

// Promesse rejetée à la perte de la connexion, avec le message à afficher.
function nouvellePerte() {
  let rejeter;
  const promesse = new Promise((_, reject) => {
    rejeter = reject;
  });
  // Personne ne l'attend peut-être : pas de rejet non traité.
  promesse.catch(() => {});
  return { promesse, rejeter };
}

// Fait passer une commande USB après les précédentes de la même connexion.
// Refusée tout de suite si la connexion n'est plus la courante, y compris
// quand son tour vient.
function executer(courant, commande) {
  if (!courant || dap !== courant) {
    return Promise.reject(new ErreurLecteur(MESSAGE_SANS_CARTE));
  }
  const resultat = file.then(() => {
    if (dap !== courant) throw new ErreurLecteur(MESSAGE_SANS_CARTE);
    return commande();
  });
  file = resultat.then(
    () => {},
    () => {},
  );
  return resultat;
}

// Comme executer, mais rejette dès que la carte est perdue ou déconnectée,
// sans attendre la fin de la commande ni celles d'avant : l'écriture série ne
// doit jamais bloquer le composant MicroPython.
function executerSansAttendre(courant, commande) {
  const resultat = executer(courant, commande);
  if (!perte) return resultat;
  return Promise.race([resultat, perte.promesse]);
}

// La carte n'est plus utilisable (débranchée, lecture série en erreur) : on
// repasse à « non connectée », sauf si une autre connexion a déjà pris le relais.
function perdre(courant, message) {
  if (dap !== courant) return;
  const appareil = peripherique;
  dap = null;
  peripherique = null;
  appareilPerdu = appareil;
  // arreterBoucle() ne rejette jamais.
  if (boucle) void arreterBoucle(boucle);
  boucle = null;
  perte?.rejeter(new ErreurLecteur(message));
  perte = null;
  // fermer() ne rejette jamais.
  void suivreLiberation(fermer(courant, appareil));
  oublierActivite();
  changer({ connectee: false, erreur: message, activite: 0 });
}

// Octets reçus de la carte : voyant d'activité, console (texte décodé en
// continu, un caractère peut être coupé entre deux lectures) et écouteurs
// des octets bruts.
function recevoir(courant, octets, decodeur) {
  if (dap !== courant) return;
  signalerActivite(octets.length);
  const texte = decodeur.decode(octets, { stream: true });
  if (texte && tampon.ajouter(texte).length) planifierLignes();
  for (const fn of [...ecouteursSerie]) {
    // Un écouteur en erreur ne doit pas arrêter la lecture de la console.
    try {
      fn(octets);
    } catch (err) {
      console.error(err);
    }
  }
}

// Pause de la boucle, que arreterBoucle() abrège. Arrêt demandé pendant la
// lecture qui précède : pas de pause du tout.
function pause(lecture) {
  return new Promise((resolve) => {
    if (lecture.arret) {
      resolve();
      return;
    }
    lecture.reveil = resolve;
    lecture.minuterie = setTimeout(resolve, PAUSE_LECTURE_MS);
  });
}

// Lance la lecture série de la connexion courante : relit tout de suite tant
// que des octets arrivent, attend PAUSE_LECTURE_MS sinon. Une lecture en
// erreur fait perdre la carte, avec un message en français.
function demarrerSerie() {
  const courant = dap;
  const decodeur = new TextDecoder('utf-8');
  const lecture = { arret: false, reveil: null, minuterie: null, fin: null };
  lecture.fin = (async () => {
    try {
      while (!lecture.arret && dap === courant) {
        const donnees = await executer(courant, () => courant.serialRead());
        const octets = donnees ? new Uint8Array(donnees) : null;
        if (octets?.length) recevoir(courant, octets, decodeur);
        else await pause(lecture);
      }
    } catch (err) {
      if (!lecture.arret) perdre(courant, messageFrancais(err, 'console'));
    }
  })();
  boucle = lecture;
}

// Arrête une boucle de lecture : réveille sa pause, et renvoie la promesse de
// sa fin (après la lecture en cours, s'il y en a une). Ne rejette jamais.
function arreterBoucle(lecture) {
  lecture.arret = true;
  clearTimeout(lecture.minuterie);
  lecture.reveil?.();
  return lecture.fin;
}

async function arreterSerie() {
  if (!boucle) return;
  const lecture = boucle;
  await arreterBoucle(lecture);
  if (boucle === lecture) boucle = null;
}

function ecouterDeconnexion() {
  if (ecouteDeconnexion) return;
  ecouteDeconnexion = true;
  navigator.usb.addEventListener('disconnect', (evenement) => {
    if (dap && evenement.device === peripherique) {
      perdre(dap, MESSAGE_DEBRANCHEE);
      return;
    }
    // Carte débranchée pendant une lecture série : l'erreur de transfert
    // arrive souvent avant cet événement, et perdre() a déjà affiché l'erreur
    // de la console. La carte est bien partie : le message habituel la
    // remplace, sauf si le lecteur a déjà relancé une connexion.
    if (!dap && evenement.device === appareilPerdu && !etat.connexion) {
      appareilPerdu = null;
      changer({ erreur: MESSAGE_DEBRANCHEE });
    }
  });
}

// Arrête la console, déconnecte la carte et repart de l'état initial (plus
// de console, de statut ni d'erreur). L'appelant vérifie avant que la carte
// est connectée et libre : jamais pendant une connexion ou un téléversement.
async function relacher() {
  const courant = dap;
  const appareil = peripherique;
  const boucleCourante = boucle;
  // Dès maintenant, perdre(), les données série et les commandes de cette
  // connexion sont ignorées ; les écritures en attente sont refusées.
  dap = null;
  peripherique = null;
  boucle = null;
  perte?.rejeter(new ErreurLecteur(MESSAGE_SANS_CARTE));
  perte = null;
  tampon.vider();
  oublierActivite();
  changer(ETAT_INITIAL);
  await suivreLiberation(
    (async () => {
      if (boucleCourante) await arreterBoucle(boucleCourante);
      await fermer(courant, appareil);
    })(),
  );
}

// Plus aucun composant affiché depuis DELAI_LIBERATION_MS : libère la carte.
// Pendant une connexion ou un téléversement, ne fait rien : la fin de
// l'opération replanifie la libération.
async function liberer() {
  minuterieLiberation = null;
  if (!peutLiberer({ abonnes: abonnes.size, occupee: etat.occupee, connectee: dap !== null })) {
    return;
  }
  await relacher();
}

// Bouton « Déconnecter » : libère la carte tout de suite, pour un Codespace
// ou l'Arduino IDE. Refusé pendant une connexion ou un téléversement : un
// flash interrompu peut laisser la carte inutilisable jusqu'au redémarrage
// de son DAPLink.
async function deconnecter() {
  if (!peutDeconnecter({ occupee: etat.occupee, connectee: dap !== null })) return;
  annulerLiberation();
  await relacher();
}

function planifierLiberation() {
  if (minuterieLiberation !== null) return;
  minuterieLiberation = setTimeout(liberer, DELAI_LIBERATION_MS);
}

function annulerLiberation() {
  if (minuterieLiberation === null) return;
  clearTimeout(minuterieLiberation);
  minuterieLiberation = null;
}

function apresOperation(partie = {}) {
  changer({ ...partie, occupee: false });
  if (abonnes.size === 0) planifierLiberation();
}

// Carte déjà autorisée pour le site (sur cette page, ou avant un
// rechargement) : reprise sans la fenêtre de choix si c'est la seule STeaMi
// autorisée. null s'il n'y en a aucune, s'il y en a plusieurs (le lecteur
// choisit), ou si getDevices est absent ou échoue. getDevices ne consomme pas
// l'activation du clic et répond vite : requestDevice, s'il le faut, suit
// toujours de près le clic.
async function carteAutorisee() {
  try {
    const appareils = (await navigator.usb.getDevices?.()) ?? [];
    const steami = appareils.filter((appareil) => appareil?.vendorId === VENDOR_ID_DAPLINK);
    return steami.length === 1 ? steami[0] : null;
  } catch {
    return null;
  }
}

// id : l'exemple sous lequel on a cliqué, qui affichera une éventuelle erreur.
async function connecter(id, urlDapjs = URL_DAPJS) {
  if (dap || etat.occupee) return;
  appareilPerdu = null;
  // Tampon, console et messages sont ceux de la connexion précédente.
  tampon.vider();
  oublierActivite();
  changer({ ...ETAT_INITIAL, occupee: true, connexion: true, dernierClic: id });
  let appareil = null;
  let nouvelle = null;
  try {
    // Choix de la carte d'abord : requestDevice doit suivre de près le clic
    // de l'utilisateur.
    appareil =
      (await carteAutorisee()) ??
      (await navigator.usb.requestDevice({
        filters: [{ vendorId: VENDOR_ID_DAPLINK }],
      }));
    // Une libération pas encore finie garde l'interface USB : on l'attend.
    await liberation;
    await chargerDapjs(urlDapjs);
    nouvelle = new window.DAPjs.DAPLink(new window.DAPjs.WebUSB(appareil));
    const connexion = nouvelle;
    // DAP.js émet l'avancement du flash (de 0 à 1) après chaque paquet, puis
    // 1 à la fin. Ignoré hors téléversement (progression à null).
    nouvelle.on(window.DAPjs.DAPLink.EVENT_PROGRESS, (progression) => {
      if (dap !== connexion || etat.progression === null) return;
      if (progressionChangee(etat.progression, progression)) changer({ progression });
    });
    await nouvelle.connect();
    await nouvelle.setSerialBaudrate(BAUDS);
    file = Promise.resolve();
    perte = nouvellePerte();
    dap = nouvelle;
    peripherique = appareil;
    ecouterDeconnexion();
    changer({ connectee: true });
    demarrerSerie();
  } catch (err) {
    // Connexion à moitié ouverte : la refermer, sinon l'interface reste prise
    // et la tentative suivante croit la carte utilisée par un autre onglet.
    if (nouvelle) await fermer(nouvelle, appareil);
    changer({ connectee: false, erreur: messageFrancais(err, 'connexion') });
  } finally {
    apresOperation({ connexion: false });
  }
}

// Téléverse un .bin : chemin commun à televerser et flasherFirmware.
// Le bouton est bloqué dès l'appel : obtenirDonnees() (le téléchargement du
// .bin) se fait pendant que la carte est réservée. Si le téléchargement
// échoue, l'ancien programme continue et garde sa console. Sinon : arrête la
// lecture série, puis vide la console (dans cet ordre, pour que rien de
// l'ancien programme n'y passe), téléverse en suivant la progression, et
// relance la lecture. Pas de dap.reset() : le DAPLink redémarre déjà la
// carte à la fin du flash. Jamais de nouvel essai automatique : après un
// échec, le DAPLink peut être désynchronisé, le lecteur doit le réinitialiser.
// Ne rejette jamais : l'erreur est dans l'état. Renvoie true si le flash a
// réussi.
async function flasher(id, obtenirDonnees) {
  if (!dap || etat.occupee) return false;
  const courant = dap;
  let reussi = false;
  changer({ occupee: true, erreur: null, dernierClic: id });
  try {
    const donnees = await obtenirDonnees();
    // Carte perdue pendant le téléchargement : perdre() a posé le message,
    // il n'y a plus rien à téléverser.
    if (dap !== courant) return false;
    await arreterSerie();
    tampon.vider();
    oublierActivite();
    changer({ programmeActif: null, lignes: [], activite: 0, progression: 0 });
    flashEnCours = true;
    try {
      await executer(courant, () => courant.flash(donnees));
    } finally {
      flashEnCours = false;
    }
    if (dap === courant) {
      changer({ programmeActif: id });
      reussi = true;
    }
  } catch (err) {
    // Carte débranchée entre-temps : perdre() a déjà posé le message.
    if (dap === courant) changer({ erreur: messageFrancais(err, 'televersement') });
  } finally {
    if (dap === courant && !boucle) demarrerSerie();
    // Réussi ou non, la barre de progression disparaît.
    apresOperation({ progression: null });
  }
  return reussi;
}

// Téléverse le programme d'un exemple Arduino.
async function televerser(id, obtenirDonnees) {
  await flasher(id, obtenirDonnees);
}

// Installe le firmware MicroPython (url : son .bin sur le wiki), depuis le
// composant id, qui affiche la progression, l'erreur, puis la console.
// Renvoie true si le flash a réussi.
function flasherFirmware(id, url) {
  return flasher(id, () => telechargerFirmware(url));
}

// Écrit des octets déjà téléchargés (ArrayBuffer), sans nouvelle requête :
// le .hex d'installation de la pile radio, lu avant DELETE, est écrit tel
// quel après, même si le réseau tombe entre-temps. Renvoie true si le flash a
// réussi.
function flasherDonnees(id, donnees) {
  return flasher(id, () => donnees);
}

// Envoie des octets sur le port série de la carte, par paquets de
// PAQUET_SERIE octets : DAP.js envoie un octet par caractère (son code), on
// ne lui passe donc jamais de texte UTF-8. Rejette tout de suite, avec une
// ErreurLecteur en français, sans carte, pendant un flash ou quand la carte
// est perdue : ne reste jamais bloquée.
async function ecrireSerie(octets) {
  const courant = dap;
  verifierEcriture(courant);
  for (let debut = 0; debut < octets.length; debut += PAQUET_SERIE) {
    verifierEcriture(courant);
    const paquet = octets.subarray(debut, debut + PAQUET_SERIE);
    try {
      await executerSansAttendre(courant, () =>
        courant.serialWrite(String.fromCharCode(...paquet)),
      );
    } catch (err) {
      throw new ErreurLecteur(messageFrancais(err, 'ecriture'));
    }
  }
}

// La carte peut-elle recevoir une écriture série (avant chaque paquet) ?
function verifierEcriture(courant) {
  if (!courant || dap !== courant) throw new ErreurLecteur(MESSAGE_SANS_CARTE);
  if (flashEnCours) throw new ErreurLecteur(MESSAGE_FLASH_EN_COURS);
}

// fn(octets: Uint8Array) reçoit les octets bruts de la carte, tant que la
// console est lue. Renvoie la fonction qui retire l'écouteur.
function ecouterSerie(fn) {
  ecouteursSerie.add(fn);
  return () => {
    ecouteursSerie.delete(fn);
  };
}

// Version du DAPLink STeaMi ({ numero, date }), par sa commande vendeur 0x9F.
// null sans carte, pendant un flash, sur une erreur ou une réponse inconnue
// (DAPLink d'origine) : ne rejette jamais.
async function lireVersionDaplink() {
  const courant = dap;
  if (!courant || flashEnCours) return null;
  try {
    return lireVersionSteami(
      await executerSansAttendre(courant, () => courant.send(COMMANDE_VERSION)),
    );
  } catch {
    return null;
  }
}

// Redémarre la carte (dap.reset()). Rejette avec une ErreurLecteur en
// français sans carte, pendant un flash ou en cas d'échec.
async function redemarrer() {
  const courant = dap;
  if (!courant) throw new ErreurLecteur(MESSAGE_SANS_CARTE);
  if (flashEnCours) throw new ErreurLecteur(MESSAGE_FLASH_EN_COURS);
  try {
    await executerSansAttendre(courant, () => courant.reset());
  } catch (err) {
    throw new ErreurLecteur(messageFrancais(err, 'redemarrage'));
  }
}

// Chaque composant affiché est abonné : le dernier désabonnement (le lecteur
// a quitté la page) planifie la libération de la carte, un nouvel abonnement
// l'annule.
function abonner(fn) {
  abonnes.add(fn);
  annulerLiberation();
  return () => {
    abonnes.delete(fn);
    if (abonnes.size === 0) planifierLiberation();
  };
}

export const carte = {
  connecter,
  televerser,
  flasherFirmware,
  flasherDonnees,
  ecrireSerie,
  ecouterSerie,
  lireVersionDaplink,
  redemarrer,
  deconnecter,
  abonner,
  get etat() {
    return etat;
  },
};
