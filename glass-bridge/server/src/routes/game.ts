import { Router } from 'express';
import { getStore } from '../db/index.js';
import { publicUser } from '../lib/auth.js';
import { getConfig } from '../game/config.js';
import { cashOut, GameError, getActiveRound, startRound, takeStep } from '../game/service.js';
import { clientSeedSchema, sideSchema, startRoundSchema } from '../lib/validation.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { randomSeed } from '../game/provablyFair.js';

export const gameRouter = Router();
gameRouter.use(requireAuth);

function handle(res: any, fn: () => Promise<any>) {
  return fn().catch((err: any) => {
    if (err instanceof GameError) return res.status(400).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  });
}

/** Public game config (multiplier ladder, limits) so the client can render the bridge. */
gameRouter.get('/config', (_req, res) => {
  const c = getConfig();
  res.json({ rows: c.rows, multipliers: c.multipliers, minBet: c.minBet, maxBet: c.maxBet, maxPayout: c.maxPayout });
});

gameRouter.get('/state', async (req, res) =>
  handle(res, async () => {
    const store = getStore();
    const user = await store.getUserById(req.auth!.sub);
    res.json({ round: getActiveRound(req.auth!.sub), user: user ? publicUser(user) : null });
  }),
);

gameRouter.post('/start', async (req, res) =>
  handle(res, async () => {
    const parsed = startRoundSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const round = await startRound(req.auth!.sub, parsed.data.bet, parsed.data.clientSeed);
    const user = await getStore().getUserById(req.auth!.sub);
    res.json({ round, user: user ? publicUser(user) : null });
  }),
);

gameRouter.post('/step', async (req, res) =>
  handle(res, async () => {
    const parsed = sideSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid pick' });
    const result = await takeStep(req.auth!.sub, parsed.data.pick);
    const user = await getStore().getUserById(req.auth!.sub);
    res.json({ result, round: getActiveRound(req.auth!.sub), user: user ? publicUser(user) : null });
  }),
);

gameRouter.post('/cashout', async (req, res) =>
  handle(res, async () => {
    const result = await cashOut(req.auth!.sub);
    const user = await getStore().getUserById(req.auth!.sub);
    res.json({ result, round: null, user: user ? publicUser(user) : null });
  }),
);

/** Update the player's client seed (used for the next round). */
gameRouter.post('/client-seed', async (req, res) =>
  handle(res, async () => {
    const parsed = clientSeedSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid seed' });
    const store = getStore();
    const user = await store.updateUser(req.auth!.sub, { clientSeed: parsed.data.clientSeed });
    res.json({ user: user ? publicUser(user) : null });
  }),
);

/** Rotate to a fresh random client seed. */
gameRouter.post('/rotate-seed', async (req, res) =>
  handle(res, async () => {
    const store = getStore();
    const user = await store.updateUser(req.auth!.sub, { clientSeed: randomSeed(8) });
    res.json({ user: user ? publicUser(user) : null });
  }),
);

gameRouter.get('/history', async (req, res) =>
  handle(res, async () => {
    const rounds = await getStore().userHistory(req.auth!.sub, 50);
    res.json({ rounds });
  }),
);
