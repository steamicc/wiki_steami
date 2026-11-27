// Tests du déroulement du bouton « Essayer sur la carte » (MicroPython), avec
// une carte et un REPL simulés : aucun navigateur, aucune carte.
// Lancer : node --test src/components/EssayerMicroPython/deroulement.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXTE_ACCES_REFUSE_MICROPYTHON,
  TEXTE_APRES_INSTALLATION,
  TEXTE_CARTE_PERDUE,
  TEXTE_DECONNECTEE,
  TEXTE_RESET,
  abandonnerBloc,
  arreter,
  chargerEpingles,
  creerSession,
  essayer,
  erreurCarteAffichee,
  estOccupee,
  lireFichiers,
  signalerDeconnexion,
  statutPastille,
  texteConsole,
  traduireMessageCarte,
} from './deroulement.mjs';
import { TEXTE_CARTE_OCCUPEE } from './logique.mjs';
import {
  ErreurLecteur,
  MESSAGE_DAPJS_INTROUVABLE,
  MESSAGE_DEBRANCHEE,
  MESSAGE_FLASH_EN_COURS,
  MESSAGE_SANS_CARTE,
  messageErreur,
  messageFrancais,
} from '../EssayerExemple/logique.mjs';

const BANNIERE = 'MicroPython v1.29.0 on 2026-11-26; STeaMi with STM32WB55RGV6\r\n>>> ';
const EPINGLES = {
  micropython: { version: 'v0.29.0' },
  daplink: { release: '2026-11-25.3', numero: 3, date: 20261125 },
};

// Laisse passer les promesses et minuteries en attente.
const tic = (ms = 0) => new Promise((resoudre) => setTimeout(resoudre, ms));

// Promesse résolue de l'extérieur.
function differee() {
  let resoudre;
  const promesse = new Promise((r) => {
    resoudre = r;
  });
  return { promesse, resoudre };
}

// Carte simulée : chaque appel est noté dans le journal commun.
// Après un flash réussi, la carte redémarre : MicroPython ne répond pas
// (demarree faux) avant sa bannière, émise banniereApresFlash ms après la fin
// du flash ('pendant' : avant la fin du flash, comme quand la console reprend
// dans carte.mjs ; null : bannière perdue, la carte répond quand même après
// pretApres ms, ou jamais si pretApres est null).
function fausseCarte(journal, options = {}) {
  const {
    connectee = true,
    connexionReussie = true,
    daplink = { numero: 3, date: 20261125 },
    banniere = false,
    flash = true,
    banniereApresFlash = 10,
    pretApres = 5,
  } = options;
  const ecouteurs = new Set();
  const emettre = (texte) => {
    const octets = new TextEncoder().encode(texte);
    for (const fn of [...ecouteurs]) fn(octets);
  };
  const demarrer = () => {
    journal.push('banniere');
    carte.demarree = true;
    emettre(BANNIERE);
  };
  const carte = {
    etat: { connectee, occupee: false, erreur: null },
    demarree: true,
    instants: { finFlash: null, interrompre: [] },
    async connecter(id) {
      journal.push(`connecter ${id}`);
      if (connexionReussie) carte.etat = { ...carte.etat, connectee: true };
      else carte.etat = { ...carte.etat, erreur: 'Aucune carte choisie.' };
    },
    async lireVersionDaplink() {
      journal.push('lireVersionDaplink');
      return daplink;
    },
    async flasherFirmware(id, url) {
      journal.push(`flasherFirmware ${url}`);
      if (!flash) return false;
      carte.demarree = false;
      if (banniereApresFlash === 'pendant') demarrer();
      else if (banniereApresFlash !== null) setTimeout(demarrer, banniereApresFlash);
      else if (pretApres !== null) {
        setTimeout(() => {
          carte.demarree = true;
        }, pretApres);
      }
      carte.instants.finFlash = Date.now();
      return true;
    },
    async redemarrer() {
      journal.push('redemarrer');
      if (banniere) setTimeout(() => emettre(BANNIERE), 1);
    },
    ecouterSerie(fn) {
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
    async ecrireSerie() {
      journal.push('ecrireSerie');
    },
    emettre,
  };
  return carte;
}

// REPL simulé : invites et versions successives (MicroPython ne répond pas
// tant que la carte redémarre) ; executer renvoie le résultat donné, ou
// attend arreter() si bloquer est vrai. fichiersBloques : l'écriture d'un
// fichier attend arreter(), puis se termine normalement ('resout' : Ctrl-C
// arrivé après la commande) ou échoue comme repl.mjs avant la correction
// ('rejette' : KeyboardInterrupt pendant la commande).
function fauxRepl(journal, options = {}) {
  const {
    carte,
    invites = [true],
    versions = ['v0.29.0'],
    resultat = { erreur: null, arrete: false },
    sortie = '2\r\n',
    arreterRepond = true,
    bloquer = false,
    fichiersBloques = null,
    perdreAuSondage = false,
  } = options;
  let enCours = null;
  let ecriture = null;
  return {
    async interrompre() {
      journal.push('interrompre');
      carte?.instants.interrompre.push(Date.now());
      if (perdreAuSondage) {
        carte.etat = { ...carte.etat, connectee: false };
        return false;
      }
      if (carte && !carte.demarree) return false;
      return invites.length ? invites.shift() : false;
    },
    async lireVersion() {
      journal.push('lireVersion');
      return versions.length ? versions.shift() : null;
    },
    async ecrireFichierRam(nom, contenu) {
      journal.push(`ecrireFichierRam ${nom} ${contenu}`);
      if (!fichiersBloques) return;
      ecriture = differee();
      await ecriture.promesse;
      if (fichiersBloques === 'rejette') {
        throw new ErreurLecteur(`Impossible de écrire ${nom} sur la carte (KeyboardInterrupt: ).`);
      }
    },
    async executer(code, { surSortie } = {}) {
      journal.push(`executer ${code}`);
      surSortie?.(sortie);
      if (!bloquer) return resultat;
      enCours = differee();
      return enCours.promesse;
    },
    async arreter() {
      journal.push('arreter');
      enCours?.resoudre({ erreur: null, arrete: true });
      enCours = null;
      ecriture?.resoudre();
      ecriture = null;
      return arreterRepond;
    },
  };
}

// Dépendances du déroulement ; reponses : réponse à chaque type d'encart.
function preparer(options = {}) {
  const journal = [];
  const questions = [];
  const carte = options.carte ?? fausseCarte(journal, options);
  const repl = fauxRepl(journal, { carte, ...options });
  const session = options.session ?? creerSession({ planifier: (fn) => fn() });
  const reponses = options.reponses ?? {};
  const dependances = {
    carte,
    creerRepl: () => repl,
    session,
    demander: options.demander
      ? options.demander
      : async (type, donnees) => {
          journal.push(`demander ${type}`);
          questions.push({ type, donnees });
          return reponses[type] ?? 'non';
        },
    epingles: async () => options.epingles ?? EPINGLES,
    urls: { dapjs: '/dap.js', firmware: '/micropython/firmware.bin' },
    delais: { demarrage: 30, relance: 2, redemarrage: 30, ...options.delais },
  };
  return { journal, questions, carte, repl, session, dependances };
}

const BLOC = { id: 'page#1', code: 'print(1+1)' };

// Journal sans les répétitions consécutives (Ctrl-C renvoyé pendant la
// fenêtre de démarrage).
const sansRepetition = (journal) => journal.filter((l, i) => l !== journal[i - 1]);

// --- Étape 0 : confirmation -------------------------------------------------

test("bloc confirm : rien n'est envoyé si l'utilisateur annule", async () => {
  const { journal, questions, dependances, session } = preparer({
    reponses: { confirmation: 'non' },
  });
  const r = await essayer({ ...BLOC, confirmation: 'Efface la flash externe.' }, dependances);
  assert.equal(r.fin, 'annule');
  assert.deepEqual(journal, ['demander confirmation']);
  assert.deepEqual(questions[0].donnees, { id: 'page#1', texte: 'Efface la flash externe.' });
  assert.equal(session.etat.etape, 'repos');
});

test('bloc confirm : rien ne part tant que « Lancer quand même » n’est pas cliqué', async () => {
  const reponse = differee();
  const { journal, dependances } = preparer({
    demander: (type) => {
      journal.push(`demander ${type}`);
      return reponse.promesse;
    },
  });
  const fin = essayer({ ...BLOC, confirmation: 'Remplace la configuration.' }, dependances);
  await tic(20);
  assert.deepEqual(journal, ['demander confirmation']);
  reponse.resoudre('oui');
  const r = await fin;
  assert.equal(r.fin, 'lance');
  assert.ok(journal.includes('executer print(1+1)'));
});

// --- Étape 1 : connexion et DAPLink -----------------------------------------

test('carte non connectée : connexion, puis essai', async () => {
  const { journal, dependances } = preparer({ connectee: false });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  assert.equal(journal[0], 'connecter page#1');
});

test('connexion échouée : rien d’autre', async () => {
  const { journal, dependances } = preparer({ connectee: false, connexionReussie: false });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'connexion');
  assert.deepEqual(journal, ['connecter page#1']);
});

test('DAPLink ancien, « plus tard » : l’essai continue', async () => {
  const { journal, questions, dependances, session } = preparer({
    daplink: { numero: 1, date: 20250101 },
    reponses: { daplink: 'plus-tard' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  assert.deepEqual(questions[0], {
    type: 'daplink',
    donnees: { id: 'page#1', release: '2026-11-25.3' },
  });
  assert.ok(journal.includes('executer print(1+1)'));
  assert.equal(session.etat.daplinkReporte, true);

  // Retenu pour la page : plus de question au clic suivant.
  journal.length = 0;
  await essayer(BLOC, dependances);
  assert.ok(!journal.includes('demander daplink'));
  assert.ok(!journal.includes('lireVersionDaplink'));
});

test('DAPLink ancien, « mettre à jour » : étapes affichées, rien n’est lancé', async () => {
  const { journal, dependances, session } = preparer({
    daplink: null,
    reponses: { daplink: 'oui' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'daplink');
  assert.deepEqual(session.etat.daplink, { release: '2026-11-25.3' });
  assert.ok(!journal.includes('interrompre'));
  assert.ok(!journal.some((l) => l.startsWith('executer')));
});

test('DAPLink à jour ou épinglage illisible : pas de question', async () => {
  const a = preparer();
  await essayer(BLOC, a.dependances);
  assert.ok(!a.journal.includes('demander daplink'));
  const b = preparer({ daplink: null, epingles: { ...EPINGLES, daplink: null } });
  await essayer(BLOC, b.dependances);
  assert.ok(!b.journal.includes('demander daplink'));
  assert.ok(b.journal.includes('executer print(1+1)'));
});

// --- Étapes 2 et 3 : sondage, firmware --------------------------------------

test('firmware à jour : lancé directement, sans question', async () => {
  const { journal, questions, dependances } = preparer();
  await essayer(BLOC, dependances);
  assert.deepEqual(questions, []);
  assert.deepEqual(journal, [
    'lireVersionDaplink',
    'interrompre',
    'lireVersion',
    'executer print(1+1)',
  ]);
});

test('firmware ancien, « non » : rien n’est flashé, rien n’est lancé', async () => {
  const { journal, questions, dependances } = preparer({
    versions: ['v0.28.2'],
    reponses: { installation: 'non' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'annule');
  assert.equal(questions[0].type, 'installation');
  assert.equal(questions[0].donnees.version, 'v0.29.0');
  assert.equal(questions[0].donnees.autreCause, false);
  assert.equal(questions[0].donnees.raison, 'ancien');
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
  assert.ok(!journal.some((l) => l.startsWith('executer')));
  assert.ok(!journal.some((l) => l.startsWith('ecrireFichierRam')));
});

test('firmware ancien : rien n’est flashé tant que « Installer » n’est pas cliqué', async () => {
  const reponse = differee();
  const { journal, dependances } = preparer({
    versions: ['v0.28.2', 'v0.29.0'],
    invites: [true, true],
    demander: (type) => {
      journal.push(`demander ${type}`);
      return reponse.promesse;
    },
  });
  const fin = essayer(BLOC, dependances);
  await tic(20);
  assert.equal(journal.at(-1), 'demander installation');
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
  reponse.resoudre('oui');
  assert.equal((await fin).fin, 'lance');
});

test('firmware ancien, « oui » : flash, nouveau sondage, puis lancement', async () => {
  const { journal, dependances, session } = preparer({
    invites: [true, true],
    versions: ['v0.28.2', 'v0.29.0'],
    reponses: { installation: 'oui' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  assert.deepEqual(journal, [
    'lireVersionDaplink',
    'interrompre',
    'lireVersion',
    'demander installation',
    'flasherFirmware /micropython/firmware.bin',
    'banniere',
    'interrompre',
    'lireVersion',
    'executer print(1+1)',
  ]);
  assert.equal(session.etat.etape, 'fini');
});

test('flash raté : pas de nouvel essai, rien n’est lancé', async () => {
  const { journal, dependances } = preparer({
    versions: ['v0.28.2'],
    flash: false,
    reponses: { installation: 'oui' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'installation');
  assert.equal(journal.filter((l) => l.startsWith('flasherFirmware')).length, 1);
  assert.ok(!journal.some((l) => l.startsWith('executer')));
});

test('MicroPython muet après l’installation : message, pas de nouvelle proposition', async () => {
  const { journal, dependances, session } = preparer({
    invites: [true, false],
    versions: ['v0.28.2'],
    reponses: { installation: 'oui' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'installation');
  assert.equal(journal.filter((l) => l === 'demander installation').length, 1);
  assert.equal(journal.filter((l) => l.startsWith('flasherFirmware')).length, 1);
  assert.ok(!journal.some((l) => l.startsWith('executer')));
  assert.match(session.etat.erreur, /RESET/);
});

test('pas d’invite mais bannière après redémarrage : message « carte occupée », pas d’installation proposée', async () => {
  const { journal, dependances, session } = preparer({ invites: [false], banniere: true });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'occupee');
  // Après le redémarrage, Ctrl-C est renvoyé pendant la fenêtre de démarrage.
  assert.deepEqual(sansRepetition(journal), [
    'lireVersionDaplink',
    'interrompre',
    'redemarrer',
    'interrompre',
  ]);
  assert.equal(session.etat.erreur, TEXTE_CARTE_OCCUPEE);
});

test('pas d’invite ni de bannière : installation proposée, avec l’autre cause', async () => {
  const { journal, questions, dependances } = preparer({ invites: [false] });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'annule');
  assert.deepEqual(sansRepetition(journal), [
    'lireVersionDaplink',
    'interrompre',
    'redemarrer',
    'interrompre',
    'demander installation',
  ]);
  assert.equal(questions[0].donnees.autreCause, true);
  assert.equal(questions[0].donnees.raison, 'absent');
});

test('MicroPython sans steami.version : installation proposée comme pour une version ancienne', async () => {
  const { questions, dependances } = preparer({ versions: [null] });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'annule');
  assert.equal(questions[0].donnees.raison, 'ancien');
});

test('redémarrage refusé (DAPLink ancien) : la bannière est quand même guettée', async () => {
  const { journal, dependances } = preparer({ invites: [false] });
  dependances.carte.redemarrer = async () => {
    journal.push('redemarrer');
    throw new Error('reset impossible');
  };
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'annule');
  assert.ok(journal.includes('demander installation'));
});

// --- Étapes 4 et 5 : fichiers, lancement ------------------------------------

test('fichiers annexes écrits dans /ram avant le lancement', async () => {
  const { journal, dependances } = preparer();
  await essayer(
    {
      ...BLOC,
      fichiers: [
        { nom: 'pins.py', contenu: 'A = 1' },
        { nom: 'mesh.py', contenu: 'B = 2' },
      ],
    },
    dependances,
  );
  assert.deepEqual(journal.slice(-3), [
    'ecrireFichierRam pins.py A = 1',
    'ecrireFichierRam mesh.py B = 2',
    'executer print(1+1)',
  ]);
});

test('sortie et traceback dans la console du bloc', async () => {
  const traceback = 'Traceback (most recent call last):\r\nNameError: x\r\n';
  const { dependances, session } = preparer({
    sortie: 'bonjour\r\n',
    resultat: { erreur: traceback, arrete: false },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'erreur-python');
  assert.equal(session.etat.actif, 'page#1');
  assert.equal(session.etat.sortie, 'bonjour\r\n');
  assert.equal(session.etat.traceback, traceback);
  assert.equal(session.etat.etape, 'fini');
});

test('erreur de la carte en cours de route : message du bouton MicroPython', async () => {
  const { dependances, session } = preparer();
  dependances.creerRepl = () => ({
    async interrompre() {
      throw new ErreurLecteur(MESSAGE_SANS_CARTE);
    },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'erreur');
  assert.equal(session.etat.erreur, TEXTE_CARTE_PERDUE);
});

test('épinglage du wiki illisible : rien n’est lancé', async () => {
  const { journal, dependances, session } = preparer();
  dependances.epingles = async () => {
    const err = new Error('Impossible de lire la version de MicroPython proposée par le wiki.');
    err.name = 'ErreurLecteur';
    throw err;
  };
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'erreur');
  assert.ok(!journal.includes('interrompre'));
  assert.match(session.etat.erreur, /version de MicroPython/);
});

// --- Étape 6 : arrêter, second bloc -----------------------------------------

test('second bloc lancé pendant un programme : arreter() appelé avant', async () => {
  const { journal, dependances, session } = preparer({
    invites: [true, true],
    versions: ['v0.29.0', 'v0.29.0'],
    bloquer: true,
  });
  const premier = essayer(BLOC, dependances);
  await tic(10);
  assert.equal(session.etat.etape, 'programme');
  journal.length = 0;
  const second = essayer({ id: 'page#2', code: 'print(2)' }, dependances);
  assert.equal((await premier).fin, 'arrete');
  await tic(10);
  assert.equal(journal[0], 'arreter');
  assert.ok(journal.indexOf('arreter') < journal.indexOf('executer print(2)'));
  // Le premier ne reprend pas la console.
  assert.equal(session.etat.actif, 'page#2');
  assert.equal(session.etat.etape, 'programme');
  arreter(dependances);
  await second;
});

test('second bloc : la carte ne répond pas à l’arrêt → appuyer sur RESET', async () => {
  const { journal, dependances, session } = preparer({ bloquer: true, arreterRepond: false });
  void essayer(BLOC, dependances);
  await tic(10);
  journal.length = 0;
  const r = await essayer({ id: 'page#2', code: 'print(2)' }, dependances);
  assert.equal(r.fin, 'reset');
  assert.deepEqual(journal, ['arreter']);
  assert.equal(session.etat.erreur, TEXTE_RESET);
});

test('confirmation d’un second bloc annulée : le premier programme continue', async () => {
  const { journal, dependances, session } = preparer({
    bloquer: true,
    reponses: { confirmation: 'non' },
  });
  void essayer(BLOC, dependances);
  await tic(10);
  journal.length = 0;
  const r = await essayer({ id: 'page#2', code: 'x', confirmation: 'Efface.' }, dependances);
  assert.equal(r.fin, 'annule');
  assert.deepEqual(journal, ['demander confirmation']);
  assert.equal(session.etat.actif, 'page#1');
  assert.equal(session.etat.etape, 'programme');
});

test('programme terminé puis nouvel essai : remise à zéro avant les fichiers', async () => {
  const { journal, dependances } = preparer({
    invites: [true, true],
    versions: ['v0.29.0', 'v0.29.0'],
  });
  await essayer(BLOC, dependances);
  journal.length = 0;
  await essayer({ ...BLOC, fichiers: [{ nom: 'pins.py', contenu: 'A' }] }, dependances);
  assert.deepEqual(journal.slice(-3), [
    'arreter',
    'ecrireFichierRam pins.py A',
    'executer print(1+1)',
  ]);
});

test('Arrêter : programme arrêté', async () => {
  const { dependances, session } = preparer({ bloquer: true });
  const fin = essayer(BLOC, dependances);
  await tic(10);
  assert.equal(await arreter(dependances), true);
  assert.equal((await fin).fin, 'arrete');
  assert.equal(session.etat.etape, 'fini');
  assert.equal(session.etat.message, 'Programme arrêté.');
});

test('Arrêter : la carte ne répond pas → message « appuyer sur RESET »', async () => {
  const { dependances, session } = preparer({ bloquer: true, arreterRepond: false });
  void essayer(BLOC, dependances);
  await tic(10);
  assert.equal(await arreter(dependances), false);
  assert.equal(session.etat.erreur, TEXTE_RESET);
});

test('carte perdue pendant un programme : essai terminé, nouveau REPL ensuite', async () => {
  const { dependances, session } = preparer({ bloquer: true });
  let crees = 0;
  const creer = dependances.creerRepl;
  dependances.creerRepl = () => {
    crees++;
    return creer();
  };
  void essayer(BLOC, dependances);
  await tic(10);
  dependances.carte.etat = { ...dependances.carte.etat, connectee: false };
  signalerDeconnexion(session);
  assert.equal(session.etat.etape, 'fini');
  await essayer(BLOC, dependances);
  assert.equal(crees, 2);
});

test('pendant la préparation, un autre clic est ignoré', async () => {
  const reponse = differee();
  const { journal, dependances } = preparer({
    versions: ['v0.28.2'],
    demander: (type) => {
      journal.push(`demander ${type}`);
      return reponse.promesse;
    },
  });
  void essayer(BLOC, dependances);
  await tic(10);
  const r = await essayer({ id: 'page#2', code: 'x' }, dependances);
  assert.equal(r.fin, 'occupe');
  reponse.resoudre('non');
});

// --- Session et fonctions pures ---------------------------------------------

test('session.demander : encart affiché, puis réponse', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const reponse = session.demander('installation', { id: 'page#1', version: 'v0.29.0' });
  assert.deepEqual(session.etat.encart, {
    type: 'installation',
    donnees: { id: 'page#1', version: 'v0.29.0' },
  });
  session.repondre('oui');
  assert.equal(await reponse, 'oui');
  assert.equal(session.etat.encart, null);
});

test('session : la sortie est bornée', () => {
  const session = creerSession({ planifier: (fn) => fn(), limiteSortie: 20 });
  const jeton = session.commencer('page#1');
  session.ajouterSortie(jeton, 'ligne 1\nligne 2\nligne 3\nligne 4\n');
  assert.ok(session.etat.sortie.length <= 20);
  assert.ok(session.etat.sortie.endsWith('ligne 4\n'));
  assert.ok(!session.etat.sortie.startsWith('gne'));
});

test('texteConsole : fins de ligne de la carte', () => {
  assert.equal(texteConsole('a\r\nb\rc'), 'a\nb\nc');
});

test('lireFichiers : JSON du plugin', () => {
  assert.deepEqual(lireFichiers(undefined), []);
  assert.deepEqual(lireFichiers('[{"nom":"pins.py","contenu":"A = 1"}]'), [
    { nom: 'pins.py', contenu: 'A = 1' },
  ]);
  assert.equal(lireFichiers('pas du json'), null);
  assert.equal(lireFichiers('[{"nom":"pins.py"}]'), null);
});

test('chargerEpingles : versions du wiki', async () => {
  const fichiers = {
    '/m.json': { version: 'v0.29.0', taille: 1, sha256: 'x' },
    '/d.json': { release: '2026-11-25.3', numero: 3, date: 20261125, taille: 1, sha256: 'y' },
  };
  const recuperer = async (url) => ({ ok: true, json: async () => fichiers[url] });
  assert.deepEqual(
    await chargerEpingles({ micropython: '/m.json', daplink: '/d.json' }, recuperer),
    {
      micropython: { version: 'v0.29.0' },
      daplink: { release: '2026-11-25.3', numero: 3, date: 20261125 },
    },
  );
  // DAPLink illisible : pas de vérification ; MicroPython illisible : erreur.
  const sansDaplink = async (url) =>
    url === '/d.json' ? { ok: false, status: 404 } : { ok: true, json: async () => fichiers[url] };
  assert.equal(
    (await chargerEpingles({ micropython: '/m.json', daplink: '/d.json' }, sansDaplink)).daplink,
    null,
  );
  await assert.rejects(
    chargerEpingles({ micropython: '/m.json', daplink: '/d.json' }, async () => {
      throw new Error('réseau');
    }),
    /version de MicroPython/,
  );
});

test('statutPastille : état de la carte vu du bloc', () => {
  const carte = { connexion: false, connectee: true, occupee: false };
  const session = { actif: 'page#1', etape: 'programme' };
  assert.equal(statutPastille({ ...carte, connexion: true }, session, 'page#1'), 'connexion');
  assert.equal(statutPastille({ ...carte, connectee: false }, session, 'page#1'), 'deconnectee');
  assert.equal(statutPastille({ ...carte, occupee: true }, session, 'page#1'), 'televersement');
  assert.equal(statutPastille(carte, session, 'page#1'), 'programme');
  assert.equal(statutPastille(carte, session, 'page#2'), 'connectee');
});

test('sortie d’un essai remplacé : ignorée', () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const premier = session.commencer('page#1');
  session.commencer('page#2');
  session.ajouterSortie(premier, 'ancien\n');
  assert.equal(session.etat.sortie, '');
  assert.equal(session.changer(premier, { etape: 'fini' }), false);
});

// --- Tour de correction 1 ----------------------------------------------------

// A. Arrêter pendant l'envoi des fichiers annexes : rien ne tourne ensuite.

const FICHIERS = [
  { nom: 'pins.py', contenu: 'A = 1' },
  { nom: 'mesh.py', contenu: 'B = 2' },
];

test('Arrêter pendant l’envoi des fichiers (écriture finie après l’arrêt) : executer n’est jamais appelé', async () => {
  const { journal, dependances, session } = preparer({ fichiersBloques: 'resout' });
  const fin = essayer({ ...BLOC, fichiers: FICHIERS }, dependances);
  await tic(10);
  assert.equal(session.etat.etape, 'fichiers');
  assert.equal(await arreter(dependances), true);
  assert.equal((await fin).fin, 'arrete');
  await tic(10);
  assert.ok(!journal.some((l) => l.startsWith('executer')), journal.join(' | '));
  assert.ok(!journal.some((l) => l.startsWith('ecrireFichierRam mesh.py')));
  assert.equal(session.etat.etape, 'fini');
  assert.equal(session.etat.message, 'Programme arrêté.');
  assert.equal(session.etat.erreur, null);
});

test('Arrêter pendant l’envoi des fichiers (KeyboardInterrupt) : pas de message d’erreur', async () => {
  const { journal, dependances, session } = preparer({ fichiersBloques: 'rejette' });
  const fin = essayer({ ...BLOC, fichiers: FICHIERS }, dependances);
  await tic(10);
  assert.equal(await arreter(dependances), true);
  assert.equal((await fin).fin, 'arrete');
  await tic(10);
  assert.ok(!journal.some((l) => l.startsWith('executer')));
  assert.equal(session.etat.erreur, null);
  assert.equal(session.etat.message, 'Programme arrêté.');
});

for (const mode of ['resout', 'rejette']) {
  test(`second bloc pendant l’envoi des fichiers (${mode}) : le premier ne lance pas son programme`, async () => {
    const { journal, dependances, session } = preparer({
      fichiersBloques: mode,
      invites: [true, true],
      versions: ['v0.29.0', 'v0.29.0'],
    });
    const premier = essayer({ ...BLOC, fichiers: [FICHIERS[0]] }, dependances);
    await tic(10);
    assert.equal(session.etat.etape, 'fichiers');
    const second = essayer({ id: 'page#2', code: 'print(2)' }, dependances);
    assert.equal((await premier).fin, 'arrete');
    assert.equal((await second).fin, 'lance');
    assert.ok(!journal.includes('executer print(1+1)'), journal.join(' | '));
    assert.ok(journal.includes('executer print(2)'));
    assert.equal(session.etat.actif, 'page#2');
    assert.equal(session.etat.erreur, null);
  });
}

// B. Question en attente : bloc quitté, carte perdue.

test('bloc quitté pendant la question d’installation : essai abandonné, rien n’est flashé', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const { journal, dependances } = preparer({
    session,
    versions: ['v0.28.2'],
    demander: (type, donnees) => session.demander(type, donnees),
  });
  const fin = essayer(BLOC, dependances);
  await tic(10);
  assert.equal(session.etat.encart?.type, 'installation');
  abandonnerBloc(session, 'page#1');
  assert.equal((await fin).fin, 'abandonne');
  assert.equal(session.etat.encart, null);
  assert.equal(estOccupee(session.etat), false, 'les boutons Essayer sont libres');
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
});

test('bloc quitté pendant la question DAPLink : pas de sondage', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const { journal, dependances } = preparer({
    session,
    daplink: null,
    demander: (type, donnees) => session.demander(type, donnees),
  });
  const fin = essayer(BLOC, dependances);
  await tic(10);
  assert.equal(session.etat.encart?.type, 'daplink');
  abandonnerBloc(session, 'page#1');
  assert.equal((await fin).fin, 'abandonne');
  assert.equal(session.etat.daplinkReporte, false, 'pas pris pour « Plus tard »');
  assert.ok(!journal.includes('interrompre'));
  assert.equal(estOccupee(session.etat), false);
});

test('bloc quitté pendant sa confirmation : annulé, le programme d’un autre bloc continue', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const { journal, dependances } = preparer({
    session,
    bloquer: true,
    demander: (type, donnees) => session.demander(type, donnees),
  });
  void essayer(BLOC, dependances);
  await tic(10);
  const fin = essayer({ id: 'page#2', code: 'x', confirmation: 'Efface.' }, dependances);
  await tic(10);
  abandonnerBloc(session, 'page#2');
  assert.equal((await fin).fin, 'annule');
  assert.equal(session.etat.actif, 'page#1');
  assert.equal(session.etat.etape, 'programme');
  assert.ok(!journal.includes('arreter'));
});

test('DAPLink : une réponse autre que « Plus tard » ne lance rien', async () => {
  const { journal, dependances, session } = preparer({
    daplink: null,
    reponses: { daplink: 'non' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'annule');
  assert.equal(session.etat.daplinkReporte, false);
  assert.ok(!journal.includes('interrompre'));
});

test('carte perdue pendant la question d’installation : essai terminé, rien n’est flashé', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const { journal, dependances, carte } = preparer({
    session,
    versions: ['v0.28.2'],
    demander: (type, donnees) => session.demander(type, donnees),
  });
  const fin = essayer(BLOC, dependances);
  await tic(10);
  carte.etat = { ...carte.etat, connectee: false };
  signalerDeconnexion(session);
  assert.equal((await fin).fin, 'abandonne');
  assert.equal(session.etat.encart, null);
  assert.equal(session.etat.erreur, TEXTE_CARTE_PERDUE);
  assert.equal(estOccupee(session.etat), false);
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
});

test('carte débranchée avant « Installer » : rien n’est flashé', async () => {
  const { journal, dependances, carte, session } = preparer({
    versions: ['v0.28.2'],
    demander: async (type) => {
      journal.push(`demander ${type}`);
      carte.etat = { ...carte.etat, connectee: false };
      return 'oui';
    },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'deconnectee');
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
  assert.equal(session.etat.erreur, TEXTE_CARTE_PERDUE);
});

test('carte débranchée pendant le sondage : pas d’installation proposée', async () => {
  const { journal, dependances, session } = preparer({ perdreAuSondage: true });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'deconnectee');
  assert.ok(!journal.includes('demander installation'));
  assert.equal(session.etat.erreur, TEXTE_CARTE_PERDUE);
});

// D. Attente bornée du redémarrage après l'installation (décision 3).

// Fonction : chaque test reçoit ses propres listes (le faux REPL les consomme).
const installation = () => ({
  invites: [true, true],
  versions: ['v0.28.2', 'v0.29.0'],
  reponses: { installation: 'oui' },
});

test('installation : la bannière est attendue avant le nouveau sondage', async () => {
  const { journal, dependances } = preparer({ ...installation(), banniereApresFlash: 15 });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  const i = journal.indexOf('banniere');
  assert.ok(i > journal.indexOf('flasherFirmware /micropython/firmware.bin'));
  assert.ok(i < journal.lastIndexOf('interrompre'), journal.join(' | '));
});

test('installation : bannière reçue pendant le flash, sondage sans attendre le délai', async () => {
  const { carte, dependances } = preparer({
    ...installation(),
    banniereApresFlash: 'pendant',
    delais: { redemarrage: 500 },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  const attente = carte.instants.interrompre.at(-1) - carte.instants.finFlash;
  assert.ok(attente < 300, `guet branché avant le flash (attente : ${attente} ms)`);
});

test('installation sans bannière : attente bornée, puis sondage et lancement', async () => {
  const { carte, journal, dependances } = preparer({
    ...installation(),
    banniereApresFlash: null,
    pretApres: 5,
    delais: { redemarrage: 60 },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  assert.ok(!journal.includes('banniere'));
  const attente = carte.instants.interrompre.at(-1) - carte.instants.finFlash;
  assert.ok(attente >= 55, `attente du redémarrage (${attente} ms)`);
  assert.ok(attente < 1000, `attente bornée (${attente} ms)`);
});

test('installation sans réponse ensuite : message en français, flash non réessayé', async () => {
  const { journal, dependances, session } = preparer({
    ...installation(),
    banniereApresFlash: null,
    pretApres: null,
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'installation');
  assert.equal(journal.filter((l) => l.startsWith('flasherFirmware')).length, 1);
  assert.equal(journal.filter((l) => l === 'demander installation').length, 1);
  assert.ok(!journal.some((l) => l.startsWith('executer')));
  assert.equal(session.etat.erreur, TEXTE_APRES_INSTALLATION);
});

// --- Revue finale ------------------------------------------------------------

// I1. Bloc quitté pendant la préparation, avant toute question : l'essai se
// termine, sans encart ni action sur la carte ensuite.

test('bloc quitté pendant la vérification : ni question, ni carte touchée, boutons libres', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const versions = differee();
  const { journal, dependances } = preparer({
    session,
    versions: ['v0.28.2'],
    demander: (type, donnees) => {
      journal.push(`demander ${type}`);
      return session.demander(type, donnees);
    },
  });
  dependances.epingles = () => versions.promesse;
  const fin = essayer(BLOC, dependances);
  await tic(5);
  assert.equal(session.etat.etape, 'verification');
  abandonnerBloc(session, 'page#1');
  versions.resoudre(EPINGLES);
  await tic(20);
  assert.equal(session.etat.encart, null, 'aucun encart pour un bloc quitté');
  assert.equal(estOccupee(session.etat), false, 'les boutons Essayer sont libres');
  assert.deepEqual(journal, [], journal.join(' | '));
  session.repondre('non');
  assert.equal((await fin).fin, 'abandonne');
});

test('bloc quitté pendant le sondage : la carte ancienne répond, rien n’est proposé ni flashé', async () => {
  const session = creerSession({ planifier: (fn) => fn() });
  const { journal, dependances } = preparer({
    session,
    versions: ['v0.28.2'],
    demander: (type, donnees) => {
      journal.push(`demander ${type}`);
      return session.demander(type, donnees);
    },
  });
  const reponse = differee();
  const repl = dependances.creerRepl();
  const interrompre = repl.interrompre;
  repl.interrompre = async () => {
    await reponse.promesse;
    return interrompre();
  };
  dependances.creerRepl = () => repl;
  const fin = essayer(BLOC, dependances);
  await tic(5);
  assert.equal(session.etat.etape, 'sondage');
  abandonnerBloc(session, 'page#1');
  reponse.resoudre();
  await tic(20);
  assert.equal(session.etat.encart, null);
  assert.equal(estOccupee(session.etat), false);
  assert.ok(!journal.includes('lireVersion'), journal.join(' | '));
  assert.ok(!journal.some((l) => l.startsWith('demander')));
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
  session.repondre('non');
  assert.equal((await fin).fin, 'abandonne');
});

// I2. La connexion redémarre la carte : le premier Ctrl-C peut tomber pendant
// le démarrage et se perdre.

test('nouvelle connexion, main.py en boucle, premier Ctrl-C perdu : pas d’installation proposée', async () => {
  const { journal, dependances } = preparer({
    connectee: false,
    invites: [false, true],
    versions: ['v0.29.0'],
    reponses: { installation: 'oui' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance', journal.join(' | '));
  assert.ok(!journal.includes('demander installation'));
  assert.ok(!journal.some((l) => l.startsWith('flasherFirmware')));
});

test('nouvelle connexion, bannière vue au démarrage mais pas d’invite : carte occupée, pas d’installation', async () => {
  const { journal, dependances, carte, session } = preparer({
    connectee: false,
    invites: [false],
    reponses: { installation: 'oui' },
    delais: { demarrage: 5000 },
  });
  const connecter = carte.connecter;
  carte.connecter = async (id) => {
    await connecter(id);
    setTimeout(() => carte.emettre(BANNIERE), 3);
  };
  const debut = Date.now();
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'occupee', journal.join(' | '));
  // Une tentative ratée après la bannière suffit : pas toute la fenêtre.
  assert.ok(Date.now() - debut < 1000, `${Date.now() - debut} ms`);
  assert.ok(!journal.includes('redemarrer'), 'la connexion a déjà redémarré la carte');
  assert.ok(!journal.includes('demander installation'));
  assert.equal(session.etat.erreur, TEXTE_CARTE_OCCUPEE);
});

test('diagnostic : après le redémarrage, Ctrl-C finit par répondre (main.py en boucle) : pas d’installation', async () => {
  const { journal, dependances } = preparer({
    invites: [false, false, true],
    versions: ['v0.29.0'],
    reponses: { installation: 'oui' },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance', journal.join(' | '));
  assert.ok(journal.includes('redemarrer'));
  assert.ok(!journal.includes('demander installation'));
});

test('nouvelle connexion, carte sans MicroPython : fenêtre bornée, puis installation proposée sans second redémarrage', async () => {
  const { journal, questions, dependances } = preparer({
    connectee: false,
    invites: [false],
    delais: { demarrage: 60 },
  });
  const debut = Date.now();
  const r = await essayer(BLOC, dependances);
  const duree = Date.now() - debut;
  assert.equal(r.fin, 'annule');
  assert.ok(duree >= 55 && duree < 1000, `fenêtre de démarrage bornée (${duree} ms)`);
  assert.ok(journal.filter((l) => l === 'interrompre').length > 1, 'Ctrl-C renvoyé');
  assert.ok(!journal.includes('redemarrer'));
  assert.equal(questions[0].type, 'installation');
  assert.equal(questions[0].donnees.autreCause, true);
  assert.equal(questions[0].donnees.raison, 'absent');
});

// I6. Premier essai d'une connexion : remise à zéro (raw REPL, sans main.py).

test('nouvelle connexion : remise à zéro avant le premier programme', async () => {
  const { journal, dependances } = preparer({ connectee: false });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'lance');
  assert.deepEqual(journal, [
    'connecter page#1',
    'lireVersionDaplink',
    'interrompre',
    'lireVersion',
    'arreter',
    'executer print(1+1)',
  ]);
});

test('carte libérée ou perdue : l’état de MicroPython est inconnu, le prochain essai remet à zéro', () => {
  const session = creerSession({ planifier: (fn) => fn() });
  signalerDeconnexion(session);
  assert.equal(session.etat.programmeLance, true);
});

// « Plus tard » sous les étapes du DAPLink : un statut cohérent.

test('« Plus tard » sous les étapes du DAPLink : le statut dit quoi faire', async () => {
  const { dependances, session } = preparer({ daplink: null, reponses: { daplink: 'oui' } });
  await essayer(BLOC, dependances);
  session.reporterDaplink();
  assert.equal(session.etat.daplink, null);
  assert.match(session.etat.message, /reportée.*Essayer sur la carte/);
});

// I3, I4, I5. Messages de la connexion partagée sous un bloc MicroPython :
// jamais « Connecter la carte », ni le .bin, ni le téléversement des pages
// Arduino.

const ARDUINO = /Connecter la carte|\.bin|page Codespace|éléversement/;

test('traduireMessageCarte : les messages des pages Arduino reformulés pour MicroPython', () => {
  const acces = messageErreur({ name: 'SecurityError', message: 'Access denied.' });
  assert.match(acces, /\.bin ci-dessous/, 'texte des pages Arduino inchangé');
  const cas = [
    MESSAGE_SANS_CARTE,
    MESSAGE_DEBRANCHEE,
    MESSAGE_FLASH_EN_COURS,
    MESSAGE_DAPJS_INTROUVABLE,
    acces,
    messageFrancais(new Error('Flash error'), 'televersement'),
    messageErreur({ name: 'NotFoundError', message: 'The device was disconnected.' }),
  ];
  for (const texte of cas) {
    const traduit = traduireMessageCarte(texte);
    assert.doesNotMatch(traduit, ARDUINO, traduit);
  }
  assert.equal(traduireMessageCarte(MESSAGE_SANS_CARTE), TEXTE_CARTE_PERDUE);
  assert.equal(traduireMessageCarte(MESSAGE_DEBRANCHEE), TEXTE_CARTE_PERDUE);
  assert.equal(traduireMessageCarte(acces), TEXTE_ACCES_REFUSE_MICROPYTHON);
  assert.match(TEXTE_ACCES_REFUSE_MICROPYTHON, /udev/);
  assert.match(TEXTE_ACCES_REFUSE_MICROPYTHON, /Thonny/);
  assert.match(traduireMessageCarte(messageFrancais(new Error('Flash error'))), /^L'installation/);
  assert.match(traduireMessageCarte(MESSAGE_FLASH_EN_COURS), /^Installation en cours/);
  // Les autres messages passent tels quels.
  assert.equal(traduireMessageCarte('Aucune carte choisie.'), 'Aucune carte choisie.');
  assert.equal(traduireMessageCarte(null), null);
});

test('erreurCarteAffichee : un seul message quand la carte est débranchée pendant un programme', () => {
  const carte = { connectee: false, erreur: MESSAGE_DEBRANCHEE, dernierClic: 'page#1' };
  const session = { actif: 'page#1', etape: 'fini', erreur: null, message: TEXTE_DECONNECTEE };
  assert.equal(erreurCarteAffichee(carte, session, 'page#1'), null);
});

test('erreurCarteAffichee : pendant la mise à jour du DAPLink, le texte du bouton MicroPython', () => {
  const carte = { connectee: false, erreur: MESSAGE_DEBRANCHEE, dernierClic: 'page#1' };
  const session = { actif: 'page#1', etape: 'fini', erreur: null, message: 'Suivre…' };
  assert.equal(erreurCarteAffichee(carte, session, 'page#1'), TEXTE_CARTE_PERDUE);
  assert.equal(erreurCarteAffichee(carte, session, 'page#2'), null, 'sous le bloc actif seulement');
  // Une erreur de l'essai l'emporte : pas de doublon.
  const avecErreur = { ...session, erreur: TEXTE_CARTE_PERDUE };
  assert.equal(erreurCarteAffichee(carte, avecErreur, 'page#1'), null);
  // Sans essai, sous le dernier bloc cliqué (connexion refusée).
  const acces = messageErreur({ name: 'SecurityError', message: 'Access denied.' });
  const refus = { connectee: false, erreur: acces, dernierClic: 'page#3' };
  const repos = { actif: null, etape: 'repos', erreur: null, message: null };
  assert.equal(erreurCarteAffichee(refus, repos, 'page#3'), TEXTE_ACCES_REFUSE_MICROPYTHON);
});
