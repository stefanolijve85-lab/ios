import { NextRequest, NextResponse } from 'next/server';
import { deviceSpecs, listDevices, TuyaCreds } from '@/lib/server/tuya';

export const runtime = 'nodejs';

// Haalt de apparatenlijst op (en optioneel de DP-specificatie van één apparaat)
// zodat de gebruiker zones/lampen kan koppelen en DP-codes kan controleren.
export async function POST(req: NextRequest) {
  try {
    const { config, deviceId } = (await req.json()) as { config: TuyaCreds; deviceId?: string };
    if (!config?.accessId || !config?.accessSecret || !config?.endpoint) {
      return NextResponse.json({ success: false, error: 'Tuya-config ontbreekt' }, { status: 400 });
    }
    if (deviceId) {
      const specs = await deviceSpecs(config, deviceId);
      return NextResponse.json({ success: true, specs });
    }
    const devices = await listDevices(config);
    return NextResponse.json({ success: true, devices });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Onbekende fout' }, { status: 502 });
  }
}
