'use strict';

// ---------------------------------------------------------------------------
// QUANTUM SPIN — spin evaluation engine (pure, deterministic).
//
// spin() takes a fully-seeded RNG and a game config and returns a completely
// resolved outcome: the initial grid, every tumble/cascade, all line and
// scatter wins, any jackpot award, and free-spins bookkeeping. It NEVER touches
// balances or persistence — session.js does that. It NEVER reads Math.random —
// every draw comes from the provably-fair RNG so the whole result is a pure
// function of (serverSeed, clientSeed, nonce). The client can replay it.
//
// Mechanics implemented:
//   • Per-cell weighted reels (random-symbol-generator reels).
//   • 25 fixed paylines, left→right, with WILD substitution.
//   • Quantum Reactor tumbles: winning symbols removed, columns fall, refilled;
//     re-evaluated with a rising multiplier ladder until no new win.
//   • SCATTER (Quantum Portal) → free spins, evaluated on the initial drop.
//   • COIN collection → 4-tier progressive jackpot wheel.
//   • Per-spin win capped at config.maxWinX × total bet.
// ---------------------------------------------------------------------------

// Draw one full grid: an array of `reels` columns, each an array of `rows`
// symbol ids, using independent weighted draws. `excluded` symbols are skipped
// (used to keep SCATTER/COIN out of tumble refills).
function drawGrid(rng, config, excluded) {
  const { reels: grid } = config.grid;
  const cols = [];
  for (let r = 0; r < config.grid.reels; r++) {
    const table = filterTable(config.reels[r], excluded);
    const total = tableTotal(table);
    const col = [];
    for (let row = 0; row < config.grid.rows; row++) {
      col.push(table[rng.pickFrom(table, total)].id);
    }
    cols.push(col);
  }
  return cols;
}

// Draw a single new symbol for a given reel (used when refilling tumbled cells).
function drawCell(rng, config, reelIndex, excluded) {
  const table = filterTable(config.reels[reelIndex], excluded);
  const total = tableTotal(table);
  return table[rng.pickFrom(table, total)].id;
}

function filterTable(table, excluded) {
  if (!excluded || excluded.size === 0) return table;
  return table.filter((e) => !excluded.has(e.id));
}
function tableTotal(table) {
  let t = 0;
  for (const e of table) t += e.weight;
  return t;
}

// Evaluate all paylines on a grid. Returns { wins:[{line,symbol,count,positions,pay}], total }
// where `pay` is in multiples of the PER-LINE bet, and positions are [reel,row].
function evaluateLines(grid, config, lineBet) {
  const { lines } = config.grid;
  const wins = [];
  let total = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const first = grid[0][line[0]];
    // A line can't start on SCATTER/COIN (feature symbols never pay on lines).
    if (first === config.SYM.SCATTER || first === config.SYM.COIN) continue;

    // Determine the "paying symbol": the first non-wild symbol decides it; a
    // line of pure wilds pays as WILD.
    let paySymbol = first;
    if (first === config.SYM.WILD) {
      for (let c = 1; c < line.length; c++) {
        const s = grid[c][line[c]];
        if (s !== config.SYM.WILD) { paySymbol = s; break; }
      }
    }
    if (paySymbol === config.SYM.SCATTER || paySymbol === config.SYM.COIN) continue;

    // Count the leftmost run that is paySymbol or WILD.
    let count = 0;
    const positions = [];
    for (let c = 0; c < line.length; c++) {
      const s = grid[c][line[c]];
      const matches =
        s === paySymbol ||
        s === config.SYM.WILD ||
        (paySymbol === config.SYM.WILD && config.wildSubs.has(s));
      if (matches) {
        count++;
        positions.push([c, line[c]]);
      } else break;
    }

    if (count >= 3) {
      const row = config.paytable[paySymbol];
      if (row) {
        const pay = row[count - 3] * lineBet;
        if (pay > 0) {
          wins.push({ line: li, symbol: paySymbol, count, positions, pay });
          total += pay;
        }
      }
    }
  }
  return { wins, total };
}

// Count a specific symbol anywhere on the grid; return its positions too.
function countSymbol(grid, symbol) {
  const positions = [];
  for (let c = 0; c < grid.length; c++) {
    for (let row = 0; row < grid[c].length; row++) {
      if (grid[c][row] === symbol) positions.push([c, row]);
    }
  }
  return positions;
}

// Remove the winning positions from the grid, let columns fall, refill the top.
// Returns { grid: newGrid, refilled: [[reel,row], ...] }.
function tumble(grid, winningPositions, rng, config) {
  const remove = new Set(winningPositions.map(([c, r]) => `${c},${r}`));
  const excluded = new Set([config.SYM.SCATTER, config.SYM.COIN]); // no features on refill
  const newGrid = [];
  const refilled = [];
  for (let c = 0; c < grid.length; c++) {
    // keep survivors in order (top→bottom), drop removed
    const survivors = [];
    for (let r = 0; r < grid[c].length; r++) {
      if (!remove.has(`${c},${r}`)) survivors.push(grid[c][r]);
    }
    const missing = grid[c].length - survivors.length;
    const col = new Array(grid[c].length);
    // new symbols fall in at the top
    for (let r = 0; r < missing; r++) {
      col[r] = drawCell(rng, config, c, excluded);
      refilled.push([c, r]);
    }
    // survivors settle below
    for (let r = 0; r < survivors.length; r++) col[missing + r] = survivors[r];
    newGrid.push(col);
  }
  return { grid: newGrid, refilled };
}

/**
 * Run one full spin.
 *
 * @param {object}  args
 * @param {object}  args.config    resolved game config (see config.makeConfig)
 * @param {object}  args.rng       a seeded ProvablyFairRNG for THIS spin
 * @param {number}  args.lineBet   stake per payline
 * @param {number}  args.lines     number of active paylines (== config lines)
 * @param {boolean} args.isFree    true when this is a free spin (rich ladder)
 * @param {object}  args.pools     current progressive jackpot pools by tier
 * @returns {object} a fully-resolved, client-replayable spin result
 */
function spin({ config, rng, lineBet, isFree = false, pools = {} }) {
  const totalBet = lineBet * config.grid.lines.length;
  const ladder = isFree ? config.ladderFree : config.ladderBase;

  // 1) Initial drop.
  const initialGrid = drawGrid(rng, config, null);

  // 2) Feature detection on the initial drop (scatters + coins only count here).
  const scatterPos = countSymbol(initialGrid, config.SYM.SCATTER);
  const coinPos = countSymbol(initialGrid, config.SYM.COIN);
  const scatterCount = scatterPos.length;
  const coinCount = coinPos.length;

  // 3) Tumble sequence — evaluate lines, remove winners, refill, repeat.
  const steps = [];
  let grid = initialGrid;
  let stepIndex = 0;
  let lineWinTotal = 0;
  while (true) {
    const { wins, total } = evaluateLines(grid, config, lineBet);
    if (wins.length === 0 || total <= 0) {
      steps.push({ grid: clone(grid), wins: [], multiplier: 0, stepWin: 0, refilled: [] });
      break;
    }
    const mult = ladder[Math.min(stepIndex, ladder.length - 1)];
    const stepWin = total * mult;
    lineWinTotal += stepWin;

    const winningPositions = [];
    for (const w of wins) for (const p of w.positions) winningPositions.push(p);
    const { grid: nextGrid, refilled } = tumble(grid, winningPositions, rng, config);

    steps.push({
      grid: clone(grid),
      wins,
      multiplier: mult,
      stepWin: round2(stepWin),
      removed: winningPositions,
      refilled,
    });
    grid = nextGrid;
    stepIndex++;
  }
  const finalMultiplier = ladder[Math.min(Math.max(stepIndex - 1, 0), ladder.length - 1)];

  // 4) Scatter pay (anywhere, × total bet).
  const scatterWin =
    scatterCount >= 3 ? (config.scatterPay[Math.min(scatterCount, 5)] || 0) * totalBet : 0;

  // 5) Free-spins trigger / retrigger.
  let freeSpinsAwarded = 0;
  if (scatterCount >= 3) {
    freeSpinsAwarded = isFree
      ? config.freeSpinsRetrigger
      : config.freeSpinsAward[Math.min(scatterCount, 5)] || 0;
  }

  // 6) Quantum Vault jackpot — a bet-scaled mystery roll, funded separately from
  //    the base RTP. Rolled once per paid spin.
  const jackpot = maybeJackpot(totalBet, pools, config, rng);

  // 7) Totals + cap.
  let win = round2(lineWinTotal + scatterWin);
  const jackpotWin = jackpot ? jackpot.amount : 0;
  const capped = Math.min(win, config.maxWinX * totalBet);
  const cappedAtMax = capped < win;
  win = round2(capped);

  return {
    layout: config.layout,
    totalBet: round2(totalBet),
    lineBet: round2(lineBet),
    isFree,
    initialGrid,
    steps,
    finalGrid: clone(grid),
    lineWin: round2(lineWinTotal),
    scatter: { count: scatterCount, positions: scatterPos, win: round2(scatterWin) },
    coins: { count: coinCount, positions: coinPos },
    jackpot,
    freeSpins: {
      triggered: freeSpinsAwarded > 0 && !isFree,
      retriggered: freeSpinsAwarded > 0 && isFree,
      awarded: freeSpinsAwarded,
    },
    multiplier: finalMultiplier,
    cappedAtMax,
    // `win` is the WIN FROM PAYLINES+SCATTER only. Jackpot is paid separately so
    // it is auditable independently and can bypass the per-spin max-win cap.
    win,
    jackpotWin: round2(jackpotWin),
    totalPayout: round2(win + jackpotWin),
  };
}

// Bet-scaled per-spin jackpot trigger. Returns a jackpot award or null. The
// trigger draw is taken from the same provably-fair stream, so whether a spin
// hits the jackpot is fully replayable by the player.
function maybeJackpot(totalBet, pools, config, rng) {
  const jc = config.jackpots;
  // chance scales linearly with bet from the reference point, capped.
  const scaled = jc.triggerBaseChance * (totalBet / jc.triggerRefBet);
  const chance = Math.min(scaled, jc.triggerMaxChance);
  if (rng.next() >= chance) return null;
  return rollJackpot(pools, config, rng);
}

// Weighted jackpot tier draw + payout. Awards seed + current progressive pool.
function rollJackpot(pools, config, rng) {
  const jc = config.jackpots;
  const entries = jc.order.map((tier) => ({ id: tier, weight: jc.tierWeights[tier] || 0 }));
  const idx = rng.weighted(entries);
  const tier = entries[idx].id;
  const seed = jc.seeds[tier];
  const progressive = pools[tier] || 0;
  const amount = round2(seed + progressive);
  return { won: true, tier, seed, progressive: round2(progressive), amount };
}

// Deep clone a grid (array of columns) so mutation of one step can't leak.
function clone(grid) {
  return grid.map((col) => col.slice());
}
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { spin, evaluateLines, drawGrid, tumble, countSymbol, rollJackpot, maybeJackpot };
