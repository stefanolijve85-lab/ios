import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GameProvider } from '@/hooks/useGame';

export const metadata: Metadata = {
  title: 'STASH — Secure the vault before the thieves',
  description: 'STASH: a mobile-first multiplayer crash game. Fill the vault, lock your winnings, or lose it all when the thieves break in.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'STASH' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
