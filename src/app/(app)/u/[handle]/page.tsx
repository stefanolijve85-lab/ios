import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getUserByHandle, userPosts, getCommunity } from '@/lib/db';
import { PostCard } from '@/components/PostCard';
import { Avatar, RoleBadge, VerifiedTick } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { compact, timeAgo } from '@/lib/format';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const u = getUserByHandle(handle);
  return { title: u ? `${u.name} (@${u.handle})` : 'Profile' };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const user = getUserByHandle(handle);
  if (!user) notFound();
  const posts = userPosts(user.id);
  const communities = user.communities.map((id) => getCommunity(id)).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="card overflow-hidden">
        <div className="h-28 bg-brand-gradient" />
        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar src={user.avatar} name={user.name} size={84} ring />
            <div className="mb-1 flex gap-2">
              <Link href="/messages" className="btn-ghost !px-3 !py-2" aria-label="Message">
                <Icon name="message" size={18} />
              </Link>
              <button className="btn-primary">Follow</button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
            {user.verified && <VerifiedTick size={18} />}
            <RoleBadge role={user.role} />
          </div>
          <p className="text-sm text-muted">@{user.handle}</p>
          <p className="mt-2 text-[15px]">{user.bio}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {user.privacy.showLocation && user.location && (
              <span className="flex items-center gap-1">
                <Icon name="pin" size={14} /> {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="clock" size={14} /> Joined {timeAgo(user.joinedAt)} ago
            </span>
          </div>

          <div className="mt-3 flex gap-4 text-sm">
            <span>
              <b>{compact(user.stats.following)}</b> <span className="text-muted">Following</span>
            </span>
            <span>
              <b>{compact(user.stats.followers)}</b> <span className="text-muted">Followers</span>
            </span>
            <span>
              <b>{compact(user.stats.helpful)}</b> <span className="text-muted">Helpful</span>
            </span>
          </div>

          {user.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {user.badges.map((b) => (
                <span key={b.id} className="chip" title={b.description}>
                  <span>{b.icon}</span> {b.label}
                </span>
              ))}
            </div>
          )}

          {user.interests.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Volunteer interests</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((i) => (
                  <span key={i} className="chip">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {communities.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {communities.map(
            (c) =>
              c && (
                <Link key={c.id} href={`/c/${c.slug}`} className="card flex shrink-0 items-center gap-2 px-3 py-2 text-sm hover:shadow-glow">
                  <span className="text-lg">{c.icon}</span> {c.name}
                </Link>
              ),
          )}
        </div>
      )}

      <h2 className="mb-3 mt-6 px-1 text-sm font-semibold text-muted">Activity</h2>
      <div className="flex flex-col gap-4">
        {posts.length === 0 && <p className="card p-6 text-center text-sm text-muted">No posts yet.</p>}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} author={user} community={p.communityId ? getCommunity(p.communityId) : undefined} />
        ))}
      </div>
    </div>
  );
}
