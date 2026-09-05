// Real game Q47 "Change the Facts": SAME is unavailable and costs a heart, TOP while the
// lines are equal costs a heart, pausing freezes the level clock, and dragging the top
// line's right endpoint 20+ units longer makes TOP true.
//
// Layout at 1280x860 (getLayout): topBoxX 115.2, topBoxWidth 1049.6, topBoxY 168.12,
// topBoxHeight 386.58. The level maps the mock's 1044x381 viewBox onto that box:
//   kx = 1049.6/1044 = 1.005364,  ky = 386.58/381 = 1.014646
const KX = 1049.6 / 1044, KY = 386.58 / 381;
const MX = (v) => 115.2 + v * KX;
const MY = (v) => 168.12 + v * KY;

// endpoint handles
const TOP_Y = MY(122), BOT_Y = MY(206);
const TOP_X2 = MX(702);

// answer row: three 170-wide buttons, 28 gap, centred on 640, top at 0.91*381 - 58
const BTN_W = 170 * KX, GAP = 28 * KX;
const BTN_X0 = 640 - (BTN_W * 3 + GAP * 2) / 2;
const BTN_CY = MY(381 * 0.91 - 58) + (58 * KY) / 2;
const TOP_BTN = { x: BTN_X0 + BTN_W / 2, y: BTN_CY };
const SAME_BTN = { x: BTN_X0 + (BTN_W + GAP) * 2 + BTN_W / 2, y: BTN_CY };

const PAUSE = { x: 1136, y: 145 };          // header band pause control

module.exports = async (page, g) => {
  await g.goto(47);
  await g.wait(500);
  await g.shot('start');

  let d = await g.levelVar('diff');
  g.assert(d === 0, 'the two lines start exactly equal: ' + d);
  const mm = await g.levelVar('mmTop');
  g.assert(mm === 142, 'top readout starts at 142 MM: ' + mm);

  // ── the conventional trap: SAME is the honest answer and it is unavailable ──
  await g.click(SAME_BTN.x, SAME_BTN.y);
  await g.wait(1100);
  let s = await g.state();
  g.assert(s.lives === 2, 'SAME costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Unavailable. In your region.'), 'region line: ' + s.remarks);
  await g.shot('same-unavailable');

  // TOP while the lines are still equal is also wrong
  await g.click(TOP_BTN.x, TOP_BTN.y);
  await g.wait(1100);
  s = await g.state();
  g.assert(s.lives === 1, 'TOP while equal costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Nothing on this page is fixed'), 'ladder rung 2: ' + s.remarks);

  // ── pausing freezes the level clock ────────────────────────────────────────
  const e0 = await g.levelVar('elapsed');
  await g.click(PAUSE.x, PAUSE.y);
  await g.wait(800);
  s = await g.state();
  g.assert(s.paused === true, 'pause control paused the exam: ' + JSON.stringify(s));
  const e1 = await g.levelVar('elapsed');
  g.assert(e1 - e0 < 0.2, 'level clock frozen while paused: ' + e0 + ' -> ' + e1);
  await g.shot('paused');
  await g.key('Escape');
  await g.wait(600);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const e2 = await g.levelVar('elapsed');
  g.assert(e2 > e1 + 0.2, 'level clock runs again after resume: ' + e1 + ' -> ' + e2);

  // ── change the facts: drag the top line's right endpoint outwards ──────────
  await g.down(TOP_X2, TOP_Y);
  await g.wait(150);
  await g.move(TOP_X2 + 60, TOP_Y, 8);
  await g.wait(120);
  await g.move(960, TOP_Y, 12);
  await g.wait(150);
  await g.up();
  await g.wait(400);

  d = await g.levelVar('diff');
  g.assert(d >= 20, 'the top line is now at least 20 units longer: ' + d);
  const touched = await g.levelVar('touched');
  g.assert(touched === true, 'the drag was registered');
  s = await g.state();
  g.assert(s.remarks.includes('moving the question'), 'moving-the-question line: ' + s.remarks);
  const mm2 = await g.levelVar('mmTop');
  g.assert(mm2 > 142, 'readout followed the drag: ' + mm2);
  g.assert(s.lives === 1, 'dragging is free: ' + JSON.stringify(s));
  await g.shot('dragged');

  // the bottom line was never touched
  const bl = await g.levelVar('bottomLen');
  g.assert(bl === 360, 'bottom line unchanged: ' + bl);
  g.assert(BOT_Y > TOP_Y, 'bottom line sits below the top line');

  // ── now TOP is true ────────────────────────────────────────────────────────
  await g.click(TOP_BTN.x, TOP_BTN.y);
  await g.wait(1200);
  s = await g.state();
  g.assert(s.phase === 'win', 'TOP wins once it is actually longer: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing: ' + JSON.stringify(s));
  await g.shot('win');
};
