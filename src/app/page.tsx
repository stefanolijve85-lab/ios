'use client';
import { useGame } from '@/hooks/useGame';
import Header from '@/components/Header';
import StatusRow from '@/components/StatusRow';
import Vault from '@/components/Vault';
import BetPanel from '@/components/BetPanel';
import LiveChat from '@/components/LiveChat';
import LiveActivity from '@/components/LiveActivity';
import FlashBanner from '@/components/FlashBanner';

export default function Page() {
  const { connected } = useGame();

  return (
    <main className="app">
      {!connected && <div className="conn">Connecting to the vault…</div>}

      <Header />
      <StatusRow />

      <div className="vault-zone">
        <Vault />
      </div>

      <BetPanel slot={0} hero />

      <div className="cols">
        <LiveChat />
        <LiveActivity />
      </div>

      <FlashBanner />
    </main>
  );
}
