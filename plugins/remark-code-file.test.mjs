// Tests du plugin remark d'import de fichiers (en-tête des croquis du sample).
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { stripSampleHeader } = require('./remark-code-file.js');

const ENTETE = '// Croquis de la page du wiki « Capteurs et écran (docs/x.md) ».\n\n';
const SAMPLE = '.external/arduino-steami-sample/examples/ECRAN/A/A.ino';

test("retire l'en-tête des croquis du sample", () => {
  assert.equal(stripSampleHeader(`${ENTETE}void setup() {}\n`, SAMPLE), 'void setup() {}\n');
});

test('garde un croquis sans en-tête', () => {
  assert.equal(stripSampleHeader('void setup() {}\n', SAMPLE), 'void setup() {}\n');
});

test('ne touche pas aux fichiers des autres dépôts', () => {
  const autre = '.external/arduino-steami-lib/examples/A/A.ino';
  assert.equal(stripSampleHeader(`${ENTETE}x\n`, autre), `${ENTETE}x\n`);
});
