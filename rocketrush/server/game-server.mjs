/**
 * RocketRush — authoritative multiplayer game server (MVP).
 *
 * One shared round clock for ALL players. The server decides the crash point
 * before each round (provably fair), broadcasts betting → start → crash,
 * validates bets/cashouts, and owns each player's wallet, stats, bet history
 * and transactions.
 *
 * Accounts: if a Supabase access token is supplied on connect it's verified and
 * the player's data is keyed by their user id and stored in Supabase Postgres
 * (progress follows them across devices). Otherwise a guest record keyed by a
 * per-browser playerId is used (local JSON file). See server/store.mjs.
 *
 * Run: node server/game-server.mjs   (PORT defaults to 3001)
 */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Server } from 'socket.io';
import { crashPoint, hmacHex, sha256 } from '../verify-fairness.mjs';
import { makeStores, START_BALANCE } from './store.mjs';

const PORT = process.env.GAME_PORT ? Number(process.env.GAME_PORT) : 3001;
const RATE = 0.16;       // growth rate — MUST match the client (multAt: e^(RATE*t))
const BET_MS = 5000;     // betting window
const PAUSE_MS = 3200;   // pause after crash
const r2 = n => Math.round(n * 100) / 100;

const NAMES = ['Nova','Orbit','Zenith','Comet','Vega','Astra','Pulsar','Quasar','Lyra','Titan','Apollo','Luna','Helio','Cosmo','Stellar','Falcon','Drift','Echo','Onyx','Mika','Rin','Kai','Juno','Atlas','Sol','Iris','Nyx','Rex','Zara','Milo'];
const COLORS = ['#FF8A00','#9B5CF6','#22C55E','#38BDF8','#F43F5E','#EAB308','#EC4899','#14B8A6'];
const CHATTER = ['gg 🚀','cashed at last sec 😮‍💨','to the moon!','rip my bet','easy 2x','who else holding?','that was brutal','provably fair ftw','nice round','10x incoming i feel it','lfg 🔥','red wall incoming','green day today'];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const stores = await makeStores();   // { supabase, account, guest }

/* ----------------------------- round state ----------------------------- */
const CLIENT_SEED = 'rocketrush-public-v1';
const game = {
  phase: 'idle', nonce: 0,
  serverSeed: randomBytes(16).toString('hex'), serverSeedHash: '',
  prevServerSeed: '—', prevHmac: '',
  crash: 0, startedAt: 0, bettingEndsAt: 0,
  recentRounds: [],
};
const players = new Map();   // socketId -> player

const httpServer = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('RocketRush game server OK'); });
const io = new Server(httpServer, { cors: { origin: '*' } });

const online = () => io.engine.clientsCount;
const multAt = t => Math.max(1, Math.exp(RATE * t));
const liveMult = () => multAt((Date.now() - game.startedAt) / 1000);
const broadcastPlayers = () => io.emit('players', { count: online() });

/* ----------------------------- bookkeeping ----------------------------- */
function addTx(p, type, amount) { const tx = { type, amount: r2(amount), balanceAfter: p.rec.balance, ts: Date.now() }; p.rec.tx.unshift(tx); if (p.rec.tx.length > 200) p.rec.tx.pop(); return tx; }
function addBet(p, bet) { p.rec.bets.unshift(bet); if (p.rec.bets.length > 200) p.rec.bets.pop(); }
function statsWin(s, amount, mult, payout) { const profit = r2(payout - amount); s.played++; s.wins++; s.wagered = r2(s.wagered + amount); s.returned = r2(s.returned + payout); s.best = Math.max(s.best, mult); s.bestWin = Math.max(s.bestWin, profit); s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); return profit; }
function statsLoss(s, amount) { s.played++; s.wagered = r2(s.wagered + amount); s.streak = 0; }

function pushProfile(sock, p) {
  sock.emit('profile', { account: p.account, balance: p.rec.balance, stats: p.rec.stats, bets: p.rec.bets.slice(0, 50), tx: p.rec.tx.slice(0, 50) });
}

function settleCashout(sock, p, mult) {
  p.bet.cashedOut = true;
  const amount = p.bet.amount, payout = r2(amount * mult);
  p.rec.balance = r2(p.rec.balance + payout);
  const profit = statsWin(p.rec.stats, amount, mult, payout);
  addBet(p, { nonce: p.bet.nonce, amount, won: true, mult, payout, profit, ts: Date.now() });
  addTx(p, 'win', payout);
  p.store.saveBalance(p.key, p.rec); p.store.saveBet(p.key, p.rec); p.store.saveTx(p.key, p.rec);
  sock.emit('cashout:confirmed', { multiplier: mult, payout, balance: p.rec.balance });
  pushProfile(sock, p);
  sock.broadcast.emit('winner', { name: p.display, color: p.color, multiplier: mult, amount: payout });
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
  for (const p of players.values()) p.bet = null;
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
      if (p.bet && !p.bet.cashedOut && p.bet.auto > 0 && p.bet.auto <= game.crash && m >= p.bet.auto) {
        const s = io.sockets.sockets.get(id); if (s) settleCashout(s, p, p.bet.auto);
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
  // resolve every un-cashed bet as a loss (balance was already debited on place)
  for (const [id, p] of players) {
    if (p.bet && !p.bet.cashedOut) {
      statsLoss(p.rec.stats, p.bet.amount);
      addBet(p, { nonce: p.bet.nonce, amount: p.bet.amount, won: false, profit: -p.bet.amount, ts: Date.now() });
      p.store.saveBet(p.key, p.rec);
      const s = io.sockets.sockets.get(id); if (s) pushProfile(s, p);
    }
    p.bet = null;
  }
  setTimeout(startBetting, PAUSE_MS);
}

function scheduleBots(durMs) {
  const n = 2 + Math.floor(rnd(0, 5));
  for (let i = 0; i < n; i++) {
    const target = rnd(1.15, Math.max(1.2, game.crash * 0.95));
    if (target >= game.crash) continue;
    setTimeout(() => {
      if (game.phase !== 'running') return;
      const bet = Math.round(rnd(20, 800) / 10) * 10;
      io.emit('winner', { name: pick(NAMES), color: pick(COLORS), multiplier: target, amount: r2(bet * target) });
    }, (Math.log(target) / RATE) * 1000);
  }
}
setInterval(() => { if (Math.random() < 0.75) io.emit('chat', { user: pick(NAMES), text: pick(CHATTER) }); }, 3600);

function snapshotFor(sock) {
  if (game.phase === 'betting') sock.emit('round:betting', { nonce: game.nonce, serverSeedHash: game.serverSeedHash, prevServerSeed: game.prevServerSeed, clientSeed: CLIENT_SEED, startsInMs: Math.max(0, game.bettingEndsAt - Date.now()) });
  else if (game.phase === 'running') sock.emit('round:start', { startedAt: game.startedAt });
}

/* --------------------------- auth resolution --------------------------- */
async function resolveAuth(sock) {
  const a = sock.handshake.auth || {};
  if (stores.supabase && a.token) {
    try {
      const { data, error } = await stores.supabase.auth.getUser(a.token);
      if (!error && data && data.user) {
        const u = data.user;
        const username = (u.user_metadata && (u.user_metadata.username || u.user_metadata.name)) || (u.email ? u.email.split('@')[0] : 'player');
        return { account: { id: u.id, email: u.email, username }, store: stores.account, key: u.id };
      }
    } catch { /* fall through to guest */ }
  }
  const pid = a.playerId || sock.id;
  return { account: null, store: stores.guest, key: 'g:' + pid };
}

/* ----------------------------- connections ----------------------------- */
io.on('connection', async (sock) => {
  const auth = await resolveAuth(sock);
  const p = { name: 'You', display: auth.account ? auth.account.username : 'You', color: '#22C55E', account: auth.account, store: auth.store, key: auth.key, bet: null, rec: null };
  p.rec = await auth.store.init(auth.key);
  if (!(p.rec.balance >= 10)) { const old = p.rec.balance; p.rec.balance = START_BALANCE; addTx(p, 'reup', START_BALANCE - old); p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec); } // free re-up (play money)
  players.set(sock.id, p);

  sock.emit('welcome', { name: p.name, online: online() });
  pushProfile(sock, p);
  sock.emit('history', { rounds: game.recentRounds.slice(0, 20) });
  broadcastPlayers();
  snapshotFor(sock);

  sock.on('bet:place', ({ amount, auto } = {}) => {
    amount = Number(amount);
    if (game.phase !== 'betting') return sock.emit('bet:rejected', { reason: 'PHASE_CLOSED' });
    if (p.bet) return sock.emit('bet:rejected', { reason: 'ALREADY_BET' });
    if (!(amount > 0) || amount > p.rec.balance) return sock.emit('bet:rejected', { reason: 'INSUFFICIENT_BALANCE' });
    p.rec.balance = r2(p.rec.balance - amount);
    p.bet = { amount, auto: Number(auto) || 0, cashedOut: false, nonce: game.nonce };
    addTx(p, 'bet', -amount);
    p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec);
    sock.emit('bet:confirmed', { amount, auto: p.bet.auto, balance: p.rec.balance });
    pushProfile(sock, p);
  });

  sock.on('bet:cancel', () => {
    if (game.phase !== 'betting' || !p.bet || p.bet.cashedOut) return;
    p.rec.balance = r2(p.rec.balance + p.bet.amount);
    addTx(p, 'refund', p.bet.amount);
    p.bet = null;
    p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec);
    sock.emit('bet:cancelled', { balance: p.rec.balance });
    pushProfile(sock, p);
  });

  sock.on('reset', () => {
    const old = p.rec.balance; p.rec.balance = START_BALANCE; p.bet = null;
    addTx(p, 'reset', START_BALANCE - old);
    p.store.saveBalance(p.key, p.rec); p.store.saveTx(p.key, p.rec);
    pushProfile(sock, p);
  });

  sock.on('cashout', () => {
    if (game.phase !== 'running' || !p.bet || p.bet.cashedOut) return;
    const m = liveMult();
    if (m >= game.crash) return;
    settleCashout(sock, p, Math.floor(m * 100) / 100);
  });

  sock.on('chat:send', ({ text } = {}) => {
    text = String(text || '').slice(0, 120).trim();
    if (text) io.emit('chat', { user: p.display || 'Guest', text });
  });

  sock.on('disconnect', () => { players.delete(sock.id); broadcastPlayers(); });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  game.serverSeedHash = sha256(game.serverSeed);
  console.log(`🚀 RocketRush game server on http://0.0.0.0:${PORT}`);
  startBetting();
});
