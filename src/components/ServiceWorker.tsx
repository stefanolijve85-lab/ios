'use client';

import { useEffect } from 'react';

// Registers the PWA service worker for offline caching. No-ops in dev to keep
// hot-reload clean; only runs in the browser in production.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
