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
  await p.click('[data-side="defence"]'); await p.click('[data-act="play"]'); await p.waitForFunction(() => !!window.__match && document.querySelector('.hud'), null, { timeout: 90000 }); await p.waitForTimeout(800);
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
  if (st.phase === 'prep') {
    // spend the reward: upgrade a second store through the UI
    await p.click('.store-label >> nth=1'); await p.waitForTimeout(300);
    const b0 = await p.evaluate(() => window.__match.game.budget);
    await p.click('[data-u="shutter"]'); await p.waitForTimeout(300);
    const up = await p.evaluate(() => ({ b: window.__match.game.budget, lv: window.__match.game.stores[1].shutterLevel, max: window.__match.game.stores[1].maxStructure }));
    assert(up.b === b0 - 300 && up.lv === 2 && up.max === 160, `reward spent on an upgrade (budget ${b0} -> ${up.b}, max structure ${up.max})`);
    await p.waitForFunction(() => /6\/6/.test(document.querySelector('[data-k="cycle"]').textContent), null, { timeout: 20000 }).catch(() => {});
    const cyc = await p.textContent('[data-k="cycle"]');
    assert(/GAME LOOP 6\/6/.test(cyc), 'defence game-loop checklist complete: ' + cyc.replace(/\s+/g, ' '));
    await p.screenshot({ path: `${out}/${city}_defence_loop_complete.png` });
  }
  // restart: fresh state, one canvas
  await p.click('[data-a="restart"]'); await p.waitForTimeout(3000);
  st = await p.evaluate(() => ({ budget: window.__match.game.budget, wave: window.__match.game.wave, canvases: document.querySelectorAll('canvas').length, labels: document.querySelectorAll('.store-label').length }));
  assert(st.wave === 1 && st.budget >= 1500 && st.canvases === 1 && st.labels === 3, `restart resets state (budget ${st.budget}, canvases ${st.canvases}, labels ${st.labels})`);
  // lose quickly: remove defenders and run
  await p.evaluate(() => { const g = window.__match.game; g.units = []; });
  for (let w = 0; w < 12; w++) { await p.evaluate(() => window.__match.game.startWave()); await ff(200); if (await p.evaluate(() => window.__match.game.over)) break; }
  await p.waitForSelector('.result h2', { timeout: 20000 }).catch(() => {});
  const res = await p.evaluate(() => document.querySelector('.result h2')?.textContent + ' / phase ' + window.__match.game.phase);
  assert(/DEFEAT/.test(res || ''), 'defence defeat shows result screen: ' + res);
  await p.screenshot({ path: `${out}/${city}_defence_result.png` });
  await p.click('[data-r="menu"]'); await p.waitForTimeout(500);
  // ---------------- looters
  await p.click('[data-side="looters"]'); await p.click('[data-act="play"]'); await p.waitForFunction(() => !!window.__match && document.querySelector('.hud'), null, { timeout: 90000 }); await p.waitForTimeout(800);
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
  // run until the first extraction, then spend the reward on the group upgrade through the UI
  for (let i = 0; i < 40; i++) {
    const ex = await p.evaluate(() => {
      const g = window.__match.game;
      if (!g.over && g.attackers().length + g.dispatchQueue.length === 0) {
        const guard = (i) => g.defenders().filter((d) => Math.hypot(d.x - g.stores[i].door.x, d.z - g.stores[i].door.z) < 8).length;
        const t = g.stores.filter((s) => s.stock > 0).map((s) => s.idx).sort((a, b) => guard(a) - guard(b))[0];
        g.setLooterTarget(t); const door = g.stores[t].door;
        g.setLooterRoute(g.map.entries.filter((e) => e.spawn).sort((a, b) => Math.hypot(a.x - door.x, a.z - door.z) - Math.hypot(b.x - door.x, b.z - door.z))[0].id);
        while (g.budget >= 150 && g.squad.length < 5) g.recruit(g.squad.length % 3 === 2 ? 'runner' : 'carrier');
        if (!g.squad.length && g.budget >= 100) g.recruit('runner');
        if (g.squad.length) g.dispatch();
      }
      for (let k = 0; k < 150 && !g.over && g.extracted === 0; k++) g.step(1 / 30);
      return g.extracted;
    });
    if (ex > 0) break;
  }
  const lb = await p.evaluate(() => { const g = window.__match.game; if (g.budget < 300) g.budget = 300; /* top-up only so the UI button can be exercised */ return { b: g.budget, ex: g.extracted }; });
  assert(lb.ex > 0, `looters extracted stock (${lb.ex}) and were paid for it`);
  await p.waitForTimeout(400);
  await p.click('.infotoggle'); await p.waitForTimeout(300);
  await p.click('[data-u="capacity"]'); await p.waitForTimeout(400);
  const lu = await p.evaluate(() => ({ b: window.__match.game.budget, u: window.__match.game.looterUpgrade }));
  assert(lu.u === 'capacity' && lu.b === lb.b - 300, `looter upgrade bought from the panel (${lb.b} -> ${lu.b})`);
  await p.waitForFunction(() => /6\/6/.test(document.querySelector('[data-k="cycle"]').textContent), null, { timeout: 20000 }).catch(() => {});
  const lc = await p.textContent('[data-k="cycle"]');
  assert(/GAME LOOP 6\/6/.test(lc), 'looter game-loop checklist complete: ' + lc.replace(/\s+/g, ' '));
  await p.screenshot({ path: `${out}/${city}_looters_loop_complete.png` });
  // play on with a simple policy until the match ends
  for (let i = 0; i < 60; i++) {
    const over = await p.evaluate(() => { const g = window.__match.game; if (!g.over && g.attackers().length + g.dispatchQueue.length === 0) { const t = g.stores.slice().sort((a, b) => b.stock - a.stock)[0].idx; g.setLooterTarget(t); while (g.budget >= 150 && g.squad.length < 5) g.recruit('carrier'); if (!g.squad.length && g.budget >= 100) g.recruit('runner'); g.dispatch(); } for (let k = 0; k < 300 && !g.over; k++) g.step(1 / 30); return g.over; });
    if (over) break;
  }
  await p.waitForSelector('.result h2', { timeout: 20000 }).catch(() => {});
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
  await p.click('[data-side="defence"]'); await p.click('[data-act="play"]'); await p.waitForFunction(() => !!window.__match && document.querySelector('.hud'), null, { timeout: 90000 }); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/${city}_defence_portrait.png` });
  const small = await p.evaluate(() => [...document.querySelectorAll('.hud button')].filter((b) => b.offsetParent && (b.getBoundingClientRect().height < 28)).length);
  assert(small === 0, 'no visible HUD button smaller than 28 px in portrait');
  console.log('page errors:', errs.length ? errs.join('\n') : 'none');
  await b.close();
  if (errs.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
