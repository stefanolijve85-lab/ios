'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DEFAULT_STATE, Light } from '@/lib/types';
import Sheet from './Sheet';

const TUYA_ENDPOINTS = [
  { label: 'Europa', value: 'https://openapi.tuyaeu.com' },
  { label: 'VS (West)', value: 'https://openapi.tuyaus.com' },
  { label: 'China', value: 'https://openapi.tuyacn.com' },
  { label: 'India', value: 'https://openapi.tuyain.com' },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 51, height: 31, borderRadius: 16, background: on ? '#34c759' : '#39393d',
        position: 'relative', transition: 'background 0.2s',
      }}
      aria-label="schakelaar"
    >
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 14, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

export default function Settings({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const { config, setConfig, addRoom, addLight, resetAll, rooms } = store;
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [tEndpoint, setTEndpoint] = useState(config.tuya?.endpoint || TUYA_ENDPOINTS[0].value);
  const [tId, setTId] = useState(config.tuya?.accessId || '');
  const [tSecret, setTSecret] = useState(config.tuya?.accessSecret || '');

  const [hueIp, setHueIp] = useState(config.hue?.bridgeIp || '');
  const [newRoom, setNewRoom] = useState('');

  const saveTuya = () => setConfig({ tuya: { endpoint: tEndpoint, accessId: tId.trim(), accessSecret: tSecret.trim() } });

  const testTuya = async () => {
    saveTuya();
    setBusy('tuya'); setMsg(null);
    try {
      const res = await fetch('/api/tuya/devices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { endpoint: tEndpoint, accessId: tId.trim(), accessSecret: tSecret.trim() } }),
      }).then((r) => r.json());
      if (!res.success) throw new Error(res.error);
      const list = res.devices?.devices || res.devices || [];
      setMsg(`✅ Verbonden — ${list.length} apparaat/apparaten gevonden: ${list.map((d: any) => d.name).slice(0, 6).join(', ')}`);
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Mislukt'));
    } finally {
      setBusy(null);
    }
  };

  const discoverHue = async () => {
    setBusy('hue-d'); setMsg(null);
    try {
      const res = await fetch('/api/hue/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'discover' }) }).then((r) => r.json());
      if (!res.success) throw new Error(res.error);
      const ip = res.bridges?.[0]?.internalipaddress;
      if (ip) { setHueIp(ip); setMsg(`✅ Bridge gevonden op ${ip}`); }
      else setMsg('Geen Bridge gevonden — vul het IP handmatig in.');
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Mislukt'));
    } finally {
      setBusy(null);
    }
  };

  const pairHue = async () => {
    setBusy('hue-p'); setMsg(null);
    try {
      const res = await fetch('/api/hue/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pair', bridgeIp: hueIp.trim() }) }).then((r) => r.json());
      if (!res.success) throw new Error(res.error);
      setConfig({ hue: { bridgeIp: hueIp.trim(), appKey: res.appKey } });
      setMsg('✅ Gekoppeld! Importeer nu je lampen.');
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Mislukt'));
    } finally {
      setBusy(null);
    }
  };

  const importHue = async () => {
    if (!config.hue) { setMsg('Koppel eerst de Bridge.'); return; }
    setBusy('hue-i'); setMsg(null);
    try {
      const res = await fetch('/api/hue/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lights', config: config.hue }) }).then((r) => r.json());
      if (!res.success) throw new Error(res.error);
      let roomId = rooms.find((r) => r.id === 'hue')?.id;
      if (!roomId) { addRoom({ id: 'hue', name: 'Hue', icon: '💡', order: rooms.length }); roomId = 'hue'; }
      const lights = res.lights || {};
      let count = 0;
      Object.entries<any>(lights).forEach(([hueId, l]) => {
        const kind = l.state?.hue !== undefined ? 'rgbcct' : l.state?.ct !== undefined ? 'cct' : 'dimmable';
        const light: Light = {
          id: `hue-${hueId}`, name: l.name || `Hue ${hueId}`, roomId: roomId!, backend: 'hue',
          kind, icon: 'lamp', ref: { hueId }, state: { ...DEFAULT_STATE, on: !!l.state?.on },
        };
        addLight(light); count++;
      });
      setMsg(`✅ ${count} Hue-lampen geïmporteerd naar kamer "Hue".`);
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Mislukt'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet title="Instellingen" onClose={onClose}>
      {/* Demo */}
      <div className="list">
        <div className="item">
          <div>
            <div className="k">Demo-modus</div>
            <div className="v">Bediening blijft in de app, stuurt geen echte lampen aan.</div>
          </div>
          <Toggle on={config.demoMode} onChange={(v) => setConfig({ demoMode: v })} />
        </div>
      </div>

      {/* Tuya / MiBoxer */}
      <div className="section-title" style={{ margin: '18px 4px 6px' }}>MiBoxer (Tuya)</div>
      <p className="hint">
        Maak een gratis project op <a href="https://iot.tuya.com" target="_blank" rel="noreferrer">iot.tuya.com</a>,
        koppel je Smart Life/MiBoxer-account en plak hieronder je Access ID en Secret. Zie de handleiding (README) voor de stappen.
      </p>
      <select className="field" value={tEndpoint} onChange={(e) => setTEndpoint(e.target.value)}>
        {TUYA_ENDPOINTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input className="field" placeholder="Access ID / Client ID" value={tId} onChange={(e) => setTId(e.target.value)} autoCapitalize="none" autoCorrect="off" />
      <input className="field" placeholder="Access Secret" value={tSecret} onChange={(e) => setTSecret(e.target.value)} type="password" autoCapitalize="none" autoCorrect="off" />
      <button className="btn" disabled={busy === 'tuya'} onClick={testTuya}>{busy === 'tuya' ? 'Testen…' : 'Opslaan & verbinding testen'}</button>

      {/* Hue */}
      <div className="section-title" style={{ margin: '20px 4px 6px' }}>Philips Hue</div>
      <p className="hint">De app moet op je thuisnetwerk draaien om de Bridge te bereiken. Zoek de Bridge, druk op de ronde link-knop en koppel.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="field" placeholder="Bridge-IP (bijv. 192.168.1.23)" value={hueIp} onChange={(e) => setHueIp(e.target.value)} style={{ flex: 1 }} />
        <button className="btn secondary" style={{ width: 'auto', padding: '13px 16px', margin: '6px 0' }} disabled={busy === 'hue-d'} onClick={discoverHue}>Zoek</button>
      </div>
      <button className="btn secondary" disabled={busy === 'hue-p' || !hueIp} onClick={pairHue}>{busy === 'hue-p' ? 'Koppelen…' : 'Koppel (druk eerst op link-knop)'}</button>
      <button className="btn secondary" disabled={busy === 'hue-i' || !config.hue} onClick={importHue}>{busy === 'hue-i' ? 'Importeren…' : 'Hue-lampen importeren'}</button>

      {/* Kamer toevoegen */}
      <div className="section-title" style={{ margin: '20px 4px 6px' }}>Kamers</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="field" placeholder="Nieuwe kamer (naam)" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={{ flex: 1 }} />
        <button
          className="btn" style={{ width: 'auto', padding: '13px 18px', margin: '6px 0' }}
          onClick={() => { if (newRoom.trim()) { addRoom({ id: `room-${Date.now()}`, name: newRoom.trim(), icon: '💡', order: rooms.length }); setNewRoom(''); } }}
        >Toevoegen</button>
      </div>

      {msg && <p className="hint" style={{ color: msg.startsWith('❌') ? '#ff453a' : '#30d158' }}>{msg}</p>}

      <button className="btn danger" style={{ marginTop: 18 }} onClick={() => { if (confirm('Alles terugzetten naar de startopstelling?')) { resetAll(); onClose(); } }}>
        Alles resetten
      </button>
      <p className="hint" style={{ textAlign: 'center' }}>Gegevens worden lokaal op dit apparaat bewaard.</p>
    </Sheet>
  );
}
