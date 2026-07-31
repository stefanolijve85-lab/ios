import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { listNews, getUser } from '@/lib/db';
import { FactCheckBadge, VerifiedTick } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { formatDate, compact } from '@/lib/format';

export const metadata: Metadata = { title: 'News' };

export default function NewsPage() {
  const articles = listNews();
  const [lead, ...rest] = articles;
  const leadAuthor = getUser(lead.authorId)!;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">News</h1>
          <p className="text-sm text-muted">Community-submitted, editor-verified. Sources required.</p>
        </div>
        <button className="btn-outline">
          <Icon name="plus" size={16} /> Submit
        </button>
      </div>

      <Link href={`/news/${lead.id}`} className="card group mb-6 block overflow-hidden hover:shadow-glow">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <Image src={lead.cover} alt="" fill className="object-cover transition group-hover:scale-105" unoptimized sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="chip !bg-white/15 !text-white">{lead.category}</span>
              <FactCheckBadge status={lead.factCheck} />
            </div>
            <h2 className="max-w-2xl text-xl font-bold text-white sm:text-2xl">{lead.title}</h2>
            <p className="mt-1 flex items-center gap-2 text-xs text-white/80">
              {leadAuthor.name}
              {leadAuthor.verified && <VerifiedTick size={12} />}· {formatDate(lead.publishedAt)} ·{' '}
              {lead.readingMinutes} min read
            </p>
          </div>
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        {rest.map((a) => {
          const author = getUser(a.authorId)!;
          return (
            <Link key={a.id} href={`/news/${a.id}`} className="card group flex overflow-hidden hover:shadow-glow">
              <div className="relative aspect-square w-28 shrink-0 overflow-hidden sm:w-32">
                <Image src={a.cover} alt="" fill className="object-cover transition group-hover:scale-105" unoptimized sizes="128px" />
              </div>
              <div className="min-w-0 flex-1 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="chip">{a.category}</span>
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{a.summary}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
                  <FactCheckBadge status={a.factCheck} />
                  <span>{a.readingMinutes} min</span>
                  <span className="flex items-center gap-1">
                    <Icon name="bookmark" size={11} /> {compact(a.metrics.saves)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
