// Real game Q41 "Reply": the paper is bait (and free), the examiner's blinking caret is a
// live text cursor. Type into his remarks, press Enter, and he writes your answer down as
// his own. Nothing on this level costs a heart, so the "conventional trap" (hunting the
// paper for a button) is asserted to be FREE, not to cost one.
// Layout at 1280x860: play area x 118..1162, y 171..552; pause button centre ~ (1136,146);
// RESUME in the pause overlay ~ (863,325).
module.exports = async (page, g) => {
  await g.goto(41);
  await g.wait(1400);            // let the examiner finish typing his line (33 chars @ 22ms)
  await g.shot('start');

  let s = await g.state();
  g.assert(s.remarks.includes('State your answer. I am listening.'), 'opening remark: ' + s.remarks);
  g.assert(s.lives === 3, 'three hearts to start: ' + s.lives);
  g.assert(s.phase === 'active', 'level is live: ' + JSON.stringify(s));

  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three hearts in the HUD: ' + JSON.stringify(ch.hearts));
  g.assert(ch.remarks && ch.remarks.y > 552, 'the remarks live below the paper: ' + JSON.stringify(ch.remarks));

  const ready = await g.levelVar('ready');
  g.assert(ready === true, 'his line has finished typing, the caret is handed over: ' + ready);

  // ── the conventional trap: hunt the paper for something to press ───────────
  // The sheet says only "Reply to the examiner." There is no button and no field.
  await g.click(640, 460); await g.wait(120);
  await g.click(640, 300); await g.wait(120);
  await g.click(900, 480); await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 3, 'clicking the paper is free, this level costs no hearts: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('nothing on the paper to press'), 'third click opens the ladder: ' + s.remarks);
  g.assert(s.phase === 'active', 'still playing: ' + JSON.stringify(s));
  await g.shot('paper-is-bait');

  // two more clicks reach the second rung: the caret has always been a cursor
  await g.click(640, 460); await g.wait(120);
  await g.click(640, 460); await g.wait(400);
  s = await g.state();
  g.assert(s.remarks.includes('It has always been a cursor'), 'second ladder rung: ' + s.remarks);
  g.assert(s.lives === 3, 'still free: ' + JSON.stringify(s));

  // ── Enter on nothing is refused, and is also free ──────────────────────────
  await g.key('Enter');
  await g.wait(400);
  s = await g.state();
  g.assert(s.remarks.includes('Say something. Anything. It is not graded.'), 'empty reply refused: ' + s.remarks);
  g.assert(s.phase === 'active' && s.lives === 3, 'an empty reply costs nothing: ' + JSON.stringify(s));

  // ── pausing freezes the level clock and refuses dictation ──────────────────
  await g.click(1136, 146);
  await g.wait(200);
  s = await g.state();
  g.assert(s.paused === true, 'pause button pauses: ' + JSON.stringify(s));
  const t0 = await g.levelVar('elapsed');
  await g.wait(900);
  const t1 = await g.levelVar('elapsed');
  g.assert(Math.abs(t1 - t0) < 0.02, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);
  await g.type('ignored');
  await g.key('Enter');
  await g.wait(300);
  const pausedText = await g.levelVar('text');
  s = await g.state();
  g.assert(pausedText === '', 'the remarks take no dictation while paused: "' + pausedText + '"');
  g.assert(s.paused === true && s.phase !== 'win', 'paused input is inert: ' + JSON.stringify(s));
  await g.shot('paused');

  await g.click(863, 325);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  await g.wait(600);
  const t3 = await g.levelVar('elapsed');
  g.assert(t3 > t2, 'the clock runs again after resuming: ' + t2 + ' -> ' + t3);

  // ── the intended solution: dictate into his remarks and press Enter ────────
  await g.type('anything');
  await g.wait(300);
  let typed = await g.levelVar('text');
  g.assert(typed === 'anything', 'letters land inside his remarks: "' + typed + '"');
  const focused = await g.levelVar('focused');
  g.assert(focused === true, 'the caret is the candidate\'s now: ' + focused);

  await g.key('Backspace');
  await g.wait(200);
  typed = await g.levelVar('text');
  g.assert(typed === 'anythin', 'Backspace deletes a letter: "' + typed + '"');
  await g.type('g');
  await g.wait(200);

  const dictX = await g.levelVar('dictX');
  const caretX = await g.levelVar('caretX');
  const caretY = await g.levelVar('caretY');
  g.assert(dictX > 304 && caretX > dictX, 'the dictation is drawn after his line: ' + dictX + ' / ' + caretX);
  g.assert(caretY > 552, 'and it sits in the examiner panel, not on the paper: ' + caretY);
  await g.shot('dictated');

  s = await g.state();
  g.assert(s.lives === 3, 'still three hearts before the reply: ' + JSON.stringify(s));

  await g.key('Enter');
  await g.wait(400);
  s = await g.state();
  g.assert(s.remarks.includes('Received. I have written it down as my own.'), 'he takes it: ' + s.remarks);
  const sent = await g.levelVar('sent');
  g.assert(sent === true, 'the reply is sent: ' + sent);

  await g.wait(1600);
  s = await g.state();
  g.assert(s.phase === 'win', 'a reply of any kind passes the item: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'the whole item cost nothing: ' + JSON.stringify(s));
  await g.shot('win');
};
