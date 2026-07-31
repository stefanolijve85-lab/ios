import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { listEvents, getUser } from '@/lib/db';
import { Icon } from '@/components/ui/Icon';
import { formatDate, formatTime, timeUntil } from '@/lib/format';
import type { EventKind } from '@/lib/types';

export const metadata: Metadata = { title: 'Events' };

const kindStyle: Record<EventKind, { label: string; cls: string }> = {
  meetup: { label: 'Meetup', cls: 'text-accent border-accent/40 bg-accent/10' },
  'public-meeting': { label: 'Public meeting', cls: 'text-brand-soft border-brand/40 bg-brand/10' },
  volunteer: { label: 'Volunteer', cls: 'text-success border-success/40 bg-success/10' },
  workshop: { label: 'Workshop', cls: 'text-warning border-warning/40 bg-warning/10' },
  rally: { label: 'Rally', cls: 'text-danger border-danger/40 bg-danger/10' },
};

export default function EventsPage() {
  const events = listEvents();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted">Meetups, public meetings and volunteer actions near you.</p>
        </div>
        <button className="btn-primary">
          <Icon name="plus" size={16} /> Create event
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((e) => {
          const host = getUser(e.hostId)!;
          const k = kindStyle[e.kind];
          return (
            <Link key={e.id} href={`/events/${e.id}`} className="card group overflow-hidden hover:shadow-glow">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image src={e.cover} alt="" fill className="object-cover transition group-hover:scale-105" unoptimized sizes="(max-width:640px) 100vw, 400px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${k.cls} backdrop-blur`}>
                  {k.label}
                </span>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div className="rounded-xl bg-surface/80 px-3 py-1.5 text-center backdrop-blur">
                    <p className="text-[10px] uppercase text-muted">{formatDate(e.startsAt).split(' ')[0]}</p>
                    <p className="text-lg font-bold leading-none">{new Date(e.startsAt).getDate()}</p>
                  </div>
                  <span className="chip !bg-black/40 !text-white backdrop-blur">{timeUntil(e.startsAt)}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{e.title}</h3>
                <div className="mt-2 flex flex-col gap-1 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" size={13} /> {formatDate(e.startsAt)} · {formatTime(e.startsAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="pin" size={13} /> {e.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon name="user" size={13} /> Hosted by {host.name}
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
