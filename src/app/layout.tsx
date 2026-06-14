import type { Metadata, Viewport } from 'next';
import './globals.css';
import { GameProvider } from '@/hooks/useGame';

export const metadata: Metadata = {
  title: 'BANKHEIST X — Secure the vault before the thieves',
  description: 'BANKHEIST X: a mobile-first multiplayer crash game. Fill the vault, secure your winnings, or lose it all when the thieves break in.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BANKHEIST X' },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
