// Tests de la logique pure du composant EssayerExemple.
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ErreurLecteur,
  TamponLignes,
  estEnBas,
  etatWebUSB,
  idValide,
  messageErreur,
  messageFrancais,
  nomFichier,
  peutLiberer,
  telechargerExemple,
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

test('messageFrancais : garde la traduction de messageErreur', () => {
  const err = { name: 'NetworkError', message: 'Unable to claim interface.' };
  assert.equal(messageFrancais(err), messageErreur(err));
});

test('messageFrancais : erreur de DAP.js non traduite, en français avec le message brut', () => {
  assert.equal(
    messageFrancais(new Error('Flash error')),
    'Le téléversement a échoué : débranche et rebranche la carte, puis réessaie. (Flash error)',
  );
  assert.equal(
    messageFrancais(new Error('Transfer response FAULT'), 'televersement'),
    'Le téléversement a échoué : débranche et rebranche la carte, puis réessaie. (Transfer response FAULT)',
  );
  assert.match(
    messageFrancais(new Error('Bad response for 130 -> 0'), 'connexion'),
    /^La connexion à la carte a échoué : débranche .*\(Bad response for 130 -> 0\)$/,
  );
  assert.match(
    messageFrancais(new Error('Wait timed out'), 'console'),
    /^La lecture de la console/,
  );
  assert.match(messageFrancais('texte brut'), /\(texte brut\)$/);
});

test('messageFrancais : une ErreurLecteur passe telle quelle', () => {
  assert.equal(messageFrancais(new ErreurLecteur('Déjà en français.')), 'Déjà en français.');
});

test('telechargerExemple : renvoie le .bin, revalidé auprès du serveur', async () => {
  const appels = [];
  const contenu = new ArrayBuffer(4);
  const recuperer = async (href, options) => {
    appels.push([href, options]);
    return { ok: true, arrayBuffer: async () => contenu };
  };
  assert.equal(await telechargerExemple('/exemples-arduino/A/B.bin', recuperer), contenu);
  assert.deepEqual(appels, [['/exemples-arduino/A/B.bin', { cache: 'no-cache' }]]);
});

test('telechargerExemple : réseau coupé, message en français qui dit quoi faire', async () => {
  const coupe = async () => {
    throw new TypeError('Failed to fetch');
  };
  await assert.rejects(telechargerExemple('/x.bin', coupe), {
    name: 'ErreurLecteur',
    message:
      "Impossible de télécharger l'exemple : vérifie la connexion à Internet, puis réessaie.",
  });
  const coupeEnCours = async () => ({
    ok: true,
    arrayBuffer: async () => {
      throw new TypeError('network error');
    },
  });
  await assert.rejects(telechargerExemple('/x.bin', coupeEnCours), /vérifie la connexion/);
});

test('telechargerExemple : fichier absent', async () => {
  const absent = async () => ({ ok: false, status: 404 });
  await assert.rejects(telechargerExemple('/x.bin', absent), {
    name: 'ErreurLecteur',
    message: /^Exemple introuvable sur le wiki \(erreur 404\) : recharge la page/,
  });
});

test('estEnBas : la console suit seulement si le lecteur est en bas', () => {
  // 100 px visibles sur 500 : en bas quand scrollTop vaut 400, à 4 px près.
  assert.equal(estEnBas({ scrollTop: 400, clientHeight: 100, scrollHeight: 500 }), true);
  assert.equal(estEnBas({ scrollTop: 396, clientHeight: 100, scrollHeight: 500 }), true);
  assert.equal(estEnBas({ scrollTop: 395, clientHeight: 100, scrollHeight: 500 }), false);
  assert.equal(estEnBas({ scrollTop: 0, clientHeight: 100, scrollHeight: 500 }), false);
  // Contenu plus court que la zone visible : toujours en bas.
  assert.equal(estEnBas({ scrollTop: 0, clientHeight: 100, scrollHeight: 60 }), true);
});

test('peutLiberer : seulement sans composant affiché, carte connectée et libre', () => {
  assert.equal(peutLiberer({ abonnes: 0, occupee: false, connectee: true }), true);
  assert.equal(peutLiberer({ abonnes: 1, occupee: false, connectee: true }), false);
  assert.equal(peutLiberer({ abonnes: 0, occupee: true, connectee: true }), false);
  assert.equal(peutLiberer({ abonnes: 0, occupee: false, connectee: false }), false);
});
