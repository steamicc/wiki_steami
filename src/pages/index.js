import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const features = [
  {
    title: "Vue d'ensemble",
    description: 'Architecture, pinout, schéma bloc et caractéristiques principales.',
    link: '/docs/overview',
    image: '/img/hardware/block-diagram.svg',
  },
  {
    title: 'Hardware',
    description: 'MCU, capteurs, écran, alimentation, connecteurs et datasheets.',
    link: '/docs/hardware',
    image: '/img/hardware/steami-front.png',
  },
  {
    title: 'Programmation',
    description: 'MicroPython, CODAL, Arduino : drivers, tutoriels et exemples.',
    link: '/docs/software',
    image: '/img/hardware/steami-back.png',
  },
  {
    title: 'Conception',
    description: 'Exigences techniques et justifications des choix de conception.',
    link: '/docs/design',
    image: '/img/schematics/FP0-Vue_systeme.png',
  },
];

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero--steami">
      <h1>{siteConfig.title}</h1>
      <p className="hero-subtitle">{siteConfig.tagline}</p>
      <div className="hero-buttons">
        <Link className="button button--primary button--lg" to="/docs/software/getting-started">
          Premiers pas
        </Link>
        <Link className="button button--outline button--primary button--lg" to="/docs/hardware">
          Hardware
        </Link>
        <Link
          className="button button--outline button--secondary button--lg"
          href="https://github.com/steamicc/micropython-steami-lib"
        >
          GitHub
        </Link>
      </div>
      <img
        src="/img/hardware/steami-render.png"
        alt="Carte STeaMi"
        className="hero-image"
        loading="eager"
      />
      <div className="specs-grid hero-specs-grid">
        {specs.map(({ label, value, link }) => {
          const content = (
            <div className="spec-card" key={label}>
              <span className="spec-label">{label}</span>
              <span className="spec-value">{value}</span>
            </div>
          );
          return link ? (
            <Link key={label} to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
              {content}
            </Link>
          ) : (
            <React.Fragment key={label}>{content}</React.Fragment>
          );
        })}
      </div>
    </header>
  );
}

function Features() {
  return (
    <section className="features-section">
      {features.map(({ title, description, link, image }) => (
        <Link key={title} to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-box">
            {image && (
              <img
                src={image}
                alt={title}
                className="feature-image"
                loading="lazy"
                decoding="async"
              />
            )}
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}

const specs = [
  { label: 'MCU', value: 'STM32WB55RG', link: '/docs/hardware/main-components/stm32wb55' },
  { label: 'Coeur', value: 'Cortex-M4 @ 64 MHz' },
  { label: 'Radio', value: 'BLE 5.2 / OpenThread / ZigBee' },
  {
    label: 'Capteurs',
    value: '7 capteurs internes',
    link: '/docs/hardware/main-components/sensors',
  },
  { label: 'Écran', value: 'OLED 128×128', link: '/docs/hardware/main-components/display' },
  { label: 'Batterie', value: 'LiPo 1600 mAh', link: '/docs/hardware/main-components/power' },
  {
    label: 'USB',
    value: 'DAPLink drag-and-drop',
    link: '/docs/hardware/main-components/stm32f103',
  },
  {
    label: 'Connecteurs',
    value: 'Edge micro:bit + Qwiic',
    link: '/docs/hardware/main-components/connectors',
  },
];

function Resources() {
  return (
    <section className="resources-section">
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
          href="https://docs.micropython.org/en/latest/"
        >
          MicroPython
        </Link>
        <Link
          className="button button--outline button--primary"
          href="https://stm32python.gitlab.io/fr/"
        >
          STM32Python
        </Link>
      </div>
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
      <main>
        <Features />
        <Resources />
      </main>
    </Layout>
  );
}
