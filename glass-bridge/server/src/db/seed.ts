/**
 * Seed script — creates the admin account (from env) and a few demo players,
 * and inserts a handful of recent rounds so the leaderboards are not empty.
 * Safe to run repeatedly: existing usernames are skipped.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getStore } from './index.js';
import { randomSeed } from '../game/provablyFair.js';

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureUser(opts: {
  username: string; password: string; email?: string; balance: number; isAdmin?: boolean;
}) {
  const store = getStore();
  const existing = await store.getUserByUsername(opts.username);
  if (existing) {
    console.log(`• ${opts.username} already exists`);
    return existing;
  }
  const user = await store.createUser({
    id: id('user'),
    username: opts.username,
    email: opts.email ?? null,
    passwordHash: await bcrypt.hash(opts.password, 10),
    balance: opts.balance,
    isAdmin: opts.isAdmin ?? false,
    isMuted: false,
    mutedUntil: null,
    clientSeed: randomSeed(8),
    nonce: 1,
  });
  console.log(`✓ created ${opts.username}${opts.isAdmin ? ' (admin)' : ''}`);
  return user;
}

async function main() {
  const store = getStore();
  await store.ready;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'change-me-now';
  await ensureUser({ username: adminUser, password: adminPass, email: process.env.ADMIN_EMAIL, balance: 100000, isAdmin: true });

  const demos = ['LuckyOne', 'CryptoKing', 'NightOwl', 'AceWin', 'HighRoller'];
  for (const name of demos) {
    const u = await ensureUser({ username: name, password: 'demo1234', balance: 1000 });
    // a couple of sample rounds
    for (let i = 0; i < 2; i++) {
      const win = Math.random() > 0.4;
      const mult = [1.36, 1.95, 2.8, 3.5][Math.floor(Math.random() * 4)];
      const bet = [5, 10, 25][Math.floor(Math.random() * 3)];
      await store.recordRound({
        id: id('round'),
        userId: u.id,
        username: u.username,
        bet,
        multiplier: win ? mult : 0,
        payout: win ? Math.round(bet * mult * 100) / 100 : 0,
        status: win ? 'cashed_out' : 'busted',
        rowsCleared: win ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 4),
        serverSeed: randomSeed(),
        serverSeedHash: randomSeed(),
        clientSeed: u.clientSeed,
        nonce: i + 1,
        createdAt: Date.now() - Math.floor(Math.random() * 3600_000),
      });
    }
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
