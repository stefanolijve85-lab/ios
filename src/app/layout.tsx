import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Huis Verlichting',
  description: 'Bedien je MiBoxer- en Hue-verlichting in het hele huis en de tuin.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Verlichting' },
  icons: { apple: '/apple-touch-icon.png', icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
