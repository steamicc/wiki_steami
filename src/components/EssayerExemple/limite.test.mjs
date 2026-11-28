// Tests de la limite d'erreur du chargement à la demande (limite.mjs) : le
// bouton « Vérifier la pile radio » qui ne se charge pas ne doit pas
// emporter l'exemple. Pas de rendu React dans node --test (pas de DOM, et
// les limites d'erreur ne servent pas au rendu serveur) : la classe est
// appelée comme React le fait, et la source d'index.js est relue.
// Lancer : node --test src/components/EssayerExemple/limite.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import React from 'react';

import { LimiteChargement } from './limite.mjs';
import { TEXTE_PILE_INDISPONIBLE } from '../PileRadio/etat.mjs';

const lire = (chemin) => readFileSync(new URL(chemin, import.meta.url), 'utf8');

function limite(props) {
  const instance = new LimiteChargement(props);
  instance.props = props;
  return instance;
}

describe('LimiteChargement', () => {
  it('est une limite d erreur React (getDerivedStateFromError)', () => {
    assert.ok(LimiteChargement.prototype instanceof React.Component);
    assert.equal(typeof LimiteChargement.getDerivedStateFromError, 'function');
  });

  it('sans erreur : rend ses enfants tels quels', () => {
    const enfant = React.createElement('span', null, 'bouton');
    const instance = limite({ message: 'échec', className: 'erreur', children: enfant });
    assert.deepEqual(instance.state, { echec: false });
    assert.equal(instance.render(), enfant);
  });

  it('import rejeté ou rendu en erreur : un paragraphe avec le message', () => {
    const erreur = new TypeError('Failed to fetch dynamically imported module');
    const instance = limite({
      message: TEXTE_PILE_INDISPONIBLE,
      className: 'erreur',
      children: React.createElement('span', null, 'bouton'),
    });
    instance.state = { ...instance.state, ...LimiteChargement.getDerivedStateFromError(erreur) };
    const rendu = instance.render();
    assert.equal(rendu.type, 'p');
    assert.equal(rendu.props.className, 'erreur');
    assert.equal(rendu.props.children, TEXTE_PILE_INDISPONIBLE);
  });

  it('message court, au ton neutre, qui dit quoi faire', () => {
    assert.match(TEXTE_PILE_INDISPONIBLE, /Vérifier la pile radio/);
    assert.match(TEXTE_PILE_INDISPONIBLE, /Recharger la page/);
    assert.doesNotMatch(TEXTE_PILE_INDISPONIBLE, /\b(tu|vous|ton|votre)\b/i);
    assert.ok(TEXTE_PILE_INDISPONIBLE.length <= 120);
  });
});

describe('EssayerExemple et le chargement de PileRadio', () => {
  // Sans la limite autour du Suspense, un import raté remonte jusqu'à
  // Docusaurus, qui affiche son écran d'erreur à la place de la page.
  it('le Suspense de PileRadio est dans LimiteChargement, avec le message du bouton', () => {
    const source = lire('./index.js');
    assert.match(
      source,
      /<LimiteChargement message=\{TEXTE_PILE_INDISPONIBLE\}[^>]*>\s*<Suspense fallback=\{null\}>\s*<PileRadio id=\{id\} \/>\s*<\/Suspense>\s*<\/LimiteChargement>/,
    );
    assert.match(source, /^import \{ LimiteChargement \} from '\.\/limite\.mjs';$/m);
  });
});
