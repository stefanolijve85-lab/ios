/** Thin REST client. The JWT is stored in localStorage and sent as a Bearer token. */
import type { GameConfig, PublicRoundState, StepResult, User } from './types.js';
import { OFFLINE, offline } from './offline.js';

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
    OFFLINE ? offline.me() : req<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email }) }),
  login: (username: string, password: string) =>
    OFFLINE ? offline.me() : req<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => (OFFLINE ? offline.authMe() : req<{ user: User }>('/auth/me')),

  config: () => (OFFLINE ? Promise.resolve(offline.config()) : req<GameConfig>('/game/config')),
  state: () => (OFFLINE ? Promise.resolve(offline.state()) : req<{ round: PublicRoundState | null; user: User | null }>('/game/state')),
  start: (bet: number, clientSeed?: string) =>
    OFFLINE ? offline.start(bet, clientSeed) : req<{ round: PublicRoundState; user: User }>('/game/start', { method: 'POST', body: JSON.stringify({ bet, clientSeed }) }),
  step: (pick: 'LEFT' | 'RIGHT') =>
    OFFLINE ? Promise.resolve(offline.step(pick)) : req<{ result: StepResult; round: PublicRoundState | null; user: User }>('/game/step', { method: 'POST', body: JSON.stringify({ pick }) }),
  cashout: () =>
    OFFLINE ? Promise.resolve(offline.cashout()) : req<{ result: StepResult; round: null; user: User }>('/game/cashout', { method: 'POST' }),
  setClientSeed: (clientSeed: string) =>
    OFFLINE ? Promise.resolve(offline.setClientSeed(clientSeed)) : req<{ user: User }>('/game/client-seed', { method: 'POST', body: JSON.stringify({ clientSeed }) }),
  rotateSeed: () => (OFFLINE ? Promise.resolve(offline.rotateSeed()) : req<{ user: User }>('/game/rotate-seed', { method: 'POST' })),
  history: () => (OFFLINE ? Promise.resolve(offline.history()) : req<{ rounds: any[] }>('/game/history')),

  leaderboards: () => (OFFLINE ? Promise.resolve(offline.leaderboards()) : req<{ topWins: any[]; topMultipliers: any[]; recent: any[] }>('/leaderboards')),
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
