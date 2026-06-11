/** Thin REST client. The JWT is stored in localStorage and sent as a Bearer token. */
import type { GameConfig, PublicRoundState, StepResult, User } from './types.js';

const TOKEN_KEY = 'gb_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  register: (username: string, password: string, email?: string) =>
    req<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email }) }),
  login: (username: string, password: string) =>
    req<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => req<{ user: User }>('/auth/me'),

  config: () => req<GameConfig>('/game/config'),
  state: () => req<{ round: PublicRoundState | null; user: User | null }>('/game/state'),
  start: (bet: number, clientSeed?: string) =>
    req<{ round: PublicRoundState; user: User }>('/game/start', { method: 'POST', body: JSON.stringify({ bet, clientSeed }) }),
  step: (pick: 'LEFT' | 'RIGHT') =>
    req<{ result: StepResult; round: PublicRoundState | null; user: User }>('/game/step', { method: 'POST', body: JSON.stringify({ pick }) }),
  cashout: () =>
    req<{ result: StepResult; round: null; user: User }>('/game/cashout', { method: 'POST' }),
  setClientSeed: (clientSeed: string) =>
    req<{ user: User }>('/game/client-seed', { method: 'POST', body: JSON.stringify({ clientSeed }) }),
  rotateSeed: () => req<{ user: User }>('/game/rotate-seed', { method: 'POST' }),
  history: () => req<{ rounds: any[] }>('/game/history'),

  leaderboards: () => req<{ topWins: any[]; topMultipliers: any[]; recent: any[] }>('/leaderboards'),
  verifyRound: (id: string) => req<any>(`/verify/${id}`),
  verifyRaw: (body: any) => req<any>('/verify', { method: 'POST', body: JSON.stringify(body) }),

  adminStats: () => req<any>('/admin/stats'),
  adminConfig: () => req<any>('/admin/config'),
  adminSetConfig: (patch: any) => req<any>('/admin/config', { method: 'PUT', body: JSON.stringify(patch) }),
  adminUsers: () => req<any>('/admin/users'),
  adminAdjustBalance: (id: string, amount: number) =>
    req<any>(`/admin/users/${id}/balance`, { method: 'POST', body: JSON.stringify({ amount }) }),
  adminMute: (id: string, minutes: number) =>
    req<any>(`/admin/users/${id}/mute`, { method: 'POST', body: JSON.stringify({ minutes }) }),
  adminAudit: () => req<any>('/admin/audit'),
};
