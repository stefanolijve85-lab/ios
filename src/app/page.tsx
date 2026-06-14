'use client';
import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import Header from '@/components/Header';
import StatusRow from '@/components/StatusRow';
import Vault from '@/components/Vault';
import BetPanel from '@/components/BetPanel';
import LiveChat from '@/components/LiveChat';
import LiveActivity from '@/components/LiveActivity';
import FlashBanner from '@/components/FlashBanner';
import Landing from '@/components/Landing';

export default function Page() {
  const { connected } = useGame();
  const [started, setStarted] = useState(false);
  const [twoBets, setTwoBets] = useState(false);

  if (!started) return <Landing onPlay={() => setStarted(true)} />;

  return (
    <main className="app">
      {!connected && <div className="conn">Connecting to the vault…</div>}

      <Header />
      <StatusRow />

      <div className="vault-zone">
        <Vault />
      </div>

      {twoBets ? (
        <>
          <div className="bet-duo">
            <BetPanel slot={0} />
            <BetPanel slot={1} />
          </div>
          <button className="add-second" onClick={() => setTwoBets(false)}>− ONE BET</button>
        </>
      ) : (
        <>
          <BetPanel slot={0} hero />
          <button className="add-second" onClick={() => setTwoBets(true)}>+ ADD SECOND BET</button>
        </>
      )}

      <div className="cols">
        <LiveChat />
        <LiveActivity />
      </div>

      <FlashBanner />
    </main>
  );
}
