'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppProvider';
import { Icon } from '@/components/ui/Icon';
import { Avatar, FactCheckBadge, RoleBadge, TagLink, VerifiedTick } from '@/components/ui/Primitives';
import { timeAgo, compact } from '@/lib/format';
import type { Post, User, Community } from '@/lib/types';

interface Props {
  post: Post;
  author: User;
  community?: Community;
  pinned?: boolean;
}

export function PostCard({ post, author, community, pinned }: Props) {
  const { liked, bookmarked, toggleLike, toggleBookmark } = useApp();
  const isLiked = liked.has(post.id);
  const isBookmarked = bookmarked.has(post.id);
  const likeCount = post.metrics.likes + (isLiked ? 1 : 0);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden"
    >
      <div className="p-4">
        {pinned && (
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-brand-soft">
            <Icon name="pin" size={13} /> Pinned
          </div>
        )}
        <div className="flex items-center gap-3">
          <Link href={`/u/${author.handle}`}>
            <Avatar src={author.avatar} name={author.name} size={42} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link href={`/u/${author.handle}`} className="truncate text-sm font-semibold hover:underline">
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
          <button className="btn-ghost !p-2 text-muted" aria-label="More options">
            <Icon name="chevron" size={16} className="rotate-90" />
          </button>
        </div>

        <Link href={`/post/${post.id}`} className="mt-3 block">
          <h3 className="text-[15px] font-semibold leading-snug">{post.headline}</h3>
          {post.body && <p className="mt-1 line-clamp-3 text-sm text-muted">{post.body}</p>}
        </Link>

        {(post.tags.length > 0 || post.factCheck) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {post.factCheck && post.factCheck !== 'unverified' && <FactCheckBadge status={post.factCheck} />}
            {post.tags.map((t) => (
              <TagLink key={t} tag={t} />
            ))}
          </div>
        )}
      </div>

      {post.images.length > 0 && (
        <Link href={`/post/${post.id}`} className="block">
          <div className="relative aspect-[16/9] w-full overflow-hidden border-y border-border/50">
            <Image
              src={post.images[0]}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized
            />
          </div>
        </Link>
      )}

      {post.location?.label && (
        <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-muted">
          <Icon name="pin" size={13} /> {post.location.label}
        </div>
      )}

      <div className="flex items-center gap-1 p-2 text-muted">
        <ActionButton
          active={isLiked}
          activeClass="text-danger"
          icon="heart"
          label={compact(likeCount)}
          onClick={() => toggleLike(post.id)}
        />
        <ActionButton icon="comment" label={compact(post.metrics.comments)} href={`/post/${post.id}`} />
        <ActionButton icon="share" label={compact(post.metrics.shares)} />
        <div className="flex-1" />
        <ActionButton
          active={isBookmarked}
          activeClass="text-brand-soft"
          icon="bookmark"
          onClick={() => toggleBookmark(post.id)}
          label=""
        />
      </div>
    </motion.article>
  );
}

function ActionButton({
  icon,
  label,
  active,
  activeClass,
  onClick,
  href,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  active?: boolean;
  activeClass?: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <Icon name={icon} size={19} filled={active} />
      {label && <span className="text-xs font-medium tabular-nums">{label}</span>}
    </>
  );
  const cls = `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition hover:bg-elevated/60 active:scale-95 ${
    active ? activeClass : ''
  }`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
