import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../store/useStore.js';
import { sound } from '../lib/sound.js';

export default function TopBar() {
  const { user, soundOn, setSound, logout } = useStore();
  const [vol, setVol] = useState(0.6);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue font-display text-lg shadow-neon">
          ◇
        </span>
        <span className="font-display text-xl font-black tracking-widest neon-text">GLASS BRIDGE</span>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 sm:flex">
            <span className="text-xs text-white/40">BALANCE</span>
            <span className="font-display text-neon-green">€{user.balance.toFixed(2)}</span>
          </div>
        )}
        <Link to="/verify" className="hidden text-sm text-white/60 hover:text-white sm:block">
          Verify
        </Link>
        {user?.isAdmin && (
          <Link to="/admin" className="hidden text-sm text-neon-cyan hover:text-white sm:block">
            Admin
          </Link>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSound(!soundOn)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/40"
            title="Toggle sound"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVol(v);
              sound.setVolume(v);
            }}
            className="hidden w-20 accent-neon-purple sm:block"
          />
        </div>
        {user && (
          <button onClick={logout} className="text-sm text-white/50 hover:text-neon-pink">
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
