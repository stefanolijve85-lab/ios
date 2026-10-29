'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DEFAULT_STATE, Light, TuyaConfig } from '@/lib/types';
import { detectTuya, KIND_LABEL, TuyaDevice } from '@/lib/tuyaDetect';
import ImportRow, { guessRoom } from './ImportRow';

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
              <ImportRow
                key={dev.id}
                emoji={det.isPlug ? '🔌' : '💡'}
                name={dev.name}
                sub={`${det.label} · ${KIND_LABEL[det.kind]}${dev.online === false ? ' · offline' : ''}`}
                rooms={sortedRooms}
                existingRoom={existing ? existingRoom?.name || null : undefined}
                room={choice[dev.id] || ''}
                onRoom={(roomId) => setChoice((c) => ({ ...c, [dev.id]: roomId }))}
                onAdd={() => add(dev)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
