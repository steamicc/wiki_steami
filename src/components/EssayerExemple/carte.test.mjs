// Tests de la connexion partagée (carte.mjs), avec un faux DAP.js et un faux WebUSB.
// Lancer : npm run test:js
// Le module est un singleton : chaque test finit carte libérée, comme au départ.
// Un test raté est remis en ordre par afterEach, et chaque test a un délai
// maximal : une promesse qui ne se résout plus (une écriture qui bloque, par
// exemple) fait échouer ce test, nommé, au lieu de bloquer toute la suite.
import { afterEach, test as testNode } from 'node:test';
import assert from 'node:assert/strict';

import { DELAI_LIBERATION_MS, ETAT_INITIAL, PAUSE_LECTURE_MS, carte } from './carte.mjs';
import { ErreurLecteur } from './logique.mjs';

let journal = [];
let pannes = {};
let derniere = null;
// Avancements (de 0 à 1) émis par le faux flash, comme DAP.js après chaque paquet.
let etapesFlash = [];
// Fenêtre de choix de la carte : nombre d'ouvertures, et réponse du lecteur.
let choix = 0;
let choisir = async () => appareil;
// Promesses attendues par le faux flash, la fausse déconnexion, les fausses
// lecture et écriture série (null : tout de suite).
let attenteFlash = null;
let attenteDeconnexion = null;
let attenteLecture = null;
let attenteEcriture = null;
// Réponse du faux DAPLink à la commande vendeur 0x9F.
let reponseVersion = null;
// Écouteurs posés sur navigator.usb (événement « disconnect »).
const ecouteursUsb = {};

const DELAI_TEST_MS = 3000;
const test = (nom, fn) => testNode(nom, { timeout: DELAI_TEST_MS }, fn);

// Résolue après chaque test : débloque ce qu'un test raté a laissé en attente
// (lecture, écriture, flash, déconnexion ou téléchargement retenus).
let nettoyer;
let nettoyage;
function nouveauNettoyage() {
  nettoyage = new Promise((resolve) => {
    nettoyer = resolve;
  });
}
nouveauNettoyage();
const retenue = (promesse) => Promise.race([promesse, nettoyage]);

// Le DAPLink rend au plus 62 octets par lecture série et refuse les écritures
// plus longues.
const PAQUET = 62;

class FauxDAPLink {
  static EVENT_PROGRESS = 'progress';

  constructor(transport) {
    this.transport = transport;
    this.ecouteurs = {};
    // Octets envoyés par le programme de la carte, pas encore lus.
    this.enAttente = [];
    // Octets reçus par la carte (serialWrite).
    this.ecrits = [];
    // Nombre d'appels à serialRead, et commande USB en cours.
    this.lectures = 0;
    this.enCours = null;
    // Commandes lancées pendant qu'une autre était en cours : DAP.js ne les
    // ordonne pas, elles se mélangeraient sur le câble USB.
    this.chevauchements = [];
    derniere = this;
  }

  on(nom, fn) {
    this.ecouteurs[nom] = fn;
  }

  // Le programme de la carte écrit sur le port série.
  emettre(texte) {
    this.emettreOctets(new TextEncoder().encode(texte));
  }

  emettreOctets(octets) {
    this.enAttente.push(...octets);
  }

  async commande(nom, executer) {
    if (this.enCours) this.chevauchements.push(`${nom} pendant ${this.enCours}`);
    this.enCours = nom;
    try {
      return await executer();
    } finally {
      this.enCours = null;
    }
  }

  async connect() {
    journal.push('connect');
  }

  async setSerialBaudrate(bauds) {
    journal.push(`bauds ${bauds}`);
    if (pannes.bauds) throw new Error(pannes.bauds);
  }

  // Comme DAP.js : l'ArrayBuffer brut, ou undefined si rien n'attend. Le
  // journal ne note pas les lectures successives, seulement la première.
  serialRead() {
    this.lectures += 1;
    if (journal.at(-1) !== 'serialRead') journal.push('serialRead');
    return this.commande('serialRead', async () => {
      if (attenteLecture) await retenue(attenteLecture);
      if (pannes.lecture) throw new Error(pannes.lecture);
      if (!this.enAttente.length) return undefined;
      return new Uint8Array(this.enAttente.splice(0, PAQUET)).buffer;
    });
  }

  // DAP.js envoie un octet par caractère (son code).
  serialWrite(chaine) {
    journal.push(`serialWrite ${chaine.length}`);
    return this.commande('serialWrite', async () => {
      if (attenteEcriture) await retenue(attenteEcriture);
      if (pannes.ecriture) throw new Error(pannes.ecriture);
      if (chaine.length > PAQUET) throw new Error('Bad status for 8 -> 255');
      for (const caractere of chaine.split('')) this.ecrits.push(caractere.charCodeAt(0));
    });
  }

  send(code) {
    journal.push(`send 0x${code.toString(16)}`);
    return this.commande('send', async () => {
      if (pannes.send) throw new Error(pannes.send);
      return reponseVersion;
    });
  }

  reset() {
    journal.push('reset');
    return this.commande('reset', async () => {
      if (pannes.reset) throw new Error(pannes.reset);
    });
  }

  avancer(progression) {
    this.ecouteurs[FauxDAPLink.EVENT_PROGRESS]?.(progression);
  }

  flash() {
    journal.push('flash');
    return this.commande('flash', async () => {
      for (const progression of etapesFlash) this.avancer(progression);
      if (attenteFlash) await retenue(attenteFlash);
      if (pannes.flash) throw new Error(pannes.flash);
    });
  }

  // Comptée comme une commande USB : fermer pendant une lecture série en
  // cours est un chevauchement. Sauf carte débranchée : plus de câble où des
  // commandes pourraient se mêler.
  disconnect() {
    journal.push('disconnect');
    const fermer = async () => {
      if (attenteDeconnexion) await retenue(attenteDeconnexion);
    };
    return this.debranchee ? fermer() : this.commande('disconnect', fermer);
  }
}

const appareil = {
  async close() {
    journal.push('close');
  },
};

class FauxWebUSB {
  constructor(device) {
    this.device = device;
  }
}

globalThis.window = { DAPjs: { DAPLink: FauxDAPLink, WebUSB: FauxWebUSB } };
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
  if (derniere?.transport.device === device) derniere.debranchee = true;
  ecouteursUsb.disconnect?.({ device });
}

// Laisse passer les promesses en attente (setImmediate n'est pas simulé).
const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Composants abonnés et pas encore désabonnés : afterEach désabonne ceux
// qu'un test raté a laissés.
const abonnements = new Set();
function abonner(fn) {
  const desabonner = carte.abonner(fn);
  const une = () => {
    if (abonnements.delete(une)) desabonner();
  };
  abonnements.add(une);
  return une;
}

// Après chaque test, remet la connexion singleton à zéro si le test l'a
// laissée prise (échec en route) : carte débranchée, attentes débloquées,
// composants désabonnés. Sans effet après un test réussi.
afterEach(async (t) => {
  if (carte.etat.connectee) debrancher();
  nettoyer();
  await attendre();
  await attendre();
  if (abonnements.size) {
    // La libération planifiée par le dernier désabonnement passe tout de
    // suite : sa minuterie ne doit pas survivre aux minuteries simulées de
    // ce test (le test suivant l'annulerait dans les siennes).
    try {
      t.mock.timers.enable({ apis: ['setTimeout'] });
    } catch {
      // Déjà simulées par le test.
    }
    for (const desabonner of [...abonnements]) desabonner();
    t.mock.timers.tick(DELAI_LIBERATION_MS);
    await attendre();
  }
  nouveauNettoyage();
  attenteFlash = null;
  attenteDeconnexion = null;
  attenteLecture = null;
  attenteEcriture = null;
  pannes = {};
  choisir = async () => appareil;
});

// Abonne un composant et connecte la carte depuis l'exemple « A ».
// Date est simulée aussi : le voyant d'activité série en dépend.
async function demarrer(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  journal = [];
  pannes = {};
  etapesFlash = [];
  attenteFlash = null;
  attenteDeconnexion = null;
  attenteLecture = null;
  attenteEcriture = null;
  reponseVersion = null;
  choix = 0;
  choisir = async () => appareil;
  const desabonner = abonner(() => {});
  await carte.connecter('A');
  // La boucle de lecture série fait sa première lecture, puis sa pause.
  await attendre();
  return desabonner;
}

// La boucle de lecture série attend PAUSE_LECTURE_MS quand rien n'arrive :
// avance le temps d'une pause et laisse la boucle lire ce qui attend.
// La boucle a d'abord le temps de se mettre en pause.
async function lire(t) {
  await attendre();
  t.mock.timers.tick(PAUSE_LECTURE_MS);
  await attendre();
}

// La connexion est fermée ou perdue : sa boucle de lecture ne lit plus, et
// aucune commande USB ne s'est mêlée à une autre.
async function verifierArret(t, connexion = derniere) {
  const lectures = connexion.lectures;
  t.mock.timers.tick(10 * PAUSE_LECTURE_MS);
  await attendre();
  assert.equal(connexion.lectures, lectures, 'la boucle de lecture continue');
  assert.deepEqual(connexion.chevauchements, []);
}

// Le lecteur quitte la page : la carte doit être libérée après le délai.
async function quitter(t, desabonner) {
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  await verifierArret(t);
}

const bin = async () => new ArrayBuffer(8);

// Le journal sans les lectures série, que la boucle fait à chaque pause.
const sansLectures = () => journal.filter((entree) => entree !== 'serialRead');

test('connexion : bauds à 115200 et console lancée', async (t) => {
  const desabonner = await demarrer(t);
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'serialRead']);
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
  const desabonner = abonner(() => {});
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
  const autre = abonner(() => {});
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.equal(carte.etat.connectee, true);
  assert.deepEqual(sansLectures(), []);

  await quitter(t, autre);
  assert.deepEqual(sansLectures(), ['disconnect', 'close']);
});

test('libération : jamais pendant un téléversement', async (t) => {
  const desabonner = await demarrer(t);
  let rendre;
  const enAttente = () =>
    retenue(
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
    );
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
  await lire(t);
  assert.deepEqual(carte.etat.lignes, ['ancien programme']);

  journal = [];
  let finirLecture;
  const televersement = carte.televerser('B', async () => {
    // L'ancien programme écrit encore pendant le téléchargement, et la boucle
    // est en train de lire ces octets quand le téléversement l'arrête.
    ancienne.emettre('pendant le téléchargement\n');
    attenteLecture = new Promise((resolve) => {
      finirLecture = resolve;
    });
    t.mock.timers.tick(PAUSE_LECTURE_MS);
    return new ArrayBuffer(8);
  });
  await attendre();
  // Le flash attend la fin de la lecture en cours.
  assert.deepEqual(journal, ['serialRead']);
  attenteLecture = null;
  finirLecture();
  await televersement;
  assert.deepEqual(journal, ['serialRead', 'flash', 'serialRead']);
  assert.deepEqual(carte.etat.lignes, []);
  assert.equal(carte.etat.programmeActif, 'B');
  assert.equal(carte.etat.dernierClic, 'B');

  ancienne.emettre('nouveau programme\n');
  await lire(t);
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
  assert.equal(journal.at(-1), 'serialRead');
  await quitter(t, desabonner);
});

test('connexion en échec après connect() : la connexion à moitié ouverte est refermée', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  journal = [];
  pannes = { bauds: 'Bad response for 130 -> 0' };
  const desabonner = abonner(() => {});
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
  assert.deepEqual(journal, ['disconnect', 'close']);
  assert.equal(compter('disconnect'), 1);
  assert.equal(compter('close'), 1);
  // Chaque composant repasse à « Connecter la carte », sans console ni erreur.
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  // La console est arrêtée.
  await verifierArret(t);

  // Une deuxième demande ne referme rien.
  await carte.deconnecter();
  assert.equal(compter('close'), 1);

  // Reconnexion : la fenêtre de choix s'ouvre de nouveau.
  journal = [];
  await carte.connecter('B');
  assert.equal(choix, 2);
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'serialRead']);
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.erreur, null);
  await carte.televerser('B', bin);
  assert.equal(carte.etat.programmeActif, 'B');
  await quitter(t, desabonner);
});

test('déconnexion : refusée pendant un téléversement', async (t) => {
  const desabonner = await demarrer(t);
  let rendre;
  carte.televerser('A', () =>
    retenue(
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
    ),
  );
  assert.equal(carte.etat.occupee, true);
  journal = [];
  await carte.deconnecter();
  assert.deepEqual(journal, []);
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.occupee, true);

  rendre();
  await attendre();
  assert.deepEqual(journal, ['flash', 'serialRead']);
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
  const desabonner = abonner(() => {});
  const connexion = carte.connecter('A');
  assert.equal(carte.etat.occupee, true);
  await carte.deconnecter();
  assert.equal(carte.etat.occupee, true);
  assert.equal(carte.etat.dernierClic, 'A');

  choisirCarte();
  await connexion;
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'serialRead']);
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
  assert.deepEqual(journal, ['connect', 'bauds 115200', 'serialRead']);

  t.mock.timers.tick(DELAI_LIBERATION_MS / 2);
  await attendre();
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  assert.equal(compter('close'), 1);
});

// Valeurs successives d'un champ de l'état, sans répétitions consécutives.
function suivre(champ) {
  const vues = [];
  const desabonner = abonner((etat) => {
    if (vues.at(-1) !== etat[champ]) vues.push(etat[champ]);
  });
  return { vues, desabonner };
}

test('progression : suit le flash au pourcentage près, puis revient à null', async (t) => {
  const desabonner = await demarrer(t);
  etapesFlash = [0, 0.004, 0.25, 0.251, 0.999, 1];
  const notifications = [];
  const espion = abonner((etat) => notifications.push(etat.progression));
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
  carte.televerser('A', () =>
    retenue(
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
    ),
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
  const espion = abonner(() => {
    notifications += 1;
  });
  // Vingt paquets en 95 ms, un par lecture (sans fin de ligne : la console
  // ne change pas).
  for (let i = 0; i < 20; i++) {
    connexion.emettre('a');
    await lire(t);
  }
  assert.equal(carte.etat.activite, 1);
  assert.equal(notifications, 1);

  connexion.emettre('b');
  await lire(t);
  assert.equal(carte.etat.activite, 2);
  // Une lecture vide ne compte pas.
  t.mock.timers.tick(200);
  connexion.emettre('');
  await lire(t);
  assert.equal(carte.etat.activite, 2);
  espion();

  // Nouveau programme : le voyant repart de zéro et le premier paquet le
  // signale tout de suite, même moins de 100 ms après le précédent.
  connexion.emettre('c');
  await lire(t);
  assert.equal(carte.etat.activite, 3);
  await carte.televerser('A', bin);
  assert.equal(carte.etat.activite, 0);
  connexion.emettre('d');
  await lire(t);
  assert.equal(carte.etat.activite, 1);
  await quitter(t, desabonner);
});

test('déconnexion : progression et activité remises à zéro, données suivantes ignorées', async (t) => {
  const desabonner = await demarrer(t);
  const connexion = derniere;
  await carte.televerser('A', bin);
  connexion.emettre('x\n');
  await lire(t);
  assert.equal(carte.etat.activite, 1);

  await carte.deconnecter();
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  connexion.emettre('y\n');
  connexion.avancer(0.5);
  await lire(t);
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  await verifierArret(t, connexion);

  // Reconnexion : le premier paquet est signalé sans attendre l'intervalle.
  await carte.connecter('A');
  derniere.emettre('z');
  await lire(t);
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
  await verifierArret(t);
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
  const televersement = carte.televerser('A', () =>
    retenue(
      new Promise((resolve) => {
        rendre = () => resolve(new ArrayBuffer(8));
      }),
    ),
  );
  debrancher();
  assert.equal(carte.etat.connectee, false);
  // Toujours réservée : « Connecter la carte » reste grisé jusqu'à la fin.
  assert.equal(carte.etat.occupee, true);
  journal = [];
  rendre();
  await televersement;
  assert.ok(!journal.includes('flash'), journal.join(', '));
  assert.ok(!journal.includes('serialRead'), journal.join(', '));
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
  assert.deepEqual(journal, ['close', 'connect', 'bauds 115200', 'serialRead']);
  assert.equal(carte.etat.connectee, true);
  await quitter(t, desabonner);
});

// --- Lecture série brute, écriture, firmware, version du DAPLink ------------

const MESSAGE_SANS_CARTE = 'Aucune carte connectée : cliquer sur « Connecter la carte ».';
const MESSAGE_FLASH_EN_COURS = 'Téléversement en cours : attendre la fin, puis réessayer.';

// Concatène des Uint8Array.
const concatener = (morceaux) => Uint8Array.from(morceaux.flatMap((morceau) => [...morceau]));

test('console : octets bruts transmis tels quels aux écouteurs, même un caractère UTF-8 coupé entre deux lectures', async (t) => {
  const desabonner = await demarrer(t);
  const recus = [];
  const arreterEcoute = carte.ecouterSerie((octets) => recus.push(octets));
  // 61 « a » puis « é » (2 octets) : la première lecture (62 octets) coupe le « é ».
  const texte = `${'a'.repeat(61)}é\n`;
  derniere.emettre(texte);
  await lire(t);
  assert.ok(recus.every((octets) => octets instanceof Uint8Array));
  assert.deepEqual(
    recus.map((octets) => octets.length),
    [62, 2],
  );
  assert.equal(recus[0].at(-1), 0xc3);
  assert.deepEqual(concatener(recus), new TextEncoder().encode(texte));
  // La console décode en continu : le « é » coupé arrive entier.
  assert.deepEqual(carte.etat.lignes, [`${'a'.repeat(61)}é`]);

  // Octets non UTF-8 (fenêtre du raw paste) : transmis sans être abîmés.
  derniere.emettreOctets([0x52, 0x01, 0x80, 0x00]);
  await lire(t);
  assert.deepEqual([...recus.at(-1)], [0x52, 0x01, 0x80, 0x00]);

  // Écouteur retiré : plus rien.
  arreterEcoute();
  const avant = recus.length;
  derniere.emettre('encore\n');
  await lire(t);
  assert.equal(recus.length, avant);
  await quitter(t, desabonner);
});

test('console : texte décodé avec les accents, lu de suite tant que des octets arrivent', async (t) => {
  const desabonner = await demarrer(t);
  const lignes = Array.from({ length: 10 }, (_, i) => `Température ${i} : 21,5 °C`);
  derniere.emettre(lignes.map((ligne) => `${ligne}\n`).join(''));
  // Plusieurs lectures de 62 octets, sans pause entre elles.
  await lire(t);
  assert.deepEqual(carte.etat.lignes, lignes);
  assert.equal(derniere.enAttente.length, 0);
  await quitter(t, desabonner);
});

test('console : lecture série en échec, carte perdue avec un message en français', async (t) => {
  const desabonner = await demarrer(t);
  pannes.lecture = 'Bad response for 131 -> 0';
  await lire(t);
  assert.equal(carte.etat.connectee, false);
  assert.match(
    carte.etat.erreur,
    /^La lecture de la console série a échoué : .*\(Bad response for 131 -> 0\)$/,
  );
  await attendre();
  assert.ok(journal.includes('close'), journal.join(', '));
  pannes = {};
  await finir(t, desabonner);
});

test('écriture série : transmise à serialWrite, refusée sans carte', async (t) => {
  // Avant toute connexion.
  await assert.rejects(carte.ecrireSerie(new Uint8Array([0x03])), {
    name: 'ErreurLecteur',
    message: MESSAGE_SANS_CARTE,
  });

  const desabonner = await demarrer(t);
  journal = [];
  // Octets envoyés tels quels, un par caractère pour DAP.js (pas de texte UTF-8).
  const octets = new Uint8Array([0x01, 0xc3, 0xa9, 0x80, 0x0d]);
  await carte.ecrireSerie(octets);
  assert.deepEqual(journal, ['serialWrite 5']);
  assert.deepEqual(derniere.ecrits, [...octets]);

  // Erreur de DAP.js : message en français, la carte reste connectée.
  pannes.ecriture = 'Bad status for 8 -> 255';
  await assert.rejects(carte.ecrireSerie(new Uint8Array([0x41])), (err) => {
    assert.equal(err.name, 'ErreurLecteur');
    assert.match(err.message, /^L'envoi à la carte a échoué : .*\(Bad status for 8 -> 255\)$/);
    return true;
  });
  pannes = {};
  assert.equal(carte.etat.connectee, true);

  // Après la déconnexion : refusée tout de suite.
  await carte.deconnecter();
  await assert.rejects(carte.ecrireSerie(new Uint8Array([0x03])), {
    name: 'ErreurLecteur',
    message: MESSAGE_SANS_CARTE,
  });
  await quitter(t, desabonner);
});

test('écriture série : découpée en paquets de 62 octets au plus', async (t) => {
  const desabonner = await demarrer(t);
  journal = [];
  const octets = Uint8Array.from({ length: 150 }, (_, i) => i);
  await carte.ecrireSerie(octets);
  assert.deepEqual(journal, ['serialWrite 62', 'serialWrite 62', 'serialWrite 26']);
  assert.deepEqual(derniere.ecrits, [...octets]);
  await carte.ecrireSerie(new Uint8Array());
  assert.equal(journal.length, 3);
  await quitter(t, desabonner);
});

test('écriture série : carte débranchée pendant une écriture, rejet sans attendre la fin', async (t) => {
  const desabonner = await demarrer(t);
  // L'écriture ne finit jamais (transfert USB bloqué).
  attenteEcriture = new Promise(() => {});
  const ecriture = carte.ecrireSerie(new Uint8Array([0x41]));
  await attendre();
  assert.ok(journal.includes('serialWrite 1'));
  debrancher();
  await assert.rejects(ecriture, { name: 'ErreurLecteur', message: MESSAGE_DEBRANCHEE });
  attenteEcriture = null;
  await finir(t, desabonner);
});

test('écriture série : refusée pendant un flash, sans attendre sa fin', async (t) => {
  const desabonner = await demarrer(t);
  let finirFlash;
  attenteFlash = new Promise((resolve) => {
    finirFlash = resolve;
  });
  const televersement = carte.televerser('A', bin);
  await attendre();
  assert.ok(journal.includes('flash'));
  await assert.rejects(carte.ecrireSerie(new Uint8Array([0x41])), {
    name: 'ErreurLecteur',
    message: MESSAGE_FLASH_EN_COURS,
  });
  assert.ok(!journal.some((entree) => entree.startsWith('serialWrite')));
  attenteFlash = null;
  finirFlash();
  await televersement;
  await quitter(t, desabonner);
});

test('une commande USB à la fois : une écriture attend la fin de la lecture en cours', async (t) => {
  const desabonner = await demarrer(t);
  let finirLecture;
  attenteLecture = new Promise((resolve) => {
    finirLecture = resolve;
  });
  derniere.emettre('>>> ');
  // La boucle commence une lecture, qui reste en cours.
  t.mock.timers.tick(PAUSE_LECTURE_MS);
  await attendre();
  assert.equal(derniere.enCours, 'serialRead');
  journal = [];
  const ecriture = carte.ecrireSerie(new Uint8Array([0x03]));
  await attendre();
  assert.deepEqual(journal, []);

  attenteLecture = null;
  finirLecture();
  await ecriture;
  assert.ok(journal.includes('serialWrite 1'), journal.join(', '));
  assert.deepEqual(derniere.chevauchements, []);
  await quitter(t, desabonner);
});

// Réponse du DAPLink STeaMi à 0x9F : commande, « STM1 », numéro, date.
function versionSteami(numero, date) {
  const vue = new DataView(new ArrayBuffer(13));
  vue.setUint8(0, 0x9f);
  [...'STM1'].forEach((lettre, i) => vue.setUint8(1 + i, lettre.charCodeAt(0)));
  vue.setUint32(5, numero, true);
  vue.setUint32(9, date, true);
  return vue;
}

test('version DAPLink : aucune lecture série pendant send(0x9f), console qui continue après', async (t) => {
  const desabonner = await demarrer(t);
  reponseVersion = versionSteami(42, 20261120);
  let finirLecture;
  attenteLecture = new Promise((resolve) => {
    finirLecture = resolve;
  });
  t.mock.timers.tick(PAUSE_LECTURE_MS);
  await attendre();
  journal = [];
  const version = carte.lireVersionDaplink();
  await attendre();
  // La commande attend la fin de la lecture en cours.
  assert.deepEqual(journal, []);
  attenteLecture = null;
  finirLecture();
  assert.deepEqual(await version, { numero: 42, date: 20261120 });
  assert.deepEqual(journal, ['send 0x9f']);

  derniere.emettre('après\n');
  await lire(t);
  assert.deepEqual(carte.etat.lignes, ['après']);
  assert.deepEqual(derniere.chevauchements, []);
  await quitter(t, desabonner);
});

test('version DAPLink : null sans carte, sur une erreur, sur une réponse inconnue ou pendant un flash', async (t) => {
  assert.equal(await carte.lireVersionDaplink(), null);
  const desabonner = await demarrer(t);

  pannes.send = 'Bad response for 159 -> 0';
  assert.equal(await carte.lireVersionDaplink(), null);
  pannes = {};
  // DAPLink d'origine (pas STeaMi) : réponse sans « STM1 ».
  reponseVersion = new DataView(new Uint8Array([0x9f, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer);
  assert.equal(await carte.lireVersionDaplink(), null);
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.erreur, null);

  let finirFlash;
  attenteFlash = new Promise((resolve) => {
    finirFlash = resolve;
  });
  const televersement = carte.televerser('A', bin);
  await attendre();
  journal = [];
  assert.equal(await carte.lireVersionDaplink(), null);
  assert.deepEqual(journal, []);
  attenteFlash = null;
  finirFlash();
  await televersement;
  await quitter(t, desabonner);
});

const URL_FIRMWARE = '/micropython/firmware.bin';

// Remplace fetch le temps du test.
function servir(t, reponse) {
  const appels = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    appels.push([url, options]);
    return reponse();
  });
  return appels;
}

test('flash firmware : progression, puis console relancée, pas de reset()', async (t) => {
  const desabonner = await demarrer(t);
  const appels = servir(t, () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) }));
  etapesFlash = [0, 0.5, 1];
  derniere.emettre('ancien programme\n');
  await lire(t);
  journal = [];
  const { vues, desabonner: fin } = suivre('progression');
  assert.equal(await carte.flasherFirmware('M', URL_FIRMWARE), true);
  fin();
  assert.deepEqual(appels, [[URL_FIRMWARE, { cache: 'no-cache' }]]);
  assert.deepEqual(vues, [null, 0, 0.5, 1, null]);
  assert.deepEqual(journal, ['flash', 'serialRead']);
  assert.equal(carte.etat.occupee, false);
  assert.equal(carte.etat.erreur, null);
  assert.equal(carte.etat.dernierClic, 'M');
  assert.equal(carte.etat.programmeActif, 'M');
  assert.deepEqual(carte.etat.lignes, []);

  // La console reprend : la bannière de MicroPython arrive.
  derniere.emettre('MicroPython v1.29\n');
  await lire(t);
  assert.deepEqual(carte.etat.lignes, ['MicroPython v1.29']);
  assert.ok(!journal.includes('reset'));
  await quitter(t, desabonner);
});

test('flash firmware : carte débranchée en cours, erreur en français, non connectée', async (t) => {
  const desabonner = await demarrer(t);
  servir(t, () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) }));
  let rejeter;
  attenteFlash = new Promise((_, reject) => {
    rejeter = reject;
  });
  const flash = carte.flasherFirmware('M', URL_FIRMWARE);
  await attendre();
  assert.ok(journal.includes('flash'));
  debrancher();
  rejeter(new Error('A transfer error has occurred.'));
  assert.equal(await flash, false);
  assert.equal(carte.etat.connectee, false);
  assert.equal(carte.etat.occupee, false);
  assert.equal(carte.etat.progression, null);
  assert.equal(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  attenteFlash = null;
  await finir(t, desabonner);
});

test('flash firmware : téléchargement ou flash en échec, message en français et false', async (t) => {
  const desabonner = await demarrer(t);
  await carte.televerser('A', bin);
  servir(t, () => ({ ok: false, status: 404 }));
  journal = [];
  assert.equal(await carte.flasherFirmware('M', URL_FIRMWARE), false);
  assert.match(carte.etat.erreur, /^Firmware MicroPython introuvable sur le wiki \(erreur 404\)/);
  // Rien n'a été flashé : le programme de A tourne toujours, sa console aussi.
  assert.deepEqual(sansLectures(), []);
  assert.equal(carte.etat.programmeActif, 'A');
  assert.equal(carte.etat.occupee, false);

  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(16),
  }));
  pannes.flash = 'Flash error';
  assert.equal(await carte.flasherFirmware('M', URL_FIRMWARE), false);
  assert.match(carte.etat.erreur, /^Le téléversement a échoué : .*\(Flash error\)$/);
  assert.equal(carte.etat.connectee, true);
  assert.equal(journal.at(-1), 'serialRead');
  // Un flash raté n'est pas retenté.
  assert.equal(compter('flash'), 1);
  pannes = {};
  await quitter(t, desabonner);
});

test('redémarrer : dap.reset(), refusé sans carte', async (t) => {
  await assert.rejects(carte.redemarrer(), { name: 'ErreurLecteur', message: MESSAGE_SANS_CARTE });
  const desabonner = await demarrer(t);
  journal = [];
  await carte.redemarrer();
  assert.deepEqual(journal, ['reset']);
  assert.equal(carte.etat.connectee, true);
  await quitter(t, desabonner);
});

// Retient la prochaine lecture série et la lance : renvoie la fonction qui la
// laisse finir.
async function retenirLecture(t) {
  let finir;
  attenteLecture = new Promise((resolve) => {
    finir = resolve;
  });
  t.mock.timers.tick(PAUSE_LECTURE_MS);
  await attendre();
  assert.equal(derniere.enCours, 'serialRead');
  return () => {
    attenteLecture = null;
    finir();
  };
}

test('déconnexion : attend la fin de la lecture série en cours avant de fermer la carte', async (t) => {
  const desabonner = await demarrer(t);
  const finirLecture = await retenirLecture(t);
  journal = [];
  const deconnexion = carte.deconnecter();
  await attendre();
  // La lecture est encore sur le câble : rien n'est fermé.
  assert.deepEqual(sansLectures(), []);
  finirLecture();
  await deconnexion;
  assert.deepEqual(sansLectures(), ['disconnect', 'close']);
  assert.deepEqual(derniere.chevauchements, []);
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  await verifierArret(t);
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
});

test('libération après le délai : attend la fin de la lecture série en cours avant de fermer la carte', async (t) => {
  const desabonner = await demarrer(t);
  const finirLecture = await retenirLecture(t);
  journal = [];
  desabonner();
  t.mock.timers.tick(DELAI_LIBERATION_MS);
  await attendre();
  assert.deepEqual(sansLectures(), []);
  finirLecture();
  await attendre();
  assert.deepEqual(sansLectures(), ['disconnect', 'close']);
  assert.deepEqual(derniere.chevauchements, []);
  assert.deepEqual(carte.etat, ETAT_INITIAL);
  await verifierArret(t);
});

test('carte débranchée pendant une lecture série : le message habituel remplace celui de la console', async (t) => {
  const desabonner = await demarrer(t);
  await carte.televerser('B', bin);
  // L'erreur de transfert arrive avant l'événement « disconnect » de WebUSB.
  pannes.lecture = 'A transfer error has occurred.';
  derniere.emettre('mesure\n');
  await lire(t);
  assert.equal(carte.etat.connectee, false);
  assert.notEqual(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  // Un autre appareil USB débranché ne compte pas.
  debrancher({});
  assert.notEqual(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  debrancher();
  assert.equal(carte.etat.erreur, MESSAGE_DEBRANCHEE);
  assert.equal(carte.etat.connectee, false);
  assert.equal(carte.etat.dernierClic, 'B');
  pannes = {};
  await finir(t, desabonner);
});

test("carte perdue par la console puis nouvelle connexion : l'ancien appareil débranché ne pose pas d'erreur", async (t) => {
  const desabonner = await demarrer(t);
  pannes.lecture = 'A transfer error has occurred.';
  await lire(t);
  assert.equal(carte.etat.connectee, false);
  pannes = {};
  // Le lecteur reconnecte la carte (nouvel objet USB) : l'événement de
  // l'ancien appareil arrive pendant la fenêtre de choix.
  const nouvelAppareil = {
    async close() {
      journal.push('close');
    },
  };
  let choisirCarte;
  choisir = () =>
    new Promise((resolve) => {
      choisirCarte = () => resolve(nouvelAppareil);
    });
  const connexion = carte.connecter('A');
  assert.equal(carte.etat.connexion, true);
  debrancher();
  assert.equal(carte.etat.erreur, null);
  choisirCarte();
  await connexion;
  await attendre();
  assert.equal(carte.etat.connectee, true);
  assert.equal(carte.etat.erreur, null);
  // Et une fois connectée, toujours rien.
  debrancher();
  assert.equal(carte.etat.erreur, null);
  assert.equal(carte.etat.connectee, true);
  choisir = async () => appareil;
  await quitter(t, desabonner);
});
