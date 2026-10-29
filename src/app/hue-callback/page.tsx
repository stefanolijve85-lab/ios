'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { finishHueLogin, HUE_STATE_KEY } from '@/components/HueCloud';

// Hierheen stuurt Hue je terug na het inloggen (?code=…&state=…). Staan je
// Client ID/Secret in deze browser, dan ronden we de koppeling meteen af.
// Opent iOS deze pagina in Safari i.p.v. in de beginscherm-app, dan tonen we de
// code zodat je die in MyLight kunt plakken.
export default function HueCallback() {
  const { ready, config, setConfig } = useStore();
  const [status, setStatus] = useState<'busy' | 'done' | 'manual' | 'error'>('busy');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const c = params.get('code') || '';
    setCode(c);
    if (!c) { setError(params.get('error_description') || params.get('error') || 'Geen code ontvangen van Hue.'); setStatus('error'); return; }

    let expected: string | null = null;
    try { expected = localStorage.getItem(HUE_STATE_KEY); } catch { /* negeer */ }
    const cloud = config.hueCloud;
    if (!cloud?.clientId || !cloud.clientSecret || !expected || expected !== params.get('state')) {
      setStatus('manual');
      return;
    }
    finishHueLogin(c, cloud, setConfig)
      .then(() => {
        try { localStorage.removeItem(HUE_STATE_KEY); } catch { /* negeer */ }
        setStatus('done');
        setTimeout(() => window.location.replace('/'), 1200);
      })
      .catch((e) => { setError(e?.message || 'Mislukt'); setStatus('error'); });
  }, [ready, config.hueCloud, setConfig]);

  return (
    <div className="app" style={{ paddingTop: 60 }}>
      <h1 style={{ fontSize: 28, margin: '0 4px 16px' }}>Philips Hue</h1>
      {status === 'busy' && <p className="hint">Koppelen met Hue…</p>}
      {status === 'done' && <p className="hint" style={{ color: '#30d158' }}>✅ Verbonden! Je gaat terug naar MyLight…</p>}
      {status === 'error' && <p className="hint" style={{ color: '#ff453a' }}>❌ {error}</p>}
      {status === 'manual' && (
        <>
          <p className="hint">
            Je bent ingelogd, maar deze pagina is in een ander venster geopend dan MyLight. Kopieer de code hieronder,
            open MyLight → Instellingen → Philips Hue en plak hem bij <b>Code</b>. (De code is maar een paar minuten geldig.)
          </p>
          <input className="field" readOnly value={code} onFocus={(e) => e.target.select()} />
          <button className="btn" onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}>Kopieer code</button>
        </>
      )}
      <a className="btn secondary" href="/" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>Terug naar MyLight</a>
    </div>
  );
}
