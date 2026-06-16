// Launch tokens — how an operator / aggregator hands a player off to the game.
//
// The operator generates a short-lived signed token (server-to-server, using a
// shared secret) and opens the game at e.g.
//     https://<game>/<gameKey>?gt=<token>
// The game server verifies the signature, reads who the player is + which
// currency + real/demo, and opens a session. The token is opaque to the client
// and cannot be forged or tampered with without the secret.
//
// Format (compact, dependency-free):  base64url(payloadJSON).base64url(hmac)

const crypto = require('crypto');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) {
  return b64url(JSON.stringify(obj));
}
function fromB64url(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payloadB64, secret) {
  return b64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());
}

// Build a launch token. `claims` carries the operator's player handoff:
//   { operatorId, playerId, currency, gameKey, mode, ... }
function create(claims, secret, ttlSec = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + ttlSec, ...claims };
  const payloadB64 = b64urlJson(payload);
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

// Verify + decode. Returns the claims, or throws on any tampering/expiry.
function verify(token, secret) {
  if (typeof token !== 'string' || token.indexOf('.') < 0) throw new Error('malformed token');
  const [payloadB64, sig] = token.split('.');
  const expected = sign(payloadB64, secret);
  // constant-time comparison
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('bad signature');
  let claims;
  try {
    claims = JSON.parse(fromB64url(payloadB64).toString('utf8'));
  } catch {
    throw new Error('bad payload');
  }
  if (claims.exp && Math.floor(Date.now() / 1000) > claims.exp) throw new Error('token expired');
  return claims;
}

module.exports = { create, verify };
