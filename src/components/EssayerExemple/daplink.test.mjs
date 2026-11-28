// Tests de la décision et du magasin de l'encart « DAPLink à mettre à jour ».
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ETAT_INITIAL_DAPLINK,
  decisionEncart,
  encartVisible,
  estSteami,
  verificationDaplink,
} from './daplink.mjs';

const EPINGLE = { release: '2026-11-25.3', numero: 3, date: 20261125 };
const SERIE = '0839000012345';

// Réponse 0x9F : octet 0 = commande, 1-4 = marque, puis numéro et date (uint32 LE).
function reponse(marque, numero, date) {
  const vue = new DataView(new ArrayBuffer(13));
  vue.setUint8(0, 0x9f);
  for (let i = 0; i < 4; i++) vue.setUint8(1 + i, marque.charCodeAt(i));
  vue.setUint32(5, numero, true);
  vue.setUint32(9, date, true);
  return vue;
}

async function verifier(vue, chargerEpingle = async () => EPINGLE) {
  await verificationDaplink.verifier({
    numeroSerie: SERIE,
    lireReponse: async () => vue,
    chargerEpingle,
  });
}

test('estSteami : numéro de série en 0839', () => {
  assert.equal(estSteami('0839000012345'), true);
  assert.equal(estSteami('9904360259'), false);
  assert.equal(estSteami(''), false);
  assert.equal(estSteami(null), false);
  assert.equal(estSteami(undefined), false);
});

test('decision : réponse plus ancienne → proposer', () => {
  assert.deepEqual(
    decisionEncart({
      numeroSerie: SERIE,
      reponse: reponse('STM1', 3, 20261124),
      epingle: EPINGLE,
    }),
    { proposer: true, release: '2026-11-25.3' },
  );
});

test('decision : réponse sans STM1 → proposer', () => {
  const r = decisionEncart({
    numeroSerie: SERIE,
    reponse: reponse('\0\0\0\0', 0, 0),
    epingle: EPINGLE,
  });
  assert.equal(r.proposer, true);
});

test('decision : à jour ou dev → rien', () => {
  for (const [numero, date] of [
    [3, 20261125],
    [4, 20261125],
    [1, 20261201],
    [0, 0],
  ]) {
    const r = decisionEncart({
      numeroSerie: SERIE,
      reponse: reponse('STM1', numero, date),
      epingle: EPINGLE,
    });
    assert.equal(r.proposer, false, `${numero} ${date}`);
  }
});

test("decision : carte qui n'est pas une STeaMi → rien", () => {
  const r = decisionEncart({
    numeroSerie: '9904360259',
    reponse: reponse('STM1', 1, 20200101),
    epingle: EPINGLE,
  });
  assert.equal(r.proposer, false);
});

test('decision : lecture en échec ou épinglé absent → rien', () => {
  const ancienne = reponse('STM1', 1, 20200101);
  assert.equal(
    decisionEncart({ numeroSerie: SERIE, reponse: null, epingle: EPINGLE }).proposer,
    false,
  );
  assert.equal(
    decisionEncart({ numeroSerie: SERIE, reponse: ancienne, epingle: null }).proposer,
    false,
  );
});

test('verifier : propose puis masque après mise à jour', async () => {
  verificationDaplink.reinitialiser();
  await verifier(reponse('STM1', 1, 20200101));
  assert.equal(verificationDaplink.etat.release, '2026-11-25.3');
  await verifier(reponse('STM1', 3, 20261125));
  assert.equal(verificationDaplink.etat.release, null);
});

test('verifier : épinglé illisible → rien', async () => {
  verificationDaplink.reinitialiser();
  const ancienne = reponse('STM1', 1, 20200101);
  await verifier(ancienne, async () => {
    throw new Error('réseau');
  });
  assert.equal(verificationDaplink.etat.release, null);
  await verifier(ancienne, async () => ({}));
  assert.equal(verificationDaplink.etat.release, null);
});

test('verifier : lecture qui échoue → rien, sans rejet', async () => {
  verificationDaplink.reinitialiser();
  await verificationDaplink.verifier({
    numeroSerie: SERIE,
    lireReponse: async () => {
      throw new Error('USB');
    },
    chargerEpingle: async () => EPINGLE,
  });
  assert.equal(verificationDaplink.etat.release, null);
});

test('plus tard : vaut pour toute la page', async () => {
  verificationDaplink.reinitialiser();
  const ancienne = reponse('STM1', 1, 20200101);
  await verifier(ancienne);
  assert.equal(verificationDaplink.etat.release, '2026-11-25.3');
  verificationDaplink.reporter();
  assert.deepEqual(verificationDaplink.etat, { release: null, reporte: true, autreEncart: false });
  await verifier(ancienne);
  assert.equal(verificationDaplink.etat.release, null);
});

test("déconnexion : l'encart reste", async () => {
  verificationDaplink.reinitialiser();
  await verifier(reponse('STM1', 1, 20200101));
  // Une déconnexion n'appelle ni verifier ni reporter : l'état ne bouge pas.
  assert.equal(verificationDaplink.etat.release, '2026-11-25.3');
});

test('abonner : appelé à chaque changement, plus après désabonnement', async () => {
  verificationDaplink.reinitialiser();
  let appels = 0;
  const fin = verificationDaplink.abonner(() => appels++);
  await verifier(reponse('STM1', 1, 20200101));
  assert.equal(appels, 1);
  verificationDaplink.reporter();
  assert.equal(appels, 2);
  fin();
  verificationDaplink.reinitialiser();
  assert.equal(appels, 2);
});

test("encartVisible : sous l'exemple cliqué en dernier, avec une release", () => {
  const aProposer = { ...ETAT_INITIAL_DAPLINK, release: '2026-11-25.3' };
  assert.equal(encartVisible(aProposer, true), true);
  assert.equal(encartVisible(aProposer, false), false);
  assert.equal(encartVisible(ETAT_INITIAL_DAPLINK, true), false);
  assert.equal(encartVisible({ ...aProposer, autreEncart: true }, true), false);
});

test('un seul encart : masqué tant que la pile radio affiche ses étapes', async () => {
  verificationDaplink.reinitialiser();
  await verifier(reponse('STM1', 1, 20200101));
  assert.equal(encartVisible(verificationDaplink.etat, true), true);
  const retirer = verificationDaplink.afficherAutreEncart();
  assert.equal(encartVisible(verificationDaplink.etat, true), false);
  // Rien n'est perdu : une reconnexion pendant ce temps garde la release.
  await verifier(reponse('STM1', 1, 20200101));
  assert.equal(verificationDaplink.etat.release, '2026-11-25.3');
  assert.equal(encartVisible(verificationDaplink.etat, true), false);
  retirer();
  assert.equal(encartVisible(verificationDaplink.etat, true), true);
});

test("plus tard dans les étapes de la pile radio : vaut pour l'encart du bouton Essayer", async () => {
  verificationDaplink.reinitialiser();
  const ancienne = reponse('STM1', 1, 20200101);
  await verifier(ancienne);
  const retirer = verificationDaplink.afficherAutreEncart();
  verificationDaplink.reporter();
  retirer();
  assert.deepEqual(verificationDaplink.etat, { release: null, reporte: true, autreEncart: false });
  assert.equal(encartVisible(verificationDaplink.etat, true), false);
  await verifier(ancienne);
  assert.equal(encartVisible(verificationDaplink.etat, true), false);
});

test('afficherAutreEncart : masqué jusqu’au dernier retrait, retrait unique', async () => {
  verificationDaplink.reinitialiser();
  await verifier(reponse('STM1', 1, 20200101));
  const premier = verificationDaplink.afficherAutreEncart();
  const second = verificationDaplink.afficherAutreEncart();
  premier();
  premier();
  assert.equal(verificationDaplink.etat.autreEncart, true);
  second();
  assert.equal(verificationDaplink.etat.autreEncart, false);
  assert.equal(encartVisible(verificationDaplink.etat, true), true);
});
