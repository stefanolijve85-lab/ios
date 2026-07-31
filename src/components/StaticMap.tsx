import { Icon, type IconName } from '@/components/ui/Icon';
import type { MapMarker, MapMarkerKind } from '@/lib/types';

// A self-contained, dependency-free "map": we project marker lat/lng onto a
// styled grid so the demo needs no tile provider or API key. Swap for MapLibre /
// Mapbox in production — the marker model is already geo-accurate.

export const markerStyle: Record<MapMarkerKind, { color: string; icon: IconName; label: string }> = {
  volunteer: { color: 'rgb(var(--success))', icon: 'hand', label: 'Volunteer' },
  meetup: { color: 'rgb(var(--accent))', icon: 'users', label: 'Meetup' },
  'public-meeting': { color: 'rgb(var(--brand))', icon: 'calendar', label: 'Public meeting' },
  initiative: { color: 'rgb(var(--warning))', icon: 'sparkles', label: 'Initiative' },
  help: { color: 'rgb(var(--brand-soft))', icon: 'flag', label: 'Help request' },
  completed: { color: 'rgb(var(--muted))', icon: 'check', label: 'Completed' },
};

function project(markers: MapMarker[]) {
  const lats = markers.map((m) => m.location.lat);
  const lngs = markers.map((m) => m.location.lng);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  const padLat = (maxLat - minLat) * 0.25 || 0.01;
  const padLng = (maxLng - minLng) * 0.25 || 0.01;
  const lat0 = minLat - padLat,
    lat1 = maxLat + padLat;
  const lng0 = minLng - padLng,
    lng1 = maxLng + padLng;
  return markers.map((m) => ({
    marker: m,
    x: ((m.location.lng - lng0) / (lng1 - lng0)) * 100,
    y: (1 - (m.location.lat - lat0) / (lat1 - lat0)) * 100,
  }));
}

export function StaticMap({ markers, height = 420 }: { markers: MapMarker[]; height?: number }) {
  const points = markers.length ? project(markers) : [];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border/60"
      style={{ height }}
    >
      {/* stylized terrain */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgb(var(--brand)/0.12),transparent_50%),radial-gradient(120%_120%_at_90%_90%,rgb(var(--accent)/0.10),transparent_50%)] bg-elevated/40" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden>
        <defs>
          <pattern id="grid" width="8%" height="8%" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgb(var(--border))" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* a couple of faux "roads" for texture */}
        <path d="M -10 60 Q 40 40 110 70" stroke="rgb(var(--border))" strokeWidth="6" fill="none" opacity="0.5" />
        <path d="M 30 -10 Q 55 50 40 110" stroke="rgb(var(--border))" strokeWidth="5" fill="none" opacity="0.4" />
      </svg>

      {points.map(({ marker, x, y }) => {
        const s = markerStyle[marker.kind];
        return (
          <div
            key={marker.id}
            className="group absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="grid h-8 w-8 place-items-center rounded-full text-white shadow-glass ring-2 ring-white/20 transition group-hover:scale-110"
              style={{ backgroundColor: s.color }}
            >
              <Icon name={s.icon} size={16} />
            </div>
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface/95 px-2 py-1 text-[11px] font-medium opacity-0 shadow-glass backdrop-blur transition group-hover:opacity-100">
              {marker.title}
            </div>
          </div>
        );
      })}

      {points.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted">No results on the map</div>
      )}
    </div>
  );
}
