// Browser mirror of server/slot/rng.js (ProvablyFairRNG).
//
// The server draws from HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`)
// blocks, reading bytes sequentially, 4 bytes → one [0,1) float. Web Crypto is
// async, so we PRE-COMPUTE a pool of blocks up front (one spin needs only a few
// hundred bytes) and then draw from it synchronously — byte-for-byte identical
// to the server stream.

import { hmacSha256 } from './fairness';

export class PfRng {
  private pool: Uint8Array;
  private pos = 0;

  private constructor(pool: Uint8Array) {
    this.pool = pool;
  }

  // Pre-compute `blocks` × 32 bytes of the deterministic stream.
  static async create(serverSeed: string, clientSeed: string, nonce: number, blocks = 256): Promise<PfRng> {
    const chunks: Uint8Array[] = [];
    for (let cursor = 0; cursor < blocks; cursor++) {
      chunks.push(await hmacSha256(serverSeed, `${clientSeed}:${nonce}:${cursor}`));
    }
    const pool = new Uint8Array(blocks * 32);
    chunks.forEach((c, i) => pool.set(c, i * 32));
    return new PfRng(pool);
  }

  nextByte(): number {
    if (this.pos >= this.pool.length) {
      throw new Error('PfRng pool exhausted — increase blocks');
    }
    return this.pool[this.pos++];
  }

  next(): number {
    const b0 = this.nextByte();
    const b1 = this.nextByte();
    const b2 = this.nextByte();
    const b3 = this.nextByte();
    const u = b0 * 0x1000000 + (b1 << 16) + (b2 << 8) + b3;
    return u / 0x100000000;
  }

  pickFrom<T extends { weight: number }>(entries: T[], total: number): number {
    let r = this.next() * total;
    for (let i = 0; i < entries.length; i++) {
      r -= entries[i].weight;
      if (r < 0) return i;
    }
    return entries.length - 1;
  }

  weighted<T extends { weight: number }>(entries: T[]): number {
    let total = 0;
    for (const e of entries) total += e.weight;
    return this.pickFrom(entries, total);
  }
}
