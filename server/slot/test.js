'use strict';

// ---------------------------------------------------------------------------
// Self-contained test suite for the QUANTUM SPIN engine. No test framework —
// runs on plain node so it works anywhere (CI, Docker, a bare box).
//   node server/slot/test.js
// Exit code is non-zero on any failure so CI can gate on it.
// ---------------------------------------------------------------------------

const assert = require('assert');
const { makeConfig } = require('./config');
const { spin, evaluateLines } = require('./engine');
const { ProvablyFairRNG } = require('./rng');
const fairness = require('./fairness');
const { createSession } = require('./session');
const { outcomeHash } = require('./session');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log('QUANTUM SPIN — engine tests');

test('commitment is deterministic SHA-256 of the seed', () => {
  const seed = fairness.generateServerSeed();
  assert.strictEqual(fairness.commitment(seed), fairness.commitment(seed));
  assert.ok(fairness.verifyCommitment(seed, fairness.commitment(seed)));
  assert.ok(!fairness.verifyCommitment(seed, 'deadbeef'));
});

test('RNG is deterministic for identical (server, client, nonce)', () => {
  const a = new ProvablyFairRNG('a'.repeat(64), 'c', 0);
  const b = new ProvablyFairRNG('a'.repeat(64), 'c', 0);
  for (let i = 0; i < 100; i++) assert.strictEqual(a.next(), b.next());
});

test('RNG diverges when nonce changes', () => {
  const a = new ProvablyFairRNG('a'.repeat(64), 'c', 0);
  const b = new ProvablyFairRNG('a'.repeat(64), 'c', 1);
  assert.notStrictEqual(a.next(), b.next());
});

test('a spin is a pure function of its seed (fully replayable)', () => {
  const config = makeConfig({ rtp: '96' });
  const r1 = spin({ config, rng: new ProvablyFairRNG('f'.repeat(64), 'x', 7), lineBet: 0.1 });
  const r2 = spin({ config, rng: new ProvablyFairRNG('f'.repeat(64), 'x', 7), lineBet: 0.1 });
  assert.strictEqual(outcomeHash(r1), outcomeHash(r2));
  assert.deepStrictEqual(r1.initialGrid, r2.initialGrid);
});

test('grid has the right dimensions', () => {
  const config = makeConfig({ rtp: '96' });
  const r = spin({ config, rng: new ProvablyFairRNG('1'.repeat(64), 'x', 0), lineBet: 0.1 });
  assert.strictEqual(r.initialGrid.length, 5);
  for (const col of r.initialGrid) assert.strictEqual(col.length, 3);
});

test('evaluateLines pays a full line of five of a kind', () => {
  const config = makeConfig({ rtp: '96' });
  // hand-build a grid: middle row all HERO_F (5 across)
  const g = [
    ['J', 'HERO_F', 'Q'], ['J', 'HERO_F', 'Q'], ['J', 'HERO_F', 'Q'],
    ['J', 'HERO_F', 'Q'], ['J', 'HERO_F', 'Q'],
  ];
  const { wins, total } = evaluateLines(g, config, 1);
  const heroWin = wins.find((w) => w.symbol === 'HERO_F' && w.count === 5);
  assert.ok(heroWin, 'expected a 5x HERO_F line win');
  assert.ok(total > 0);
});

test('wild substitutes to complete a line', () => {
  const config = makeConfig({ rtp: '96' });
  const g = [
    ['x', 'GEM', 'x'], ['x', 'WILD', 'x'], ['x', 'GEM', 'x'],
    ['x', 'x', 'x'], ['x', 'x', 'x'],
  ];
  const { wins } = evaluateLines(g, config, 1);
  const w = wins.find((w) => w.symbol === 'GEM' && w.count === 3);
  assert.ok(w, 'wild should complete a 3x GEM');
});

test('feature symbols never start a line win', () => {
  const config = makeConfig({ rtp: '96' });
  const g = [
    ['x', 'SCATTER', 'x'], ['x', 'SCATTER', 'x'], ['x', 'SCATTER', 'x'],
    ['x', 'SCATTER', 'x'], ['x', 'SCATTER', 'x'],
  ];
  const { total } = evaluateLines(g, config, 1);
  assert.strictEqual(total, 0);
});

test('win is capped at maxWinX × total bet (base+feature only)', () => {
  const config = makeConfig({ rtp: '96' });
  let maxRatio = 0;
  for (let i = 0; i < 200000; i++) {
    const r = spin({ config, rng: new ProvablyFairRNG('c'.repeat(64), 'k', i), lineBet: 1 });
    maxRatio = Math.max(maxRatio, r.win / r.totalBet);
  }
  assert.ok(maxRatio <= config.maxWinX, `win ratio ${maxRatio} exceeded cap`);
});

test('RTP band scalar orders correctly (94 < 96 < 97)', () => {
  const sample = (band) => {
    const config = makeConfig({ rtp: band });
    let w = 0, b = 0;
    for (let i = 0; i < 120000; i++) {
      const r = spin({ config, rng: new ProvablyFairRNG('r'.repeat(64), band, i), lineBet: 1 });
      w += r.win; b += r.totalBet;
    }
    return w / b;
  };
  const r94 = sample('94');
  const r96 = sample('96');
  const r97 = sample('97');
  assert.ok(r94 < r96 && r96 < r97, `expected 94<96<97 got ${r94.toFixed(3)} ${r96.toFixed(3)} ${r97.toFixed(3)}`);
});

test('session never lets balance go negative on a spin', () => {
  const s = createSession({ startingBalance: 2.5 }); // exactly one €2.50 spin
  const r1 = s.spin(0.1);
  assert.ok(s.balance >= 0);
  // now balance < stake → must throw
  if (s.balance < 2.5) {
    assert.throws(() => s.spin(0.1), /INSUFFICIENT_FUNDS/);
  }
});

test('rotate-seed reveals a seed that matches its published commitment', () => {
  const s = createSession({});
  const committed = s.serverSeedHash;
  s.spin(0.1);
  const rot = s.rotateSeed();
  assert.ok(fairness.verifyCommitment(rot.revealed.serverSeed, committed));
  assert.notStrictEqual(s.serverSeedHash, committed); // new epoch
});

test('verify() reproduces a recorded outcome hash', () => {
  const s = createSession({});
  const committed = s.serverSeedHash;
  const clientSeed = s.clientSeed;
  const r = s.spin(0.1).result;
  const rot = s.rotateSeed();
  const v = s.verify(rot.revealed.serverSeed, clientSeed, r.nonce, committed, 0.1, false);
  assert.strictEqual(v.hashOk, true);
  assert.strictEqual(v.hash, r.hash);
});

console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ''}`);
