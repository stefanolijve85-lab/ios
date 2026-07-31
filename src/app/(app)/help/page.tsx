'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { listHelp, getUser } from '@/lib/db';
import { Avatar } from '@/components/ui/Primitives';
import { Icon, type IconName } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/format';
import type { HelpCategory, HelpKind } from '@/lib/types';

const ALL = listHelp();

const catIcon: Record<HelpCategory, IconName> = {
  legal: 'shield',
  translation: 'globe',
  transport: 'map',
  volunteer: 'hand',
  housing: 'home',
  community: 'users',
};

const statusStyle = {
  open: 'text-success bg-success/10 border-success/40',
  matched: 'text-accent bg-accent/10 border-accent/40',
  completed: 'text-muted bg-elevated border-border',
} as const;

export default function HelpPage() {
  const [kind, setKind] = useState<HelpKind | 'all'>('all');

  const listings = useMemo(() => (kind === 'all' ? ALL : ALL.filter((h) => h.kind === kind)), [kind]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help Network</h1>
          <p className="text-sm text-muted">Ask for help or offer it. We match people who can support each other.</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {(['all', 'request', 'offer'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              kind === k ? 'bg-elevated text-fg shadow-glass' : 'text-muted hover:text-fg'
            }`}
          >
            {k === 'all' ? 'All' : `${k}s`}
          </button>
        ))}
        <button className="btn-primary ml-auto">
          <Icon name="plus" size={16} /> New
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {listings.map((h) => {
          const author = getUser(h.authorId)!;
          const matched = h.matchedWith ? getUser(h.matchedWith) : undefined;
          return (
            <div key={h.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    h.kind === 'request' ? 'bg-brand/15 text-brand-soft' : 'bg-success/15 text-success'
                  }`}
                >
                  <Icon name={catIcon[h.category]} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        h.kind === 'request' ? 'bg-brand/15 text-brand-soft' : 'bg-success/15 text-success'
                      }`}
                    >
                      {h.kind}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyle[h.status]}`}>
                      {h.status}
                    </span>
                    <span className="chip">{h.category}</span>
                  </div>
                  <h3 className="mt-1.5 font-semibold">{h.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{h.details}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Link href={`/u/${author.handle}`} className="flex items-center gap-2 text-xs text-muted hover:text-fg">
                      <Avatar src={author.avatar} name={author.name} size={24} /> {author.name}
                      <span aria-hidden>·</span>
                      <Icon name="pin" size={12} /> {h.location.label}
                      <span aria-hidden>·</span> {timeAgo(h.createdAt)}
                    </Link>
                    {h.status === 'open' ? (
                      <button className="btn-outline !px-3 !py-1.5 !text-xs">
                        {h.kind === 'request' ? 'Offer help' : 'Request this'}
                      </button>
                    ) : matched ? (
                      <span className="flex items-center gap-1 text-xs text-accent">
                        <Icon name="check" size={13} /> Matched with {matched.name.split(' ')[0]}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
