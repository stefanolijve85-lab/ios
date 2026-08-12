import { NextRequest, NextResponse } from 'next/server';
import { huePair, hueListLights } from '@/lib/server/hue';

export const runtime = 'nodejs';

// Twee acties:
//  - { action: 'discover' }        -> zoek Bridges via de Hue-cloud
//  - { action: 'pair', bridgeIp }  -> maak app-key (link-knop eerst indrukken)
//  - { action: 'lights', config }  -> lijst lampen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'discover') {
      const res = await fetch('https://discovery.meethue.com/', { signal: AbortSignal.timeout(6000) });
      const bridges = await res.json();
      return NextResponse.json({ success: true, bridges });
    }
    if (body.action === 'pair') {
      const appKey = await huePair(body.bridgeIp);
      if (!appKey) {
        return NextResponse.json({ success: false, error: 'Druk eerst op de link-knop op de Bridge en probeer opnieuw.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, appKey });
    }
    if (body.action === 'lights') {
      const lights = await hueListLights(body.config);
      return NextResponse.json({ success: true, lights });
    }
    return NextResponse.json({ success: false, error: 'Onbekende actie' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Onbekende fout' }, { status: 502 });
  }
}
