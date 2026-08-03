'use client';

import React, { useState } from 'react';
import { useSlot } from '@/hooks/useSlot';
import { Background } from './Background';
import { TopBar } from './TopBar';
import { JackpotRail } from './JackpotRail';
import { MultiplierBadge } from './MultiplierBadge';
import { Reels } from './Reels';
import { WinRow } from './WinRow';
import { BetBar } from './BetBar';
import { Controls } from './Controls';
import { BottomNav } from './BottomNav';
import { EventOverlay } from './EventOverlay';
import { Paytable } from './Paytable';
import { MenuSheet } from './MenuSheet';
import { PanelSheet } from './PanelSheet';

// Top-level layout for QUANTUM SPIN. Sets the theme CSS variables on the root,
// composes the HUD → reels → controls → nav stack, and hosts the overlays and
// sheets. Mobile-first; centres within a phone-width viewport on desktop.
export function GameShell() {
  const { ready, theme, credit } = useSlot();
  const [sheet, setSheet] = useState<null | string>(null);
  const [tab, setTab] = useState('lobby');

  const rootStyle = {
    ['--qs-bg-top' as string]: theme.colors.bgTop,
    ['--qs-bg-bottom' as string]: theme.colors.bgBottom,
    ['--qs-neon' as string]: theme.colors.neon,
    ['--qs-neon2' as string]: theme.colors.neon2,
    ['--qs-gold' as string]: theme.colors.gold,
    ['--qs-panel' as string]: theme.colors.panel,
    ['--qs-panel-border' as string]: theme.colors.panelBorder,
    ['--qs-text' as string]: theme.colors.text,
    ['--qs-text-dim' as string]: theme.colors.textDim,
  } as React.CSSProperties;

  const onNav = (k: string) => {
    setTab(k);
    if (k === 'lobby') setSheet(null);
    else setSheet(k);
  };

  return (
    <div className="qs-root" style={rootStyle}>
      <Background theme={theme} />

      {!ready && (
        <div className="qs-boot">
          <div className="qs-boot-logo">QUANTUM<br />SPIN</div>
        </div>
      )}

      <div className="qs-viewport">
        <TopBar onMenu={() => setSheet('menu')} onRewards={() => { setTab('rewards'); setSheet('rewards'); }} />
        <JackpotRail />

        <div className="qs-machine-wrap">
          <MultiplierBadge />
          <Reels />
        </div>

        <WinRow />
        <BetBar onInfo={() => setSheet('paytable')} />
        <Controls />
      </div>

      <BottomNav active={tab} onSelect={onNav} />

      <EventOverlay />

      {sheet === 'paytable' && <Paytable onClose={() => setSheet(null)} />}
      {sheet === 'menu' && <MenuSheet onClose={() => setSheet(null)} />}
      {['missions', 'rewards', 'race', 'chat'].includes(sheet ?? '') && (
        <PanelSheet tab={sheet as string} onClose={() => { setSheet(null); setTab('lobby'); }} />
      )}

      {/* floating balance top-up, mirrors the reference "+" beside the balance */}
      <button
        aria-label="add credits"
        onClick={() => credit(1000)}
        style={{
          position: 'absolute', top: 'max(10px, env(safe-area-inset-top))', right: 132,
          width: 26, height: 26, borderRadius: '50%', zIndex: 5,
          background: theme.colors.neon2, color: '#fff', border: 'none',
          fontSize: 16, fontWeight: 900, boxShadow: `0 0 10px ${theme.colors.neon2}`,
        }}
      >
        +
      </button>
    </div>
  );
}
