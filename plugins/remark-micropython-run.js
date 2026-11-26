/**
 * Plugin remark : bouton « Essayer sur la carte » sous les blocs MicroPython
 * exécutables. Le bloc de code reste tel quel (coloré par le thème) ;
 * <EssayerMicroPython> est inséré juste après lui.
 *
 * À placer après remark-code-file, qui remplit les blocs `file=` et garde leur
 * chemin dans node.data.sourceFile.
 *
 * Blocs `python` concernés (marques du meta, retirées après lecture) :
 *
 *   ```python run                               → bouton
 *   ```python norun                             → jamais de bouton (l'emporte)
 *   ```python file=.external/micropython-steami-lib/lib/<driver>/examples/<nom>.py
 *                                               → bouton si aucun import ne vise
 *                                                 un driver marqué .not-frozen
 *   ```python run confirm="Efface la flash"    → demande « Lancer quand même »
 *   ```python run files=.external/a.py,.external/b/c.py
 *                                               → fichiers déposés avant le lancement
 *
 * id du composant : `<chemin de la page sous docs/>#<rang du bloc de code dans
 * la page, à partir de 1>`.
 *
 * scripts/check-micropython-blocks.py applique les mêmes règles dans le CI.
 */
const fs = require('node:fs');
const path = require('node:path');
const { resolveAllowedPath } = require('./remark-code-file');

const NOM = 'remark-micropython-run';
const DOSSIER_LIB = '.external/micropython-steami-lib/lib';
const EXEMPLE_LIB = /^\.external\/micropython-steami-lib\/lib\/[^/]+\/examples\/[^/]+\.py$/;

// Jetons du meta : clé=valeur (valeur entre guillemets possible) ou mot seul.
const JETON = /([A-Za-z_][\w-]*)=(?:"([^"]*)"|'([^']*)'|(\S+))|\S+/g;

/** Lit les marques du plugin dans le meta d'un bloc ; `reste` : les autres jetons. */
function lireMeta(meta) {
  const resultat = { run: false, norun: false, confirm: undefined, files: undefined, reste: [] };
  for (const m of (meta || '').matchAll(JETON)) {
    const [jeton, cle] = m;
    const valeur = m[2] ?? m[3] ?? m[4];
    if (jeton === 'run') resultat.run = true;
    else if (jeton === 'norun') resultat.norun = true;
    else if (cle === 'confirm') resultat.confirm = valeur;
    else if (cle === 'files') resultat.files = valeur.split(',').filter(Boolean);
    else resultat.reste.push(jeton);
  }
  return resultat;
}

/**
 * Retire les commentaires et le contenu des chaînes (y compris triples) d'un
 * code Python, pour ne pas prendre « from x import y » cité dans une docstring
 * pour un import.
 */
function sansChainesNiCommentaires(code) {
  let sortie = '';
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c === '#') {
      while (i < code.length && code[i] !== '\n') i += 1;
    } else if (c === '"' || c === "'") {
      const triple = code.startsWith(c.repeat(3), i);
      const fin = triple ? c.repeat(3) : c;
      i += fin.length;
      while (i < code.length && !code.startsWith(fin, i)) {
        if (code[i] === '\\') i += 1;
        else if (!triple && code[i] === '\n') break;
        i += 1;
      }
      if (code.startsWith(fin, i)) i += fin.length;
      sortie += '""';
    } else {
      sortie += c;
      i += 1;
    }
  }
  return sortie;
}

/** Modules de premier niveau importés par un code Python (imports relatifs exclus). */
function modulesImportes(code) {
  // Une instruction logique par ligne : parenthèses et « \ » de fin de ligne joints.
  let texte = '';
  let profondeur = 0;
  const source = sansChainesNiCommentaires(code).replace(/\\\r?\n/g, ' ');
  for (const c of source) {
    if ('([{'.includes(c)) profondeur += 1;
    else if (')]}'.includes(c)) profondeur = Math.max(0, profondeur - 1);
    texte += c === '\n' && profondeur > 0 ? ' ' : c;
  }
  const modules = new Set();
  for (const instruction of texte.split(/[\n;]/)) {
    const ligne = instruction.trim();
    const depuis = ligne.match(/^from\s+([\w.]+)\s+import\b/);
    if (depuis) {
      if (!depuis[1].startsWith('.')) modules.add(depuis[1].split('.')[0]);
      continue;
    }
    const simple = ligne.match(/^import\s+(.+)$/);
    if (simple) {
      for (const partie of simple[1].split(',')) {
        const nom = partie.trim().match(/^([A-Za-z_]\w*)/);
        if (nom) modules.add(nom[1]);
      }
    }
  }
  return modules;
}

/**
 * Noms importables des drivers de la bibliothèque marqués .not-frozen : paquets
 * (dossier avec __init__.py) et modules (.py hors manifest.py) de lib/<driver>/ ;
 * à défaut (dossier vide), le nom du dossier.
 */
function modulesNonGeles(racine) {
  const lib = path.join(racine, DOSSIER_LIB);
  const modules = new Set();
  for (const driver of fs.readdirSync(lib, { withFileTypes: true })) {
    if (!driver.isDirectory()) continue;
    const dossier = path.join(lib, driver.name);
    if (!fs.existsSync(path.join(dossier, '.not-frozen'))) continue;
    const noms = [];
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      if (entree.isDirectory() && fs.existsSync(path.join(dossier, entree.name, '__init__.py'))) {
        noms.push(entree.name);
      } else if (entree.isFile() && entree.name.endsWith('.py') && entree.name !== 'manifest.py') {
        noms.push(entree.name.slice(0, -3));
      }
    }
    if (noms.length === 0) noms.push(driver.name.replaceAll('-', '_'));
    noms.forEach((nom) => modules.add(nom));
  }
  return modules;
}

function lireFichiersAnnexes(chemins, racine) {
  const vus = new Set();
  return chemins.map((chemin) => {
    const absolu = resolveAllowedPath(chemin, racine, NOM);
    const nom = path.basename(absolu);
    if (vus.has(nom)) {
      throw new Error(
        `[${NOM}] Deux fichiers annexes s'appellent ${nom} (files=${chemins.join(',')})`,
      );
    }
    vus.add(nom);
    try {
      return { nom, contenu: fs.readFileSync(absolu, 'utf-8') };
    } catch {
      throw new Error(
        `[${NOM}] Fichier annexe introuvable : ${chemin}. Lancer "npm run prebuild".`,
      );
    }
  });
}

function cheminPage(file, racine) {
  if (!file.path) return 'page';
  const docs = path.join(racine, 'docs');
  const relatif = path.relative(docs, file.path);
  const base = relatif.startsWith('..') ? path.relative(racine, file.path) : relatif;
  return base.split(path.sep).join('/');
}

function attribut(name, value) {
  return { type: 'mdxJsxAttribute', name, value };
}

function remarkMicropythonRun() {
  return (tree, file) => {
    const racine = file.cwd || process.cwd();
    const page = cheminPage(file, racine);
    let rang = 0;
    let nonGeles;

    const traiter = (noeud) => {
      rang += 1;
      if (noeud.lang !== 'python') return null;
      const meta = lireMeta(noeud.meta);
      const source = noeud.data?.sourceFile;
      const exempleLib = typeof source === 'string' && EXEMPLE_LIB.test(source);
      if (meta.reste.length > 0) noeud.meta = meta.reste.join(' ');
      else delete noeud.meta;

      if (meta.norun) return null;
      if (!meta.run) {
        if (!exempleLib) return null;
        nonGeles = nonGeles || modulesNonGeles(racine);
        const imports = modulesImportes(noeud.value);
        if ([...imports].some((m) => nonGeles.has(m))) return null;
      }

      const attributs = [attribut('id', `${page}#${rang}`), attribut('code', noeud.value)];
      if (meta.files && meta.files.length > 0) {
        const fichiers = lireFichiersAnnexes(meta.files, racine);
        attributs.push(attribut('fichiers', JSON.stringify(fichiers)));
      }
      if (meta.confirm) attributs.push(attribut('confirmation', meta.confirm));
      return {
        type: 'mdxJsxFlowElement',
        name: 'EssayerMicroPython',
        attributes: attributs,
        children: [],
      };
    };

    const parcourir = (parent) => {
      if (!parent.children) return;
      for (let i = 0; i < parent.children.length; i += 1) {
        const enfant = parent.children[i];
        if (enfant.type === 'code') {
          const composant = traiter(enfant);
          if (composant) {
            parent.children.splice(i + 1, 0, composant);
            i += 1;
          }
        } else {
          parcourir(enfant);
        }
      }
    };
    parcourir(tree);
  };
}

module.exports = remarkMicropythonRun;
module.exports.lireMeta = lireMeta;
module.exports.modulesImportes = modulesImportes;
module.exports.modulesNonGeles = modulesNonGeles;
