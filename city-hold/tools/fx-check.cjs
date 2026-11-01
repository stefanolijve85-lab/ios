// Effects check in #fxroom: particle cap, pause, emitter cleanup after extinguishing.
// Usage: npm run dev, then  node tools/fx-check.cjs http://localhost:5173/ out.png [desktop|mobile]
const { chromium } = require('playwright');
(async () => {
  const [, , url, out, q] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 700 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url + '#fxroom'); await p.waitForFunction(() => !!window.__fxroom, null, { timeout: 60000 });
  if (q) await p.selectOption('[data-k="q"]', q);
  await p.waitForTimeout(4000);
  const r = {};
  r.steady = await p.evaluate(() => ({ n: window.__fxroom.fx.count, cap: window.__fxroom.fx.cap, em: window.__fxroom.fx.activeEmitters() }));
  await p.click('[data-a="stress"]'); await p.waitForTimeout(300);
  r.stress = await p.evaluate(() => window.__fxroom.fx.count);
  await p.click('[data-a="explosion"]'); await p.click('[data-a="sparks"]'); await p.waitForTimeout(250);
  if (process.env.CLOSE) await p.evaluate(() => { const c = window.__fxroom; });
  await p.screenshot({ path: out, timeout: 240000 });
  await p.click('[data-a="pause"]'); const a1 = await p.evaluate(() => window.__fxroom.fx.count); await p.waitForTimeout(1500); const a2 = await p.evaluate(() => window.__fxroom.fx.count); r.pauseHolds = a1 === a2;
  await p.click('[data-a="pause"]');
  await p.click('[data-a="out"]'); await p.waitForTimeout(5000);
  r.afterExtinguish = await p.evaluate(() => ({ n: window.__fxroom.fx.count, em: window.__fxroom.fx.activeEmitters() }));
  console.log(JSON.stringify(r), 'errors:', errs.join(' | ') || 'none');
  await b.close();
})();
