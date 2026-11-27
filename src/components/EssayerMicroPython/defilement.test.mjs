// Tests du suivi du défilement de la page pendant une question (encart).
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';

import { suivreDefilement } from './defilement.mjs';

// Page simulée : position verticale, que le focus fait défiler.
function page(position = 0) {
  const p = { position };
  p.lire = () => p.position;
  return p;
}

test('question fermée sans défilement de la personne : retour à la position d’avant le focus', () => {
  const p = page(100);
  const suivi = suivreDefilement(p.lire);
  suivi.ouvrir(() => {
    p.position = 400;
  });
  // Événement « scroll » du focus lui-même, reçu après coup.
  suivi.surDefilement();
  assert.equal(suivi.fermer(), 100);
});

test('la personne a fait défiler la page pendant la question : position gardée', () => {
  const p = page(100);
  const suivi = suivreDefilement(p.lire);
  suivi.ouvrir(() => {
    p.position = 400;
  });
  p.position = 650;
  suivi.surDefilement();
  assert.equal(suivi.fermer(), null);
});

test('défilement de la personne puis retour au même endroit : position gardée', () => {
  const p = page(100);
  const suivi = suivreDefilement(p.lire);
  suivi.ouvrir(() => {
    p.position = 400;
  });
  p.position = 300;
  suivi.surDefilement();
  p.position = 400;
  suivi.surDefilement();
  assert.equal(suivi.fermer(), null);
});

test('le focus n’a pas fait défiler la page : rien à restaurer', () => {
  const p = page(100);
  const suivi = suivreDefilement(p.lire);
  suivi.ouvrir(() => {});
  assert.equal(suivi.fermer(), null);
});

test('écart d’un pixel (position fractionnaire) : pas compté comme un défilement', () => {
  const p = page(100);
  const suivi = suivreDefilement(p.lire);
  suivi.ouvrir(() => {
    p.position = 400;
  });
  p.position = 400.5;
  suivi.surDefilement();
  assert.equal(suivi.fermer(), 100);
});

test('le focus est toujours donné, et fermer sans ouvrir ne restaure rien', () => {
  const p = page(0);
  const suivi = suivreDefilement(p.lire);
  assert.equal(suivi.fermer(), null);
  let focalise = false;
  suivi.ouvrir(() => {
    focalise = true;
  });
  assert.equal(focalise, true);
  // Une seconde fermeture ne restaure plus rien.
  suivi.fermer();
  assert.equal(suivi.fermer(), null);
});

test('défilement avant l’ouverture ou après la fermeture : sans effet', () => {
  const p = page(100);
  const suivi = suivreDefilement(p.lire);
  p.position = 120;
  suivi.surDefilement();
  suivi.ouvrir(() => {
    p.position = 400;
  });
  assert.equal(suivi.fermer(), 120);
  p.position = 900;
  suivi.surDefilement();
  suivi.ouvrir(() => {
    p.position = 1200;
  });
  assert.equal(suivi.fermer(), 900);
});
