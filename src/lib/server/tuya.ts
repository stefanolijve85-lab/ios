// Tuya OpenAPI-client (server-side). Ondertekent verzoeken volgens Tuya's
// HMAC-SHA256-schema en cachet het access-token. De credentials komen mee met
// het request van de client (die ze in localStorage bewaart) — deze app is
// bedoeld om zelf te hosten op je eigen netwerk.

import crypto from 'crypto';

export interface TuyaCreds {
  endpoint: string; // bijv. https://openapi.tuyaeu.com
  accessId: string;
  accessSecret: string;
}

const EMPTY_BODY_HASH = crypto.createHash('sha256').update('').digest('hex');

interface Token {
  accessToken: string;
  expiresAt: number; // epoch ms
}
const tokenCache = new Map<string, Token>();

function hmac(secret: string, str: string): string {
  return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('hex').toUpperCase();
}

function sha256(body: string): string {
  return body ? crypto.createHash('sha256').update(body).digest('hex') : EMPTY_BODY_HASH;
}

function nonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function stringToSign(method: string, path: string, body: string): string {
  return [method, sha256(body), '', path].join('\n');
}

async function getToken(creds: TuyaCreds): Promise<string> {
  const cached = tokenCache.get(creds.accessId);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.accessToken;

  const t = Date.now().toString();
  const n = nonce();
  const path = '/v1.0/token?grant_type=1';
  const str = creds.accessId + t + n + stringToSign('GET', path, '');
  const sign = hmac(creds.accessSecret, str);

  const res = await fetch(creds.endpoint + path, {
    method: 'GET',
    headers: {
      client_id: creds.accessId,
      sign,
      t,
      sign_method: 'HMAC-SHA256',
      nonce: n,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(`Tuya token: ${json.msg || json.code || 'onbekende fout'}`);
  const token: Token = {
    accessToken: json.result.access_token,
    expiresAt: Date.now() + (json.result.expire_time - 60) * 1000,
  };
  tokenCache.set(creds.accessId, token);
  return token.accessToken;
}

export async function tuyaRequest(
  creds: TuyaCreds,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<any> {
  const accessToken = await getToken(creds);
  const t = Date.now().toString();
  const n = nonce();
  const bodyStr = body ? JSON.stringify(body) : '';
  const str = creds.accessId + accessToken + t + n + stringToSign(method, path, bodyStr);
  const sign = hmac(creds.accessSecret, str);

  const res = await fetch(creds.endpoint + path, {
    method,
    headers: {
      client_id: creds.accessId,
      access_token: accessToken,
      sign,
      t,
      sign_method: 'HMAC-SHA256',
      nonce: n,
      'Content-Type': 'application/json',
    },
    body: bodyStr || undefined,
  });
  const json = await res.json();
  if (!json.success) {
    // Token kan verlopen zijn — één keer opnieuw proberen met verse token.
    if (json.code === 1010 || json.code === 1011 || json.code === 1004) {
      tokenCache.delete(creds.accessId);
      return tuyaRequest(creds, method, path, body);
    }
    throw new Error(`Tuya: ${json.msg || json.code}`);
  }
  return json.result;
}

export async function sendCommands(creds: TuyaCreds, deviceId: string, commands: { code: string; value: unknown }[]) {
  return tuyaRequest(creds, 'POST', `/v1.0/devices/${deviceId}/commands`, { commands });
}

export async function listDevices(creds: TuyaCreds) {
  // Apparaten gekoppeld aan de app-account in dit cloud-project.
  return tuyaRequest(creds, 'GET', '/v1.0/iot-01/associated-users/devices?size=100');
}

export async function deviceStatus(creds: TuyaCreds, deviceId: string) {
  return tuyaRequest(creds, 'GET', `/v1.0/devices/${deviceId}/status`);
}

export async function deviceSpecs(creds: TuyaCreds, deviceId: string) {
  return tuyaRequest(creds, 'GET', `/v1.0/devices/${deviceId}/specifications`);
}
