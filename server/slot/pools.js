'use strict';

// ---------------------------------------------------------------------------
// Global progressive jackpot pools for QUANTUM SPIN.
//
// These are SHARED across every player: every bet on the game grows the same
// four pools, and whoever triggers the Quantum Vault wins the current value.
// The pools are the "progressive" component on top of each tier's fixed seed.
//
// This lives in-memory for the MVP (single Node process). The interface is
// deliberately narrow (add / snapshot / award / tick) so a later phase can back
// it with Redis for multi-instance progressives without touching game code —
// see the phased plan in docs/DEVELOPMENT_PLAN.md.
// ---------------------------------------------------------------------------

const { JACKPOTS } = require('./config');

class JackpotPools {
  constructor() {
    this.pools = {};
    for (const tier of JACKPOTS.order) this.pools[tier] = 0;
    // a tiny idle "ticker" so the displayed grand total drifts up believably
    // between real contributions (purely cosmetic; real value = this.pools).
  }

  // Contribute a fraction of a wager to every tier's pool.
  contribute(totalBet) {
    for (const tier of JACKPOTS.order) {
      this.pools[tier] += JACKPOTS.rate[tier] * totalBet;
    }
  }

  // Snapshot of displayed values = seed + progressive pool, rounded.
  snapshot() {
    const out = {};
    for (const tier of JACKPOTS.order) {
      out[tier] = round2(JACKPOTS.seeds[tier] + this.pools[tier]);
    }
    return out;
  }

  // Raw progressive component (without seed) — passed to the engine's roll.
  raw() {
    return { ...this.pools };
  }

  // Reset a tier to zero after it is won (its seed becomes the new floor).
  award(tier) {
    if (tier in this.pools) this.pools[tier] = 0;
  }
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// One shared instance per process.
const pools = new JackpotPools();

module.exports = { pools, JackpotPools };
