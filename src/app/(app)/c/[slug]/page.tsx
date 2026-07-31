import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCommunity, communityPosts, getUser, getPost } from '@/lib/db';
import { PostCard } from '@/components/PostCard';
import { Icon } from '@/components/ui/Icon';
import { Avatar, VerifiedTick } from '@/components/ui/Primitives';
import { compact } from '@/lib/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCommunity(slug);
  return { title: c ? c.name : 'Community' };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const community = getCommunity(slug);
  if (!community) notFound();

  const posts = communityPosts(community.id);
  const pinned = community.pinnedPostIds.map((id) => getPost(id)).filter(Boolean);
  const moderators = community.moderatorIds.map((id) => getUser(id)).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="card overflow-hidden">
        <div className="relative aspect-[3/1] w-full">
          <Image src={community.cover} alt="" fill className="object-cover" unoptimized sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="relative px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-surface/90 text-4xl shadow-glass backdrop-blur">
              {community.icon}
            </span>
            <button className="btn-primary mb-1">
              <Icon name="check" size={16} /> Joined
            </button>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{community.name}</h1>
          <p className="text-sm text-muted">{community.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="users" size={15} /> {compact(community.stats.members)} members
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" /> {compact(community.stats.online)} online
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="chart" size={15} /> {community.stats.postsPerWeek}/week
            </span>
            {community.location && (
              <span className="flex items-center gap-1.5">
                <Icon name="pin" size={15} /> {community.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          {pinned.map(
            (p) =>
              p && (
                <PostCard
                  key={p.id}
                  post={p}
                  author={getUser(p.authorId)!}
                  community={community}
                  pinned
                />
              ),
          )}
          {posts
            .filter((p) => !community.pinnedPostIds.includes(p.id))
            .map((p) => (
              <PostCard key={p.id} post={p} author={getUser(p.authorId)!} community={community} />
            ))}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">About</h3>
            <p className="text-sm text-muted">{community.description}</p>
          </div>
          <div className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Icon name="shield" size={15} /> Community rules
            </h3>
            <ol className="flex flex-col gap-2 text-sm">
              {community.rules.map((rule, i) => (
                <li key={i} className="flex gap-2 text-muted">
                  <span className="font-semibold text-fg">{i + 1}.</span> {rule}
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold">Moderators</h3>
            <div className="flex flex-col gap-2">
              {moderators.map(
                (m) =>
                  m && (
                    <Link key={m.id} href={`/u/${m.handle}`} className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-elevated/60">
                      <Avatar src={m.avatar} name={m.name} size={34} />
                      <div>
                        <p className="flex items-center gap-1 text-sm font-medium">
                          {m.name} {m.verified && <VerifiedTick size={13} />}
                        </p>
                        <p className="text-xs text-muted">@{m.handle}</p>
                      </div>
                    </Link>
                  ),
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
