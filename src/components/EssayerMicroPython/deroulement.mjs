// Déroulement du bouton « Essayer sur la carte » (MicroPython), étapes 0 à 6 de
// la conception (conception/2026-11-26-essayer-micropython-design.md, section 4).
//
// Sans DOM ni WebUSB : tout passe par des dépendances injectées, ce qui permet
// de le tester avec une carte et un REPL simulés (deroulement.test.mjs) :
// - carte : la connexion partagée (EssayerExemple/carte.mjs) ;
// - creerRepl() : un REPL brut (repl.mjs) branché sur cette connexion ; un
//   nouveau est créé à chaque nouvelle connexion ;
// - demander(type, donnees) : affiche un encart et renvoie la réponse du
//   lecteur, 'oui', 'non' ou 'plus-tard' (types : 'confirmation', 'daplink',
//   'installation') ;
// - session : l'état affiché par la page (creerSession) ;
// - epingles() : les versions épinglées par le wiki (chargerEpingles) ;
// - urls : { dapjs, firmware } ; delais : DELAIS_DEROULEMENT, modifiables.
//
// Règles (anti-objectifs de la conception) : rien ne part vers la carte avant
// « Lancer quand même » pour un bloc avec confirmation ; le firmware n'est
// flashé qu'après « Installer », jamais réessayé tout seul ; une carte qui
// redémarre sur la bannière de MicroPython n'est jamais déclarée sans
// MicroPython.
import {
  TEXTE_CARTE_OCCUPEE,
  decisionFirmware,
  decisionMiseAJour,
  diagnosticSansInvite,
  lireFirmwareEpingle,
} from './logique.mjs';
import { ArretDemande, estBanniereMicroPython } from './repl.mjs';
import {
  ECHECS,
  ErreurLecteur,
  MESSAGE_DAPJS_INTROUVABLE,
  MESSAGE_DEBRANCHEE,
  MESSAGE_FLASH_EN_COURS,
  MESSAGE_SANS_CARTE,
  TEXTE_ACCES_REFUSE,
  messageErreur,
  messageFrancais,
} from '../EssayerExemple/logique.mjs';

// Délais (ms) :
// - demarrage : fenêtre pendant laquelle Ctrl-C est renvoyé à une carte qui
//   vient de redémarrer. La connexion elle-même redémarre la carte (DAP.js
//   setSerialBaudrate → commande DAPLink 0x82 UART_SetConfiguration →
//   SendBreak → nRESET), comme le redémarrage du diagnostic : MicroPython
//   ignore Ctrl-C tant qu'il n'exécute pas boot.py ou main.py, et un Ctrl-C
//   reçu pendant boot.py n'arrête pas le main.py qui suit. Chaque tentative
//   (repl.interrompre) dure environ 1,6 s sans réponse : 6 s en laissent
//   quatre, pour un démarrage (initialisation, boot.py, début de main.py)
//   d'habitude bien plus court qu'une seconde. Valeur généreuse, pas encore
//   mesurée sur la carte ;
// - relance : pause entre deux tentatives ;
// - redemarrage : attente du redémarrage après l'installation (le sondage
//   suit dès que la bannière arrive).
export const DELAIS_DEROULEMENT = Object.freeze({
  demarrage: 6000,
  relance: 100,
  redemarrage: 8000,
});

// Taille maximale de la sortie gardée dans la console (caractères).
export const LIMITE_SORTIE = 100_000;

export const TEXTE_RESET =
  'La carte ne répond pas : appuyer sur le bouton RESET de la carte, puis réessayer.';

export const TEXTE_APRES_INSTALLATION =
  "MicroPython ne répond pas après l'installation : appuyer sur le bouton RESET de la carte, puis réessayer.";

export const TEXTE_AUTRE_CAUSE =
  "Si MicroPython est déjà installé, un autre outil (Thonny, mpremote) ou un programme en cours tient peut-être la carte : fermer l'outil, ou appuyer sur RESET, puis réessayer au lieu d'installer.";

export const TEXTE_EPINGLAGE_ILLISIBLE =
  'Impossible de lire la version de MicroPython proposée par le wiki : vérifier la connexion à Internet, puis recharger la page.';

export const TEXTE_CARTE_PERDUE =
  'La carte a été déconnectée : la rebrancher si besoin, puis cliquer de nouveau sur « Essayer sur la carte ».';

export const TEXTE_ACCES_REFUSE_MICROPYTHON =
  'Accès à la carte refusé par le système. Sous Linux, il manque sans doute la règle udev de la carte (voir « Dépannage » sur la page « Essayer sur la carte » du wiki). Sinon, un autre onglet ou programme utilise la carte (un autre onglet du wiki, un Codespace…) : le fermer, puis réessayer. En attendant, Thonny ou mpremote peuvent lancer le programme.';

// Messages de la connexion partagée (carte.mjs) écrits pour les pages
// Arduino, qui renvoient à « Connecter la carte », au .bin ou au
// téléversement : leur version pour le bouton MicroPython. Les pages
// Arduino gardent les leurs.
const MESSAGES_MICROPYTHON = new Map([
  [MESSAGE_SANS_CARTE, TEXTE_CARTE_PERDUE],
  [MESSAGE_DEBRANCHEE, TEXTE_CARTE_PERDUE],
  [messageErreur({ name: 'NotFoundError', message: 'disconnected' }), TEXTE_CARTE_PERDUE],
  [TEXTE_ACCES_REFUSE, TEXTE_ACCES_REFUSE_MICROPYTHON],
  [MESSAGE_FLASH_EN_COURS, 'Installation en cours : attendre la fin, puis réessayer.'],
  [
    MESSAGE_DAPJS_INTROUVABLE,
    'Impossible de charger la bibliothèque USB du wiki : vérifier la connexion à Internet, puis réessayer.',
  ],
]);

// Message de la connexion partagée, tel qu'affiché sous un bloc MicroPython.
export function traduireMessageCarte(texte) {
  if (typeof texte !== 'string') return texte;
  if (MESSAGES_MICROPYTHON.has(texte)) return MESSAGES_MICROPYTHON.get(texte);
  // Flash du firmware raté (messageFrancais, étape 'televersement').
  if (texte.startsWith(`${ECHECS.televersement} :`)) {
    return `L'installation de MicroPython a échoué${texte.slice(ECHECS.televersement.length)}`;
  }
  return texte;
}

// Erreur de la connexion partagée à afficher sous le bloc id : sous le bloc
// MicroPython actif, sinon sous le dernier bloc cliqué ; jamais en double
// d'une erreur de l'essai, ni de l'avis « Carte déconnectée » (un seul
// message quand la carte part pendant un programme).
export function erreurCarteAffichee(etatCarte, etatSession, id) {
  const bloc = etatSession.actif ?? etatCarte.dernierClic;
  if (bloc !== id) return null;
  if (etatSession.actif === id) {
    if (etatSession.erreur || etatSession.message === TEXTE_DECONNECTEE) return null;
  }
  return traduireMessageCarte(etatCarte.erreur ?? null);
}

export const TEXTE_DAPLINK_REPORTE =
  'Mise à jour du DAPLink reportée : cliquer de nouveau sur « Essayer sur la carte » pour lancer le programme.';

export const TEXTE_DECONNECTEE =
  'Carte déconnectée : la console ne suit plus le programme. Cliquer sur « Essayer sur la carte » pour le relancer.';

// Étape affichée par la session :
// - 'repos' : rien n'a été lancé ; 'fini' : le dernier essai est terminé ;
// - 'fichiers', 'programme' : le programme est lancé (Arrêter, ou un autre bloc,
//   l'arrête) ;
// - les autres : préparation en cours, les boutons « Essayer » sont grisés.
const TEXTES_ETAPES = Object.freeze({
  preparation: 'Préparation…',
  connexion: 'Connexion à la carte…',
  arret: 'Arrêt du programme en cours…',
  verification: 'Vérification de la carte…',
  sondage: 'Recherche de MicroPython sur la carte…',
  diagnostic: 'La carte ne répond pas : redémarrage de la carte…',
  installation:
    'Installation de MicroPython (environ une minute) : ne pas débrancher la carte ni fermer la page…',
  redemarrage: 'Redémarrage de la carte…',
  fichiers: 'Envoi des fichiers annexes…',
  programme: 'Programme en cours.',
});

// L'envoi des fichiers est déjà le lancement : comme pendant le programme,
// un autre bloc peut être lancé (il arrête d'abord celui-ci).
const LIBRES = new Set(['repos', 'fini', 'fichiers', 'programme']);
// Étapes pendant lesquelles un programme (ou ses fichiers) occupe le REPL.
const EN_MARCHE = new Set(['fichiers', 'programme']);

// Un essai est en préparation : les autres clics sont ignorés.
export function estOccupee(etat) {
  return !LIBRES.has(etat.etape);
}

// Arrêter n'a de sens que pendant l'envoi des fichiers ou le programme.
export function peutArreter(etat) {
  return EN_MARCHE.has(etat.etape);
}

// Texte d'état sous le bloc actif (région aria-live), null s'il n'y en a pas.
export function messageSession(etat) {
  return etat.message ?? TEXTES_ETAPES[etat.etape] ?? null;
}

// Pastille d'état du bloc id (clés de LIBELLES_STATUT d'EssayerExemple).
export function statutPastille(etatCarte, etatSession, id) {
  if (etatCarte.connexion) return 'connexion';
  if (!etatCarte.connectee) return 'deconnectee';
  if (etatCarte.occupee) return 'televersement';
  if (etatSession.actif === id && etatSession.etape === 'programme') return 'programme';
  return 'connectee';
}

// Sortie de la carte (fins de ligne « \r\n ») pour un <pre>.
export function texteConsole(texte) {
  return texte.replace(/\r\n?/g, '\n');
}

// Garde la fin de la sortie, à partir d'un début de ligne si possible.
function borner(texte, limite) {
  if (texte.length <= limite) return texte;
  const fin = texte.slice(-limite);
  const ligne = fin.indexOf('\n');
  return ligne >= 0 && ligne < fin.length - 1 ? fin.slice(ligne + 1) : fin;
}

// Fichiers annexes transmis par le plugin (JSON « [{"nom", "contenu"}] ») :
// [] sans fichiers, null si la valeur est illisible.
export function lireFichiers(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return [];
  let liste = valeur;
  if (typeof valeur === 'string') {
    try {
      liste = JSON.parse(valeur);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(liste)) return null;
  const valides = liste.every(
    (f) => f && typeof f.nom === 'string' && typeof f.contenu === 'string',
  );
  return valides ? liste.map(({ nom, contenu }) => ({ nom, contenu })) : null;
}

async function lireJson(url, recuperer) {
  const reponse = await recuperer(url, { cache: 'no-cache' });
  if (!reponse.ok) throw new Error(`erreur ${reponse.status}`);
  return reponse.json();
}

// Versions épinglées par le wiki : { micropython: { version }, daplink }.
// daplink vaut null si son fichier est illisible (pas de vérification du
// DAPLink) ; sans version de MicroPython, rien ne peut être décidé : erreur.
export async function chargerEpingles(urls, recuperer = fetch) {
  let version;
  try {
    version = (await lireJson(urls.micropython, recuperer))?.version;
  } catch {
    throw new ErreurLecteur(TEXTE_EPINGLAGE_ILLISIBLE);
  }
  if (typeof version !== 'string' || !/^v\d+\.\d+\.\d+$/.test(version)) {
    throw new ErreurLecteur(TEXTE_EPINGLAGE_ILLISIBLE);
  }
  let daplink = null;
  try {
    daplink = lireFirmwareEpingle(await lireJson(urls.daplink, recuperer));
  } catch {
    daplink = null;
  }
  return { micropython: { version }, daplink };
}

const planifierImage = (fn) =>
  (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(fn);

export const SESSION_INITIALE = Object.freeze({
  // Bloc dont la console, les encarts et les messages sont affichés.
  actif: null,
  etape: 'repos',
  // Question en attente : { type, donnees }, donnees.id étant le bloc.
  encart: null,
  sortie: '',
  // Erreur Python (traceback) du dernier programme.
  traceback: null,
  message: null,
  erreur: null,
  // Étapes de mise à jour du DAPLink affichées : { release }.
  daplink: null,
  // Mémoire de la page (jusqu'au rechargement).
  daplinkReporte: false,
  // Un programme a tourné sur la carte depuis la connexion, ou l'état de
  // MicroPython est inconnu (nouvelle connexion, carte perdue ou libérée) :
  // le prochain essai commence par une remise à zéro.
  programmeLance: false,
});

// État partagé par les blocs de la page. Chaque essai reçoit un jeton :
// les mises à jour d'un essai remplacé par un autre sont ignorées.
// planifier : regroupe les mises à jour de la sortie (une par image).
export function creerSession({ planifier = planifierImage, limiteSortie = LIMITE_SORTIE } = {}) {
  let etat = SESSION_INITIALE;
  let jeton = 0;
  let repl = null;
  let reponse = null;
  // Jeton de l'essai dont l'arrêt a été demandé (Arrêter).
  let arretPour = null;
  let sortie = '';
  let sortiePlanifiee = false;
  const abonnes = new Set();

  function poser(partie) {
    etat = { ...etat, ...partie };
    for (const fn of [...abonnes]) fn(etat);
  }

  function annulerQuestion() {
    const r = reponse;
    reponse = null;
    r?.('non');
  }

  return {
    get etat() {
      return etat;
    },
    get jeton() {
      return jeton;
    },
    get repl() {
      return repl;
    },
    abonner(fn) {
      abonnes.add(fn);
      return () => {
        abonnes.delete(fn);
      };
    },
    // Nouvel essai sous le bloc id : la console et les messages le suivent.
    commencer(id) {
      jeton++;
      annulerQuestion();
      sortie = '';
      poser({
        actif: id,
        etape: 'preparation',
        encart: null,
        sortie: '',
        traceback: null,
        message: null,
        erreur: null,
        daplink: null,
      });
      return jeton;
    },
    // Mise à jour de l'essai j, ignorée s'il a été remplacé.
    changer(j, partie) {
      if (j !== jeton) return false;
      poser(partie);
      return true;
    },
    // Mémoire de la page, quel que soit l'essai.
    retenir(partie) {
      poser(partie);
    },
    ajouterSortie(j, texte) {
      if (j !== jeton) return;
      sortie = borner(sortie + texte, limiteSortie);
      if (sortiePlanifiee) return;
      sortiePlanifiee = true;
      planifier(() => {
        sortiePlanifiee = false;
        if (j === jeton) poser({ sortie });
      });
    },
    demander(type, donnees) {
      annulerQuestion();
      return new Promise((resoudre) => {
        reponse = resoudre;
        poser({ encart: { type, donnees } });
      });
    },
    repondre(valeur) {
      const r = reponse;
      reponse = null;
      poser({ encart: null });
      r?.(valeur);
    },
    // « Plus tard » sur les étapes de mise à jour du DAPLink : le statut
    // qui renvoyait aux étapes est remplacé.
    reporterDaplink() {
      poser({
        daplink: null,
        daplinkReporte: true,
        message: etat.daplink ? TEXTE_DAPLINK_REPORTE : etat.message,
      });
    },
    // Arrêter : l'essai en cours ne doit plus rien envoyer à la carte, même
    // si l'opération en cours se termine normalement.
    demanderArret() {
      arretPour = jeton;
    },
    arretDemande(j) {
      return arretPour === j;
    },
    obtenirRepl(creer) {
      repl ??= creer();
      return repl;
    },
    oublierRepl() {
      repl = null;
    },
    // Termine l'essai en cours de l'extérieur (carte perdue, bloc quitté).
    terminer(partie) {
      jeton++;
      annulerQuestion();
      poser({ encart: null, ...partie });
    },
  };
}

// La carte est perdue ou libérée : le programme en cours ne s'affiche plus,
// et le REPL de cette connexion (peut-être bloqué sur une lecture qui ne
// viendra plus) est oublié. Ce que la carte exécutera ensuite est inconnu :
// le prochain essai la remet à zéro.
export function signalerDeconnexion(session) {
  session.oublierRepl();
  if (EN_MARCHE.has(session.etat.etape) || session.etat.etape === 'arret') {
    session.terminer({ etape: 'fini', message: TEXTE_DECONNECTEE, programmeLance: true });
  } else if (session.etat.etape === 'question') {
    // Question (DAPLink, installation) sur une carte partie : sans objet.
    session.terminer({ etape: 'fini', erreur: TEXTE_CARTE_PERDUE, programmeLance: true });
  } else {
    session.retenir({ programmeLance: true });
  }
}

// Le bloc id disparaît de la page (navigation). Son essai en préparation est
// terminé, qu'une question soit déjà posée ou non : sinon il en poserait une
// sous un bloc absent, et l'essai resterait en 'question', ce qui griserait
// les boutons « Essayer » de toutes les pages. L'essai terminé s'arrête à sa
// prochaine étape sans rien envoyer à la carte (essayer vérifie remplace()) ;
// un flash déjà commencé va à son terme (carte.occupee le protège). Une
// confirmation, posée avant le début de l'essai, est simplement annulée.
export function abandonnerBloc(session, id) {
  const etat = session.etat;
  if (etat.actif === id && estOccupee(etat)) {
    session.terminer({ etape: 'fini', message: 'Essai annulé.' });
  } else if (etat.encart?.donnees.id === id) {
    session.repondre('non');
  }
}

// Écoute la carte et repère la bannière de démarrage de MicroPython. Branché
// avant l'action qui la provoque (redémarrage, flash), pour ne rien manquer.
function creerGuet(carte) {
  const decodeur = new TextDecoder('utf-8');
  let texte = '';
  let vue = false;
  let signaler = null;
  const desabonner = carte.ecouterSerie((octets) => {
    if (vue) return;
    texte = (texte + decodeur.decode(octets, { stream: true })).slice(-1024);
    if (estBanniereMicroPython(texte)) {
      vue = true;
      signaler?.();
    }
  });
  return {
    // La bannière est-elle déjà passée ?
    get vue() {
      return vue;
    },
    // true si la bannière est vue dans le délai.
    attendre(delai) {
      if (vue) return Promise.resolve(true);
      return new Promise((resoudre) => {
        const minuterie = setTimeout(() => {
          signaler = null;
          resoudre(false);
        }, delai);
        signaler = () => {
          clearTimeout(minuterie);
          signaler = null;
          resoudre(true);
        };
      });
    },
    fermer() {
      desabonner();
    },
  };
}

const dormir = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));

// Envoie Ctrl-C jusqu'à obtenir l'invite « >>> », pendant fenetre ms (une
// seule tentative si fenetre vaut 0) : une carte qui vient de redémarrer
// ignore les premiers. Une tentative ratée alors que la bannière était déjà
// passée (guet) suffit : MicroPython a démarré, mais il ne répond pas.
// 'invite', 'muette', 'perdue' (carte partie) ou 'abandonne' (essai
// terminé : plus rien ne part vers la carte).
async function obtenirInvite(repl, carte, { fenetre, guet, delais, remplace }) {
  const fin = Date.now() + fenetre;
  for (;;) {
    if (remplace()) return 'abandonne';
    const banniereAvant = guet?.vue ?? false;
    const invite = await repl.interrompre();
    if (remplace()) return 'abandonne';
    if (invite) return 'invite';
    if (!carte.etat.connectee) return 'perdue';
    if (banniereAvant || Date.now() >= fin) return 'muette';
    await dormir(delais.relance);
  }
}

// Étape 2 : 'a-jour', 'dev', 'ancien' (MicroPython répond), 'occupee'
// (muette, mais la bannière de MicroPython est passée après un
// redémarrage), 'muette', 'perdue' (carte débranchée pendant l'attente de
// l'invite : pas de diagnostic) ou 'abandonne'.
//
// guetConnexion : guet branché juste après une nouvelle connexion, qui a
// redémarré la carte. Ctrl-C est alors renvoyé pendant delais.demarrage, et
// ce redémarrage tient lieu de diagnostic. Sinon, une carte muette est
// redémarrée une fois (dap.reset()), puis sondée de la même façon. Une
// bannière vue n'est jamais suivie d'une proposition d'installation.
async function sonder(repl, carte, epinglee, { delais, changer, remplace, guetConnexion }) {
  changer({ etape: 'sondage' });
  const lire = async () => {
    const version = await repl.lireVersion();
    return decisionFirmware({ micropython: true, version }, epinglee);
  };
  let resultat = await obtenirInvite(repl, carte, {
    fenetre: guetConnexion ? delais.demarrage : 0,
    guet: guetConnexion,
    delais,
    remplace,
  });
  if (resultat === 'invite') return lire();
  if (resultat !== 'muette') return resultat;
  let banniereVue = guetConnexion?.vue ?? false;
  if (!guetConnexion) {
    changer({ etape: 'diagnostic' });
    const guet = creerGuet(carte);
    try {
      try {
        await carte.redemarrer();
      } catch {
        // Redémarrage refusé (DAPLink trop ancien) : la fenêtre décidera.
      }
      resultat = await obtenirInvite(repl, carte, {
        fenetre: delais.demarrage,
        guet,
        delais,
        remplace,
      });
      banniereVue = guet.vue;
    } finally {
      guet.fermer();
    }
    if (resultat === 'invite') return lire();
    if (resultat !== 'muette') return resultat;
  }
  return diagnosticSansInvite({ banniereVue }) === 'occupee' ? 'occupee' : 'muette';
}

// Remet MicroPython à zéro (repl.arreter) ; false : il faut appuyer sur RESET.
async function remettreAZero(repl, session, changer) {
  changer({ etape: 'arret' });
  const ok = await repl.arreter();
  if (ok) session.retenir({ programmeLance: false });
  else changer({ etape: 'fini', erreur: TEXTE_RESET });
  return ok;
}

// Lance un bloc : étapes 0 à 5. Renvoie { fin } :
// 'occupe' (un autre essai se prépare), 'annule', 'connexion', 'reset',
// 'daplink' (étapes de mise à jour affichées), 'occupee' (carte tenue),
// 'installation' (flash raté ou MicroPython muet ensuite), 'deconnectee'
// (carte partie avant d'agir dessus), 'erreur',
// 'erreur-python' (traceback), 'arrete', 'abandonne' (essai remplacé, ou
// terminé parce que son bloc a quitté la page), 'lance'.
//
// Un essai terminé de l'extérieur (remplace()) ne pose plus de question et
// n'agit plus sur la carte : la vérification précède chaque question et
// chaque action sur la carte qui suit une attente.
export async function essayer({ id, code, fichiers = [], confirmation }, dependances) {
  const { carte, session, demander } = dependances;
  const delais = { ...DELAIS_DEROULEMENT, ...dependances.delais };
  if (estOccupee(session.etat)) return { fin: 'occupe' };

  // 0. Bloc qui modifie la carte : rien ne part avant « Lancer quand même ».
  if (confirmation) {
    const reponse = await demander('confirmation', { id, texte: confirmation });
    if (reponse !== 'oui') return { fin: 'annule' };
    if (estOccupee(session.etat)) return { fin: 'occupe' };
  }

  const enMarche = EN_MARCHE.has(session.etat.etape);
  const jeton = session.commencer(id);
  const changer = (partie) => session.changer(jeton, partie);
  const remplace = () => session.jeton !== jeton;
  // Arrêter, ou un autre bloc lancé : plus rien ne part vers la carte.
  const stoppe = () => remplace() || session.arretDemande(jeton);
  // Avant d'agir sur la carte après une attente : est-elle toujours là ?
  const carteDisparue = () => {
    if (carte.etat.connectee) return false;
    changer({ etape: 'fini', erreur: TEXTE_CARTE_PERDUE });
    return true;
  };
  // Bannière de démarrage guettée depuis une nouvelle connexion.
  let guetConnexion = null;

  try {
    // 1. Connexion, au plus près du clic (la fenêtre de choix de Chrome
    // l'exige). Elle redémarre la carte (voir DELAIS_DEROULEMENT) : son état
    // est inconnu, le premier programme partira d'une remise à zéro.
    let reconnectee = false;
    if (!carte.etat.connectee) {
      session.oublierRepl();
      session.retenir({ programmeLance: true });
      changer({ etape: 'connexion' });
      await carte.connecter(id, dependances.urls.dapjs);
      if (remplace()) return { fin: 'abandonne' };
      if (!carte.etat.connectee) {
        // L'erreur est celle de la connexion partagée (carte.etat.erreur).
        changer({ etape: 'fini' });
        return { fin: 'connexion' };
      }
      reconnectee = true;
      guetConnexion = creerGuet(carte);
    }
    const repl = session.obtenirRepl(dependances.creerRepl);

    // 6. Un programme tourne (un autre bloc, peut-être) : il est arrêté avant
    // tout envoi.
    if (enMarche && !reconnectee) {
      if (!(await remettreAZero(repl, session, changer))) return { fin: 'reset' };
      if (remplace()) return { fin: 'abandonne' };
    }

    changer({ etape: 'verification' });
    const epingles = await dependances.epingles();
    if (remplace()) return { fin: 'abandonne' };
    const epinglee = epingles.micropython.version;

    // 1. DAPLink trop ancien : mise à jour guidée, ou « Plus tard ».
    if (epingles.daplink && !session.etat.daplinkReporte) {
      const version = await carte.lireVersionDaplink();
      if (remplace()) return { fin: 'abandonne' };
      if (decisionMiseAJour(version, epingles.daplink) === 'ancien') {
        const { release } = epingles.daplink;
        changer({ etape: 'question' });
        const reponse = await demander('daplink', { id, release });
        if (remplace()) return { fin: 'abandonne' };
        if (reponse === 'oui') {
          changer({
            etape: 'fini',
            daplink: { release },
            message: 'Suivre les étapes ci-dessous pour mettre à jour le DAPLink.',
          });
          return { fin: 'daplink' };
        }
        // Seul « Plus tard » laisse l'essai continuer.
        if (reponse !== 'plus-tard') {
          changer({ etape: 'fini' });
          return { fin: 'annule' };
        }
        session.retenir({ daplinkReporte: true });
        if (carteDisparue()) return { fin: 'deconnectee' };
      }
    }

    // 2. Sondage du REPL.
    const decision = await sonder(repl, carte, epinglee, {
      delais,
      changer,
      remplace,
      guetConnexion,
    });
    guetConnexion?.fermer();
    guetConnexion = null;
    if (decision === 'abandonne' || remplace()) return { fin: 'abandonne' };
    if (decision === 'perdue' || !carte.etat.connectee) {
      changer({ etape: 'fini', erreur: TEXTE_CARTE_PERDUE });
      return { fin: 'deconnectee' };
    }
    if (decision === 'occupee') {
      changer({ etape: 'fini', erreur: TEXTE_CARTE_OCCUPEE });
      return { fin: 'occupee' };
    }

    // 3. Firmware absent ou ancien : installation après « Installer » seulement.
    if (decision === 'ancien' || decision === 'muette') {
      changer({ etape: 'question' });
      const reponse = await demander('installation', {
        id,
        version: epinglee,
        autreCause: decision === 'muette',
      });
      if (remplace()) return { fin: 'abandonne' };
      if (reponse !== 'oui') {
        changer({ etape: 'fini' });
        return { fin: 'annule' };
      }
      // Carte partie pendant la question : flasherFirmware ne ferait rien,
      // sans message.
      if (carteDisparue()) return { fin: 'deconnectee' };
      changer({ etape: 'installation' });
      const guet = creerGuet(carte);
      try {
        // Ne rejette jamais ; l'erreur est dans carte.etat.erreur. Jamais de
        // nouvel essai automatique.
        if (!(await carte.flasherFirmware(id, dependances.urls.firmware))) {
          changer({ etape: 'fini' });
          return { fin: 'installation' };
        }
        session.retenir({ programmeLance: false });
        changer({ etape: 'redemarrage' });
        await guet.attendre(delais.redemarrage);
      } finally {
        guet.fermer();
      }
      if (remplace()) return { fin: 'abandonne' };
      changer({ etape: 'sondage' });
      const invite = await repl.interrompre();
      if (remplace()) return { fin: 'abandonne' };
      const version = invite ? await repl.lireVersion() : null;
      const apres = invite ? decisionFirmware({ micropython: true, version }, epinglee) : 'absent';
      if (apres === 'absent' || apres === 'ancien') {
        changer({ etape: 'fini', erreur: TEXTE_APRES_INSTALLATION });
        return { fin: 'installation' };
      }
    }

    // Un programme a déjà tourné, ou la carte vient d'être connectée :
    // remise à zéro, pour que celui-ci parte de zéro (variables, modules
    // importés, minuteries, disque en RAM). En REPL brut : main.py n'est
    // pas relancé.
    if (remplace()) return { fin: 'abandonne' };
    if (session.etat.programmeLance) {
      if (!(await remettreAZero(repl, session, changer))) return { fin: 'reset' };
      if (remplace()) return { fin: 'abandonne' };
    }

    // 4. Fichiers annexes dans le disque en RAM.
    session.retenir({ programmeLance: true });
    if (fichiers.length) {
      changer({ etape: 'fichiers' });
      for (const { nom, contenu } of fichiers) {
        await repl.ecrireFichierRam(nom, contenu);
        if (stoppe()) return { fin: 'arrete' };
      }
    }

    // 5. Lancement en RAM ; la sortie va dans la console du bloc. Jamais
    // après un arrêt demandé pendant l'envoi des fichiers.
    if (stoppe()) return { fin: 'arrete' };
    changer({ etape: 'programme' });
    const { erreur, arrete } = await repl.executer(code, {
      surSortie: (texte) => session.ajouterSortie(jeton, texte),
    });
    // Arrêté par « Arrêter » ou par un autre bloc : ils affichent la suite.
    if (arrete) return { fin: 'arrete' };
    if (erreur) {
      changer({
        etape: 'fini',
        traceback: erreur,
        message: "Le programme s'est arrêté sur une erreur : lire le message dans la console.",
      });
      return { fin: 'erreur-python' };
    }
    changer({ etape: 'fini', message: 'Programme terminé.' });
    return { fin: 'lance' };
  } catch (err) {
    if (err instanceof ArretDemande || err?.name === 'ArretDemande') return { fin: 'arrete' };
    // Erreur due à l'arrêt (KeyboardInterrupt d'une commande) : Arrêter ou
    // l'autre bloc affichent la suite, pas de message d'erreur.
    if (stoppe()) return { fin: 'arrete' };
    changer({ etape: 'fini', erreur: traduireMessageCarte(messageFrancais(err, 'ecriture')) });
    return { fin: 'erreur' };
  } finally {
    guetConnexion?.fermer();
  }
}

// Bouton « Arrêter » (étape 6) : Ctrl-C puis remise à zéro. Renvoie true si
// la carte est revenue au repos, false s'il faut appuyer sur RESET, null s'il
// n'y avait rien à arrêter.
export async function arreter({ session }) {
  const repl = session.repl;
  if (!repl || !peutArreter(session.etat)) return null;
  const jeton = session.jeton;
  const changer = (partie) => session.changer(jeton, partie);
  session.demanderArret();
  changer({ etape: 'arret', message: null });
  let ok;
  try {
    ok = await repl.arreter();
  } catch (err) {
    changer({ etape: 'fini', erreur: traduireMessageCarte(messageFrancais(err, 'ecriture')) });
    return false;
  }
  if (ok) {
    session.retenir({ programmeLance: false });
    changer({ etape: 'fini', message: 'Programme arrêté.', erreur: null });
  } else {
    changer({ etape: 'fini', erreur: TEXTE_RESET });
  }
  return ok;
}
