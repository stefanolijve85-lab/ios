'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DEFAULT_STATE, Light, Room, TuyaConfig } from '@/lib/types';
import { detectTuya, KIND_LABEL, TuyaDevice } from '@/lib/tuyaDetect';

// Raadt een kamer op basis van de apparaatnaam; je kunt hem altijd wijzigen.
const ROOM_HINTS: [RegExp, string][] = [
  [/tuin|buiten|terras|kerst|rookhok|schuur|vijver|veranda|oprit/i, 'tuin'],
  [/bad|douche|nis|toilet|wc/i, 'badkamer'],
  [/keuken|kook|werkblad/i, 'keuken'],
  [/slaap|bed|nacht/i, 'slaapkamer'],
  [/woon|tv|bank|eettafel|lounge/i, 'woonkamer'],
];

function guessRoom(name: string, rooms: Room[]): string {
  for (const [re, id] of ROOM_HINTS) if (re.test(name) && rooms.some((r) => r.id === id)) return id;
  return rooms[0]?.id || '';
}

export default function TuyaImport({ creds, onBeforeFetch }: { creds: TuyaConfig; onBeforeFetch: () => void }) {
  const { rooms, lights, addLight, config } = useStore();
  const [devices, setDevices] = useState<TuyaDevice[] | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sortedRooms = [...rooms].sort((a, b) => a.order - b.order);

  const load = async () => {
    onBeforeFetch();
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/tuya/devices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: creds }),
      }).then((r) => r.json());
      if (!res.success) throw new Error(res.error);
      const list: TuyaDevice[] = res.devices?.devices || res.devices || [];
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setDevices(list);
      setChoice(Object.fromEntries(list.map((d) => [d.id, guessRoom(d.name || '', sortedRooms)])));
    } catch (e: any) {
      setErr(e?.message || 'Ophalen mislukt');
    } finally {
      setBusy(false);
    }
  };

  const add = (dev: TuyaDevice) => {
    const det = detectTuya(dev);
    const roomId = choice[dev.id] || sortedRooms[0]?.id;
    if (!roomId) return;
    const light: Light = {
      id: `tuya-${dev.id}`,
      name: dev.name || 'Tuya-apparaat',
      roomId,
      backend: 'tuya',
      kind: det.kind,
      icon: det.icon,
      ref: { deviceId: dev.id, dp: det.dp },
      state: { ...DEFAULT_STATE, on: det.on ?? false },
    };
    addLight(light);
  };

  const ready = !!(creds.accessId && creds.accessSecret);

  return (
    <>
      <button className="btn secondary" disabled={busy || !ready} onClick={load}>
        {busy ? 'Ophalen…' : devices ? 'Apparatenlijst vernieuwen' : 'Tuya-apparaten importeren'}
      </button>
      {config.demoMode && devices && (
        <p className="hint" style={{ color: '#ff9f0a' }}>Demo-modus staat aan — zet hem uit om de echte apparaten te bedienen.</p>
      )}
      {err && <p className="hint" style={{ color: '#ff453a' }}>❌ {err}</p>}
      {devices && devices.length === 0 && <p className="hint">Geen apparaten gevonden in dit Tuya-project.</p>}
      {devices && devices.length > 0 && (
        <div className="list">
          {devices.map((dev) => {
            const det = detectTuya(dev);
            const existing = lights.find((l) => l.backend === 'tuya' && l.ref.deviceId === dev.id && !l.ref.zone);
            const existingRoom = existing && rooms.find((r) => r.id === existing.roomId);
            return (
              <div className="item" key={dev.id} style={{ gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="k" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {det.isPlug ? '🔌' : '💡'} {dev.name}
                  </div>
                  <div className="v" style={{ fontSize: 13 }}>
                    {det.label} · {KIND_LABEL[det.kind]}{dev.online === false ? ' · offline' : ''}
                  </div>
                </div>
                {existing ? (
                  <span className="v" style={{ fontSize: 13, color: '#30d158', whiteSpace: 'nowrap' }}>✓ {existingRoom?.name || 'Toegevoegd'}</span>
                ) : (
                  <>
                    <select
                      className="v"
                      style={{ background: 'transparent', maxWidth: 120 }}
                      value={choice[dev.id] || ''}
                      onChange={(e) => setChoice((c) => ({ ...c, [dev.id]: e.target.value }))}
                      aria-label={`Kamer voor ${dev.name}`}
                    >
                      {sortedRooms.map((r) => <option key={r.id} value={r.id} style={{ background: '#1c1c1e' }}>{r.name}</option>)}
                    </select>
                    <button
                      onClick={() => add(dev)}
                      aria-label={`${dev.name} toevoegen`}
                      style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent)', color: '#fff', fontSize: 22, lineHeight: '32px', flexShrink: 0 }}
                    >+</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
