import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const features = [
  {
    icon: '📋',
    title: 'Vue d\'ensemble',
    description:
      'Découvrez la carte STeaMi, ses caractéristiques principales et son architecture générale.',
    link: '/docs/overview',
  },
  {
    icon: '🔌',
    title: 'Hardware',
    description:
      'Schémas, composants et description détaillée du matériel embarqué sur la carte STeaMi.',
    link: '/docs/hardware',
  },
  {
    icon: '📍',
    title: 'Pin Mapping',
    description:
      'Correspondance entre les broches physiques de la carte et les fonctions MicroPython disponibles.',
    link: '/docs/pin-mapping',
  },
  {
    icon: '🧩',
    title: 'Composants',
    description:
      'Documentation des drivers MicroPython pour chaque composant intégré à la carte STeaMi.',
    link: '/docs/components',
  },
  {
    icon: '📦',
    title: 'Requirements',
    description:
      'Dépendances, outils et environnement nécessaires pour développer avec la carte STeaMi.',
    link: '/docs/requirements',
  },
];

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero--steami">
      <h1>🎛️ {siteConfig.title}</h1>
      <p>{siteConfig.tagline}</p>
      <p style={{ fontSize: '1rem', opacity: 0.8, maxWidth: '700px', margin: '0 auto 2rem' }}>
        MicroPython · Drivers · Hardware · Documentation
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="button button--primary button--lg" to="/docs/overview">
          Démarrer
        </Link>
        <Link
          className="button button--secondary button--lg"
          href="https://github.com/steamicc/micropython-steami-lib"
          style={{ color: 'white', borderColor: 'white' }}
        >
          GitHub
        </Link>
      </div>
    </header>
  );
}

function Features() {
  return (
    <section className="features-section">
      {features.map(({ icon, title, description, link }) => (
        <Link key={title} to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-box">
            <div className="feature-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Accueil"
      description="Wiki STeaMi — Documentation technique de la carte STeaMi. Drivers MicroPython, pin mapping, hardware et composants."
    >
      <Hero />
      <main>
        <Features />
        <section
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'var(--ifm-color-emphasis-100)',
          }}
        >
          <h2>🚀 Commencer avec STeaMi</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            La carte STeaMi est conçue pour l'apprentissage et le prototypage rapide avec
            MicroPython. Retrouvez tous les drivers et exemples sur GitHub.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="button button--primary" href="https://steami.cc">
              🌐 steami.cc
            </Link>
            <Link
              className="button button--outline button--primary"
              href="https://github.com/steamicc/micropython-steami-lib"
            >
              💻 GitHub
            </Link>
            <Link
              className="button button--outline button--primary"
              href="https://docs.micropython.org/"
            >
              📖 MicroPython
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
