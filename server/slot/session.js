'use strict';

// ---------------------------------------------------------------------------
// Player sessions for QUANTUM SPIN — the server-authoritative state.
//
// A session owns everything money- and fairness-critical:
//   • balance                         — the only source of truth for funds
//   • serverSeed / hash / clientSeed  — the provably-fair commit-reveal material
//   • nonce                           — the spin counter bound into every result
//   • freeSpins                       — feature bookkeeping (server-driven)
//   • history                         — recorded rounds for the verify page
//
// The client can request spins but never computes an outcome or edits a balance.
// Every spin runs the shared engine with a freshly-seeded RNG, so the whole
// result is a pure function of (serverSeed, clientSeed, nonce) and replayable.
//
// In-memory Map for the MVP; the same interface maps 1:1 onto Postgres/Prisma
// (players, rounds) + Redis (live balance) in the Beta phase — see the plan.
// ---------------------------------------------------------------------------

const crypto = require('crypto');
const fairness = require('./fairness');
const { makeConfig } = require('./config');
const { spin } = require('./engine');
const { ProvablyFairRNG } = require('./rng');
const { pools } = require('./pools');

// Canonical, order-stable hash of the parts of an outcome that must be provably
// reproducible. The client recomputes this from the revealed seed and compares.
function outcomeHash(result) {
  const canonical = JSON.stringify({
    initialGrid: result.initialGrid,
    steps: result.steps.map((s) => ({ g: s.grid, w: s.stepWin, m: s.multiplier })),
    win: result.win,
    scatter: result.scatter.count,
    jackpot: result.jackpot ? { tier: result.jackpot.tier, amount: result.jackpot.amount } : null,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

class Session {
  constructor(id, { rtp = '96', layout = '5x3', startingBalance = 10000 } = {}) {
    this.id = id;
    this.config = makeConfig({ rtp, layout });
    this.balance = startingBalance;
    this.currency = this.config.bet.currency;
    // XP / level are cosmetic progression, not money.
    this.xp = 0;
    this.level = 1;
    this._newSeedEpoch(fairness.generateClientSeed());
    this.freeSpins = { active: false, remaining: 0, total: 0, totalWin: 0, triggerBet: 0 };
    this.history = []; // most-recent-last, capped
  }

  // Begin a fresh fairness epoch: commit to a new server seed, reset nonce.
  _newSeedEpoch(clientSeed) {
    this.serverSeed = fairness.generateServerSeed();
    this.serverSeedHash = fairness.commitment(this.serverSeed);
    this.clientSeed = clientSeed;
    this.nonce = 0;
  }

  get lineCount() {
    return this.config.grid.lines.length;
  }

  // Public, safe snapshot of the session (never leaks the un-revealed seed).
  publicState() {
    return {
      id: this.id,
      balance: round2(this.balance),
      currency: this.currency,
      xp: this.xp,
      level: this.level,
      lines: this.lineCount,
      lineBets: this.config.bet.lineBets,
      rtpBand: this.config.rtpBand,
      layout: this.config.layout,
      buyFeatureCost: this.config.buyFeatureCost,
      fairness: {
        serverSeedHash: this.serverSeedHash, // commitment (safe to publish)
        clientSeed: this.clientSeed,
        nonce: this.nonce,
      },
      freeSpins: { ...this.freeSpins },
      jackpots: pools.snapshot(),
    };
  }

  setClientSeed(seed) {
    if (typeof seed === 'string' && seed.trim()) {
      this.clientSeed = seed.trim().slice(0, 128);
    }
    return this.clientSeed;
  }

  // Reveal the current server seed and rotate to a new committed one. This is
  // how a player proves past rounds: they receive the seed, check the hash, and
  // can replay every nonce they played on it.
  rotateSeed(newClientSeed) {
    const revealed = {
      serverSeed: this.serverSeed,
      serverSeedHash: this.serverSeedHash,
      clientSeed: this.clientSeed,
      spins: this.nonce,
    };
    this._newSeedEpoch(newClientSeed && newClientSeed.trim() ? newClientSeed.trim().slice(0, 128) : fairness.generateClientSeed());
    return {
      revealed,
      next: { serverSeedHash: this.serverSeedHash, clientSeed: this.clientSeed, nonce: 0 },
    };
  }

  _award(xp) {
    this.xp += xp;
    // simple square-root level curve: level N needs 100*N^2 xp
    while (this.xp >= 100 * this.level * this.level) this.level += 1;
  }

  // Play-money top-up (the balance "+"). Bounded so a session can't be inflated
  // without limit; real-money integration replaces this with a PSP deposit.
  credit(amount) {
    const add = Math.max(0, Math.min(Number(amount) || 0, 5000));
    const CAP = 1000000;
    this.balance = round2(Math.min(this.balance + add, CAP));
    return { credited: add, balance: this.balance };
  }

  // A once-per-day reward (per session for the MVP). Scales with level.
  claimDaily() {
    const today = new Date().toISOString().slice(0, 10);
    if (this._dailyClaimed === today) {
      return { claimed: false, reason: 'ALREADY_CLAIMED', balance: this.balance };
    }
    this._dailyClaimed = today;
    const amount = 250 + this.level * 50;
    this.balance = round2(this.balance + amount);
    this._award(25);
    return { claimed: true, amount, balance: this.balance };
  }

  _record(round) {
    this.history.push(round);
    if (this.history.length > 200) this.history.shift();
  }

  /**
   * Run one spin. Charges the bet on a base spin; free spins are free. Returns
   * the full engine result plus the new public state.
   *
   * @param {number} lineBet stake per line (must be one of config.bet.lineBets)
   * @param {boolean} turbo  cosmetic only — the server result is identical
   */
  spin(lineBet, turbo = false) {
    const isFree = this.freeSpins.active && this.freeSpins.remaining > 0;

    let stake = 0;
    if (isFree) {
      lineBet = this.freeSpins.triggerBet; // free spins replay the trigger stake
    } else {
      lineBet = this._validateLineBet(lineBet);
      stake = round2(lineBet * this.lineCount);
      if (stake > this.balance) {
        const err = new Error('INSUFFICIENT_FUNDS');
        err.code = 'INSUFFICIENT_FUNDS';
        throw err;
      }
      this.balance = round2(this.balance - stake);
      pools.contribute(stake); // paid spins grow the progressive pools
    }

    const nonce = this.nonce;
    const rng = new ProvablyFairRNG(this.serverSeed, this.clientSeed, nonce);
    this.nonce += 1;

    const result = spin({
      config: this.config,
      rng,
      lineBet,
      isFree,
      pools: pools.raw(),
    });
    result.nonce = nonce;
    result.serverSeedHash = this.serverSeedHash;
    result.clientSeed = this.clientSeed;
    result.hash = outcomeHash(result);

    // Credit winnings.
    const payout = round2(result.win + result.jackpotWin);
    this.balance = round2(this.balance + payout);
    if (result.jackpot) pools.award(result.jackpot.tier);

    // Free-spins bookkeeping.
    if (isFree) {
      this.freeSpins.remaining -= 1;
      this.freeSpins.totalWin = round2(this.freeSpins.totalWin + payout);
      if (result.freeSpins.awarded > 0) {
        this.freeSpins.remaining += result.freeSpins.awarded;
        this.freeSpins.total += result.freeSpins.awarded;
      }
      if (this.freeSpins.remaining <= 0) {
        result.featureSummary = { totalWin: this.freeSpins.totalWin, spins: this.freeSpins.total };
        this.freeSpins = { active: false, remaining: 0, total: 0, totalWin: 0, triggerBet: 0 };
      }
    } else if (result.freeSpins.awarded > 0) {
      this.freeSpins = {
        active: true,
        remaining: result.freeSpins.awarded,
        total: result.freeSpins.awarded,
        totalWin: round2(payout),
        triggerBet: lineBet,
      };
    }

    this._award(Math.max(1, Math.round((stake || result.totalBet) / 1)));

    this._record({
      nonce,
      isFree,
      lineBet,
      totalBet: result.totalBet,
      win: result.win,
      jackpotWin: result.jackpotWin,
      serverSeedHash: this.serverSeedHash,
      clientSeed: this.clientSeed,
      hash: result.hash,
    });

    return { result, state: this.publicState() };
  }

  // Buy the Quantum Portal feature: pay cost × total bet, enter free spins now.
  buyFeature(lineBet) {
    if (this.freeSpins.active) {
      const err = new Error('FEATURE_ACTIVE');
      err.code = 'FEATURE_ACTIVE';
      throw err;
    }
    lineBet = this._validateLineBet(lineBet);
    const totalBet = round2(lineBet * this.lineCount);
    const cost = round2(totalBet * this.config.buyFeatureCost);
    if (cost > this.balance) {
      const err = new Error('INSUFFICIENT_FUNDS');
      err.code = 'INSUFFICIENT_FUNDS';
      throw err;
    }
    this.balance = round2(this.balance - cost);
    pools.contribute(cost);
    // Guaranteed entry with the base 3-scatter award.
    const award = this.config.freeSpinsAward[3];
    this.freeSpins = {
      active: true,
      remaining: award,
      total: award,
      totalWin: 0,
      triggerBet: lineBet,
    };
    this._award(Math.round(cost));
    return { cost, freeSpins: { ...this.freeSpins }, state: this.publicState() };
  }

  _validateLineBet(lineBet) {
    const bets = this.config.bet.lineBets;
    // snap to the nearest allowed stake to reject tampered values
    let best = bets[0];
    let bestD = Infinity;
    for (const b of bets) {
      const d = Math.abs(b - lineBet);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  // Recompute a past round from its seed material (used by the verify endpoint).
  // `expectedHash` is the commitment the player was shown for that seed epoch;
  // hashOk proves the revealed seed matches it. The full, trustless check runs
  // in the browser (src/game/engine.ts) — this endpoint is a convenience mirror.
  verify(serverSeed, clientSeed, nonce, expectedHash, lineBet = 0.1, isFree = false) {
    const computedHash = fairness.commitment(serverSeed);
    const hashOk = expectedHash
      ? computedHash.toLowerCase() === String(expectedHash).toLowerCase()
      : null;
    const rng = new ProvablyFairRNG(serverSeed, clientSeed, nonce);
    const result = spin({ config: this.config, rng, lineBet, isFree, pools: {} });
    return { hashOk, commitment: computedHash, result, hash: outcomeHash(result) };
  }
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ---- Session registry ----------------------------------------------------
const sessions = new Map();

function createSession(opts) {
  const id = crypto.randomBytes(16).toString('hex');
  const s = new Session(id, opts);
  sessions.set(id, s);
  return s;
}
function getSession(id) {
  return sessions.get(id);
}
function dropSession(id) {
  sessions.delete(id);
}

// Evict idle sessions periodically so the in-memory store stays bounded.
setInterval(() => {
  // (MVP: no timestamps kept; cap total sessions instead)
  if (sessions.size > 5000) {
    const excess = sessions.size - 5000;
    let i = 0;
    for (const key of sessions.keys()) {
      if (i++ >= excess) break;
      sessions.delete(key);
    }
  }
}, 60000).unref?.();

module.exports = { Session, createSession, getSession, dropSession, outcomeHash };
