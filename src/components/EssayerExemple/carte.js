// Connexion à la carte, partagée par tous les <EssayerExemple> d'une page.
// DAP.js (global DAPjs) n'est chargé qu'au premier clic sur « Connecter la carte ».
import { TamponLignes, messageErreur } from './logique.mjs';

const VENDOR_ID_DAPLINK = 0x0d28;
const BAUDS = 115200;
const URL_DAPJS = '/vendor/dapjs-2.3.0/dap.umd.js';

const tampon = new TamponLignes();
const abonnes = new Set();

let dap = null;
let peripherique = null;
let boucle = null; // promesse de startSerialRead : ne rejette jamais (erreurs gérées dedans)
let promesseDapjs = null; // partagée : le script n'est injecté qu'une fois
let ecouteDeconnexion = false;
let rafPlanifie = false;

let etat = {
  connectee: false,
  occupee: false,
  exempleActif: null,
  lignes: [],
  erreur: null,
};

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
        reject(new Error('Impossible de charger la bibliothèque de téléversement : réessayez.'));
      };
      document.head.append(script);
    });
  }
  return promesseDapjs;
}

// La carte n'est plus utilisable (débranchée, lecture série en erreur) : on
// repasse à « non connectée », sauf si une autre connexion a déjà pris le relais.
function perdre(courant, message) {
  if (dap !== courant) return;
  dap = null;
  peripherique = null;
  boucle = null;
  // Libère l'interface USB ; la carte peut déjà être partie.
  courant.disconnect().catch(() => {});
  changer({ connectee: false, erreur: message });
}

function demarrerSerie() {
  const courant = dap;
  boucle = courant.startSerialRead(10).catch((err) => {
    perdre(courant, messageErreur(err));
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
    if (dap && evenement.device === peripherique) perdre(dap, 'La carte a été débranchée.');
  });
}

async function connecter(urlDapjs = URL_DAPJS) {
  if (dap || etat.occupee) return;
  // Tampon et exemple actif sont ceux de la connexion précédente.
  tampon.vider();
  changer({ occupee: true, erreur: null, exempleActif: null, lignes: [] });
  try {
    // requestDevice d'abord : il doit suivre de près le clic de l'utilisateur.
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: VENDOR_ID_DAPLINK }],
    });
    await chargerDapjs(urlDapjs);
    const nouvelle = new window.DAPjs.DAPLink(new window.DAPjs.WebUSB(device));
    nouvelle.on(window.DAPjs.DAPLink.EVENT_SERIAL_DATA, (donnees) => {
      if (tampon.ajouter(donnees).length) planifierLignes();
    });
    await nouvelle.connect();
    await nouvelle.setSerialBaudrate(BAUDS);
    dap = nouvelle;
    peripherique = device;
    ecouterDeconnexion();
    changer({ connectee: true });
    demarrerSerie();
  } catch (err) {
    changer({ connectee: false, erreur: messageErreur(err) });
  } finally {
    changer({ occupee: false });
  }
}

// Le bouton est bloqué dès l'appel : obtenirDonnees() (le téléchargement du
// .bin) se fait pendant que la carte est réservée. Arrête ensuite la lecture
// série, téléverse, puis relance la lecture. Pas de dap.reset() : le DAPLink
// redémarre déjà la carte à la fin du flash. Ne rejette jamais : l'erreur est
// dans l'état.
async function televerser(id, obtenirDonnees) {
  if (!dap || etat.occupee) return;
  const courant = dap;
  tampon.vider();
  changer({ occupee: true, erreur: null, exempleActif: id, lignes: [] });
  try {
    const donnees = await obtenirDonnees();
    await arreterSerie();
    await courant.flash(donnees);
  } catch (err) {
    // Carte débranchée entre-temps : perdre() a déjà posé le message.
    if (dap === courant) changer({ erreur: messageErreur(err) });
  } finally {
    if (dap === courant && !boucle) demarrerSerie();
    changer({ occupee: false });
  }
}

function abonner(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

export const carte = {
  connecter,
  televerser,
  abonner,
  get etat() {
    return etat;
  },
};
