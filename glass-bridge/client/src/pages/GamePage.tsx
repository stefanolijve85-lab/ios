import { useState } from 'react';
import TopBar from '../components/TopBar.js';
import SubHeader from '../components/SubHeader.js';
import BridgeBoard from '../components/BridgeBoard.js';
import Controls from '../components/Controls.js';
import SocialPanel from '../components/SocialPanel.js';
import BottomNav from '../components/BottomNav.js';
import AutoBetSheet from '../components/AutoBetSheet.js';
import ProfileSheet from '../components/ProfileSheet.js';

export default function GamePage() {
  const [autoOpen, setAutoOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-[460px] flex-col pb-24">
      <TopBar />
      <SubHeader />
      <BridgeBoard height={372} />
      <Controls />
      <div className="mt-2 border-t border-white/5">
        <SocialPanel />
      </div>

      <BottomNav onAutoBet={() => setAutoOpen(true)} onProfile={() => setProfileOpen(true)} />
      <AutoBetSheet open={autoOpen} onClose={() => setAutoOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
