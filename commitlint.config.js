module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'always', ['lower-case']],
    'scope-enum': [
      1,
      'always',
      ['wip', 'configs', 'formatting', 'code', 'ci', 'docs', 'hardware', 'software', 'design'],
    ],
    'body-max-line-length': [1, 'always', 100],
  },
};
