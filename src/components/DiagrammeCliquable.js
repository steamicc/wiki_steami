import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

// Schéma SVG dont les blocs sont des liens.
// Un SVG affiché par <img> (syntaxe Markdown) ne suit pas ses liens : <object> les garde,
// et le SVG reste un document séparé, avec son propre fond et ses propres styles.
// Les liens du SVG sont relatifs à son URL (../../docs/...) et portent target="_top" :
// ils suivent donc le baseUrl du site et s'ouvrent dans l'onglet, pas dans l'objet.
//
// Exemple :
// <DiagrammeCliquable src="/img/diagrams/architecture-v1c.svg" width={800} height={1232}
//   alt="Schéma bloc de la STeaMi V1c : …" />
export default function DiagrammeCliquable({ src, alt, width, height }) {
  const url = useBaseUrl(src);
  const taille = {
    display: 'block',
    width: '100%',
    maxWidth: `${width}px`,
    height: 'auto',
    aspectRatio: `${width} / ${height}`,
    margin: '0 auto',
  };
  return (
    <figure style={{ margin: '0 0 var(--ifm-leading)' }}>
      <object data={url} type="image/svg+xml" aria-label={alt} style={taille}>
        <img src={url} alt={alt} width={width} height={height} style={taille} />
      </object>
      <figcaption style={{ textAlign: 'center', fontSize: '0.9rem' }}>
        Cliquer sur un bloc pour ouvrir sa page.{' '}
        <a href={url} target="_blank" rel="noopener noreferrer">
          Ouvrir le schéma seul
        </a>{' '}
        pour l&apos;agrandir.
      </figcaption>
    </figure>
  );
}
