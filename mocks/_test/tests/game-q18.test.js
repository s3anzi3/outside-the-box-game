// Real game Q18 "Binary Logic".
// The paper shows only "1 + 1 = ?" and a blank. The base-2 fine print is gone; the
// only clue is the examiner mentioning that the machine grading this counts in
// binary. Typing 2 (the conventional answer) slams INCORRECT and costs a heart.
// Typing 10 passes. Enter and the SUBMIT button both submit.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   play area      x 118..1162, y 171..552
//   pause button   (1136, 147)   (read from g.chrome().pause when available)
//   pause overlay  RESUME centre ~ (863.4, 325.1)
//   answer field   ~ (640, 398) 260x58   (read from window.__gc.lv)
//   SUBMIT button  ~ (640, 478) 200x48   (read from window.__gc.lv)
module.exports = async (page, g) => {
  const RESUME = [863.4, 325.1];

  const centreOf = async (prefix) => {
    const x = await g.levelVar(prefix + 'X');
    const y = await g.levelVar(prefix + 'Y');
    const w = await g.levelVar(prefix + 'W');
    const h = await g.levelVar(prefix + 'H');
    g.assert(typeof x === 'number' && typeof w === 'number', prefix + ' rect is exposed: ' + JSON.stringify([x, y, w, h]));
    return [x + w / 2, y + h / 2];
  };

  // ── first sitting: the drier rungs of the ladder ───────────────────────────
  await g.goto(18);
  await g.wait(400);

  let s = await g.state();
  g.assert(s.level === 18 && s.screen === 'level', 'on Q18: ' + JSON.stringify(s));
  g.assert(s.phase === 'active', 'the item is live: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert(s.remarks.includes('Simple arithmetic. One plus one.'), 'opening remark: ' + s.remarks);
  g.assert(s.remarks.includes('counts in binary'), 'the only clue is the examiner: ' + s.remarks);
  g.assert(!s.remarks.includes('fine print'), 'the base-2 fine print is gone: ' + s.remarks);

  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three hearts in the HUD: ' + JSON.stringify(ch.hearts));

  const field = await centreOf('field');
  const submit = await centreOf('btn');
  g.assert(field[0] > 118 && field[0] < 1162 && field[1] > 171 && field[1] < 552,
    'the blank sits inside the play area: ' + JSON.stringify(field));
  g.assert(submit[1] > field[1], 'SUBMIT sits below the blank: ' + JSON.stringify(submit));
  await g.shot('start');

  // the field takes real keystrokes and caps at six characters
  await g.click(field[0], field[1]);
  await g.wait(150);
  g.assert((await g.levelVar('focused')) === true, 'clicking the blank focuses it');
  await g.type('1234567890');
  await g.wait(200);
  g.assert((await g.levelVar('value')) === '123456', 'the blank holds six characters: ' + (await g.levelVar('value')));
  for (let i = 0; i < 6; i++) await g.key('Backspace');
  await g.wait(150);
  g.assert((await g.levelVar('value')) === '', 'Backspace clears it: "' + (await g.levelVar('value')) + '"');

  // an empty submit is refused and costs nothing
  await g.key('Enter');
  await g.wait(250);
  s = await g.state();
  g.assert(s.lives === 3 && s.phase === 'active', 'an empty answer is free: ' + JSON.stringify(s));

  // a plain miss: the first rung is dry
  await g.type('4');
  await g.key('Enter');
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'a wrong answer costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT is slammed on the paper: ' + s.stamp);
  g.assert(s.remarks.includes('That is not even close.'), 'ladder rung 1: ' + s.remarks);
  g.assert((await g.levelVar('value')) === '', 'the blank is cleared for the retry');

  // "ten" in words is close but not the machine's language
  await g.type('ten');
  await g.click(submit[0], submit[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 1, 'the SUBMIT button submits too, and a near miss costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Write it the way the machine would.'), 'the near-miss rung: ' + s.remarks);
  g.assert(s.phase === 'active' && s.gameOver === false, 'still playing on one heart: ' + JSON.stringify(s));
  await g.shot('ladder');

  // ── second sitting: the trap, the pause, and the answer ────────────────────
  await g.goto(18);
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 3 && s.phase === 'active', 'fresh entry resets the item: ' + JSON.stringify(s));
  g.assert((await g.levelVar('value')) === '' && (await g.levelVar('fails')) === 0, 'module state was reset on fresh entry');

  const field2 = await centreOf('field');
  await g.click(field2[0], field2[1]);
  await g.wait(150);

  // ── the conventional trap: 1 + 1 = 2 ───────────────────────────────────────
  await g.type('2');
  await g.wait(150);
  g.assert((await g.levelVar('value')) === '2', 'the conventional answer is typed in');
  await g.key('Enter');
  await g.wait(450);
  s = await g.state();
  g.assert(s.lives === 2, 'the conventional answer costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT: ' + s.stamp);
  g.assert(s.remarks.includes('The machine disagrees. It only knows two digits.'), 'the machine line: ' + s.remarks);
  g.assert(s.phase === 'active', 'the item is still open: ' + JSON.stringify(s));
  await g.shot('trap');

  // ── pausing freezes the level clock and refuses input ──────────────────────
  const ch2 = await g.chrome();
  const pause = ch2.pause ? [ch2.pause.x + ch2.pause.w / 2, ch2.pause.y + ch2.pause.h / 2] : [1136, 147];
  await g.click(pause[0], pause[1]);
  await g.wait(250);
  s = await g.state();
  g.assert(s.paused === true, 'the pause control suspends the exam: ' + JSON.stringify(s));

  const t0 = await g.levelVar('elapsed');
  g.assert(typeof t0 === 'number', 'the level clock is readable: ' + t0);
  await g.wait(900);
  const t1 = await g.levelVar('elapsed');
  g.assert(Math.abs(t1 - t0) < 0.02, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);

  await g.type('10');
  await g.key('Enter');
  await g.wait(300);
  s = await g.state();
  g.assert((await g.levelVar('value')) === '', 'the blank takes no keystrokes while paused: "' + (await g.levelVar('value')) + '"');
  g.assert(s.paused === true && s.phase !== 'win', 'Enter is inert while paused: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'pausing is free: ' + s.lives);
  await g.shot('paused');

  await g.click(RESUME[0], RESUME[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  await g.wait(600);
  const t3 = await g.levelVar('elapsed');
  g.assert(t3 > t2, 'the clock runs again after resuming: ' + t2 + ' -> ' + t3);

  // ── the intended solution: 1 + 1 = 10, in the grader's language ────────────
  await g.click(field2[0], field2[1]);
  await g.wait(150);
  await g.type('10');
  await g.wait(200);
  g.assert((await g.levelVar('value')) === '10', 'the binary answer is typed in');
  await g.shot('answered');

  await g.key('Enter');
  await g.wait(600);
  s = await g.state();
  g.assert(s.phase === 'win', '10 passes the item: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the win costs nothing further: ' + s.lives);
  g.assert(s.stamp === 'CORRECT', 'CORRECT is stamped on the win: ' + s.stamp);
  await g.shot('win');
};
