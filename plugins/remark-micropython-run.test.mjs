// Tests du plugin remark des blocs MicroPython exécutables.
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { compile } from '@mdx-js/mdx';

const require = createRequire(import.meta.url);
const remarkCodeFile = require('./remark-code-file.js');
const remarkMicropythonRun = require('./remark-micropython-run.js');
const { modulesImportes, modulesNonGeles } = remarkMicropythonRun;

const LIB = '.external/micropython-steami-lib/lib';

// Petite copie de la bibliothèque : hts221 et gc9a01 non gelés (gc9a01 n'a que
// son .not-frozen, comme au tag v0.29.0), ism330dl et wsen-pads gelés.
function creerRacine() {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'remark-mpy-'));
  const ecrire = (relatif, contenu) => {
    const absolu = path.join(racine, relatif);
    fs.mkdirSync(path.dirname(absolu), { recursive: true });
    fs.writeFileSync(absolu, contenu);
  };
  ecrire(`${LIB}/hts221/.not-frozen`, 'Not frozen.\n');
  ecrire(`${LIB}/hts221/manifest.py`, 'package("hts221")\n');
  ecrire(`${LIB}/hts221/hts221/__init__.py`, '');
  ecrire(`${LIB}/hts221/examples/humidity.py`, 'from hts221 import HTS221\nprint(1)\n');
  ecrire(`${LIB}/gc9a01/.not-frozen`, 'Not frozen.\n');
  ecrire(`${LIB}/ism330dl/ism330dl/__init__.py`, '');
  ecrire(
    `${LIB}/ism330dl/examples/basic_read.py`,
    '"""Lit l\'accéléromètre.\nfrom hts221 import HTS221\n"""\n' +
      '# import hts221\nfrom machine import I2C\nfrom ism330dl import ISM330DL\nprint("hts221")\n',
  );
  ecrire(`${LIB}/wsen-pads/wsen_pads/__init__.py`, '');
  ecrire(
    `${LIB}/wsen-pads/examples/station_env.py`,
    'from wsen_pads import (\n    WSEN_PADS,\n)\nfrom hts221 import (\n    HTS221,\n)\n',
  );
  ecrire(`${LIB}/wsen-pads/examples/ecran_rond.py`, 'import gc9a01.device as d\n');
  ecrire('.external/samples/pins.py', 'LED = 1\n');
  ecrire('.external/samples/mesh.py', 'MESH = "é"\n');
  return racine;
}

function page(racine, ...blocs) {
  return {
    tree: { type: 'root', children: blocs.map((b) => ({ type: 'code', ...b })) },
    file: { cwd: racine, path: path.join(racine, 'docs/software/essai.md') },
  };
}

function transformer({ tree, file }) {
  remarkCodeFile()(tree, file);
  remarkMicropythonRun()(tree, file);
  return tree.children;
}

function attributs(noeud) {
  return Object.fromEntries(noeud.attributes.map((a) => [a.name, a.value]));
}

test('bloc run → composant ajouté juste après le bloc, qui reste affiché', () => {
  const racine = creerRacine();
  const enfants = transformer(page(racine, { lang: 'python', meta: 'run', value: 'print(1)' }));
  assert.equal(enfants.length, 2);
  assert.equal(enfants[0].type, 'code');
  assert.equal(enfants[0].value, 'print(1)');
  assert.equal(enfants[1].type, 'mdxJsxFlowElement');
  assert.equal(enfants[1].name, 'EssayerMicroPython');
  assert.ok(enfants[1].attributes.every((a) => a.type === 'mdxJsxAttribute'));
  assert.deepEqual(attributs(enfants[1]), { id: 'software/essai.md#1', code: 'print(1)' });
});

test('les marques du plugin sont retirées du meta, le reste est gardé', () => {
  const racine = creerRacine();
  const enfants = transformer(
    page(racine, { lang: 'python', meta: 'title="run.py" run {1}', value: 'print(1)' }),
  );
  assert.equal(enfants[0].meta, 'title="run.py" {1}');
  assert.equal(enfants.length, 2);
});

test('bloc sans marque → rien', () => {
  const racine = creerRacine();
  const enfants = transformer(
    page(
      racine,
      { lang: 'python', meta: null, value: 'print(1)' },
      { lang: 'python', meta: 'title="run"', value: 'print(1)' },
      { lang: 'bash', meta: 'run', value: 'ls' },
    ),
  );
  assert.equal(enfants.length, 3);
  assert.ok(enfants.every((n) => n.type === 'code'));
});

test('exemple de la lib gelé → bouton, imports cités dans un commentaire ou une chaîne ignorés', () => {
  const racine = creerRacine();
  const enfants = transformer(
    page(racine, {
      lang: 'python',
      meta: `file=${LIB}/ism330dl/examples/basic_read.py`,
      value: '',
    }),
  );
  assert.equal(enfants.length, 2);
  assert.match(attributs(enfants[1]).code, /from ism330dl import ISM330DL/);
});

test('exemple de la lib qui importe hts221 → rien (import simple ou entre parenthèses)', () => {
  const racine = creerRacine();
  const enfants = transformer(
    page(
      racine,
      { lang: 'python', meta: `file=${LIB}/hts221/examples/humidity.py`, value: '' },
      { lang: 'python', meta: `file=${LIB}/wsen-pads/examples/station_env.py`, value: '' },
      { lang: 'python', meta: `file=${LIB}/wsen-pads/examples/ecran_rond.py`, value: '' },
    ),
  );
  assert.equal(enfants.length, 3);
  assert.ok(enfants.every((n) => n.type === 'code'));
});

test('norun l’emporte sur run et sur un exemple gelé', () => {
  const racine = creerRacine();
  const enfants = transformer(
    page(
      racine,
      { lang: 'python', meta: 'run norun', value: 'print(1)' },
      { lang: 'python', meta: `norun file=${LIB}/ism330dl/examples/basic_read.py`, value: '' },
    ),
  );
  assert.equal(enfants.length, 2);
  assert.ok(enfants.every((n) => n.type === 'code'));
});

test('confirm et files transmis ; id = page#rang du bloc', () => {
  const racine = creerRacine();
  const enfants = transformer(
    page(
      racine,
      { lang: 'bash', meta: null, value: 'ls' },
      {
        lang: 'python',
        meta: 'run confirm="Efface la flash externe, données comprises" files=.external/samples/pins.py,.external/samples/mesh.py',
        value: 'import pins',
      },
    ),
  );
  assert.equal(enfants.length, 3);
  const a = attributs(enfants[2]);
  assert.equal(a.id, 'software/essai.md#2');
  assert.equal(a.confirmation, 'Efface la flash externe, données comprises');
  assert.deepEqual(JSON.parse(a.fichiers), [
    { nom: 'pins.py', contenu: 'LED = 1\n' },
    { nom: 'mesh.py', contenu: 'MESH = "é"\n' },
  ]);
  assert.equal(enfants[1].meta, undefined);
});

test('files : chemin hors de .external, absolu, remontant ou absent → erreur', () => {
  const racine = creerRacine();
  for (const files of [
    'docs/x.py',
    '/etc/passwd',
    '.external/../secret.py',
    '.external/absent.py',
  ]) {
    assert.throws(
      () => transformer(page(racine, { lang: 'python', meta: `run files=${files}`, value: 'x' })),
      /remark-micropython-run/,
      files,
    );
  }
});

test('files : deux fichiers de même nom → erreur', () => {
  const racine = creerRacine();
  fs.mkdirSync(path.join(racine, '.external/autre'), { recursive: true });
  fs.writeFileSync(path.join(racine, '.external/autre/pins.py'), '');
  assert.throws(
    () =>
      transformer(
        page(racine, {
          lang: 'python',
          meta: 'run files=.external/samples/pins.py,.external/autre/pins.py',
          value: 'x',
        }),
      ),
    /pins\.py/,
  );
});

test('modulesImportes : formes d’import reconnues', () => {
  const code = [
    'import a',
    'import b.c as d, e',
    'from f import g',
    'from h.i import (',
    '    j,',
    '    k,',
    ')',
    'from . import relatif',
    'from \\',
    '    l import m',
    'x = 1; import n',
    'try:',
    '    import o',
    'except ImportError:',
    '    pass',
    's = "import p"  # import q',
    "t = '''",
    'from r import s',
    "'''",
  ].join('\n');
  assert.deepEqual([...modulesImportes(code)].sort(), ['a', 'b', 'e', 'f', 'h', 'l', 'n', 'o']);
});

test('modulesNonGeles : noms importables lus dans le dossier, nom du dossier sinon', () => {
  const racine = creerRacine();
  assert.deepEqual([...modulesNonGeles(racine)].sort(), ['gc9a01', 'hts221']);
});

test('compilé par MDX : le bloc coloré puis <EssayerMicroPython>', async () => {
  const racine = creerRacine();
  const source = '# Essai\n\n```python run confirm="Remplace l’heure"\nprint("é")\n```\n';
  const sortie = String(
    await compile(
      { value: source, cwd: racine, path: path.join(racine, 'docs/essai.md') },
      { remarkPlugins: [remarkCodeFile, remarkMicropythonRun] },
    ),
  );
  const bloc = sortie.indexOf('_components.pre');
  const bouton = sortie.indexOf('_jsx(EssayerMicroPython');
  assert.ok(bloc >= 0, sortie);
  assert.ok(bouton > bloc, sortie);
  assert.match(sortie, /id: "essai\.md#1"/);
  assert.match(sortie, /code: "print\(\\"é\\"\)"/);
  assert.match(sortie, /confirmation: "Remplace l’heure"/);
});
