import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { listCommunities } from '@/lib/db';
import { Icon } from '@/components/ui/Icon';
import { compact } from '@/lib/format';
import type { CommunityCategory } from '@/lib/types';

export const metadata: Metadata = { title: 'Communities' };

const categoryLabel: Record<CommunityCategory, string> = {
  local: 'Local',
  municipality: 'Municipality',
  province: 'Province',
  'public-safety': 'Public safety',
  'immigration-policy': 'Immigration & policy',
  culture: 'Culture',
  events: 'Events',
  'neighborhood-watch': 'Neighborhood watch',
  volunteer: 'Volunteer',
};

export default function CommunitiesPage() {
  const communities = listCommunities();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communities</h1>
          <p className="text-sm text-muted">Find your people. Organize around what matters locally.</p>
        </div>
        <button className="btn-primary self-start">
          <Icon name="plus" size={16} /> Create community
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {communities.map((c) => (
          <Link
            key={c.id}
            href={`/c/${c.slug}`}
            className="card group overflow-hidden transition hover:shadow-glow"
          >
            <div className="relative aspect-[21/9] w-full overflow-hidden">
              <Image src={c.cover} alt="" fill className="object-cover transition group-hover:scale-105" unoptimized sizes="(max-width:640px) 100vw, 400px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center rounded-2xl bg-surface/80 text-2xl backdrop-blur">
                {c.icon}
              </span>
              <span className="absolute right-3 top-3 chip !bg-black/40 !text-white backdrop-blur">
                {categoryLabel[c.category]}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted">{c.tagline}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Icon name="users" size={13} /> {compact(c.stats.members)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success" /> {compact(c.stats.online)} online
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
