import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  publicDir: 'public',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
