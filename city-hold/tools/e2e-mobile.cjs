// Phone check: emulated iPhone (touch, coarse pointer, landscape) plays the defence loop with taps only.
// Usage: npm run dev, then  node tools/e2e-mobile.cjs http://localhost:5173/ [outdir]
const { chromium, devices } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
(async () => {
  const url = process.argv[2] || 'http://localhost:5173/'; const out = process.argv[3] || 'test-output';
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const iphone = devices['iPhone 13 landscape'] || devices['iPhone 13'];
  const ctx = await b.newContext({ ...iphone });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(url); await p.waitForTimeout(800);
  const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches);
  assert(coarse, 'phone emulation reports a coarse (touch) pointer');
  await p.tap('.rm-cta'); await p.tap('[data-next]'); await p.tap('[data-side="defence"]'); await p.tap('[data-start]');
  await p.waitForFunction(() => !!window.__match && document.querySelector('.hud'), null, { timeout: 120000 }); await p.waitForTimeout(1500);
  const q = await p.evaluate(() => ({ fx: window.__match.view.reducedFx, shadows: window.__match.view.renderer.shadowMap.enabled, dpr: window.__match.view.renderer.getPixelRatio() }));
  assert(q.fx && !q.shadows, `mobile quality is the default on touch devices (pixel ratio ${q.dpr})`);
  const scr = (x, y, z) => p.evaluate(([x, y, z]) => { const v = window.__match.view; const s = v.toScreen(x, y, z); const r = v.renderer.domElement.getBoundingClientRect(); return { x: s.x + r.left, y: s.y + r.top }; }, [x, y, z]);
  // place a barrier by tapping card + socket
  await p.tap('.card[data-kind="barrier"]'); await p.waitForTimeout(500);
  const sock = await p.evaluate(() => { const g = window.__match.game; const v = window.__match.view; return g.map.sockets.filter((s) => s.size === 'small' && g.canPlace('barrier', s.id).ok).map((s) => ({ ...s, sc: v.toScreen(s.x, 0.2, s.z) })).find((s) => s.sc.x > 60 && s.sc.x < innerWidth - 60 && s.sc.y > 70 && s.sc.y < innerHeight - 150); });
  let pt = await scr(sock.x, 0.2, sock.z); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(700);
  assert(await p.evaluate(() => window.__match.game.barriers.length === 1), 'barrier placed with two taps');
  // select the reserve and move it with taps
  await p.evaluate(() => { const v = window.__match.view; const d = window.__match.game.defenders()[0]; v.target.set(d.x, d.z - 4); });
  await p.waitForTimeout(1200);
  const u = await p.evaluate(() => { const d = window.__match.game.defenders()[0]; return { x: d.x, z: d.z }; });
  pt = await scr(u.x, 1, u.z); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(700);
  assert(await p.evaluate(() => window.__match.view.selected.size === 1), 'tap selects a unit');
  pt = await scr(u.x - 4, 0, u.z - 3); await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(700);
  assert(await p.evaluate(() => window.__match.game.defenders()[0].state === 'move'), 'tap on the street moves the unit');
  // pinch-free zoom check through the camera API, then start the wave with a tap
  await p.tap('[data-a="startwave"]'); await p.waitForTimeout(500);
  const before = await p.evaluate(() => window.__match.game.budget);
  await p.evaluate(() => { const g = window.__match.game; for (let i = 0; i < 30 * 240 && g.phase === 'wave'; i++) g.step(1 / 30); });
  await p.waitForTimeout(2000);
  const st = await p.evaluate(() => ({ ph: window.__match.game.phase, b: window.__match.game.budget }));
  assert(st.ph === 'prep' && st.b === before + 350, `wave resolved with +350 reward (${before} -> ${st.b})`);
  // upgrade from the reward with taps
  await p.tap('.store-label >> nth=1'); await p.waitForTimeout(700);
  await p.tap('[data-u="shutter"]'); await p.waitForTimeout(700);
  assert(await p.evaluate(() => window.__match.game.stores[1].shutterLevel === 2), 'shutter upgraded by tapping');
  // frame cost in mobile quality (software GPU here; real phones use the GPU)
  const ms = await p.evaluate(() => { const m = window.__match; const v = m.view; const t0 = performance.now(); for (let i = 0; i < 5; i++) v.render(m.game, 0.016); v.renderer.getContext().finish(); return Math.round((performance.now() - t0) / 5); });
  const calls = await p.evaluate(() => window.__match.view.renderer.info.render.calls);
  console.log(`info - mobile frame ${ms} ms in software rendering, ${calls} draw calls`);
  const small = await p.evaluate(() => [...document.querySelectorAll('.hud button')].filter((x) => x.offsetParent && x.getBoundingClientRect().height < 28).length);
  assert(small === 0, 'touch targets are at least 28 px');
  await p.screenshot({ path: `${out}/phone_landscape.png`, timeout: 180000 });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/phone_portrait.png`, timeout: 180000 });
  console.log('page errors:', errs.length ? errs.join('\n') : 'none');
  await b.close(); if (errs.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
