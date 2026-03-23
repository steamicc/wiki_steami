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
      <img
        src="/img/hardware/steami-front.png"
        alt="Carte STeaMi"
        className="hero-image"
        loading="eager"
        width={350}
        height={250}
      />
      <p className="hero-specs">
        STM32WB55 · 7 capteurs · BLE 5.2 · OLED 128×128 · MicroPython · DAPLink
      </p>
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

function Pinout() {
  return (
    <section className="pinout-section">
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
        <Pinout />
        <Resources />
      </main>
    </Layout>
  );
}
