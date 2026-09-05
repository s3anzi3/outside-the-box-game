// Real game Q27 — Keys But No Locks.
// The paper prints a riddle whose answer is the instrument the candidate is
// already touching. All four answer buttons are decoys, KEYBOARD included, so
// the conventional move (click the right word) costs a heart. The only way to
// give the answer is to type K-E-Y-B-O-A-R-D on the physical keyboard.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   paper          x 115.2..1164.8, y 122.1..554.7   (header band 46px)
//   play area      x 115.2..1164.8, y 168.1..554.7   (W 1049.6, H 386.6, cx 640)
//   decoy row      btnW 0.1609W=168.9, btnH 0.1365H=52.8, gap 0.022W=23.1
//                  row starts x 267.6, y 168.1+0.66H=423.3 -> centres y 449.7,
//                  x 352.0 (HOUSE), 544.0 (MAP), 736.0 (PIANO), 928.0 (KEYBOARD)
//   pause button   chrome.pause, centre ~= (1136, 147)
//   pause overlay  pad 0.05W=52.5 -> ox 167.7, oy 220.6, ow 944.6, oh 281.6
//                  RESUME 220x40 at (753.4, 305.1) -> centre (863.4, 325.1)
module.exports = async (page, g) => {
  const HOUSE = [352.0, 449.7], KEYBOARD = [928.0, 449.7];
  const RESUME = [863.4, 325.1];

  await g.goto(27);
  await g.wait(450);

  let s = await g.state();
  g.assert(s.level === 27 && s.screen === 'level', 'on Q27: ' + JSON.stringify(s));
  g.assert(s.phase === 'active', 'the level starts active: ' + s.phase);
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert(s.remarks.startsWith('A riddle to test your wits.'), 'opening remark: ' + s.remarks);
  g.assert(s.remarks.includes('the means by which you give it'), 'the opening remark is the whole hint: ' + s.remarks);
  g.assert((await g.levelVar('typed')) === '', 'the buffer starts empty');
  g.assert((await g.levelVar('secret')) === 'KEYBOARD', 'the secret is KEYBOARD');
  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three hearts in the HUD: ' + JSON.stringify(ch.hearts));
  const PAUSE = ch.pause ? [ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2] : [1136, 147];
  await g.shot('riddle');

  // ── the conventional trap: the answer is on the paper, so click it ─────────
  await g.click(KEYBOARD[0], KEYBOARD[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'the KEYBOARD button costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT is slammed on the paper: ' + s.stamp);
  g.assert(s.remarks === 'Yes. That is the word. That is not how you say it.', 'the right word, said wrong: ' + s.remarks);
  g.assert(s.phase === 'active', 'still active after the trap: ' + s.phase);
  await g.shot('keyboard-button');

  // ── typing: faint preview, Backspace, rolling eight letter buffer ──────────
  await g.type('pianox');
  await g.key('Backspace');
  await g.wait(250);
  g.assert((await g.levelVar('typed')) === 'PIANO', 'Backspace erases one letter: ' + (await g.levelVar('typed')));
  s = await g.state();
  g.assert(s.remarks === 'Now we are talking. Keep going.', 'the first letter gets a reaction: ' + s.remarks);
  g.assert(s.lives === 2, 'typing the wrong letters costs nothing: ' + s.lives);
  await g.shot('typing');

  await g.type('abcdefghij');
  await g.wait(200);
  g.assert((await g.levelVar('typed')) === 'CDEFGHIJ', 'the buffer keeps only the last eight: ' + (await g.levelVar('typed')));

  // Space and the arrows never scroll the page and never enter the buffer.
  await g.key('Space'); await g.key('ArrowDown'); await g.key('ArrowUp');
  await g.wait(150);
  g.assert((await g.eval(() => window.scrollY)) === 0, 'Space/arrows must not scroll the page');
  g.assert((await g.levelVar('typed')) === 'CDEFGHIJ', 'non letters never enter the buffer: ' + (await g.levelVar('typed')));

  // ── a second miss on any button escalates the ladder ──────────────────────
  await g.click(HOUSE[0], HOUSE[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 1, 'HOUSE costs a heart too: ' + s.lives);
  g.assert(s.remarks === 'The answer is not on the paper, candidate. It is under your hands.', 'second miss ladder rung: ' + s.remarks);

  // ── pausing freezes the level clock and the keyboard ───────────────────────
  const before = await g.levelVar('elapsed');
  g.assert(typeof before === 'number' && before > 0, 'the level clock is running: ' + before);
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'pausing is free: ' + s.lives);
  const t0 = await g.levelVar('elapsed');
  await g.wait(1300);
  const t1 = await g.levelVar('elapsed');
  g.assert(t0 === t1, 'the level clock is frozen while suspended: ' + t0 + ' -> ' + t1);
  g.assert(t1 >= before, 'the clock advanced before the suspension: ' + before + ' -> ' + t1);

  await g.type('keyboard');
  await g.wait(200);
  s = await g.state();
  g.assert((await g.levelVar('typed')) === 'CDEFGHIJ', 'keys are ignored while suspended: ' + (await g.levelVar('typed')));
  g.assert(s.phase === 'active' && s.paused === true, 'typing while suspended cannot solve: ' + JSON.stringify(s));
  await g.shot('paused');

  await g.click(RESUME[0], RESUME[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  await g.wait(600);
  g.assert((await g.levelVar('elapsed')) > t2, 'the clock runs again after resuming: ' + t2);

  // ── the intended solution: say it the way the riddle asks ─────────────────
  await g.type('keyboar');
  await g.wait(200);
  s = await g.state();
  g.assert(s.phase === 'active', 'not solved one letter early: ' + s.phase);
  g.assert(String(await g.levelVar('typed')).endsWith('KEYBOAR'), 'seven letters in: ' + (await g.levelVar('typed')));

  await g.type('d');
  await g.wait(700);
  s = await g.state();
  g.assert(s.phase === 'win', 'typing KEYBOARD wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing: ' + s.lives);
  g.assert(s.remarks === 'I heard the keys. Everyone hears the keys.', 'closing remark: ' + s.remarks);
  g.assert((await g.levelVar('won')) === true, 'the level records the solve');
  await g.shot('win');

  // after the win the keyboard is inert
  await g.type('house');
  await g.wait(250);
  s = await g.state();
  g.assert(s.phase === 'win' && s.lives === 1 && !s.gameOver, 'post win input is inert: ' + JSON.stringify(s));
};
