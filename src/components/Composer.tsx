'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useApp } from '@/context/AppProvider';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Primitives';
import { communities } from '@/data/seed';

// Post composer, presented as a glass modal. Client-only; a real build would
// POST to /api/posts. Here it validates and gives optimistic feedback.
export function Composer() {
  const { composerOpen, setComposerOpen, user } = useApp();
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [community, setCommunity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const close = () => {
    setComposerOpen(false);
    setTimeout(() => {
      setHeadline('');
      setBody('');
      setDone(false);
    }, 200);
  };

  const submit = async () => {
    if (!headline.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, body, communityId: community || undefined }),
      }).catch(() => {});
    } finally {
      setSubmitting(false);
      setDone(true);
      setTimeout(close, 1100);
    }
  };

  return (
    <AnimatePresence>
      {composerOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <motion.div
            className="glass-strong relative w-full max-w-lg rounded-t-3xl p-5 shadow-glass sm:rounded-3xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Create post"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Create a post</h2>
              <button className="btn-ghost !p-2" onClick={close} aria-label="Close">
                <Icon name="x" size={18} />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
                  <Icon name="check" size={26} />
                </span>
                <p className="font-medium">Posted to the feed</p>
                <p className="text-sm text-muted">Your post is live for the demo session.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar} name={user.name} size={40} />
                  <div>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <select
                      className="input mt-1 !py-1 !text-xs"
                      value={community}
                      onChange={(e) => setCommunity(e.target.value)}
                    >
                      <option value="">Post to your profile</option>
                      {communities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  className="input text-base font-medium"
                  placeholder="Headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={140}
                />
                <textarea
                  className="input min-h-[120px] resize-none"
                  placeholder="Share something with your community…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-muted">
                    <button className="btn-ghost !p-2" aria-label="Add image">
                      <Icon name="image" size={18} />
                    </button>
                    <button className="btn-ghost !p-2" aria-label="Add location">
                      <Icon name="pin" size={18} />
                    </button>
                  </div>
                  <button className="btn-primary" onClick={submit} disabled={!headline.trim() || submitting}>
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
                <p className="text-center text-[11px] text-muted">
                  Posts must follow the{' '}
                  <a href="/guidelines" className="link">
                    community guidelines
                  </a>
                  . Be lawful and respectful.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
