'use client';
import { useState } from 'react';
import { useGame } from '@/hooks/useGame';

// Player-facing responsible-gaming controls: set your own limits (you can only
// make them stricter than the operator's) and take a break / self-exclude.
// Money fields are euros (→ minor units on submit); times are minutes.
const toMinor = (eur: string) => Math.max(0, Math.round((parseFloat(eur) || 0) * 100));
const toMs = (min: string) => Math.max(0, Math.round((parseFloat(min) || 0) * 60000));
const eurOf = (minor: number) => (minor > 0 ? String(minor / 100) : '');
const minOf = (ms: number) => (ms > 0 ? String(Math.round(ms / 60000)) : '');

const BREAKS: [string, number][] = [
  ['24 hours', 24 * 60 * 60 * 1000],
  ['7 days', 7 * 24 * 60 * 60 * 1000],
  ['30 days', 30 * 24 * 60 * 60 * 1000],
  ['Permanent', 0],
];

export default function ResponsibleGaming({ onClose }: { onClose: () => void }) {
  const { rgLimits, setLimits, selfExclude } = useGame();
  const [stake, setStake] = useState(eurOf(rgLimits?.stakeMaxMinor ?? 0));
  const [loss, setLoss] = useState(eurOf(rgLimits?.sessionLossMaxMinor ?? 0));
  const [time, setTime] = useState(minOf(rgLimits?.sessionTimeMaxMs ?? 0));
  const [reality, setReality] = useState(minOf(rgLimits?.realityCheckMs ?? 0));
  const [saved, setSaved] = useState(false);
  const [confirmBreak, setConfirmBreak] = useState<number | null>(null);

  const apply = () => {
    setLimits({
      stakeMaxMinor: toMinor(stake),
      sessionLossMaxMinor: toMinor(loss),
      sessionTimeMaxMs: toMs(time),
      realityCheckMs: toMs(reality),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="rg-scrim" onClick={onClose}>
      <div className="rg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rg-head">
          <span>🛡 RESPONSIBLE GAMING</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <p className="rg-intro">
          Stay in control. Set your own limits — you can always make them stricter.
          Leave a field empty for no limit.
        </p>

        <div className="rg-section">MY LIMITS</div>
        <label className="rg-field">
          <span>Max stake per bet</span>
          <div className="rg-input"><i>€</i><input type="number" min={0} inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="none" /></div>
        </label>
        <label className="rg-field">
          <span>Max loss per session</span>
          <div className="rg-input"><i>€</i><input type="number" min={0} inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} placeholder="none" /></div>
        </label>
        <label className="rg-field">
          <span>Session time limit</span>
          <div className="rg-input"><input type="number" min={0} inputMode="numeric" value={time} onChange={(e) => setTime(e.target.value)} placeholder="none" /><i>min</i></div>
        </label>
        <label className="rg-field">
          <span>Remind me every</span>
          <div className="rg-input"><input type="number" min={0} inputMode="numeric" value={reality} onChange={(e) => setReality(e.target.value)} placeholder="off" /><i>min</i></div>
        </label>

        <button className="rg-apply" onClick={apply}>{saved ? 'SAVED ✓' : 'SAVE LIMITS'}</button>

        <div className="rg-section">TAKE A BREAK</div>
        <p className="rg-intro small">Pause play. You won&apos;t be able to bet until the break ends.</p>
        {confirmBreak === null ? (
          <div className="rg-breaks">
            {BREAKS.map(([label, ms]) => (
              <button key={label} className="rg-break" onClick={() => setConfirmBreak(ms)}>{label}</button>
            ))}
          </div>
        ) : (
          <div className="rg-confirm">
            <p>{confirmBreak === 0 ? 'Self-exclude permanently?' : 'Start this break now?'} This can&apos;t be undone early.</p>
            <div className="rg-confirm-actions">
              <button className="rg-break ghost" onClick={() => setConfirmBreak(null)}>CANCEL</button>
              <button className="rg-break danger" onClick={() => { selfExclude(confirmBreak); onClose(); }}>CONFIRM</button>
            </div>
          </div>
        )}

        <div className="rg-foot">Support: <b>begambleaware.org</b> · 18+ · Play responsibly.</div>
      </div>
    </div>
  );
}
