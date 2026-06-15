'use client';
import { useGame } from '@/hooks/useGame';

// Recent results bar — the row of small colour-coded "balloons" showing the last
// crash multipliers (red = busted low, green = solid, gold = big). Shared engine
// feature, so every game gets it.
export default function HistoryBar() {
  const { state } = useGame();
  const h = state?.history ?? [];
  if (!h.length) return null;
  return (
    <div className="histbar">
      {h.map((m, i) => (
        <span key={i} className={`hist ${m < 2 ? 'lo' : m >= 10 ? 'hi' : 'mid'}`}>
          {m.toFixed(2)}x
        </span>
      ))}
    </div>
  );
}
