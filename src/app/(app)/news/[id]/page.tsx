import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNews, getUser } from '@/lib/db';
import { Avatar, FactCheckBadge, VerifiedTick } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { formatDate, compact } from '@/lib/format';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = getNews(id);
  return { title: a ? a.title : 'Article' };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = getNews(id);
  if (!article) notFound();
  const author = getUser(article.authorId)!;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link href="/news" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <Icon name="chevron" size={16} className="rotate-180" /> All news
      </Link>

      <article className="card overflow-hidden">
        <div className="relative aspect-[16/9] w-full">
          <Image src={article.cover} alt="" fill className="object-cover" unoptimized sizes="640px" priority />
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip">{article.category}</span>
            <FactCheckBadge status={article.factCheck} />
            {article.verifiedByEditor && (
              <span className="chip !text-accent">
                <Icon name="verified" size={12} filled /> Editor-verified
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight">{article.title}</h1>
          <p className="mt-2 text-base text-muted">{article.summary}</p>

          <div className="mt-4 flex items-center justify-between border-y border-border/50 py-3">
            <Link href={`/u/${author.handle}`} className="flex items-center gap-2.5">
              <Avatar src={author.avatar} name={author.name} size={38} />
              <div>
                <p className="flex items-center gap-1 text-sm font-medium">
                  {author.name} {author.verified && <VerifiedTick size={13} />}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(article.publishedAt)} · {article.readingMinutes} min read
                </p>
              </div>
            </Link>
            <div className="flex gap-1">
              <button className="btn-ghost !p-2" aria-label="Save">
                <Icon name="bookmark" size={18} />
              </button>
              <button className="btn-ghost !p-2" aria-label="Share">
                <Icon name="share" size={18} />
              </button>
            </div>
          </div>

          <div className="prose-invert mt-4 space-y-4 text-[15px] leading-relaxed text-fg/90">
            {article.body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {article.sources.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border/60 bg-elevated/40 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Icon name="news" size={15} /> Sources
              </h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {article.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} className="link inline-flex items-center gap-1" rel="noopener noreferrer" target="_blank">
                      <Icon name="globe" size={13} /> {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              {article.references.length > 0 && (
                <>
                  <h4 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">References</h4>
                  <ul className="list-inside list-disc text-xs text-muted">
                    {article.references.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-muted">
            <span>{compact(article.metrics.views)} views</span>
            <span>{compact(article.metrics.comments)} comments</span>
            <span>{compact(article.metrics.saves)} saves</span>
          </div>
        </div>
      </article>
    </div>
  );
}
