import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getFeed, getUser, getCommunity } from '@/lib/db';
import type { FeedKind } from '@/lib/types';

const KINDS: FeedKind[] = ['for-you', 'latest', 'trending', 'nearby', 'following'];

// GET /api/posts?feed=trending — returns the ranked feed for the current user.
export function GET(req: NextRequest) {
  const feed = (req.nextUrl.searchParams.get('feed') ?? 'for-you') as FeedKind;
  const kind = KINDS.includes(feed) ? feed : 'for-you';
  const viewer = getCurrentUser();
  const posts = getFeed(kind, viewer).map((p) => ({
    ...p,
    author: getUser(p.authorId),
    community: p.communityId ? getCommunity(p.communityId) : undefined,
  }));
  return NextResponse.json({ feed: kind, count: posts.length, posts });
}

// POST /api/posts — validates and "creates" a post (demo: echoed back).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { headline, body: text, communityId } = (body ?? {}) as Record<string, unknown>;

  if (typeof headline !== 'string' || headline.trim().length < 3) {
    return NextResponse.json({ error: 'A headline of at least 3 characters is required.' }, { status: 422 });
  }
  if (headline.length > 140) {
    return NextResponse.json({ error: 'Headline too long (max 140).' }, { status: 422 });
  }
  if (communityId && !getCommunity(String(communityId))) {
    return NextResponse.json({ error: 'Unknown community.' }, { status: 422 });
  }

  const viewer = getCurrentUser();
  const post = {
    id: `p_${Math.random().toString(36).slice(2, 9)}`,
    authorId: viewer.id,
    communityId: communityId ? String(communityId) : undefined,
    headline: String(headline).trim(),
    body: typeof text === 'string' ? text.trim() : '',
    images: [] as string[],
    tags: [] as string[],
    factCheck: 'unverified' as const,
    createdAt: new Date().toISOString(),
    metrics: { likes: 0, comments: 0, shares: 0, bookmarks: 0 },
    likedBy: [] as string[],
    bookmarkedBy: [] as string[],
  };
  return NextResponse.json({ post }, { status: 201 });
}
