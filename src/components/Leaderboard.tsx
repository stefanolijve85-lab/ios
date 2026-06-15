'use client';
import { useGame } from '@/hooks/useGame';
import { useTheme } from '@/hooks/useTheme';
import { euro } from '@/lib/format';

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const { leaderboard } = useGame();
  const theme = useTheme();

  return (
    <div className="fair-scrim" onClick={onClose}>
      <div className="fair-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fair-head">
          <span>🏆 TOP {theme.copy.securedVerb.toUpperCase()}</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <p className="fair-intro">Biggest wins in the live session.</p>

        {leaderboard.length === 0 ? (
          <div className="fair-block fair-wait">No wins yet — be the first.</div>
        ) : (
          <div className="lb-list">
            {leaderboard.map((e, i) => (
              <div key={`${e.ts}-${i}`} className={`lb-row${e.name === 'You' ? ' me' : ''}`}>
                <span className="lb-rank">{i + 1}</span>
                <span className="lb-name">{e.name}</span>
                <span className="lb-mult">{e.multiplier ? `${e.multiplier.toFixed(2)}x` : ''}</span>
                <span className="lb-amt">{euro(e.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
