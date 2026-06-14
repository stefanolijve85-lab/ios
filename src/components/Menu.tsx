'use client';
import { useEffect, useState } from 'react';
import { getAudio } from '@/lib/audio';
import { useGame } from '@/hooks/useGame';

const NAV = [
  { icon: '💰', label: 'STASH' },
  { icon: '🕘', label: 'HISTORY' },
  { icon: '🏦', label: 'SAFE' },
  { icon: '🏆', label: 'LEADERBOARD' },
  { icon: '💬', label: 'CHAT' },
];

export default function Menu() {
  const { addCredits } = useGame();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('STASH');
  const [levels, setLevels] = useState({ music: 0.5, sfx: 0.9, voice: 1.0 });

  useEffect(() => {
    setLevels(getAudio().getLevels());
  }, []);

  const setLevel = (k: 'music' | 'sfx' | 'voice', v: number) => {
    setLevels((p) => ({ ...p, [k]: v }));
    const a = getAudio();
    if (k === 'music') a.setMusic(v);
    if (k === 'sfx') a.setSfx(v);
    if (k === 'voice') a.setVoice(v);
  };

  return (
    <>
      <button className="icon-btn" aria-label="Menu" onClick={() => setOpen(true)}>☰</button>

      {open && <div className="drawer-scrim" onClick={() => setOpen(false)} />}

      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="logo">STASH</span>
          <button className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <nav className="drawer-nav">
          {NAV.map((n) => (
            <button
              key={n.label}
              className={`drawer-item${active === n.label ? ' active' : ''}`}
              onClick={() => { setActive(n.label); setOpen(false); }}
            >
              <span className="ic">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <button className="drawer-test" onClick={() => addCredits(1_000_000)}>
          🧪 TEST: +€1,000,000 CREDITS
        </button>

        <div className="drawer-audio">
          <div className="drawer-title">AUDIO</div>
          {([
            ['voice', 'Voice'],
            ['sfx', 'Sound effects'],
            ['music', 'Music'],
          ] as const).map(([k, label]) => (
            <label key={k} className="slider-row">
              <span>{label}</span>
              <input
                type="range" min={0} max={1} step={0.01}
                value={levels[k]}
                onChange={(e) => setLevel(k, parseFloat(e.target.value))}
              />
              <span className="slider-val">{Math.round(levels[k] * 100)}</span>
            </label>
          ))}
        </div>
      </aside>
    </>
  );
}
