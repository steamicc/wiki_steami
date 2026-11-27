// Tests des décisions pures du bouton « Essayer sur la carte » (MicroPython).
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXTE_CARTE_OCCUPEE,
  TEXTE_EFFACEMENT,
  comparerVersions,
  decisionFirmware,
  decisionMiseAJour,
  diagnosticSansInvite,
  lireFirmwareEpingle,
  lireVersionSteami,
  texteInstallation,
  texteMiseAJourDaplink,
} from './logique.mjs';

const EPINGLEE = 'v0.29.0';

test('decisionFirmware : absent sans MicroPython', () => {
  assert.equal(decisionFirmware({ micropython: false, version: null }, EPINGLEE), 'absent');
});

test('decisionFirmware : ancien sans version (pas de steami.version)', () => {
  assert.equal(decisionFirmware({ micropython: true, version: null }, EPINGLEE), 'ancien');
});

test('decisionFirmware : dev jamais mis à jour', () => {
  assert.equal(decisionFirmware({ micropython: true, version: 'dev' }, EPINGLEE), 'dev');
});

test('decisionFirmware : plus ancien, égal, plus récent', () => {
  assert.equal(decisionFirmware({ micropython: true, version: 'v0.28.9' }, EPINGLEE), 'ancien');
  assert.equal(decisionFirmware({ micropython: true, version: 'v0.29.0' }, EPINGLEE), 'a-jour');
  assert.equal(decisionFirmware({ micropython: true, version: 'v0.30.1' }, EPINGLEE), 'a-jour');
});

test('comparerVersions : comparaison numérique', () => {
  assert.equal(comparerVersions('v0.28.10', 'v0.28.9'), 1);
  assert.equal(comparerVersions('v0.28.9', 'v0.28.10'), -1);
  assert.equal(comparerVersions('v1.0.0', 'v1.0.0'), 0);
  assert.equal(comparerVersions('v1.0.0', 'v0.99.99'), 1);
});

function vue(octets) {
  return new DataView(Uint8Array.from(octets).buffer);
}
const STM1 = [0x53, 0x54, 0x4d, 0x31];

test('lireVersionSteami : lit le numéro et la date (little-endian)', () => {
  const r = new DataView(new ArrayBuffer(64));
  r.setUint8(0, 0x9f);
  STM1.forEach((o, i) => r.setUint8(1 + i, o));
  r.setUint32(5, 3, true);
  r.setUint32(9, 20261125, true);
  assert.deepEqual(lireVersionSteami(r), { numero: 3, date: 20261125 });
});

test('lireVersionSteami : null si trop court, sans marque ou absent', () => {
  assert.equal(lireVersionSteami(null), null);
  assert.equal(lireVersionSteami(vue([0x9f])), null);
  assert.equal(lireVersionSteami(vue(new Array(64).fill(0))), null);
});

test('lireFirmwareEpingle : accepte le JSON du wiki, refuse le reste', () => {
  const json = { release: '2026-11-25.3', numero: 3, date: 20261125, taille: 1, sha256: 'x' };
  assert.deepEqual(lireFirmwareEpingle(json), {
    release: '2026-11-25.3',
    numero: 3,
    date: 20261125,
  });
  assert.equal(lireFirmwareEpingle(null), null);
  assert.equal(lireFirmwareEpingle({}), null);
  assert.equal(lireFirmwareEpingle({ release: 'x', numero: 0, date: 20261125 }), null);
  assert.equal(lireFirmwareEpingle({ release: 'x', numero: '3', date: 20261125 }), null);
  assert.equal(lireFirmwareEpingle({ release: 'x', numero: 3, date: 1125 }), null);
});

test('decisionMiseAJour : date puis numéro, 0 dev, illisible ancien', () => {
  const epingle = { release: '2026-11-25.3', numero: 3, date: 20261125 };
  assert.equal(decisionMiseAJour(null, epingle), 'ancien');
  assert.equal(decisionMiseAJour({ numero: 0, date: 0 }, epingle), 'dev');
  assert.equal(decisionMiseAJour({ numero: 2, date: 20261125 }, epingle), 'ancien');
  assert.equal(decisionMiseAJour({ numero: 3, date: 20261125 }, epingle), 'a-jour');
  assert.equal(decisionMiseAJour({ numero: 4, date: 20261125 }, epingle), 'a-jour');
  assert.equal(decisionMiseAJour({ numero: 90, date: 20261001 }, epingle), 'ancien');
  assert.equal(decisionMiseAJour({ numero: 1, date: 20261201 }, epingle), 'a-jour');
});

test('diagnosticSansInvite : bannière vue → occupee, sinon absent', () => {
  assert.equal(diagnosticSansInvite({ banniereVue: true }), 'occupee');
  assert.equal(diagnosticSansInvite({ banniereVue: false }), 'absent');
});

test('textes : contiennent la version, la release et les consignes', () => {
  assert.match(texteInstallation('v0.29.0'), /MicroPython v0\.29\.0/);
  assert.match(TEXTE_EFFACEMENT, /effac/i);
  assert.match(TEXTE_CARTE_OCCUPEE, /Thonny/);
  assert.match(TEXTE_CARTE_OCCUPEE, /RESET/);
  assert.match(texteMiseAJourDaplink('2026-11-25.3'), /DAPLink.*2026-11-25\.3/);
});
