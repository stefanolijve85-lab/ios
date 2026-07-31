'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { search as runSearch, type SearchResult } from '@/lib/db';
import { Icon, type IconName } from '@/components/ui/Icon';

const typeMeta: Record<SearchResult['type'], { icon: IconName; color: string }> = {
  post: { icon: 'home', color: 'text-brand-soft' },
  user: { icon: 'user', color: 'text-accent' },
  community: { icon: 'users', color: 'text-success' },
  event: { icon: 'calendar', color: 'text-warning' },
  news: { icon: 'news', color: 'text-brand-soft' },
};

const SUGGESTIONS = ['integration', 'volunteer', 'public-safety', 'language', 'housing'];
const FILTERS: (SearchResult['type'] | 'all')[] = ['all', 'post', 'user', 'community', 'event', 'news'];

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => setQuery(initial), [initial]);

  const results = useMemo(() => {
    const clean = query.replace(/^#/, '');
    const all = runSearch(clean);
    return filter === 'all' ? all : all.filter((r) => r.type === filter);
  }, [query, filter]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Search</h1>

      <div className="relative">
        <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          className="input py-3 pl-11 text-base"
          placeholder="Search posts, people, communities, events, news…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-elevated text-fg shadow-glass' : 'text-muted hover:text-fg'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {!query && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Trending searches</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="chip hover:text-fg">
                #{s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {query && results.length === 0 && (
          <p className="card p-6 text-center text-sm text-muted">No results for “{query}”.</p>
        )}
        {results.map((r) => {
          const m = typeMeta[r.type];
          return (
            <Link key={`${r.type}-${r.id}`} href={r.href} className="card flex items-center gap-3 p-3.5 hover:shadow-glow">
              <span className={`grid h-9 w-9 place-items-center rounded-lg bg-elevated ${m.color}`}>
                <Icon name={m.icon} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted">{r.subtitle}</p>
              </div>
              <Icon name="chevron" size={16} className="text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl text-sm text-muted">Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}
