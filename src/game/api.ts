// Thin client for the server-authoritative slot API. Every call returns fully
// resolved, server-decided data — the client never computes outcomes or money.

import type { SessionState, SpinResponse, SpinResult } from './types';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  return res.json();
}

export const slotApi = {
  createSession(opts: { rtp?: string; layout?: string } = {}) {
    return post<{ ok: boolean; state: SessionState }>('/api/slot/session', opts);
  },
  state(sid: string) {
    return get<{ ok: boolean; state: SessionState }>(`/api/slot/state?sid=${sid}`);
  },
  spin(sid: string, lineBet: number, turbo = false) {
    return post<SpinResponse>('/api/slot/spin', { sid, lineBet, turbo });
  },
  buyFeature(sid: string, lineBet: number) {
    return post<{ ok: boolean; cost: number; state: SessionState; error?: string }>(
      '/api/slot/buy-feature',
      { sid, lineBet },
    );
  },
  credit(sid: string, amount = 1000) {
    return post<{ ok: boolean; credited: number; balance: number; state: SessionState }>(
      '/api/slot/credit',
      { sid, amount },
    );
  },
  claimDaily(sid: string) {
    return post<{ ok: boolean; claimed: boolean; amount?: number; reason?: string; balance: number; state: SessionState }>(
      '/api/slot/daily',
      { sid },
    );
  },
  setClientSeed(sid: string, clientSeed: string) {
    return post<{ ok: boolean; clientSeed: string; state: SessionState }>('/api/slot/client-seed', {
      sid,
      clientSeed,
    });
  },
  rotateSeed(sid: string, clientSeed?: string) {
    return post<{
      ok: boolean;
      revealed: { serverSeed: string; serverSeedHash: string; clientSeed: string; spins: number };
      next: { serverSeedHash: string; clientSeed: string; nonce: number };
      state: SessionState;
    }>('/api/slot/rotate-seed', { sid, clientSeed });
  },
  verify(params: {
    sid: string;
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    hash?: string;
    lineBet?: number;
    isFree?: boolean;
  }) {
    const q = new URLSearchParams({
      sid: params.sid,
      serverSeed: params.serverSeed,
      clientSeed: params.clientSeed,
      nonce: String(params.nonce),
      hash: params.hash ?? '',
      lineBet: String(params.lineBet ?? 0.1),
      isFree: params.isFree ? '1' : '0',
    });
    return get<{ ok: boolean; hashOk: boolean; commitment: string; result: SpinResult; hash: string }>(
      `/api/slot/verify?${q.toString()}`,
    );
  },
};
