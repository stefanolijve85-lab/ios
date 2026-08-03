'use client';
import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import Header from '@/components/Header';
import StatusRow from '@/components/StatusRow';
import Vault from '@/components/Vault';
import HistoryBar from '@/components/HistoryBar';
import BetPanel from '@/components/BetPanel';
import LiveChat from '@/components/LiveChat';
import LiveActivity from '@/components/LiveActivity';
import FlashBanner from '@/components/FlashBanner';
import Landing from '@/components/Landing';
import RealityCheck from '@/components/RealityCheck';
import ExcludedOverlay from '@/components/ExcludedOverlay';
import AdRail from '@/components/AdRail';
import RouletteBackdrop from '@/components/RouletteBackdrop';

// The actual game screen. Rendered at /<game> (e.g. /bankheistx); the active
// theme is resolved from that path segment by the ThemeProvider.
export default function GameScreen() {
  const { connected } = useGame();
  const [started, setStarted] = useState(false);
  const [twoBets, setTwoBets] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  if (!started)
    return (
      <>
        <RouletteBackdrop />
        <AdRail side="left" />
        <Landing onPlay={() => setStarted(true)} />
        <AdRail side="right" />
      </>
    );

  return (
    <>
    <RouletteBackdrop />
    <AdRail side="left" />
    <main className={`app${chatOpen ? ' chat-open' : ''}`}>
      {!connected && <div className="conn">Connecting…</div>}

      <Header />
      <StatusRow />

      <div className="vault-zone">
        <Vault />
      </div>

      <HistoryBar />

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
        <LiveChat open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
        <LiveActivity open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
      </div>

      <FlashBanner />
      <RealityCheck />
      <ExcludedOverlay />
    </main>
    <AdRail side="right" />
    </>
  );
}
