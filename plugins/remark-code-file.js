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

function remarkCodeFile() {
  return (tree, file) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return;

      const match = node.meta.match(/file=(\S+)/);
      if (!match) return;

      const filePath = match[1];

      // Security: reject absolute paths
      if (path.isAbsolute(filePath)) {
        throw new Error(`[remark-code-file] Absolute paths are not allowed: ${filePath}`);
      }

      // Security: reject path traversal
      const normalized = path.normalize(filePath);
      if (normalized.startsWith('..')) {
        throw new Error(`[remark-code-file] Path traversal is not allowed: ${filePath}`);
      }

      // Security: restrict to allowed directories
      const allowed = ALLOWED_DIRS.some((dir) => normalized.startsWith(dir));
      if (!allowed) {
        throw new Error(
          `[remark-code-file] File must be in one of: ${ALLOWED_DIRS.join(', ')}. Got: ${filePath}`,
        );
      }

      const rootDir = file.cwd || process.cwd();
      const absolutePath = path.resolve(rootDir, normalized);

      try {
        const content = fs.readFileSync(absolutePath, 'utf-8').trimEnd();
        node.value = content;
        // Remove file= from meta
        const cleanedMeta = node.meta.replace(/file=\S+/, '').trim();
        if (cleanedMeta) {
          node.meta = cleanedMeta;
        } else {
          delete node.meta;
        }
      } catch (err) {
        const relPath = path.relative(rootDir, absolutePath);
        throw new Error(
          `[remark-code-file] File not found: ${relPath}. Run "npm run prebuild" to fetch external examples.`,
        );
      }
    });
  };
}

module.exports = remarkCodeFile;
