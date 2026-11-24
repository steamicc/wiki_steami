import React, { Children, isValidElement } from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { useLocation } from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useStorageSlot } from '@docusaurus/theme-common';

// Releases de la STeaMi V1, dans l'ordre chronologique d'affichage des onglets.
// Voir docs/hardware/revisions.md pour la correspondance avec les indices du schéma.
export const RELEASES = [
  { value: 'v1a', label: 'V1a' },
  { value: 'v1b', label: 'V1b' },
  { value: 'v1c', label: 'V1c' },
];

const DEFAULT_RELEASE = 'v1c';

// Le choix est partagé avec les <Tabs> de Docusaurus : même groupId (clé de stockage)
// et même paramètre d'URL.
const GROUP_ID = 'steami-release';
const QUERY_STRING = 'release';
const STORAGE_KEY = `docusaurus.tab.${GROUP_ID}`;

function isRelease(value) {
  return RELEASES.some((release) => release.value === value);
}

function parseReleases(releases) {
  return String(releases || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

function findBlock(children, releaseValue) {
  return Children.toArray(children)
    .filter((child) => isValidElement(child) && child.props.releases)
    .find((child) => parseReleases(child.props.releases).includes(releaseValue));
}

// Release sélectionnée, avec la même priorité que les onglets :
// paramètre d'URL, puis choix mémorisé, puis V1c.
function useSelectedRelease() {
  const isBrowser = useIsBrowser();
  const location = useLocation();
  const [stored] = useStorageSlot(STORAGE_KEY);
  if (!isBrowser) {
    return DEFAULT_RELEASE;
  }
  const fromQuery = new URLSearchParams(location.search).get(QUERY_STRING);
  if (isRelease(fromQuery)) {
    return fromQuery;
  }
  return isRelease(stored) ? stored : DEFAULT_RELEASE;
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
  const items = RELEASES.map((release) => ({
    release,
    block: findBlock(children, release.value),
  })).filter((item) => item.block);

  if (items.length === 0) {
    return null;
  }

  const defaultValue = items.some((item) => item.release.value === DEFAULT_RELEASE)
    ? DEFAULT_RELEASE
    : items[items.length - 1].release.value;

  return (
    <Tabs groupId={GROUP_ID} queryString={QUERY_STRING} defaultValue={defaultValue}>
      {items.map(({ release, block }) => (
        <TabItem key={release.value} value={release.value} label={release.label}>
          {block.props.children}
        </TabItem>
      ))}
    </Tabs>
  );
}

// Barre d'onglets seule, pour choisir la release affichée par les <ReleaseValue>
// d'une page (par exemple au-dessus d'un tableau d'exigences).
export function ReleaseSelector() {
  return (
    <Tabs groupId={GROUP_ID} queryString={QUERY_STRING} defaultValue={DEFAULT_RELEASE}>
      {RELEASES.map((release) => (
        <TabItem key={release.value} value={release.value} label={release.label}>
          {null}
        </TabItem>
      ))}
    </Tabs>
  );
}

// Valeur en ligne (cellule de tableau, phrase) qui dépend de la release choisie.
// Exemple :
//   <ReleaseValue><Release releases="v1a v1b">WSEN-PADS</Release><Release releases="v1c">BME280</Release></ReleaseValue>
// La release affichée est rappelée par une étiquette.
export function ReleaseValue({ children }) {
  const selected = useSelectedRelease();
  const label = RELEASES.find((release) => release.value === selected).label;
  const block = findBlock(children, selected);
  return (
    <>
      {block ? block.props.children : '—'}{' '}
      <span className="badge badge--secondary" title="Valeur pour la release sélectionnée">
        {label}
      </span>
    </>
  );
}
