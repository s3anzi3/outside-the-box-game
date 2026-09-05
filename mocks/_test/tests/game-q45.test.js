// Real game Q45 — Runaway Submit.
// "Press SUBMIT to continue." The button flees the cursor (150 px radius, speed 9)
// and screams as you reach for it. It cannot be cornered until you have chased it
// ~2600 px: until then, pinning it against an edge just makes it bolt along the wall.
// Once winded it can be herded into a corner, it gives up ("OK OK FINE"), and clicking
// it wins.
//
// NOTE on the heart assertion: this level, exactly like the approved mock
// (mocks/_spec/parts/q45.js), never calls wrong()/loseLife(). The conventional trap
// here is chasing the button head-on, and it is priced in TIME, not hearts, so the
// test asserts that the head-on reach and the missed click both leave lives at 3 and
// the level unsolved. See the report notes.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   play area      x 115.2..1164.8, y 168.1..554.7   (W 1049.6, H 386.6, cx 640)
//   pause button   ~(1136, 147)  (read from g.chrome().pause)
//   button + walls exposed on window.__gc.lv (x/y/w/h/cx/cy, minX/maxX/minY/maxY)
module.exports = async (page, g) => {
  const lv = () => g.eval(() => JSON.parse(JSON.stringify(window.__gc.lv || {})));
  const clampX = (x) => Math.max(6, Math.min(1274, x));
  const clampY = (y) => Math.max(6, Math.min(854, y));

  // Remarks are overwritten as the chase goes on, so record every rung we see.
  const seen = new Set();
  const poll = async () => {
    const st = await g.state();
    if (st.remarks.includes('It has a lot left in it')) seen.add('bolt');
    if (/^Escapes: \d+\.$/.test(st.remarks)) seen.add('escapes');
    if (st.remarks.includes('It is winded')) seen.add('winded');
    if (st.remarks.includes('sheepdog')) seen.add('sheepdog');
    return st;
  };

  // Park the cursor 40 px off the button so it flees either away from the play-area
  // centre (into a wall, where it bolts) or back through the centre (open ground,
  // which drains its stamina fastest).
  const push = async (away, ms) => {
    const L = await lv();
    const pcx = (L.minX + L.maxX + L.w) / 2;
    const pcy = (L.minY + L.maxY + L.h) / 2;
    let vx = L.cx - pcx, vy = L.cy - pcy;
    let len = Math.hypot(vx, vy);
    if (len < 1) { vx = 0; vy = -1; len = 1; }
    const sgn = away ? -1 : 1;
    await g.move(clampX(L.cx + sgn * (vx / len) * 40), clampY(L.cy + sgn * (vy / len) * 40), 1);
    await g.wait(ms);
  };

  await g.goto(45);
  await g.wait(500);
  let s = await poll();
  g.assert(s.level === 45 && s.phase === 'active', 'level 45 is running: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('other ideas') && s.remarks.includes('Tire it out'),
    'the examiner opens with the reworked line: ' + s.remarks);
  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three hearts to start: ' + JSON.stringify(ch.hearts));
  let L = await lv();
  g.assert(Math.abs(L.cx - 640) < 2, 'the button starts centred: ' + L.cx);
  g.assert(L.chased === 0 && L.winded === false, 'full stamina at the start: ' + JSON.stringify(L));
  await g.shot('start');

  // ── the conventional trap: reach straight for SUBMIT, then click where it was ─
  const start = { x: L.cx, y: L.cy };
  let missed = false;
  for (let i = 0; i < 14; i++) {
    await g.move(clampX(start.x), clampY(start.y + 120 - i * 12), 1);
    await g.wait(120);
    await poll();
    const cur = await lv();
    const inside = start.x >= cur.x && start.x <= cur.x + cur.w &&
                   start.y >= cur.y && start.y <= cur.y + cur.h;
    if (!inside && i >= 2) { missed = true; break; }
  }
  g.assert(missed, 'the button has left the spot you reached for');
  await g.click(start.x, start.y);
  await g.wait(300);
  s = await poll();
  L = await lv();
  g.assert(s.phase === 'active', 'reaching for it never lands the click: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'chasing it costs no hearts, only time: ' + s.lives);
  g.assert(L.escapes >= 1 && L.chased > 0, 'the chase is counted: ' + JSON.stringify(L));
  await g.shot('fled');

  // ── pinning it while it still has legs makes it bolt along the wall ────────
  for (let i = 0; i < 30; i++) {
    const cur = await lv();
    if (cur.bolts >= 1) break;
    await push(true, 140);
    await poll();
  }
  L = await lv();
  g.assert(L.bolts >= 1, 'cornering it too early makes it bolt: ' + JSON.stringify(L));
  g.assert(L.winded === false, 'and it is still not winded: ' + JSON.stringify(L));
  g.assert(seen.has('bolt'), 'the first bolt is called out: "It has a lot left in it."');
  g.assert((await g.state()).lives === 3, 'bolting costs no hearts');
  await g.shot('bolted');

  // ── pausing freezes the level clock and the button ────────────────────────
  g.assert(ch.pause, 'pause control rect published');
  await g.click(ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused === true, 'the pause control suspends the exam: ' + JSON.stringify(s));
  const p0 = await lv();
  await g.move(clampX(p0.cx + 30), clampY(p0.cy + 30), 1);
  await g.wait(1100);
  const p1 = await lv();
  g.assert(Math.abs(p1.elapsed - p0.elapsed) < 0.02,
    'the level clock is frozen while paused: ' + p0.elapsed + ' -> ' + p1.elapsed);
  g.assert(p1.cx === p0.cx && p1.cy === p0.cy,
    'the button does not flee a paused cursor: ' + p0.cx + ',' + p0.cy + ' -> ' + p1.cx + ',' + p1.cy);
  g.assert(p1.chased === p0.chased && p1.escapes === p0.escapes, 'no stamina drains while paused');
  await g.shot('paused');
  await g.key('Escape');
  await g.wait(500);
  s = await g.state();
  g.assert(s.paused === false, 'Escape resumes: ' + JSON.stringify(s));
  const p2 = await lv();
  g.assert(p2.elapsed > p1.elapsed + 0.2, 'the clock runs again: ' + p1.elapsed + ' -> ' + p2.elapsed);

  // ── tire it out: 2600 px of flight empties the STAMINA meter ──────────────
  for (let i = 0; i < 140; i++) {
    const cur = await lv();
    if (cur.winded) break;
    await poll();
    await push(i % 5 === 4, 150);
    await poll();
  }
  L = await lv();
  g.assert(L.winded === true, 'the button is winded after ~2600 px: ' + JSON.stringify(L));
  g.assert(L.chased >= 2600, 'the stamina bar emptied: ' + L.chased);
  g.assert(seen.has('escapes'), 'the examiner counts the escapes along the way');
  g.assert(seen.has('winded') || seen.has('sheepdog'),
    'the examiner announces the winded button (or has moved on to the sheepdog line)');
  await g.shot('winded');

  // ── herd it into a corner and it gives up ─────────────────────────────────
  for (let i = 0; i < 40; i++) {
    const cur = await lv();
    if (cur.cornered) break;
    await g.move(clampX(cur.cx + 40), clampY(cur.cy + 40), 1);
    await g.wait(150);
    await poll();
  }
  L = await lv();
  g.assert(L.cornered === true, 'cornered once winded: ' + JSON.stringify(L));
  g.assert(L.winded === true && L.bolts >= 1, 'it stopped bolting and surrendered: ' + JSON.stringify(L));
  await g.shot('cornered');

  // ── and now it can be clicked ─────────────────────────────────────────────
  await g.click(L.cx, L.cy);
  await g.wait(900);
  s = await g.state();
  g.assert(s.phase === 'win', 'clicking the cornered button wins: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'the whole level was free: ' + s.lives);
  await g.shot('win');
};
