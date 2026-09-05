// Real game Q11 "Loading… 99%":
//  - the bar loads on a stuttering curve and then freezes at 99% forever,
//  - pausing freezes the level clock (and therefore the load and the trap timer),
//  - the conventional trap (the RETRY button that fades in ~3s after the freeze)
//    slams INCORRECT, costs a heart and restarts the load from 0%,
//  - the intended solution is to grab the handle at the edge of the fill and drag
//    the last 1% across the line, which wins.
// Layout at 1280x860 (s = 1): play area x 118..1162, y 171..552.
module.exports = async (page, g) => {
  await g.goto(11);
  await g.wait(400);
  await g.shot('start');

  const ch = await g.chrome();
  const play = ch.play;
  g.assert(play && play.w > 900, 'play rect: ' + JSON.stringify(play));

  // Geometry the level draws from (mirrors Level11.ts at s = 1).
  const barW = play.w * 0.66;
  const barX = 640 - barW / 2;
  const barY = play.y + play.h * 0.40;
  const barMidY = barY + 13;
  const retry = { x: 640, y: play.y + play.h * 0.71 + 26 };

  let s = await g.state();
  g.assert(s.phase === 'active', 'level is active: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'three hearts to start: ' + s.lives);
  g.assert(s.remarks.indexOf('Give it a minute') >= 0, 'opening remark: ' + s.remarks);

  // ── the bar is actually loading ────────────────────────────────────────────
  const fill0 = await g.levelVar('fill');
  g.assert(typeof fill0 === 'number' && fill0 > 0 && fill0 < 0.99, 'bar is mid-load: ' + fill0);

  // ── pausing freezes the level timer (and with it the load) ─────────────────
  await g.click(ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'pause menu is open: ' + JSON.stringify(s));
  const tPaused = await g.levelVar('t');
  const fillPaused = await g.levelVar('fill');
  await g.wait(900);
  const tPaused2 = await g.levelVar('t');
  const fillPaused2 = await g.levelVar('fill');
  g.assert(Math.abs(tPaused2 - tPaused) < 0.02, 'level clock frozen while paused: ' + tPaused + ' -> ' + tPaused2);
  g.assert(Math.abs(fillPaused2 - fillPaused) < 0.005, 'the load is frozen while paused: ' + fillPaused + ' -> ' + fillPaused2);
  g.assert(tPaused > 0, 'the clock had run before the pause: ' + tPaused);
  await g.shot('paused');

  // RESUME (right column of the pause card)
  const pad = play.w * 0.05;
  const ox = play.x + pad, ow = play.w - pad * 2;
  const oy = play.y + pad, oh = play.h - pad * 2;
  const btnW = 220, btnH = Math.max(40, oh * 0.13);
  await g.click(ox + ow * 0.62 + btnW / 2, oy + oh * 0.30 + btnH / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));

  // ── waiting never finishes it: it sticks at 99% and the trap fades in ──────
  // Freeze at 4300ms, RETRY appears 3000ms later, plus the 600ms fade.
  await g.wait(10000);
  g.assert((await g.levelVar('stuck')) === true, 'the bar is stuck');
  g.assert((await g.levelVar('pct')) === 99, 'stuck at 99%: ' + (await g.levelVar('pct')));
  g.assert((await g.levelVar('retryOn')) === true, 'RETRY has appeared');
  g.assert((await g.levelVar('retryAlpha')) > 0.9, 'RETRY has faded in: ' + (await g.levelVar('retryAlpha')));
  s = await g.state();
  g.assert(s.lives === 3, 'waiting costs nothing: ' + s.lives);
  await g.shot('stuck');

  // ── THE TRAP: RETRY slams INCORRECT, costs a heart and restarts the load ───
  await g.click(retry.x, retry.y);
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'RETRY costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'RETRY slams INCORRECT: ' + s.stamp);
  g.assert((await g.levelVar('retries')) === 1, 'one retry recorded');
  const fillAfter = await g.levelVar('fill');
  g.assert(fillAfter < 0.99, 'the load restarted from the bottom: ' + fillAfter);
  g.assert((await g.levelVar('retryOn')) === false, 'RETRY hides again after the reset');
  await g.shot('retried');

  // ── the intended solution: grab the handle and drag the last 1% across ─────
  await g.wait(6000);                       // let it stick at 99% again
  g.assert((await g.levelVar('stuck')) === true, 'stuck at 99% once more');
  const handleX = barX + barW * (await g.levelVar('fill'));
  await g.down(handleX, barMidY);
  await g.wait(120);
  g.assert((await g.levelVar('grabbed')) === true, 'the handle is in hand');
  await g.move(barX + barW + 24, barMidY, 24);
  await g.wait(200);
  await g.up();
  await g.wait(700);

  s = await g.state();
  g.assert(s.phase === 'win', 'dragging the last 1% wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the drag itself costs nothing: ' + s.lives);
  await g.shot('win');
};
