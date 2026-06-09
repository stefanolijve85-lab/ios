/**
 * RocketRush — authoritative multiplayer game server (MVP).
 *
 * One shared round clock for ALL connected players. The server:
 *  - decides the crash point BEFORE each round (provably fair),
 *  - broadcasts betting → start → crash to everyone,
 *  - validates bets / cashouts and owns each player's balance,
 *  - relays chat, winners feed and the live online count.
 *
 * This is the real product loop. It maps 1:1 to the NestJS GameGateway
 * documented in docs/02-architecture.md — kept as plain Node + Socket.io so
 * the whole game runs with a single `npm run dev` and zero infra.
 *
 * Run: node server/game-server.mjs   (PORT defaults to 3001)
 */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Server } from 'socket.io';
import { crashPoint, hmacHex, sha256 } from '../verify-fairness.mjs';

const PORT = process.env.GAME_PORT ? Number(process.env.GAME_PORT) : 3001;

// Growth rate MUST match the client (multAt: e^(RATE*t)).
const RATE = 0.16;
const BET_MS = 5000;     // betting window
const PAUSE_MS = 3200;   // pause after crash
const START_BALANCE = 1000;

const NAMES = ['Nova','Orbit','Zenith','Comet','Vega','Astra','Pulsar','Quasar','Lyra','Titan','Apollo','Luna','Helio','Cosmo','Stellar','Falcon','Drift','Echo','Onyx','Mika','Rin','Kai','Juno','Atlas','Sol','Iris','Nyx','Rex','Zara','Milo'];
const COLORS = ['#FF8A00','#9B5CF6','#22C55E','#38BDF8','#F43F5E','#EAB308','#EC4899','#14B8A6'];
const CHATTER = ['gg 🚀','cashed at last sec 😮‍💨','to the moon!','rip my bet','easy 2x','who else holding?','that was brutal','provably fair ftw','nice round','10x incoming i feel it','lfg 🔥','red wall incoming','green day today'];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ----------------------------- round state ----------------------------- */
const CLIENT_SEED = 'rocketrush-public-v1'; // shared, public, rotatable
const game = {
  phase: 'idle',          // betting | running | crashed
  nonce: 0,
  serverSeed: randomBytes(16).toString('hex'),
  serverSeedHash: '',
  prevServerSeed: '—',    // revealed seed of the previous round
  prevHmac: '',
  crash: 0,
  startedAt: 0,
  bettingEndsAt: 0,
  recentRounds: [],   // last completed rounds (revealed) for the History screen
};

// socketId -> { name, color, balance, bet: {amount, auto, cashedOut} | null }
const players = new Map();

const httpServer = createServer((req, res) => {
  // tiny health check
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('RocketRush game server OK');
});
const io = new Server(httpServer, { cors: { origin: '*' } });

/* ------------------------------ helpers -------------------------------- */
const online = () => io.engine.clientsCount;
const multAt = t => Math.max(1, Math.exp(RATE * t));
const liveMult = () => multAt((Date.now() - game.startedAt) / 1000);

function broadcastPlayers() { io.emit('players', { count: online() }); }

function settleCashout(sock, p, mult) {
  p.bet.cashedOut = true;
  const payout = Math.round(p.bet.amount * mult * 100) / 100;
  p.balance = Math.round((p.balance + payout) * 100) / 100;
  sock.emit('cashout:confirmed', { multiplier: mult, payout, balance: p.balance });
  io.emit('winner', { name: p.name, color: p.color, multiplier: mult, amount: payout });
}

/* --------------------------- round lifecycle --------------------------- */
function startBetting() {
  game.phase = 'betting';
  game.prevServerSeed = game.serverSeed;          // reveal previous round's seed
  game.serverSeed = randomBytes(16).toString('hex');
  game.serverSeedHash = sha256(game.serverSeed);  // commit (publish hash)
  game.nonce += 1;
  // crash point fixed NOW, before any bet — provably fair
  game.crash = crashPoint(game.serverSeed, CLIENT_SEED, game.nonce);
  game.bettingEndsAt = Date.now() + BET_MS;

  for (const p of players.values()) p.bet = null;

  io.emit('round:betting', {
    nonce: game.nonce,
    serverSeedHash: game.serverSeedHash,
    prevServerSeed: game.prevServerSeed,
    clientSeed: CLIENT_SEED,
    startsInMs: BET_MS,
  });
  setTimeout(startRunning, BET_MS);
}

function startRunning() {
  game.phase = 'running';
  game.startedAt = Date.now();
  io.emit('round:start', { startedAt: game.startedAt });

  // exact time to reach the crash multiplier, so client (same formula) matches
  const durMs = Math.max(0, (Math.log(game.crash) / RATE) * 1000);

  // server-side auto-cashout + light tick (keepalive / correction)
  game.tick = setInterval(() => {
    const m = liveMult();
    for (const [id, p] of players) {
      if (p.bet && !p.bet.cashedOut && p.bet.auto > 0 && p.bet.auto <= game.crash && m >= p.bet.auto) {
        const s = io.sockets.sockets.get(id);
        if (s) settleCashout(s, p, p.bet.auto);
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
  // un-cashed bets are already debited; nothing to refund
  setTimeout(startBetting, PAUSE_MS);
}

/* --------- bots: keep the room lively even with one real player -------- */
function scheduleBots(durMs) {
  const n = 2 + Math.floor(rnd(0, 5));
  for (let i = 0; i < n; i++) {
    const target = rnd(1.15, Math.max(1.2, game.crash * 0.95));
    if (target >= game.crash) continue;
    const at = (Math.log(target) / RATE) * 1000;
    setTimeout(() => {
      if (game.phase !== 'running') return;
      const bet = Math.round(rnd(20, 800) / 10) * 10;
      io.emit('winner', { name: pick(NAMES), color: pick(COLORS), multiplier: target, amount: Math.round(bet * target * 100) / 100 });
    }, at);
  }
}
setInterval(() => {
  if (Math.random() < 0.75) io.emit('chat', { user: pick(NAMES), text: pick(CHATTER) });
}, 3600);

/* ------------------------------ snapshot ------------------------------- */
// so a player joining mid-round sees the correct state immediately
function snapshotFor(sock) {
  const base = { nonce: game.nonce, serverSeedHash: game.serverSeedHash, prevServerSeed: game.prevServerSeed, clientSeed: CLIENT_SEED };
  if (game.phase === 'betting') {
    sock.emit('round:betting', { ...base, startsInMs: Math.max(0, game.bettingEndsAt - Date.now()) });
  } else if (game.phase === 'running') {
    sock.emit('round:start', { startedAt: game.startedAt });
  }
}

/* ----------------------------- connections ----------------------------- */
io.on('connection', (sock) => {
  const name = 'You'; // the player is "You" on their own screen
  const p = { name, color: '#22C55E', balance: START_BALANCE, bet: null };
  players.set(sock.id, p);

  sock.emit('welcome', { name, balance: p.balance, online: online() });
  sock.emit('history', { rounds: game.recentRounds.slice(0, 20) });
  broadcastPlayers();
  snapshotFor(sock);

  sock.on('bet:place', ({ amount, auto } = {}) => {
    amount = Number(amount);
    if (game.phase !== 'betting') return sock.emit('bet:rejected', { reason: 'PHASE_CLOSED' });
    if (p.bet) return sock.emit('bet:rejected', { reason: 'ALREADY_BET' });
    if (!(amount > 0) || amount > p.balance) return sock.emit('bet:rejected', { reason: 'INSUFFICIENT_BALANCE' });
    p.balance = Math.round((p.balance - amount) * 100) / 100;
    p.bet = { amount, auto: Number(auto) || 0, cashedOut: false };
    sock.emit('bet:confirmed', { amount, auto: p.bet.auto, balance: p.balance });
  });

  sock.on('bet:cancel', () => {
    if (game.phase !== 'betting' || !p.bet || p.bet.cashedOut) return;
    p.balance = Math.round((p.balance + p.bet.amount) * 100) / 100;
    p.bet = null;
    sock.emit('bet:cancelled', { balance: p.balance });
  });

  sock.on('cashout', () => {
    if (game.phase !== 'running' || !p.bet || p.bet.cashedOut) return;
    const m = liveMult();
    if (m >= game.crash) return; // too late
    settleCashout(sock, p, Math.floor(m * 100) / 100);
  });

  sock.on('chat:send', ({ text } = {}) => {
    text = String(text || '').slice(0, 120).trim();
    if (text) io.emit('chat', { user: 'Guest', text });
  });

  sock.on('disconnect', () => { players.delete(sock.id); broadcastPlayers(); });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  game.serverSeedHash = sha256(game.serverSeed);
  console.log(`🚀 RocketRush game server on http://0.0.0.0:${PORT}`);
  startBetting();
});
