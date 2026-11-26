// Tests de la connexion partagée (carte.mjs), avec un faux DAP.js et un faux WebUSB.
// Lancer : npm run test:js
// Le module est un singleton : chaque test finit carte libérée, comme au départ.
import test from 'node:test';
import assert from 'node:assert/strict';

import { DELAI_LIBERATION_MS, ETAT_INITIAL, carte } from './carte.mjs';
import { ErreurLecteur } from './logique.mjs';

let journal = [];
let pannes = {};
let derniere = null;

class FauxDAPLink {
  static EVENT_SERIAL_DATA = 'serial';

  constructor(transport) {
    this.transport = transport;
    this.ecouteurs = {};
    derniere = this;
  }

  on(nom, fn) {
    this.ecouteurs[nom] = fn;
  }

  emettre(texte) {
    this.ecouteurs[FauxDAPLink.EVENT_SERIAL_DATA]?.(texte);
  }

  async connect() {
    journal.push('connect');
  }

  async setSerialBaudrate(bauds) {
    journal.push(`bauds ${bauds}`);
    if (pannes.bauds) throw new Error(pannes.bauds);
  }

  startSerialRead() {
    journal.push('startSerialRead');
    return new Promise((resolve) => {
      this.arret = resolve;
    });
  }

  stopSerialRead() {
    journal.push('stopSerialRead');
    this.arret?.();
  }

  async flash() {
    journal.push('flash');
    if (pannes.flash) throw new Error(pannes.flash);
  }

  async disconnect() {
    journal.push('disconnect');
  }
}

const appareil = {
  async close() {
    journal.push('close');
  },
};

globalThis.window = { DAPjs: { DAPLink: FauxDAPLink, WebUSB: class {} } };
globalThis.requestAnimationFrame = (fn) => queueMicrotask(fn);
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    usb: {
      requestDevice: async () => appareil,
      addEventListener() {},
    },
  },
});

// Laisse passer les promesses en attente (setImmediate n'est pas simulé).
const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Abonne un composant et connecte la carte depuis l'exemple « A ».
async function demarrer(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  journal = [];
  pannes = {};
  const desabonner = carte.abonner(() => {});
  await carte.connecter('A');
  return desabonner;
}

// Le lecteur quitte la page : la carte doit être libérée après le délai.
async function quitter(t, desabonner) {
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.deepEqual(carte.etat, ETAT_INITIAL);
}

const bin = async () => new ArrayBuffer(8);

test('connexion : bauds à 115200 et console lancée', async (t) => {
  const desabonner = await demarrer(t);
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'startSerialRead']);
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.occupee, false);
  await quitter(t, desabonner);
});

test('libération : après le délai sans composant, pas avant, et annulée par un nouveau composant', async (t) => {
  const desabonner = await demarrer(t);
  journal = [];
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS - 1);
  await attendre();
  assert.equal(carte.etat.connectee, true);

  // Page d'exemples suivante : un composant revient avant la fin du délai.
  const autre = carte.abonner(() => {});
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.equal(carte.etat.connectee, true);
  assert.deepEqual(journal, []);

  await quitter(t, autre);
  assert.deepEqual(journal, ['stopSerialRead', 'disconnect', 'close']);
});

test('libération : jamais pendant un téléversement', async (t) => {
  const desabonner = await demarrer(t);
  let rendre;
  const enAttente = () =>
    new Promise((resolve) => {
      rendre = () => resolve(new ArrayBuffer(8));
    });
  carte.televerser('A', enAttente);
  // Occupée dès le clic, pendant le téléchargement du .bin.
  assert.equal(carte.etat.occupee, true);
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.ok(!journal.includes('disconnect'), journal.join(', '));

  rendre();
  await attendre();
  assert.ok(journal.includes('flash'));
  assert.equal(carte.etat.connectee, true);
  // La fin du téléversement replanifie la libération.
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.equal(journal.at(-1), 'close');
  assert.deepEqual(carte.etat, ETAT_INITIAL);
});

test("téléversement : la console est arrêtée avant d'être vidée", async (t) => {
  const desabonner = await demarrer(t);
  const ancienne = derniere;
  ancienne.emettre('ancien programme\n');
  await attendre();
  assert.deepEqual(carte.etat.lignes, ['ancien programme']);

  journal = [];
  await carte.televerser('B', async () => {
    // L'ancien programme écrit encore pendant le téléchargement.
    ancienne.emettre('pendant le téléchargement\n');
    return new ArrayBuffer(8);
  });
  assert.deepEqual(journal, ['stopSerialRead', 'flash', 'startSerialRead']);
  assert.deepEqual(carte.etat.lignes, []);
  assert.equal(carte.etat.programmeActif, 'B');
  assert.equal(carte.etat.dernierClic, 'B');

  ancienne.emettre('nouveau programme\n');
  await attendre();
  assert.deepEqual(carte.etat.lignes, ['nouveau programme']);
  await quitter(t, desabonner);
});

test('téléversement : téléchargement en échec, message en français et ancien programme gardé', async (t) => {
  const desabonner = await demarrer(t);
  await carte.televerser('A', bin);
  journal = [];
  await carte.televerser('B', async () => {
    throw new ErreurLecteur("Impossible de télécharger l'exemple.");
  });
  assert.equal(carte.etat.erreur, "Impossible de télécharger l'exemple.");
  assert.equal(carte.etat.dernierClic, 'B');
  // La console de A continue : rien n'a été arrêté ni téléversé.
  assert.equal(carte.etat.programmeActif, 'A');
  assert.deepEqual(journal, []);
  assert.equal(carte.etat.occupee, false);
  await quitter(t, desabonner);
});

test('téléversement : erreur de DAP.js traduite, avec le message brut', async (t) => {
  const desabonner = await demarrer(t);
  pannes.flash = 'Flash error';
  await carte.televerser('A', bin);
  assert.equal(
    carte.etat.erreur,
    'Le téléversement a échoué : débrancher et rebrancher la carte, puis réessayer. (Flash error)',
  );
  assert.equal(carte.etat.programmeActif, null);
  // La lecture série repart quand même.
  assert.equal(journal.at(-1), 'startSerialRead');
  await quitter(t, desabonner);
});

test('connexion en échec après connect() : la connexion à moitié ouverte est refermée', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  journal = [];
  pannes = { bauds: 'Bad response for 130 -> 0' };
  const desabonner = carte.abonner(() => {});
  await carte.connecter('C');
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'disconnect', 'close']);
  assert.equal(carte.etat.connectee, false);
  assert.equal(carte.etat.dernierClic, 'C');
  assert.match(carte.etat.erreur, /^La connexion à la carte a échoué : .*\(Bad response/);
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
});
