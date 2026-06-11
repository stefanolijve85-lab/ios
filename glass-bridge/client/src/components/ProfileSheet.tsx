import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useStore } from '../store/useStore.js';

/** Profile / provably-fair bottom sheet: balance, client seed, recent history. */
export default function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refreshUser, logout } = useStore();
  const [history, setHistory] = useState<any[]>([]);
  const [seed, setSeed] = useState('');

  useEffect(() => {
    if (!open) return;
    api.history().then((d) => setHistory(d.rounds)).catch(() => {});
    setSeed(user?.clientSeed ?? '');
  }, [open, user]);

  async function saveSeed() {
    const { user: u } = await api.setClientSeed(seed.trim() || Math.random().toString(36).slice(2));
    refreshUser(u);
  }
  async function rotate() {
    const { user: u } = await api.rotateSeed();
    refreshUser(u);
    setSeed(u.clientSeed);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80vh] max-w-[460px] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#120a2b] p-5 pb-24"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-display text-lg text-white">@{user?.username}</div>
                <div className="text-sm text-neon-green">€{(user?.balance ?? 0).toFixed(2)}</div>
              </div>
              {user?.isAdmin && <Link to="/admin" className="text-sm text-neon-cyan" onClick={onClose}>Admin →</Link>}
            </div>

            <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="mb-1 text-xs uppercase tracking-widest text-white/40">Client seed · next nonce {user?.nonce}</div>
              <div className="flex gap-2">
                <input value={seed} onChange={(e) => setSeed(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 font-mono text-xs outline-none" />
                <button onClick={saveSeed} className="btn bg-neon-purple/50 px-3 text-sm text-white">Save</button>
                <button onClick={rotate} className="btn bg-white/10 px-3 text-sm">↻</button>
              </div>
            </div>

            <h3 className="mb-2 font-display text-sm text-white/70">Recent rounds</h3>
            <div className="space-y-1 text-xs">
              {history.map((r) => (
                <Link
                  key={r.id}
                  to={`/verify?serverSeed=${r.serverSeed}&clientSeed=${r.clientSeed}&nonce=${r.nonce}`}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5"
                >
                  <span className="text-white/40">€{r.bet.toFixed(2)}</span>
                  <span className={r.status === 'cashed_out' ? 'text-neon-cyan' : 'text-neon-pink'}>{r.status === 'cashed_out' ? `${r.multiplier.toFixed(2)}×` : 'bust'}</span>
                  <span className={r.status === 'cashed_out' ? 'text-neon-green' : 'text-white/25'}>€{r.payout.toFixed(2)}</span>
                  <span className="text-neon-cyan/60">verify →</span>
                </Link>
              ))}
              {!history.length && <p className="py-4 text-center text-white/40">No rounds yet.</p>}
            </div>

            <button onClick={() => { logout(); onClose(); }} className="btn mt-4 w-full rounded-2xl bg-white/5 py-2.5 text-neon-pink">Logout</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
