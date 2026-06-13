'use client';
import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import Header from '@/components/Header';
import StatusRow from '@/components/StatusRow';
import Vault from '@/components/Vault';
import ThiefTimer from '@/components/ThiefTimer';
import BetPanel from '@/components/BetPanel';
import LiveChat from '@/components/LiveChat';
import LiveActivity from '@/components/LiveActivity';
import PlayersRemaining from '@/components/PlayersRemaining';
import BottomNav from '@/components/BottomNav';
import FlashBanner from '@/components/FlashBanner';

export default function Page() {
  const { connected } = useGame();
  const [secondPanel, setSecondPanel] = useState(false);

  return (
    <main className="app">
      {!connected && <div className="conn">Connecting to the vault…</div>}

      <Header />
      <StatusRow />
      <Vault />
      <ThiefTimer />

      <BetPanel slot={0} hero />

      {secondPanel ? (
        <>
          <div className="lbl-mini">SECOND BET</div>
          <BetPanel slot={1} />
        </>
      ) : (
        <button className="add-second" onClick={() => setSecondPanel(true)}>
          + Add a second bet
        </button>
      )}

      <div className="cols">
        <LiveChat />
        <LiveActivity />
      </div>

      <PlayersRemaining />

      <FlashBanner />
      <BottomNav />
    </main>
  );
}
