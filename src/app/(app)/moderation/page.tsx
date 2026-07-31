import Link from 'next/link';
import type { Metadata } from 'next';
import { listReports, listAudit, getUser, getPost } from '@/lib/db';
import { Avatar } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/format';
import type { ReportStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Moderation' };

const statusStyle: Record<ReportStatus, string> = {
  open: 'text-warning bg-warning/10 border-warning/40',
  reviewing: 'text-accent bg-accent/10 border-accent/40',
  actioned: 'text-danger bg-danger/10 border-danger/40',
  dismissed: 'text-muted bg-elevated border-border',
};

export default function ModerationPage() {
  const reports = listReports();
  const audit = listAudit();
  const open = reports.filter((r) => r.status === 'open' || r.status === 'reviewing').length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Icon name="shield" size={22} /> Moderation
        </h1>
        <p className="text-sm text-muted">Keep the community safe, civil and lawful. Every action is logged.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open reports" value={open} tone="warning" />
        <Stat label="Actioned (7d)" value={4} tone="danger" />
        <Stat label="Avg. response" value="1.4h" tone="accent" />
        <Stat label="Auto-flagged" value={12} tone="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <h2 className="mb-3 text-sm font-semibold">Review queue</h2>
          <div className="flex flex-col gap-3">
            {reports.map((r) => {
              const reporter = getUser(r.reporterId);
              const post = r.targetType === 'post' ? getPost(r.targetId) : undefined;
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="chip capitalize">{r.targetType}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{r.reason}</p>
                  {r.details && <p className="text-sm text-muted">{r.details}</p>}
                  {post && (
                    <Link href={`/post/${post.id}`} className="mt-2 block rounded-lg bg-elevated/50 p-2 text-xs text-muted hover:text-fg">
                      “{post.headline}”
                    </Link>
                  )}

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                      <span>Spam likelihood (AI-assisted)</span>
                      <span>{Math.round(r.spamScore * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.spamScore * 100}%`,
                          backgroundColor: r.spamScore > 0.5 ? 'rgb(var(--danger))' : 'rgb(var(--warning))',
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      {reporter && <Avatar src={reporter.avatar} name={reporter.name} size={20} />}
                      Reported by {reporter?.name.split(' ')[0]} · {timeAgo(r.createdAt)}
                    </span>
                    <div className="flex gap-1">
                      <button className="btn-ghost !px-2.5 !py-1.5 !text-xs text-success">Dismiss</button>
                      <button className="btn-ghost !px-2.5 !py-1.5 !text-xs text-warning">Warn</button>
                      <button className="btn-ghost !px-2.5 !py-1.5 !text-xs text-danger">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside>
          <h2 className="mb-3 text-sm font-semibold">Audit log</h2>
          <div className="card flex flex-col gap-3 p-4">
            {audit.map((a) => {
              const actor = getUser(a.actorId);
              return (
                <div key={a.id} className="flex items-start gap-2.5 text-xs">
                  {actor && <Avatar src={actor.avatar} name={actor.name} size={26} />}
                  <div>
                    <p>
                      <b>{actor?.name.split(' ')[0]}</b> {a.action} <span className="text-muted">({a.target})</span>
                    </p>
                    <p className="text-muted">{timeAgo(a.createdAt)} ago</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card mt-4 p-4 text-xs text-muted">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-fg">
              <Icon name="sparkles" size={13} /> AI assists, humans decide
            </p>
            Spam scores and duplicate detection are suggestions only. A moderator makes every final call, and members
            can appeal any decision.
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const toneCls: Record<string, string> = {
    warning: 'text-warning',
    danger: 'text-danger',
    accent: 'text-accent',
    brand: 'text-brand-soft',
  };
  return (
    <div className="card p-4">
      <p className={`text-2xl font-bold ${toneCls[tone]}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
