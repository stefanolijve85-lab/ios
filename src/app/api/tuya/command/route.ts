import { NextRequest, NextResponse } from 'next/server';
import { sendCommands, TuyaCreds } from '@/lib/server/tuya';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { config, deviceId, commands } = (await req.json()) as {
      config: TuyaCreds;
      deviceId: string;
      commands: { code: string; value: unknown }[];
    };
    if (!config?.accessId || !config?.accessSecret || !config?.endpoint) {
      return NextResponse.json({ success: false, error: 'Tuya-config ontbreekt' }, { status: 400 });
    }
    if (!deviceId) return NextResponse.json({ success: false, error: 'deviceId ontbreekt' }, { status: 400 });
    const result = await sendCommands(config, deviceId, commands);
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Onbekende fout' }, { status: 502 });
  }
}
