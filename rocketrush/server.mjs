/**
 * Liftoff X — single-origin server.
 *
 * Serves the Next.js app AND the Socket.io game on ONE HTTP server / port, so
 * the browser connects same-origin (no separate :3001). Works identically on
 * localhost, your LAN (iPhone), and a public HTTPS host (Render/Railway).
 *
 *   npm run dev     → development (Next dev, on-the-fly compile)
 *   npm run build   → production build (.next)
 *   npm start       → production (serves the built app)  [node server.mjs --prod]
 *
 * PORT is taken from the environment (Render/Railway set it); defaults to 3000.
 */
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import nextImport from 'next';
import { attachGame } from './server/game-server.mjs';

const nextFactory = typeof nextImport === 'function' ? nextImport : nextImport.default;
const prod = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const dev = !prod;
const port = Number(process.env.PORT) || 3000;
const hostname = '0.0.0.0';

const app = nextFactory({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => handle(req, res));

// Socket.io shares the same HTTP server; it intercepts only /socket.io/* and
// passes every other request (and Next's HMR upgrade) through to Next.
const io = new Server(httpServer, { cors: { origin: true }, path: '/socket.io' });
await attachGame(io);

httpServer.listen(port, hostname, () => {
  console.log(`🚀 Liftoff X on http://${hostname}:${port}  (${dev ? 'development' : 'production'}, single-origin)`);
});
