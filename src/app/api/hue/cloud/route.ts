import { NextRequest, NextResponse } from 'next/server';
import { cloudListLights, cloudSetLight, createUsername, exchangeCode, refreshTokens } from '@/lib/server/hueCloud';

export const runtime = 'nodejs';

// Acties:
//  - { action: 'token', clientId, clientSecret, code }       -> tokens + username
//  - { action: 'refresh', clientId, clientSecret, refreshToken } -> nieuwe tokens
//  - { action: 'lights', config: { accessToken, username } } -> lijst lampen
//  - { action: 'set', config, hueId, state, kind }               -> lamp aansturen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'token') {
      if (!body.clientId || !body.clientSecret || !body.code) throw new Error('Client ID, Secret of code ontbreekt');
      const tokens = await exchangeCode(body.clientId, body.clientSecret, body.code);
      const username = await createUsername(tokens.accessToken);
      return NextResponse.json({ success: true, tokens, username });
    }
    if (body.action === 'refresh') {
      const tokens = await refreshTokens(body.clientId, body.clientSecret, body.refreshToken);
      return NextResponse.json({ success: true, tokens });
    }
    if (!body.config?.accessToken || !body.config?.username) {
      return NextResponse.json({ success: false, error: 'Hue-cloud niet gekoppeld' }, { status: 400 });
    }
    if (body.action === 'lights') {
      const lights = await cloudListLights(body.config);
      return NextResponse.json({ success: true, lights });
    }
    if (body.action === 'set') {
      const result = await cloudSetLight(body.config, body.hueId, body.state, body.kind);
      return NextResponse.json({ success: true, result });
    }
    return NextResponse.json({ success: false, error: 'Onbekende actie' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Onbekende fout' }, { status: 502 });
  }
}
