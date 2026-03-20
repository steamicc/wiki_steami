// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Wiki STeaMi',
  tagline: 'Documentation technique de la carte STeaMi',
  favicon: 'img/favicon.ico',

  url: 'https://wiki.steami.cc',
  baseUrl: '/',

  organizationName: 'steamicc',
  projectName: 'wiki-steami',

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
          editUrl: 'https://github.com/steamicc/wiki-steami/tree/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
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
        title: 'Wiki STeaMi',
        logo: {
          alt: 'Logo STeaMi',
          src: 'img/logo-steami.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'overviewSidebar',
            position: 'left',
            label: '📋 Vue d\'ensemble',
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
            label: '💻 Software',
          },
          {
            type: 'docSidebar',
            sidebarId: 'pinmappingSidebar',
            position: 'left',
            label: '📍 Pin Mapping',
          },
          {
            type: 'docSidebar',
            sidebarId: 'componentsSidebar',
            position: 'left',
            label: '🧩 Composants',
          },
          {
            type: 'docSidebar',
            sidebarId: 'requirementsSidebar',
            position: 'left',
            label: '📦 Requirements',
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
              { label: 'Vue d\'ensemble', to: '/docs/overview' },
              { label: 'Hardware', to: '/docs/hardware' },
              { label: 'Pin Mapping', to: '/docs/pin-mapping' },
              { label: 'Composants', to: '/docs/components' },
              { label: 'Software', to: '/docs/software' },
              { label: 'Requirements', to: '/docs/requirements' },
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
        copyright: `Wiki STeaMi © ${new Date().getFullYear()} — Documentation technique de la carte STeaMi`,
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
