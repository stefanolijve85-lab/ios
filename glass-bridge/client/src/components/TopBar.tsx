import { useState } from 'react';
import { useStore } from '../store/useStore.js';
import { Menu, Plus, Chat } from './icons.js';

export default function TopBar() {
  const { user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-30 flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => setMenuOpen((v) => !v)} className="text-white/80" aria-label="Menu">
          <Menu />
        </button>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue text-lg shadow-neon">
          ◇
        </span>
      </div>

      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-white/40">Balance</div>
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold text-white">€{(user?.balance ?? 0).toFixed(2)}</span>
          <span className="grid h-5 w-5 place-items-center rounded-md bg-neon-green/80 text-black">
            <Plus width={13} height={13} />
          </span>
        </div>
      </div>

      <button className="text-white/80" aria-label="Chat">
        <Chat />
      </button>

      {menuOpen && (
        <div className="absolute left-4 top-14 w-44 rounded-xl border border-white/10 bg-black/80 p-2 text-sm backdrop-blur-xl">
          {user && <div className="px-3 py-1.5 text-white/60">@{user.username}</div>}
          <button onClick={logout} className="w-full rounded-lg px-3 py-1.5 text-left text-neon-pink hover:bg-white/10">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
