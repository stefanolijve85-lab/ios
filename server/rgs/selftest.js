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

  console.log('\nResponsible gaming — stake + wager limits');
  // stake + wager limits (loss limit OFF here so wager is the binding rule)
  const rgRgs = await RGS.create({
    mode: 'demo', store: 'memory', secret: 's', currency: 'EUR', demoBalanceMinor: 100000, tokenTtlSec: 3600,
    rg: { stakeMaxMinor: 5000, sessionWagerMaxMinor: 12000, realityCheckMs: 1000 },
  });
  const { session: rgSes } = await rgRgs.openDemoSession({ gameKey: 'bankheistx' });
  const rgRound = async (n) => (await rgRgs.openRound({ gameKey: 'bankheistx', roundNo: n, serverSeedHash: 'h' + n, crashPoint: 2, rtp: 97 })).id;

  const rr1 = await rgRound(1);
  await throws(() => rgRgs.placeBet({ session: rgSes, roundId: rr1, slot: 0, stakeMinor: 5001 }), 'RG_LIMIT', 'stake over the per-bet limit is blocked');

  // wager limit: 5000 + 5000 = 10000 ok, next 5000 → 15000 > 12000 blocked
  await rgRgs.placeBet({ session: rgSes, roundId: await rgRound(2), slot: 0, stakeMinor: 5000 });
  await rgRgs.placeBet({ session: rgSes, roundId: await rgRound(3), slot: 0, stakeMinor: 5000 });
  const rr4 = await rgRound(4);
  await throws(() => rgRgs.placeBet({ session: rgSes, roundId: rr4, slot: 0, stakeMinor: 5000 }), 'RG_LIMIT', 'wager over the session limit is blocked');
  ok(rgRgs.rg.status(rgSes).wagerMinor === 10000, 'session wager tracked (10000)');

  // reality check is due after the interval, then resets
  const before = rgRgs.rg.realityCheck(rgSes, Date.now());
  ok(before === null, 'reality check not due immediately');
  const due = rgRgs.rg.realityCheck(rgSes, Date.now() + 2000);
  ok(due && due.bets === 2 && due.intervalMs === 1000, 'reality check fires after the interval with live stats');

  console.log('\nResponsible gaming — loss limit (net of payouts)');
  const lossRgs = await RGS.create({
    mode: 'demo', store: 'memory', secret: 's', currency: 'EUR', demoBalanceMinor: 100000, tokenTtlSec: 3600,
    rg: { sessionLossMaxMinor: 8000 },
  });
  const { session: lSes } = await lossRgs.openDemoSession({ gameKey: 'bankheistx' });
  const lRound = async (n) => (await lossRgs.openRound({ gameKey: 'bankheistx', roundNo: n, serverSeedHash: 'L' + n, crashPoint: 2, rtp: 97 })).id;
  // win the first bet back: a payout offsets the running net loss
  const lb1 = (await lossRgs.placeBet({ session: lSes, roundId: await lRound(1), slot: 0, stakeMinor: 5000 })).bet;
  await lossRgs.settleWin({ session: lSes, betId: lb1.id, multiplier: 2 }); // +10000 payout → net +5000
  ok(lossRgs.rg.status(lSes).netMinor === 5000, 'net result tracks wins minus stakes (+5000)');
  // now lose 5000 (net -0), then a 5000 stake would risk net -5000 (ok), but a
  // 9000 stake would risk beyond the 8000 loss cap
  await lossRgs.settleLoss({ betId: (await lossRgs.placeBet({ session: lSes, roundId: await lRound(2), slot: 0, stakeMinor: 5000 })).bet.id });
  const lr3 = await lRound(3);
  await throws(() => lossRgs.placeBet({ session: lSes, roundId: lr3, slot: 0, stakeMinor: 9000 }), 'RG_LIMIT', 'a stake that would breach the loss limit is blocked');

  console.log('\nResponsible gaming — self-exclusion');
  const exRgs = await RGS.create({ mode: 'demo', store: 'memory', secret: 's', currency: 'EUR', demoBalanceMinor: 100000, tokenTtlSec: 3600, rg: {} });
  const { session: exSes } = await exRgs.openDemoSession({ gameKey: 'bankheistx' });
  const exRound = async (n) => (await exRgs.openRound({ gameKey: 'bankheistx', roundNo: n, serverSeedHash: 'z' + n, crashPoint: 2, rtp: 97 })).id;
  await exRgs.placeBet({ session: exSes, roundId: await exRound(1), slot: 0, stakeMinor: 1000 });
  await exRgs.rg.selfExclude({ session: exSes, untilTs: Date.now() + 60000 });
  const excludedRound = await exRound(2);
  await throws(() => exRgs.placeBet({ session: exSes, roundId: excludedRound, slot: 0, stakeMinor: 1000 }), 'RG_LIMIT', 'self-excluded player is blocked from betting');
  await exRgs.rg.selfExclude({ session: exSes, untilTs: Date.now() - 1000 }); // cool-off elapsed
  const after = await exRgs.placeBet({ session: exSes, roundId: await exRound(3), slot: 0, stakeMinor: 1000 });
  ok(after && after.bet, 'play resumes once the cool-off has elapsed');

  console.log(`\nAll ${passed} assertions passed ✓\n`);
})().catch((e) => { console.error('\nself-test failed:', e.message); process.exit(1); });
