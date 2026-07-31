import Link from 'next/link';
import type { Metadata } from 'next';
import { listNotifications, getUser } from '@/lib/db';
import { Avatar } from '@/components/ui/Primitives';
import { Icon, type IconName } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/format';
import type { NotificationKind } from '@/lib/types';

export const metadata: Metadata = { title: 'Notifications' };

const kindIcon: Record<NotificationKind, IconName> = {
  like: 'heart',
  comment: 'comment',
  mention: 'user',
  'community-invite': 'users',
  'event-reminder': 'calendar',
  'help-request': 'hand',
  moderator: 'shield',
};

const kindColor: Record<NotificationKind, string> = {
  like: 'bg-danger/15 text-danger',
  comment: 'bg-brand/15 text-brand-soft',
  mention: 'bg-accent/15 text-accent',
  'community-invite': 'bg-brand/15 text-brand-soft',
  'event-reminder': 'bg-warning/15 text-warning',
  'help-request': 'bg-success/15 text-success',
  moderator: 'bg-danger/15 text-danger',
};

export default function NotificationsPage() {
  const notifications = listNotifications();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <button className="text-sm text-muted hover:text-fg">Mark all read</button>
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map((n) => {
          const actor = n.actorId ? getUser(n.actorId) : undefined;
          return (
            <Link
              key={n.id}
              href={n.href}
              className={`card flex items-center gap-3 p-3.5 transition hover:shadow-glow ${
                n.read ? '' : 'ring-1 ring-brand/30'
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${kindColor[n.kind]}`}>
                <Icon name={kindIcon[n.kind]} size={18} />
              </span>
              {actor && <Avatar src={actor.avatar} name={actor.name} size={34} />}
              <p className="flex-1 text-sm">{n.text}</p>
              <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span>
              {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
