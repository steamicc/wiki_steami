import React from 'react';

export default function OctopartButton({ q }) {
  return (
    <a
      href={`https://octopart.com/search?q=${encodeURIComponent(q)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Rechercher ${q} sur Octopart`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.8rem',
        border: '1px solid var(--ifm-color-emphasis-300)',
        textDecoration: 'none',
        color: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      🔍 Octopart
    </a>
  );
}
