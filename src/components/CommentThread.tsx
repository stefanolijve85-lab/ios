'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppProvider';
import { Avatar, VerifiedTick } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { timeAgo, compact } from '@/lib/format';
import type { Comment, User } from '@/lib/types';

export interface ResolvedComment {
  comment: Comment;
  author: Pick<User, 'name' | 'handle' | 'avatar' | 'verified'>;
}

export function CommentThread({ initial }: { initial: ResolvedComment[] }) {
  const { user } = useApp();
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState('');

  const add = () => {
    const body = text.trim();
    if (!body) return;
    setComments((prev) => [
      ...prev,
      {
        comment: {
          id: `local_${prev.length}`,
          postId: '',
          authorId: user.id,
          body,
          createdAt: new Date().toISOString(),
          likes: 0,
        },
        author: { name: user.name, handle: user.handle, avatar: user.avatar, verified: user.verified },
      },
    ]);
    setText('');
  };

  return (
    <div className="mt-4">
      <div className="card flex items-center gap-3 p-3">
        <Avatar src={user.avatar} name={user.name} size={36} />
        <input
          className="input"
          placeholder="Add a respectful comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          maxLength={500}
        />
        <button className="btn-primary !px-3" onClick={add} disabled={!text.trim()} aria-label="Send comment">
          <Icon name="send" size={16} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {comments.map(({ comment, author }) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-3"
            >
              <div className="flex items-center gap-2">
                <Avatar src={author.avatar} name={author.name} size={30} />
                <span className="flex items-center gap-1 text-sm font-medium">
                  {author.name} {author.verified && <VerifiedTick size={12} />}
                </span>
                <span className="text-xs text-muted">@{author.handle}</span>
                <span className="text-xs text-muted">· {timeAgo(comment.createdAt)}</span>
              </div>
              <p className="mt-1.5 pl-9 text-sm">{comment.body}</p>
              <div className="mt-1 flex items-center gap-3 pl-9 text-xs text-muted">
                <button className="flex items-center gap-1 hover:text-danger">
                  <Icon name="heart" size={13} /> {compact(comment.likes)}
                </button>
                <button className="hover:text-fg">Reply</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
