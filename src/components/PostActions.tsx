'use client';

import { useApp } from '@/context/AppProvider';
import { Icon, type IconName } from '@/components/ui/Icon';
import { compact } from '@/lib/format';
import type { Post } from '@/lib/types';

export function PostActions({ post }: { post: Post }) {
  const { liked, bookmarked, toggleLike, toggleBookmark } = useApp();
  const isLiked = liked.has(post.id);
  const isBookmarked = bookmarked.has(post.id);

  return (
    <div className="flex items-center gap-1 border-t border-border/50 p-2 text-muted">
      <Btn
        icon="heart"
        label={compact(post.metrics.likes + (isLiked ? 1 : 0))}
        active={isLiked}
        activeClass="text-danger"
        onClick={() => toggleLike(post.id)}
      />
      <Btn icon="comment" label={compact(post.metrics.comments)} />
      <Btn icon="share" label={compact(post.metrics.shares)} />
      <div className="flex-1" />
      <Btn
        icon="bookmark"
        label={compact(post.metrics.bookmarks + (isBookmarked ? 1 : 0))}
        active={isBookmarked}
        activeClass="text-brand-soft"
        onClick={() => toggleBookmark(post.id)}
      />
    </div>
  );
}

function Btn({
  icon,
  label,
  active,
  activeClass,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  activeClass?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition hover:bg-elevated/60 active:scale-95 ${
        active ? activeClass : ''
      }`}
    >
      <Icon name={icon} size={19} filled={active} />
      <span className="text-xs font-medium tabular-nums">{label}</span>
    </button>
  );
}
