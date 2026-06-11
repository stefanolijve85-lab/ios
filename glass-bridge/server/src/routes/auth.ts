import { Router } from 'express';
import { getStore } from '../db/index.js';
import { checkPassword, hashPassword, publicUser, signToken } from '../lib/auth.js';
import { env } from '../lib/env.js';
import { randomSeed } from '../game/provablyFair.js';
import { loginSchema, registerSchema } from '../lib/validation.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

function uid() {
  return `user_${randomSeed(8)}`;
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const store = getStore();
  const { username, password, email } = parsed.data;
  if (await store.getUserByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const user = await store.createUser({
    id: uid(),
    username,
    email: email || null,
    passwordHash: await hashPassword(password),
    balance: env.startingBalance,
    isAdmin: false,
    isMuted: false,
    mutedUntil: null,
    clientSeed: randomSeed(8),
    nonce: 1,
  });
  await store.audit({ id: randomSeed(6), actorId: user.id, action: 'register', detail: username, createdAt: Date.now() });
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' });
  const store = getStore();
  const user = await store.getUserByUsername(parsed.data.username);
  if (!user || !(await checkPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const store = getStore();
  const user = await store.getUserById(req.auth!.sub);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user: publicUser(user) });
});
