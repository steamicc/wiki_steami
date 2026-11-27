/**
 * Remark plugin to import code from external files.
 *
 * Usage in Markdown:
 *
 *   ```python file=.external/micropython-steami-lib/lib/ism330dl/examples/basic_read.py
 *   ```
 *
 * The empty code block with a `file=path` meta attribute is replaced
 * at build time with the content of the referenced file.
 *
 * Security: only relative paths under allowed directories are accepted.
 */
const fs = require('fs');
const path = require('path');

/** Minimal AST visitor to avoid external dependency on unist-util-visit. */
function visit(tree, type, fn) {
  if (tree.type === type) fn(tree);
  if (tree.children) {
    for (const child of tree.children) {
      visit(child, type, fn);
    }
  }
}

/** Allowed base directories for file imports. */
const ALLOWED_DIRS = ['.external/'];

/**
 * Check that `filePath` is relative, without `..`, under an allowed directory,
 * and return its absolute path. Shared with remark-micropython-run (files=).
 */
function resolveAllowedPath(filePath, rootDir, label) {
  // Security: reject absolute paths
  if (path.isAbsolute(filePath)) {
    throw new Error(`[${label}] Absolute paths are not allowed: ${filePath}`);
  }

  // Security: reject path traversal
  const normalized = path.normalize(filePath);
  if (normalized.startsWith('..')) {
    throw new Error(`[${label}] Path traversal is not allowed: ${filePath}`);
  }

  // Security: restrict to allowed directories
  const allowed = ALLOWED_DIRS.some((dir) => normalized.startsWith(dir));
  if (!allowed) {
    throw new Error(
      `[${label}] File must be in one of: ${ALLOWED_DIRS.join(', ')}. Got: ${filePath}`,
    );
  }

  return path.resolve(rootDir, normalized);
}

function remarkCodeFile() {
  return (tree, file) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return;

      const match = node.meta.match(/(?:^|\s)file=(\S+)/);
      if (!match) return;

      const filePath = match[1];

      const rootDir = file.cwd || process.cwd();
      const absolutePath = resolveAllowedPath(filePath, rootDir, 'remark-code-file');
      const normalized = path.normalize(filePath);

      try {
        const content = fs.readFileSync(absolutePath, 'utf-8').trimEnd();
        node.value = content;
        // Keep the source path for later plugins (remark-micropython-run).
        node.data = { ...node.data, sourceFile: normalized.split(path.sep).join('/') };
        // Remove file= from meta
        const cleanedMeta = node.meta.replace(/(?:^|\s)file=\S+/, ' ').trim();
        if (cleanedMeta) {
          node.meta = cleanedMeta;
        } else {
          delete node.meta;
        }
      } catch {
        const relPath = path.relative(rootDir, absolutePath);
        throw new Error(
          `[remark-code-file] File not found: ${relPath}. Run "npm run prebuild" to fetch external examples. ` +
            'If they are already fetched, the example was probably removed or renamed upstream: ' +
            '"npm run lint:arduino-examples" lists the Arduino ones.',
        );
      }
    });
  };
}

module.exports = remarkCodeFile;
module.exports.resolveAllowedPath = resolveAllowedPath;
