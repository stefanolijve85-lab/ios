import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEvent, getUser, getCommunity } from '@/lib/db';
import { RsvpButton } from '@/components/RsvpButton';
import { Avatar } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { formatDate, formatTime } from '@/lib/format';
import { StaticMap } from '@/components/StaticMap';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = getEvent(id);
  return { title: e ? e.title : 'Event' };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = getEvent(id);
  if (!event) notFound();
  const host = getUser(event.hostId)!;
  const community = event.communityId ? getCommunity(event.communityId) : undefined;
  const attendees = event.rsvps.map((uid) => getUser(uid)).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/events" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <Icon name="chevron" size={16} className="rotate-180" /> All events
      </Link>

      <div className="card overflow-hidden">
        <div className="relative aspect-[21/9] w-full">
          <Image src={event.cover} alt="" fill className="object-cover" unoptimized sizes="100vw" priority />
        </div>
        <div className="p-5">
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          {community && (
            <Link href={`/c/${community.slug}`} className="mt-1 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
              {community.icon} {community.name}
            </Link>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoRow icon="calendar" title={formatDate(event.startsAt)} sub={`${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`} />
            <InfoRow icon="pin" title={event.venue} sub={event.location.label ?? 'Map available below'} />
            <InfoRow icon="user" title={`Hosted by ${host.name}`} sub={`@${host.handle}`} />
            <InfoRow icon="users" title={`${event.rsvps.length} / ${event.capacity} spots`} sub="RSVP to reserve" />
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-fg/90">{event.description}</p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <RsvpButton eventId={event.id} baseCount={event.rsvps.length} />
            <div className="flex gap-1">
              <button className="btn-ghost !p-2" aria-label="Add to calendar" title="Add to calendar">
                <Icon name="calendar" size={18} />
              </button>
              <button className="btn-ghost !p-2" aria-label="Get QR ticket" title="QR ticket">
                <Icon name="check" size={18} />
              </button>
              <button className="btn-ghost !p-2" aria-label="Share">
                <Icon name="share" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">Location</h3>
          <StaticMap markers={[{ id: event.id, kind: 'meetup', title: event.venue, location: event.location }]} height={180} />
        </div>
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold">Who’s going</h3>
          <div className="flex flex-wrap gap-2">
            {attendees.map(
              (a) =>
                a && (
                  <Link key={a.id} href={`/u/${a.handle}`} title={a.name}>
                    <Avatar src={a.avatar} name={a.name} size={40} />
                  </Link>
                ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  sub,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-elevated/40 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-soft">
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted">{sub}</p>
      </div>
    </div>
  );
}
