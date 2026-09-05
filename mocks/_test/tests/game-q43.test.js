// Real game Q43 "Ghost Continue": the previous win screen's CONTINUE button is still
// faintly on the paper at the exact win-screen coordinates, and it still works.
// REFRESH is the conventional move and costs a heart. Layout at 1280x860:
//   play area  x 115.2..1164.8, y 168.1..554.7  (topBoxY = 860*0.142 + 46, H = 860*0.503 - 46)
//   ghost      cx-110 = 530 .. 750,  y 168.12 + 386.58*0.64 = 415.5, h = max(44, 50.3) → centre (640, 440.7)
//   REFRESH    right 26, bottom 22, 118x38 → x 1020.8..1138.8, y 494.7..532.7 → centre (1079.8, 513.7)
const GHOST = { x: 640, y: 441 };
const REFRESH = { x: 1080, y: 514 };

module.exports = async (page, g) => {
  await g.goto(43);
  await g.wait(600);

  // ── the examiner opens silent and the paper only says AWAIT INSTRUCTIONS ────
  let s = await g.state();
  g.assert(s.lives === 3, 'three hearts on entry: ' + JSON.stringify(s));
  g.assert(s.remarks.trim() === '', 'the examiner is silent at first: "' + s.remarks + '"');
  g.assert((await g.levelVar('stage')) === 0, 'no hint rung yet');
  const alpha0 = await g.levelVar('alpha');
  g.assert(Math.abs(alpha0 - 0.30) < 0.02, 'the ghost starts at thirty percent: ' + alpha0);
  const ghostRect = await g.levelVar('ghost');
  g.assert(Math.abs(ghostRect.x - 530) < 2 && Math.abs(ghostRect.w - 220) < 2,
    'the ghost sits where the win screen puts CONTINUE: ' + JSON.stringify(ghostRect));
  await g.shot('silent');

  // ── the conventional move: REFRESH. It costs a heart and fades the ghost ────
  await g.click(REFRESH.x, REFRESH.y);
  await g.wait(800);
  s = await g.state();
  g.assert(s.lives === 2, 'REFRESH costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('fainter'), 'first refresh remark: ' + s.remarks);
  g.assert((await g.levelVar('refreshes')) === 1, 'one refresh recorded');
  const alpha1 = await g.levelVar('alpha');
  g.assert(alpha1 < alpha0 - 0.03, 'the ghost is fainter after refreshing: ' + alpha0 + ' -> ' + alpha1);
  await g.shot('refreshed');

  // ── pausing freezes the level clock that drives the hint ladder ─────────────
  const ch = await g.chrome();
  g.assert(ch.pause, 'pause control rect published');
  await g.click(ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the pause control pauses: ' + JSON.stringify(s));
  const before = await g.levelVar('elapsed');
  await g.wait(1100);
  const during = await g.levelVar('elapsed');
  g.assert(Math.abs(during - before) < 0.05, 'the hint clock is frozen while paused: ' + before + ' -> ' + during);
  // a paused click on the ghost is inert
  await g.click(GHOST.x, GHOST.y);
  await g.wait(300);
  s = await g.state();
  g.assert(s.phase !== 'win' && s.paused === true, 'a paused ghost click does nothing: ' + JSON.stringify(s));
  await g.shot('paused');
  await g.key('Escape');
  await g.wait(800);
  s = await g.state();
  g.assert(s.paused === false, 'Escape resumes: ' + JSON.stringify(s));
  const after = await g.levelVar('elapsed');
  g.assert(after > during + 0.2, 'the clock runs again after resuming: ' + during + ' -> ' + after);

  // ── the examiner's first timed rung lands at eight seconds ─────────────────
  for (let i = 0; i < 40; i++) {
    if ((await g.levelVar('elapsed')) >= 8.4) break;
    await g.wait(500);
  }
  s = await g.state();
  g.assert(s.remarks.includes('...'), 'the eight second rung is "...": ' + s.remarks);
  g.assert((await g.levelVar('stage')) >= 1, 'the ladder advanced');

  // ── the intended solution: press the ghost of the last CONTINUE ─────────────
  await g.click(GHOST.x, GHOST.y);
  await g.wait(900);
  s = await g.state();
  g.assert(s.phase === 'win', 'the ghost CONTINUE still works: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'no further hearts lost: ' + JSON.stringify(s));
  await g.shot('win');
};
