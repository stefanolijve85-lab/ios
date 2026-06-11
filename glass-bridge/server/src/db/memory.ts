/** In-memory store — the zero-config fallback so the game runs without a DB. */
import type { AuditEntry, ChatMessage, RoundRecord, Store, User } from './types.js';

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export class MemoryStore implements Store {
  ready = Promise.resolve();
  usingPostgres = false;

  private users = new Map<string, User>();
  private usersByName = new Map<string, string>();
  private rounds: RoundRecord[] = [];
  private chat: ChatMessage[] = [];
  private auditLog: AuditEntry[] = [];

  async createUser(u: Omit<User, 'createdAt'>): Promise<User> {
    const user: User = { ...u, createdAt: Date.now() };
    this.users.set(user.id, user);
    this.usersByName.set(user.username.toLowerCase(), user.id);
    return user;
  }
  async getUserById(id: string) {
    return this.users.get(id) ?? null;
  }
  async getUserByUsername(username: string) {
    const id = this.usersByName.get(username.toLowerCase());
    return id ? this.users.get(id) ?? null : null;
  }
  async updateUser(id: string, patch: Partial<User>) {
    const u = this.users.get(id);
    if (!u) return null;
    const next = { ...u, ...patch };
    this.users.set(id, next);
    return next;
  }

  async recordRound(r: RoundRecord) {
    this.rounds.unshift(r);
    if (this.rounds.length > 5000) this.rounds.length = 5000;
  }
  async recentRounds(limit: number) {
    return this.rounds.slice(0, limit);
  }
  async topWinsToday(limit: number) {
    const since = startOfTodayMs();
    return this.rounds
      .filter((r) => r.createdAt >= since && r.status === 'cashed_out')
      .sort((a, b) => b.payout - a.payout)
      .slice(0, limit);
  }
  async topMultipliersToday(limit: number) {
    const since = startOfTodayMs();
    return this.rounds
      .filter((r) => r.createdAt >= since && r.status === 'cashed_out')
      .sort((a, b) => b.multiplier - a.multiplier)
      .slice(0, limit);
  }
  async userHistory(userId: string, limit: number) {
    return this.rounds.filter((r) => r.userId === userId).slice(0, limit);
  }
  async getRound(id: string) {
    return this.rounds.find((r) => r.id === id) ?? null;
  }

  async addChatMessage(m: ChatMessage) {
    this.chat.push(m);
    if (this.chat.length > 500) this.chat.shift();
  }
  async recentChat(limit: number) {
    return this.chat.slice(-limit);
  }

  async audit(e: AuditEntry) {
    this.auditLog.unshift(e);
    if (this.auditLog.length > 2000) this.auditLog.length = 2000;
  }
  async recentAudit(limit: number) {
    return this.auditLog.slice(0, limit);
  }

  async listUsers(limit: number) {
    return [...this.users.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
  async stats() {
    return {
      users: this.users.size,
      rounds: this.rounds.length,
      wagered: this.rounds.reduce((s, r) => s + r.bet, 0),
      paidOut: this.rounds.reduce((s, r) => s + r.payout, 0),
    };
  }
}
