const js = require('@eslint/js');
const globals = require('globals');
const reactPlugin = require('eslint-plugin-react');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['build/**', '.docusaurus/**', 'node_modules/**'],
  },
];
