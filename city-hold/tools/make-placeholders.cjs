// Regenerates the temporary GLB models in public/models/placeholder and updates public/models/manifest.json.
// Slots already marked "final" in the manifest are left untouched.
// Usage:  npm run dev   (in another terminal)   then   node tools/make-placeholders.cjs [http://localhost:5173/]
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2] || 'http://localhost:5173/';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.error('page error', e));
  await p.goto(base + 'export.html');
  await p.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', null, { timeout: 60000 });
  const files = await p.evaluate(() => window.__exportPlaceholders());
  await b.close();
  const root = path.join(__dirname, '..', 'public', 'models');
  fs.mkdirSync(path.join(root, 'placeholder'), { recursive: true });
  const mf = path.join(root, 'manifest.json');
  const manifest = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : { version: 1, units: 'metres', up: 'Y', forward: '+Z', slots: {} };
  let n = 0, kept = 0;
  for (const [slot, b64] of Object.entries(files)) {
    if (manifest.slots[slot]?.status === 'final') { kept++; continue; }
    const file = `placeholder/${slot.replace(/\./g, '_')}.glb`;
    fs.writeFileSync(path.join(root, file), Buffer.from(b64, 'base64'));
    manifest.slots[slot] = { file, status: 'placeholder', note: 'temporary model generated from the procedural figure; replace with a final asset' };
    n++;
  }
  fs.writeFileSync(mf, JSON.stringify(manifest, null, 2));
  console.log(`wrote ${n} placeholder GLBs, kept ${kept} final slots`);
})().catch((e) => { console.error(e); process.exit(1); });
