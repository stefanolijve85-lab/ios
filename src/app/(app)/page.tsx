import Link from 'next/link';
import { getCurrentUser, getFeed, getUser, getCommunity, listCommunities, listEvents } from '@/lib/db';
import { HomeFeed, type ResolvedPost } from '@/components/HomeFeed';
import { Icon } from '@/components/ui/Icon';
import { compact, timeUntil } from '@/lib/format';
import type { FeedKind } from '@/lib/types';

const KINDS: FeedKind[] = ['for-you', 'latest', 'trending', 'nearby', 'following'];

function resolve(kind: FeedKind): ResolvedPost[] {
  const viewer = getCurrentUser();
  return getFeed(kind, viewer).map((post) => ({
    post,
    author: getUser(post.authorId)!,
    community: post.communityId ? getCommunity(post.communityId) : undefined,
  }));
}

export default function HomePage() {
  const feeds = Object.fromEntries(KINDS.map((k) => [k, resolve(k)])) as Record<FeedKind, ResolvedPost[]>;
  const trendingTags = ['integration', 'public-safety', 'volunteer', 'policy', 'language', 'housing'];
  const communities = listCommunities().slice(0, 4);
  const events = listEvents().slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="mx-auto w-full max-w-2xl">
        <HomeFeed feeds={feeds} />
      </div>

      <aside className="hidden flex-col gap-4 xl:flex">
        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon name="flame" size={16} /> Trending topics
          </h3>
          <div className="flex flex-col gap-1">
            {trendingTags.map((t, i) => (
              <Link
                key={t}
                href={`/search?q=%23${t}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-elevated/60"
              >
                <span>
                  <span className="mr-1.5 text-muted">{i + 1}</span>#{t}
                </span>
                <span className="text-xs text-muted">{compact(9000 - i * 1200)} posts</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon name="users" size={16} /> Communities to join
          </h3>
          <div className="flex flex-col gap-2">
            {communities.map((c) => (
              <Link key={c.id} href={`/c/${c.slug}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-elevated/60">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-elevated text-lg">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted">{compact(c.stats.members)} members</p>
                </div>
                <span className="btn-outline !px-3 !py-1 !text-xs">Join</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon name="calendar" size={16} /> Upcoming events
          </h3>
          <div className="flex flex-col gap-2">
            {events.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="rounded-lg p-1.5 hover:bg-elevated/60">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted">
                  {timeUntil(e.startsAt)} · {e.venue}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <p className="px-2 text-xs leading-relaxed text-muted">
          Civitas is a civic platform for lawful, respectful participation.{' '}
          <Link href="/guidelines" className="link">
            Community guidelines
          </Link>
        </p>
      </aside>
    </div>
  );
}
