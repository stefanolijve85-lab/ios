/** Shared persistence types used by both the Postgres and in-memory stores. */
export interface User {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  balance: number;
  isAdmin: boolean;
  isMuted: boolean;
  mutedUntil: number | null;
  clientSeed: string;
  nonce: number;
  createdAt: number;
}

export interface RoundRecord {
  id: string;
  userId: string;
  username: string;
  bet: number;
  multiplier: number;
  payout: number;
  status: 'cashed_out' | 'busted';
  rowsCleared: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  body: string;
  createdAt: number;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  detail: string;
  createdAt: number;
}

export interface Store {
  ready: Promise<void>;
  usingPostgres: boolean;

  createUser(u: Omit<User, 'createdAt'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  updateUser(id: string, patch: Partial<User>): Promise<User | null>;

  recordRound(r: RoundRecord): Promise<void>;
  recentRounds(limit: number): Promise<RoundRecord[]>;
  topWinsToday(limit: number): Promise<RoundRecord[]>;
  topMultipliersToday(limit: number): Promise<RoundRecord[]>;
  userHistory(userId: string, limit: number): Promise<RoundRecord[]>;
  getRound(id: string): Promise<RoundRecord | null>;

  addChatMessage(m: ChatMessage): Promise<void>;
  recentChat(limit: number): Promise<ChatMessage[]>;

  audit(e: AuditEntry): Promise<void>;
  recentAudit(limit: number): Promise<AuditEntry[]>;

  listUsers(limit: number): Promise<User[]>;
  stats(): Promise<{ users: number; rounds: number; wagered: number; paidOut: number }>;
}
