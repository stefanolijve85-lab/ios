/** PostgreSQL-backed store (used when DATABASE_URL is configured). */
import pg from 'pg';
import type { AuditEntry, ChatMessage, RoundRecord, Store, User } from './types.js';

const { Pool } = pg;

function rowToUser(r: any): User {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    passwordHash: r.password_hash,
    balance: Number(r.balance),
    isAdmin: r.is_admin,
    isMuted: r.is_muted,
    mutedUntil: r.muted_until ? Number(r.muted_until) : null,
    clientSeed: r.client_seed,
    nonce: Number(r.nonce),
    createdAt: Number(r.created_at),
  };
}

function rowToRound(r: any): RoundRecord {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.username,
    bet: Number(r.bet),
    multiplier: Number(r.multiplier),
    payout: Number(r.payout),
    status: r.status,
    rowsCleared: Number(r.rows_cleared),
    serverSeed: r.server_seed,
    serverSeedHash: r.server_seed_hash,
    clientSeed: r.client_seed,
    nonce: Number(r.nonce),
    createdAt: Number(r.created_at),
  };
}

export class PostgresStore implements Store {
  usingPostgres = true;
  ready: Promise<void>;
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
    this.ready = this.pool.query('SELECT 1').then(() => undefined);
  }

  async createUser(u: Omit<User, 'createdAt'>): Promise<User> {
    const now = Date.now();
    const { rows } = await this.pool.query(
      `INSERT INTO users (id, username, email, password_hash, balance, is_admin, is_muted, muted_until, client_seed, nonce, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [u.id, u.username, u.email, u.passwordHash, u.balance, u.isAdmin, u.isMuted, u.mutedUntil, u.clientSeed, u.nonce, now],
    );
    return rowToUser(rows[0]);
  }
  async getUserById(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? rowToUser(rows[0]) : null;
  }
  async getUserByUsername(username: string) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE lower(username) = lower($1)', [username]);
    return rows[0] ? rowToUser(rows[0]) : null;
  }
  async updateUser(id: string, patch: Partial<User>) {
    const map: Record<string, string> = {
      balance: 'balance', isAdmin: 'is_admin', isMuted: 'is_muted',
      mutedUntil: 'muted_until', clientSeed: 'client_seed', nonce: 'nonce',
      passwordHash: 'password_hash', email: 'email',
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(patch)) {
      if (map[k]) {
        sets.push(`${map[k]} = $${i++}`);
        vals.push(v);
      }
    }
    if (!sets.length) return this.getUserById(id);
    vals.push(id);
    const { rows } = await this.pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    return rows[0] ? rowToUser(rows[0]) : null;
  }

  async recordRound(r: RoundRecord) {
    await this.pool.query(
      `INSERT INTO rounds (id, user_id, username, bet, multiplier, payout, status, rows_cleared, server_seed, server_seed_hash, client_seed, nonce, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [r.id, r.userId, r.username, r.bet, r.multiplier, r.payout, r.status, r.rowsCleared, r.serverSeed, r.serverSeedHash, r.clientSeed, r.nonce, r.createdAt],
    );
  }
  async recentRounds(limit: number) {
    const { rows } = await this.pool.query('SELECT * FROM rounds ORDER BY created_at DESC LIMIT $1', [limit]);
    return rows.map(rowToRound);
  }
  async topWinsToday(limit: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM rounds WHERE status='cashed_out' AND created_at >= $1 ORDER BY payout DESC LIMIT $2`,
      [startOfToday(), limit],
    );
    return rows.map(rowToRound);
  }
  async topMultipliersToday(limit: number) {
    const { rows } = await this.pool.query(
      `SELECT * FROM rounds WHERE status='cashed_out' AND created_at >= $1 ORDER BY multiplier DESC LIMIT $2`,
      [startOfToday(), limit],
    );
    return rows.map(rowToRound);
  }
  async userHistory(userId: string, limit: number) {
    const { rows } = await this.pool.query('SELECT * FROM rounds WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2', [userId, limit]);
    return rows.map(rowToRound);
  }
  async getRound(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM rounds WHERE id=$1', [id]);
    return rows[0] ? rowToRound(rows[0]) : null;
  }

  async addChatMessage(m: ChatMessage) {
    await this.pool.query(
      'INSERT INTO chat_messages (id, user_id, username, body, created_at) VALUES ($1,$2,$3,$4,$5)',
      [m.id, m.userId, m.username, m.body, m.createdAt],
    );
  }
  async recentChat(limit: number) {
    const { rows } = await this.pool.query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT $1', [limit]);
    return rows.reverse().map((r) => ({
      id: r.id, userId: r.user_id, username: r.username, body: r.body, createdAt: Number(r.created_at),
    }));
  }

  async audit(e: AuditEntry) {
    await this.pool.query(
      'INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES ($1,$2,$3,$4,$5)',
      [e.id, e.actorId, e.action, e.detail, e.createdAt],
    );
  }
  async recentAudit(limit: number) {
    const { rows } = await this.pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1', [limit]);
    return rows.map((r) => ({
      id: r.id, actorId: r.actor_id, action: r.action, detail: r.detail, createdAt: Number(r.created_at),
    }));
  }

  async listUsers(limit: number) {
    const { rows } = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
    return rows.map(rowToUser);
  }
  async stats() {
    const { rows } = await this.pool.query(
      `SELECT (SELECT COUNT(*) FROM users) AS users,
              (SELECT COUNT(*) FROM rounds) AS rounds,
              (SELECT COALESCE(SUM(bet),0) FROM rounds) AS wagered,
              (SELECT COALESCE(SUM(payout),0) FROM rounds) AS paid_out`,
    );
    const r = rows[0];
    return { users: Number(r.users), rounds: Number(r.rounds), wagered: Number(r.wagered), paidOut: Number(r.paid_out) };
  }
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
