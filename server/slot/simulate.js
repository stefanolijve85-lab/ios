'use strict';

// ---------------------------------------------------------------------------
// RTP / volatility simulator for QUANTUM SPIN.
//
// Runs N full rounds through the real engine (the same code that serves live
// spins) and reports return-to-player, hit rate, feature frequency and the
// jackpot contribution. This is the audit tool: any weight change in config.js
// is validated here against the target RTP band before it ships.
//
//   node server/slot/simulate.js [spins] [rtpBand]
//   e.g.  node server/slot/simulate.js 2000000 96
// ---------------------------------------------------------------------------

const crypto = require('crypto');
const { makeConfig } = require('./config');
const { spin } = require('./engine');
const { ProvablyFairRNG } = require('./rng');

function run(spins, band) {
  const config = makeConfig({ rtp: band, layout: '5x3' });
  const lineBet = 1; // per-line stake of 1 → total bet = number of lines
  const totalBetPer = lineBet * config.grid.lines.length;

  const serverSeed = crypto.randomBytes(32).toString('hex');
  const clientSeed = 'sim';

  // progressive pools grow from bets and reset when a tier is won.
  const pools = { MINI: 0, MINOR: 0, MAJOR: 0, GRAND: 0 };
  const jc = config.jackpots;

  let wagered = 0;
  let returned = 0;
  let jackpotReturned = 0;
  let hits = 0;
  let fsTriggers = 0;
  let jackpotHits = 0;
  let maxWin = 0;
  const tierCounts = { MINI: 0, MINOR: 0, MAJOR: 0, GRAND: 0 };
  let nonce = 0;

  for (let i = 0; i < spins; i++) {
    wagered += totalBetPer;
    // grow the progressive pools from this bet
    for (const t of jc.order) pools[t] += jc.rate[t] * totalBetPer;

    const rng = new ProvablyFairRNG(serverSeed, clientSeed, nonce++);
    const r = spin({ config, rng, lineBet, isFree: false, pools });

    let roundWin = r.win;
    if (r.jackpot) {
      jackpotHits++;
      tierCounts[r.jackpot.tier]++;
      jackpotReturned += r.jackpotWin;
      pools[r.jackpot.tier] = 0; // reset won tier
    }

    // resolve free spins to completion
    if (r.freeSpins.awarded > 0) {
      fsTriggers++;
      let remaining = r.freeSpins.awarded;
      while (remaining > 0) {
        remaining--;
        const frng = new ProvablyFairRNG(serverSeed, clientSeed, nonce++);
        const fr = spin({ config, rng: frng, lineBet, isFree: true, pools });
        roundWin += fr.win;
        if (fr.jackpot) {
          jackpotHits++;
          tierCounts[fr.jackpot.tier]++;
          jackpotReturned += fr.jackpotWin;
          pools[fr.jackpot.tier] = 0;
        }
        if (fr.freeSpins.awarded > 0) remaining += fr.freeSpins.awarded;
      }
    }

    if (roundWin > 0) hits++;
    if (roundWin > maxWin) maxWin = roundWin;
    returned += roundWin;
  }

  const baseReturned = returned; // lines + scatter + free spins
  const rtpBase = (baseReturned / wagered) * 100;
  const rtpJackpot = (jackpotReturned / wagered) * 100;
  const rtpTotal = ((baseReturned + jackpotReturned) / wagered) * 100;

  console.log('─'.repeat(58));
  console.log(`QUANTUM SPIN — RTP simulation  (band ${band}%, ${spins.toLocaleString()} spins)`);
  console.log('─'.repeat(58));
  console.log(`Base + feature RTP : ${rtpBase.toFixed(3)}%`);
  console.log(`Jackpot RTP        : ${rtpJackpot.toFixed(3)}%`);
  console.log(`TOTAL RTP          : ${rtpTotal.toFixed(3)}%`);
  console.log(`Hit rate           : ${((hits / spins) * 100).toFixed(2)}%`);
  console.log(`Free-spins trigger : 1 in ${(spins / Math.max(fsTriggers, 1)).toFixed(0)}`);
  console.log(`Jackpot trigger    : 1 in ${(spins / Math.max(jackpotHits, 1)).toFixed(0)}`);
  console.log(`  tiers            : ${JSON.stringify(tierCounts)}`);
  console.log(`Max single win     : ${maxWin.toFixed(2)}× line (${(maxWin / totalBetPer).toFixed(1)}× bet)`);
  console.log('─'.repeat(58));
  return rtpTotal;
}

if (require.main === module) {
  const spins = parseInt(process.argv[2] || '500000', 10);
  const band = process.argv[3] || '96';
  run(spins, band);
}

module.exports = { run };
