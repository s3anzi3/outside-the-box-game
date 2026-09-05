// Real game Q15 — Outside the Box.
// Connect-the-pairs with freehand pencil strokes. Red's seals are flush to the
// left/right paper edges and blue's flush to the top/bottom, so whichever is drawn
// first is an edge-to-edge wall and the other cannot be finished inside the sheet:
// bumping a line slams INCORRECT and costs a heart. The way out is invisible:
// pull the paper's top-left corner off (it takes the Q.15 label with it) and route
// the last line around the outside, across the desk.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   play area    x 118..1162, y 171..552   (W 1044, H 381)
//   desk limit   x 55..1225,  y 100..582   (once the corner is gone)
//   pause button (1136, 147);  pause overlay RESUME (862.8, 326.2)
module.exports = async (page, g) => {
  const PAUSE = [1136, 147], RESUME = [862.8, 326.2];
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  // Dark ink inside the item-label rect. Returns null if the canvas is tainted
  // (file:// image sources), in which case the label check is skipped.
  const qInk = () => g.eval(() => {
    try {
      const gc = window.__gc, r = gc.chrome.qLabel;
      if (!r) return null;
      const d = gc.ctx.getImageData(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h)).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90) n++;
      return n;
    } catch (e) { return null; }
  });

  await g.goto(15);
  await g.wait(400);
  let s = await g.state();
  g.assert(s.level === 15 && s.phase === 'active', 'on Q15: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert(s.remarks.includes('Connect each pair of seals'), 'opening remark: ' + s.remarks);
  g.assert(s.remarks.includes('must not touch one another'), 'the one rule is stated: ' + s.remarks);

  const seals = await g.levelVar('seals');
  g.assert(seals && seals.red && seals.blue, 'the seal geometry is exposed: ' + JSON.stringify(seals));
  g.assert(near(seals.red[0].x, 126, 3) && near(seals.red[1].x, 1154, 3) && near(seals.red[0].y, 379, 3),
    'red is flush to the left and right paper edges: ' + JSON.stringify(seals.red));
  g.assert(near(seals.blue[0].y, 185, 3) && near(seals.blue[1].y, 538, 3) && near(seals.blue[0].x, 640, 3),
    'blue is flush to the top and bottom paper edges: ' + JSON.stringify(seals.blue));
  g.assert((await g.levelVar('connected')) === 0, 'nothing connected yet');
  g.assert((await g.levelVar('ripped')) === false, 'the corner is pristine');
  const inkBefore = await qInk();
  await g.shot('start');

  // ── pausing freezes the level clock and the pen ────────────────────────────
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  const e0 = await g.levelVar('elapsed');
  g.assert(typeof e0 === 'number', 'the level clock is readable: ' + e0);
  await g.wait(1000);
  const e1 = await g.levelVar('elapsed');
  g.assert(e0 === e1, 'the level clock is frozen while paused: ' + e0 + ' -> ' + e1);
  // and the pen is dead: clicking a seal under the notice starts nothing
  await g.click(seals.green[0].x, seals.green[0].y);
  await g.wait(200);
  g.assert(!(await g.levelVar('drawing')), 'no stroke starts while suspended');
  await g.shot('paused');

  await g.click(RESUME[0], RESUME[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const e2 = await g.levelVar('elapsed');
  await g.wait(500);
  const e3 = await g.levelVar('elapsed');
  g.assert(e3 > e2, 'the clock runs again after resuming: ' + e2 + ' -> ' + e3);
  g.assert(s.lives === 3, 'pausing is free: ' + s.lives);

  // ── green: click to draw, then just move the cursor (touchpad friendly) ────
  await g.click(seals.green[0].x, seals.green[0].y);
  await g.wait(150);
  g.assert((await g.levelVar('clickMode')) === true, 'a tap on a seal arms hands-free drawing');
  await g.move(seals.green[1].x, seals.green[1].y, 14);
  await g.wait(300);
  g.assert((await g.levelVar('done.green')) === true, 'green completes on reaching its partner');
  g.assert((await g.levelVar('connected')) === 1, 'pairs connected: 1');

  // ── yellow: press and drag ────────────────────────────────────────────────
  await g.drag(seals.yellow[0].x, seals.yellow[0].y, seals.yellow[1].x, seals.yellow[1].y, 20);
  await g.wait(300);
  g.assert((await g.levelVar('done.yellow')) === true, 'yellow completes on a press and drag');

  // ── red: edge to edge, the sheet is now cut in two ────────────────────────
  await g.drag(seals.red[0].x, seals.red[0].y, seals.red[1].x, seals.red[1].y, 40);
  await g.wait(300);
  g.assert((await g.levelVar('done.red')) === true, 'red runs wall to wall');
  g.assert((await g.levelVar('connected')) === 3, 'three of four pairs connected');
  s = await g.state();
  g.assert(s.lives === 3, 'three clean lines cost nothing: ' + s.lives);
  await g.shot('wall');

  // ── the conventional trap: force blue through the paper anyway ────────────
  await g.drag(seals.blue[0].x, seals.blue[0].y, seals.blue[0].x, 500, 30);
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'bumping the red line costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT is slammed on the paper: ' + s.stamp);
  g.assert(s.remarks.includes('must not touch'), 'the examiner warns about the line: ' + s.remarks);
  g.assert((await g.levelVar('done.blue')) === false, 'the bumped stroke is thrown out');
  g.assert((await g.levelVar('connected')) === 3, 'still three pairs after the bump');
  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'the HUD still shows three heart slots: ' + JSON.stringify(ch.hearts));
  await g.shot('trap');

  // ── the invisible rip: pull the pristine top-left corner off the sheet ────
  const corner = await g.levelVar('corner');
  g.assert(corner && near(corner.x, 115, 3) && near(corner.y, 122, 3), 'the corner: ' + JSON.stringify(corner));
  await g.drag(corner.x + 4, corner.y + 4, corner.x + 150, corner.y + 90, 20);
  await g.wait(400);
  g.assert((await g.levelVar('ripped')) === true, 'the corner tears off');
  s = await g.state();
  g.assert(s.remarks.includes('Institute property'), 'the examiner reacts to the rip: ' + s.remarks);
  g.assert(s.lives === 2, 'ripping the paper is free: ' + s.lives);
  const inkAfter = await qInk();
  if (typeof inkBefore === 'number' && typeof inkAfter === 'number') {
    g.assert(inkBefore > 0, 'the Q.15 label was on the paper: ' + inkBefore);
    g.assert(inkAfter === 0, 'the torn corner took the Q.15 label with it: ' + inkBefore + ' -> ' + inkAfter);
  }
  await g.shot('ripped');

  // ── the way out: route blue around the outside, across the desk ───────────
  const b0 = seals.blue[0], b1 = seals.blue[1];
  await g.down(b0.x, b0.y);
  await g.wait(100);
  await g.move(b0.x, 110, 8);
  await g.wait(160);
  g.assert((await g.levelVar('sputtered')) === true, 'the line has left the paper');
  s = await g.state();
  g.assert(s.remarks.includes('no rule against it'), 'the examiner concedes the desk: ' + s.remarks);
  await g.move(75, 110, 20);
  await g.wait(160);
  await g.move(75, 570, 25);
  await g.wait(200);
  await g.move(b1.x, 570, 25);
  await g.wait(200);
  await g.shot('outside');
  await g.move(b1.x, b1.y, 8);
  await g.wait(250);
  await g.up();
  g.assert((await g.levelVar('done.blue')) === true, 'blue closes around the outside');

  await g.wait(1400);
  s = await g.state();
  g.assert(s.phase === 'win', 'routing outside the paper wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the solve costs nothing more: ' + s.lives);
  await g.shot('win');
};
