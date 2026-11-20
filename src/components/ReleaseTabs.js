import React, { Children, isValidElement } from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

// Releases de la STeaMi V1, dans l'ordre chronologique d'affichage des onglets.
// Voir docs/hardware/revisions.md pour la correspondance avec les indices du schéma.
export const RELEASES = [
  { value: 'v1a', label: 'V1a' },
  { value: 'v1b', label: 'V1b' },
  { value: 'v1c', label: 'V1c' },
];

const DEFAULT_RELEASE = 'v1c';

function parseReleases(releases) {
  return String(releases || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

// Bloc de contenu valable pour une ou plusieurs releases.
// Exemple : <Release releases="v1a v1b"> ... </Release>
export function Release({ children }) {
  return <>{children}</>;
}

// Onglets V1a / V1b / V1c synchronisés entre toutes les pages du wiki.
// Un même bloc <Release> peut couvrir plusieurs releases : son contenu n'est écrit
// qu'une fois dans la source et s'affiche dans chacun des onglets concernés.
export default function ReleaseTabs({ children }) {
  const blocks = Children.toArray(children).filter(
    (child) => isValidElement(child) && child.props.releases,
  );

  const items = RELEASES.map((release) => ({
    release,
    block: blocks.find((b) => parseReleases(b.props.releases).includes(release.value)),
  })).filter((item) => item.block);

  if (items.length === 0) {
    return null;
  }

  const defaultValue = items.some((item) => item.release.value === DEFAULT_RELEASE)
    ? DEFAULT_RELEASE
    : items[items.length - 1].release.value;

  return (
    <Tabs groupId="steami-release" queryString="release" defaultValue={defaultValue}>
      {items.map(({ release, block }) => (
        <TabItem key={release.value} value={release.value} label={release.label}>
          {block.props.children}
        </TabItem>
      ))}
    </Tabs>
  );
}
