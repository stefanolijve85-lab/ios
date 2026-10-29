'use client';

import { Room } from '@/lib/types';

// Eén regel in een importlijst: naam + type, en óf "✓ kamer" (al toegevoegd)
// óf een kamerkeuze met +knop.
export default function ImportRow({
  emoji, name, sub, rooms, existingRoom, room, onRoom, onAdd,
}: {
  emoji: string;
  name: string;
  sub: string;
  rooms: Room[];
  existingRoom?: string | null;
  room: string;
  onRoom: (roomId: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="item" style={{ gap: 10 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="k" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {emoji} {name}
        </div>
        <div className="v" style={{ fontSize: 13 }}>{sub}</div>
      </div>
      {existingRoom !== undefined ? (
        <span className="v" style={{ fontSize: 13, color: '#30d158', whiteSpace: 'nowrap' }}>✓ {existingRoom || 'Toegevoegd'}</span>
      ) : (
        <>
          <select
            className="v"
            style={{ background: 'transparent', maxWidth: 120 }}
            value={room}
            onChange={(e) => onRoom(e.target.value)}
            aria-label={`Kamer voor ${name}`}
          >
            {rooms.map((r) => <option key={r.id} value={r.id} style={{ background: '#1c1c1e' }}>{r.name}</option>)}
          </select>
          <button
            onClick={onAdd}
            aria-label={`${name} toevoegen`}
            style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent)', color: '#fff', fontSize: 22, lineHeight: '32px', flexShrink: 0 }}
          >+</button>
        </>
      )}
    </div>
  );
}

// Raadt een kamer op basis van de apparaatnaam; je kunt hem altijd wijzigen.
const ROOM_HINTS: [RegExp, string][] = [
  [/tuin|buiten|terras|kerst|rookhok|schuur|vijver|veranda|oprit/i, 'tuin'],
  [/bad|douche|nis|toilet|wc/i, 'badkamer'],
  [/keuken|kook|werkblad/i, 'keuken'],
  [/slaap|bed|nacht/i, 'slaapkamer'],
  [/woon|tv|bank|eettafel|lounge/i, 'woonkamer'],
];

export function guessRoom(name: string, rooms: Room[]): string {
  for (const [re, id] of ROOM_HINTS) if (re.test(name) && rooms.some((r) => r.id === id)) return id;
  return rooms[0]?.id || '';
}
