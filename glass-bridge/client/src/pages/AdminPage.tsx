import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useStore } from '../store/useStore.js';

export default function AdminPage() {
  const { user } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [mults, setMults] = useState('');
  const [houseEdge, setHouseEdge] = useState('0.02');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) return;
    void refresh();
  }, [user]);

  async function refresh() {
    const [s, u, a] = await Promise.all([api.adminStats(), api.adminUsers(), api.adminAudit()]);
    setStats(s.stats);
    setUsers(u.users);
    setAudit(a.audit);
    setMults(s.config.multipliers.join(', '));
    setHouseEdge(String(s.config.houseEdge));
  }

  if (!user) return <Navigate to="/" replace />;
  if (!user.isAdmin) return <div className="p-8 text-center text-white/60">Admins only.</div>;

  async function saveConfig() {
    setMsg('');
    try {
      await api.adminSetConfig({
        multipliers: mults.split(',').map((x) => Number(x.trim())).filter(Boolean),
        houseEdge: Number(houseEdge),
      });
      setMsg('Saved ✓');
      void refresh();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/" className="text-sm text-white/50 hover:text-white">← Back to game</Link>
      <h1 className="mb-4 mt-2 font-display text-3xl font-black neon-text">Admin</h1>

      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Players" value={stats.users} />
          <Stat label="Rounds" value={stats.rounds} />
          <Stat label="Wagered" value={`€${stats.wagered.toFixed(2)}`} />
          <Stat label="Paid out" value={`€${stats.paidOut.toFixed(2)}`} />
        </div>
      )}

      <div className="glass-panel mb-4 p-4">
        <h2 className="mb-2 font-display text-white/80">Game configuration (RTP / multipliers)</h2>
        <label className="text-xs text-white/40">Multiplier ladder (comma separated)</label>
        <textarea value={mults} onChange={(e) => setMults(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-sm outline-none" />
        <div className="mt-2 flex items-center gap-3">
          <label className="text-xs text-white/40">House edge</label>
          <input value={houseEdge} onChange={(e) => setHouseEdge(e.target.value)} className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 outline-none" />
          <button onClick={saveConfig} className="btn bg-neon-purple/50 px-4 py-2 text-white">Save</button>
          <a href="/api/admin/export/rounds.csv" className="btn bg-white/5 px-4 py-2 text-sm">Export rounds CSV</a>
          {msg && <span className="text-sm text-neon-green">{msg}</span>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-4">
          <h2 className="mb-2 font-display text-white/80">Players</h2>
          <div className="scroll-thin max-h-80 space-y-1 overflow-y-auto text-sm">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1.5">
                <span className="font-display">{u.username}{u.isAdmin ? ' ★' : ''}</span>
                <span className="text-neon-green">€{Number(u.balance).toFixed(2)}</span>
                <div className="flex gap-1">
                  <button onClick={() => api.adminAdjustBalance(u.id, 100).then(refresh)} className="rounded bg-white/10 px-2 text-xs">+100</button>
                  <button onClick={() => api.adminMute(u.id, 10).then(refresh)} className="rounded bg-neon-pink/30 px-2 text-xs">mute</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <h2 className="mb-2 font-display text-white/80">Audit log</h2>
          <div className="scroll-thin max-h-80 space-y-1 overflow-y-auto text-xs text-white/60">
            {audit.map((a) => (
              <div key={a.id} className="flex justify-between gap-2 border-b border-white/5 py-1">
                <span className="text-neon-cyan">{a.action}</span>
                <span className="flex-1 truncate px-2">{a.detail}</span>
                <span className="text-white/30">{new Date(a.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass-panel p-3 text-center">
      <div className="text-xs uppercase tracking-widest text-white/40">{label}</div>
      <div className="font-display text-xl text-white">{value}</div>
    </div>
  );
}
