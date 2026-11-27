// Composants disponibles dans toutes les pages Markdown sans import : le plugin
// remark des blocs MicroPython exécutables y insère <EssayerMicroPython>.
// Docusaurus : swizzle par enveloppe (le thème d'origine reste la base).
import MDXComponents from '@theme-original/MDXComponents';
import EssayerMicroPython from '@site/src/components/EssayerMicroPython';

export default {
  ...MDXComponents,
  EssayerMicroPython,
};
