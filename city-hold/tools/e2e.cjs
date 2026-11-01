// End-to-end UI check with Playwright (pre-installed Chromium). Usage:
//   npx vite --port 5199 &   then   node tools/e2e.cjs http://localhost:5199/ [outdir] [city]
const { chromium } = require('playwright');
const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
(async () => {
  const url = process.argv[2] || 'http://localhost:5199/';
  const out = process.argv[3] || 'test-output';
  const city = process.argv[4] || 'paris';
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(800);
  if (city !== 'paris') await p.evaluate((c) => { const k = 'cityhold.progress.v1'; const pr = JSON.parse(localStorage.getItem(k) || 'null') || { version: 1, unlocked: ['paris'], completed: {}, research: 0, perks: [], tutorialDone: false, matches: 0, settings: { volume: 0, reducedFx: false, showHints: true } }; pr.unlocked = ['paris', 'amsterdam', 'london', 'milan', 'berlin', 'saopaulo']; pr.tutorialDone = true; localStorage.setItem(k, JSON.stringify(pr)); }, city), await p.reload(), await p.waitForTimeout(600), await p.click(`[data-city="${city}"]`);
  const ff = (sec) => p.evaluate((s) => { const g = window.__match.game; for (let i = 0; i < s * 30 && !g.over; i++) g.step(1 / 30); }, sec);
  const scr = (x, y, z) => p.evaluate(([x, y, z]) => { const v = window.__match.view; const s = v.toScreen(x, y, z); const r = v.renderer.domElement.getBoundingClientRect(); return { x: s.x + r.left, y: s.y + r.top }; }, [x, y, z]);
  // ---------------- defence
  await p.click('[data-side="defence"]'); await p.click('[data-act="play"]'); await p.waitForTimeout(1500);
  let st = await p.evaluate(() => ({ budget: window.__match.game.budget, canvases: document.querySelectorAll('canvas').length }));
  assert(st.budget >= 1500 && st.canvases === 1, 'defence match starts with budget ' + st.budget);
  // barrier via card + socket tap
  await p.click('.card[data-kind="barrier"]'); await p.waitForTimeout(300);
  const sock = await p.evaluate(() => { const g = window.__match.game; return g.map.sockets.find((s) => s.size === 'small' && g.canPlace('barrier', s.id).ok); });
  let pt = await scr(sock.x, 0.2, sock.z); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({ budget: window.__match.game.budget, n: window.__match.game.barriers.length }));
  assert(st.n === 1, 'barrier placed by tapping a socket, budget now ' + st.budget);
  // invalid placement: tap ground while placing cancels without charge
  await p.click('.card[data-kind="camera"]'); await p.mouse.click(640, 400); await p.waitForTimeout(200);
  const b2 = await p.evaluate(() => window.__match.game.budget);
  assert(b2 === st.budget, 'tapping non-socket ground cancels placement without charge');
  // select reserve and move it
  const u = await p.evaluate(() => { const d = window.__match.game.defenders()[0]; return { id: d.id, x: d.x, z: d.z }; });
  pt = await scr(u.x, 1, u.z); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200);
  const selected = await p.evaluate(() => window.__match.view.selected.size);
  assert(selected === 1, 'tap selects the reserve team');
  const tgt = await p.evaluate(() => { const s = window.__match.game.stores[0]; const n = window.__match.map.stores[0].normal; return { x: s.door.x + n.x * 5, z: s.door.z + n.z * 5 }; });
  pt = await scr(tgt.x, 0, tgt.z); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200);
  const mv = await p.evaluate(() => window.__match.game.defenders()[0].state);
  assert(mv === 'move', 'tap on ground orders a move (state ' + mv + ')');
  // store label -> upgrade shutter
  await p.click('.store-label >> nth=0'); await p.waitForTimeout(200);
  await p.click('[data-u="shutter"]'); await p.waitForTimeout(200);
  const lv = await p.evaluate(() => window.__match.game.stores[0].shutterLevel);
  assert(lv === 2, 'store upgraded to shutter level 2 from the panel');
  await p.screenshot({ path: `${out}/${city}_defence_prep.png` });
  // start wave and fast-forward
  await p.click('[data-a="startwave"]');
  await ff(6); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/${city}_defence_wave.png` });
  const before = await p.evaluate(() => window.__match.game.budget);
  await ff(240); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({ phase: window.__match.game.phase, budget: window.__match.game.budget, wave: window.__match.game.wave, rew: window.__match.game.rewardsGranted }));
  assert(st.phase === 'prep' || st.phase === 'lost', `wave 1 resolved (phase ${st.phase}, wave ${st.wave}, rewards ${st.rew})`);
  if (st.phase === 'prep') assert(st.budget === before + 350 && st.rew === 1, 'wave reward applied exactly once');
  // restart: fresh state, one canvas
  await p.click('[data-a="restart"]'); await p.waitForTimeout(1200);
  st = await p.evaluate(() => ({ budget: window.__match.game.budget, wave: window.__match.game.wave, canvases: document.querySelectorAll('canvas').length, labels: document.querySelectorAll('.store-label').length }));
  assert(st.wave === 1 && st.budget >= 1500 && st.canvases === 1 && st.labels === 3, `restart resets state (budget ${st.budget}, canvases ${st.canvases}, labels ${st.labels})`);
  // lose quickly: remove defenders and run
  await p.evaluate(() => { const g = window.__match.game; g.units = []; });
  for (let w = 0; w < 12; w++) { await p.evaluate(() => window.__match.game.startWave()); await ff(200); if (await p.evaluate(() => window.__match.game.over)) break; }
  await p.waitForTimeout(1500);
  const res = await p.evaluate(() => document.querySelector('.result h2')?.textContent);
  assert(/DEFEAT/.test(res || ''), 'defence defeat shows result screen: ' + res);
  await p.screenshot({ path: `${out}/${city}_defence_result.png` });
  await p.click('[data-r="menu"]'); await p.waitForTimeout(500);
  // ---------------- looters
  await p.click('[data-side="looters"]'); await p.click('[data-act="play"]'); await p.waitForTimeout(1500);
  await p.click('.store-label >> nth=2'); await p.waitForTimeout(200);
  const tsel = await p.evaluate(() => window.__match.game.looterTarget);
  assert(tsel === 2, 'tapping a store label sets the looter target');
  await p.click('.card[data-kind="carrier"]'); await p.click('.card[data-kind="carrier"]'); await p.click('.card[data-kind="runner"]');
  st = await p.evaluate(() => ({ budget: window.__match.game.budget, squad: window.__match.game.squad.length }));
  assert(st.squad === 3 && st.budget === 600, 'recruiting deducts budget once per unit (' + st.budget + ')');
  await p.click('[data-a="dispatch"]'); await ff(4); await p.waitForTimeout(300);
  const act = await p.evaluate(() => window.__match.game.attackers().length);
  assert(act >= 2, 'dispatch spawns units on the chosen route');
  await ff(14); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${city}_looters_mid.png` });
  // play on with a simple policy until the match ends
  for (let i = 0; i < 60; i++) {
    const over = await p.evaluate(() => { const g = window.__match.game; if (!g.over && g.attackers().length + g.dispatchQueue.length === 0) { const t = g.stores.slice().sort((a, b) => b.stock - a.stock)[0].idx; g.setLooterTarget(t); while (g.budget >= 150 && g.squad.length < 5) g.recruit('carrier'); if (!g.squad.length && g.budget >= 100) g.recruit('runner'); g.dispatch(); } for (let k = 0; k < 300 && !g.over; k++) g.step(1 / 30); return g.over; });
    if (over) break;
  }
  await p.waitForTimeout(1500);
  const lres = await p.evaluate(() => ({ h: document.querySelector('.result h2')?.textContent, ex: window.__match.game.extracted }));
  assert(!!lres.h, `looter match finished: ${lres.h} (extracted ${lres.ex})`);
  await p.screenshot({ path: `${out}/${city}_looters_result.png` });
  // save / reload
  const rp = await p.evaluate(() => JSON.parse(localStorage.getItem('cityhold.progress.v1')).research);
  await p.reload(); await p.waitForTimeout(800);
  const rp2 = await p.evaluate(() => JSON.parse(localStorage.getItem('cityhold.progress.v1')).research);
  const btn = await p.textContent('[data-act="research"]');
  assert(rp > 0 && rp === rp2 && btn.includes(String(rp2)), `progress persists across reload (${rp2} RP)`);
  // portrait layout
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${city}_menu_portrait.png` });
  await p.click('[data-side="defence"]'); await p.click('[data-act="play"]'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${city}_defence_portrait.png` });
  const small = await p.evaluate(() => [...document.querySelectorAll('.hud button')].filter((b) => b.offsetParent && (b.getBoundingClientRect().height < 28)).length);
  assert(small === 0, 'no visible HUD button smaller than 28 px in portrait');
  console.log('page errors:', errs.length ? errs.join('\n') : 'none');
  await b.close();
  if (errs.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
