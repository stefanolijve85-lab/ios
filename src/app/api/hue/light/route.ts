import { NextRequest, NextResponse } from 'next/server';
import { hueSetLight, HueCreds } from '@/lib/server/hue';
import { LightState } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { config, hueId, state } = (await req.json()) as { config: HueCreds; hueId: string; state: LightState };
    if (!config?.bridgeIp || !config?.appKey) {
      return NextResponse.json({ success: false, error: 'Hue-config ontbreekt' }, { status: 400 });
    }
    const result = await hueSetLight(config, hueId, state);
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Onbekende fout' }, { status: 502 });
  }
}
