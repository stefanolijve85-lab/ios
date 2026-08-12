// Philips Hue-client (server-side) via de lokale Bridge (API v1 over http).
// Let op: de server moet op hetzelfde netwerk als de Bridge draaien om het
// lokale IP te kunnen bereiken (dus de app thuis hosten, niet in de cloud).

import { LightState } from '@/lib/types';

export interface HueCreds {
  bridgeIp: string;
  appKey: string;
}

function base(c: HueCreds) {
  return `http://${c.bridgeIp}/api/${c.appKey}`;
}

async function hueFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) });
  const json = await res.json();
  if (Array.isArray(json) && json[0]?.error) {
    throw new Error(json[0].error.description || 'Hue-fout');
  }
  return json;
}

export async function hueListLights(c: HueCreds) {
  return hueFetch(`${base(c)}/lights`);
}

export function stateToHue(s: LightState): Record<string, unknown> {
  if (!s.on) return { on: false };
  const body: Record<string, unknown> = { on: true, bri: Math.max(1, Math.round((s.brightness / 100) * 253) + 1) };
  if (s.mode === 'color') {
    body.hue = Math.round((s.hue / 360) * 65535);
    body.sat = Math.round((s.saturation / 100) * 254);
  } else {
    body.ct = Math.max(153, Math.min(500, Math.round(1_000_000 / s.kelvin)));
  }
  return body;
}

export async function hueSetLight(c: HueCreds, hueId: string, s: LightState) {
  return hueFetch(`${base(c)}/lights/${hueId}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stateToHue(s)),
  });
}

// Koppelen: gebruiker drukt op de link-knop op de Bridge en roept dit binnen 30s aan.
export async function huePair(bridgeIp: string) {
  const res = await fetch(`http://${bridgeIp}/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devicetype: 'huisverlichting#app' }),
    signal: AbortSignal.timeout(5000),
  });
  const json = await res.json();
  if (json[0]?.error) throw new Error(json[0].error.description);
  return json[0]?.success?.username as string;
}
