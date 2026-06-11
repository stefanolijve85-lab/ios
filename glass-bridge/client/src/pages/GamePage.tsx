import BetPanel from '../components/BetPanel.js';
import GameCenter from '../components/GameCenter.js';
import SocialPanel from '../components/SocialPanel.js';
import ProofCard from '../components/ProofCard.js';

export default function GamePage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
      {/* left: bet / auto-bet */}
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <BetPanel />
        <div className="hidden lg:block">
          <ProofCard />
        </div>
      </div>

      {/* center: the bridge */}
      <div className="order-1 lg:order-2">
        <GameCenter />
      </div>

      {/* right: chat / leaderboards */}
      <div className="order-3 h-[520px] lg:h-auto">
        <SocialPanel />
      </div>

      <div className="order-4 lg:hidden">
        <ProofCard />
      </div>
    </div>
  );
}
