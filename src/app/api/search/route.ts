import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/lib/db';

// GET /api/search?q=... — global search across content types.
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  return NextResponse.json({ query: q, results: search(q) });
}
