'use client';

export default function BottomNav() {
  return (
    <nav className="bottomnav">
      <div className="nav active"><span>💰</span>STASH</div>
      <div className="nav"><span>🕘</span>HISTORY</div>
      <div className="center" aria-label="Vault">🏦</div>
      <div className="nav"><span>🏆</span>LEADERBOARD</div>
      <div className="nav"><span>💬</span>CHAT</div>
    </nav>
  );
}
