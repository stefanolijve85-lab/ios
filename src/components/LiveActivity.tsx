'use client';
import { useGame } from '@/hooks/useGame';
import { euro } from '@/lib/format';

function ago(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 2) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export default function LiveActivity() {
  const { activity } = useGame();
  return (
    <div className="panel">
      <h3>LIVE ACTIVITY ⚡</h3>
      <div className="act-list">
        {activity.map((a, i) => (
          <div key={`${a.ts}-${i}`} className={`act ${a.kind === 'stash' ? 'win' : 'lose'}`}>
            <div className="ava">{a.kind === 'stash' ? '▲' : '▼'}</div>
            <div className="body">
              <div>
                <span className="nm">{a.name}</span>{' '}
                {a.kind === 'stash' ? (
                  <>secured <span className="amt">{euro(a.amount)}</span></>
                ) : (
                  <>lost <span className="amt">{euro(a.amount)}</span></>
                )}
              </div>
              <div className="sub">
                {a.kind === 'stash' && a.multiplier ? `@ ${a.multiplier.toFixed(2)}x · ` : 'waited too long · '}
                {ago(a.ts)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
