'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import LightTile from './LightTile';
import LightDetail from './LightDetail';
import Settings from './Settings';
import AddLight from './AddLight';
import { GearIcon, PowerIcon } from './icons';

export default function App() {
  const store = useStore();
  const { rooms, lights, scenes, ready, error, toggleLight, applyScene, config } = store;
  const [filter, setFilter] = useState<string>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [addTo, setAddTo] = useState<string | null>(null);

  const onCount = useMemo(() => lights.filter((l) => l.state.on).length, [lights]);
  const sortedRooms = useMemo(() => [...rooms].sort((a, b) => a.order - b.order), [rooms]);
  const detail = lights.find((l) => l.id === detailId) || null;

  const visibleRooms = filter === 'all' ? sortedRooms : sortedRooms.filter((r) => r.id === filter);

  const allOff = () => rooms.forEach((r) => store.toggleRoom(r.id, false));

  if (!ready) return <div className="app" />;

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Thuis</h1>
          <div className="sub">
            {onCount > 0 ? `${onCount} ${onCount === 1 ? 'lamp' : 'lampen'} aan` : 'Alles uit'}
            {config.demoMode && <span className="badge" style={{ marginLeft: 8 }}>DEMO</span>}
          </div>
        </div>
        <button className="iconbtn" aria-label="Instellingen" onClick={() => setShowSettings(true)}>
          <GearIcon />
        </button>
      </div>

      {/* Scènes */}
      {scenes.length > 0 && (
        <div className="chips">
          {scenes.map((s) => (
            <button key={s.id} className="chip" onClick={() => applyScene(s.id)}>
              <span className="emoji">{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Kamerfilter */}
      <div className="chips">
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Alle</button>
        {sortedRooms.map((r) => (
          <button key={r.id} className={`chip ${filter === r.id ? 'active' : ''}`} onClick={() => setFilter(r.id)}>
            <span className="emoji">{r.icon}</span>
            {r.name}
          </button>
        ))}
      </div>

      {/* Kamers + tegels */}
      {visibleRooms.map((room) => {
        const roomLights = lights.filter((l) => l.roomId === room.id);
        const on = roomLights.filter((l) => l.state.on).length;
        return (
          <section key={room.id}>
            <div className="section-title">
              <span>{room.icon} {room.name}</span>
              <span className="count">
                {on > 0 ? `${on} aan` : 'uit'}
                <button
                  onClick={() => setAddTo(room.id)}
                  aria-label="Lamp toevoegen"
                  style={{ marginLeft: 10, color: 'var(--accent)', fontSize: 22, fontWeight: 400, verticalAlign: 'middle' }}
                >+</button>
              </span>
            </div>
            {roomLights.length === 0 ? (
              <div className="empty">Nog geen lampen. Tik op + om er een toe te voegen.</div>
            ) : (
              <div className="grid">
                {roomLights.map((l) => (
                  <LightTile key={l.id} light={l} onToggle={() => toggleLight(l.id)} onOpen={() => setDetailId(l.id)} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Onderbalk */}
      <div className="tabbar">
        <button className="allbtn" onClick={allOff}>
          <PowerIcon size={18} /> Alles uit
        </button>
      </div>

      {error && <div className="toast">{error}</div>}

      {detail && <LightDetail light={detail} onClose={() => setDetailId(null)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {addTo && <AddLight roomId={addTo} onClose={() => setAddTo(null)} />}
    </div>
  );
}
