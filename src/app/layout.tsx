import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { GameProvider } from '@/hooks/useGame';
import { ThemeProvider } from '@/hooks/useTheme';
import { getTheme, themeKeyForHost } from '@/themes';

export function generateMetadata(): Metadata {
  const t = getTheme(themeKeyForHost(headers().get('host')));
  return {
    title: t.meta.title,
    description: t.meta.description,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: t.name },
  };
}

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
        <ThemeProvider>
          <GameProvider>{children}</GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
