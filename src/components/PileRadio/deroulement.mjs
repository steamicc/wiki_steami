// Déroulement du bouton « Vérifier la pile radio » (exemples BLE), étapes 1 à 6
// de la conception (conception/2026-11-27-bouton-pile-radio-design.md,
// Décision 3, et Résultats de l'essai préalable).
//
// Sans DOM ni WebUSB : tout passe par les dépendances de verifier(id, deps),
// ce qui permet de le tester avec une carte et un operator simulés
// (deroulement.test.mjs) :
// - carte : la connexion partagée (EssayerExemple/carte.mjs) : flasherFirmware
//   (accepte le texte d'un .hex), ecrireSerie, ecouterSerie,
//   lireVersionDaplink, etat ;
// - urls : { operateur, installation, index, daplink } (/pile-radio/… et
//   /daplink/firmware.json) ;
// - recuperer : fetch, injectable (lecture de index.json et de firmware.json) ;
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
// - une réinitialisation ne relance pas la pile : dès le double STATUS envoyé
//   et tant que DELETE ne l'a pas été, toute fin du parcours (à jour, refus du
//   FUS, DAPLink non épinglé, Annuler, Plus tard, erreur) envoie START ;
// - l'installation exige le DAPLink épinglé (illisible : non épinglé) et un
//   second « oui » (« Installer la pile radio ») ;
// - après DELETE : plus d'annulation, jamais de nouvel essai automatique, et
//   jamais de nouvelle proposition pendant que le FUS travaille (0x10-0x3F).
import {
  decisionFus,
  decisionPile,
  decoderVersion,
  etatFus,
  lirePileEnMarche,
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
//   (essai préalable : VERSION répond 2 à 3 s après le flash).
export const DELAIS_PILE = Object.freeze({
  ...DELAIS_OPERATEUR,
  attenteApresUpgrade: 60000,
  relectureMax: 120000,
  pasRelecture: 10000,
  demarrageOperateur: 2000,
});

// Pas du décompte affiché pendant l'attente (ms).
const PAS_DECOMPTE_MS = 1000;

// --- Textes (ton neutre) ----------------------------------------------------

const RENVOI_EASYFLASH =
  'Installer la pile radio avec EasyFlash (voir la page « Pile radio » du wiki).';

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

export const TEXTE_ANNULE =
  "Vérification arrêtée. Le programme de la carte a été remplacé : téléverser l'exemple pour l'essayer.";

export const TEXTE_PLUS_TARD =
  "Installation de la pile radio reportée. Le programme de la carte a été remplacé : téléverser l'exemple pour l'essayer.";

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
//   'proposition', 'daplink' (questions, la pile est arrêtée), 'suppression',
//   'ecriture', 'upgrade', 'attente' (décompte), 'relecture' : la carte est
//   prise, Téléverser et Déconnecter restent inactifs.
const OCCUPEES = new Set([
  'operateur',
  'lecture',
  'proposition',
  'daplink',
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

    // 1. Première confirmation : rien ne part vers la carte avant.
    const choix = await demander('confirmation-verification', {
      id,
      texte: TEXTE_CONFIRMATION_VERIFICATION,
    });
    if (choix !== 'continuer' || annulation) {
      poser({ ...ETAT_INITIAL_PILE });
      return { fin: 'annule' };
    }

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
    if (annulation) {
      poser({ ...ETAT_INITIAL_PILE });
      return { fin: 'annule' };
    }
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
      poser({ etape: 'repos', message: TEXTE_ANNULE });
      return { fin: 'annule' };
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
      const pile = lirePileEnMarche(await operateur.version());
      if (annulation) return finir('annule', { etape: 'repos', message: TEXTE_ANNULE });
      statusEnvoye = true;
      const statut = await operateur.statusDouble();
      if (annulation) return finir('annule', { etape: 'repos', message: TEXTE_ANNULE });
      const fus = decoderVersion((await operateur.version())?.fus_version ?? 0);
      poser({ versions: { pile, fus, epinglee, relue: null } });
      if (annulation) return finir('annule', { etape: 'repos', message: TEXTE_ANNULE });
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
          return finir('annule', { etape: 'repos', message: TEXTE_ANNULE });
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
        return finir('annule', { etape: 'repos', message: TEXTE_ANNULE });
      }
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
      // Jamais de nouvel essai : une seule écriture du .hex fusionné.
      if (!(await carte.flasherFirmware(id, urls.installation))) return perdue();
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
      if (Number.isInteger(statut?.error) && statut.error !== 0) {
        poser({ etape: 'erreur', erreur: texteEchecInstallation(statut.error) });
        return { fin: 'erreur' };
      }
      // Sur le FUS, copro_fw_version donne la pile installée.
      const relue = lirePileEnMarche(await operateur.version()).version;
      poser({ versions: { ...etat.versions, relue } });
      if (relue === null) {
        poser({ etape: 'erreur', erreur: TEXTE_PILE_ABSENTE_APRES });
        return { fin: 'erreur' };
      }
      await operateur.relancer();
      if (relue !== epinglee.version) {
        poser({ etape: 'erreur', erreur: texteAutrePile(relue, epinglee.version) });
        return { fin: 'erreur' };
      }
      // 6. Fin : invitation à téléverser l'exemple.
      poser({ etape: 'fini', message: texteFini(epinglee, relue) });
      return { fin: 'fini' };
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
    // (refusée), 'deconnectee', 'annule', 'erreur', 'fus', 'fus-occupe',
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
