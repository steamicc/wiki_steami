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
// Avancements (de 0 à 1) émis par le faux flash, comme DAP.js après chaque paquet.
let etapesFlash = [];
// Fenêtre de choix de la carte : nombre d'ouvertures, et réponse du lecteur.
let choix = 0;
let choisir = async () => appareil;
// Promesses attendues par le faux flash et la fausse déconnexion (null : tout de suite).
let attenteFlash = null;
let attenteDeconnexion = null;
// Écouteurs posés sur navigator.usb (événement « disconnect »).
const ecouteursUsb = {};

class FauxDAPLink {
  static EVENT_SERIAL_DATA = 'serial';
  static EVENT_PROGRESS = 'progress';

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

  avancer(progression) {
    this.ecouteurs[FauxDAPLink.EVENT_PROGRESS]?.(progression);
  }

  async flash() {
    journal.push('flash');
    for (const progression of etapesFlash) this.avancer(progression);
    if (attenteFlash) await attenteFlash;
    if (pannes.flash) throw new Error(pannes.flash);
  }

  async disconnect() {
    journal.push('disconnect');
    if (attenteDeconnexion) await attenteDeconnexion;
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
      requestDevice: () => {
        choix += 1;
        return choisir();
      },
      addEventListener(nom, fn) {
        ecouteursUsb[nom] = fn;
      },
    },
  },
});

// La carte est débranchée : WebUSB émet « disconnect » pour cet appareil.
function debrancher(device = appareil) {
  ecouteursUsb.disconnect?.({ device });
}

// Laisse passer les promesses en attente (setImmediate n'est pas simulé).
const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Abonne un composant et connecte la carte depuis l'exemple « A ».
// Date est simulée aussi : le voyant d'activité série en dépend.
async function demarrer(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  journal = [];
  pannes = {};
  etapesFlash = [];
  attenteFlash = null;
  attenteDeconnexion = null;
  choix = 0;
  choisir = async () => appareil;
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

test("connexion : état « connexion » pendant la fenêtre de choix, jusqu'à la carte connectée", async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  journal = [];
  pannes = {};
  let choisirCarte;
  choisir = () =>
    new Promise((resolve) => {
      choisirCarte = () => resolve(appareil);
    });
  const { vues, desabonner } = suivre('connexion');
  const connexion = carte.connecter('A');
  assert.equal(carte.etat.connexion, true);
  assert.equal(carte.etat.connectee, false);
  choisirCarte();
  await connexion;
  assert.equal(carte.etat.connexion, false);
  assert.equal(carte.etat.connectee, true);
  assert.deepEqual(vues, [true, false]);
  choisir = async () => appareil;
  await quitter(t, desabonner);
});

test('connexion : fenêtre de choix fermée sans carte, état « connexion » retiré', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  journal = [];
  pannes = {};
  choisir = async () => {
    const err = new Error('No device selected.');
    err.name = 'NotFoundError';
    throw err;
  };
  const desabonner = carte.abonner(() => {});
  await carte.connecter('A');
  assert.equal(carte.etat.connexion, false);
  assert.equal(carte.etat.occupee, false);
  assert.equal(carte.etat.erreur, 'Aucune carte choisie.');
  assert.deepEqual(journal, []);
  choisir = async () => appareil;
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
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
    "Le téléversement a échoué : débrancher le câble USB et, s'il y en a une, la batterie, attendre quelques secondes, puis rebrancher et réessayer. (Flash error)",
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
  assert.equal(carte.etat.connexion, false);
  assert.equal(carte.etat.dernierClic, 'C');
  assert.match(carte.etat.erreur, /^La connexion à la carte a échoué : .*\(Bad response/);
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
});

// Compte les appels de chaque méthode dans le journal.
const compter = (nom) => journal.filter((entree) => entree === nom).length;

test('déconnexion : libère la carte tout de suite, sans erreur restante, puis reconnexion possible', async (t) => {
  const desabonner = await demarrer(t);
  pannes.flash = 'Flash error';
  await carte.televerser('A', bin);
  assert.ok(carte.etat.erreur);
  pannes = {};
  journal = [];

  await carte.deconnecter();
  assert.deepEqual(journal, ['stopSerialRead', 'disconnect', 'close']);
  assert.equal(compter('disconnect'), 1);
  assert.equal(compter('close'), 1);
  // Chaque composant repasse à « Connecter la carte », sans console ni erreur.
  assert.deepEqual(carte.etat, ETAT_INITIAL);

  // Une deuxième demande ne referme rien.
  await carte.deconnecter();
  assert.equal(compter('close'), 1);

  // Reconnexion : la fenêtre de choix s'ouvre de nouveau.
  journal = [];
  await carte.connecter('B');
  assert.equal(choix, 2);
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'startSerialRead']);
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.erreur, null);
  await carte.televerser('B', bin);
  assert.equal(carte.etat.programmeActif, 'B');
  await quitter(t, desabonner);
});

test('déconnexion : refusée pendant un téléversement', async (t) => {
  const desabonner = await demarrer(t);
  let rendre;
  carte.televerser(
    'A',
    () =>
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
  );
  assert.equal(carte.etat.occupee, true);
  journal = [];
  await carte.deconnecter();
  assert.deepEqual(journal, []);
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.occupee, true);

  rendre();
  await attendre();
  assert.deepEqual(journal, ['stopSerialRead', 'flash', 'startSerialRead']);
  assert.equal(carte.etat.programmeActif, 'A');
  assert.equal(carte.etat.occupee, false);

  // Une fois le téléversement fini, la déconnexion passe.
  await carte.deconnecter();
  assert.equal(compter('disconnect'), 1);
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
});

test('déconnexion : sans effet pendant une connexion', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  journal = [];
  pannes = {};
  let choisirCarte;
  choisir = () =>
    new Promise((resolve) => {
      choisirCarte = () => resolve(appareil);
    });
  const desabonner = carte.abonner(() => {});
  const connexion = carte.connecter('A');
  assert.equal(carte.etat.occupee, true);
  await carte.deconnecter();
  assert.equal(carte.etat.occupee, true);
  assert.equal(carte.etat.dernierClic, 'A');

  choisirCarte();
  await connexion;
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'startSerialRead']);
  assert.equal(carte.etat.connectee, true);
  choisir = async () => appareil;
  await quitter(t, desabonner);
});

test('déconnexion : annule la libération prévue', async (t) => {
  const desabonner = await demarrer(t);
  // Le lecteur quitte la page : libération prévue dans DELAI_LIBERATION_MS.
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS / 2);
  await carte.deconnecter();
  assert.deepEqual(carte.etat, ETAT_INITIAL);

  // Nouvelle connexion sans composant : sa libération part de maintenant.
  // Si l'ancienne minuterie restait, elle libérerait la carte trop tôt.
  journal = [];
  await carte.connecter('A');
  assert.equal(carte.etat.connectee, true);
  t.mock.timers.tick(DELAI_LIBERATION_MS / 2);
  await attendre();
  assert.equal(carte.etat.connectee, true);
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'startSerialRead']);

  t.mock.timers.tick(DELAI_LIBERATION_MS / 2);
  await attendre();
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  assert.equal(compter('close'), 1);
});

// Valeurs successives d'un champ de l'état, sans répétitions consécutives.
function suivre(champ) {
  const vues = [];
  const desabonner = carte.abonner((etat) => {
    if (vues.at(-1) !== etat[champ]) vues.push(etat[champ]);
  });
  return { vues, desabonner };
}

test('progression : suit le flash au pourcentage près, puis revient à null', async (t) => {
  const desabonner = await demarrer(t);
  etapesFlash = [0, 0.004, 0.25, 0.251, 0.999, 1];
  const notifications = [];
  const espion = carte.abonner((etat) => notifications.push(etat.progression));
  const { vues, desabonner: fin } = suivre('progression');
  await carte.televerser('A', bin);
  espion();
  fin();
  // 0,004 et 0,251 ne changent pas le pourcentage affiché : pas de mise à jour.
  assert.deepEqual(vues, [null, 0, 0.25, 0.999, 1, null]);
  assert.ok(!notifications.includes(0.004));
  assert.ok(!notifications.includes(0.251));
  assert.equal(carte.etat.progression, null);
  assert.equal(carte.etat.programmeActif, 'A');

  // Hors téléversement, une progression émise est ignorée.
  derniere.avancer(0.5);
  assert.equal(carte.etat.progression, null);
  await quitter(t, desabonner);
});

test('progression : remise à null après un échec du flash', async (t) => {
  const desabonner = await demarrer(t);
  etapesFlash = [0.3];
  pannes.flash = 'Flash error';
  const { vues, desabonner: fin } = suivre('progression');
  await carte.televerser('A', bin);
  fin();
  assert.deepEqual(vues, [null, 0, 0.3, null]);
  assert.equal(carte.etat.progression, null);
  assert.ok(carte.etat.erreur);
  await quitter(t, desabonner);
});

test('progression : rien pendant le téléchargement du .bin', async (t) => {
  const desabonner = await demarrer(t);
  let rendre;
  carte.televerser(
    'A',
    () =>
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
  );
  assert.equal(carte.etat.occupee, true);
  assert.equal(carte.etat.progression, null);
  derniere.avancer(0.5);
  assert.equal(carte.etat.progression, null);
  rendre();
  await attendre();
  assert.equal(carte.etat.progression, null);
  await quitter(t, desabonner);
});

test('activité série : au plus un signal par intervalle, remise à zéro au téléversement', async (t) => {
  const desabonner = await demarrer(t);
  const connexion = derniere;
  assert.equal(carte.etat.activite, 0);

  let notifications = 0;
  const espion = carte.abonner(() => {
    notifications += 1;
  });
  // Vingt paquets en 95 ms (sans fin de ligne : la console ne change pas).
  connexion.emettre('a');
  for (let i = 0; i < 19; i++) {
    t.mock.timers.tick(5);
    connexion.emettre('a');
  }
  assert.equal(carte.etat.activite, 1);
  assert.equal(notifications, 1);

  t.mock.timers.tick(5);
  connexion.emettre('b');
  assert.equal(carte.etat.activite, 2);
  // Un paquet vide ne compte pas.
  t.mock.timers.tick(200);
  connexion.emettre('');
  assert.equal(carte.etat.activite, 2);
  espion();

  // Nouveau programme : le voyant repart de zéro et le premier paquet le
  // signale tout de suite, même moins de 100 ms après le précédent.
  connexion.emettre('c');
  assert.equal(carte.etat.activite, 3);
  await carte.televerser('A', bin);
  assert.equal(carte.etat.activite, 0);
  connexion.emettre('d');
  assert.equal(carte.etat.activite, 1);
  await quitter(t, desabonner);
});

test('déconnexion : progression et activité remises à zéro, données suivantes ignorées', async (t) => {
  const desabonner = await demarrer(t);
  const connexion = derniere;
  await carte.televerser('A', bin);
  connexion.emettre('x\n');
  await attendre();
  assert.equal(carte.etat.activite, 1);

  await carte.deconnecter();
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  connexion.emettre('y\n');
  connexion.avancer(0.5);
  await attendre();
  assert.deepEqual(carte.etat, ETAT_INITIAL);

  // Reconnexion : le premier paquet est signalé sans attendre l'intervalle.
  await carte.connecter('A');
  derniere.emettre('z');
  assert.equal(carte.etat.activite, 1);
  await quitter(t, desabonner);
});

const MESSAGE_DEBRANCHEE =
  'La carte a été débranchée : la rebrancher, puis cliquer sur « Connecter la carte ».';

// Fin d'un test où la carte a été perdue : rien à libérer, l'erreur reste affichée.
async function finir(t, desabonner) {
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
}

test('carte débranchée au repos : message sous le dernier exemple cliqué, connexion refermée', async (t) => {
  const desabonner = await demarrer(t);
  await carte.televerser('B', bin);
  journal = [];
  // Un autre appareil USB débranché ne compte pas.
  debrancher({});
  assert.equal(carte.etat.connectee, true);

  debrancher();
  assert.equal(carte.etat.connectee, false);
  assert.equal(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  assert.equal(carte.etat.dernierClic, 'B');
  assert.equal(carte.etat.activite, 0);
  await attendre();
  assert.deepEqual(journal, ['disconnect', 'close']);

  // Rebranchée : la reconnexion repart de zéro, sans l'erreur.
  journal = [];
  await carte.connecter('A');
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.erreur, null);
  await quitter(t, desabonner);
});

test('carte débranchée pendant le téléchargement du .bin : rien téléversé, message gardé', async (t) => {
  const desabonner = await demarrer(t);
  let rendre;
  const televersement = carte.televerser(
    'A',
    () =>
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
  );
  debrancher();
  assert.equal(carte.etat.connectee, false);
  // Toujours réservée : « Connecter la carte » reste grisé jusqu'à la fin.
  assert.equal(carte.etat.occupee, true);
  journal = [];
  rendre();
  await televersement;
  assert.ok(!journal.includes('flash'), journal.join(', '));
  assert.ok(!journal.includes('startSerialRead'), journal.join(', '));
  assert.equal(carte.etat.occupee, false);
  assert.equal(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  await finir(t, desabonner);
});

test("carte débranchée pendant le flash : l'échec du flash n'écrase pas le message", async (t) => {
  const desabonner = await demarrer(t);
  let rejeter;
  attenteFlash = new Promise((_, reject) => {
    rejeter = reject;
  });
  const televersement = carte.televerser('A', bin);
  await attendre();
  assert.ok(journal.includes('flash'));
  debrancher();
  assert.equal(carte.etat.connectee, false);
  assert.equal(carte.etat.occupee, true);
  assert.equal(carte.etat.erreur, MESSAGE_DEBRANCHEE);

  rejeter(new Error('A transfer error has occurred.'));
  await televersement;
  assert.equal(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  assert.equal(carte.etat.occupee, false);
  assert.equal(carte.etat.progression, null);
  assert.equal(carte.etat.programmeActif, null);
  await finir(t, desabonner);
});

test("reconnexion après une carte perdue : attend la fermeture de l'ancienne connexion", async (t) => {
  const desabonner = await demarrer(t);
  let finirDeconnexion;
  attenteDeconnexion = new Promise((resolve) => {
    finirDeconnexion = resolve;
  });
  debrancher();
  journal = [];
  const reconnexion = carte.connecter('A');
  await attendre();
  // L'ancienne connexion n'est pas encore fermée : pas de nouvelle ouverture.
  assert.ok(!journal.includes('connect'), journal.join(', '));
  attenteDeconnexion = null;
  finirDeconnexion();
  await reconnexion;
  assert.deepEqual(journal, ['close', 'connect', 'bauds 115200', 'startSerialRead']);
  assert.equal(carte.etat.connectee, true);
  await quitter(t, desabonner);
});
