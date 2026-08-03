// Browser port of server/slot/engine.js — used ONLY by the verify page to
// re-derive a round from its revealed seed with zero trust in the server. The
// draw ORDER here is identical to the server: initial grid (reel-major,
// row-minor), then per-tumble refills, then the jackpot roll. Any divergence
// makes verification of a real round fail, which is the intended tripwire.

import type { PfRng } from './rng';
import type { ResolvedConfig, SymbolId, WeightEntry } from './config';
import type { Grid, LineWin, TumbleStep, SpinResult } from './types';

function tableTotal(table: WeightEntry[]): number {
  let t = 0;
  for (const e of table) t += e.weight;
  return t;
}
function filterTable(table: WeightEntry[], excluded: Set<SymbolId> | null): WeightEntry[] {
  if (!excluded || excluded.size === 0) return table;
  return table.filter((e) => !excluded.has(e.id));
}

function drawGrid(rng: PfRng, config: ResolvedConfig, excluded: Set<SymbolId> | null): Grid {
  const cols: Grid = [];
  for (let r = 0; r < config.grid.reels; r++) {
    const table = filterTable(config.reels[r], excluded);
    const total = tableTotal(table);
    const col: SymbolId[] = [];
    for (let row = 0; row < config.grid.rows; row++) {
      col.push(table[rng.pickFrom(table, total)].id);
    }
    cols.push(col);
  }
  return cols;
}

function drawCell(rng: PfRng, config: ResolvedConfig, reelIndex: number, excluded: Set<SymbolId>): SymbolId {
  const table = filterTable(config.reels[reelIndex], excluded);
  const total = tableTotal(table);
  return table[rng.pickFrom(table, total)].id;
}

export function evaluateLines(grid: Grid, config: ResolvedConfig, lineBet: number): { wins: LineWin[]; total: number } {
  const { lines } = config.grid;
  const wins: LineWin[] = [];
  let total = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const first = grid[0][line[0]];
    if (first === 'SCATTER') continue;
    let paySymbol: SymbolId = first;
    if (first === 'WILD') {
      for (let c = 1; c < line.length; c++) {
        const s = grid[c][line[c]];
        if (s !== 'WILD') { paySymbol = s; break; }
      }
    }
    if (paySymbol === 'SCATTER') continue;
    let count = 0;
    const positions: [number, number][] = [];
    for (let c = 0; c < line.length; c++) {
      const s = grid[c][line[c]];
      const matches =
        s === paySymbol || s === 'WILD' || (paySymbol === 'WILD' && config.wildSubs.has(s));
      if (matches) { count++; positions.push([c, line[c]]); } else break;
    }
    if (count >= 3) {
      const row = config.paytable[paySymbol];
      if (row) {
        const pay = row[count - 3] * lineBet;
        if (pay > 0) { wins.push({ line: li, symbol: paySymbol, count, positions, pay }); total += pay; }
      }
    }
  }
  return { wins, total };
}

function countSymbol(grid: Grid, symbol: SymbolId): [number, number][] {
  const positions: [number, number][] = [];
  for (let c = 0; c < grid.length; c++) {
    for (let row = 0; row < grid[c].length; row++) {
      if (grid[c][row] === symbol) positions.push([c, row]);
    }
  }
  return positions;
}

function tumble(grid: Grid, winningPositions: [number, number][], rng: PfRng, config: ResolvedConfig) {
  const remove = new Set(winningPositions.map(([c, r]) => `${c},${r}`));
  const excluded = new Set<SymbolId>(['SCATTER']);
  const newGrid: Grid = [];
  const refilled: [number, number][] = [];
  for (let c = 0; c < grid.length; c++) {
    const survivors: SymbolId[] = [];
    for (let r = 0; r < grid[c].length; r++) {
      if (!remove.has(`${c},${r}`)) survivors.push(grid[c][r]);
    }
    const missing = grid[c].length - survivors.length;
    const col: SymbolId[] = new Array(grid[c].length);
    for (let r = 0; r < missing; r++) { col[r] = drawCell(rng, config, c, excluded); refilled.push([c, r]); }
    for (let r = 0; r < survivors.length; r++) col[missing + r] = survivors[r];
    newGrid.push(col);
  }
  return { grid: newGrid, refilled };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function clone(grid: Grid): Grid {
  return grid.map((col) => col.slice());
}

export function spin(config: ResolvedConfig, rng: PfRng, lineBet: number, isFree = false): SpinResult {
  const totalBet = lineBet * config.grid.lines.length;
  const ladder = isFree ? config.ladderFree : config.ladderBase;

  const initialGrid = drawGrid(rng, config, null);
  const scatterPos = countSymbol(initialGrid, 'SCATTER');
  const scatterCount = scatterPos.length;

  const steps: TumbleStep[] = [];
  let grid = initialGrid;
  let stepIndex = 0;
  let lineWinTotal = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { wins, total } = evaluateLines(grid, config, lineBet);
    if (wins.length === 0 || total <= 0) {
      steps.push({ grid: clone(grid), wins: [], multiplier: 0, stepWin: 0, refilled: [] });
      break;
    }
    const mult = ladder[Math.min(stepIndex, ladder.length - 1)];
    const stepWin = total * mult;
    lineWinTotal += stepWin;
    const winningPositions: [number, number][] = [];
    for (const w of wins) for (const p of w.positions) winningPositions.push(p);
    const { grid: nextGrid, refilled } = tumble(grid, winningPositions, rng, config);
    steps.push({ grid: clone(grid), wins, multiplier: mult, stepWin: round2(stepWin), removed: winningPositions, refilled });
    grid = nextGrid;
    stepIndex++;
  }
  const finalMultiplier = ladder[Math.min(Math.max(stepIndex - 1, 0), ladder.length - 1)];

  const scatterWin = scatterCount >= 3 ? (config.scatterPay[Math.min(scatterCount, 5)] || 0) * totalBet : 0;

  let freeSpinsAwarded = 0;
  if (scatterCount >= 3) {
    freeSpinsAwarded = isFree ? config.freeSpinsRetrigger : config.freeSpinsAward[Math.min(scatterCount, 5)] || 0;
  }

  // Jackpot mystery roll (empty pools during verification — the tier draw still
  // reproduces, and progressive amount is validated separately server-side).
  const jc = config.jackpots;
  const scaled = jc.triggerBaseChance * (totalBet / jc.triggerRefBet);
  const chance = Math.min(scaled, jc.triggerMaxChance);
  let jackpot = null as SpinResult['jackpot'];
  if (rng.next() < chance) {
    const entries = jc.order.map((tier) => ({ id: tier, weight: jc.tierWeights[tier] || 0 }));
    const idx = rng.weighted(entries);
    const tier = entries[idx].id;
    jackpot = { won: true, tier, seed: jc.seeds[tier], progressive: 0, amount: jc.seeds[tier] };
  }

  let win = round2(lineWinTotal + scatterWin);
  const capped = Math.min(win, config.maxWinX * totalBet);
  const cappedAtMax = capped < win;
  win = round2(capped);

  return {
    layout: '5x3',
    totalBet: round2(totalBet),
    lineBet: round2(lineBet),
    isFree,
    initialGrid,
    steps,
    finalGrid: clone(grid),
    lineWin: round2(lineWinTotal),
    scatter: { count: scatterCount, positions: scatterPos, win: round2(scatterWin) },
    jackpot,
    freeSpins: { triggered: freeSpinsAwarded > 0 && !isFree, retriggered: freeSpinsAwarded > 0 && isFree, awarded: freeSpinsAwarded },
    multiplier: finalMultiplier,
    cappedAtMax,
    win,
    jackpotWin: round2(jackpot ? jackpot.amount : 0),
    totalPayout: round2(win + (jackpot ? jackpot.amount : 0)),
    nonce: 0,
    serverSeedHash: '',
    clientSeed: '',
    hash: '',
  };
}

// Canonical outcome hash — mirror of session.js outcomeHash so the browser can
// confirm the server's recorded hash for a round.
export async function outcomeHash(result: SpinResult): Promise<string> {
  const { sha256Hex } = await import('./fairness');
  const canonical = JSON.stringify({
    initialGrid: result.initialGrid,
    steps: result.steps.map((s) => ({ g: s.grid, w: s.stepWin, m: s.multiplier })),
    win: result.win,
    scatter: result.scatter.count,
    jackpot: result.jackpot ? { tier: result.jackpot.tier, amount: result.jackpot.amount } : null,
  });
  return sha256Hex(canonical);
}
