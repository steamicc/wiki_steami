/* eslint-disable no-useless-escape */
module.exports = {
  display: {
    notifications: true,
    offendingContent: true,
    rulesSummary: false,
    shortStats: true,
    verbose: false,
  },
  rules: [
    {
      message: 'Aurais-tu oublié de terminer certaines tâches ? Aurais-tu une issue à ouvrir ?',
      nonBlocking: true,
      regex: /FIX\x4dE|TO\x44O/,
    },
    {
      message: 'Tu as des marqueurs de conflits qui traînent dans ton code',
      regex: /^[<>|=]{4,}/m,
    },
    {
      message: 'Tu as renseigné des choses qui ne doivent pas être commitées !',
      regex: /do not com\x6dit/i,
    },
    {
      filter: /\.js$/,
      message: "N'as-tu pas oublié de retirer du console.log() ?",
      nonBlocking: true,
      regex: /^\s*console\.log/,
    },
  ],
};
