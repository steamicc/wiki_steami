// Connexion à la carte, partagée par tous les <EssayerExemple> de la page.
// DAP.js (global DAPjs) n'est chargé qu'au premier clic sur « Connecter la carte ».
// Le wiki est une application d'une seule page : ce module vit aussi longtemps
// que l'onglet. La carte est donc libérée quand plus aucun <EssayerExemple>
// n'est affiché, pour qu'un Codespace ou l'Arduino IDE puisse s'en servir,
// ou tout de suite avec le bouton « Déconnecter ».
import {
  ErreurLecteur,
  TamponLignes,
  messageFrancais,
  peutDeconnecter,
  peutLiberer,
} from './logique.mjs';

const VENDOR_ID_DAPLINK = 0x0d28;
const BAUDS = 115200;
const URL_DAPJS = '/vendor/dapjs-2.3.0/dap.umd.js';

// Délai avant de libérer la carte quand le dernier composant disparaît :
// passer d'une page d'exemples à une autre démonte les composants puis en
// monte d'autres, sans qu'il faille se reconnecter.
export const DELAI_LIBERATION_MS = 1000;

export const ETAT_INITIAL = Object.freeze({
  connectee: false,
  occupee: false,
  // Exemple d'où vient la dernière action : lui seul affiche le statut et l'erreur.
  dernierClic: null,
  // Exemple dont le programme tourne sur la carte : lui seul affiche la console.
  programmeActif: null,
  lignes: [],
  erreur: null,
});

const tampon = new TamponLignes();
const abonnes = new Set();

let dap = null;
let peripherique = null;
let boucle = null; // promesse de startSerialRead : ne rejette jamais (erreurs gérées dedans)
let promesseDapjs = null; // partagée : le script n'est injecté qu'une fois
let ecouteDeconnexion = false;
let rafPlanifie = false;
let minuterieLiberation = null;
let liberation = null; // promesse de la libération en cours

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
        reject(
          new ErreurLecteur(
            'Impossible de charger la bibliothèque de téléversement : vérifier la connexion à Internet, puis réessayer.',
          ),
        );
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

// La carte n'est plus utilisable (débranchée, lecture série en erreur) : on
// repasse à « non connectée », sauf si une autre connexion a déjà pris le relais.
function perdre(courant, message) {
  if (dap !== courant) return;
  const appareil = peripherique;
  dap = null;
  peripherique = null;
  boucle = null;
  fermer(courant, appareil);
  changer({ connectee: false, erreur: message });
}

function demarrerSerie() {
  const courant = dap;
  boucle = courant.startSerialRead(10).catch((err) => {
    perdre(courant, messageFrancais(err, 'console'));
  });
}

async function arreterSerie() {
  if (!boucle) return;
  dap.stopSerialRead();
  await boucle;
  boucle = null;
}

function ecouterDeconnexion() {
  if (ecouteDeconnexion) return;
  ecouteDeconnexion = true;
  navigator.usb.addEventListener('disconnect', (evenement) => {
    if (dap && evenement.device === peripherique) {
      perdre(
        dap,
        'La carte a été débranchée : la rebrancher, puis cliquer sur « Connecter la carte ».',
      );
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
  // Dès maintenant, perdre() et les données série de cette connexion sont ignorées.
  dap = null;
  peripherique = null;
  boucle = null;
  tampon.vider();
  changer(ETAT_INITIAL);
  liberation = (async () => {
    if (boucleCourante) {
      courant.stopSerialRead();
      await boucleCourante;
    }
    await fermer(courant, appareil);
  })();
  await liberation;
  liberation = null;
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

function apresOperation() {
  changer({ occupee: false });
  if (abonnes.size === 0) planifierLiberation();
}

// id : l'exemple sous lequel on a cliqué, qui affichera une éventuelle erreur.
async function connecter(id, urlDapjs = URL_DAPJS) {
  if (dap || etat.occupee) return;
  // Tampon, console et messages sont ceux de la connexion précédente.
  tampon.vider();
  changer({ ...ETAT_INITIAL, occupee: true, dernierClic: id });
  let appareil = null;
  let nouvelle = null;
  try {
    // requestDevice d'abord : il doit suivre de près le clic de l'utilisateur.
    appareil = await navigator.usb.requestDevice({
      filters: [{ vendorId: VENDOR_ID_DAPLINK }],
    });
    // Une libération pas encore finie garde l'interface USB : on l'attend.
    await liberation;
    await chargerDapjs(urlDapjs);
    nouvelle = new window.DAPjs.DAPLink(new window.DAPjs.WebUSB(appareil));
    const connexion = nouvelle;
    nouvelle.on(window.DAPjs.DAPLink.EVENT_SERIAL_DATA, (donnees) => {
      if (dap === connexion && tampon.ajouter(donnees).length) planifierLignes();
    });
    await nouvelle.connect();
    await nouvelle.setSerialBaudrate(BAUDS);
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
    apresOperation();
  }
}

// Le bouton est bloqué dès l'appel : obtenirDonnees() (le téléchargement du
// .bin) se fait pendant que la carte est réservée. Si le téléchargement
// échoue, l'ancien programme continue et garde sa console. Sinon : arrête la
// lecture série, puis vide la console (dans cet ordre, pour que rien de
// l'ancien programme n'y passe), téléverse, et relance la lecture. Pas de
// dap.reset() : le DAPLink redémarre déjà la carte à la fin du flash. Ne
// rejette jamais : l'erreur est dans l'état.
async function televerser(id, obtenirDonnees) {
  if (!dap || etat.occupee) return;
  const courant = dap;
  changer({ occupee: true, erreur: null, dernierClic: id });
  try {
    const donnees = await obtenirDonnees();
    await arreterSerie();
    tampon.vider();
    changer({ programmeActif: null, lignes: [] });
    await courant.flash(donnees);
    if (dap === courant) changer({ programmeActif: id });
  } catch (err) {
    // Carte débranchée entre-temps : perdre() a déjà posé le message.
    if (dap === courant) changer({ erreur: messageFrancais(err, 'televersement') });
  } finally {
    if (dap === courant && !boucle) demarrerSerie();
    apresOperation();
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
  deconnecter,
  abonner,
  get etat() {
    return etat;
  },
};
