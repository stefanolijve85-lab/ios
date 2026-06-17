'use client';
import { useGame } from '@/hooks/useGame';
import { euro } from '@/lib/format';

// Periodic "you've been playing for a while" nudge — a regulator-standard
// reality check. Fires when the server emits `reality_check` (driven by the
// player's RG_REALITY_CHECK_MS limit). Shows live session stats and an easy way
// to take a break.
export default function RealityCheck() {
  const { realityCheck, dismissRealityCheck, selfExclude } = useGame();
  if (!realityCheck) return null;

  const mins = Math.max(1, Math.round(realityCheck.elapsedMs / 60000));
  const net = realityCheck.netMinor / 100; // +profit / −loss
  const up = net >= 0;

  return (
    <div className="rc-scrim" onClick={dismissRealityCheck}>
      <div className="rc-card" onClick={(e) => e.stopPropagation()}>
        <div className="rc-title">⏱ REALITY CHECK</div>
        <p className="rc-lead">
          You&apos;ve been playing for <b>{mins} minute{mins === 1 ? '' : 's'}</b>.
        </p>
        <div className="rc-stats">
          <div className="rc-stat"><span>Bets placed</span><b>{realityCheck.bets}</b></div>
          <div className="rc-stat"><span>Total staked</span><b>{euro(realityCheck.wagerMinor / 100)}</b></div>
          <div className="rc-stat">
            <span>Net result</span>
            <b className={up ? 'up' : 'down'}>{up ? '+' : '−'}{euro(Math.abs(net))}</b>
          </div>
        </div>
        <p className="rc-note">Take a break whenever you want. Set the pace that&apos;s right for you.</p>
        <div className="rc-actions">
          <button className="rc-btn ghost" onClick={() => { selfExclude(60 * 60 * 1000); dismissRealityCheck(); }}>
            TAKE A 1H BREAK
          </button>
          <button className="rc-btn primary" onClick={dismissRealityCheck}>KEEP PLAYING</button>
        </div>
      </div>
    </div>
  );
}
