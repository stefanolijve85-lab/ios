// RGS self-test — exercises the full ledger lifecycle against the in-memory
// store + demo wallet. Run:  node server/rgs/selftest.js
// Exits non-zero on any failed assertion (usable in CI).

const { RGS } = require('./index');
const tokens = require('./tokens');

let passed = 0;
function ok(cond, msg) {
  if (!cond) { console.error('  ✗ FAIL:', msg); process.exitCode = 1; throw new Error(msg); }
  passed += 1; console.log('  ✓', msg);
}
async function throws(fn, code, msg) {
  try { await fn(); } catch (e) { return ok(e.code === code || e.message === code, msg); }
  ok(false, `${msg} (expected throw ${code})`);
}

(async () => {
  const config = {
    mode: 'demo', store: 'memory', secret: 'test-secret',
    currency: 'EUR', demoBalanceMinor: 245321, tokenTtlSec: 3600,
  };

  console.log('\nTokens');
  const tk = tokens.create({ operatorId: 'op1', playerId: 'p1', currency: 'EUR', gameKey: 'bankheistx', mode: 'demo' }, config.secret, 60);
  ok(tokens.verify(tk, config.secret).playerId === 'p1', 'valid token round-trips');
  await throws(() => tokens.verify(tk + 'x', config.secret), 'bad signature', 'tampered token rejected');
  await throws(() => tokens.verify(tk, 'wrong'), 'bad signature', 'wrong secret rejected');
  const expired = tokens.create({ playerId: 'p1' }, config.secret, -1);
  await throws(() => tokens.verify(expired, config.secret), 'token expired', 'expired token rejected');

  const rgs = await RGS.create(config);

  console.log('\nSession + balance');
  const { session, balanceMinor } = await rgs.openDemoSession({ gameKey: 'bankheistx' });
  ok(balanceMinor === 245321, 'demo session seeded with opening balance');

  console.log('\nRound audit');
  const round = await rgs.openRound({ gameKey: 'bankheistx', roundNo: 1, serverSeedHash: 'abc', crashPoint: 2.5, rtp: 97 });
  ok(round.serverSeedHash === 'abc' && round.crashPoint === 2.5, 'round commit recorded before bets');

  console.log('\nWin path (debit then credit)');
  const { bet, balanceMinor: afterBet } = await rgs.placeBet({ session, roundId: round.id, slot: 0, stakeMinor: 1000 });
  ok(afterBet === 244321, 'stake debited (245321 - 1000)');
  const replay = await rgs.placeBet({ session, roundId: round.id, slot: 0, stakeMinor: 1000 });
  ok(replay.replayed === true && (await rgs.getBalance(session)) === 244321, 'duplicate bet is idempotent (no double debit)');
  const win = await rgs.settleWin({ session, betId: bet.id, multiplier: 2.0 });
  ok(win.payoutMinor === 2000 && win.balanceMinor === 246321, 'win credits stake × multiplier');
  const winReplay = await rgs.settleWin({ session, betId: bet.id, multiplier: 2.0 });
  ok(winReplay === null && (await rgs.getBalance(session)) === 246321, 'duplicate settle is idempotent (no double credit)');
  ok((await rgs.store.getBet(bet.id)).status === 'won', 'bet marked won');

  console.log('\nLoss path');
  const r2 = await rgs.openRound({ gameKey: 'bankheistx', roundNo: 2, serverSeedHash: 'd', crashPoint: 1.2, rtp: 97 });
  const b2 = (await rgs.placeBet({ session, roundId: r2.id, slot: 0, stakeMinor: 1000 })).bet;
  ok((await rgs.getBalance(session)) === 245321, 'stake debited for losing bet');
  await rgs.settleLoss({ betId: b2.id });
  ok((await rgs.getBalance(session)) === 245321 && (await rgs.store.getBet(b2.id)).status === 'lost', 'loss keeps the stake, bet marked lost');

  console.log('\nCancel path (rollback)');
  const r3 = await rgs.openRound({ gameKey: 'bankheistx', roundNo: 3, serverSeedHash: 'e', crashPoint: 5, rtp: 97 });
  const b3 = (await rgs.placeBet({ session, roundId: r3.id, slot: 0, stakeMinor: 1000 })).bet;
  ok((await rgs.getBalance(session)) === 244321, 'stake debited');
  const cancel = await rgs.cancelBet({ session, betId: b3.id });
  ok(cancel.balanceMinor === 245321 && (await rgs.store.getBet(b3.id)).status === 'cancelled', 'cancel refunds the stake');

  console.log('\nInsufficient funds');
  const r4 = await rgs.openRound({ gameKey: 'bankheistx', roundNo: 4, serverSeedHash: 'f', crashPoint: 2, rtp: 97 });
  await throws(() => rgs.placeBet({ session, roundId: r4.id, slot: 1, stakeMinor: 999999999 }), 'INSUFFICIENT_FUNDS', 'over-balance bet rejected');

  console.log('\nReveal');
  await rgs.revealRound(round.id, 'the-secret-seed');
  ok((await rgs.store.getRound(round.id)).serverSeed === 'the-secret-seed', 'seed revealed for audit after bust');

  console.log(`\nAll ${passed} assertions passed ✓\n`);
})().catch((e) => { console.error('\nself-test failed:', e.message); process.exit(1); });
