// Real game Q14 "Leave The Room": the ANSWER button is always a trap (a heart every time),
// pausing freezes the level clock, and the solve is to actually leave the window for ~4s.
module.exports = async (page, g) => {
  await g.goto(14);
  await g.wait(400);

  // real mouse movement over the paper arms the trap and steers the proctor's eye
  await g.move(300, 300, 8);
  await g.move(950, 460, 8);
  await g.wait(250);
  g.assert((await g.levelVar('armed')) === true, 'the trap arms after the first interaction');
  await g.shot('start');

  let s = await g.state();
  g.assert(s.lives === 3, 'starts on three hearts: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('watching'), 'opening remark: ' + s.remarks);

  // ANSWER button: play area 171..552, bottom 9%, 190x56 centred
  const ANSWER = { x: 640, y: 171 + 381 * 0.91 - 28 };

  // ── 1. the conventional trap: ANSWER always fails and costs a heart ────────
  await g.click(ANSWER.x, ANSWER.y);
  await g.wait(450);
  s = await g.state();
  g.assert(s.lives === 2, 'ANSWER costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('I was watching'), 'first rebuke: ' + s.remarks);
  await g.shot('answer-trap');

  await g.click(ANSWER.x, ANSWER.y);
  await g.wait(450);
  s = await g.state();
  g.assert(s.lives === 1, 'ANSWER costs a heart every time: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('no answer counts'), 'second rebuke: ' + s.remarks);

  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three heart slots in the HUD: ' + JSON.stringify(ch.hearts));

  // ── 2. pausing freezes the level clock ────────────────────────────────────
  g.assert(typeof (await g.levelVar('elapsed')) === 'number', 'the level clock is exposed on __gc.lv');
  await g.click(1136, 147);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === true, 'the pause control suspended the exam: ' + JSON.stringify(s));
  const before = await g.levelVar('elapsed');
  await g.wait(1400);
  const during = await g.levelVar('elapsed');
  g.assert(Math.abs(during - before) < 0.15, 'clock frozen while paused: ' + before + ' -> ' + during);
  await g.shot('paused');
  await g.key('Escape');
  await g.wait(900);
  s = await g.state();
  g.assert(s.paused === false, 'resumed after Escape');
  const after = await g.levelVar('elapsed');
  g.assert(after > during + 0.3, 'clock runs again after resume: ' + during + ' -> ' + after);

  // ── 3. the intended solution: leave the room for about four seconds ───────
  // The harness runs a single-page context, so leaving the room is the same window
  // blur event a real tab switch fires.
  await g.wait(300);
  if (!(await g.levelVar('awayAt'))) {
    // headless Chromium does not always deliver a real window blur to a backgrounded
    // page; fire the same window event the level listens for.
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await g.wait(200);
  }
  g.assert((await g.levelVar('awayAt')) > 0, 'the room is empty and the away clock is running');

  await g.wait(4200);
  await g.wait(200);
  if (!(await g.levelVar('solvedAt'))) {
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await g.wait(300);
  }
  g.assert((await g.levelVar('solvedAt')) > 0, 'four seconds of empty room stamps the paper');
  await g.shot('stamped');

  await g.wait(1600);
  s = await g.state();
  g.assert(s.phase === 'win', 'returning to an unobserved room wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the intended solution costs nothing: ' + JSON.stringify(s));
  await g.shot('win');
};
