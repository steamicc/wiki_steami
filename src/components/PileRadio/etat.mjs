// Ce que les blocs EssayerExemple et EssayerMicroPython lisent de la
// vérification de la pile radio, sans charger PileRadio : état initial,
// étapes occupées, règles des boutons partagés, et le relais qui les branche
// sur le parcours de la page.
//
// Module léger, sans import ni effet de bord : PileRadio (index.js et son
// déroulement) n'est chargé, par un import dynamique, que sous les exemples
// BLE/… (EssayerExemple/index.js). Tant qu'il ne l'est pas, le relais rend
// l'état initial : aucune vérification ne peut tourner sur la page.

// Étapes pendant lesquelles la vérification tient la carte (voir
// deroulement.mjs) : Téléverser et Déconnecter restent inactifs.
const OCCUPEES = new Set([
  'operateur',
  'lecture',
  'proposition',
  'daplink',
  'telechargement',
  'suppression',
  'ecriture',
  'upgrade',
  'attente',
  'relecture',
]);

export function estOccupee(etat) {
  return OCCUPEES.has(etat.etape);
}

export const ETAT_INITIAL_PILE = Object.freeze({
  etape: 'repos',
  // Bloc d'où vient la vérification : lui seul affiche encarts et messages.
  id: null,
  // Question en attente : { type, donnees } ; type 'confirmation-verification'
  // (choix 'continuer'), 'proposition' ('installer') ou 'daplink'
  // ('mettre-a-jour', 'plus-tard').
  encart: null,
  message: null,
  erreur: null,
  // Secondes restantes pendant 'attente', null sinon.
  decompte: null,
  // { pile: { version, secteurs }, fus: { majeur, mineur, sous },
  //   epinglee: { pile, version, secteurs, sha256Installation }, relue } une
  //   fois lues.
  versions: null,
  // Mise à jour guidée du DAPLink à afficher : { release }.
  daplink: null,
});

// Le bouton n'existe que sous les exemples BLE.
export function pileRadioVisible(id) {
  return typeof id === 'string' && id.startsWith('BLE/');
}

// Téléverser et Déconnecter (EssayerExemple), sous tous les exemples : grisés
// pendant une opération de la carte et pendant toute étape occupée de la
// vérification, qui tient la carte.
export function controlesOccupes(etatCarte, etatPile) {
  return etatCarte.occupee || estOccupee(etatPile);
}

// Erreur de carte.mjs sous le bloc id : masquée tant que sa vérification est
// en erreur. Celle du parcours dit déjà ce qui s'est passé, alors que celle
// de carte.mjs (flash de l'operator raté) parle de MicroPython.
export function erreurCarteVisible(etatPile, id) {
  return !(etatPile.id === id && etatPile.etape === 'erreur');
}

// Le programme de la carte est-il l'operator écrit depuis l'exemple id ?
// Un flash depuis un autre bloc change programmeActif, une déconnexion le
// remet à null.
export function operateurSurCarte(etatCarte, id) {
  return id !== null && etatCarte.programmeActif === id;
}

// Relais vers le parcours de la page (parcoursPile) et le suivi de
// l'operator (suiviOperateur), branchés par PileRadio/index.js à son
// chargement. Observable, pour useSyncExternalStore : etat et idOperateur
// gardent la même valeur tant que rien ne change.
export function creerRelaisPile() {
  let parcours = null;
  let suivi = null;
  const abonnes = new Set();
  const prevenir = () => {
    for (const fn of [...abonnes]) fn();
  };
  return {
    // Un seul parcours par page : un second branchement est ignoré.
    brancher(nouveauParcours, nouveauSuivi) {
      if (parcours) return;
      parcours = nouveauParcours;
      suivi = nouveauSuivi;
      parcours.abonner(prevenir);
      suivi.abonner(prevenir);
      prevenir();
    },
    get etat() {
      return parcours?.etat ?? ETAT_INITIAL_PILE;
    },
    get idOperateur() {
      return suivi?.id ?? null;
    },
    abonner(fn) {
      abonnes.add(fn);
      return () => {
        abonnes.delete(fn);
      };
    },
    // Voir parcoursPile.oublierErreur : false si rien n'est effacé.
    oublierErreur() {
      return parcours?.oublierErreur() ?? false;
    },
    // Le programme de lecture va être remplacé (Téléverser).
    oublierOperateur() {
      suivi?.oublier();
    },
  };
}

export const relaisPile = creerRelaisPile();
