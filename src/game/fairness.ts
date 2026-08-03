// In-browser SHA-256 / HMAC-SHA256 via the Web Crypto API. Mirrors
// server/slot/fairness.js + rng.js so a player can verify a round with zero
// trust in the server. Standard primitives only.

const enc = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return toHex(new Uint8Array(digest));
}

// The commitment: SHA-256 of the hex server-seed string (utf-8).
export const commitment = sha256Hex;

export async function hmacSha256(keyStr: string, message: string): Promise<Uint8Array> {
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
