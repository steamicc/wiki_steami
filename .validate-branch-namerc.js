module.exports = {
  pattern:
    '^(main)$|^(chore|feat|fix|docs|ci|refactor)\\/([a-z0-9]+-)*[a-z0-9]+$|^release\\/v([0-9]+)\\.([0-9]+)\\.([0-9]+)$',
  errorMsg:
    'La branche que tu essaies de pusher ne respecte pas nos conventions.\n' +
    'Format attendu : chore|feat|fix|docs|ci|refactor/<description-en-kebab-case>\n' +
    'Tu peux la renommer avec : git branch -m <nom-actuel> <nouveau-nom>',
};
