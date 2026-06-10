/**
 * RocketRush — authoritative multiplayer game logic.
 *
 * One shared round clock for ALL players. Decides the crash point before each
 * round (provably fair), broadcasts betting → start → crash, validates
 * bets/cashouts, owns each player's wallet/stats/bets/transactions, and powers
 * the leaderboard, public profiles and live activity feed.
 *
 * Exposed as attachGame(io) so it can run on the SAME HTTP server / origin as
 * the Next.js app (see ../server.mjs). No own port — single-origin friendly.
 */
import { randomBytes } from 'node:crypto';
import { crashPoint, hmacHex, sha256 } from '../verify-fairness.mjs';
import { makeStores, START_BALANCE } from './store.mjs';
import { upsertProfile, recordPlay, getProfile, leaderboard, pushActivity, recentActivity, seedBots } from './social.mjs';

const RATE = 0.16;       // growth rate — MUST match the client (multAt: e^(RATE*t))
const BET_MS = 5000;     // betting window
const PAUSE_MS = 3200;   // pause after crash
const r2 = n => Math.round(n * 100) / 100;

const NAMES = ['Nova','Orbit','Zenith','Comet','Vega','Astra','Pulsar','Quasar','Lyra','Titan','Apollo','Luna','Helio','Cosmo','Stellar','Falcon','Drift','Echo','Onyx','Mika','Rin','Kai','Juno','Atlas','Sol','Iris','Nyx','Rex','Zara','Milo'];
const COLORS = ['#FF8A00','#9B5CF6','#22C55E','#38BDF8','#F43F5E','#EAB308','#EC4899','#14B8A6'];
const CHATTER = ['gg 🚀','cashed at last sec 😮‍💨','to the moon!','rip my bet','easy 2x','who else holding?','that was brutal','provably fair ftw','nice round','10x incoming i feel it','lfg 🔥','red wall incoming','green day today'];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const colorFor = pid => COLORS[hash(pid) % COLORS.length];
const guestName = pid => 'Pilot-' + (hash(pid) % 9000 + 1000);
const CLIENT_SEED = 'rocketrush-public-v1';

export async function attachGame(io) {
  const stores = await makeStores();   // { supabase, account, guest }
  seedBots(NAMES, COLORS);             // believable bot profiles + initial leaderboard

  const game = {
    phase: 'idle', nonce: 0,
    serverSeed: randomBytes(16).toString('hex'), serverSeedHash: '',
    prevServerSeed: '—', prevHmac: '',
    crash: 0, startedAt: 0, bettingEndsAt: 0,
    recentRounds: [], tick: null, crashTimer: null,
  };
  const players = new Map();      // socketId -> player
  const recentJoins = new Set();  // throttle duplicate "joined" activity on reconnects

  const online = () => io.engine.clientsCount;
  const multAt = t => Math.max(1, Math.exp(RATE * t));
  const liveMult = () => multAt((Date.now() - game.startedAt) / 1000);
  const broadcastPlayers = () => io.emit('players', { count: online() });
  const activity = (ev, toOthers, sock) => { pushActivity(ev); (toOthers && sock ? sock.broadcast : io).emit('activity', ev); };

  /* ----------------------------- bookkeeping ----------------------------- */
  function addTx(p, type, amount) { const tx = { type, amount: r2(amount), balanceAfter: p.rec.balance, ts: Date.now() }; p.rec.tx.unshift(tx); if (p.rec.tx.length > 200) p.rec.tx.pop(); return tx; }
  function addBet(p, bet) { p.rec.bets.unshift(bet); if (p.rec.bets.length > 200) p.rec.bets.pop(); }
  function statsWin(s, amount, mult, payout) { const profit = r2(payout - amount); s.played++; s.wins++; s.wagered = r2(s.wagered + amount); s.returned = r2(s.returned + payout); s.best = Math.max(s.best, mult); s.bestWin = Math.max(s.bestWin, profit); s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); return profit; }
  function statsLoss(s, amount) { s.played++; s.wagered = r2(s.wagered + amount); s.streak = 0; }
  function pushProfile(sock, p) { sock.emit('profile', { account: p.account, balance: p.rec.balance, stats: p.rec.stats, bets: p.rec.bets.slice(0, 50), tx: p.rec.tx.slice(0, 50) }); }

  function settleCashout(sock, p, slot, mult) {
    const b = p.bets[slot]; if (!b || b.cashedOut) return;
    b.cashedOut = true;
    const amount = b.amount, payout = r2(amount * mult);
    p.rec.balance = r2(p.rec.balance + payout);
    const profit = statsWin(p.rec.stats, amount, mult, payout);
    addBet(p, { nonce: b.nonce, amount, won: true, mult, payout, profit, ts: Date.now() });
    addTx(p, 'win', payout);
    p.store.saveBalance(p.key, p.rec); p.store.saveBet(p.key, p.rec); p.store.saveTx(p.key, p.rec);
    sock.emit('cashout:confirmed', { slot, multiplier: mult, payout, balance: p.rec.balance });
    pushProfile(sock, p);
    recordPlay(p.key, true, mult, payout);
    activity({ type: 'win', pid: p.key, name: p.display, color: p.color, amount: payout, mult }, true, sock);
    if (mult >= 10) activity({ type: 'bigmult', pid: p.key, name: p.display, color: p.color, mult }, true, sock);
  }

  /* --------------------------- round lifecycle --------------------------- */
  function startBetting() {
    game.phase = 'betting';
    game.prevServerSeed = game.serverSeed;
    game.serverSeed = randomBytes(16).toString('hex');
    game.serverSeedHash = sha256(game.serverSeed);
    game.nonce += 1;
    game.crash = crashPoint(game.serverSeed, CLIENT_SEED, game.nonce);
    game.bettingEndsAt = Date.now() + BET_MS;
    for (const p of players.values()) p.bets = [null, null];
    io.emit('round:betting', { nonce: game.nonce, serverSeedHash: game.serverSeedHash, prevServerSeed: game.prevServerSeed, clientSeed: CLIENT_SEED, startsInMs: BET_MS });
    setTimeout(startRunning, BET_MS);
  }

  function startRunning() {
    game.phase = 'running';
    game.startedAt = Date.now();
    io.emit('round:start', { startedAt: game.startedAt });
    const durMs = Math.max(0, (Math.log(game.crash) / RATE) * 1000);
    game.tick = setInterval(() => {
      const m = liveMult();
      for (const [id, p] of players) {
        for (let slot = 0; slot < 2; slot++) {
          const b = p.bets[slot];
          if (b && !b.cashedOut && b.auto > 0 && b.auto <= game.crash && m >= b.auto) {
            const s = io.sockets.sockets.get(id); if (s) settleCashout(s, p, slot, b.auto);
          }
        }
      }
      io.emit('round:tick', { multiplier: m });
    }, 120);
    scheduleBots(durMs);
    game.crashTimer = setTimeout(doCrash, durMs);
  }

  function doCrash() {
    clearInterval(game.tick);
    game.phase = 'crashed';
    game.prevHmac = hmacHex(game.serverSeed, CLIENT_SEED, game.nonce);
    const round = { nonce: game.nonce, crash: game.crash, serverSeed: game.serverSeed, clientSeed: CLIENT_SEED, hmac: game.prevHmac };
    game.recentRounds.unshift(round);
    if (game.recentRounds.length > 40) game.recentRounds.pop();
    io.emit('round:crash', { nonce: round.nonce, crashPoint: round.crash, serverSeed: round.serverSeed, clientSeed: round.clientSeed, hmac: round.hmac });
    for (const [id, p] of players) {
      let changed = false;
      for (let slot = 0; slot < 2; slot++) {
        const b = p.bets[slot];
        if (b && !b.cashedOut) {
          statsLoss(p.rec.stats, b.amount);
          addBet(p, { nonce: b.nonce, amount: b.amount, won: false, profit: -b.amount, ts: Date.now() });
          recordPlay(p.key, false, 0, 0);
          changed = true;
        }
      }
      if (changed) { p.store.saveBet(p.key, p.rec); const s = io.sockets.sockets.get(id); if (s) pushProfile(s, p); }
      p.bets = [null, null];
    }
    setTimeout(startBetting, PAUSE_MS);
  }

  function scheduleBots(durMs) {
    const n = 2 + Math.floor(rnd(0, 5));
    for (let i = 0; i < n; i++) {
      const target = r2(rnd(1.15, Math.max(1.2, game.crash * 0.95)));
      if (target >= game.crash) continue;
      setTimeout(() => {
        if (game.phase !== 'running') return;
        const name = pick(NAMES), pid = 'b:' + name, color = colorFor(pid);
        const payout = r2(Math.round(rnd(20, 800) / 10) * 10 * target);
        recordPlay(pid, true, target, payout);
        activity({ type: 'win', pid, name, color, amount: payout, mult: target });
        if (target >= 10) activity({ type: 'bigmult', pid, name, color, mult: target });
      }, (Math.log(target) / RATE) * 1000);
    }
  }
  setInterval(() => { if (Math.random() < 0.75) { const name = pick(NAMES); io.emit('chat', { user: name, pid: 'b:' + name, text: pick(CHATTER) }); } }, 3600);
  setInterval(() => { if (Math.random() < 0.4) { const name = pick(NAMES); const pid = 'b:' + name; activity({ type: 'join', pid, name, color: colorFor(pid) }); } }, 7000);

  function snapshotFor(sock) {
    if (game.phase === 'betting') sock.emit('round:betting', { nonce: game.nonce, serverSeedHash: game.serverSeedHash, prevServerSeed: game.prevServerSeed, clientSeed: CLIENT_SEED, startsInMs: Math.max(0, game.bettingEndsAt - Date.now()) });
    else if (game.phase === 'running') sock.emit('round:start', { startedAt: game.startedAt });
  }

  async function resolveAuth(sock) {
    const a = sock.handshake.auth || {};
    if (stores.supabase && a.token) {
      try {
        const { data, error } = await stores.supabase.auth.getUser(a.token);
        if (!error && data && data.user) {
          const u = data.user;
          const username = (u.user_metadata && (u.user_metadata.username || u.user_metadata.name)) || (u.email ? u.email.split('@')[0] : 'player');
          const joinDate = u.created_at ? Date.parse(u.created_at) : Date.now();
          return { account: { id: u.id, email: u.email, username, joinDate }, store: stores.account, key: u.id };
        }
      } catch { /* fall through to guest */ }
    }
    const pid = a.playerId || sock.id;
    return { account: null, store: stores.guest, key: 'g:' + pid };
  }

  /* ----------------------------- connections ----------------------------- */
  io.on('connection', async (sock) => {
    const auth = await resolveAuth(sock);
    const publicName = auth.account ? auth.account.username : guestName(auth.key);
    const p = { name: 'You', display: publicName, color: colorFor(auth.key), account: auth.account, store: auth.store, key: auth.key, bets: [null, null], rec: null };
    p.rec = await auth.store.init(auth.key);
    if (!(p.rec.balance >= 10)) { const old = p.rec.balance; p.rec.balance = START_BALANCE; addTx(p, 'reup', START_BALANCE - old); p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec); }
    players.set(sock.id, p);

    upsertProfile(p.key, { name: publicName, color: p.color, joinDate: auth.account && auth.account.joinDate ? auth.account.joinDate : Date.now() });
    sock.emit('welcome', { name: p.name, online: online(), pid: p.key });
    pushProfile(sock, p);
    sock.emit('history', { rounds: game.recentRounds.slice(0, 20) });
    sock.emit('leaderboard', leaderboard());
    sock.emit('activity:recent', { events: recentActivity() });
    if (!recentJoins.has(p.key)) { recentJoins.add(p.key); setTimeout(() => recentJoins.delete(p.key), 60000); activity({ type: 'join', pid: p.key, name: publicName, color: p.color }, true, sock); }
    broadcastPlayers();
    snapshotFor(sock);

    sock.on('profile:get', ({ id } = {}) => { const prof = getProfile(id); if (prof) sock.emit('profile:data', prof); });
    sock.on('leaderboard:get', () => sock.emit('leaderboard', leaderboard()));

    sock.on('bet:place', ({ amount, auto, slot } = {}) => {
      slot = slot === 1 ? 1 : 0; amount = Number(amount);
      if (game.phase !== 'betting') return sock.emit('bet:rejected', { slot, reason: 'PHASE_CLOSED' });
      if (p.bets[slot]) return sock.emit('bet:rejected', { slot, reason: 'ALREADY_BET' });
      if (!(amount > 0) || amount > p.rec.balance) return sock.emit('bet:rejected', { slot, reason: 'INSUFFICIENT_BALANCE' });
      p.rec.balance = r2(p.rec.balance - amount);
      p.bets[slot] = { amount, auto: Number(auto) || 0, cashedOut: false, nonce: game.nonce };
      addTx(p, 'bet', -amount);
      p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec);
      sock.emit('bet:confirmed', { slot, amount, auto: p.bets[slot].auto, balance: p.rec.balance });
      pushProfile(sock, p);
    });

    sock.on('bet:cancel', ({ slot } = {}) => {
      slot = slot === 1 ? 1 : 0; const b = p.bets[slot];
      if (game.phase !== 'betting' || !b || b.cashedOut) return;
      p.rec.balance = r2(p.rec.balance + b.amount);
      addTx(p, 'refund', b.amount);
      p.bets[slot] = null;
      p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec);
      sock.emit('bet:cancelled', { slot, balance: p.rec.balance });
      pushProfile(sock, p);
    });

    sock.on('reset', () => {
      const old = p.rec.balance; p.rec.balance = START_BALANCE; p.bets = [null, null];
      addTx(p, 'reset', START_BALANCE - old);
      p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec);
      pushProfile(sock, p);
    });

    sock.on('cashout', ({ slot } = {}) => {
      slot = slot === 1 ? 1 : 0; const b = p.bets[slot];
      if (game.phase !== 'running' || !b || b.cashedOut) return;
      const m = liveMult();
      if (m >= game.crash) return;
      settleCashout(sock, p, slot, Math.floor(m * 100) / 100);
    });

    sock.on('chat:send', ({ text } = {}) => {
      text = String(text || '').slice(0, 120).trim();
      if (text) io.emit('chat', { user: p.display || 'Guest', pid: p.key, text });
    });

    sock.on('disconnect', () => { players.delete(sock.id); broadcastPlayers(); });
  });

  game.serverSeedHash = sha256(game.serverSeed);
  startBetting();
  console.log(`🎮 RocketRush game logic attached (${stores.supabase ? 'Supabase accounts' : 'guest mode'})`);
}
