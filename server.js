// Single-origin server: Next.js (web app) + Socket.io (realtime) on one port.
// This is what makes STASH "Render / Railway / Docker compatible" out of the box
// and what keeps iPhone Safari happy (no cross-origin websocket headaches).

const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { Game } = require('./server/game');
const { configFor, games, DEFAULT_GAME_KEY } = require('./server/config');

// Which game a socket belongs to: explicit ?game= from the client wins, else
// infer from the hostname (bankheistx.com → bankheistx, liftoffx.com → liftoffx).
function gameKeyForHost(host) {
  const h = (host || '').toLowerCase();
  for (const k of Object.keys(games)) if (h.includes(k)) return k;
  return DEFAULT_GAME_KEY;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' }, // single origin in prod; permissive for local tooling
    transports: ['websocket', 'polling'],
  });

  // One independent game (own round loop + tuning) per title.
  const instances = {};
  for (const key of Object.keys(games)) {
    instances[key] = new Game(io, configFor(key));
    instances[key].start();
  }

  io.on('connection', (socket) => {
    const q = socket.handshake.query && socket.handshake.query.game;
    const key = (q && instances[q]) ? q : gameKeyForHost(socket.handshake.headers.host);
    const game = instances[key] || instances[DEFAULT_GAME_KEY];
    game.addPlayer(socket);

    socket.on('place_bet', ({ slot, amount } = {}) => game.placeBet(socket, slot, amount));
    socket.on('cancel_bet', ({ slot } = {}) => game.cancelBet(socket, slot));
    socket.on('stash', ({ slot } = {}) => game.stash(socket, slot));
    socket.on('add_credits', ({ amount } = {}) => game.addCredits(socket, amount));
    socket.on('chat', ({ text } = {}) => {
      if (typeof text === 'string' && text.trim()) {
        const clean = text.trim().slice(0, 120);
        io.to(game.key).emit('chat', { id: `u${socket.id.slice(0, 4)}-${Date.now()}`, name: 'You', text: clean, ts: Date.now(), self: true });
      }
    });

    socket.on('disconnect', () => game.removePlayer(socket.id));
  });

  httpServer.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> STASH ready on http://${hostname}:${port}  (${dev ? 'dev' : 'production'})`);
  });
});
