// Real game Q40 "Hold to Reboot": a tap only writes to the panic log (and costs
// nothing), a short hold drains at double speed, pausing freezes the hold timer,
// and a full 1.8 s commit reboots the exam.
// Canvas coords at 1280x860: play area x 118..1162, y 171..552.
// HOLD TO REBOOT is 34% x 20% of the play area at 44% down  -> centre (640, 377).
// Header pause button centre (1136, 146); pause overlay RESUME centre (863, 325.5).
module.exports = async (page, g) => {
  const BX = 640, BY = 377;
  const PAUSE = [1136, 146], RESUME = [863, 325.5];

  await g.goto(40);
  await g.wait(500);
  let s = await g.state();
  g.assert(s.phase === 'active', 'level 40 is active: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('crashed'), 'opening remark: ' + s.remarks);
  await g.shot('start');

  // ── 1. the conventional move: tap the button. It does nothing. ─────────────
  await g.click(BX, BY);
  await g.wait(350);
  s = await g.state();
  const taps1 = await g.levelVar('taps');
  g.assert(s.phase !== 'win', 'a tap does not reboot: ' + JSON.stringify(s));
  g.assert(taps1 === 1, 'the tap was logged as insufficient: taps=' + taps1);
  // Q40 is a no-heart level (faithful to the mock): the trap wastes time, not lives.
  g.assert(s.lives === 3, 'a tap costs no heart here: lives=' + s.lives);

  await g.click(BX, BY);
  await g.wait(450);
  s = await g.state();
  g.assert(s.remarks.indexOf('Commit') >= 0, 'the second tap nudges you to commit: ' + s.remarks);
  await g.shot('tapped');

  // ── 2. a partial hold reboots the chrome, then drains at double speed ──────
  await g.down(BX, BY);
  await g.wait(900);
  s = await g.state();
  const mid = await g.levelVar('held');
  g.assert(mid > 500, 'the hold accumulates: held=' + mid);
  g.assert(s.caption === '·  REBOOTING  ·', 'the chrome reboots while holding: ' + s.caption);
  g.assert((await g.levelVar('rebooting')) === true, 'rebooting flag set');

  // Screenshotting mid-hold (mouse button still physically down) can freeze
  // headless Chromium's rAF loop for this page until the button is released,
  // so the shot is taken right after release instead of during the hold.
  await g.up();
  await g.shot('holding');
  await g.wait(1300);
  const drained = await g.levelVar('held');
  s = await g.state();
  g.assert(drained < 300, 'letting go drains the hold at double speed: held=' + drained);
  g.assert(!s.caption, 'the paper caption is restored on release: ' + s.caption);
  g.assert(s.phase !== 'win', 'a short hold does not reboot');
  await g.shot('drained');

  // ── 3. pausing freezes the hold timer ─────────────────────────────────────
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused, 'the pause control suspended the exam: ' + JSON.stringify(s));

  await g.down(BX, BY);
  await g.wait(2400);            // longer than the 1800 ms hold: must not count
  const heldPaused = await g.levelVar('held');
  await g.up();
  await g.wait(250);
  s = await g.state();
  g.assert(s.paused, 'still paused');
  g.assert(heldPaused === 0, 'the hold timer is frozen while paused: held=' + heldPaused);
  g.assert(s.phase !== 'win', 'a 2.4 s hold while paused does not reboot: ' + JSON.stringify(s));
  await g.shot('paused');

  await g.click(RESUME[0], RESUME[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(!s.paused, 'resumed: ' + JSON.stringify(s));

  // ── 4. the intended solution: commit and hold ─────────────────────────────
  await g.down(BX, BY);
  await g.wait(2600);
  await g.up();
  await g.wait(700);
  s = await g.state();
  g.assert(s.phase === 'win', 'a full hold reboots the exam: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'solved without losing a heart: lives=' + s.lives);
  g.assert(!s.caption, 'REBOOTING caption cleared on the win screen: ' + s.caption);
  await g.shot('win');
};
