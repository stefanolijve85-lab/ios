import { NextResponse } from 'next/server';
import { listCommunities } from '@/lib/db';

// GET /api/communities — public directory of communities.
export function GET() {
  return NextResponse.json({ communities: listCommunities() });
}
