// In-memory store — the default backing for the RGS ledger.
//
// Implements the same async interface as the Postgres store so the two are
// interchangeable (RGS_STORE=memory|postgres). Good for local dev, demo mode
// and tests; NOT durable across restarts — use Postgres for real-money play.

let SEQ = 0;
function id(prefix) {
  SEQ += 1;
  return `${prefix}_${SEQ}`;
}
function now() {
  return new Date().toISOString();
}
function walletKey(operatorId, playerId, currency) {
  return `${operatorId}::${playerId}::${currency}`;
}

class MemoryStore {
  constructor() {
    this.operators = new Map();
    this.players = new Map();
    this.sessions = new Map();
    this.rounds = new Map();
    this.bets = new Map();
    this.transactions = new Map();   // id -> tx
    this.txByRef = new Map();         // ref -> tx   (idempotency)
    this.wallets = new Map();         // walletKey -> balanceMinor
  }

  async init() { /* nothing to do */ }
  async close() { /* nothing to do */ }

  // --- operators / players -------------------------------------------------
  async upsertOperator({ id: opId, name, mode = 'demo' }) {
    const key = opId || id('op');
    const rec = { id: key, name: name || key, mode, createdAt: now() };
    this.operators.set(key, rec);
    return rec;
  }
  async getOperator(opId) { return this.operators.get(opId) || null; }

  async getOrCreatePlayer({ operatorId, externalId, currency }) {
    for (const p of this.players.values()) {
      if (p.operatorId === operatorId && p.externalId === externalId) return p;
    }
    const rec = { id: id('pl'), operatorId, externalId, currency, createdAt: now() };
    this.players.set(rec.id, rec);
    return rec;
  }

  // --- sessions ------------------------------------------------------------
  async createSession({ operatorId, playerId, currency, gameKey, mode }) {
    const rec = {
      id: id('se'), operatorId, playerId, currency, gameKey, mode,
      status: 'open', createdAt: now(),
    };
    this.sessions.set(rec.id, rec);
    return rec;
  }
  async getSession(sessionId) { return this.sessions.get(sessionId) || null; }
  async updateSession(sessionId, patch) {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    Object.assign(s, patch);
    return s;
  }

  // --- rounds (provably-fair audit trail) ----------------------------------
  async createRound(r) {
    const rec = { id: id('rd'), status: 'open', createdAt: now(), ...r };
    this.rounds.set(rec.id, rec);
    return rec;
  }
  async getRound(roundId) { return this.rounds.get(roundId) || null; }
  async updateRound(roundId, patch) {
    const r = this.rounds.get(roundId);
    if (!r) return null;
    Object.assign(r, patch);
    return r;
  }

  // --- bets ----------------------------------------------------------------
  async createBet(b) {
    const rec = { id: id('bt'), status: 'placed', createdAt: now(), payoutMinor: 0, ...b };
    this.bets.set(rec.id, rec);
    return rec;
  }
  async getBet(betId) { return this.bets.get(betId) || null; }
  async updateBet(betId, patch) {
    const b = this.bets.get(betId);
    if (!b) return null;
    Object.assign(b, patch);
    return b;
  }

  // --- transactions (idempotent by ref) ------------------------------------
  async findTransactionByRef(ref) { return this.txByRef.get(ref) || null; }
  async createTransaction(t) {
    if (t.ref && this.txByRef.has(t.ref)) return this.txByRef.get(t.ref);
    const rec = { id: id('tx'), status: 'ok', createdAt: now(), ...t };
    this.transactions.set(rec.id, rec);
    if (rec.ref) this.txByRef.set(rec.ref, rec);
    return rec;
  }

  // --- demo wallet balances ------------------------------------------------
  async ensureWalletAccount({ operatorId, playerId, currency }, openingMinor) {
    const k = walletKey(operatorId, playerId, currency);
    if (!this.wallets.has(k)) this.wallets.set(k, openingMinor | 0);
    return this.wallets.get(k);
  }
  async getWalletBalance({ operatorId, playerId, currency }) {
    return this.wallets.get(walletKey(operatorId, playerId, currency)) ?? 0;
  }
  async setWalletBalance({ operatorId, playerId, currency }, balanceMinor) {
    this.wallets.set(walletKey(operatorId, playerId, currency), balanceMinor | 0);
    return balanceMinor | 0;
  }
}

module.exports = { MemoryStore };
