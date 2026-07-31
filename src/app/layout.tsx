import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppProvider';
import { ServiceWorker } from '@/components/ServiceWorker';

export const metadata: Metadata = {
  metadataBase: new URL('https://civitas.example'),
  title: {
    default: 'Civitas — Civic participation, done well',
    template: '%s · Civitas',
  },
  description:
    'A modern, mobile-first platform for lawful civic participation: communities, local news, events, mutual aid and respectful discussion about migration, integration and public safety.',
  applicationName: 'Civitas',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Civitas' },
  openGraph: {
    title: 'Civitas',
    description: 'Civic participation, done well.',
    type: 'website',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080a12' },
    { media: '(prefers-color-scheme: light)', color: '#f4f6fc' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <AppProvider>{children}</AppProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
