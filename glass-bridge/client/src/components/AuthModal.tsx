import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import { reconnectSocket } from '../lib/socket.js';
import Character from './Character.js';

export default function AuthModal() {
  const { login, register } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password, email);
      reconnectSocket();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-sm p-6"
      >
        <div className="mb-3 flex flex-col items-center">
          <Character mood="happy" size={84} />
          <h1 className="mt-2 font-display text-2xl font-black tracking-widest neon-text">GLASS BRIDGE</h1>
          <p className="text-sm text-white/50">Cross. Choose. Cash out.</p>
        </div>

        <div className="mb-4 flex rounded-lg bg-black/30 p-1 text-sm">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-2 font-display capitalize transition ${mode === m ? 'bg-neon-purple/40 text-white' : 'text-white/50'}`}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none"
          />
          {mode === 'register' && (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none"
            />
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Password"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 outline-none"
          />
        </div>

        {error && <p className="mt-2 text-sm text-neon-pink">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || !username || !password}
          className="btn mt-4 w-full bg-gradient-to-r from-neon-purple to-neon-blue py-3 text-white shadow-neon"
        >
          {busy ? '…' : mode === 'login' ? 'ENTER' : 'CREATE ACCOUNT'}
        </button>
        <p className="mt-3 text-center text-xs text-white/40">
          New accounts start with a demo balance. Play responsibly.
        </p>
      </motion.div>
    </div>
  );
}
