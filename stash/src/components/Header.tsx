'use client';
import { useGame } from '@/hooks/useGame';
import { euro } from '@/lib/format';

export default function Header() {
  const { balance } = useGame();
  return (
    <header className="header">
      <button className="icon-btn" aria-label="Menu">☰</button>
      <div className="logo">STASH</div>
      <div className="balance">
        {euro(balance)}
        <span className="plus" aria-label="Deposit">+</span>
      </div>
    </header>
  );
}
