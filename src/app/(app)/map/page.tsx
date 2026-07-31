'use client';

import { useMemo, useState } from 'react';
import { listMapMarkers } from '@/lib/db';
import { StaticMap, markerStyle } from '@/components/StaticMap';
import { Icon } from '@/components/ui/Icon';
import type { MapMarkerKind } from '@/lib/types';

const ALL = listMapMarkers();
const KINDS = Object.keys(markerStyle) as MapMarkerKind[];

export default function MapPage() {
  const [active, setActive] = useState<Set<MapMarkerKind>>(new Set(KINDS));
  const [query, setQuery] = useState('');

  const markers = useMemo(
    () =>
      ALL.filter((m) => active.has(m.kind)).filter((m) =>
        query ? m.title.toLowerCase().includes(query.toLowerCase()) : true,
      ),
    [active, query],
  );

  const toggle = (k: MapMarkerKind) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Map</h1>
          <p className="text-sm text-muted">Volunteer groups, meetups, public meetings and help requests near you.</p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Search the map…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => {
          const s = markerStyle[k];
          const on = active.has(k);
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on ? 'text-fg' : 'text-muted opacity-60'
              }`}
              style={{ borderColor: on ? s.color : 'rgb(var(--border))' }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <StaticMap markers={markers} height={460} />

        <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{markers.length} results</p>
          {markers.map((m) => {
            const s = markerStyle[m.kind];
            return (
              <div key={m.id} className="card flex items-center gap-3 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ backgroundColor: s.color }}>
                  <Icon name={s.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
