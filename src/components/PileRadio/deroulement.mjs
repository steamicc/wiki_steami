// Déroulement du bouton « Vérifier la pile radio » (exemples BLE), étapes 1 à 6
// de la conception (conception/2026-11-27-bouton-pile-radio-design.md,
// Décision 3, et Résultats de l'essai préalable).
//
// Sans DOM ni WebUSB : tout passe par les dépendances de verifier(id, deps),
// ce qui permet de le tester avec une carte et un operator simulés
// (deroulement.test.mjs) :
// - carte : la connexion partagée (EssayerExemple/carte.mjs) : flasherFirmware
//   (accepte le texte d'un .hex), flasherDonnees (les octets du .hex
//   d'installation, lus avant DELETE), ecrireSerie, ecouterSerie,
//   lireVersionDaplink, etat ;
// - urls : { operateur, installation, index, daplink } (/pile-radio/… et
//   /daplink/firmware.json) ;
// - recuperer : fetch, injectable (lecture de index.json et de firmware.json,
//   téléchargement du .hex d'installation avant DELETE) ;
// - attendre(ms) : l'attente, injectable ; creerOperateur : operateur.mjs ;
// - delais : remplace tout ou partie de DELAIS_PILE ;
// - forcer : propose l'installation même quand la pile est à jour. Seule
//   l'interface le lit, dans localStorage['steami-pile-radio-forcer'] === '1'
//   (indicateur de développement, pour l'essai complet sur la carte).
//
// Règles (conception et essai préalable) :
// - rien ne part vers la carte avant « Continuer » ;
// - lectures dans l'ordre VERSION (pile en marche : version et taille), double
//   STATUS, VERSION (version du FUS) ;
// - si le premier VERSION répond depuis le FUS : double STATUS (FUS au
//   travail : fin sans START) ; puis, si le FUS annonce une pile installée
//   (restée arrêtée par un parcours interrompu), START, une attente et un
//   nouveau VERSION ; s'il répond encore depuis le FUS, rien n'est proposé et
//   le message renvoie vers EasyFlash ;
// - une réinitialisation ne relance pas la pile : dès le double STATUS envoyé
//   et tant que DELETE ne l'a pas été, toute fin du parcours (à jour, refus du
//   FUS, DAPLink non épinglé, Annuler, Plus tard, erreur) envoie START ;
// - l'installation exige le DAPLink épinglé (illisible : non épinglé) et un
//   second « oui » (« Installer la pile radio ») ;
// - le .hex d'installation est téléchargé avant DELETE : s'il manque, DELETE
//   ne part pas (START, rien n'est effacé) ; ses octets sont écrits tels
//   quels après DELETE, sans nouvelle requête ;
// - après DELETE : plus d'annulation, jamais de nouvel essai automatique, et
//   jamais de nouvelle proposition pendant que le FUS travaille (0x10-0x3F) ;
// - relecture après UPGRADE : double STATUS (attente tant que le FUS
//   travaille), puis toujours VERSION et START ; la pile relue décide (pile
//   épinglée : réussite, même si last_fus_status ou last_ws_status est non
//   nul ; sinon échec, avec le texte du code s'il est non nul).
import {
  decisionFus,
  decisionPile,
  decoderVersion,
  etatFus,
  lirePileEnMarche,
  reponseDuFus,
  texteErreurFus,
} from './logique.mjs';
import { DELAIS_OPERATEUR, ErreurDelaiOperateur, ErreurFus, creerOperateur } from './operateur.mjs';
import { decisionMiseAJour, lireFirmwareEpingle } from '../EssayerMicroPython/logique.mjs';
import { MESSAGE_FLASH_EN_COURS, messageFrancais } from '../EssayerExemple/logique.mjs';

// Délais (ms) :
// - apresCommande, avantUpgrade, ligneUpgrade : ceux de l'operator
//   (DELAIS_OPERATEUR, d'après EasyFlash) ;
// - attenteApresUpgrade : attente sans rien envoyer après l'acceptation
//   d'UPGRADE, avec un décompte visible ;
// - relectureMax, pasRelecture : relectures tant que le FUS travaille ;
// - demarrageOperateur : entre le flash de l'operator et la première commande
//   (essai préalable : VERSION répond 2 à 3 s après le flash) ;
// - relancePile : entre START (pile restée arrêtée) et le nouveau VERSION.
export const DELAIS_PILE = Object.freeze({
  ...DELAIS_OPERATEUR,
  attenteApresUpgrade: 60000,
  relectureMax: 120000,
  pasRelecture: 10000,
  demarrageOperateur: 2000,
  relancePile: 2000,
});

// Pas du décompte affiché pendant l'attente (ms).
const PAS_DECOMPTE_MS = 1000;

// --- Textes (ton neutre) ----------------------------------------------------

// Renvoi vers la procédure EasyFlash du wiki. L'interface fait de
// LIBELLE_RENVOI un lien vers la section (affichage.mjs, morceauxTexte).
export const LIBELLE_RENVOI = 'la page « Pile radio Bluetooth », section « Installer la pile »';

const RENVOI_EASYFLASH = `Installer la pile radio avec DapLink-EasyFlash : voir ${LIBELLE_RENVOI}.`;

export const TEXTE_CONFIRMATION_VERIFICATION =
  "La vérification remplace le programme de la carte par un programme de lecture, et efface toute la mémoire du programme : MicroPython et ses fichiers compris. La pile radio n'est pas touchée. Après la vérification, téléverser de nouveau l'exemple.";

export const TEXTE_EPINGLAGE_PILE_ILLISIBLE =
  'Impossible de lire la version de la pile radio proposée par le wiki : vérifier la connexion à Internet, puis recharger la page.';

export const TEXTE_CARTE_PERDUE_PILE =
  'La carte a été déconnectée : la rebrancher, puis cliquer de nouveau sur « Vérifier la pile radio ».';

export const TEXTE_ECHEC_OPERATEUR =
  "Le programme de lecture de la pile radio n'a pas pu être écrit sur la carte : cliquer de nouveau sur « Vérifier la pile radio ».";

export const TEXTE_OPERATEUR_MUET =
  'Le programme de lecture de la pile radio ne répond pas : débrancher puis rebrancher la carte, puis cliquer de nouveau sur « Vérifier la pile radio ».';

export const TEXTE_TELECHARGEMENT_PILE =
  "Impossible de télécharger la pile radio depuis le wiki : rien n'a été effacé sur la carte. Vérifier la connexion à Internet, puis cliquer de nouveau sur « Vérifier la pile radio ».";

export const TEXTE_ANNULE =
  "Vérification arrêtée. Le programme de la carte a été remplacé : téléverser l'exemple pour l'essayer.";

export const TEXTE_PLUS_TARD =
  "Installation de la pile radio reportée. Le programme de la carte a été remplacé : téléverser l'exemple pour l'essayer.";

// La pile est annoncée par le FUS mais ne redémarre pas avec START : le FUS
// répond toujours. Une réinitialisation ne relance pas la pile, et une nouvelle
// vérification refait le même chemin (conception, « Résultats de l'essai
// préalable ») : renvoi vers EasyFlash pour la réinstaller. Le bouton ne
// propose pas l'installation dans ce cas (à trancher par l'utilisateur).
export const TEXTE_PILE_ARRETEE = `La pile radio de la carte est arrêtée et ne redémarre pas. ${RENVOI_EASYFLASH} Téléverser ensuite l'exemple.`;

export const TEXTE_DAPLINK_GUIDE =
  'Suivre les étapes ci-dessous pour mettre à jour le DAPLink, puis cliquer de nouveau sur « Vérifier la pile radio ».';

// Le FUS est déjà au travail à la lecture (installation commencée ailleurs, ou
// par une page fermée trop tôt) : rien n'est proposé, START n'est pas envoyé.
export const TEXTE_FUS_OCCUPE =
  'Le FUS de la carte est en train de modifier la pile radio : ne pas débrancher la carte, attendre deux minutes, puis cliquer de nouveau sur « Vérifier la pile radio ».';

export const TEXTE_FUS_TRAVAILLE =
  "Le FUS de la carte travaille encore après l'installation : ne pas débrancher la carte, attendre quelques minutes, puis cliquer de nouveau sur « Vérifier la pile radio ».";

export const TEXTE_PILE_PEUT_ETRE_EFFACEE = `L'installation s'est interrompue après l'effacement de l'ancienne pile : la pile radio est peut-être effacée. ${RENVOI_EASYFLASH}`;

export const TEXTE_SANS_REPONSE =
  "Le programme de lecture ne répond plus après l'installation, ce qui ne veut pas dire qu'elle a échoué. Téléverser l'exemple : s'il démarre le BLE, la pile radio est en place.";

// START raté après une installation réussie : la pile est peut-être restée
// arrêtée ; une nouvelle vérification la relance.
export const TEXTE_RELANCE_RATEE =
  "Si l'exemple ne démarre pas le BLE, cliquer de nouveau sur « Vérifier la pile radio » pour relancer la pile.";

export const TEXTE_PILE_ABSENTE_APRES = `Aucune pile radio n'est lue après l'installation. Cliquer de nouveau sur « Vérifier la pile radio » pour la réinstaller, ou : ${RENVOI_EASYFLASH}`;

function texteVersion({ majeur, mineur, sous }) {
  return `${majeur}.${mineur}.${sous}`;
}

export function texteFusRefuse(fus, avis) {
  const raison =
    avis === 'ancien' ? 'est trop ancien pour ce bouton' : "n'est pas reconnu par ce bouton";
  return `Le FUS de la carte (version ${texteVersion(fus)}) ${raison}. ${RENVOI_EASYFLASH} Téléverser ensuite l'exemple.`;
}

export function texteAJour({ pile, version }) {
  return `La pile radio est à jour (${pile} ${version}). Téléverser l'exemple pour l'essayer.`;
}

export function texteFini({ pile }, relue) {
  return `Pile radio ${pile} ${relue} installée. Téléverser l'exemple pour l'essayer.`;
}

export function texteEchecInstallation(code) {
  return `L'installation de la pile radio a échoué : ${texteErreurFus(code)} ${RENVOI_EASYFLASH}`;
}

export function texteAutrePile(relue, attendue) {
  return `La carte a la pile radio ${relue} après l'installation, et non ${attendue}. ${RENVOI_EASYFLASH}`;
}

// --- État -------------------------------------------------------------------

// Étapes :
// - 'repos', 'a-jour', 'fini', 'erreur' : rien ne tourne ;
// - 'confirmation-verification' : première question, rien n'est envoyé ;
// - 'operateur' (lecture des épinglages, flash de l'operator), 'lecture',
//   'proposition', 'daplink' (questions, la pile est arrêtée),
//   'telechargement' (le .hex d'installation, avant DELETE), 'suppression',
//   'ecriture', 'upgrade', 'attente' (décompte), 'relecture' : la carte est
//   prise, Téléverser et Déconnecter restent inactifs.
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
  //   epinglee: { pile, version, secteurs }, relue } une fois lues.
  versions: null,
  // Mise à jour guidée du DAPLink à afficher : { release }.
  daplink: null,
});

// Pile épinglée par le wiki (/pile-radio/index.json), null si illisible.
export function lirePileEpinglee(json) {
  if (!json || typeof json.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(json.version)) {
    return null;
  }
  if (!Number.isInteger(json.secteurs) || json.secteurs <= 0) return null;
  return {
    pile: typeof json.pile === 'string' ? json.pile : '',
    version: json.version,
    secteurs: json.secteurs,
  };
}

// Télécharge le .hex d'installation en entier (corps compris) : ses octets
// (ArrayBuffer), ou null s'il manque ou est vide. Ces octets sont écrits
// après DELETE par carte.flasherDonnees, sans nouvelle requête : un réseau
// perdu pendant DELETE ne laisse pas la carte sans pile.
async function telechargerInstallation(url, recuperer) {
  try {
    const reponse = await recuperer(url, { cache: 'no-cache' });
    if (!reponse.ok) return null;
    const donnees = await reponse.arrayBuffer();
    return donnees.byteLength > 0 ? donnees : null;
  } catch {
    return null;
  }
}

async function lireJson(url, recuperer) {
  try {
    const reponse = await recuperer(url, { cache: 'no-cache' });
    return reponse.ok ? await reponse.json() : null;
  } catch {
    return null;
  }
}

const dormir = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));

// Le FUS modifie une pile, lui-même ou un service (0x10 à 0x3F).
function fusAuTravail(status) {
  return ['pile', 'fus', 'service'].includes(etatFus(status));
}

// Code d'erreur non nul de la relecture (last_fus_status, puis
// last_ws_status), null si aucun.
function codeEchec(statut) {
  for (const code of [statut?.last_fus_status, statut?.last_ws_status]) {
    if (Number.isInteger(code) && code !== 0) return code;
  }
  return null;
}

// Écart entre la pile relue après l'installation et l'épinglée : texte de
// l'échec, null si c'est l'épinglée. Pile en marche, VERSION donne la version
// et la taille (secteurs) ; sur le FUS, l'octet de poids faible de ws_version
// n'est pas la taille (conception, essai préalable) : la version seule
// décide.
function ecartPileRelue(reponseVersion, epinglee) {
  const pile = lirePileEnMarche(reponseVersion);
  if (pile.version === null) return TEXTE_PILE_ABSENTE_APRES;
  if (reponseDuFus(reponseVersion)) {
    return pile.version === epinglee.version
      ? null
      : texteAutrePile(pile.version, epinglee.version);
  }
  const decision = decisionPile(pile, epinglee);
  if (decision === 'a-jour') return null;
  if (decision === 'autre') {
    return texteAutrePile(
      `${pile.version} (${pile.secteurs} secteurs)`,
      `${epinglee.version} (${epinglee.secteurs} secteurs)`,
    );
  }
  return texteAutrePile(pile.version, epinglee.version);
}

// Échec de la relecture accompagné d'un code non nul du FUS ou de la pile.
function texteEchecCode(code, ecart) {
  return `L'installation de la pile radio a échoué : ${texteErreurFus(code)} ${ecart}`;
}

// Message d'une erreur de lecture, avant DELETE.
function messageLecture(err, carte) {
  if (!carte.etat.connectee) return TEXTE_CARTE_PERDUE_PILE;
  if (err instanceof ErreurDelaiOperateur) return TEXTE_OPERATEUR_MUET;
  return messageFrancais(err, 'ecriture');
}

// Session de vérification de la pile radio, observable comme creerSession
// (EssayerMicroPython/deroulement.mjs). Une seule vérification à la fois.
export function creerParcoursPile() {
  let etat = ETAT_INITIAL_PILE;
  let enCours = false;
  let reponse = null;
  // annuler() demandé ; sans effet une fois DELETE envoyé.
  let annulation = false;
  let supprimee = false;
  const abonnes = new Set();

  function poser(partie) {
    etat = { ...etat, ...partie };
    for (const fn of [...abonnes]) fn(etat);
  }

  function demander(etape, donnees) {
    return new Promise((resoudre) => {
      reponse = resoudre;
      poser({ etape, encart: { type: etape, donnees } });
    });
  }

  function repondre(choix) {
    const r = reponse;
    if (!r) return false;
    reponse = null;
    poser({ encart: null });
    r(choix);
    return true;
  }

  async function derouler(id, deps) {
    const { carte, urls } = deps;
    const delais = { ...DELAIS_PILE, ...deps.delais };
    const attendre = deps.attendre ?? dormir;
    const recuperer = deps.recuperer ?? ((...args) => fetch(...args));
    const fabriquer = deps.creerOperateur ?? creerOperateur;

    poser({ ...ETAT_INITIAL_PILE, id });

    // Fin sur annuler() après l'écriture de l'operator. L'interface l'appelle
    // aussi quand la carte disparaît pendant une question : le dire alors,
    // plutôt que « Vérification arrêtée ».
    const annulee = () =>
      carte.etat.connectee
        ? ['annule', { etape: 'repos', message: TEXTE_ANNULE }]
        : ['erreur', { etape: 'erreur', erreur: TEXTE_CARTE_PERDUE_PILE }];
    // Avant l'écriture de l'operator, rien n'a changé : retour au repos, sauf
    // carte perdue.
    const annuleeAvantOperateur = () => {
      const [fin, partie] = annulee();
      poser(fin === 'annule' ? { ...ETAT_INITIAL_PILE } : { encart: null, ...partie });
      return { fin };
    };

    // 1. Première confirmation : rien ne part vers la carte avant.
    const choix = await demander('confirmation-verification', {
      id,
      texte: TEXTE_CONFIRMATION_VERIFICATION,
    });
    if (choix !== 'continuer' || annulation) return annuleeAvantOperateur();

    // 2. Épinglages, version du DAPLink (illisible pendant un flash), puis
    // flash de l'operator.
    poser({ etape: 'operateur' });
    if (!carte.etat.connectee) {
      poser({ etape: 'erreur', erreur: TEXTE_CARTE_PERDUE_PILE });
      return { fin: 'erreur' };
    }
    if (carte.etat.occupee) {
      poser({ etape: 'erreur', erreur: MESSAGE_FLASH_EN_COURS });
      return { fin: 'erreur' };
    }
    const epinglee = lirePileEpinglee(await lireJson(urls.index, recuperer));
    if (!epinglee) {
      poser({ etape: 'erreur', erreur: TEXTE_EPINGLAGE_PILE_ILLISIBLE });
      return { fin: 'erreur' };
    }
    const daplinkEpingle = lireFirmwareEpingle(await lireJson(urls.daplink, recuperer));
    const versionDaplink = await carte.lireVersionDaplink();
    if (annulation) return annuleeAvantOperateur();
    // Ne rejette jamais ; le détail de l'échec est dans carte.etat.erreur.
    if (!(await carte.flasherFirmware(id, urls.operateur))) {
      poser({
        etape: 'erreur',
        erreur: carte.etat.connectee ? TEXTE_ECHEC_OPERATEUR : TEXTE_CARTE_PERDUE_PILE,
      });
      return { fin: 'erreur' };
    }
    await attendre(delais.demarrageOperateur);
    if (annulation) {
      const [fin, partie] = annulee();
      poser(partie);
      return { fin };
    }

    // 3. Lectures et décision.
    poser({ etape: 'lecture' });
    const operateur = fabriquer({
      ecrire: carte.ecrireSerie,
      ecouter: carte.ecouterSerie,
      attendre,
      delais,
    });
    let statusEnvoye = false;
    // Octets du .hex d'installation, lus avant DELETE.
    let installation = null;
    // Fin avant DELETE : START d'abord si STATUS est parti (une erreur de
    // START, carte partie, ne cache pas celle du parcours).
    const finir = async (fin, partie) => {
      if (statusEnvoye) {
        try {
          await operateur.relancer();
        } catch {
          // Rien de plus à tenter : la fin du parcours le dit.
        }
      }
      poser({ encart: null, ...partie });
      return { fin };
    };

    try {
      let reponseVersion = await operateur.version();
      // Double STATUS déjà lu sur le FUS, à ne pas refaire ; null sinon.
      let statut = null;
      if (reponseDuFus(reponseVersion)) {
        // Le FUS répond : la pile est absente, ou restée arrêtée par le
        // STATUS d'un parcours interrompu (une réinitialisation ne la relance
        // pas). Sur le FUS, VERSION donne une autre taille de pile : une pile
        // à jour serait proposée à l'installation. STATUS d'abord, sans
        // risque sur le FUS : s'il travaille déjà, START ne doit pas
        // l'interrompre.
        statusEnvoye = true;
        statut = await operateur.statusDouble();
        if (fusAuTravail(statut?.status)) {
          statusEnvoye = false;
          return finir('fus-occupe', { etape: 'erreur', erreur: TEXTE_FUS_OCCUPE });
        }
        if (annulation) return finir(...annulee());
        // Une pile installée : la relancer, puis la relire en marche. Sans
        // pile, il n'y a rien à relancer.
        if (lirePileEnMarche(reponseVersion).version !== null) {
          await operateur.relancer();
          statusEnvoye = false;
          statut = null;
          await attendre(delais.relancePile);
          if (annulation) return finir(...annulee());
          reponseVersion = await operateur.version();
          if (reponseDuFus(reponseVersion)) {
            return finir('pile-arretee', { etape: 'erreur', erreur: TEXTE_PILE_ARRETEE });
          }
        }
      }
      const pile = lirePileEnMarche(reponseVersion);
      if (annulation) return finir(...annulee());
      statusEnvoye = true;
      statut ??= await operateur.statusDouble();
      if (annulation) return finir(...annulee());
      const fus = decoderVersion((await operateur.version())?.fus_version ?? 0);
      poser({ versions: { pile, fus, epinglee, relue: null } });
      if (annulation) return finir(...annulee());
      if (fusAuTravail(statut?.status)) {
        // Le FUS modifie déjà la pile : ne pas l'interrompre par START.
        statusEnvoye = false;
        return finir('fus-occupe', { etape: 'erreur', erreur: TEXTE_FUS_OCCUPE });
      }
      const avisFus = decisionFus(fus);
      if (avisFus !== 'ok') {
        return finir('fus', { etape: 'erreur', erreur: texteFusRefuse(fus, avisFus) });
      }
      const decision = decisionPile(pile, epinglee);
      if (decision === 'a-jour' && !deps.forcer) {
        return finir('a-jour', { etape: 'a-jour', message: texteAJour(epinglee) });
      }
      const donnees = {
        id,
        decision,
        trouvee: pile.version,
        epinglee: epinglee.version,
        pile: epinglee.pile,
      };

      // DAPLink non épinglé, ou illisible : pas d'installation, mise à jour
      // guidée proposée.
      const daplinkOk =
        daplinkEpingle !== null && decisionMiseAJour(versionDaplink, daplinkEpingle) === 'a-jour';
      if (!daplinkOk) {
        const release = daplinkEpingle?.release ?? null;
        const choixDaplink = await demander('daplink', { ...donnees, release });
        if (annulation || choixDaplink === 'annuler') {
          return finir(...annulee());
        }
        if (choixDaplink === 'mettre-a-jour' && release) {
          return finir('daplink', {
            etape: 'fini',
            daplink: { release },
            message: TEXTE_DAPLINK_GUIDE,
          });
        }
        return finir('plus-tard', { etape: 'repos', message: TEXTE_PLUS_TARD });
      }

      // Seconde confirmation : « Installer la pile radio ».
      const choixInstallation = await demander('proposition', donnees);
      if (choixInstallation !== 'installer' || annulation) {
        return finir(...annulee());
      }
      if (!carte.etat.connectee) {
        return finir('erreur', { etape: 'erreur', erreur: TEXTE_CARTE_PERDUE_PILE });
      }
      // Le .hex d'installation avant DELETE : un échec réseau après DELETE
      // laisserait la carte sans pile.
      poser({ etape: 'telechargement' });
      installation = await telechargerInstallation(urls.installation, recuperer);
      if (!installation) {
        return finir('erreur', { etape: 'erreur', erreur: TEXTE_TELECHARGEMENT_PILE });
      }
      if (annulation) return finir(...annulee());
      if (!carte.etat.connectee) {
        return finir('erreur', { etape: 'erreur', erreur: TEXTE_CARTE_PERDUE_PILE });
      }
    } catch (err) {
      return finir('erreur', { etape: 'erreur', erreur: messageLecture(err, carte) });
    }

    // 4. Installation. À partir d'ici, plus d'annulation ni de START sur une
    // erreur : la pile est peut-être effacée.
    supprimee = true;
    const perdue = () => {
      poser({ etape: 'erreur', decompte: null, erreur: TEXTE_PILE_PEUT_ETRE_EFFACEE });
      return { fin: 'erreur' };
    };
    let relecture = false;
    try {
      poser({ etape: 'suppression' });
      await operateur.supprimer();
      await operateur.statusDouble();
      poser({ etape: 'ecriture' });
      // Jamais de nouvel essai : une seule écriture du .hex fusionné, avec
      // les octets téléchargés avant DELETE.
      if (!(await carte.flasherDonnees(id, installation))) return perdue();
      poser({ etape: 'upgrade' });
      await operateur.upgrade({ surLigne: () => {} });

      // 5. Une minute sans rien envoyer, avec un décompte.
      for (let reste = delais.attenteApresUpgrade; reste > 0; ) {
        if (!carte.etat.connectee) return perdue();
        poser({ etape: 'attente', decompte: Math.ceil(reste / PAS_DECOMPTE_MS) });
        const pas = Math.min(PAS_DECOMPTE_MS, reste);
        await attendre(pas);
        reste -= pas;
      }
      if (!carte.etat.connectee) return perdue();

      // Relecture : tant que le FUS travaille, attendre de nouveau, sans
      // jamais envoyer DELETE ni reproposer l'installation.
      relecture = true;
      poser({ etape: 'relecture', decompte: null });
      let statut;
      for (let ecoule = 0; ; ecoule += delais.pasRelecture) {
        statut = await operateur.statusDouble();
        if (!fusAuTravail(statut?.status)) break;
        if (ecoule + delais.pasRelecture > delais.relectureMax) {
          poser({ etape: 'erreur', erreur: TEXTE_FUS_TRAVAILLE });
          return { fin: 'fus-travaille' };
        }
        await attendre(delais.pasRelecture);
        if (!carte.etat.connectee) return perdue();
      }
      // Code de la dernière opération du FUS ou de la pile (second STATUS,
      // avec last_fus_status). Son sens après une installation réussie n'a
      // jamais été relevé sur la carte (essai préalable : 0, pile en
      // marche) : il ne décide pas seul, la pile relue décide.
      const code = codeEchec(statut);
      // Toujours VERSION puis START, quel que soit le code : sans START, la
      // pile resterait arrêtée. Sur le FUS, copro_fw_version donne la pile
      // installée.
      const reponseRelue = await operateur.version();
      const relue = lirePileEnMarche(reponseRelue).version;
      poser({ versions: { ...etat.versions, relue } });
      // La pile est peut-être en place : un START raté ne doit jamais faire
      // conclure « pile peut-être effacée ».
      let relancee = true;
      try {
        await operateur.relancer();
      } catch {
        relancee = false;
      }
      const ecart = ecartPileRelue(reponseRelue, epinglee);
      if (ecart === null) {
        // Pile épinglée relue : réussite, même si last_fus_status ou
        // last_ws_status est non nul (code seulement noté ici, jamais
        // affiché). Jamais de DELETE ni de nouvelle proposition après
        // l'installation.
        // 6. Fin : invitation à téléverser l'exemple.
        const fini = texteFini(epinglee, relue);
        poser({ etape: 'fini', message: relancee ? fini : `${fini} ${TEXTE_RELANCE_RATEE}` });
        return { fin: 'fini' };
      }
      poser({ etape: 'erreur', erreur: code === null ? ecart : texteEchecCode(code, ecart) });
      return { fin: 'erreur' };
    } catch (err) {
      if (err instanceof ErreurFus) {
        poser({ etape: 'erreur', decompte: null, erreur: texteEchecInstallation(err.code) });
        return { fin: 'erreur' };
      }
      // Operator muet après l'installation, carte toujours là : ne pas
      // conclure à un échec.
      if (relecture && err instanceof ErreurDelaiOperateur && carte.etat.connectee) {
        poser({ etape: 'fini', message: TEXTE_SANS_REPONSE });
        return { fin: 'sans-reponse' };
      }
      return perdue();
    }
  }

  return {
    get etat() {
      return etat;
    },
    abonner(fn) {
      abonnes.add(fn);
      return () => {
        abonnes.delete(fn);
      };
    },
    // Lance la vérification sous le bloc id. Renvoie { fin } : 'occupe'
    // (refusée), 'deconnectee', 'annule', 'erreur', 'pile-arretee', 'fus',
    // 'fus-occupe',
    // 'a-jour', 'daplink', 'plus-tard', 'fini', 'fus-travaille',
    // 'sans-reponse'.
    async verifier(id, deps) {
      if (enCours || deps.carte.etat.occupee) return { fin: 'occupe' };
      if (!deps.carte.etat.connectee) return { fin: 'deconnectee' };
      enCours = true;
      annulation = false;
      supprimee = false;
      try {
        return await derouler(id, deps);
      } catch (err) {
        // Imprévu (aucune étape ne devrait rejeter) : le parcours ne reste
        // jamais bloqué sur une étape occupée.
        poser({
          etape: 'erreur',
          encart: null,
          decompte: null,
          erreur: messageFrancais(err, 'ecriture'),
        });
        return { fin: 'erreur' };
      } finally {
        enCours = false;
        reponse = null;
      }
    },
    // Vérification finie en erreur : retour au repos, pour que l'erreur de la
    // carte d'une action suivante (Téléverser, Connecter) ne reste pas
    // masquée sous le bloc. false si rien n'est effacé.
    oublierErreur() {
      if (enCours || etat.etape !== 'erreur') return false;
      poser({ ...ETAT_INITIAL_PILE });
      return true;
    },
    // Réponse à la question en attente ; false s'il n'y en a pas.
    confirmer(choix) {
      return repondre(choix);
    },
    // Annuler, ou bloc quitté : la vérification s'arrête à sa prochaine étape
    // (START si besoin). Sans effet une fois DELETE envoyé : false.
    annuler() {
      if (!enCours || supprimee) return false;
      annulation = true;
      repondre('annuler');
      return true;
    },
  };
}

// Une seule vérification par page, comme la carte : EssayerExemple lit son
// état (estOccupee) pour griser Téléverser et Déconnecter partout.
export const parcoursPile = creerParcoursPile();
