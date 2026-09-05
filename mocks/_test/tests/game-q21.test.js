// Real game Q21 "Frodrick Rematch": the level draws immediately (no intro popup),
// a fair rally is unwinnable and costs a heart, holding Frodrick's paddle freezes
// it (examiner turns away, standing reads UNSUPERVISED) and three points win.
// Play area at 1280x860: x 118..1162, y 171..552. Pause button centre ~ (1136,147).
const PX = 118, PY = 171, PW = 1044, PH = 381;
const FROD_X = PX + (0.975 - 0.018 / 2) * PW;   // centre of Frodrick's paddle column

module.exports = async (page, g) => {
  const lv = () => g.eval(() => Object.assign({}, window.__gc.lv));
  const hud = () => g.eval(() => ({ label: window.__gc.state.hudHeartsLabel, dir: window.__gc.guideCharDir }));
  const settle = async (max = 140) => { for (let i = 0; i < max; i++) { if (!(await lv()).rallying) return; await g.wait(100); } };

  await g.goto(21);
  await g.wait(500);

  // ── the intro popup is gone: drawLevel21 owns the frame from the first draw ──
  let s = await g.state();
  g.assert(s.phase === 'active', 'level draws immediately, no intro popup: ' + JSON.stringify(s));
  let L = await lv();
  g.assert(L && L.rallying === false && L.you === 0 && L.frod === 0, 'court is live and 0-0: ' + JSON.stringify(L));
  g.assert(s.remarks.trim().startsWith('he has returned'), 'opening remark: ' + s.remarks);
  g.assert(s.lives === 3, 'three hearts to start');
  await g.shot('start');

  // ── the conventional trap: play it fair. Park the paddle out of the way and
  //    let Frodrick take three straight. That costs a heart. ────────────────────
  await g.keyDown('w'); await g.wait(900); await g.keyUp('w');
  for (let p = 0; p < 3; p++) { await g.key(' '); await g.wait(200); await settle(); await g.wait(200); }
  await g.wait(600);
  s = await g.state();
  g.assert(s.lives === 2, 'a fair rematch costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT stamp on the loss: ' + s.stamp);
  g.assert(s.remarks.includes('Three to nothing'), 'loss remark: ' + s.remarks);
  L = await lv();
  g.assert(L.you === 0 && L.frod === 0, 'the scores reset after the loss: ' + JSON.stringify(L));
  await g.shot('lost-a-heart');

  // ── pausing freezes the physics and the level clock ────────────────────────
  await g.key(' '); await g.wait(500);
  const live = await lv();
  g.assert(live.rallying, 'a rally is live before the pause: ' + JSON.stringify(live));
  await g.wait(300);
  const moving = await lv();
  g.assert(moving.ballX !== live.ballX, 'the ball moves while running');
  await g.click(1136, 147); await g.wait(400);
  s = await g.state();
  g.assert(s.paused, 'the pause button suspended the exam');
  const a = await lv();
  await g.wait(900);
  const b = await lv();
  g.assert(a.ballX === b.ballX && a.ballY === b.ballY,
    'the ball is frozen while paused: ' + JSON.stringify([a.ballX, b.ballX]));
  g.assert(a.elapsed === b.elapsed,
    'the level clock is frozen while paused: ' + JSON.stringify([a.elapsed, b.elapsed]));
  await g.shot('paused');
  await g.eval(() => { window.__gc.state.paused = false; window.__gc.render(); });
  await g.wait(400);
  const after = await lv();
  g.assert(after.elapsed > b.elapsed, 'the clock runs again after resuming');
  await settle();
  await g.wait(300);

  // ── the intended solution: hold the left button on Frodrick's paddle ───────
  const aiY = (await lv()).aiY;
  const frodY = PY + aiY * PH;
  await g.down(FROD_X, frodY);
  await g.wait(400);
  L = await lv();
  g.assert(L.frozen, 'holding the paddle freezes it: ' + JSON.stringify(L));
  const h = await hud();
  g.assert((h.label || '').includes('UNSUPERVISED'), 'standing label reads UNSUPERVISED: ' + h.label);
  g.assert(h.dir === 'right', 'the examiner turns away while you hold it: ' + h.dir);
  s = await g.state();
  g.assert(s.remarks.includes('I saw nothing'), 'first freeze earns the line: ' + s.remarks);
  await g.shot('frozen');

  // three serves sail past the frozen paddle
  for (let p = 0; p < 3; p++) {
    await g.key(' '); await g.wait(200); await settle(); await g.wait(250);
    if (p === 0) {
      s = await g.state();
      g.assert(s.remarks.includes('filing a complaint'), 'first point earns the complaint line: ' + s.remarks);
    }
  }
  await g.wait(800);
  await g.up();
  s = await g.state();
  g.assert(s.phase === 'win', 'three points past the frozen paddle win: ' + JSON.stringify([s, await lv()]));
  g.assert(s.lives === 2, 'the win costs nothing more: ' + s.lives);
  await g.shot('win');
};
