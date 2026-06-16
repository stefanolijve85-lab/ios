// Seamless HTTP wallet — real-money play against an operator / aggregator's
// wallet API. This is a REFERENCE implementation of the WalletProvider contract:
// each aggregator (SoftSwiss, Pariplay, EveryMatrix, …) has its own endpoint
// shapes, so adapt the request/response mapping here per integration.
//
// The "seamless" model: the operator holds the player's money. For every action
// the game calls out to debit (bet), credit (win) or rollback (void), passing a
// unique idempotency `ref` so retries never double-charge.
//
// Amounts are integer minor units. Endpoints assumed (override per operator):
//   POST {base}/balance   { operatorId, playerId, currency }
//   POST {base}/bet       { ...ids, amountMinor, ref, roundId, betId, gameKey }
//   POST {base}/win       { ...ids, amountMinor, ref, roundId, betId, gameKey }
//   POST {base}/rollback  { ...ids, amountMinor, ref, originalRef, roundId, betId }
// Each returns: { balanceMinor }  (HTTP 4xx with { code } on rejection).

class WalletError extends Error {
  constructor(code, message) { super(message || code); this.code = code || 'WALLET_ERROR'; }
}

class SeamlessHttpWallet {
  constructor({ baseUrl, apiKey, timeoutMs = 8000 }) {
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
    this.kind = 'seamless';
  }

  async _post(path, body) {
    if (!this.baseUrl) throw new WalletError('WALLET_NOT_CONFIGURED');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let res;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      throw new WalletError('WALLET_UNREACHABLE', e && e.message);
    } finally {
      clearTimeout(t);
    }
    let data = {};
    try { data = await res.json(); } catch { /* tolerate empty bodies */ }
    if (!res.ok) throw new WalletError(data.code || `HTTP_${res.status}`, data.message);
    return data;
  }

  _ids(session) {
    return { operatorId: session.operatorId, playerId: session.playerId, currency: session.currency };
  }

  async getBalance(session) {
    const d = await this._post('/balance', this._ids(session));
    return d.balanceMinor | 0;
  }

  async debit({ session, amountMinor, ref, roundId, betId }) {
    const d = await this._post('/bet', { ...this._ids(session), amountMinor, ref, roundId, betId, gameKey: session.gameKey });
    return { balanceMinor: d.balanceMinor | 0, providerRef: d.providerRef };
  }

  async credit({ session, amountMinor, ref, roundId, betId }) {
    const d = await this._post('/win', { ...this._ids(session), amountMinor, ref, roundId, betId, gameKey: session.gameKey });
    return { balanceMinor: d.balanceMinor | 0, providerRef: d.providerRef };
  }

  async rollback({ session, amountMinor, ref, originalRef, roundId, betId }) {
    const d = await this._post('/rollback', { ...this._ids(session), amountMinor, ref, originalRef, roundId, betId });
    return { balanceMinor: d.balanceMinor | 0, providerRef: d.providerRef };
  }
}

module.exports = { SeamlessHttpWallet, WalletError };
