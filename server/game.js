const crypto = require('crypto');
const C = require('./config');
const { Bots } = require('./bots');

// ---------------------------------------------------------------------------
// Multiplier math (server authoritative). The same pure function lives on the
// client so the UI can animate at 60fps from a shared startTime without the
// server needing to stream every frame.
// ---------------------------------------------------------------------------
function multiplierAt(elapsedMs) {
  if (elapsedMs <= 0) return 1.0;
  return Math.exp(C.GROWTH_K * (elapsedMs / 1000));
}
function elapsedForMultiplier(m) {
  if (m <= 1) return 0;
  return (Math.log(m) / C.GROWTH_K) * 1000;
}

// Provably-fair-style crash point. A simple, transparent variant:
//  - HOUSE_EDGE chance of an instant bust (1.00x)
//  - otherwise a heavy-tailed distribution, capped to fit the round window.
function generateCrashPoint() {
  const seed = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff; // [0,1)
  if (seed < C.HOUSE_EDGE) return 1.0;
  const r = crypto.randomBytes(4).readUInt32BE(0) / 0x100000000; // [0,1)
  let cp = (1 - C.HOUSE_EDGE) / (1 - r);
  cp = Math.max(1.01, Math.min(cp, C.MAX_MULTIPLIER));
  return Math.floor(cp * 100) / 100;
}

class Game {
  constructor(io) {
    this.io = io;
    this.bots = new Bots();
    this.roundId = 0;
    this.phase = 'betting';
    this.startTime = 0; // when running started
    this.crashPoint = 0;
    this.crashAt = 0; // wall-clock ms when this round busts
    this.phaseEndsAt = 0;
    this.players = new Map(); // socketId -> { balance, bets: {0,1} }
    this.holders = 0;
    this.startHolders = 0;
    this.holdersTimeline = [];
  }

  start() {
    this._enterBetting();
    this.loop = setInterval(() => this._tick(), C.TICK_MS);
    // Independent ambient chatter / activity cadence.
    this.chatLoop = setInterval(() => this._ambient(), 1800);
  }

  online() {
    const wobble = Math.round((Math.sin(Date.now() / 9000) * 0.5 + 0.5) * C.ONLINE_JITTER);
    return C.BASE_ONLINE + this.players.size + wobble;
  }

  addPlayer(socket) {
    this.players.set(socket.id, {
      balance: C.START_BALANCE,
      bets: { 0: null, 1: null }, // each: { amount, cashedOut, payout }
    });
    socket.emit('welcome', {
      balance: C.START_BALANCE,
      config: {
        GROWTH_K: C.GROWTH_K,
        MAX_RUN_MS: C.MAX_RUN_MS,
        MAX_MULTIPLIER: C.MAX_MULTIPLIER,
      },
    });
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
  placeBet(socket, slot, amount) {
    const p = this.players.get(socket.id);
    if (!p) return;
    if (this.phase !== 'betting') return socket.emit('error_msg', 'Betting is closed');
    slot = slot === 1 ? 1 : 0;
    amount = Math.max(0, Number(amount) || 0);
    if (amount <= 0) return;
    if (p.bets[slot]) return; // already bet this slot
    if (p.balance < amount) return socket.emit('error_msg', 'Insufficient balance');
    p.balance = Math.round((p.balance - amount) * 100) / 100;
    p.bets[slot] = { amount, cashedOut: false, payout: 0 };
    socket.emit('balance', p.balance);
    socket.emit('bet_ack', { slot, amount });
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

  // STASH — lock the winnings for a slot.
  stash(socket, slot) {
    const p = this.players.get(socket.id);
    if (!p) return;
    if (this.phase !== 'running') return;
    slot = slot === 1 ? 1 : 0;
    const bet = p.bets[slot];
    if (!bet || bet.cashedOut) return;
    const m = this._currentMultiplier();
    const payout = Math.round(bet.amount * m * 100) / 100;
    bet.cashedOut = true;
    bet.payout = payout;
    bet.cashedAt = m;
    p.balance = Math.round((p.balance + payout) * 100) / 100;
    socket.emit('balance', p.balance);
    socket.emit('stashed', { slot, multiplier: Math.round(m * 100) / 100, payout });
    // Real player cash-outs feed the live activity feed.
    this.io.emit('activity', {
      kind: 'stash',
      name: 'You',
      amount: payout,
      multiplier: Math.round(m * 100) / 100,
      ts: Date.now(),
    });
  }

  // --- round lifecycle -----------------------------------------------------
  _enterBetting() {
    this.roundId += 1;
    this.phase = 'betting';
    this.startTime = 0;
    this.crashPoint = generateCrashPoint();
    this.phaseEndsAt = Date.now() + C.BETTING_MS;
    this.startHolders = C.MIN_HOLDERS + Math.floor(Math.random() * (C.MAX_HOLDERS - C.MIN_HOLDERS));
    this.holders = this.startHolders;
    this.holdersTimeline = [];
    // Clear previous round bets.
    for (const p of this.players.values()) p.bets = { 0: null, 1: null };
    this._broadcast('round_new');
  }

  _enterRunning() {
    this.phase = 'running';
    this.startTime = Date.now();
    const dur = Math.min(elapsedForMultiplier(this.crashPoint), C.MAX_RUN_MS);
    this.crashAt = this.startTime + dur;
    this._broadcast('round_start');
  }

  _enterCrashed() {
    this.phase = 'crashed';
    this.phaseEndsAt = Date.now() + C.CRASHED_MS;
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
    const m = multiplierAt(Date.now() - this.startTime);
    return Math.min(m, this.crashPoint);
  }

  _tick() {
    const now = Date.now();
    if (this.phase === 'betting') {
      if (now >= this.phaseEndsAt) return this._enterRunning();
    } else if (this.phase === 'running') {
      // Holders melt away as the multiplier climbs (the secondary game).
      const m = this._currentMultiplier();
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
    this.io.emit('state', payload);
    if (event) this.io.emit(event, payload);
  }

  // Ambient bot chat + activity so the room always feels alive.
  _ambient() {
    const msg = this.bots.chat(this.phase, this._currentMultiplier());
    if (msg) this.io.emit('chat', msg);
    const act = this.bots.activity(this.phase, this._currentMultiplier());
    if (act) this.io.emit('activity', act);
  }
}

module.exports = { Game, multiplierAt, elapsedForMultiplier };
