'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { hueCloudConfig } from '@/lib/control';
import { DEFAULT_STATE, Light, LightKind } from '@/lib/types';
import ImportRow, { guessRoom } from './ImportRow';

export const HUE_STATE_KEY = 'mylight.hue.state';

interface HueLight {
  name: string;
  type?: string;
  state?: { on?: boolean; hue?: number; ct?: number; bri?: number };
}

// Hue v1 "type" -> ons lamptype.
export function hueKind(l: HueLight): LightKind {
  const t = (l.type || '').toLowerCase();
  if (t.includes('plug') || t.includes('on/off')) return 'onoff';
  if (t.includes('color light')) return 'rgbcct';
  if (t.includes('temperature')) return 'cct';
  if (t.includes('dimmable')) return 'dimmable';
  return l.state?.hue !== undefined ? 'rgbcct' : l.state?.ct !== undefined ? 'cct' : l.state?.bri !== undefined ? 'dimmable' : 'onoff';
}

const KIND_LABEL: Record<LightKind, string> = { rgbcct: 'Kleur + wit', cct: 'Wit (CCT)', dimmable: 'Dimbaar', onoff: 'Stekker (aan/uit)' };

// Wisselt een autorisatiecode in voor tokens + app-sleutel en slaat alles op.
export async function finishHueLogin(
  code: string,
  cfg: { clientId: string; clientSecret: string },
  setConfig: ReturnType<typeof useStore>['setConfig'],
) {
  const res = await fetch('/api/hue/cloud', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'token', clientId: cfg.clientId, clientSecret: cfg.clientSecret, code: code.trim() }),
  }).then((r) => r.json());
  if (!res.success) throw new Error(res.error);
  setConfig({ hueCloud: { clientId: cfg.clientId, clientSecret: cfg.clientSecret, ...res.tokens, username: res.username } });
}

export default function HueCloud() {
  const { config, setConfig, rooms, lights, addLight } = useStore();
  const cloud = config.hueCloud;
  const connected = !!(cloud?.username && cloud.accessToken);
  const [clientId, setClientId] = useState(cloud?.clientId || '');
  const [clientSecret, setClientSecret] = useState(cloud?.clientSecret || '');
  const [code, setCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<[string, HueLight][] | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const sortedRooms = [...rooms].sort((a, b) => a.order - b.order);

  useEffect(() => setOrigin(window.location.origin), []);
  const callbackUrl = `${origin}/hue-callback`;

  const creds = () => ({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });

  const login = () => {
    const c = creds();
    if (!c.clientId || !c.clientSecret) { setMsg('❌ Vul eerst Client ID en Client Secret in.'); return; }
    setConfig({ hueCloud: { ...cloud, ...c } });
    const state = Math.random().toString(36).slice(2);
    try { localStorage.setItem(HUE_STATE_KEY, state); } catch { /* negeer */ }
    // Even wachten zodat de store de Client ID/Secret heeft opgeslagen.
    setTimeout(() => {
      window.location.href = `https://api.meethue.com/v2/oauth2/authorize?client_id=${encodeURIComponent(c.clientId)}&response_type=code&state=${state}`;
    }, 150);
  };

  const pasteCode = async () => {
    setBusy('code'); setMsg(null);
    try {
      await finishHueLogin(code, creds(), setConfig);
      setCode('');
      setMsg('✅ Verbonden met Hue! Importeer nu je lampen.');
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Mislukt'));
    } finally {
      setBusy(null);
    }
  };

  const load = async () => {
    if (!cloud) return;
    setBusy('lights'); setMsg(null);
    try {
      const c = await hueCloudConfig(cloud, setConfig);
      const res = await fetch('/api/hue/cloud', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lights', config: { accessToken: c.accessToken, username: c.username } }),
      }).then((r) => r.json());
      if (!res.success) throw new Error(res.error);
      const entries = Object.entries<HueLight>(res.lights || {}).sort((a, b) => (a[1].name || '').localeCompare(b[1].name || ''));
      setList(entries);
      setChoice(Object.fromEntries(entries.map(([id, l]) => [id, guessRoom(l.name || '', sortedRooms)])));
    } catch (e: any) {
      setMsg('❌ ' + (e?.message || 'Mislukt'));
    } finally {
      setBusy(null);
    }
  };

  const add = (hueId: string, l: HueLight) => {
    const roomId = choice[hueId] || sortedRooms[0]?.id;
    if (!roomId) return;
    const kind = hueKind(l);
    const light: Light = {
      id: `hue-${hueId}`, name: l.name || `Hue ${hueId}`, roomId, backend: 'hue',
      kind, icon: kind === 'onoff' ? 'plug' : 'lamp', ref: { hueId }, state: { ...DEFAULT_STATE, on: !!l.state?.on },
    };
    addLight(light);
  };

  const disconnect = () => {
    if (confirm('Hue-cloud ontkoppelen? Je Client ID/Secret blijven bewaard.')) {
      setConfig({ hueCloud: { clientId: clientId.trim(), clientSecret: clientSecret.trim() } });
      setList(null);
    }
  };

  return (
    <>
      {connected ? (
        <>
          <div className="list">
            <div className="item">
              <div className="k">✅ Verbonden met Hue-cloud</div>
              <button className="v" style={{ color: '#ff453a' }} onClick={disconnect}>Ontkoppel</button>
            </div>
          </div>
          <button className="btn secondary" disabled={busy === 'lights'} onClick={load}>
            {busy === 'lights' ? 'Ophalen…' : list ? 'Hue-lijst vernieuwen' : 'Hue-lampen importeren'}
          </button>
          {list && list.length === 0 && <p className="hint">Geen Hue-lampen gevonden op je Bridge.</p>}
          {list && list.length > 0 && (
            <div className="list">
              {list.map(([hueId, l]) => {
                const kind = hueKind(l);
                const existing = lights.find((x) => x.backend === 'hue' && x.ref.hueId === hueId);
                const existingRoom = existing && rooms.find((r) => r.id === existing.roomId);
                return (
                  <ImportRow
                    key={hueId}
                    emoji={kind === 'onoff' ? '🔌' : '💡'}
                    name={l.name}
                    sub={`${l.type || 'Hue'} · ${KIND_LABEL[kind]}`}
                    rooms={sortedRooms}
                    existingRoom={existing ? existingRoom?.name || null : undefined}
                    room={choice[hueId] || ''}
                    onRoom={(roomId) => setChoice((c) => ({ ...c, [hueId]: roomId }))}
                    onAdd={() => add(hueId, l)}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="hint">
            Eenmalig: log in op <a href="https://developers.meethue.com/my-apps/" target="_blank" rel="noreferrer">developers.meethue.com → My Apps</a> (gratis account),
            kies <b>Add new Hue Remote API app</b> en vul als <b>Callback URL</b> in:
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field" readOnly value={callbackUrl} style={{ flex: 1, fontSize: 13 }} onFocus={(e) => e.target.select()} />
            <button
              className="btn secondary" style={{ width: 'auto', padding: '13px 16px', margin: '6px 0' }}
              onClick={() => { navigator.clipboard?.writeText(callbackUrl).then(() => setMsg('✅ Callback URL gekopieerd')).catch(() => {}); }}
            >Kopieer</button>
          </div>
          <p className="hint">Plak daarna de <b>ClientId</b> en <b>ClientSecret</b> van die app hieronder en tik op Inloggen met Hue.</p>
          <input className="field" placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} autoCapitalize="none" autoCorrect="off" />
          <input className="field" placeholder="Client Secret" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} type="password" autoCapitalize="none" autoCorrect="off" />
          <button className="btn" onClick={login}>Inloggen met Hue</button>
          <p className="hint">Kom je na het inloggen in Safari uit met een code? Plak die hier:</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} style={{ flex: 1 }} autoCapitalize="none" autoCorrect="off" />
            <button
              className="btn secondary" style={{ width: 'auto', padding: '13px 16px', margin: '6px 0' }}
              disabled={busy === 'code' || !code.trim()} onClick={pasteCode}
            >{busy === 'code' ? '…' : 'Koppel'}</button>
          </div>
        </>
      )}
      {msg && <p className="hint" style={{ color: msg.startsWith('❌') ? '#ff453a' : '#30d158' }}>{msg}</p>}
    </>
  );
}
