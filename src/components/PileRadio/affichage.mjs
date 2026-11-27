// Ce qu'affiche le bouton « Vérifier la pile radio » (PileRadio/index.js) :
// fonctions pures et petits suivis du parcours, sans DOM ni WebUSB, testés
// par affichage.test.mjs. Le déroulement lui-même est dans deroulement.mjs.
import { LIBELLE_RENVOI, TEXTE_PLUS_TARD, estOccupee } from './deroulement.mjs';

// --- Textes (ton neutre) ----------------------------------------------------

// Durée estimée d'après l'essai préalable (operator 11,5 s, puis lectures,
// installation de 416 ko de .hex, 5 s, UPGRADE et une minute d'attente) ; à
// corriger après la mesure de l'essai complet.
export const TEXTE_DUREE_PILE = "L'installation dure environ deux minutes.";

export const TEXTE_CONSIGNES_PILE =
  "Pendant l'installation, ne pas débrancher la carte, ne pas appuyer sur RESET et ne pas fermer la page.";

// Dernière étape de la mise à jour guidée du DAPLink : la carte redémarre
// avec son nouveau DAPLink, la connexion est perdue.
export const TEXTE_DERNIERE_ETAPE_DAPLINK =
  'Cliquer sur « Connecter la carte » et choisir la carte, puis cliquer de nouveau sur « Vérifier la pile radio ».';

const MESSAGES_ETAPES = Object.freeze({
  operateur: 'Écriture du programme de lecture sur la carte…',
  lecture: 'Lecture de la pile radio…',
  telechargement: 'Téléchargement de la pile radio depuis le wiki…',
  suppression: "Effacement de l'ancienne pile radio…",
  ecriture: 'Écriture de la nouvelle pile radio sur la carte…',
  upgrade: 'Installation de la pile radio par le FUS…',
  attente: `Le FUS installe la pile radio. ${TEXTE_CONSIGNES_PILE}`,
  relecture: 'Lecture de la pile radio installée…',
});

// La pile trouvée sur la carte, d'après la décision du parcours.
function texteTrouvee({ decision, trouvee, epinglee, pile }) {
  switch (decision) {
    case 'absente':
      return "Aucune pile radio n'est installée sur la carte.";
    case 'ancienne':
      return `La carte a la pile radio ${trouvee}, plus ancienne que celle du wiki (${epinglee}).`;
    case 'plus-recente':
      return `La carte a la pile radio ${trouvee}, plus récente que celle du wiki (${epinglee}). Le FUS peut refuser de revenir à une version plus ancienne : garder la pile en place, sauf raison précise.`;
    case 'a-jour':
      return `La carte a déjà la pile radio ${pile} ${epinglee} : elle sera réinstallée (indicateur de développement).`;
    default:
      return `La carte a une pile radio d'un autre type (version ${trouvee}), et non ${pile}.`;
  }
}

function texteAInstaller({ decision, epinglee, pile }) {
  const suite = decision === 'absente' ? '' : ", à la place de l'ancienne, qui sera effacée";
  return `La pile radio ${pile} ${epinglee} sera installée${suite}.`;
}

// Contenu d'une question du parcours : { paragraphes: [{ texte, fort }],
// boutons: [{ valeur, libelle, principal }] }. Le premier bouton reçoit le
// style principal, sauf s'il ne faut pas pousser à le choisir.
export function contenuEncart({ type, donnees }) {
  if (type === 'confirmation-verification') {
    return {
      paragraphes: [{ texte: donnees.texte, fort: false }],
      boutons: [
        { valeur: 'continuer', libelle: 'Continuer', principal: true },
        { valeur: 'annuler', libelle: 'Annuler', principal: false },
      ],
    };
  }
  if (type === 'daplink') {
    const raison = donnees.release
      ? `Avant d'installer la pile radio, mettre à jour le DAPLink de la carte (release ${donnees.release}) : sans lui, une installation interrompue peut laisser la carte sans pile radio.`
      : "La version du DAPLink attendue par le wiki n'a pas pu être lue : l'installation de la pile radio n'est pas possible pour l'instant. Recharger la page, puis cliquer de nouveau sur « Vérifier la pile radio ».";
    const boutons = donnees.release
      ? [{ valeur: 'mettre-a-jour', libelle: 'Mettre à jour le DAPLink…', principal: true }]
      : [];
    boutons.push({ valeur: 'plus-tard', libelle: 'Plus tard', principal: boutons.length === 0 });
    return {
      paragraphes: [
        { texte: texteTrouvee(donnees), fort: false },
        { texte: raison, fort: false },
      ],
      boutons,
    };
  }
  // 'proposition' : la seconde confirmation.
  const installer = { valeur: 'installer', libelle: 'Installer la pile radio' };
  const annuler = { valeur: 'annuler', libelle: 'Annuler' };
  const boutons =
    donnees.decision === 'plus-recente'
      ? [
          { ...annuler, principal: true },
          { ...installer, principal: false },
        ]
      : [
          { ...installer, principal: true },
          { ...annuler, principal: false },
        ];
  return {
    paragraphes: [
      { texte: texteTrouvee(donnees), fort: false },
      { texte: texteAInstaller(donnees), fort: false },
      { texte: TEXTE_DUREE_PILE, fort: false },
      { texte: TEXTE_CONSIGNES_PILE, fort: true },
    ],
    boutons,
  };
}

// Message annoncé (région aria-live) sous le bloc de la vérification : ce
// qui se passe pendant une étape occupée, sinon le message du parcours. Le
// décompte n'y est pas : il changerait chaque seconde. daplinkReporte : les
// étapes du DAPLink ont été fermées par « Plus tard » ; leur guide
// (« Suivre les étapes ci-dessous… ») laisse place à l'invitation à
// téléverser l'exemple.
export function messageEtape(etat, daplinkReporte = false) {
  if (daplinkReporte) return TEXTE_PLUS_TARD;
  return MESSAGES_ETAPES[etat.etape] ?? etat.message ?? null;
}

// Section de la procédure EasyFlash (docs/software/pile-radio.md), cible du
// renvoi des fins sans issue.
export const CIBLE_RENVOI = '/docs/software/pile-radio#installer-la-pile';

// Découpe un message ou une erreur du parcours en morceaux { texte, lien } :
// le renvoi vers EasyFlash (LIBELLE_RENVOI) devient un lien vers
// CIBLE_RENVOI, le reste du texte est rendu tel quel (lien null).
export function morceauxTexte(texte) {
  if (!texte) return [];
  const morceaux = [];
  texte.split(LIBELLE_RENVOI).forEach((partie, i) => {
    if (i > 0) morceaux.push({ texte: LIBELLE_RENVOI, lien: CIBLE_RENVOI });
    if (partie) morceaux.push({ texte: partie, lien: null });
  });
  return morceaux;
}

export function texteDecompte(secondes) {
  return `Temps restant : ${secondes}\u00a0s`;
}

// --- État du bouton ---------------------------------------------------------

// Le bouton n'existe que sous les exemples BLE.
export function pileRadioVisible(id) {
  return typeof id === 'string' && id.startsWith('BLE/');
}

// Actif carte connectée et libre, hors parcours. Pendant la première
// question, rien n'est envoyé mais une autre vérification serait refusée.
export function boutonPileActif(etatCarte, etatPile) {
  return (
    etatCarte.connectee &&
    !etatCarte.occupee &&
    !estOccupee(etatPile) &&
    etatPile.etape !== 'confirmation-verification'
  );
}

// Que faire du focus demandé par un clic du bloc (Vérifier, réponse d'un
// encart, Plus tard), le bouton cliqué ayant disparu ou étant grisé ?
// - 'oublier' : une question ou les étapes du DAPLink le prennent
//   elles-mêmes ; ou le parcours est fini alors que le bouton reste inactif
//   (carte perdue ou occupée) : garder la demande ferait sauter le focus
//   plus tard, au moment d'une reconnexion, peut-être sous un autre
//   exemple ;
// - 'attendre' : le parcours tient encore la carte, ou attend la première
//   réponse ;
// - 'focaliser' : le bouton est de nouveau actif.
export function issueFocus({ libre, question, etat }) {
  if (question) return 'oublier';
  if (libre) return 'focaliser';
  if (estOccupee(etat) || etat.etape === 'confirmation-verification') return 'attendre';
  return 'oublier';
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

// Fermer ou recharger la page couperait l'installation : de DELETE à la
// relecture, la pile est peut-être effacée.
const RETENUES = new Set(['suppression', 'ecriture', 'upgrade', 'attente', 'relecture']);

export function retenirFermeture(etat) {
  return RETENUES.has(etat.etape);
}

// Une question du bloc id attend une réponse : à abandonner si la carte est
// perdue (le parcours envoie START si besoin). Pendant une étape occupée,
// le parcours constate lui-même la perte de la carte.
export function questionEnAttente(etat, id) {
  return etat.id === id && etat.encart !== null;
}

// Bloc id quitté (navigation) alors que sa vérification n'est pas au repos :
// question en attente ou étape occupée. Sinon le parcours, qui continue,
// poserait une question sans bloc pour y répondre, et Téléverser et
// Déconnecter resteraient grisés sur toutes les pages. Une fois DELETE
// envoyé, annuler() est sans effet et l'installation va à son terme.
export function doitAbandonner(etat, id) {
  return questionEnAttente(etat, id) || (etat.id === id && estOccupee(etat));
}

// Indicateur de développement : propose l'installation même quand la pile
// est à jour (essai complet sur la carte). obtenirStockage : () =>
// localStorage, qui peut lever une exception (cookies bloqués).
export const CLE_FORCER = 'steami-pile-radio-forcer';

export function lireForcer(obtenirStockage) {
  try {
    return obtenirStockage()?.getItem(CLE_FORCER) === '1';
  } catch {
    return false;
  }
}

// --- Suivis du parcours -----------------------------------------------------

// Exemple dont le parcours a écrit l'operator sur la carte (id), null sinon.
// La carte le compte comme le programme de cet exemple (programmeActif) :
// tant qu'aucun téléversement ne l'a remplacé (oublier), le bloc affiche
// « Carte : connectée » et non « programme en cours ». Observable, pour
// useSyncExternalStore.
export function creerSuiviOperateur(parcours) {
  let id = null;
  const abonnes = new Set();
  const poser = (valeur) => {
    if (valeur === id) return;
    id = valeur;
    for (const fn of [...abonnes]) fn(id);
  };
  // 'lecture' suit toujours un flash réussi de l'operator.
  parcours.abonner((etat) => {
    if (etat.etape === 'lecture') poser(etat.id);
  });
  return {
    get id() {
      return id;
    },
    oublier() {
      poser(null);
    },
    abonner(fn) {
      abonnes.add(fn);
      return () => {
        abonnes.delete(fn);
      };
    },
  };
}

// Le programme de la carte est-il l'operator écrit depuis l'exemple id ?
// Un flash depuis un autre bloc change programmeActif, une déconnexion le
// remet à null.
export function operateurSurCarte(etatCarte, id) {
  return id !== null && etatCarte.programmeActif === id;
}

// La carte se libère une seconde après la disparition du dernier bloc
// abonné (navigation vers une autre page) : pendant le parcours, un
// abonnement la retient, pour ne jamais couper une installation.
export function retenirCarte(parcours, carte) {
  let liberer = null;
  return parcours.abonner((etat) => {
    if (estOccupee(etat)) {
      liberer ??= carte.abonner(() => {});
    } else if (liberer) {
      liberer();
      liberer = null;
    }
  });
}

// De la suppression à la relecture, fermer ou recharger l'onglet couperait
// l'installation : le navigateur demande confirmation. L'écouteur est posé
// au niveau du module, comme retenirCarte, pour rester actif après une
// navigation dans le wiki qui a fait disparaître le bloc. fenetre : window.
export function retenirOnglet(parcours, fenetre) {
  const avertir = (evenement) => {
    evenement.preventDefault();
    evenement.returnValue = '';
  };
  let pose = false;
  return parcours.abonner((etat) => {
    const retenir = retenirFermeture(etat);
    if (retenir && !pose) {
      fenetre.addEventListener('beforeunload', avertir);
      pose = true;
    } else if (!retenir && pose) {
      fenetre.removeEventListener('beforeunload', avertir);
      pose = false;
    }
  });
}
