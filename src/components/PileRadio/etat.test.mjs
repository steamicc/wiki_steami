// Tests du module léger de la pile radio (etat.mjs) : ce que les blocs
// EssayerExemple et EssayerMicroPython lisent de la vérification sans
// charger PileRadio, et le relais qui les branche sur le parcours une fois
// PileRadio chargé (exemples BLE seulement).
// Lancer : node --test src/components/PileRadio/etat.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  ETAT_INITIAL_PILE,
  controlesOccupes,
  creerRelaisPile,
  erreurCarteVisible,
  estOccupee,
  operateurSurCarte,
  pileRadioVisible,
  relaisPile,
} from './etat.mjs';
import * as deroulement from './deroulement.mjs';
import * as affichage from './affichage.mjs';

const lire = (chemin) => readFileSync(new URL(chemin, import.meta.url), 'utf8');

// Parcours et suivi simulés : même interface d'abonnement que
// creerParcoursPile et creerSuiviOperateur.
function observable(initial, autres = {}) {
  let valeur = initial;
  const abonnes = new Set();
  return {
    get valeur() {
      return valeur;
    },
    poser(v) {
      valeur = v;
      for (const fn of [...abonnes]) fn(v);
    },
    abonner(fn) {
      abonnes.add(fn);
      return () => abonnes.delete(fn);
    },
    abonnes,
    ...autres,
  };
}

function fauxParcours() {
  const appels = [];
  const o = observable(ETAT_INITIAL_PILE, {
    oublierErreur() {
      appels.push('oublierErreur');
      return true;
    },
  });
  Object.defineProperty(o, 'etat', { get: () => o.valeur });
  o.appels = appels;
  return o;
}

function fauxSuivi() {
  const o = observable(null, {
    oublier() {
      o.poser(null);
    },
  });
  Object.defineProperty(o, 'id', { get: () => o.valeur });
  return o;
}

describe('module léger etat.mjs', () => {
  it('n importe rien : aucun effet de bord, rien de PileRadio chargé', () => {
    assert.doesNotMatch(lire('./etat.mjs'), /^\s*import\s/m);
  });

  it('deroulement.mjs et affichage.mjs réexportent les mêmes fonctions', () => {
    assert.equal(deroulement.ETAT_INITIAL_PILE, ETAT_INITIAL_PILE);
    assert.equal(deroulement.estOccupee, estOccupee);
    for (const nom of [
      'controlesOccupes',
      'erreurCarteVisible',
      'operateurSurCarte',
      'pileRadioVisible',
    ]) {
      assert.equal(
        affichage[nom],
        { controlesOccupes, erreurCarteVisible, operateurSurCarte, pileRadioVisible }[nom],
        nom,
      );
    }
  });

  it('EssayerExemple et EssayerMicroPython n importent statiquement de PileRadio que etat.mjs', () => {
    for (const chemin of [
      '../EssayerExemple/index.js',
      '../EssayerExemple/carte.mjs',
      '../EssayerExemple/logique.mjs',
      '../EssayerMicroPython/index.js',
      '../EssayerMicroPython/deroulement.mjs',
    ]) {
      const source = lire(chemin);
      const statiques = [...source.matchAll(/^import[^;]*?from\s+'([^']+)'/gms)].map((m) => m[1]);
      for (const cible of statiques.filter((c) => c.includes('PileRadio'))) {
        assert.equal(cible, '../PileRadio/etat.mjs', `${chemin} importe ${cible}`);
      }
    }
  });

  it('EssayerExemple charge PileRadio par un import dynamique', () => {
    assert.match(lire('../EssayerExemple/index.js'), /import\(\s*'\.\.\/PileRadio'\s*\)/);
  });

  // Seul branchement du relais : sans lui, les blocs liraient toujours l'état
  // initial et Téléverser redeviendrait cliquable pendant l'installation.
  it('PileRadio/index.js branche le parcours et le suivi sur relaisPile à son chargement', () => {
    const source = lire('./index.js');
    assert.match(source, /^relaisPile\.brancher\(parcoursPile, suiviOperateur\);$/m);
    assert.match(source, /^import \{[^}]*\brelaisPile\b[^}]*\} from '\.\/etat\.mjs';$/m);
    assert.match(source, /^import \{[^}]*\bparcoursPile\b[^}]*\} from '\.\/deroulement\.mjs';$/m);
    assert.match(source, /^export const suiviOperateur = /m);
  });
});

describe('relais de la pile radio', () => {
  it('non branché : état initial, aucun operator, oublis sans effet', () => {
    const relais = creerRelaisPile();
    assert.equal(relais.etat, ETAT_INITIAL_PILE);
    assert.equal(relais.idOperateur, null);
    assert.equal(relais.oublierErreur(), false);
    relais.oublierOperateur();
    assert.equal(estOccupee(relais.etat), false);
  });

  it('branché : lit le parcours et le suivi, et prévient ses abonnés', () => {
    const relais = creerRelaisPile();
    const vus = [];
    const retirer = relais.abonner(() => vus.push([relais.etat.etape, relais.idOperateur]));
    const parcours = fauxParcours();
    const suivi = fauxSuivi();
    relais.brancher(parcours, suivi);
    assert.deepEqual(vus, [['repos', null]]);
    parcours.poser({ ...ETAT_INITIAL_PILE, etape: 'lecture', id: 'BLE/X' });
    suivi.poser('BLE/X');
    assert.deepEqual(vus.slice(1), [
      ['lecture', null],
      ['lecture', 'BLE/X'],
    ]);
    assert.equal(estOccupee(relais.etat), true);
    retirer();
    parcours.poser(ETAT_INITIAL_PILE);
    assert.equal(vus.length, 3);
  });

  it('branché : oublierErreur et oublierOperateur passent au parcours et au suivi', () => {
    const relais = creerRelaisPile();
    const parcours = fauxParcours();
    const suivi = fauxSuivi();
    relais.brancher(parcours, suivi);
    suivi.poser('BLE/X');
    assert.equal(relais.oublierErreur(), true);
    assert.deepEqual(parcours.appels, ['oublierErreur']);
    relais.oublierOperateur();
    assert.equal(relais.idOperateur, null);
  });

  it('un second branchement est ignoré (un parcours par page)', () => {
    const relais = creerRelaisPile();
    const premier = fauxParcours();
    relais.brancher(premier, fauxSuivi());
    const second = fauxParcours();
    relais.brancher(second, fauxSuivi());
    second.poser({ ...ETAT_INITIAL_PILE, etape: 'lecture' });
    assert.equal(relais.etat.etape, 'repos');
    assert.equal(second.abonnes.size, 0);
  });

  it('un relais unique par page', () => {
    assert.equal(typeof relaisPile.brancher, 'function');
  });
});

describe('fonctions déplacées dans etat.mjs', () => {
  it('pileRadioVisible : ids BLE/… seulement', () => {
    assert.equal(pileRadioVisible('BLE/BleBeacon'), true);
    assert.equal(pileRadioVisible('VL53L1X/GestureDetection'), false);
    assert.equal(pileRadioVisible(undefined), false);
  });

  it('controlesOccupes : carte occupée ou parcours occupé', () => {
    const libre = { connectee: true, occupee: false };
    assert.equal(controlesOccupes(libre, ETAT_INITIAL_PILE), false);
    assert.equal(controlesOccupes({ ...libre, occupee: true }, ETAT_INITIAL_PILE), true);
    assert.equal(controlesOccupes(libre, { ...ETAT_INITIAL_PILE, etape: 'upgrade' }), true);
  });
});
