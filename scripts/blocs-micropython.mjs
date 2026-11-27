// Liste les blocs python des pages tels que le build les voit, et dit lesquels
// reçoivent le bouton « Essayer sur la carte ». Utilisé par
// scripts/check-micropython-blocks.py : le CI vérifie ainsi exactement les blocs
// auxquels plugins/remark-micropython-run.js donne un bouton (blocs dans une
// citation, une liste, meta séparé par une tabulation…).
//
// Analyse comme Docusaurus (format mdx) : mêmes prétraitements, mêmes plugins
// remark de syntaxe (front matter, directives, GFM, commentaires HTML), puis les
// remarkPlugins de la doc lus dans docusaurus.config.js.
//
// Entrée (stdin, JSON) : { "racine": "<dossier du site>", "pages": [{ "chemin": "docs/x.md", "texte": "…" }] }
// Sortie (stdout, JSON) : une entrée par bloc python,
//   { page, ligne, meta, code, source, bouton, id, confirmation, fichiers }
// ou { page, erreur } si la page ne passe pas (fichier inclus absent…).
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createProcessor } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkComment from '@slorber/remark-comment';

const require = createRequire(import.meta.url);
const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {
  unwrapMdxCodeBlocks,
  escapeMarkdownHeadingIds,
  admonitionTitleToDirectiveLabel,
} = require('@docusaurus/utils');
const remarkMicropythonRun = require(path.join(SITE, 'plugins/remark-micropython-run.js'));

// Mots-clés des admonitions par défaut de Docusaurus (note, tip, info…).
const MOTS_CLES_ADMONITIONS = [
  'secondary',
  'info',
  'success',
  'danger',
  'note',
  'tip',
  'warning',
  'important',
  'caution',
];

function pluginsDeLaDoc() {
  const config = require(path.join(SITE, 'docusaurus.config.js'));
  const classique = config.presets.find((p) => p[0] === 'classic');
  const plugins = (classique && classique[1].docs.remarkPlugins) || [];
  if (!plugins.includes(remarkMicropythonRun)) {
    throw new Error('remark-micropython-run absent des remarkPlugins de docusaurus.config.js');
  }
  return plugins;
}

function enfantsCode(arbre, rappel) {
  const parcourir = (parent) => {
    (parent.children || []).forEach((enfant, i) => {
      if (enfant.type === 'code') rappel(enfant, parent, i);
      else parcourir(enfant);
    });
  };
  parcourir(arbre);
}

/** Blocs python des pages, avec la décision du plugin (voir l'en-tête). */
export async function listerBlocs(pages, racine) {
  const pluginsDoc = pluginsDeLaDoc();
  const resultat = [];
  for (const { chemin, texte } of pages) {
    const blocs = [];
    // Avant le plugin : meta d'origine (sans file=, retiré par remark-code-file).
    const noter = () => (arbre) =>
      enfantsCode(arbre, (noeud) => {
        if (noeud.lang !== 'python') return;
        blocs.push({
          noeud,
          page: chemin,
          ligne: noeud.position?.start.line ?? null,
          meta: noeud.meta ?? '',
          source: noeud.data?.sourceFile ?? null,
        });
      });
    // Après : le composant inséré juste après le bloc.
    const relever = () => (arbre) =>
      enfantsCode(arbre, (noeud, parent, i) => {
        const bloc = blocs.find((b) => b.noeud === noeud);
        const suivant = parent.children[i + 1];
        if (!bloc || suivant?.type !== 'mdxJsxFlowElement' || suivant.name !== 'EssayerMicroPython')
          return;
        const attributs = Object.fromEntries(suivant.attributes.map((a) => [a.name, a.value]));
        bloc.bouton = true;
        bloc.id = attributs.id;
        bloc.confirmation = attributs.confirmation ?? null;
        bloc.fichiers = attributs.fichiers ? JSON.parse(attributs.fichiers).map((f) => f.nom) : [];
      });
    const plugins = [...pluginsDoc];
    plugins.splice(plugins.indexOf(remarkMicropythonRun), 0, noter);
    plugins.push(relever);
    const processeur = createProcessor({
      format: 'mdx',
      remarkPlugins: [remarkFrontmatter, remarkDirective, remarkGfm, remarkComment, ...plugins],
    });
    let contenu = unwrapMdxCodeBlocks(texte);
    contenu = escapeMarkdownHeadingIds(contenu);
    contenu = admonitionTitleToDirectiveLabel(contenu, MOTS_CLES_ADMONITIONS);
    const fichier = { value: contenu, cwd: racine, path: path.join(racine, chemin) };
    try {
      await processeur.run(processeur.parse(fichier), fichier);
    } catch (erreur) {
      resultat.push({ page: chemin, erreur: String(erreur.message || erreur).split('\n')[0] });
      continue;
    }
    for (const { noeud, ...bloc } of blocs) {
      resultat.push({
        id: null,
        confirmation: null,
        fichiers: [],
        bouton: false,
        ...bloc,
        code: noeud.value,
      });
    }
  }
  return resultat;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let entree = '';
  process.stdin.setEncoding('utf-8');
  for await (const morceau of process.stdin) entree += morceau;
  const { racine, pages } = JSON.parse(entree);
  process.stdout.write(JSON.stringify(await listerBlocs(pages, racine)));
}
