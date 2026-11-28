// Décision et état de l'encart « DAPLink à mettre à jour » du bouton Essayer
// (exemples Arduino), sans accès à la carte ni au DOM : le composant fournit
// la lecture de la commande 0x9F et le chargement de firmware.json.
// L'encart propose, il n'empêche rien : tout échec de lecture le laisse masqué.
import {
  decisionMiseAJour,
  lireFirmwareEpingle,
  lireVersionSteami,
} from '../EssayerMicroPython/logique.mjs';

// Seules les cartes STeaMi (numéro de série en 0839) reçoivent la proposition :
// un micro:bit ou un DAPLink d'origine n'est pas concerné.
export function estSteami(numeroSerie) {
  return typeof numeroSerie === 'string' && numeroSerie.startsWith('0839');
}

// reponse : DataView de la commande 0x9F, ou null si la lecture a échoué.
// epingle : firmware épinglé analysé, ou null. Une réponse sans « STM1 »
// (DAPLink antérieur à 0x9F) est jugée ancienne par decisionMiseAJour.
export function decisionEncart({ numeroSerie, reponse, epingle }) {
  const rien = { proposer: false, release: null };
  if (!estSteami(numeroSerie) || reponse === null || epingle === null) return rien;
  if (decisionMiseAJour(lireVersionSteami(reponse), epingle) !== 'ancien') return rien;
  return { proposer: true, release: epingle.release };
}

// release : la release à proposer, null si rien n'est à proposer.
// reporte : « Plus tard » a été choisi, dans cet encart, ou dans la question
// ou les étapes du DAPLink de « Vérifier la pile radio ».
// autreEncart : les étapes du DAPLink de « Vérifier la pile radio » sont
// affichées sur la page, ou une vérification relancée après elles est en
// cours ; l'encart du bouton Essayer se masque pendant ce temps, pour qu'un
// seul encart d'étapes soit visible.
export const ETAT_INITIAL_DAPLINK = Object.freeze({
  release: null,
  reporte: false,
  autreEncart: false,
});

// État partagé par toute la page : « Plus tard » vaut jusqu'au rechargement,
// et une déconnexion ne le modifie pas (seuls verifier et reporter le font).
let etat = ETAT_INITIAL_DAPLINK;
// Étapes de « Vérifier la pile radio » affichées (voir afficherAutreEncart).
let autresEncarts = 0;
const abonnes = new Set();

function changer(suivant) {
  etat = Object.freeze(suivant);
  for (const fn of [...abonnes]) fn();
}

// L'encart du bouton Essayer sous le bloc cliqué en dernier (clique) : une
// release à proposer, et pas d'autre encart d'étapes sur la page.
export function encartVisible(etatDaplink, clique) {
  return clique && etatDaplink.release !== null && !etatDaplink.autreEncart;
}

export const verificationDaplink = {
  get etat() {
    return etat;
  },

  abonner(fn) {
    abonnes.add(fn);
    return () => abonnes.delete(fn);
  },

  // Ne rejette jamais : toute erreur laisse l'encart masqué.
  async verifier({ numeroSerie, lireReponse, chargerEpingle }) {
    let release = null;
    try {
      const epingle = lireFirmwareEpingle(await chargerEpingle());
      const reponse = await lireReponse();
      const decision = decisionEncart({ numeroSerie, reponse, epingle });
      if (decision.proposer && !etat.reporte) release = decision.release;
    } catch {
      release = null;
    }
    changer({ ...etat, release });
  },

  // « Plus tard », dans cet encart, ou dans la question ou les étapes du
  // DAPLink de PileRadio.
  reporter() {
    changer({ ...etat, release: null, reporte: true });
  },

  // PileRadio affiche ses étapes du DAPLink (masqueEncartEssayer) : l'encart
  // du bouton Essayer se masque jusqu'à l'appel de la fonction rendue (étapes
  // retirées hors d'une vérification relancée, ou bloc démonté), sans rien
  // perdre de release ni de reporte. Un compteur, et non
  // un booléen : un second affichage ne doit pas être retiré par le premier.
  afficherAutreEncart() {
    autresEncarts += 1;
    changer({ ...etat, autreEncart: true });
    let retire = false;
    return () => {
      if (retire) return;
      retire = true;
      autresEncarts -= 1;
      changer({ ...etat, autreEncart: autresEncarts > 0 });
    };
  },

  // Pour les tests uniquement.
  reinitialiser() {
    autresEncarts = 0;
    changer(ETAT_INITIAL_DAPLINK);
  },
};
