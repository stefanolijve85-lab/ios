'use strict';

// ---------------------------------------------------------------------------
// Deterministic, provably-fair random stream for QUANTUM SPIN.
//
// Every random decision a spin makes (reel stops, tumble refills, jackpot roll)
// is drawn from a single deterministic byte stream derived from:
//
//     HMAC-SHA256( key = serverSeed, msg = `${clientSeed}:${nonce}:${cursor}` )
//
//   * serverSeed  — 32 secret bytes the server COMMITS to (publishes SHA-256)
//                   before the player spins. Revealed afterwards for audit.
//   * clientSeed  — chosen by the player (or a browser-random default). Lets the
//                   player inject entropy the server cannot predict.
//   * nonce       — the spin index for this (serverSeed, clientSeed) pair. It
//                   increments every spin so no two spins share a stream.
//   * cursor      — internal counter so one spin can pull unlimited bytes by
//                   chaining HMAC blocks (block 0, block 1, …).
//
// Because the whole stream is a pure function of those four inputs, the client
// mirror in src/game/fairness.ts reproduces it byte-for-byte and can re-run any
// spin. This is standard commit–reveal; we design no novel cryptography.
// ---------------------------------------------------------------------------

const crypto = require('crypto');

class ProvablyFairRNG {
  /**
   * @param {string} serverSeed 64-char hex string (32 bytes)
   * @param {string} clientSeed player-supplied entropy string
   * @param {number} nonce      monotonically increasing spin counter
   */
  constructor(serverSeed, clientSeed, nonce) {
    this.serverSeed = serverSeed;
    this.clientSeed = clientSeed;
    this.nonce = nonce;
    this.cursor = 0; // which HMAC block we are on
    this.buffer = Buffer.alloc(0);
    this.bufPos = 0;
  }

  // Refill the byte buffer with the next HMAC block.
  _block() {
    const msg = `${this.clientSeed}:${this.nonce}:${this.cursor}`;
    const block = crypto
      .createHmac('sha256', this.serverSeed)
      .update(msg)
      .digest();
    this.cursor += 1;
    this.buffer = block; // 32 bytes
    this.bufPos = 0;
  }

  // Next single byte [0,255].
  nextByte() {
    if (this.bufPos >= this.buffer.length) this._block();
    return this.buffer[this.bufPos++];
  }

  // A float in [0,1) built from 4 fresh bytes (32-bit resolution).
  next() {
    const b0 = this.nextByte();
    const b1 = this.nextByte();
    const b2 = this.nextByte();
    const b3 = this.nextByte();
    const u = b0 * 0x1000000 + (b1 << 16) + (b2 << 8) + b3; // 0 .. 2^32-1
    return u / 0x100000000;
  }

  // Integer in [0, max).
  int(max) {
    return Math.floor(this.next() * max);
  }

  /**
   * Weighted pick over an array of { weight } entries.
   * Returns the chosen index. Total weight is summed each call so callers may
   * pass any weighted list; hot paths precompute the total and use pickFrom().
   */
  weighted(entries) {
    let total = 0;
    for (const e of entries) total += e.weight;
    return this.pickFrom(entries, total);
  }

  // Weighted pick when the total weight is already known (avoids re-summing).
  pickFrom(entries, total) {
    let r = this.next() * total;
    for (let i = 0; i < entries.length; i++) {
      r -= entries[i].weight;
      if (r < 0) return i;
    }
    return entries.length - 1; // floating-point safety net
  }
}

module.exports = { ProvablyFairRNG };
