// Real game Q37 "Trim Marks": every printed button costs a heart, the trimmed sliver is inert,
// dragging a right-hand crop mark outward widens the page and puts the 14 on the paper.
// Layout at 1280x860: paper x 115.2..1164.8, y 122.12..554.7; play area y 168.12..554.7 (H 386.58).
// Answer row: y 369.1..427.1 (centre 398); button centres 446.2 (9), 632.2 (12), 818.2 (16), 1004.2 (20), 1190.2 (14).
module.exports = async (page, g) => {
  const ROW_Y = 398;
  const BTN = { n9: 446.2, n12: 632.2, n16: 818.2, n20: 1004.2, n14: 1190.2 };
  const SLIVER_X = 1140;              // the visible slice of the 14 before the trim is moved
  const TICK_BR = { x: 1162, y: 550 };  // bottom-right crop mark (paper corner 1164.8, 554.7)

  await g.goto(37);
  await g.wait(400);
  await g.shot('start');

  let s = await g.state();
  g.assert(s.lives === 3, 'three hearts to start: ' + JSON.stringify(s));
  g.assert((await g.levelVar('ext')) === 0, 'the page starts trimmed');
  g.assert((await g.levelVar('revealed')) === false, 'the fifth button is not on the paper yet');

  // ── the conventional trap: pick one of the four printed buttons ─────────────
  await g.click(BTN.n16, ROW_Y);
  await g.wait(1100);
  s = await g.state();
  g.assert(s.lives === 2, 'a printed button costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('did not survive'), 'first hint rung: ' + s.remarks);
  await g.shot('wrong');

  // ── pausing freezes the idle clock (it drives the crop-mark pulse) ──────────
  const ch = await g.chrome();
  g.assert(ch.pause, 'pause control rect published');
  await g.click(ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'pause control pauses: ' + JSON.stringify(s));
  const before = await g.levelVar('elapsed');
  await g.wait(900);
  const during = await g.levelVar('elapsed');
  g.assert(Math.abs(during - before) < 0.12, 'the level clock is frozen while paused (one frame of drift allowed): ' + before + ' -> ' + during);
  await g.shot('paused');
  await g.key('Escape');
  await g.wait(700);
  s = await g.state();
  g.assert(s.paused === false, 'resumed');
  const after = await g.levelVar('elapsed');
  g.assert(after > during + 0.2, 'the clock runs again after resuming: ' + during + ' -> ' + after);

  // ── the sliver of the trimmed button is not a printed button: free and inert ──
  await g.click(SLIVER_X, ROW_Y);
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'clicking the trimmed sliver costs nothing: ' + JSON.stringify(s));
  g.assert(s.phase !== 'win', 'the trimmed sliver does not submit the answer');

  // ── grab the bottom-right crop mark and pull the trim into the desk margin ──
  await g.drag(TICK_BR.x, TICK_BR.y, TICK_BR.x + 105, TICK_BR.y, 24);
  await g.wait(400);
  const ext = await g.levelVar('ext');
  g.assert(ext >= 100, 'the page widened with the crop mark: ext=' + ext);
  g.assert((await g.levelVar('revealed')) === true, 'the fifth button is on the paper now');
  s = await g.state();
  g.assert(s.remarks.includes('growing'), 'the examiner notices the page growing: ' + s.remarks);
  await g.shot('untrimmed');

  // ── the button that was trimmed off in printing ────────────────────────────
  await g.click(BTN.n14, ROW_Y);
  await g.wait(1200);
  s = await g.state();
  g.assert(s.phase === 'win', 'the untrimmed 14 wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'no further hearts lost');
  await g.shot('win');
};
