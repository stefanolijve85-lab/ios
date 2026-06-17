// RGS facade — the single entry point the game engine talks to.
//
// Responsibilities:
//   - open player sessions (from an operator launch token, or a demo session)
//   - keep a provably-fair ROUND audit trail
//   - run the bet lifecycle as a proper double-entry ledger:
//        place  -> wallet DEBIT  (stake)        + bet 'placed'
//        win    -> wallet CREDIT (stake × mult) + bet 'won'
//        loss   ->                              + bet 'lost'
//        cancel -> wallet ROLLBACK (refund)     + bet 'cancelled'
//   - every wallet move is idempotent by a deterministic `ref`, so retries /
//     reconnects can never double-charge or double-pay.
//
// All money is in INTEGER MINOR UNITS. `multiplier` is a float; payout is
// computed in minor units and rounded once.

const tokens = require('./tokens');
const { createStore } = require('./store');
const { createWallet } = require('./wallet');

const toMinor = (major) => Math.round(Number(major) * 100);
const toMajor = (minor) => Math.round(minor) / 100;

class RGS {
  constructor({ config, store, wallet, log = console }) {
    this.config = config;
    this.store = store;
    this.wallet = wallet;
    this.log = log;
  }

  static async create(config, log = console) {
    const store = createStore(config, log);
    if (store.init) await store.init();
    const wallet = createWallet(config, store);
    return new RGS({ config, store, wallet, log });
  }

  get mode() { return this.config.mode; }

  // --- sessions ------------------------------------------------------------
  // Real handoff: verify the operator's launch token and open a session.
  async openSessionFromToken(token, fallback = {}) {
    const claims = tokens.verify(token, this.config.secret);
    const operatorId = claims.operatorId || 'unknown';
    const currency = claims.currency || this.config.currency;
    const gameKey = claims.gameKey || fallback.gameKey;
    const mode = claims.mode || this.config.mode;
    await this.store.upsertOperator({ id: operatorId, name: claims.operatorName, mode });
    const player = await this.store.getOrCreatePlayer({ operatorId, externalId: String(claims.playerId), currency });
    const session = await this.store.createSession({ operatorId, playerId: player.id, currency, gameKey, mode });
    const balanceMinor = await this.wallet.getBalance(session);
    return { session, balanceMinor };
  }

  // Demo handoff: anonymous fun-play session with a seeded local balance.
  async openDemoSession({ gameKey, currency } = {}) {
    const cur = currency || this.config.currency;
    await this.store.upsertOperator({ id: 'demo', name: 'Demo', mode: 'demo' });
    const player = await this.store.getOrCreatePlayer({
      operatorId: 'demo', externalId: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, currency: cur,
    });
    const session = await this.store.createSession({ operatorId: 'demo', playerId: player.id, currency: cur, gameKey, mode: 'demo' });
    const balanceMinor = await this.wallet.getBalance(session); // demo wallet seeds the opening balance
    return { session, balanceMinor };
  }

  async getBalance(session) {
    return this.wallet.getBalance(session);
  }

  // --- rounds (provably-fair audit) ----------------------------------------
  async openRound({ gameKey, roundNo, serverSeedHash, crashPoint, rtp }) {
    return this.store.createRound({ gameKey, roundNo, serverSeedHash, crashPoint, rtp });
  }
  // reveal the seed once the round has busted (auditable)
  async revealRound(roundId, serverSeed) {
    return this.store.updateRound(roundId, { serverSeed, status: 'settled', crashedAt: new Date().toISOString() });
  }

  // --- idempotency helper --------------------------------------------------
  async _idempotent(ref, run) {
    const existing = await this.store.findTransactionByRef(ref);
    if (existing) return { balanceMinor: existing.balanceAfterMinor, tx: existing, replayed: true };
    return run();
  }

  // --- bet lifecycle -------------------------------------------------------
  async placeBet({ session, roundId, slot, stakeMinor, autoCashout = null }) {
    const ref = `bet:${session.id}:${roundId}:${slot}`;
    const prior = await this.store.findTransactionByRef(ref);
    if (prior) {
      // already placed (retry) — return the existing bet
      return { bet: await this.store.getBet(prior.betId), balanceMinor: prior.balanceAfterMinor, replayed: true };
    }
    const bet = await this.store.createBet({
      roundId, sessionId: session.id, playerId: session.playerId,
      slot, stakeMinor, currency: session.currency, autoCashout,
    });
    const { balanceMinor } = await this.wallet.debit({ session, amountMinor: stakeMinor, ref, roundId, betId: bet.id });
    await this.store.createTransaction({
      ref, type: 'bet', operatorId: session.operatorId, playerId: session.playerId,
      sessionId: session.id, roundId, betId: bet.id, amountMinor: stakeMinor,
      currency: session.currency, balanceAfterMinor: balanceMinor,
    });
    return { bet, balanceMinor };
  }

  async cancelBet({ session, betId }) {
    const bet = await this.store.getBet(betId);
    if (!bet || bet.status !== 'placed') return null;
    const ref = `cancel:${betId}`;
    const result = await this._idempotent(ref, async () => {
      const { balanceMinor } = await this.wallet.rollback({ session, amountMinor: bet.stakeMinor, ref, originalRef: `bet:${session.id}:${bet.roundId}:${bet.slot}`, roundId: bet.roundId, betId });
      const tx = await this.store.createTransaction({
        ref, type: 'rollback', operatorId: session.operatorId, playerId: session.playerId,
        sessionId: session.id, roundId: bet.roundId, betId, amountMinor: bet.stakeMinor,
        currency: session.currency, balanceAfterMinor: balanceMinor,
      });
      return { balanceMinor, tx };
    });
    await this.store.updateBet(betId, { status: 'cancelled', settledAt: new Date().toISOString() });
    return { balanceMinor: result.balanceMinor };
  }

  async settleWin({ session, betId, multiplier }) {
    const bet = await this.store.getBet(betId);
    if (!bet || bet.status !== 'placed') return null;
    const payoutMinor = Math.round(bet.stakeMinor * multiplier);
    const ref = `win:${betId}`;
    const result = await this._idempotent(ref, async () => {
      const { balanceMinor } = await this.wallet.credit({ session, amountMinor: payoutMinor, ref, roundId: bet.roundId, betId });
      const tx = await this.store.createTransaction({
        ref, type: 'win', operatorId: session.operatorId, playerId: session.playerId,
        sessionId: session.id, roundId: bet.roundId, betId, amountMinor: payoutMinor,
        currency: session.currency, balanceAfterMinor: balanceMinor,
      });
      return { balanceMinor, tx };
    });
    await this.store.updateBet(betId, {
      status: 'won', cashoutMultiplier: multiplier, payoutMinor, settledAt: new Date().toISOString(),
    });
    return { payoutMinor, balanceMinor: result.balanceMinor };
  }

  async settleLoss({ betId }) {
    const bet = await this.store.getBet(betId);
    if (!bet || bet.status !== 'placed') return null;
    return this.store.updateBet(betId, { status: 'lost', settledAt: new Date().toISOString() });
  }

  // --- misc ---------------------------------------------------------------
  // Out-of-band credit (dev/test top-up). Auditable like everything else.
  async topUp({ session, amountMinor }) {
    const ref = `topup:${session.id}:${Date.now()}:${Math.round(Math.random() * 1e6)}`;
    const { balanceMinor } = await this.wallet.credit({ session, amountMinor, ref });
    await this.store.createTransaction({
      ref, type: 'credit', operatorId: session.operatorId, playerId: session.playerId,
      sessionId: session.id, amountMinor, currency: session.currency, balanceAfterMinor: balanceMinor,
    });
    return { balanceMinor };
  }
}

module.exports = { RGS, toMinor, toMajor };
