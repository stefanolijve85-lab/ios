/**
 * RocketRush — social layer: global leaderboard, public player profiles and the
 * live activity feed. Global (not per-user), so it lives in one small JSON file
 * (server/.data/social.json) regardless of whether accounts use Supabase.
 * In production these become DB aggregates / a materialized view.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const dayNum = () => Math.floor(Date.now() / 86400000);
const r2 = n => Math.round(n * 100) / 100;
const DIR = path.join(process.cwd(), 'server', '.data');
const FILE = path.join(DIR, 'social.json');

const state = {
  profiles: {},  // pid -> { pid, name, color, joinDate, played, wins, best, bestPayout }
  lb: { day: dayNum(), winToday: [], multToday: [], winAll: [], multAll: [] },
};
const activity = [];   // in-memory ring of recent events (not persisted)

try { if (existsSync(FILE)) Object.assign(state, JSON.parse(readFileSync(FILE, 'utf8'))); } catch { /* fresh */ }

let timer = null;
function save() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; try { mkdirSync(DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(state)); } catch { /* ignore */ } }, 500);
}

function ensureDay() {
  const d = dayNum();
  if (state.lb.day !== d) { state.lb.day = d; state.lb.winToday = []; state.lb.multToday = []; }
}
function lbInsert(list, entry) { list.push(entry); list.sort((a, b) => b.value - a.value); if (list.length > 10) list.length = 10; }

export function upsertProfile(pid, { name, color, joinDate }) {
  const p = state.profiles[pid] || (state.profiles[pid] = { pid, name, color, joinDate: joinDate || Date.now(), played: 0, wins: 0, best: 0, bestPayout: 0 });
  if (name) p.name = name;
  if (color) p.color = color;
  if (joinDate && !p.joinDate) p.joinDate = joinDate;
  return p;
}

export function recordPlay(pid, won, mult, payout) {
  ensureDay();
  const p = state.profiles[pid]; if (!p) return;
  p.played++;
  if (won) {
    p.wins++; p.best = Math.max(p.best, mult); p.bestPayout = Math.max(p.bestPayout, payout);
    const w = { pid, name: p.name, color: p.color, value: r2(payout), mult, ts: Date.now() };
    lbInsert(state.lb.winToday, w); lbInsert(state.lb.winAll, { ...w });
    const m = { pid, name: p.name, color: p.color, value: mult, payout: r2(payout), ts: Date.now() };
    lbInsert(state.lb.multToday, m); lbInsert(state.lb.multAll, { ...m });
  }
  save();
}

export function getProfile(pid) {
  const p = state.profiles[pid]; if (!p) return null;
  return { pid: p.pid, name: p.name, color: p.color, joinDate: p.joinDate, played: p.played, wins: p.wins, losses: Math.max(0, p.played - p.wins), best: p.best, bestPayout: p.bestPayout, winRate: p.played ? Math.round((p.wins / p.played) * 100) : 0 };
}

export function leaderboard() { ensureDay(); const slim = e => ({ pid: e.pid, name: e.name, color: e.color, value: e.value, mult: e.mult, payout: e.payout, ts: e.ts }); return { winToday: state.lb.winToday.map(slim), multToday: state.lb.multToday.map(slim), winAll: state.lb.winAll.map(slim), multAll: state.lb.multAll.map(slim) }; }

export function pushActivity(ev) { ev.ts = ev.ts || Date.now(); activity.unshift(ev); if (activity.length > 40) activity.pop(); }
export function recentActivity() { return activity.slice(0, 30); }

/** Seed believable bot profiles + an initial leaderboard so it never feels empty. */
export function seedBots(names, colors) {
  let seeded = 0;
  names.forEach((name, i) => {
    const pid = 'b:' + name;
    if (!state.profiles[pid]) {
      const played = 50 + Math.floor(Math.random() * 4000);
      const wins = Math.floor(played * (0.42 + Math.random() * 0.12));
      const best = r2(1.5 + Math.random() * 40);
      const bestPayout = r2(100 + Math.random() * 9000);
      state.profiles[pid] = { pid, name, color: colors[i % colors.length], joinDate: Date.now() - Math.floor(Math.random() * 300) * 86400000, played, wins, best, bestPayout };
      seeded++;
    }
  });
  if (!state.lb.winAll.length) {
    names.slice(0, 12).forEach((name, i) => {
      const p = state.profiles['b:' + name];
      const payout = p.bestPayout, mult = p.best;
      lbInsert(state.lb.winAll, { pid: p.pid, name, color: p.color, value: payout, mult, ts: Date.now() });
      lbInsert(state.lb.multAll, { pid: p.pid, name, color: p.color, value: mult, payout, ts: Date.now() });
      if (i < 6) { lbInsert(state.lb.winToday, { pid: p.pid, name, color: p.color, value: r2(payout * 0.6), mult: r2(mult * 0.7), ts: Date.now() }); lbInsert(state.lb.multToday, { pid: p.pid, name, color: p.color, value: r2(mult * 0.7), payout: r2(payout * 0.6), ts: Date.now() }); }
    });
  }
  if (seeded) save();
}
