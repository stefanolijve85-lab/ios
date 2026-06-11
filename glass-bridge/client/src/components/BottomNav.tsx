import { useLocation, useNavigate } from 'react-router-dom';
import { Rocket, Robot, Shield, User } from './icons.js';

/** Fixed bottom navigation matching the mockup: Play · Auto Bet · (logo) · Verify · Profile. */
export default function BottomNav({ onAutoBet, onProfile }: { onAutoBet?: () => void; onProfile?: () => void }) {
  const nav = useNavigate();
  const loc = useLocation();
  const onGame = loc.pathname === '/';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[460px] items-center justify-around border-t border-white/10 bg-black/70 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl">
      <Item icon={<Rocket />} label="PLAY" active={onGame} onClick={() => nav('/')} />
      <Item icon={<Robot />} label="AUTO BET" onClick={() => { if (!onGame) nav('/'); onAutoBet?.(); }} />

      {/* center logo button */}
      <button
        onClick={() => nav('/')}
        className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-neon-purple to-neon-blue text-2xl text-white shadow-neon ring-4 ring-void"
      >
        ◇
      </button>

      <Item icon={<Shield />} label="VERIFY" active={loc.pathname === '/verify'} onClick={() => nav('/verify')} />
      <Item icon={<User />} label="PROFILE" onClick={() => { onProfile?.(); }} />
    </nav>
  );
}

function Item({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-16 flex-col items-center gap-1 ${active ? 'text-neon-cyan' : 'text-white/45'}`}>
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="text-[9px] font-display tracking-wide">{label}</span>
    </button>
  );
}
