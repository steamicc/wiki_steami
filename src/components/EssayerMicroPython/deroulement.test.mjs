// Tests du déroulement du bouton « Essayer sur la carte » (MicroPython), avec
// une carte et un REPL simulés : aucun navigateur, aucune carte.
// Lancer : node --test src/components/EssayerMicroPython/deroulement.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXTE_RESET,
  arreter,
  chargerEpingles,
  creerSession,
  essayer,
  lireFichiers,
  signalerDeconnexion,
  statutPastille,
  texteConsole,
} from './deroulement.mjs';
import { TEXTE_CARTE_OCCUPEE } from './logique.mjs';

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
function fausseCarte(journal, options = {}) {
  const {
    connectee = true,
    connexionReussie = true,
    daplink = { numero: 3, date: 20261125 },
    banniere = false,
    flash = true,
  } = options;
  const ecouteurs = new Set();
  const emettre = (texte) => {
    const octets = new TextEncoder().encode(texte);
    for (const fn of [...ecouteurs]) fn(octets);
  };
  const carte = {
    etat: { connectee, occupee: false, erreur: null },
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
      if (flash) setTimeout(() => emettre(BANNIERE), 1);
      return flash;
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

// REPL simulé : invites et versions successives ; executer renvoie le résultat
// donné, ou attend arreter() si bloquer est vrai.
function fauxRepl(journal, options = {}) {
  const {
    invites = [true],
    versions = ['v0.29.0'],
    resultat = { erreur: null, arrete: false },
    sortie = '2\r\n',
    arreterRepond = true,
    bloquer = false,
  } = options;
  let enCours = null;
  return {
    async interrompre() {
      journal.push('interrompre');
      return invites.length ? invites.shift() : false;
    },
    async lireVersion() {
      journal.push('lireVersion');
      return versions.length ? versions.shift() : null;
    },
    async ecrireFichierRam(nom, contenu) {
      journal.push(`ecrireFichierRam ${nom} ${contenu}`);
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
      return arreterRepond;
    },
  };
}

// Dépendances du déroulement ; reponses : réponse à chaque type d'encart.
function preparer(options = {}) {
  const journal = [];
  const questions = [];
  const carte = options.carte ?? fausseCarte(journal, options);
  const repl = fauxRepl(journal, options);
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
    delais: { banniere: 30, redemarrage: 30 },
  };
  return { journal, questions, carte, repl, session, dependances };
}

const BLOC = { id: 'page#1', code: 'print(1+1)' };

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
  assert.deepEqual(journal, ['lireVersionDaplink', 'interrompre', 'redemarrer']);
  assert.equal(session.etat.erreur, TEXTE_CARTE_OCCUPEE);
});

test('pas d’invite ni de bannière : installation proposée, avec l’autre cause', async () => {
  const { journal, questions, dependances } = preparer({ invites: [false] });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'annule');
  assert.deepEqual(journal, [
    'lireVersionDaplink',
    'interrompre',
    'redemarrer',
    'demander installation',
  ]);
  assert.equal(questions[0].donnees.autreCause, true);
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

test('erreur de la carte en cours de route : message en français', async () => {
  const { dependances, session } = preparer();
  dependances.creerRepl = () => ({
    async interrompre() {
      const err = new Error('Aucune carte connectée : cliquer sur « Connecter la carte ».');
      err.name = 'ErreurLecteur';
      throw err;
    },
  });
  const r = await essayer(BLOC, dependances);
  assert.equal(r.fin, 'erreur');
  assert.match(session.etat.erreur, /Aucune carte connectée/);
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
