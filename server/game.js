const { Bots } = require('./bots');
const { generateServerSeed, commitment, crashPointFromSeed } = require('./fairness');

// ---------------------------------------------------------------------------
// Multiplier math (server authoritative). The same pure function lives on the
// client so the UI can animate at 60fps from a shared startTime without the
// server needing to stream every frame. GROWTH_K is per-game (the "feel").
// ---------------------------------------------------------------------------
function multiplierAt(elapsedMs, k) {
  if (elapsedMs <= 0) return 1.0;
  return Math.exp(k * (elapsedMs / 1000));
}
function elapsedForMultiplier(m, k) {
  if (m <= 1) return 0;
  return (Math.log(m) / k) * 1000;
}

class Game {
  // `cfg` is the merged config for THIS game (configFor(key)); each game runs
  // its own independent round loop and broadcasts only to its own room.
  constructor(io, cfg) {
    this.io = io;
    this.C = cfg;
    this.key = cfg.key;
    this.bots = new Bots();
    this.roundId = 0;
    this.phase = 'betting';
    this.startTime = 0; // when running started
    this.crashPoint = 0;
    this.crashAt = 0; // wall-clock ms when this round busts
    this.serverSeed = '';     // secret until the round busts
    this.serverSeedHash = ''; // commitment, published before bets
    this.phaseEndsAt = 0;
    this.players = new Map(); // socketId -> { balance, bets: {0,1} }
    this.holders = 0;
    this.startHolders = 0;
    this.holdersTimeline = [];
    this.leaderboard = []; // top wins this server session (shared engine feature)
  }

  start() {
    this._enterBetting();
    this.loop = setInterval(() => this._tick(), this.C.TICK_MS);
    // Independent ambient chatter / activity cadence.
    this.chatLoop = setInterval(() => this._ambient(), 1800);
  }

  online() {
    const wobble = Math.round((Math.sin(Date.now() / 9000) * 0.5 + 0.5) * this.C.ONLINE_JITTER);
    return this.C.BASE_ONLINE + this.players.size + wobble;
  }

  addPlayer(socket) {
    socket.join(this.key); // only receive this game's broadcasts
    this.players.set(socket.id, {
      balance: this.C.START_BALANCE,
      bets: { 0: null, 1: null }, // each: { amount, cashedOut, payout }
    });
    socket.emit('welcome', {
      balance: this.C.START_BALANCE,
      game: this.key,
      config: {
        GROWTH_K: this.C.GROWTH_K,
        MAX_RUN_MS: this.C.MAX_RUN_MS,
        MAX_MULTIPLIER: this.C.MAX_MULTIPLIER,
        HOUSE_EDGE: this.C.HOUSE_EDGE,
      },
    });
    socket.emit('leaderboard', this.leaderboard);
    this._sendState(socket);
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  // Test helper: top up credits.
  addCredits(socket, amount) {
    const p = this.players.get(socket.id);
    if (!p) return;
    const add = Math.max(0, Math.min(1_000_000, Number(amount) || 0));
    p.balance = Math.round((p.balance + add) * 100) / 100;
    socket.emit('balance', p.balance);
  }

  // --- player actions ------------------------------------------------------
  placeBet(socket, slot, amount, autoCashout) {
    const p = this.players.get(socket.id);
    if (!p) return;
    if (this.phase !== 'betting') return socket.emit('error_msg', 'Betting is closed');
    slot = slot === 1 ? 1 : 0;
    amount = Math.max(0, Number(amount) || 0);
    if (amount <= 0) return;
    if (p.bets[slot]) return; // already bet this slot
    if (p.balance < amount) return socket.emit('error_msg', 'Insufficient balance');
    // optional auto cash-out target (server-side so it fires even if the UI lags)
    let auto = Number(autoCashout);
    auto = Number.isFinite(auto) && auto > 1.01 ? Math.min(auto, this.C.MAX_MULTIPLIER) : null;
    p.balance = Math.round((p.balance - amount) * 100) / 100;
    p.bets[slot] = { amount, cashedOut: false, payout: 0, autoCashout: auto };
    socket.emit('balance', p.balance);
    socket.emit('bet_ack', { slot, amount, autoCashout: auto });
  }

  cancelBet(socket, slot) {
    const p = this.players.get(socket.id);
    if (!p) return;
    if (this.phase !== 'betting') return;
    slot = slot === 1 ? 1 : 0;
    const bet = p.bets[slot];
    if (!bet || bet.cashedOut) return;
    p.balance = Math.round((p.balance + bet.amount) * 100) / 100;
    p.bets[slot] = null;
    socket.emit('balance', p.balance);
    socket.emit('bet_cancelled', { slot });
  }

  // STASH — lock the winnings for a slot (manual button → current multiplier).
  stash(socket, slot) {
    if (this.phase !== 'running') return;
    slot = slot === 1 ? 1 : 0;
    this._cashOut(socket.id, slot, this._currentMultiplier());
  }

  // Shared cash-out path for manual stash AND server-side auto cash-out.
  _cashOut(id, slot, m) {
    const p = this.players.get(id);
    if (!p) return false;
    const bet = p.bets[slot];
    if (!bet || bet.cashedOut) return false;
    const mult = Math.round(m * 100) / 100;
    const payout = Math.round(bet.amount * m * 100) / 100;
    bet.cashedOut = true;
    bet.payout = payout;
    bet.cashedAt = m;
    p.balance = Math.round((p.balance + payout) * 100) / 100;
    const sock = this.io.sockets.sockets.get(id);
    if (sock) {
      sock.emit('balance', p.balance);
      sock.emit('stashed', { slot, multiplier: mult, payout });
    }
    this.io.to(this.key).emit('activity', { kind: 'stash', name: 'You', amount: payout, multiplier: mult, ts: Date.now() });
    this._recordWin('You', payout, mult);
    return true;
  }

  // --- round lifecycle -----------------------------------------------------
  _enterBetting() {
    this.roundId += 1;
    this.phase = 'betting';
    this.startTime = 0;
    // provably fair: commit to a fresh seed BEFORE bets; bind the crash point
    // to it so it can't change after the fact, then reveal the seed on crash.
    this.serverSeed = generateServerSeed();
    this.serverSeedHash = commitment(this.serverSeed);
    this.crashPoint = crashPointFromSeed(this.serverSeed, this.roundId, this.C);
    this.phaseEndsAt = Date.now() + this.C.BETTING_MS;
    this.startHolders = this.C.MIN_HOLDERS + Math.floor(Math.random() * (this.C.MAX_HOLDERS - this.C.MIN_HOLDERS));
    this.holders = this.startHolders;
    this.holdersTimeline = [];
    // Clear previous round bets.
    for (const p of this.players.values()) p.bets = { 0: null, 1: null };
    this._broadcast('round_new');
  }

  _enterRunning() {
    this.phase = 'running';
    this.startTime = Date.now();
    const dur = Math.min(elapsedForMultiplier(this.crashPoint, this.C.GROWTH_K), this.C.MAX_RUN_MS);
    this.crashAt = this.startTime + dur;
    this._broadcast('round_start');
  }

  _enterCrashed() {
    this.phase = 'crashed';
    this.phaseEndsAt = Date.now() + this.C.CRASHED_MS;
    // Settle losers (real players who never stashed).
    for (const [id, p] of this.players.entries()) {
      for (const slot of [0, 1]) {
        const bet = p.bets[slot];
        if (bet && !bet.cashedOut) bet.lost = true;
      }
      const sock = this.io.sockets.sockets.get(id);
      if (sock) sock.emit('balance', p.balance);
    }
    this.holdersTimeline.push(0);
    this._broadcast('crash');
  }

  _currentMultiplier() {
    if (this.phase !== 'running') return this.phase === 'crashed' ? this.crashPoint : 1.0;
    const m = multiplierAt(Date.now() - this.startTime, this.C.GROWTH_K);
    return Math.min(m, this.crashPoint);
  }

  _tick() {
    const now = Date.now();
    if (this.phase === 'betting') {
      if (now >= this.phaseEndsAt) return this._enterRunning();
    } else if (this.phase === 'running') {
      // Holders melt away as the multiplier climbs (the secondary game).
      const m = this._currentMultiplier();
      // server-side auto cash-out: fire the moment the target is reached, paid
      // out exactly at the target (not the overshoot).
      for (const [id, p] of this.players.entries()) {
        for (const slot of [0, 1]) {
          const bet = p.bets[slot];
          if (bet && !bet.cashedOut && bet.autoCashout && m >= bet.autoCashout) {
            this._cashOut(id, slot, bet.autoCashout);
          }
        }
      }
      const progress = Math.min(1, (now - this.startTime) / Math.max(1, this.crashAt - this.startTime));
      const decay = Math.pow(1 - progress, 2.2);
      const noise = 0.96 + Math.random() * 0.06;
      this.holders = Math.max(1, Math.round(this.startHolders * decay * noise));
      if (this.holdersTimeline.length === 0 || m >= 1) {
        const last = this.holdersTimeline[this.holdersTimeline.length - 1];
        if (last !== this.holders) this.holdersTimeline.push(this.holders);
        if (this.holdersTimeline.length > 12) this.holdersTimeline.shift();
      }
      if (now >= this.crashAt) return this._enterCrashed();
    } else if (this.phase === 'crashed') {
      if (now >= this.phaseEndsAt) return this._enterBetting();
    }
    this._broadcast();
  }

  _statePayload() {
    return {
      roundId: this.roundId,
      phase: this.phase,
      now: Date.now(),
      startTime: this.startTime,
      phaseEndsAt: this.phaseEndsAt,
      crashPoint: this.phase === 'crashed' ? this.crashPoint : undefined,
      // provably fair: the commitment is public every phase; the seed is only
      // revealed once the round has busted.
      serverSeedHash: this.serverSeedHash,
      serverSeed: this.phase === 'crashed' ? this.serverSeed : undefined,
      multiplier: Math.round(this._currentMultiplier() * 100) / 100,
      holders: this.holders,
      startHolders: this.startHolders,
      holdersTimeline: this.holdersTimeline,
      online: this.online(),
    };
  }

  _sendState(socket) {
    socket.emit('state', this._statePayload());
  }

  _broadcast(event) {
    const payload = this._statePayload();
    this.io.to(this.key).emit('state', payload);
    if (event) this.io.to(this.key).emit(event, payload);
  }

  // Ambient bot chat + activity so the room always feels alive.
  _ambient() {
    const msg = this.bots.chat(this.phase, this._currentMultiplier());
    if (msg) this.io.to(this.key).emit('chat', msg);
    const act = this.bots.activity(this.phase, this._currentMultiplier());
    if (act) {
      this.io.to(this.key).emit('activity', act);
      if (act.kind === 'stash') this._recordWin(act.name, act.amount, act.multiplier);
    }
  }

  // Top wins this server session (in-memory; resets on redeploy). Shared engine
  // feature — every game gets a leaderboard for free.
  _recordWin(name, amount, multiplier) {
    this.leaderboard.push({ name, amount, multiplier: multiplier || 0, ts: Date.now() });
    this.leaderboard.sort((a, b) => b.amount - a.amount);
    if (this.leaderboard.length > 20) this.leaderboard.length = 20;
    this.io.to(this.key).emit('leaderboard', this.leaderboard);
  }
}

module.exports = { Game, multiplierAt, elapsedForMultiplier };
