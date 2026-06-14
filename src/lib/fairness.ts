// In-browser mirror of server/fairness.js so a player can independently verify
// any round. Uses the Web Crypto API (SHA-256 + HMAC-SHA256). The maths must
// stay byte-for-byte identical to the server.

import { HOUSE_EDGE, MAX_MULTIPLIER } from './constants';

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return toHex(digest);
}

async function hmacSha256(keyStr: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return new Uint8Array(sig);
}

function u32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

// Deterministic crash point from a seed — mirror of crashPointFromSeed().
export async function crashPointFromSeed(serverSeed: string, roundId: number): Promise<number> {
  const h = await hmacSha256(serverSeed, String(roundId));
  const u1 = u32BE(h, 0) / 0x100000000;
  const u2 = u32BE(h, 4) / 0x100000000;
  if (u1 < HOUSE_EDGE) return 1.0;
  let cp = (1 - HOUSE_EDGE) / (1 - u2);
  cp = Math.max(1.01, Math.min(cp, MAX_MULTIPLIER));
  return Math.floor(cp * 100) / 100;
}

export interface VerifyResult {
  hashOk: boolean;   // SHA256(serverSeed) === committed hash
  crashOk: boolean;  // recomputed crash point === the one that was played
  computedHash: string;
  computedCrash: number;
}

export async function verifyRound(
  serverSeed: string,
  serverSeedHash: string,
  roundId: number,
  crashPoint: number,
): Promise<VerifyResult> {
  const computedHash = await sha256Hex(serverSeed);
  const computedCrash = await crashPointFromSeed(serverSeed, roundId);
  return {
    hashOk: computedHash.toLowerCase() === serverSeedHash.toLowerCase(),
    crashOk: Math.abs(computedCrash - crashPoint) < 0.005,
    computedHash,
    computedCrash,
  };
}
