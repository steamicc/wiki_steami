import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const features = [
  {
    icon: '📋',
    title: 'Vue d\'ensemble',
    description:
      'Architecture générale, pinout, schéma bloc et caractéristiques principales de la carte.',
    link: '/docs/overview',
  },
  {
    icon: '🔌',
    title: 'Hardware',
    description:
      'Description détaillée du matériel : MCU, capteurs, écran, alimentation, connecteurs, datasheets.',
    link: '/docs/hardware',
  },
  {
    icon: '💻',
    title: 'Software',
    description:
      'MicroPython, CODAL, Arduino : drivers, tutoriels, exemples de code pour chaque composant.',
    link: '/docs/software',
  },
  {
    icon: '📍',
    title: 'Pin Mapping',
    description:
      'Correspondance entre les broches physiques et les fonctions du microcontrôleur.',
    link: '/docs/pin-mapping',
  },
  {
    icon: '🧩',
    title: 'Composants',
    description:
      'BOM détaillée : circuits intégrés, passifs, connecteurs, LEDs, cristaux.',
    link: '/docs/components',
  },
  {
    icon: '🏗️',
    title: 'Conception',
    description:
      'Exigences techniques et justifications des choix de conception pour chaque sous-système.',
    link: '/docs/design',
  },
];

const specs = [
  { label: 'MCU', value: 'STM32WB55RG' },
  { label: 'Coeur', value: 'Cortex-M4 @ 64 MHz' },
  { label: 'Radio', value: 'BLE 5.2 / OpenThread / ZigBee' },
  { label: 'Capteurs', value: '7 capteurs internes' },
  { label: 'Écran', value: 'OLED 128×128' },
  { label: 'Batterie', value: 'LiPo 1600 mAh' },
  { label: 'USB', value: 'DAPLink drag-and-drop' },
  { label: 'Connecteur', value: 'Edge micro:bit + Qwiic' },
];

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero--steami">
      <h1>{siteConfig.title}</h1>
      <p>{siteConfig.tagline}</p>
      <p style={{ fontSize: '1rem', opacity: 0.8, maxWidth: '700px', margin: '0 auto 2rem' }}>
        STM32WB55 · 7 capteurs · BLE 5.2 · OLED 128×128 · MicroPython · DAPLink
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="button button--primary button--lg" to="/docs/overview">
          Documentation
        </Link>
        <Link className="button button--primary button--lg" to="/docs/hardware">
          Hardware
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

function Specs() {
  return (
    <section style={{ padding: '2rem', background: 'var(--ifm-color-emphasis-100)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {specs.map(({ label, value }) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              padding: '0.8rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
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

function Pinout() {
  return (
    <section style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Pinout</h2>
      <Link to="/docs/overview/pinout">
        <img
          src="/img/pinout/pinout_steami.svg"
          alt="Pinout STeaMi"
          loading="lazy"
          decoding="async"
          width={700}
          height={394}
          style={{ maxWidth: '700px', width: '100%', height: 'auto' }}
        />
      </Link>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="Accueil"
      description="Wiki STeaMi — Documentation technique de la carte STeaMi. Hardware, drivers MicroPython, pin mapping, conception."
    >
      <Hero />
      <Specs />
      <main>
        <Features />
        <Pinout />
        <section
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'var(--ifm-color-emphasis-100)',
          }}
        >
          <h2>Ressources</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="button button--primary" href="https://steami.cc">
              steami.cc
            </Link>
            <Link
              className="button button--outline button--primary"
              href="https://github.com/steamicc/micropython-steami-lib"
            >
              Drivers MicroPython
            </Link>
            <Link
              className="button button--outline button--primary"
              href="https://github.com/steamicc/steami-reference-design"
            >
              Reference Design
            </Link>
            <Link
              className="button button--outline button--primary"
              href="https://docs.micropython.org/"
            >
              MicroPython
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
