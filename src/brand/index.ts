// Single source of truth for the publisher / umbrella brand. Every game is
// "An OliveX game". Change PUBLISHER here and it updates everywhere (footers,
// fairness modal, themes, metadata). Name is provisional — easy to swap.

export const PUBLISHER = 'OliveX';
export const PUBLISHER_URL = 'https://olivex.gg'; // placeholder — set once the domain is locked

// Catalog of titles under the brand. Drives the (future) hub page and keeps the
// line-up in one place. `live: false` games are stubs until their art lands.
export interface CatalogEntry {
  key: string;     // theme/game key
  name: string;    // display name
  domain: string;  // its own domain
  tagline: string;
  live: boolean;
}

export const CATALOG: CatalogEntry[] = [
  { key: 'bankheistx', name: 'BANKHEIST X', domain: 'bankheistx.com', tagline: 'Lock it in. Cash out big.', live: true },
  { key: 'liftoffx', name: 'LIFTOFF X', domain: 'liftoffx.com', tagline: 'Ride it. Eject big.', live: false },
];

export const creditLine = () => `An ${PUBLISHER} game`;
