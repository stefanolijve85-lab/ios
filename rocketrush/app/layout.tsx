import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liftoff X 🚀 — Cash out before the crash',
  description:
    'The simplest, cleanest multiplayer crash game. Place a bet, watch the rocket rise, cash out before it crashes.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Liftoff X' },
};

// Mobile-first: device width, no zoom, draw under the notch / home indicator.
export const viewport: Viewport = {
  themeColor: '#070B14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
