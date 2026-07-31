import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPost, getUser, getCommunity, listComments } from '@/lib/db';
import { CommentThread, type ResolvedComment } from '@/components/CommentThread';
import { PostActions } from '@/components/PostActions';
import { Avatar, FactCheckBadge, RoleBadge, TagLink, VerifiedTick } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/format';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = getPost(id);
  return { title: post ? post.headline : 'Post' };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) notFound();
  const author = getUser(post.authorId)!;
  const community = post.communityId ? getCommunity(post.communityId) : undefined;
  const comments: ResolvedComment[] = listComments(post.id).map((c) => {
    const a = getUser(c.authorId)!;
    return { comment: c, author: { name: a.name, handle: a.handle, avatar: a.avatar, verified: a.verified } };
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <Icon name="chevron" size={16} className="rotate-180" /> Back to feed
      </Link>

      <article className="card overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Link href={`/u/${author.handle}`}>
              <Avatar src={author.avatar} name={author.name} size={44} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link href={`/u/${author.handle}`} className="font-semibold hover:underline">
                  {author.name}
                </Link>
                {author.verified && <VerifiedTick />}
                <RoleBadge role={author.role} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span>@{author.handle}</span>
                <span aria-hidden>·</span>
                <span>{timeAgo(post.createdAt)}</span>
                {community && (
                  <>
                    <span aria-hidden>·</span>
                    <Link href={`/c/${community.slug}`} className="hover:text-fg">
                      {community.icon} {community.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold leading-snug tracking-tight">{post.headline}</h1>
          {post.body && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-fg/90">{post.body}</p>}

          {post.location?.label && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="pin" size={15} /> {post.location.label}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {post.factCheck && post.factCheck !== 'unverified' && <FactCheckBadge status={post.factCheck} />}
            {post.tags.map((t) => (
              <TagLink key={t} tag={t} />
            ))}
          </div>
        </div>

        {post.images.length > 0 && (
          <div className="relative aspect-[16/9] w-full border-y border-border/50">
            <Image src={post.images[0]} alt="" fill className="object-cover" unoptimized sizes="640px" />
          </div>
        )}

        <PostActions post={post} />
      </article>

      <h2 className="mt-6 px-1 text-sm font-semibold text-muted">
        {post.metrics.comments} comments
      </h2>
      <CommentThread initial={comments} />
    </div>
  );
}
