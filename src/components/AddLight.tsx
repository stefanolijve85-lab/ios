'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Backend, DEFAULT_STATE, Light, LightKind } from '@/lib/types';
import Sheet from './Sheet';

export default function AddLight({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const { rooms, addLight, config } = useStore();
  const [name, setName] = useState('');
  const [room, setRoom] = useState(roomId);
  const [backend, setBackend] = useState<Backend>(config.tuya ? 'tuya' : 'demo');
  const [kind, setKind] = useState<LightKind>('rgbcct');
  const [deviceId, setDeviceId] = useState('');
  const [zone, setZone] = useState('');

  const save = () => {
    const light: Light = {
      id: `l-${Date.now()}`,
      name: name.trim() || 'Nieuwe lamp',
      roomId: room,
      backend,
      kind,
      icon: 'lamp',
      ref: backend === 'tuya' ? { deviceId: deviceId.trim(), zone: zone ? Number(zone) : undefined } : {},
      state: { ...DEFAULT_STATE },
    };
    addLight(light);
    onClose();
  };

  return (
    <Sheet title="Lamp toevoegen" onClose={onClose}>
      <input className="field" placeholder="Naam (bijv. Bank links)" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="segmented">
        <button className={backend === 'tuya' ? 'active' : ''} onClick={() => setBackend('tuya')}>MiBoxer</button>
        <button className={backend === 'hue' ? 'active' : ''} onClick={() => setBackend('hue')}>Hue</button>
        <button className={backend === 'demo' ? 'active' : ''} onClick={() => setBackend('demo')}>Demo</button>
      </div>

      <div className="list">
        <div className="item">
          <div className="k">Kamer</div>
          <select className="v" style={{ background: 'transparent' }} value={room} onChange={(e) => setRoom(e.target.value)}>
            {rooms.map((r) => <option key={r.id} value={r.id} style={{ background: '#1c1c1e' }}>{r.name}</option>)}
          </select>
        </div>
        <div className="item">
          <div className="k">Type</div>
          <select className="v" style={{ background: 'transparent' }} value={kind} onChange={(e) => setKind(e.target.value as LightKind)}>
            <option value="rgbcct" style={{ background: '#1c1c1e' }}>Kleur + wit (RGB+CCT)</option>
            <option value="cct" style={{ background: '#1c1c1e' }}>Warm/koud wit</option>
            <option value="dimmable" style={{ background: '#1c1c1e' }}>Dimbaar</option>
            <option value="onoff" style={{ background: '#1c1c1e' }}>Aan/uit</option>
          </select>
        </div>
      </div>

      {backend === 'tuya' && (
        <>
          <p className="hint">Vul het Tuya device-id in (uit Instellingen → verbinding testen). Voor een MiBoxer-gateway kun je een zone 1–8 opgeven.</p>
          <input className="field" placeholder="Tuya device-id" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} autoCapitalize="none" autoCorrect="off" />
          <input className="field" placeholder="Zone (1–8, optioneel)" value={zone} onChange={(e) => setZone(e.target.value)} inputMode="numeric" />
        </>
      )}
      {backend === 'hue' && <p className="hint">Tip: importeer Hue-lampen automatisch via Instellingen → Hue-lampen importeren.</p>}

      <button className="btn" onClick={save}>Toevoegen</button>
    </Sheet>
  );
}
