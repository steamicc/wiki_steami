// Tests du déroulement du bouton « Vérifier la pile radio », avec une carte et
// un operator simulés : aucun navigateur, aucune carte, aucune vraie attente.
// Lancer : node --test src/components/PileRadio/deroulement.test.mjs
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DELAIS_PILE,
  TEXTE_CONFIRMATION_VERIFICATION,
  TEXTE_FUS_OCCUPE,
  TEXTE_FUS_TRAVAILLE,
  TEXTE_PILE_PEUT_ETRE_EFFACEE,
  TEXTE_SANS_REPONSE,
  creerParcoursPile,
  estOccupee,
  parcoursPile,
} from './deroulement.mjs';
import { texteErreurFus } from './logique.mjs';
import { ErreurDelaiOperateur, ErreurFus } from './operateur.mjs';
import { ErreurLecteur, MESSAGE_SANS_CARTE } from '../EssayerExemple/logique.mjs';

const ID = 'BLE/BleBeacon';
const URLS = {
  operateur: '/pile-radio/operateur.hex',
  installation: '/pile-radio/installation.hex',
  index: '/pile-radio/index.json',
  daplink: '/daplink/firmware.json',
};
const INDEX = { release: 'v1.3', pile: 'BLE HCI Layer', version: '1.20.0', secteurs: 20 };
const DAPLINK_EPINGLE = { release: '2026-11-25.3', numero: 3, date: 20261125 };

// Réponses relevées sur la V1c (conception, Résultats de l'essai préalable).
const VERSION_PILE_EN_MARCHE = {
  command: 'Version',
  status: 0,
  fus_version: 0,
  copro_fw_version: '1.20.0',
  ws_version: 118292500,
};
const VERSION_FUS = {
  command: 'Version',
  status: 0,
  fus_version: 0x01020000,
  copro_fw_version: '1.20.0',
  ws_version: 0x01140002,
};
const STATUS_REPOS = {
  command: 'Status',
  status: 0,
  last_fus_status: 0,
  last_ws_status: 0,
  current_ws: 1,
};
// Sans pile : la réponse vient du FUS, sans version de pile.
const VERSION_SANS_PILE = { ...VERSION_FUS, copro_fw_version: '0.0.0', ws_version: 0 };

// Faux operator : chaque méthode note son nom dans le journal commun et rend
// (ou lève) la réponse suivante de sa file ; une file vide rend sa dernière
// réponse.
function fauxOperateur(journal, files) {
  const suivante = (nom) => {
    const file = files[nom] ?? [];
    const reponse = file.length > 1 ? file.shift() : file[0];
    if (reponse instanceof Error) throw reponse;
    return typeof reponse === 'function' ? reponse() : reponse;
  };
  const creations = [];
  const creer = (liaison) => {
    creations.push(liaison);
    return {
      async version() {
        journal.push('VERSION');
        return suivante('version');
      },
      async statusDouble() {
        journal.push('STATUS');
        return suivante('status');
      },
      async supprimer() {
        journal.push('DELETE');
        return suivante('supprimer') ?? { command: 'Delete', status: 0 };
      },
      async relancer() {
        journal.push('START');
        if (files.relancer) return suivante('relancer');
      },
      async upgrade({ surLigne }) {
        journal.push('UPGRADE');
        const reponse = suivante('upgrade') ?? { command: 'Upgrade', status: 0 };
        surLigne(reponse);
        return reponse;
      },
    };
  };
  creer.creations = creations;
  return creer;
}

// Fausse carte : flasherFirmware note l'url ; `flash(url)` décide de l'issue.
function fausseCarte(journal, { daplink = { numero: 3, date: 20261125 }, flash } = {}) {
  const carte = {
    etat: { connectee: true, occupee: false },
    async flasherFirmware(id, url) {
      journal.push(`flash ${url}`);
      return flash ? flash(url, carte) : true;
    },
    async lireVersionDaplink() {
      journal.push('daplink');
      return daplink;
    },
    ecrireSerie: async () => {},
    ecouterSerie: () => () => {},
  };
  return carte;
}

function fauxRecuperer(donnees = { [URLS.index]: INDEX, [URLS.daplink]: DAPLINK_EPINGLE }) {
  return async (url) => {
    if (!(url in donnees)) return { ok: false, status: 404, json: async () => null };
    return { ok: true, status: 200, json: async () => donnees[url] };
  };
}

// Prépare un parcours et ses dépendances. Les attentes sont notées sans
// dormir : `attentes` garde chaque durée demandée.
function preparer({ operateur = {}, carte: optionsCarte, recuperer, forcer = false } = {}) {
  const journal = [];
  const attentes = [];
  const carte = fausseCarte(journal, optionsCarte);
  const creerOperateur = fauxOperateur(journal, {
    version: [VERSION_PILE_EN_MARCHE, VERSION_FUS],
    status: [STATUS_REPOS],
    ...operateur,
  });
  const parcours = creerParcoursPile();
  const etats = [];
  parcours.abonner((etat) => etats.push(etat));
  const deps = {
    carte,
    urls: URLS,
    recuperer: recuperer ?? fauxRecuperer(),
    attendre: async (ms) => {
      attentes.push(ms);
    },
    creerOperateur,
    forcer,
  };
  return { journal, attentes, carte, creerOperateur, parcours, etats, deps };
}

// Attend que le parcours arrive à l'étape donnée.
function etape(parcours, nom) {
  return new Promise((resoudre) => {
    if (parcours.etat.etape === nom) return resoudre(parcours.etat);
    const retirer = parcours.abonner((etat) => {
      if (etat.etape !== nom) return;
      retirer();
      resoudre(etat);
    });
  });
}

// Lance la vérification et répond « Continuer » à la première confirmation.
async function verifierConfirme(p) {
  const fin = p.parcours.verifier(ID, p.deps);
  await etape(p.parcours, 'confirmation-verification');
  assert.equal(p.parcours.confirmer('continuer'), true);
  return fin;
}

const sansPile = { version: [VERSION_SANS_PILE, VERSION_SANS_PILE] };
const apres = (journal, mot) => journal.slice(journal.indexOf(mot) + 1);

describe('confirmation de la vérification', () => {
  it('rien n est flashé sans « Continuer »', async () => {
    const p = preparer();
    const fin = p.parcours.verifier(ID, p.deps);
    const etat = await etape(p.parcours, 'confirmation-verification');
    assert.equal(etat.id, ID);
    assert.equal(etat.encart.type, 'confirmation-verification');
    assert.equal(etat.encart.donnees.texte, TEXTE_CONFIRMATION_VERIFICATION);
    assert.equal(estOccupee(etat), false);
    assert.deepEqual(p.journal, []);
    p.parcours.annuler();
    assert.deepEqual(await fin, { fin: 'annule' });
    assert.deepEqual(p.journal, []);
    assert.equal(p.parcours.etat.etape, 'repos');
    assert.equal(p.parcours.etat.encart, null);
  });

  it('un autre choix que « Continuer » annule aussi', async () => {
    const p = preparer();
    const fin = p.parcours.verifier(ID, p.deps);
    await etape(p.parcours, 'confirmation-verification');
    p.parcours.confirmer('annuler');
    assert.deepEqual(await fin, { fin: 'annule' });
    assert.deepEqual(p.journal, []);
  });

  it('le texte annonce l effacement de toute la mémoire du programme, pas de la pile', () => {
    assert.match(TEXTE_CONFIRMATION_VERIFICATION, /toute/);
    assert.match(TEXTE_CONFIRMATION_VERIFICATION, /MicroPython et ses fichiers/);
    assert.match(TEXTE_CONFIRMATION_VERIFICATION, /pile radio n'est pas touchée/);
  });

  it('confirmer sans question en attente ne fait rien', () => {
    assert.equal(creerParcoursPile().confirmer('continuer'), false);
  });
});

describe('lectures', () => {
  it('flashe l operator, attend son démarrage, puis VERSION, double STATUS, VERSION', async () => {
    const p = preparer();
    await verifierConfirme(p);
    assert.deepEqual(p.journal, [
      'daplink',
      `flash ${URLS.operateur}`,
      'VERSION',
      'STATUS',
      'VERSION',
      'START',
    ]);
    assert.equal(p.attentes[0], DELAIS_PILE.demarrageOperateur);
    assert.equal(DELAIS_PILE.demarrageOperateur, 2000);
  });

  it('passe DELAIS_PILE à l operator, branché sur la liaison série de la carte', async () => {
    const p = preparer();
    await verifierConfirme(p);
    const [liaison] = p.creerOperateur.creations;
    assert.equal(liaison.ecrire, p.carte.ecrireSerie);
    assert.equal(liaison.ecouter, p.carte.ecouterSerie);
    assert.equal(liaison.delais.apresCommande, 1000);
    assert.equal(liaison.delais.avantUpgrade, 5000);
    assert.equal(liaison.delais.ligneUpgrade, 10000);
  });

  it('pile à jour : START, étape a-jour, rien d installé', async () => {
    const p = preparer();
    assert.deepEqual(await verifierConfirme(p), { fin: 'a-jour' });
    const etat = p.parcours.etat;
    assert.equal(etat.etape, 'a-jour');
    assert.equal(p.journal.at(-1), 'START');
    assert.ok(!p.journal.includes('DELETE'));
    assert.ok(!p.journal.includes(`flash ${URLS.installation}`));
    assert.deepEqual(etat.versions.pile, { version: '1.20.0', secteurs: 20 });
    assert.deepEqual(etat.versions.fus, { majeur: 1, mineur: 2, sous: 0 });
    assert.equal(etat.versions.epinglee.version, '1.20.0');
    assert.match(etat.message, /à jour/);
    assert.match(etat.message, /[Tt]éléverser l'exemple/);
  });

  it('indicateur forcer : la pile à jour donne une proposition', async () => {
    const p = preparer({ forcer: true });
    const fin = verifierConfirme(p);
    const etat = await etape(p.parcours, 'proposition');
    assert.equal(etat.encart.type, 'proposition');
    assert.equal(etat.encart.donnees.decision, 'a-jour');
    p.parcours.annuler();
    await fin;
  });

  it('une pile plus récente est proposée comme telle', async () => {
    const p = preparer({
      operateur: {
        version: [{ ...VERSION_PILE_EN_MARCHE, copro_fw_version: '1.21.0' }, VERSION_FUS],
      },
    });
    const fin = verifierConfirme(p);
    const etat = await etape(p.parcours, 'proposition');
    assert.equal(etat.encart.donnees.decision, 'plus-recente');
    assert.equal(etat.encart.donnees.trouvee, '1.21.0');
    assert.equal(etat.encart.donnees.epinglee, '1.20.0');
    p.parcours.confirmer('annuler');
    await fin;
  });

  it('index.json illisible : erreur, rien n est flashé', async () => {
    const p = preparer({ recuperer: fauxRecuperer({}) });
    assert.deepEqual(await verifierConfirme(p), { fin: 'erreur' });
    assert.equal(p.parcours.etat.etape, 'erreur');
    assert.ok(p.parcours.etat.erreur);
    assert.ok(!p.journal.some((l) => l.startsWith('flash')));
  });

  it('flash de l operator raté : erreur, aucune commande envoyée', async () => {
    const p = preparer({ carte: { flash: () => false } });
    assert.deepEqual(await verifierConfirme(p), { fin: 'erreur' });
    assert.deepEqual(p.journal, ['daplink', `flash ${URLS.operateur}`]);
    assert.ok(p.parcours.etat.erreur);
  });

  it('erreur de liaison série avant tout STATUS : pas de START', async () => {
    const p = preparer({ operateur: { version: [new ErreurDelaiOperateur('VERSION')] } });
    assert.deepEqual(await verifierConfirme(p), { fin: 'erreur' });
    assert.ok(!p.journal.includes('START'));
    assert.ok(!p.journal.includes('STATUS'));
  });
});

describe('FUS', () => {
  it('FUS 1.1 : erreur qui renvoie vers EasyFlash, START, aucun DELETE', async () => {
    const p = preparer({
      operateur: {
        version: [VERSION_SANS_PILE, { ...VERSION_SANS_PILE, fus_version: 0x01010000 }],
      },
    });
    assert.deepEqual(await verifierConfirme(p), { fin: 'fus' });
    const etat = p.parcours.etat;
    assert.equal(etat.etape, 'erreur');
    assert.match(etat.erreur, /EasyFlash/);
    assert.match(etat.erreur, /1\.1\.0/);
    assert.equal(p.journal.at(-1), 'START');
    assert.ok(!p.journal.includes('DELETE'));
    assert.deepEqual(etat.versions.fus, { majeur: 1, mineur: 1, sous: 0 });
  });

  it('FUS 2.0 : même arrêt prudent', async () => {
    const p = preparer({
      operateur: { version: [VERSION_PILE_EN_MARCHE, { ...VERSION_FUS, fus_version: 0x02000000 }] },
    });
    assert.deepEqual(await verifierConfirme(p), { fin: 'fus' });
    assert.match(p.parcours.etat.erreur, /EasyFlash/);
    assert.equal(p.journal.at(-1), 'START');
  });

  it('FUS déjà au travail à la lecture : rien n est proposé', async () => {
    const p = preparer({
      operateur: { ...sansPile, status: [{ ...STATUS_REPOS, status: 0x10 }] },
    });
    assert.deepEqual(await verifierConfirme(p), { fin: 'fus-occupe' });
    assert.equal(p.parcours.etat.etape, 'erreur');
    assert.equal(p.parcours.etat.erreur, TEXTE_FUS_OCCUPE);
    assert.ok(!p.journal.includes('DELETE'));
    assert.ok(!p.journal.includes('START'));
  });
});

describe('fins de parcours avant DELETE', () => {
  it('proposition puis annuler() : START, retour au repos', async () => {
    const p = preparer({ operateur: sansPile });
    const fin = verifierConfirme(p);
    const etat = await etape(p.parcours, 'proposition');
    assert.equal(etat.encart.donnees.decision, 'absente');
    assert.equal(etat.encart.donnees.trouvee, null);
    assert.equal(estOccupee(etat), true);
    p.parcours.annuler();
    assert.deepEqual(await fin, { fin: 'annule' });
    assert.equal(p.journal.at(-1), 'START');
    assert.ok(!p.journal.includes('DELETE'));
    assert.equal(p.parcours.etat.etape, 'repos');
    assert.equal(p.parcours.etat.encart, null);
    assert.match(p.parcours.etat.message, /[Tt]éléverser l'exemple/);
  });

  for (const [nom, daplink] of [
    ['non épinglé', { numero: 2, date: 20261001 }],
    ['illisible (null)', null],
  ]) {
    it(`DAPLink ${nom} : étape daplink sans installation, « Plus tard » revient au repos avec START`, async () => {
      const p = preparer({ operateur: sansPile, carte: { daplink } });
      const fin = verifierConfirme(p);
      const etat = await etape(p.parcours, 'daplink');
      assert.equal(etat.encart.type, 'daplink');
      assert.equal(etat.encart.donnees.release, DAPLINK_EPINGLE.release);
      assert.equal(estOccupee(etat), true);
      p.parcours.confirmer('plus-tard');
      assert.deepEqual(await fin, { fin: 'plus-tard' });
      assert.equal(p.parcours.etat.etape, 'repos');
      assert.equal(p.journal.at(-1), 'START');
      assert.ok(!p.journal.includes('DELETE'));
      assert.ok(!p.journal.includes(`flash ${URLS.installation}`));
    });
  }

  it('DAPLink non épinglé : « installer » n installe rien', async () => {
    const p = preparer({ operateur: sansPile, carte: { daplink: null } });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'daplink');
    p.parcours.confirmer('installer');
    await fin;
    assert.ok(!p.journal.includes('DELETE'));
    assert.equal(p.journal.at(-1), 'START');
  });

  it('DAPLink non épinglé : « mettre-a-jour » relance la pile puis montre la mise à jour guidée', async () => {
    const p = preparer({ operateur: sansPile, carte: { daplink: null } });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'daplink');
    p.parcours.confirmer('mettre-a-jour');
    assert.deepEqual(await fin, { fin: 'daplink' });
    assert.equal(p.journal.at(-1), 'START');
    assert.equal(p.parcours.etat.etape, 'fini');
    assert.deepEqual(p.parcours.etat.daplink, { release: DAPLINK_EPINGLE.release });
  });

  it('daplink/firmware.json illisible : compte comme non épinglé', async () => {
    const p = preparer({ operateur: sansPile, recuperer: fauxRecuperer({ [URLS.index]: INDEX }) });
    const fin = verifierConfirme(p);
    const etat = await etape(p.parcours, 'daplink');
    assert.equal(etat.encart.donnees.release, null);
    p.parcours.confirmer('plus-tard');
    await fin;
    assert.ok(!p.journal.includes('DELETE'));
  });

  it('erreur de liaison série après le double STATUS : START tenté avant l erreur', async () => {
    const p = preparer({
      operateur: {
        version: [VERSION_PILE_EN_MARCHE, new ErreurLecteur(MESSAGE_SANS_CARTE)],
        relancer: [new ErreurLecteur(MESSAGE_SANS_CARTE)],
      },
    });
    const vues = [];
    p.parcours.abonner((etat) => vues.push([etat.etape, p.journal.at(-1)]));
    assert.deepEqual(await verifierConfirme(p), { fin: 'erreur' });
    assert.deepEqual(p.journal.slice(-3), ['STATUS', 'VERSION', 'START']);
    // L'étape erreur n'arrive qu'après START.
    assert.deepEqual(
      vues.find(([nom]) => nom === 'erreur'),
      ['erreur', 'START'],
    );
    assert.ok(p.parcours.etat.erreur);
  });

  it('annuler() pendant une lecture : arrêt à l étape suivante, START', async () => {
    const p = preparer();
    p.deps.creerOperateur = (liaison) => {
      const operateur = fauxOperateur(p.journal, {
        version: [VERSION_PILE_EN_MARCHE, VERSION_FUS],
        status: [
          () => {
            p.parcours.annuler();
            return STATUS_REPOS;
          },
        ],
      })(liaison);
      return operateur;
    };
    assert.deepEqual(await verifierConfirme(p), { fin: 'annule' });
    assert.deepEqual(p.journal.slice(-2), ['STATUS', 'START']);
    assert.equal(p.parcours.etat.etape, 'repos');
  });
});

describe('installation', () => {
  it('pile absente, DAPLink épinglé : DELETE, flash, UPGRADE, 60 s, relecture, START, fini', async () => {
    const p = preparer({
      operateur: {
        version: [VERSION_SANS_PILE, VERSION_SANS_PILE, VERSION_FUS],
      },
    });
    const fin = verifierConfirme(p);
    const etat = await etape(p.parcours, 'proposition');
    assert.equal(etat.encart.donnees.decision, 'absente');
    const decomptes = [];
    p.parcours.abonner((e) => {
      if (e.etape === 'attente') decomptes.push(e.decompte);
    });
    const etapes = [];
    p.parcours.abonner((e) => {
      if (etapes.at(-1) !== e.etape) etapes.push(e.etape);
    });
    const avant = p.journal.length;
    const attentesAvant = p.attentes.length;
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'fini' });
    assert.deepEqual(p.journal.slice(avant), [
      'DELETE',
      'STATUS',
      `flash ${URLS.installation}`,
      'UPGRADE',
      'STATUS',
      'VERSION',
      'START',
    ]);
    // « proposition » d'abord : l'encart se ferme avant la suite.
    assert.deepEqual(etapes, [
      'proposition',
      'suppression',
      'ecriture',
      'upgrade',
      'attente',
      'relecture',
      'fini',
    ]);
    // Décompte visible de 60 à 1, une attente d'une seconde par pas.
    assert.equal(decomptes[0], 60);
    assert.equal(decomptes.at(-1), 1);
    assert.equal(new Set(decomptes).size, 60);
    const attentesApres = p.attentes.slice(attentesAvant);
    assert.equal(attentesApres.filter((ms) => ms === 1000).length, 60);
    const final = p.parcours.etat;
    assert.equal(final.etape, 'fini');
    assert.equal(final.decompte, null);
    assert.equal(final.versions.relue, '1.20.0');
    assert.match(final.message, /1\.20\.0/);
    assert.match(final.message, /[Tt]éléverser l'exemple/);
    assert.equal(estOccupee(final), false);
  });

  it('relecture avec un état 0x10 : relectures toutes les 10 s jusqu à 120 s, puis erreur, sans DELETE', async () => {
    const p = preparer({
      operateur: {
        ...sansPile,
        status: [STATUS_REPOS, STATUS_REPOS, { ...STATUS_REPOS, status: 0x10 }],
      },
    });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'fus-travaille' });
    const releves = apres(p.journal, 'UPGRADE');
    assert.equal(releves.filter((l) => l === 'STATUS').length, 13);
    assert.deepEqual(new Set(releves), new Set(['STATUS']));
    assert.equal(p.journal.filter((l) => l === 'DELETE').length, 1);
    assert.equal(p.attentes.filter((ms) => ms === DELAIS_PILE.pasRelecture).length, 12);
    assert.equal(p.parcours.etat.etape, 'erreur');
    assert.equal(p.parcours.etat.erreur, TEXTE_FUS_TRAVAILLE);
  });

  it('relecture : le FUS finit son travail, la suite reprend', async () => {
    const p = preparer({
      operateur: {
        version: [VERSION_SANS_PILE, VERSION_SANS_PILE, VERSION_FUS],
        status: [STATUS_REPOS, STATUS_REPOS, { ...STATUS_REPOS, status: 0x12 }, STATUS_REPOS],
      },
    });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'fini' });
    assert.deepEqual(apres(p.journal, 'UPGRADE'), ['STATUS', 'STATUS', 'VERSION', 'START']);
  });

  it('ErreurFus(4) pendant l upgrade : message en français avec le texte du code, sans START', async () => {
    const p = preparer({ operateur: { ...sansPile, upgrade: [new ErreurFus(4)] } });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'erreur' });
    assert.equal(p.parcours.etat.etape, 'erreur');
    assert.ok(p.parcours.etat.erreur.includes(texteErreurFus(4)));
    assert.match(p.parcours.etat.erreur, /EasyFlash/);
    assert.deepEqual(apres(p.journal, 'DELETE'), [
      'STATUS',
      `flash ${URLS.installation}`,
      'UPGRADE',
    ]);
  });

  it('carte perdue pendant l écriture : pile peut-être effacée, aucun réessai', async () => {
    const p = preparer({
      operateur: sansPile,
      carte: {
        flash: (url, carte) => {
          if (url !== URLS.installation) return true;
          carte.etat = { ...carte.etat, connectee: false };
          return false;
        },
      },
    });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'erreur' });
    assert.equal(p.parcours.etat.erreur, TEXTE_PILE_PEUT_ETRE_EFFACEE);
    assert.equal(p.journal.filter((l) => l === `flash ${URLS.installation}`).length, 1);
    assert.deepEqual(apres(p.journal, `flash ${URLS.installation}`), []);
  });

  it('carte perdue pendant le décompte : pile peut-être effacée, plus rien n est envoyé', async () => {
    const p = preparer({ operateur: sansPile });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    let vus = 0;
    p.parcours.abonner((e) => {
      if (e.etape === 'attente' && ++vus === 10)
        p.carte.etat = { ...p.carte.etat, connectee: false };
    });
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'erreur' });
    assert.equal(p.parcours.etat.erreur, TEXTE_PILE_PEUT_ETRE_EFFACEE);
    assert.deepEqual(apres(p.journal, 'UPGRADE'), []);
  });

  it('carte perdue pendant la relecture : pile peut-être effacée, sans START', async () => {
    const p = preparer({
      operateur: {
        ...sansPile,
        status: [STATUS_REPOS, STATUS_REPOS, new ErreurLecteur(MESSAGE_SANS_CARTE)],
      },
    });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.abonner((e) => {
      if (e.etape === 'relecture') p.carte.etat = { ...p.carte.etat, connectee: false };
    });
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'erreur' });
    assert.equal(p.parcours.etat.erreur, TEXTE_PILE_PEUT_ETRE_EFFACEE);
    assert.ok(!apres(p.journal, 'DELETE').includes('START'));
  });

  it('operator muet après l installation : le dire sans conclure à un échec', async () => {
    const p = preparer({
      operateur: {
        ...sansPile,
        status: [STATUS_REPOS, STATUS_REPOS, new ErreurDelaiOperateur('STATUS')],
      },
    });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'sans-reponse' });
    assert.equal(p.parcours.etat.etape, 'fini');
    assert.equal(p.parcours.etat.erreur, null);
    assert.equal(p.parcours.etat.message, TEXTE_SANS_REPONSE);
    assert.ok(!apres(p.journal, 'DELETE').includes('START'));
  });

  it('annuler() après DELETE est sans effet : l installation va à son terme', async () => {
    const p = preparer({
      operateur: { version: [VERSION_SANS_PILE, VERSION_SANS_PILE, VERSION_FUS] },
    });
    const fin = verifierConfirme(p);
    await etape(p.parcours, 'proposition');
    p.parcours.abonner((e) => {
      if (e.etape === 'ecriture') assert.equal(p.parcours.annuler(), false);
    });
    p.parcours.confirmer('installer');
    assert.deepEqual(await fin, { fin: 'fini' });
  });
});

describe('occupation', () => {
  it('pendant le parcours, estOccupee est vrai et une seconde vérification est refusée', async () => {
    const p = preparer({ operateur: sansPile });
    const fin = verifierConfirme(p);
    const etat = await etape(p.parcours, 'proposition');
    assert.equal(estOccupee(etat), true);
    const flashs = p.journal.filter((l) => l.startsWith('flash')).length;
    assert.deepEqual(await p.parcours.verifier('BLE/Autre', p.deps), { fin: 'occupe' });
    assert.equal(p.journal.filter((l) => l.startsWith('flash')).length, flashs);
    assert.equal(p.parcours.etat.id, ID);
    p.parcours.annuler();
    await fin;
    // Le parcours fini, une nouvelle vérification est possible.
    const encore = p.parcours.verifier(ID, p.deps);
    await etape(p.parcours, 'confirmation-verification');
    p.parcours.annuler();
    assert.deepEqual(await encore, { fin: 'annule' });
  });

  it('une seconde vérification est refusée pendant la confirmation', async () => {
    const p = preparer();
    const fin = p.parcours.verifier(ID, p.deps);
    await etape(p.parcours, 'confirmation-verification');
    assert.deepEqual(await p.parcours.verifier('BLE/Autre', p.deps), { fin: 'occupe' });
    p.parcours.annuler();
    await fin;
  });

  it('refusée aussi quand la carte est occupée ou absente', async () => {
    const p = preparer();
    p.carte.etat = { connectee: true, occupee: true };
    assert.deepEqual(await p.parcours.verifier(ID, p.deps), { fin: 'occupe' });
    p.carte.etat = { connectee: false, occupee: false };
    assert.deepEqual(await p.parcours.verifier(ID, p.deps), { fin: 'deconnectee' });
    assert.equal(p.parcours.etat.etape, 'repos');
  });

  it('estOccupee : de operateur à relecture, hors confirmation et fins', () => {
    const occupees = [
      'operateur',
      'lecture',
      'proposition',
      'daplink',
      'suppression',
      'ecriture',
      'upgrade',
      'attente',
      'relecture',
    ];
    for (const nom of occupees) assert.equal(estOccupee({ etape: nom }), true, nom);
    for (const nom of ['repos', 'confirmation-verification', 'a-jour', 'fini', 'erreur']) {
      assert.equal(estOccupee({ etape: nom }), false, nom);
    }
  });

  it('un parcours unique par page', () => {
    assert.equal(typeof parcoursPile.verifier, 'function');
    assert.equal(parcoursPile.etat.etape, 'repos');
  });

  it('DELAIS_PILE', () => {
    assert.deepEqual(DELAIS_PILE, {
      apresCommande: 1000,
      avantUpgrade: 5000,
      ligneUpgrade: 10000,
      attenteApresUpgrade: 60000,
      relectureMax: 120000,
      pasRelecture: 10000,
      demarrageOperateur: 2000,
    });
  });
});
