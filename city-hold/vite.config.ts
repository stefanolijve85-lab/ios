import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** asset version: a hash of everything in public/. Appended to sound, model and film URLs, so a changed file is never
 *  served stale from a cache (Safari), while files that did not change stay cached across builds and deploys. */
function publicHash(dir = 'public'): string {
  const h = createHash('sha1');
  const walk = (d: string) => {
    for (const n of readdirSync(d).sort()) {
      if (n.startsWith('.') || n === '_tmp') continue;
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p); else { h.update(p); h.update(readFileSync(p)); }
    }
  };
  try { walk(dir); } catch { return String(Date.now()); }
  return h.digest('hex').slice(0, 10);
}

export default defineConfig({
  base: './',
  define: { __ASSET_VER__: JSON.stringify(publicHash()) },
  publicDir: 'public',
  // allow a tunnel address (cloudflared / ngrok) to reach the dev server and the preview, for testing on a phone outside the wifi
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
