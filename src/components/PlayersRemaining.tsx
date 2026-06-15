'use client';
import { useGame } from '@/hooks/useGame';
import { num } from '@/lib/format';

export default function PlayersRemaining() {
  const { state } = useGame();
  const tl = state?.holdersTimeline ?? [];
  const crashed = state?.phase === 'crashed';

  return (
    <div className="timeline">
      <div className="head">⏳ PLAYERS REMAINING</div>
      <div className="track">
        {tl.length === 0 && <span className="node">—</span>}
        {tl.map((n, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="arrow">›</span>}
            <span className="node">{n === 0 ? '' : num(n)}</span>
          </span>
        ))}
        {crashed && (
          <span className="crash">🚨 CRASH</span>
        )}
      </div>
    </div>
  );
}
