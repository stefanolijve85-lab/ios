// Philips Hue Remote API (cloud). Werkt vanaf Vercel, zonder dat de server
// je thuisnetwerk hoeft te bereiken. Flow:
//  1. Gebruiker logt in via https://api.meethue.com/v2/oauth2/authorize
//  2. Wij ruilen de code in voor access/refresh-token (Basic auth met Client ID/Secret)
//  3. Eenmalig: virtuele link-knop indrukken en een app-username aanmaken
//  4. Daarna dezelfde v1-lampen-API als lokaal, maar via /route/api/<username>
// De tokens bewaart de client (localStorage), net als de Tuya-sleutels.

import { LightKind, LightState } from '@/lib/types';
import { stateToHue } from './hue';

const API = 'https://api.meethue.com';

export interface HueCloudCreds {
  accessToken: string;
  username: string;
}

export interface HueTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

async function tokenRequest(clientId: string, clientSecret: string, params: Record<string, string>): Promise<HueTokens> {
  const res = await fetch(`${API}/v2/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`Hue-login: ${json.error_description || json.error || json.fault?.faultstring || res.status}`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + Number(json.expires_in || 0) * 1000,
  };
}

export function exchangeCode(clientId: string, clientSecret: string, code: string) {
  return tokenRequest(clientId, clientSecret, { grant_type: 'authorization_code', code });
}

export function refreshTokens(clientId: string, clientSecret: string, refreshToken: string) {
  return tokenRequest(clientId, clientSecret, { grant_type: 'refresh_token', refresh_token: refreshToken });
}

async function remote(accessToken: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}/route${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Hue-cloud: ${json.fault?.faultstring || json.error || res.status}`);
  if (Array.isArray(json) && json[0]?.error) throw new Error(json[0].error.description || 'Hue-fout');
  return json;
}

// Virtuele link-knop + app-username aanmaken (eenmalig na inloggen).
export async function createUsername(accessToken: string): Promise<string> {
  await remote(accessToken, 'PUT', '/api/0/config', { linkbutton: true });
  const json = await remote(accessToken, 'POST', '/api', { devicetype: 'mylight#vercel' });
  const username = json[0]?.success?.username;
  if (!username) throw new Error('Hue-cloud: kon geen app-sleutel aanmaken');
  return username;
}

export function cloudListLights(c: HueCloudCreds) {
  return remote(c.accessToken, 'GET', `/api/${c.username}/lights`);
}

export function cloudSetLight(c: HueCloudCreds, hueId: string, s: LightState, kind?: LightKind) {
  return remote(c.accessToken, 'PUT', `/api/${c.username}/lights/${hueId}/state`, stateToHue(s, kind));
}
