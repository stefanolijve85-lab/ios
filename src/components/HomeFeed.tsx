'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PostCard } from '@/components/PostCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { FeedKind, Post, User, Community } from '@/lib/types';

export interface ResolvedPost {
  post: Post;
  author: User;
  community?: Community;
}

const TABS: { key: FeedKind; label: string; icon: IconName }[] = [
  { key: 'for-you', label: 'For you', icon: 'sparkles' },
  { key: 'latest', label: 'Latest', icon: 'clock' },
  { key: 'trending', label: 'Trending', icon: 'flame' },
  { key: 'nearby', label: 'Nearby', icon: 'pin' },
  { key: 'following', label: 'Following', icon: 'users' },
];

export function HomeFeed({ feeds }: { feeds: Record<FeedKind, ResolvedPost[]> }) {
  const [tab, setTab] = useState<FeedKind>('for-you');
  const items = feeds[tab];

  return (
    <div>
      <div className="no-scrollbar sticky top-[57px] z-30 -mx-3 mb-4 flex gap-1 overflow-x-auto bg-bg/60 px-3 py-2 backdrop-blur-md sm:top-0 sm:mx-0 sm:rounded-2xl sm:px-2 lg:mx-0">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? 'text-fg' : 'text-muted hover:text-fg'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="feed-tab"
                  className="absolute inset-0 rounded-full bg-elevated shadow-glass"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon name={t.icon} size={15} />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-4"
        >
          {tab === 'nearby' && (
            <div className="card flex items-center gap-3 p-4 text-sm">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand-soft">
                <Icon name="globe" size={18} />
              </span>
              <p className="text-muted">
                Showing posts near <span className="font-medium text-fg">Rotterdam-West</span>. Enable precise
                location in settings for better results.
              </p>
            </div>
          )}
          {items.map(({ post, author, community }) => (
            <PostCard key={post.id} post={post} author={author} community={community} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
