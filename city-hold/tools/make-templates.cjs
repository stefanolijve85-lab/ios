// Writes artist templates to assets/model_templates/*.glb (not part of the game build).
// Usage: npm run dev, then node tools/make-templates.cjs http://localhost:5173/
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2] || 'http://localhost:5173/';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); p.on('pageerror', (e) => console.error(e));
  await p.goto(base + 'export.html'); await p.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', null, { timeout: 60000 });
  const files = await p.evaluate(() => window.__exportTemplates()); await b.close();
  const dir = path.join(__dirname, '..', 'assets', 'model_templates'); fs.mkdirSync(dir, { recursive: true });
  for (const [n, b64] of Object.entries(files)) fs.writeFileSync(path.join(dir, n + '.glb'), Buffer.from(b64, 'base64'));
  console.log('wrote', Object.keys(files).length, 'templates');
})().catch((e) => { console.error(e); process.exit(1); });
