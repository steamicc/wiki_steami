// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Documentation STeaMi',
  tagline: "Carte éducative pour l'IoT — Code. Communicate. Create.",
  favicon: 'img/favicon.ico',

  url: 'https://wiki.steami.cc',
  baseUrl: '/',

  organizationName: 'steamicc',
  projectName: 'wiki_steami',

  onBrokenLinks: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/steamicc/wiki_steami/edit/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          remarkPlugins: [require('./plugins/remark-code-file')],
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/steami-social-card.png',

      navbar: {
        title: 'Documentation STeaMi',
        logo: {
          alt: 'Logo STeaMi',
          src: 'img/logo-steami.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'overviewSidebar',
            position: 'left',
            label: "📋 Vue d'ensemble",
          },
          {
            type: 'docSidebar',
            sidebarId: 'hardwareSidebar',
            position: 'left',
            label: '🔌 Hardware',
          },
          {
            type: 'docSidebar',
            sidebarId: 'softwareSidebar',
            position: 'left',
            label: '💻 Programmation',
          },
          {
            type: 'docSidebar',
            sidebarId: 'designSidebar',
            position: 'left',
            label: '🏗️ Conception',
          },
          {
            href: 'https://steami.cc',
            label: 'steami.cc',
            position: 'right',
          },
          {
            href: 'https://github.com/steamicc/micropython-steami-lib',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },

      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              { label: "Vue d'ensemble", to: '/docs/overview' },
              { label: 'Hardware', to: '/docs/hardware' },
              { label: 'Programmation', to: '/docs/software' },
              { label: 'Conception', to: '/docs/design' },
            ],
          },
          {
            title: 'Ressources',
            items: [
              { label: 'Site STeaMi', href: 'https://steami.cc' },
              {
                label: 'GitHub',
                href: 'https://github.com/steamicc/micropython-steami-lib',
              },
              {
                label: 'MicroPython',
                href: 'https://docs.micropython.org/',
              },
            ],
          },
        ],
        copyright: `Documentation STeaMi © ${new Date().getFullYear()} — Carte éducative pour l'IoT`,
      },

      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['python', 'c', 'cpp', 'bash', 'json'],
      },

      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
