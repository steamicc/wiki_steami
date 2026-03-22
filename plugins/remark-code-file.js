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
 */
const fs = require('fs');
const path = require('path');
const { visit } = require('unist-util-visit');

function remarkCodeFile() {
  return (tree, file) => {
    visit(tree, 'code', (node) => {
      if (!node.meta) return;

      const match = node.meta.match(/file=(\S+)/);
      if (!match) return;

      const filePath = match[1];
      const rootDir = file.cwd || process.cwd();
      const absolutePath = path.resolve(rootDir, filePath);

      try {
        const content = fs.readFileSync(absolutePath, 'utf-8').trimEnd();
        node.value = content;
        // Remove file= from meta to avoid it showing in rendered output
        node.meta = node.meta.replace(/file=\S+/, '').trim() || null;
      } catch (err) {
        const relPath = path.relative(rootDir, absolutePath);
        console.warn(`[remark-code-file] File not found: ${relPath}`);
        node.value = `# File not found: ${relPath}\n# Run "npm run prebuild" to fetch external examples`;
      }
    });
  };
}

module.exports = remarkCodeFile;
