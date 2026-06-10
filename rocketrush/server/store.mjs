/**
 * Liftoff X data store — the wallet/stats/bets/transactions backend.
 *
 * Two interchangeable implementations behind one interface:
 *  - JsonStore     : a local JSON file. Used for guests (and when Supabase isn't
 *                    configured) so the game runs with zero setup.
 *  - SupabaseStore : Supabase Postgres. Used for authenticated accounts so a
 *                    user's progress follows them across devices.
 *
 * The game server does all the bookkeeping (balance math, stats, win/loss) and
 * calls these methods only to PERSIST. init() returns a working record the
 * server mutates; saveBalance/saveBet/saveTx persist the latest change.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

export const START_BALANCE = 1000;
export const defStats = () => ({ played: 0, wins: 0, wagered: 0, returned: 0, best: 0, bestWin: 0, streak: 0, bestStreak: 0 });
const newRecord = () => ({
  balance: START_BALANCE,
  stats: defStats(),
  bets: [],
  tx: [{ type: 'signup_bonus', amount: START_BALANCE, balanceAfter: START_BALANCE, ts: Date.now() }],
});

/* ------------------------------- JSON (guests) ------------------------------- */
class JsonStore {
  constructor() {
    this.dir = path.join(process.cwd(), 'server', '.data');
    this.file = path.join(this.dir, 'store.json');
    this.map = new Map();
    this.timer = null;
    try { if (existsSync(this.file)) for (const [k, v] of Object.entries(JSON.parse(readFileSync(this.file, 'utf8')))) this.map.set(k, v); } catch { /* fresh */ }
  }
  _save() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      try { mkdirSync(this.dir, { recursive: true }); writeFileSync(this.file, JSON.stringify(Object.fromEntries(this.map))); } catch { /* ignore */ }
    }, 400);
  }
  _rec(key) {
    if (!this.map.has(key)) { this.map.set(key, newRecord()); this._save(); }
    return this.map.get(key);
  }
  async init(key) { return this._rec(key); }            // returns the live object (server mutates it)
  async saveBalance(key, rec) { this.map.set(key, rec); this._save(); }
  async saveBet(key, rec) { this.map.set(key, rec); this._save(); }
  async saveTx(key, rec) { this.map.set(key, rec); this._save(); }
}

/* ----------------------------- Supabase (accounts) ----------------------------- */
const mapStats = s => ({ played: s.played, wins: s.wins, wagered: Number(s.wagered), returned: Number(s.returned), best: Number(s.best), bestWin: Number(s.best_win), streak: s.streak, bestStreak: s.best_streak });
const statsCols = s => ({ played: s.played, wins: s.wins, wagered: s.wagered, returned: s.returned, best: s.best, best_win: s.bestWin, streak: s.streak, best_streak: s.bestStreak });
const mapBet = b => ({ nonce: b.nonce, amount: Number(b.amount), won: b.won, mult: b.mult == null ? undefined : Number(b.mult), payout: Number(b.payout), profit: Number(b.profit), ts: new Date(b.created_at).getTime() });
const mapTx = t => ({ type: t.type, amount: Number(t.amount), balanceAfter: Number(t.balance_after), ts: new Date(t.created_at).getTime() });

class SupabaseStore {
  constructor(client) { this.sb = client; }
  async init(uid) {
    try {
      let { data: w } = await this.sb.from('wallets').select('balance').eq('user_id', uid).maybeSingle();
      if (!w) {
        await this.sb.from('wallets').insert({ user_id: uid, balance: START_BALANCE });
        await this.sb.from('stats').insert({ user_id: uid });
        await this.sb.from('transactions').insert({ user_id: uid, type: 'signup_bonus', amount: START_BALANCE, balance_after: START_BALANCE });
        w = { balance: START_BALANCE };
      }
      const { data: s } = await this.sb.from('stats').select('*').eq('user_id', uid).maybeSingle();
      const { data: bets } = await this.sb.from('bets').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
      const { data: tx } = await this.sb.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
      return { balance: Number(w.balance), stats: s ? mapStats(s) : defStats(), bets: (bets || []).map(mapBet), tx: (tx || []).map(mapTx) };
    } catch (e) { console.log('[store] init failed, using empty record:', e.message); return newRecord(); }
  }
  async saveBalance(uid, rec) {
    try { await this.sb.from('wallets').upsert({ user_id: uid, balance: rec.balance, updated_at: new Date().toISOString() }); } catch (e) { console.log('[store] saveBalance:', e.message); }
  }
  async saveBet(uid, rec) {
    try {
      const b = rec.bets[0];
      if (b) await this.sb.from('bets').insert({ user_id: uid, nonce: b.nonce, amount: b.amount, won: b.won, mult: b.mult ?? null, payout: b.payout ?? 0, profit: b.profit });
      await this.sb.from('stats').upsert({ user_id: uid, ...statsCols(rec.stats), updated_at: new Date().toISOString() });
    } catch (e) { console.log('[store] saveBet:', e.message); }
  }
  async saveTx(uid, rec) {
    try { const t = rec.tx[0]; if (t) await this.sb.from('transactions').insert({ user_id: uid, type: t.type, amount: t.amount, balance_after: t.balanceAfter }); } catch (e) { console.log('[store] saveTx:', e.message); }
  }
}

/* --------------------------------- factory --------------------------------- */
export async function makeStores() {
  const url = process.env.SUPABASE_URL, srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const guest = new JsonStore();
  if (url && srk) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(url, srk, { auth: { persistSession: false, autoRefreshToken: false } });
      console.log('🗄  Supabase store enabled (accounts sync across devices)');
      return { supabase: sb, account: new SupabaseStore(sb), guest };
    } catch (e) { console.log('Supabase unavailable, accounts disabled:', e.message); }
  } else {
    console.log('ℹ️  Supabase not configured — running in guest mode (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to enable accounts)');
  }
  return { supabase: null, account: null, guest };
}
