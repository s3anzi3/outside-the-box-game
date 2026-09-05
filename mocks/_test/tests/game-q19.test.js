// Real game Q19 "The Pattern": a type-in blank instead of answer buttons.
// O T T F F S S ? are the first letters of One..Seven, so the answer is a capital E.
// A lowercase e and an 8 each cost a heart with their own line; an empty blank costs
// nothing; pausing freezes the level clock and refuses typed input; E wins.
// Canvas coords at 1280x860: play area x 118..1162, y 171..552 (W 1044, H 381, cx 640).
// blank: y 171 + 381*0.54 = 376.7, h 58  -> centre (640, 405.7)
// SUBMIT: y 171 + 381*0.76 = 460.6, h 48 -> centre (640, 484.6)
module.exports = async (page, g) => {
  const FIELD = [640, 405.7];
  const SUBMIT = [640, 484.6];

  await g.goto(19);
  await g.wait(500);
  let s = await g.state();
  g.assert(s.phase === 'active', 'level 19 is active: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'three hearts at the start: ' + s.lives);
  g.assert(s.remarks.indexOf('Continue the pattern') >= 0, 'opening remark: ' + s.remarks);
  await g.shot('start');

  // ── 0. an empty blank is not an answer: SUBMIT costs nothing ──────────────
  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.lives === 3, 'submitting an empty blank is free: lives=' + s.lives);
  g.assert(s.phase === 'active', 'still active after an empty submit');

  // ── 1. the conventional trap: the answer is right, the case is not ────────
  await g.click(FIELD[0], FIELD[1]);
  await g.wait(150);
  await g.type('e');
  await g.wait(200);
  g.assert((await g.levelVar('typed')) === 'e', 'the blank takes typed text: ' + (await g.levelVar('typed')));
  await g.key('Enter');
  await g.wait(450);
  s = await g.state();
  g.assert(s.lives === 2, 'a lowercase e costs a heart: lives=' + s.lives);
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT stamp: ' + s.stamp);
  g.assert(s.remarks.indexOf('Case matters') >= 0, 'the case line: ' + s.remarks);
  g.assert((await g.levelVar('typed')) === '', 'the blank is cleared after a wrong answer');
  g.assert(s.phase !== 'win', 'a lowercase e does not win');
  await g.shot('lowercase-e');

  // ── 2. the other trap: 8, submitted with the button ───────────────────────
  await g.type('8');
  await g.wait(200);
  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(450);
  s = await g.state();
  g.assert(s.lives === 1, 'an 8 costs a heart: lives=' + s.lives);
  g.assert(s.remarks.indexOf('first letter') >= 0, 'the write-the-letter line: ' + s.remarks);
  g.assert(s.phase !== 'win', 'an 8 does not win');
  await g.shot('eight');

  // ── 3. pausing freezes the level clock and the blank ──────────────────────
  const ch = await g.chrome();
  const pause = ch.pause ? [ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2] : [1136, 147];
  await g.click(pause[0], pause[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused, 'the pause control suspended the exam: ' + JSON.stringify(s));

  const t0 = await g.levelVar('elapsed');
  g.assert(typeof t0 === 'number' && t0 > 0, 'the level clock ran before the pause: ' + t0);
  await g.type('E');
  await g.key('Enter');
  await g.wait(900);
  const t1 = await g.levelVar('elapsed');
  s = await g.state();
  g.assert(t1 === t0, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);
  g.assert((await g.levelVar('typed')) === '', 'the blank refuses typing while paused');
  g.assert(s.phase !== 'win', 'Enter while paused does not win: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'nothing was charged while paused: lives=' + s.lives);
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(350);
  s = await g.state();
  g.assert(!s.paused, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  await g.wait(600);
  const t3 = await g.levelVar('elapsed');
  g.assert(t3 > t2, 'the level clock runs again after resuming: ' + t2 + ' -> ' + t3);

  // ── 4. the intended solution: a capital E ─────────────────────────────────
  await g.type('E');
  await g.wait(200);
  g.assert((await g.levelVar('typed')) === 'E', 'capital E is in the blank');
  await g.key('Enter');
  await g.wait(700);
  s = await g.state();
  g.assert(s.phase === 'win', 'a capital E wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing further: lives=' + s.lives);
  g.assert(s.stamp === 'CORRECT', 'CORRECT stamp on the win: ' + s.stamp);
  await g.shot('win');
};
