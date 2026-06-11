/** Store selector: PostgreSQL when DATABASE_URL is set, otherwise in-memory. */
import type { Store } from './types.js';
import { MemoryStore } from './memory.js';
import { PostgresStore } from './postgres.js';

let store: Store;

export function getStore(): Store {
  if (!store) {
    const url = process.env.DATABASE_URL;
    if (url) {
      store = new PostgresStore(url);
      console.log('[db] using PostgreSQL');
    } else {
      store = new MemoryStore();
      console.log('[db] DATABASE_URL not set — using in-memory store (data resets on restart)');
    }
  }
  return store;
}

export type { Store } from './types.js';
export * from './types.js';
