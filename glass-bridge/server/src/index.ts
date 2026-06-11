/**
 * Glass Bridge — server entry point.
 * Express REST API + Socket.IO realtime, on a single HTTP server/port. In
 * production it also serves the built client (single-origin), so one web
 * service hosts the whole app.
 */
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { env, isProd } from './lib/env.js';
import { getStore } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { gameRouter } from './routes/game.js';
import { socialRouter } from './routes/social.js';
import { adminRouter } from './routes/admin.js';
import { attachSockets } from './socket/index.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') }));
app.use(express.json({ limit: '64kb' }));

// Global API rate limit (defence in depth; chat has its own limiter).
app.use('/api', rateLimit({ windowMs: 60_000, max: 240, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, db: getStore().usingPostgres ? 'postgres' : 'memory' }));
app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);
app.use('/api', socialRouter);
app.use('/api/admin', adminRouter);

// Serve the built client in production (single-origin deploy).
if (isProd) {
  const here = dirname(fileURLToPath(import.meta.url));
  const clientDir = join(here, env.clientDir);
  app.use(express.static(clientDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(clientDir, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') },
  path: '/socket.io',
});
attachSockets(io);

getStore().ready.then(() => {
  httpServer.listen(env.port, () => {
    console.log(`🌉 Glass Bridge server on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}).catch((err) => {
  console.error('Failed to start (database not reachable):', err.message);
  process.exit(1);
});

export { app, io };
