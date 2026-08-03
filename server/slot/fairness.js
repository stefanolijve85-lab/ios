'use strict';

// ---------------------------------------------------------------------------
// Commit–reveal fairness for QUANTUM SPIN.
//
// Lifecycle of a server seed (a "fairness epoch"):
//   1. Server generates serverSeed (32 random bytes) and publishes only its
//      SHA-256 hash — the COMMITMENT — to the player. This happens before any
//      spin on that seed, so the server is bound to it.
//   2. The player spins N times. Each spin uses (serverSeed, clientSeed, nonce)
//      with nonce = 0,1,2,… The result of every spin is fully determined by
//      those inputs (see rng.js + engine.js), so nothing can be altered after
//      the fact.
//   3. When the player rotates their seed (or logs out), the server REVEALS the
//      old serverSeed. The player checks:
//         sha256(serverSeed) === commitment
//      and can then replay every past spin locally to confirm each outcome.
//
// This module only handles seed material + the commitment hash. The actual
// outcome derivation lives in engine.js so it can be shared and audited in one
// place. Standard primitives only (SHA-256 / HMAC-SHA256) — no custom crypto.
// ---------------------------------------------------------------------------

const crypto = require('crypto');

function generateServerSeed() {
  return crypto.randomBytes(32).toString('hex');
}

// A reasonable default client seed if the player does not supply one.
function generateClientSeed() {
  return crypto.randomBytes(8).toString('hex');
}

// SHA-256 commitment of the hex server seed string (utf-8), shown before play.
function commitment(serverSeed) {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

// Convenience: verify a revealed seed against a previously published hash.
function verifyCommitment(serverSeed, publishedHash) {
  return commitment(serverSeed).toLowerCase() === String(publishedHash).toLowerCase();
}

module.exports = {
  generateServerSeed,
  generateClientSeed,
  commitment,
  verifyCommitment,
};
