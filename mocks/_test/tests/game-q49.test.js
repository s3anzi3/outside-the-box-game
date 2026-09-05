// Real game Q49 — The Lock.
// Three tumbler dials. The three clues are dealt at random from a pool of twenty
// callbacks, so the combination differs every entry: the test reads it off the
// level's test hook and then sets it with real clicks and a real mouse wheel.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   paper          x 115.2..1164.8, y 122.1..554.7, header band 46px
//   play area      x 115.2..1164.8, y 168.1..554.7   (W 1049.6, H 386.6)
//   dials          w 0.11901W = 124.9, gap 0.04952W = 52.0, block centred on 640
//                  centres x: 463.1, 640.0, 816.9
//                  ▲ top 168.1 + 0.47H = 349.8, h 30      -> centre y 364.8
//                  digit window top 383.8, h 68            -> centre y 417.8
//                  ▼ top 455.8, h 30                       -> centre y 470.8
//   SUBMIT         w 0.2381W = 249.9, h 48, top 168.1 + 0.84H = 492.9
//                                                          -> centre (640, 516.9)
//   pause button   (1135.8, 145.1)
module.exports = async (page, g) => {
  const DIAL_X = [463.1, 640.0, 816.9];
  const UP_Y = 364.8, DIGIT_Y = 417.8, DOWN_Y = 470.8;
  const SUBMIT = [640, 516.9];
  const PAUSE = [1135.8, 145.1];

  await g.goto(49);
  await g.wait(500);
  let s = await g.state();
  g.assert(s.level === 49 && s.phase === 'active', 'on Q49: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);

  const code = await g.levelVar('code');
  g.assert(Array.isArray(code) && code.length === 3 && code.every(n => Number.isInteger(n) && n >= 0 && n <= 9),
    'three digits are dealt: ' + JSON.stringify(code));
  g.assert(!(code[0] === 0 && code[1] === 0 && code[2] === 0),
    'the dials never open on the code: ' + JSON.stringify(code));
  let digits = await g.levelVar('digits');
  g.assert(digits.join(',') === '0,0,0', 'the dials start at zero: ' + JSON.stringify(digits));
  g.assert(s.caption === undefined, 'the cartouche is the ordinary one to begin with: ' + s.caption);
  await g.shot('start');

  // ── the conventional trap: submit the sheet as it was handed to you ───────
  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'submitting 0 0 0 costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'the INCORRECT stamp slams: ' + s.stamp);
  g.assert(s.remarks.indexOf('Clunk') === 0, 'the lock clunks: ' + s.remarks);
  g.assert(s.remarks.includes('already answered'), 'and points back at the exam: ' + s.remarks);
  await g.shot('trap');

  // ── dials one and two: the ▲ button ──────────────────────────────────────
  for (let n = 0; n < code[0]; n++) { await g.click(DIAL_X[0], UP_Y); await g.wait(70); }
  if (code[0] > 0) {
    // the examiner turns to face the dial the moment it lands (left for dial one)
    const facing = await g.eval(() => window.__gc.guideCharDir);
    g.assert(facing === 'left', 'the examiner turns to the first dial as it lands: ' + facing);
  }
  for (let n = 0; n < code[1]; n++) { await g.click(DIAL_X[1], UP_Y); await g.wait(70); }
  await g.wait(200);
  digits = await g.levelVar('digits');
  g.assert(digits[0] === code[0] && digits[1] === code[1],
    'the arrows set the first two dials: ' + JSON.stringify(digits) + ' vs ' + JSON.stringify(code));

  // still not the code (unless the third digit happens to be a zero), so the
  // cartouche has not changed yet
  if (code[2] !== 0) {
    s = await g.state();
    g.assert(s.caption === undefined, 'two of three is not a combination: ' + s.caption);
  }

  // ── dial three: the mouse wheel over the digit window ─────────────────────
  // Overshoot by one and come back, so both wheel directions are exercised even
  // when the third digit is a zero.
  await page.mouse.move(DIAL_X[2], DIGIT_Y);
  for (let n = 0; n <= code[2]; n++) { await page.mouse.wheel(0, -120); await g.wait(70); }
  await g.wait(150);
  digits = await g.levelVar('digits');
  g.assert(digits[2] === (code[2] + 1) % 10, 'the wheel spins the dial up: ' + JSON.stringify(digits));
  await page.mouse.wheel(0, 120);
  await g.wait(250);
  digits = await g.levelVar('digits');
  g.assert(digits.join(',') === code.join(','), 'the wheel spins it back down onto the code: ' +
    JSON.stringify(digits) + ' vs ' + JSON.stringify(code));

  // ── the paper renames itself once all three are right ─────────────────────
  s = await g.state();
  g.assert(s.caption === '·  COMBINATION  ·', 'the cartouche flips to COMBINATION: ' + s.caption);
  g.assert(s.lives === 2, 'setting the dials is free: ' + s.lives);
  await g.shot('set');

  // ── suspending the exam freezes the level clock and the dials ─────────────
  const running = await g.levelVar('t');
  g.assert(typeof running === 'number' && running > 0, 'the level clock is running: ' + running);
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'pausing is free: ' + s.lives);
  const t0 = await g.levelVar('t');
  await g.wait(900);
  const t1 = await g.levelVar('t');
  g.assert(t0 === t1, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);

  await g.click(DIAL_X[0], UP_Y);
  await g.wait(250);
  digits = await g.levelVar('digits');
  g.assert(digits.join(',') === code.join(','), 'the dials do not move while paused: ' + JSON.stringify(digits));
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(500);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('t');
  g.assert(t2 > t1, 'the clock runs again once resumed: ' + t1 + ' -> ' + t2);

  // ── the code opens the lock ───────────────────────────────────────────────
  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(700);
  s = await g.state();
  g.assert(s.phase === 'win', 'the code wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the win costs nothing: ' + s.lives);
  g.assert(s.stamp === 'CORRECT', 'the CORRECT stamp slams: ' + s.stamp);
  await g.shot('win');
};
