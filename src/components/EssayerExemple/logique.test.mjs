// Tests de la logique pure du composant EssayerExemple.
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONSEIL_REINITIALISATION,
  ErreurLecteur,
  INTERVALLE_ACTIVITE_MS,
  LIBELLES_STATUT,
  TEXTE_PREPARATION,
  TamponLignes,
  activiteASignaler,
  affichageProgression,
  estEnBas,
  etatWebUSB,
  idValide,
  messageErreur,
  messageFrancais,
  nomFichier,
  peutDeconnecter,
  peutLiberer,
  pourcentage,
  progressionChangee,
  statutCarte,
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
    "Le téléversement a échoué : débrancher le câble USB et, s'il y en a une, la batterie, attendre quelques secondes, puis rebrancher et réessayer. (Flash error)",
  );
  assert.equal(
    messageFrancais(new Error('Transfer response FAULT'), 'televersement'),
    `Le téléversement a échoué : ${CONSEIL_REINITIALISATION} (Transfer response FAULT)`,
  );
  assert.equal(
    messageFrancais(new Error('Bad response for 8 -> 17'), 'connexion'),
    `La connexion à la carte a échoué : ${CONSEIL_REINITIALISATION} (Bad response for 8 -> 17)`,
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
      "Impossible de télécharger l'exemple : vérifier la connexion à Internet, puis réessayer.",
  });
  const coupeEnCours = async () => ({
    ok: true,
    arrayBuffer: async () => {
      throw new TypeError('network error');
    },
  });
  await assert.rejects(telechargerExemple('/x.bin', coupeEnCours), /vérifier la connexion/);
});

test('telechargerExemple : fichier absent', async () => {
  const absent = async () => ({ ok: false, status: 404 });
  await assert.rejects(telechargerExemple('/x.bin', absent), {
    name: 'ErreurLecteur',
    message: /^Exemple introuvable sur le wiki \(erreur 404\) : recharger la page/,
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

test('peutDeconnecter : seulement carte connectée et libre', () => {
  assert.equal(peutDeconnecter({ occupee: false, connectee: true }), true);
  assert.equal(peutDeconnecter({ occupee: true, connectee: true }), false);
  assert.equal(peutDeconnecter({ occupee: false, connectee: false }), false);
  assert.equal(peutDeconnecter({ occupee: true, connectee: false }), false);
});

test("statutCarte : déconnectée tant que la carte n'est pas connectée", () => {
  assert.equal(
    statutCarte({ connectee: false, occupee: false, programmeActif: null }, 'A'),
    'deconnectee',
  );
  // Carte perdue pendant le téléchargement du .bin : réservée, mais pas en connexion.
  assert.equal(
    statutCarte({ connectee: false, occupee: true, programmeActif: null }, 'A'),
    'deconnectee',
  );
  // Carte perdue alors qu'un programme tournait.
  assert.equal(
    statutCarte({ connectee: false, occupee: false, programmeActif: 'A' }, 'A'),
    'deconnectee',
  );
});

test('statutCarte : connexion sous chaque exemple pendant une tentative de connexion', () => {
  const etat = { connexion: true, connectee: false, occupee: true, programmeActif: null };
  assert.equal(statutCarte(etat, 'A'), 'connexion');
  assert.equal(statutCarte(etat, 'B'), 'connexion');
  // DAP.js vient de se connecter, la console démarre : toujours en connexion.
  assert.equal(statutCarte({ ...etat, connectee: true }, 'A'), 'connexion');
  assert.equal(statutCarte({ ...etat, connexion: false, occupee: false }, 'A'), 'deconnectee');
});

test('statutCarte : téléversement sous chaque exemple tant que la carte est réservée', () => {
  const etat = { connectee: true, occupee: true, programmeActif: 'A' };
  assert.equal(statutCarte(etat, 'A'), 'televersement');
  assert.equal(statutCarte(etat, 'B'), 'televersement');
});

test("statutCarte : programme en cours sous l'exemple actif seulement", () => {
  const etat = { connectee: true, occupee: false, programmeActif: 'A' };
  assert.equal(statutCarte(etat, 'A'), 'programme');
  assert.equal(statutCarte(etat, 'B'), 'connectee');
  assert.equal(statutCarte({ ...etat, programmeActif: null }, 'A'), 'connectee');
});

test('statutCarte : chaque statut a un libellé', () => {
  for (const statut of ['connexion', 'deconnectee', 'connectee', 'televersement', 'programme']) {
    assert.ok(LIBELLES_STATUT[statut], statut);
  }
  assert.equal(LIBELLES_STATUT.connexion, 'connexion…');
  assert.equal(LIBELLES_STATUT.programme, 'programme en cours');
});

test('pourcentage : entier arrondi vers le bas, borné, null sans téléversement', () => {
  assert.equal(pourcentage(null), null);
  assert.equal(pourcentage(undefined), null);
  assert.equal(pourcentage(0), 0);
  assert.equal(pourcentage(0.426), 42);
  assert.equal(pourcentage(0.999), 99);
  assert.equal(pourcentage(1), 100);
  assert.equal(pourcentage(1.5), 100);
  assert.equal(pourcentage(-0.1), 0);
  assert.equal(pourcentage(Number.NaN), 0);
});

test('affichageProgression : préparation indéterminée tant que la progression est nulle', () => {
  const preparation = { valeur: null, texte: 'Préparation de la carte…' };
  assert.equal(TEXTE_PREPARATION, 'Préparation de la carte…');
  assert.deepEqual(affichageProgression(null), preparation);
  assert.deepEqual(affichageProgression(undefined), preparation);
  assert.deepEqual(affichageProgression(0), preparation);
  // Moins de 1 % : le pourcentage affiché serait encore 0.
  assert.deepEqual(affichageProgression(0.004), preparation);
});

test('affichageProgression : pourcentage avec espace insécable dès la première progression', () => {
  assert.deepEqual(affichageProgression(0.05), { valeur: 5, texte: '5\u00a0%' });
  assert.deepEqual(affichageProgression(0.5), { valeur: 50, texte: '50\u00a0%' });
  assert.deepEqual(affichageProgression(1), { valeur: 100, texte: '100\u00a0%' });
});

test('progressionChangee : seulement quand le pourcentage affiché change', () => {
  assert.equal(progressionChangee(null, 0), true);
  assert.equal(progressionChangee(0, 0.004), false);
  assert.equal(progressionChangee(0.004, 0.01), true);
  assert.equal(progressionChangee(0.99, 1), true);
  assert.equal(progressionChangee(1, null), true);
  assert.equal(progressionChangee(null, null), false);
});

test('activiteASignaler : au plus un signal par intervalle', () => {
  assert.equal(INTERVALLE_ACTIVITE_MS, 100);
  assert.equal(activiteASignaler(5000, null), true);
  assert.equal(activiteASignaler(5050, 5000), false);
  assert.equal(activiteASignaler(5099, 5000), false);
  assert.equal(activiteASignaler(5100, 5000), true);
  assert.equal(activiteASignaler(30, 0, 20), true);
  // Horloge qui recule : on signale plutôt que de laisser le voyant éteint.
  assert.equal(activiteASignaler(1000, 5000), true);
});
