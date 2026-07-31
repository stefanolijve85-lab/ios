import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { FactCheck, Role } from '@/lib/types';
import { initials } from '@/lib/format';

export function Avatar({
  src,
  name,
  size = 40,
  ring = false,
}: {
  src: string;
  name: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-xs font-semibold text-muted ${
        ring ? 'ring-2 ring-brand/50' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        unoptimized
      />
      <span className="sr-only">{name || initials(name)}</span>
    </span>
  );
}

export function VerifiedTick({ size = 15 }: { size?: number }) {
  return (
    <span className="inline-flex text-accent" title="Verified">
      <Icon name="verified" size={size} filled />
    </span>
  );
}

const roleStyle: Record<Role, string> = {
  visitor: 'text-muted border-border',
  member: 'text-muted border-border',
  volunteer: 'text-success border-success/40 bg-success/10',
  moderator: 'text-accent border-accent/40 bg-accent/10',
  editor: 'text-brand-soft border-brand/40 bg-brand/10',
  administrator: 'text-warning border-warning/40 bg-warning/10',
  super_admin: 'text-danger border-danger/40 bg-danger/10',
};

const roleLabel: Record<Role, string> = {
  visitor: 'Visitor',
  member: 'Member',
  volunteer: 'Volunteer',
  moderator: 'Moderator',
  editor: 'Editor',
  administrator: 'Admin',
  super_admin: 'Super Admin',
};

export function RoleBadge({ role }: { role: Role }) {
  if (role === 'member' || role === 'visitor') return null;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleStyle[role]}`}>
      {roleLabel[role]}
    </span>
  );
}

const factStyle: Record<FactCheck, { label: string; cls: string; icon: Parameters<typeof Icon>[0]['name'] }> = {
  verified: { label: 'Verified', cls: 'text-success border-success/40 bg-success/10', icon: 'check' },
  context: { label: 'Added context', cls: 'text-warning border-warning/40 bg-warning/10', icon: 'flag' },
  disputed: { label: 'Disputed', cls: 'text-danger border-danger/40 bg-danger/10', icon: 'flag' },
  unverified: { label: 'Unverified', cls: 'text-muted border-border', icon: 'clock' },
};

export function FactCheckBadge({ status }: { status: FactCheck }) {
  const s = factStyle[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      <Icon name={s.icon} size={12} /> {s.label}
    </span>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}

export function TagLink({ tag }: { tag: string }) {
  return (
    <Link href={`/search?q=%23${encodeURIComponent(tag)}`} className="chip hover:text-fg">
      #{tag}
    </Link>
  );
}

export function SectionTitle({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: Parameters<typeof Icon>[0]['name'];
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        {icon && <Icon name={icon} size={18} />}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 p-10 text-center">
      <Icon name="sparkles" size={26} className="text-muted" />
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
