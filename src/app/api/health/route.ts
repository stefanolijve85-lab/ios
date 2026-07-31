import { NextResponse } from 'next/server';

// Liveness probe for the platform (used by CI/CD and uptime checks).
export function GET() {
  return NextResponse.json({ status: 'ok', service: 'civitas', time: new Date().toISOString() });
}
