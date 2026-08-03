'use client';

import React from 'react';
import { useSlot } from '@/hooks/useSlot';
import { PAYTABLE, SYMBOLS, type SymbolId } from '@/game/config';
import { SymbolTile } from './SymbolTile';

// Paytable + rules sheet. Payouts are shown as × line bet (3/4/5 of a kind),
// exactly as the engine pays. Feature symbols get their own explanation.
export function Paytable({ onClose }: { onClose: () => void }) {
  const { theme, session } = useSlot();
  const order: SymbolId[] = ['HERO_F', 'HERO_M', 'GEM', 'PLANET', 'ORB_B', 'ORB_O', 'A', 'K', 'Q', 'J'];

  return (
    <div className="qs-modal-scrim" onClick={onClose}>
      <div className="qs-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qs-modal-close" onClick={onClose}>×</button>
        <h3>Paytable</h3>
        <p className="qs-mono" style={{ marginTop: -6, marginBottom: 12 }}>
          RTP {session ? (Number(session.rtpBand) ).toFixed(0) : '96'}% · 25 lines · pays left→right · wins × bet per line
        </p>

        <div className="qs-paytable-grid">
          {order.map((id) => (
            <div className="qs-pt-row" key={id}>
              <div className="qs-pt-sym"><SymbolTile id={id} theme={theme} /></div>
              <div className="qs-pt-pays">
                <div><b>×5</b> {PAYTABLE[id][2]}</div>
                <div><b>×4</b> {PAYTABLE[id][1]}</div>
                <div><b>×3</b> {PAYTABLE[id][0]}</div>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 18 }}>Features</h3>
        <Feature theme={theme} id="WILD" title="Quantum Wild"
          text="Substitutes for every paying symbol (not the Portal). Richer on the middle reels." />
        <Feature theme={theme} id="SCATTER" title="Quantum Portal — Free Spins"
          text="3 / 4 / 5 Portals pay 1× / 5× / 20× total bet and award 8 / 12 / 15 free spins. The multiplier ladder runs hotter during the feature and Portals retrigger it." />
        <div className="qs-pt-row" style={{ marginTop: 8 }}>
          <div className="qs-pt-pays" style={{ fontSize: 12 }}>
            <b>Quantum Reactor tumbles</b> — winning symbols detonate, survivors fall and refill.
            Each tumble climbs the multiplier ladder ({theme.copy.featureName} runs 2× → 12×).
          </div>
        </div>
        <div className="qs-pt-row" style={{ marginTop: 8 }}>
          <div className="qs-pt-pays" style={{ fontSize: 12 }}>
            <b>Quantum Vault jackpots</b> — a mystery roll on any paid spin can award MINI, MINOR,
            MAJOR or GRAND. Bigger bets improve the odds. Pools grow with every bet across all players.
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ theme, id, title, text }: { theme: ReturnType<typeof useSlot>['theme']; id: SymbolId; title: string; text: string }) {
  return (
    <div className="qs-pt-row" style={{ marginTop: 8 }}>
      <div className="qs-pt-sym"><SymbolTile id={id} theme={theme} /></div>
      <div className="qs-pt-pays" style={{ fontSize: 12 }}>
        <b>{title}</b>
        <div>{text}</div>
      </div>
    </div>
  );
}
