import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LecteurLignes,
  decisionFus,
  decisionPile,
  decoderVersion,
  etatFus,
  lirePileEnMarche,
  texteErreurFus,
} from './logique.mjs';

const EPINGLEE = { version: '1.20.0', secteurs: 20 };
const octets = (texte) => new TextEncoder().encode(texte);

describe('decoderVersion', () => {
  it('décode le FUS 1.2.0 relevé sur la carte', () => {
    assert.deepEqual(decoderVersion(0x01020000), { majeur: 1, mineur: 2, sous: 0 });
  });
  it('décode la pile 1.20.0 relevée sur la carte', () => {
    assert.deepEqual(decoderVersion(0x01140002), { majeur: 1, mineur: 20, sous: 0 });
  });
  it('décode 0 en 0.0.0', () => {
    assert.deepEqual(decoderVersion(0), { majeur: 0, mineur: 0, sous: 0 });
  });
});

describe('decisionFus', () => {
  it('juge ancien un FUS 0.x ou 1.1', () => {
    assert.equal(decisionFus({ majeur: 0, mineur: 5, sous: 0 }), 'ancien');
    assert.equal(decisionFus({ majeur: 1, mineur: 1, sous: 0 }), 'ancien');
  });
  it('accepte un FUS 1.2', () => {
    assert.equal(decisionFus({ majeur: 1, mineur: 2, sous: 0 }), 'ok');
  });
  it('juge inconnu un FUS 2.0', () => {
    assert.equal(decisionFus({ majeur: 2, mineur: 0, sous: 0 }), 'inconnu');
  });
});

describe('lirePileEnMarche', () => {
  it('lit la réponse réelle de VERSION', () => {
    const reponse = {
      command: 'Version',
      status: 0,
      fus_version: 0,
      copro_fw_version: '1.20.0',
      ws_version: 118292500,
    };
    assert.deepEqual(lirePileEnMarche(reponse), { version: '1.20.0', secteurs: 20 });
  });
  it('rend version null pour une version vide ou 0.0.0', () => {
    assert.equal(lirePileEnMarche({ copro_fw_version: '', ws_version: 0 }).version, null);
    assert.equal(lirePileEnMarche({ copro_fw_version: '0.0.0', ws_version: 0 }).version, null);
  });
});

describe('decisionPile', () => {
  it('rend absente sans version', () => {
    assert.equal(decisionPile({ version: null, secteurs: 0 }, EPINGLEE), 'absente');
  });
  it('rend a-jour pour la même version et la même taille', () => {
    assert.equal(decisionPile({ version: '1.20.0', secteurs: 20 }, EPINGLEE), 'a-jour');
  });
  it('compare les versions numériquement', () => {
    assert.equal(decisionPile({ version: '1.19.0', secteurs: 20 }, EPINGLEE), 'ancienne');
    assert.equal(decisionPile({ version: '1.21.0', secteurs: 20 }, EPINGLEE), 'plus-recente');
    assert.equal(decisionPile({ version: '1.9.0', secteurs: 20 }, EPINGLEE), 'ancienne');
  });
  it('rend autre pour la même version et une autre taille', () => {
    assert.equal(decisionPile({ version: '1.20.0', secteurs: 25 }, EPINGLEE), 'autre');
  });
});

describe('etatFus', () => {
  it('classe les statuts par plage', () => {
    assert.equal(etatFus(0), 'repos');
    assert.equal(etatFus(0x10), 'pile');
    assert.equal(etatFus(0x1f), 'pile');
    assert.equal(etatFus(0x20), 'fus');
    assert.equal(etatFus(0x30), 'service');
    assert.equal(etatFus(0x3f), 'service');
    assert.equal(etatFus(0x40), 'inconnu');
  });
});

describe('texteErreurFus', () => {
  it('mentionne le manque de place pour le code 4', () => {
    assert.match(texteErreurFus(4), /place/);
  });
  it('donne un texte générique pour un code inconnu', () => {
    assert.match(texteErreurFus(0x99), /0x99/);
  });
  it('a un texte propre pour 0x00 à 0x0A et 0x11', () => {
    for (const code of [...Array(11).keys(), 0x11]) {
      assert.doesNotMatch(texteErreurFus(code), /inconnue/);
    }
  });
  it('fige le sens de chaque code (operator_error_string d EasyFlash)', () => {
    const attendus = {
      0x00: /aucune erreur/i,
      0x01: /introuvable/i,
      0x02: /corrompue/i,
      0x03: /signature/i,
      0x04: /place/i,
      0x05: /interrompue/i,
      0x06: /effacement/i,
      0x07: /écriture/i,
      0x08: /ST\b/,
      0x09: /client/i,
      0x0a: /verrouillée/i,
      0x11: /antérieure/i,
    };
    for (const [code, motif] of Object.entries(attendus)) {
      assert.match(texteErreurFus(Number(code)), motif, `code ${code}`);
    }
  });
  it('donne le texte générique pour une valeur qui n est pas un entier', () => {
    for (const valeur of [undefined, null, 'abc', '4', 1.5, NaN]) {
      assert.match(texteErreurFus(valeur), /inconnue/i);
    }
  });
});

describe('LecteurLignes', () => {
  it('recolle une ligne coupée en deux paquets', () => {
    const lecteur = new LecteurLignes();
    assert.deepEqual(lecteur.ajouter(octets('{"a"')), []);
    assert.deepEqual(lecteur.ajouter(octets(':1}\n')), [{ a: 1 }]);
  });
  it('accepte \\r\\n', () => {
    assert.deepEqual(new LecteurLignes().ajouter(octets('{"a":1}\r\n')), [{ a: 1 }]);
  });
  it('ignore une ligne non JSON', () => {
    assert.deepEqual(new LecteurLignes().ajouter(octets('bonjour\n{"b":2}\n')), [{ b: 2 }]);
  });
  it('rend deux objets pour deux lignes dans un paquet', () => {
    assert.deepEqual(new LecteurLignes().ajouter(octets('{"a":1}\n{"b":2}\n')), [
      { a: 1 },
      { b: 2 },
    ]);
  });
  it('ignore un tableau JSON', () => {
    assert.deepEqual(new LecteurLignes().ajouter(octets('[1,2]\n')), []);
  });
  it('recolle un caractère multi-octets coupé entre deux paquets', () => {
    const lecteur = new LecteurLignes();
    const tout = octets('{"a":"é"}\n');
    assert.deepEqual(lecteur.ajouter(tout.slice(0, 7)), []);
    assert.deepEqual(lecteur.ajouter(tout.slice(7)), [{ a: 'é' }]);
  });
});
