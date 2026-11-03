import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  // asset version: new on every build / dev-server start, appended to sound and model URLs so Safari never plays a stale cached file
  define: { __ASSET_VER__: JSON.stringify(String(Date.now())) },
  publicDir: 'public',
  // allow a tunnel address (cloudflared / ngrok) to reach the dev server and the preview, for testing on a phone outside the wifi
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
