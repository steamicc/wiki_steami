// Tests de la logique pure du composant EssayerExemple.
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TamponLignes,
  etatWebUSB,
  idValide,
  messageErreur,
  nomFichier,
  urlBin,
} from './logique.mjs';

test('TamponLignes : ne renvoie que les lignes complètes', () => {
  const t = new TamponLignes();
  assert.deepEqual(t.ajouter('a\nb'), ['a']);
  assert.deepEqual(t.ajouter('c\n'), ['bc']);
  assert.deepEqual(t.lignes, ['a', 'bc']);
});

test('TamponLignes : retire les lignes les plus anciennes au-delà de 2000', () => {
  const t = new TamponLignes();
  for (let i = 0; i < 2005; i++) t.ajouter(`ligne ${i}\n`);
  assert.equal(t.lignes.length, 2000);
  assert.equal(t.lignes[0], 'ligne 5');
  assert.equal(t.lignes[1999], 'ligne 2004');
});

test('TamponLignes : vider remet le tampon à zéro', () => {
  const t = new TamponLignes();
  t.ajouter('a\nb');
  t.vider();
  assert.deepEqual(t.lignes, []);
  assert.deepEqual(t.ajouter('c\n'), ['c']);
});

test('etatWebUSB', () => {
  assert.equal(etatWebUSB({}, true), 'absent');
  assert.equal(etatWebUSB({ usb: {} }, false), 'iframe');
  assert.equal(etatWebUSB({ usb: {} }, true), 'ok');
});

test('messageErreur : messages de Chrome', () => {
  assert.match(
    messageErreur({ name: 'NotFoundError', message: 'No device selected.' }),
    /Aucune carte choisie/,
  );
  assert.match(
    messageErreur({ name: 'NotFoundError', message: 'The device was disconnected.' }),
    /débranchée/,
  );
  assert.match(
    messageErreur({ name: 'SecurityError', message: 'Access denied.' }),
    /accès à la carte refusé/,
  );
  assert.match(
    messageErreur({ name: 'SecurityError', message: 'Failed ... permissions policy ... usb' }),
    /ouvrir la page dans un onglet/,
  );
  assert.match(
    messageErreur({ name: 'NetworkError', message: 'Unable to claim interface.' }),
    /utilisée par un autre onglet/,
  );
});

test('messageErreur : carte débranchée pendant un transfert', () => {
  const message =
    "Failed to execute 'controlTransferOut' on 'USBDevice': A transfer error has occurred.";
  for (const name of ['Error', 'NetworkError']) {
    const texte = messageErreur({ name, message });
    assert.ok(texte.includes('débranchée'), texte);
    assert.ok(!texte.includes('Failed to execute'), texte);
  }
});

test('messageErreur : erreur inconnue', () => {
  assert.match(messageErreur({ name: 'Autre', message: 'quelque chose' }), /quelque chose/);
});

test('urlBin et nomFichier', () => {
  assert.equal(
    urlBin('VL53L1X/GestureDetection'),
    '/exemples-arduino/VL53L1X/GestureDetection.bin',
  );
  assert.equal(nomFichier('VL53L1X/GestureDetection'), 'GestureDetection.bin');
  assert.equal(urlBin('APDS9960/ambient_light'), '/exemples-arduino/APDS9960/ambient_light.bin');
  assert.equal(nomFichier('APDS9960/ambient_light'), 'ambient_light.bin');
});

test('idValide', () => {
  assert.equal(idValide('VL53L1X/GestureDetection'), true);
  assert.equal(idValide('APDS9960/ambient_light'), true);
  assert.equal(idValide('../x'), false);
  assert.equal(idValide('VL53L1X'), false);
  assert.equal(idValide('a/b/c'), false);
});
