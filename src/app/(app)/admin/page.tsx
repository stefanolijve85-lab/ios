import Link from 'next/link';
import type { Metadata } from 'next';
import { listUsers, listFeatureFlags, listReports } from '@/lib/db';
import { LineChart, BarChart } from '@/components/Charts';
import { FeatureFlags } from '@/components/FeatureFlags';
import { Avatar, RoleBadge, VerifiedTick } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { compact } from '@/lib/format';

export const metadata: Metadata = { title: 'Admin' };

// Deterministic demo analytics.
const dau = [820, 910, 880, 1040, 1220, 1180, 1350, 1420, 1610, 1580, 1720, 1890, 2010, 2140];
const growth = [120, 160, 140, 210, 260, 240, 310];
const retention = [100, 68, 52, 44, 40, 37, 35];

export default function AdminPage() {
  const users = listUsers();
  const flags = listFeatureFlags();
  const openReports = listReports().filter((r) => r.status === 'open').length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Icon name="settings" size={22} /> Admin panel
        </h1>
        <p className="text-sm text-muted">Platform health, people, and configuration.</p>
      </div>

      {/* KPI tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Daily active users" value={compact(2140)} delta="+11%" />
        <Kpi label="Total members" value={compact(28940)} delta="+4.2%" />
        <Kpi label="Communities" value="42" delta="+3" />
        <Kpi label="Open reports" value={String(openReports)} delta="triage" tone="warning" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <p className="mb-1 text-sm font-semibold">Daily active users</p>
          <p className="mb-2 text-xs text-muted">Last 14 days</p>
          <LineChart data={dau} />
        </div>
        <div className="card p-4">
          <p className="mb-1 text-sm font-semibold">New members / week</p>
          <p className="mb-2 text-xs text-muted">Last 7 weeks</p>
          <BarChart data={growth} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']} />
        </div>
        <div className="card p-4">
          <p className="mb-1 text-sm font-semibold">Retention</p>
          <p className="mb-2 text-xs text-muted">Cohort, by day</p>
          <BarChart data={retention} labels={['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6']} color="rgb(var(--success))" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* User management */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <h2 className="text-sm font-semibold">User management</h2>
            <span className="text-xs text-muted">{users.length} shown</span>
          </div>
          <div className="divide-y divide-border/50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3">
                <Avatar src={u.avatar} name={u.name} size={38} />
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${u.handle}`} className="flex items-center gap-1 text-sm font-medium hover:underline">
                    {u.name} {u.verified && <VerifiedTick size={12} />}
                  </Link>
                  <p className="text-xs text-muted">@{u.handle} · {compact(u.stats.followers)} followers</p>
                </div>
                <RoleBadge role={u.role} />
                <button className="btn-ghost !px-2.5 !py-1.5 !text-xs">Manage</button>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Icon name="sparkles" size={15} /> Feature flags
            </h2>
            <FeatureFlags flags={flags} />
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">Quick actions</h2>
            <div className="flex flex-col gap-2 text-sm">
              <button className="btn-outline justify-start">
                <Icon name="bell" size={16} /> Post announcement
              </button>
              <button className="btn-outline justify-start">
                <Icon name="verified" size={16} /> Review verification requests
              </button>
              <Link href="/moderation" className="btn-outline justify-start">
                <Icon name="shield" size={16} /> Open moderation queue
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-2 text-sm font-semibold">Roles</h2>
            <div className="flex flex-wrap gap-1.5">
              {(['Visitor', 'Member', 'Volunteer', 'Moderator', 'Editor', 'Administrator', 'Super Admin'] as const).map(
                (r) => (
                  <span key={r} className="chip">
                    {r}
                  </span>
                ),
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, tone }: { label: string; value: string; delta: string; tone?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <span className={`text-xs font-medium ${tone === 'warning' ? 'text-warning' : 'text-success'}`}>{delta}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
