'use client';

import { useApp } from '@/context/AppProvider';
import { Icon } from '@/components/ui/Icon';

export function RsvpButton({ eventId, baseCount }: { eventId: string; baseCount: number }) {
  const { rsvped, toggleRsvp } = useApp();
  const going = rsvped.has(eventId);
  const count = baseCount + (going ? 1 : 0);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggleRsvp(eventId)}
        className={going ? 'btn-primary' : 'btn-outline'}
        aria-pressed={going}
      >
        <Icon name={going ? 'check' : 'calendar'} size={16} />
        {going ? 'Going' : 'RSVP'}
      </button>
      <span className="text-sm text-muted">{count} attending</span>
    </div>
  );
}
