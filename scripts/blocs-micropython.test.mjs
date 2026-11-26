// Le listeur du CI (scripts/blocs-micropython.mjs) voit exactement les boutons
// que le build de Docusaurus produit, y compris pour les blocs placés dans une
// citation, une liste, une admonition, du JSX, ou avec un meta après une tabulation.
// Lancer : npm run test:js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { listerBlocs } from './blocs-micropython.mjs';

const require = createRequire(import.meta.url);
const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LIB = '.external/micropython-steami-lib/lib';

const PAGE = `---
title: Essai
---

## Titre {#titre}

<!-- commentaire HTML -->

\`\`\`python run
print("en ligne")
\`\`\`

> \`\`\`python run
> print("citation")
> \`\`\`

\`\`\`python\trun
print("tabulation")
\`\`\`

1. \`\`\`python run
   print("élément de liste")
   \`\`\`

- Étape :

  \`\`\`python file=${LIB}/ism330dl/examples/basic_read.py
  \`\`\`

:::note Titre de la note

\`\`\`python run confirm="Écrit dans la flash"
print("admonition")
\`\`\`

:::

<details>
<summary>Détails</summary>

\`\`\`python run
print("JSX")
\`\`\`

</details>

> \`\`\`python file=${LIB}/hts221/examples/humidity.py
> \`\`\`

\`\`\`\`md
\`\`\`python run
print("cité, pas un bloc")
\`\`\`
\`\`\`\`

\`\`\`python
print("sans marque")
\`\`\`

\`\`\`python run norun
print("norun")
\`\`\`
`;

function creerRacine() {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'blocs-mpy-'));
  const ecrire = (relatif, contenu) => {
    const absolu = path.join(racine, relatif);
    fs.mkdirSync(path.dirname(absolu), { recursive: true });
    fs.writeFileSync(absolu, contenu);
  };
  ecrire(`${LIB}/hts221/.not-frozen`, '');
  ecrire(`${LIB}/hts221/hts221/__init__.py`, '');
  ecrire(`${LIB}/hts221/examples/humidity.py`, 'from hts221 import HTS221\n');
  ecrire(`${LIB}/ism330dl/ism330dl/__init__.py`, '');
  ecrire(`${LIB}/ism330dl/examples/basic_read.py`, 'from ism330dl import ISM330DL\n');
  ecrire('docs/essai.md', PAGE);
  return racine;
}

// Compilation par Docusaurus lui-même (mdx-loader, configuration du site) : ids
// des <EssayerMicroPython> produits. Docusaurus résout file= depuis le dossier
// courant, d'où le chdir vers la racine d'essai.
async function idsDuBuild(racine) {
  const { DEFAULT_CONFIG } = require('@docusaurus/core/lib/server/configValidation.js');
  const { compileToJSX } = require('@docusaurus/mdx-loader/lib/utils.js');
  const config = require(path.join(SITE, 'docusaurus.config.js'));
  const markdownConfig = {
    ...DEFAULT_CONFIG.markdown,
    ...config.markdown,
    hooks: { ...DEFAULT_CONFIG.markdown.hooks, ...config.markdown.hooks },
  };
  const docs = config.presets.find((p) => p[0] === 'classic')[1].docs;
  const options = {
    markdownConfig,
    admonitions: true,
    remarkPlugins: docs.remarkPlugins,
    siteDir: racine,
    staticDirs: [],
  };
  const avant = process.cwd();
  process.chdir(racine);
  try {
    const { content } = await compileToJSX({
      filePath: path.join(racine, 'docs/essai.md'),
      fileContent: PAGE,
      frontMatter: {},
      options,
      compilerName: 'server',
    });
    return [...content.matchAll(/_jsx\(EssayerMicroPython, \{\s*id: "([^"]*)"/g)].map((m) => m[1]);
  } finally {
    process.chdir(avant);
  }
}

test('listeur du CI et build de Docusaurus : mêmes boutons', async () => {
  const racine = creerRacine();
  const blocs = await listerBlocs([{ chemin: 'docs/essai.md', texte: PAGE }], racine);
  assert.ok(
    blocs.every((b) => !b.erreur),
    JSON.stringify(blocs),
  );
  const ids = blocs.filter((b) => b.bouton).map((b) => b.id);
  assert.deepEqual(ids, await idsDuBuild(racine));
  // en ligne, citation, tabulation, liste, exemple gelé en liste, admonition, JSX
  assert.equal(ids.length, 7);
  const parCode = Object.fromEntries(blocs.map((b) => [b.code.split('\n')[0], b]));
  assert.equal(parCode['print("citation")'].ligne, 13);
  assert.equal(parCode['print("admonition")'].confirmation, 'Écrit dans la flash');
  assert.equal(parCode['print("sans marque")'].bouton, false);
  assert.equal(parCode['print("norun")'].bouton, false);
  assert.equal(parCode['from hts221 import HTS221'].bouton, false);
  assert.equal(
    parCode['from ism330dl import ISM330DL'].source,
    `${LIB}/ism330dl/examples/basic_read.py`,
  );
});

test('page refusée par le plugin → erreur rapportée, sans arrêter les autres pages', async () => {
  const racine = creerRacine();
  const blocs = await listerBlocs(
    [
      { chemin: 'docs/a.md', texte: '```python run files=docs/x.py\nx = 1\n```\n' },
      { chemin: 'docs/b.md', texte: '```python run\nx = 1\n```\n' },
    ],
    racine,
  );
  assert.equal(blocs.length, 2);
  assert.equal(blocs[0].page, 'docs/a.md');
  assert.match(blocs[0].erreur, /docs\/x\.py/);
  assert.equal(blocs[1].bouton, true);
  assert.equal(blocs[1].id, 'b.md#1');
});
