'use client';
import { useGame } from '@/hooks/useGame';
import { num, euro } from '@/lib/format';

export default function StatusRow() {
  const { state, balance } = useGame();
  const holders = state?.holders ?? 0;

  return (
    <div className="statusrow">
      {/* live players still in this round (number only) */}
      <div className="holding">
        <span className="dot" />
        <b>{num(holders)}</b>
      </div>

      {/* balance */}
      <div className="balance">
        {euro(balance)}
        <span className="plus" aria-label="Deposit">+</span>
      </div>
    </div>
  );
}
