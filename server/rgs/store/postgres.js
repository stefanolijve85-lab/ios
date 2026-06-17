// Postgres store — durable ledger backing for real-money play.
//
// Mirrors the MemoryStore interface exactly. Lazy-requires `pg` so the app can
// run without it when RGS_STORE=memory. Apply server/rgs/schema.sql first.

const crypto = require('crypto');
const newId = (p) => `${p}_${crypto.randomUUID()}`;

class PostgresStore {
  constructor(databaseUrl) {
    // require here so `pg` is only needed when actually using postgres
    const { Pool } = require('pg');
    this.pool = new Pool({ connectionString: databaseUrl });
  }
  async init() { /* schema is applied out-of-band via schema.sql */ }
  async close() { await this.pool.end(); }
  async _one(sql, params) { const r = await this.pool.query(sql, params); return r.rows[0] || null; }

  async upsertOperator({ id, name, mode = 'demo' }) {
    const opId = id || newId('op');
    return this._one(
      `INSERT INTO operators (id, name, mode) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
      [opId, name || opId, mode],
    );
  }
  async getOperator(id) { return this._one('SELECT * FROM operators WHERE id=$1', [id]); }

  async getOrCreatePlayer({ operatorId, externalId, currency }) {
    const found = await this._one(
      'SELECT * FROM players WHERE operator_id=$1 AND external_id=$2', [operatorId, externalId],
    );
    if (found) return found;
    return this._one(
      `INSERT INTO players (id, operator_id, external_id, currency) VALUES ($1,$2,$3,$4)
       ON CONFLICT (operator_id, external_id) DO UPDATE SET currency = EXCLUDED.currency RETURNING *`,
      [newId('pl'), operatorId, externalId, currency],
    );
  }

  async createSession({ operatorId, playerId, currency, gameKey, mode }) {
    return this._one(
      `INSERT INTO sessions (id, operator_id, player_id, currency, game_key, mode)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [newId('se'), operatorId, playerId, currency, gameKey, mode],
    );
  }
  async getSession(id) { return this._one('SELECT * FROM sessions WHERE id=$1', [id]); }
  async updateSession(id, patch) {
    return this._one('UPDATE sessions SET status=COALESCE($2,status) WHERE id=$1 RETURNING *', [id, patch.status]);
  }

  async createRound(r) {
    return this._one(
      `INSERT INTO rounds (id, game_key, round_no, server_seed_hash, crash_point, rtp)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [newId('rd'), r.gameKey, r.roundNo, r.serverSeedHash, r.crashPoint, r.rtp],
    );
  }
  async getRound(id) { return this._one('SELECT * FROM rounds WHERE id=$1', [id]); }
  async updateRound(id, patch) {
    return this._one(
      `UPDATE rounds SET server_seed=COALESCE($2,server_seed), status=COALESCE($3,status),
              crashed_at=COALESCE($4,crashed_at) WHERE id=$1 RETURNING *`,
      [id, patch.serverSeed, patch.status, patch.crashedAt],
    );
  }

  async createBet(b) {
    return this._one(
      `INSERT INTO bets (id, round_id, session_id, player_id, slot, stake_minor, currency, auto_cashout)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [newId('bt'), b.roundId, b.sessionId, b.playerId, b.slot, b.stakeMinor, b.currency, b.autoCashout],
    );
  }
  async getBet(id) { return this._one('SELECT * FROM bets WHERE id=$1', [id]); }
  async updateBet(id, patch) {
    return this._one(
      `UPDATE bets SET status=COALESCE($2,status), cashout_multiplier=COALESCE($3,cashout_multiplier),
              payout_minor=COALESCE($4,payout_minor), settled_at=COALESCE($5,settled_at)
       WHERE id=$1 RETURNING *`,
      [id, patch.status, patch.cashoutMultiplier, patch.payoutMinor, patch.settledAt],
    );
  }

  async findTransactionByRef(ref) {
    const r = await this._one('SELECT * FROM transactions WHERE ref=$1', [ref]);
    if (!r) return null;
    return { ...r, balanceAfterMinor: r.balance_after_minor != null ? Number(r.balance_after_minor) : null, betId: r.bet_id };
  }
  async createTransaction(t) {
    // ON CONFLICT keeps it idempotent if two writers race on the same ref
    const r = await this._one(
      `INSERT INTO transactions (id, ref, type, operator_id, player_id, session_id, round_id, bet_id,
              amount_minor, currency, balance_after_minor, provider_ref, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (ref) DO UPDATE SET ref = EXCLUDED.ref RETURNING *`,
      [newId('tx'), t.ref, t.type, t.operatorId, t.playerId, t.sessionId, t.roundId, t.betId,
        t.amountMinor, t.currency, t.balanceAfterMinor, t.providerRef || null, t.status || 'ok'],
    );
    return { ...r, balanceAfterMinor: r.balance_after_minor != null ? Number(r.balance_after_minor) : null, betId: r.bet_id };
  }

  // demo wallet balances
  async ensureWalletAccount({ operatorId, playerId, currency }, openingMinor) {
    await this.pool.query(
      `INSERT INTO wallet_accounts (operator_id, player_id, currency, balance_minor)
       VALUES ($1,$2,$3,$4) ON CONFLICT (operator_id, player_id, currency) DO NOTHING`,
      [operatorId, playerId, currency, openingMinor | 0],
    );
    return this.getWalletBalance({ operatorId, playerId, currency });
  }
  async getWalletBalance({ operatorId, playerId, currency }) {
    const r = await this._one(
      'SELECT balance_minor FROM wallet_accounts WHERE operator_id=$1 AND player_id=$2 AND currency=$3',
      [operatorId, playerId, currency],
    );
    return r ? Number(r.balance_minor) : 0;
  }
  async setWalletBalance({ operatorId, playerId, currency }, balanceMinor) {
    await this.pool.query(
      `INSERT INTO wallet_accounts (operator_id, player_id, currency, balance_minor)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (operator_id, player_id, currency) DO UPDATE SET balance_minor = EXCLUDED.balance_minor`,
      [operatorId, playerId, currency, balanceMinor | 0],
    );
    return balanceMinor | 0;
  }

  // responsible gaming: self-exclusion (until_ts: 0 = permanent)
  async setExclusion({ operatorId, playerId, untilTs = 0 }) {
    return this._one(
      `INSERT INTO self_exclusions (operator_id, player_id, until_ts)
       VALUES ($1,$2,$3)
       ON CONFLICT (operator_id, player_id) DO UPDATE SET until_ts = EXCLUDED.until_ts, created_at = now()
       RETURNING *`,
      [operatorId, playerId, Math.round(untilTs) || 0],
    );
  }
  async getExclusion({ operatorId, playerId }) {
    const r = await this._one(
      'SELECT * FROM self_exclusions WHERE operator_id=$1 AND player_id=$2', [operatorId, playerId],
    );
    return r ? { ...r, untilTs: Number(r.until_ts) } : null;
  }
}

module.exports = { PostgresStore };
