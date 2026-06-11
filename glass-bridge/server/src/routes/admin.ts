import { Router } from 'express';
import { getStore } from '../db/index.js';
import { getConfig, setConfig } from '../game/config.js';
import { configSchema } from '../lib/validation.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';
import { randomSeed } from '../game/provablyFair.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/stats', async (_req, res) => {
  const store = getStore();
  const [stats, recent] = await Promise.all([store.stats(), store.recentRounds(20)]);
  res.json({ stats, recent, config: getConfig() });
});

adminRouter.get('/config', (_req, res) => res.json({ config: getConfig() }));

adminRouter.put('/config', async (req, res) => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const next = setConfig(parsed.data);
  const store = getStore();
  await store.audit({
    id: randomSeed(6), actorId: req.auth!.sub, action: 'config:update',
    detail: JSON.stringify(parsed.data), createdAt: Date.now(),
  });
  res.json({ config: next });
});

adminRouter.get('/users', async (_req, res) => {
  const store = getStore();
  const users = await store.listUsers(100);
  res.json({ users: users.map((u) => ({
    id: u.id, username: u.username, email: u.email, balance: u.balance,
    isAdmin: u.isAdmin, isMuted: u.isMuted, mutedUntil: u.mutedUntil, createdAt: u.createdAt,
  })) });
});

adminRouter.post('/users/:id/balance', async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount)) return res.status(400).json({ error: 'amount must be a number' });
  const store = getStore();
  const user = await store.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = await store.updateUser(user.id, { balance: Math.round((user.balance + amount) * 100) / 100 });
  await store.audit({ id: randomSeed(6), actorId: req.auth!.sub, action: 'balance:adjust', detail: `${user.username} ${amount}`, createdAt: Date.now() });
  res.json({ user: { id: updated!.id, balance: updated!.balance } });
});

adminRouter.post('/users/:id/mute', async (req, res) => {
  const minutes = Number(req.body?.minutes ?? 10);
  const store = getStore();
  const user = await store.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const mutedUntil = minutes > 0 ? Date.now() + minutes * 60_000 : null;
  await store.updateUser(user.id, { isMuted: minutes > 0, mutedUntil });
  await store.audit({ id: randomSeed(6), actorId: req.auth!.sub, action: 'chat:mute', detail: `${user.username} ${minutes}m`, createdAt: Date.now() });
  res.json({ ok: true, mutedUntil });
});

adminRouter.get('/audit', async (_req, res) => {
  const store = getStore();
  res.json({ audit: await store.recentAudit(100) });
});

/** CSV export of recent rounds for accounting/compliance. */
adminRouter.get('/export/rounds.csv', async (_req, res) => {
  const store = getStore();
  const rounds = await store.recentRounds(5000);
  const header = 'id,username,bet,multiplier,payout,status,rows_cleared,nonce,created_at\n';
  const body = rounds
    .map((r) => [r.id, r.username, r.bet, r.multiplier, r.payout, r.status, r.rowsCleared, r.nonce, new Date(r.createdAt).toISOString()].join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rounds.csv"');
  res.send(header + body);
});
