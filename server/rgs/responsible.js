// Responsible Gaming — player-protection layer that sits in front of the bet
// lifecycle. It is presentation/RGS-readiness, NOT game math: it can only ever
// BLOCK or REMIND a player, never change the odds or a payout.
//
// What it enforces (all configurable, default OFF so demo play is unchanged):
//   - self-exclusion / cool-off   (persisted via the store, survives sessions)
//   - max stake per bet
//   - max total wagered per session
//   - max net loss per session
//   - max session length
//   - reality-check reminders      ("you've been playing N minutes")
//
// Effective limits resolve per player: the launch token's `limits` claim wins,
// otherwise the deployment defaults from config.rg. Money is in INTEGER MINOR
// UNITS; durations in milliseconds.

class RgLimitError extends Error {
  constructor(code, message, detail = {}) {
    super(message);
    this.code = 'RG_LIMIT';
    this.reason = code;     // RG_SELF_EXCLUDED | RG_STAKE_LIMIT | ...
    this.detail = detail;   // { limitMinor, untilTs, ... } for the UI
  }
}

const num = (v) => (Number.isFinite(v) ? v : 0);

class ResponsibleGaming {
  constructor(config = {}, store = null) {
    this.defaults = {
      stakeMaxMinor: num(config.stakeMaxMinor),
      sessionWagerMaxMinor: num(config.sessionWagerMaxMinor),
      sessionLossMaxMinor: num(config.sessionLossMaxMinor),
      sessionTimeMaxMs: num(config.sessionTimeMaxMs),
      realityCheckMs: num(config.realityCheckMs),
    };
    this.store = store;
    // per-session runtime activity (resets on restart; session-scoped by design)
    this.activity = new Map(); // sessionId -> { startedAt, wagerMinor, payoutMinor, bets, limits, lastRealityAt }
  }

  // Resolve the effective limits for a session: per-player overrides (from the
  // launch token) merged over the deployment defaults. A value of 0 means "off".
  _limits(overrides = {}) {
    const d = this.defaults;
    const pick = (a, b) => (Number.isFinite(a) ? a : b);
    return {
      stakeMaxMinor: pick(overrides.stakeMaxMinor, d.stakeMaxMinor),
      sessionWagerMaxMinor: pick(overrides.sessionWagerMaxMinor, d.sessionWagerMaxMinor),
      sessionLossMaxMinor: pick(overrides.sessionLossMaxMinor, d.sessionLossMaxMinor),
      sessionTimeMaxMs: pick(overrides.sessionTimeMaxMs, d.sessionTimeMaxMs),
      realityCheckMs: pick(overrides.realityCheckMs, d.realityCheckMs),
    };
  }

  // Start tracking a session. `limits` are per-player overrides (token claim).
  noteSessionOpen(session, limits = {}, now = Date.now()) {
    const a = {
      startedAt: now, wagerMinor: 0, payoutMinor: 0, bets: 0,
      limits: this._limits(limits), lastRealityAt: now,
    };
    this.activity.set(session.id, a);
    return a;
  }

  _activity(session, now = Date.now()) {
    let a = this.activity.get(session.id);
    if (!a) a = this.noteSessionOpen(session, {}, now); // late/unknown session — track from now
    return a;
  }

  // Record a placed stake and a settled payout (called after the ledger move).
  noteWager(session, stakeMinor) {
    const a = this._activity(session);
    a.wagerMinor += stakeMinor;
    a.bets += 1;
  }
  notePayout(session, payoutMinor) {
    const a = this._activity(session);
    a.payoutMinor += payoutMinor;
  }
  // A cancelled bet never happened — un-count its stake.
  noteCancel(session, stakeMinor) {
    const a = this._activity(session);
    a.wagerMinor = Math.max(0, a.wagerMinor - stakeMinor);
    a.bets = Math.max(0, a.bets - 1);
  }

  // Persisted self-exclusion: block all play until `untilTs` (0 = permanent).
  async selfExclude({ session, untilTs = 0 }) {
    if (!this.store || !this.store.setExclusion) return null;
    return this.store.setExclusion({ operatorId: session.operatorId, playerId: session.playerId, untilTs });
  }
  async _exclusion(session) {
    if (!this.store || !this.store.getExclusion) return null;
    const ex = await this.store.getExclusion({ operatorId: session.operatorId, playerId: session.playerId });
    if (!ex) return null;
    const until = num(ex.untilTs);
    if (until !== 0 && until <= Date.now()) return null; // cool-off has elapsed
    return ex;
  }

  // Pre-bet gate. Returns { ok: true } or throws RgLimitError. Async because
  // self-exclusion is persisted in the store.
  async check(session, stakeMinor, now = Date.now()) {
    const ex = await this._exclusion(session);
    if (ex) {
      throw new RgLimitError('RG_SELF_EXCLUDED', 'You are currently excluded from play.', { untilTs: num(ex.untilTs) });
    }
    const a = this._activity(session, now);
    const L = a.limits;
    if (L.sessionTimeMaxMs && now - a.startedAt >= L.sessionTimeMaxMs) {
      throw new RgLimitError('RG_SESSION_TIME', 'Your session time limit has been reached.', { limitMs: L.sessionTimeMaxMs });
    }
    if (L.stakeMaxMinor && stakeMinor > L.stakeMaxMinor) {
      throw new RgLimitError('RG_STAKE_LIMIT', 'This stake is above your per-bet limit.', { limitMinor: L.stakeMaxMinor });
    }
    if (L.sessionWagerMaxMinor && a.wagerMinor + stakeMinor > L.sessionWagerMaxMinor) {
      throw new RgLimitError('RG_WAGER_LIMIT', 'You have reached your wager limit for this session.', { limitMinor: L.sessionWagerMaxMinor });
    }
    if (L.sessionLossMaxMinor) {
      // realized net loss so far + this at-risk stake (conservative)
      const netLoss = a.wagerMinor - a.payoutMinor + stakeMinor;
      if (netLoss > L.sessionLossMaxMinor) {
        throw new RgLimitError('RG_LOSS_LIMIT', 'You have reached your loss limit for this session.', { limitMinor: L.sessionLossMaxMinor });
      }
    }
    return { ok: true };
  }

  // A live snapshot of the session for the UI / a reality-check panel.
  status(session, now = Date.now()) {
    const a = this._activity(session, now);
    return {
      elapsedMs: now - a.startedAt,
      bets: a.bets,
      wagerMinor: a.wagerMinor,
      payoutMinor: a.payoutMinor,
      netMinor: a.payoutMinor - a.wagerMinor, // +profit / -loss
      limits: a.limits,
    };
  }

  // Returns a reality-check payload when one is due (and resets the timer), else
  // null. Drive this from a low-frequency loop per connected player.
  realityCheck(session, now = Date.now()) {
    const a = this._activity(session, now);
    const interval = a.limits.realityCheckMs;
    if (!interval || now - a.lastRealityAt < interval) return null;
    a.lastRealityAt = now;
    return { ...this.status(session, now), intervalMs: interval };
  }

  // Drop the runtime activity when a player disconnects.
  endSession(session) {
    if (session) this.activity.delete(session.id);
  }
}

module.exports = { ResponsibleGaming, RgLimitError };
