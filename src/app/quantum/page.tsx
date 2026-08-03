import type { Metadata } from 'next';
import './quantum.css';
import { SlotProvider } from '@/hooks/useSlot';
import { GameShell } from '@/components/slot/GameShell';
import { getSlotTheme } from '@/game/theme';

const theme = getSlotTheme('quantumspin');

export const metadata: Metadata = {
  title: theme.meta.title,
  description: theme.meta.description,
};

// QUANTUM SPIN — the playable slot. Server-authoritative, provably fair.
export default function QuantumPage() {
  return (
    <SlotProvider themeKey="quantumspin">
      <GameShell />
    </SlotProvider>
  );
}
