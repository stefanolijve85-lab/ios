import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { CATALOG } from '@/brand';
import { THEMES, getTheme } from '@/themes';
import GameScreen from '@/components/GameScreen';

// /<game> — e.g. /bankheistx, /trainridex, /liftoffx. The ThemeProvider reads
// this path segment to pick the theme; the socket connects to the matching
// game loop. A catalog entry with an external `url` (a separately deployed
// game) would redirect to that site instead — none do today.
export function generateMetadata({ params }: { params: { game: string } }): Metadata {
  const t = THEMES[params.game];
  if (!t) return {};
  return { title: t.meta.title, description: t.meta.description };
}

export default function GamePage({ params }: { params: { game: string } }) {
  const entry = CATALOG.find((c) => c.key === params.game);
  if (entry?.url) redirect(entry.url);      // standalone game on its own domain
  if (!THEMES[params.game]) notFound();     // unknown path
  // touch the theme so an invalid key is caught at build/runtime
  getTheme(params.game);
  return <GameScreen />;
}
