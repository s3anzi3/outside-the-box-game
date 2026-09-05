// Real game Q33 "Misplaced": accusing a word costs a heart, dropping the wrong word in the
// examiner's gap costs a heart, dragging "because" down into the gap returns it and wins.
// Layout at 1280x860: play area x 118..1162, y 171..552; pause button centre ~ (1136,146).
module.exports = async (page, g) => {
  await g.goto(33);
  await g.wait(2600);            // let the examiner finish typing his line
  await g.shot('start');

  let s = await g.state();
  g.assert(s.remarks.includes('Quality control.'), 'opening remark: ' + s.remarks);
  g.assert(s.remarks.includes('______'), 'the remark carries the gap: ' + s.remarks);
  g.assert(s.lives === 3, 'three hearts to start: ' + s.lives);

  // the level lays the paragraph out itself, so ask it where the words landed
  const gap = await g.levelVar('gap');
  g.assert(gap && gap.w > 0, 'gap measured inside the remarks: ' + JSON.stringify(gap));
  g.assert(gap.cy > 552, 'the gap lives in the examiner panel, below the paper: ' + JSON.stringify(gap));
  const first = await g.levelVar('firstWord');
  const lost = await g.levelVar('lostWord');
  g.assert(first && lost, 'word rects exposed: ' + JSON.stringify([first, lost]));
  g.assert(lost.cx > 118 && lost.cx < 1162 && lost.cy > 171 && lost.cy < 552, 'paragraph sits in the play area: ' + JSON.stringify(lost));

  // ── the conventional trap: accuse a word on the page (proofreading instinct) ──
  await g.click(first.cx, first.cy);
  await g.wait(1000);
  s = await g.state();
  g.assert(s.lives === 2, 'accusing a word costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('not the same as misspelled'), 'first ladder rung: ' + s.remarks);
  await g.shot('accused');

  // clicking "because" is free: it is the right word, it is only lost
  await g.click(lost.cx, lost.cy);
  await g.wait(700);
  s = await g.state();
  g.assert(s.lives === 2, 'clicking because is free: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('It is lost.'), 'because is named, not blamed: ' + s.remarks);

  // ── dropping the wrong word into the examiner's gap also costs a heart ──────
  const gapCx = gap.x + gap.w / 2;
  await g.drag(first.cx, first.cy, gapCx, gap.cy, 25);
  await g.wait(1000);
  s = await g.state();
  g.assert(s.lives === 1, 'a foreign word in the gap costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('not my word'), 'he rejects it: ' + s.remarks);
  await g.shot('rejected');

  // ── pausing freezes the level clock and refuses input ──────────────────────
  await g.click(1136, 146);
  await g.wait(200);
  s = await g.state();
  g.assert(s.paused === true, 'pause button pauses: ' + JSON.stringify(s));
  const t0 = await g.levelVar('elapsed');
  await g.wait(900);
  const t1 = await g.levelVar('elapsed');
  g.assert(Math.abs(t1 - t0) < 0.02, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);
  // and the puzzle cannot be solved through the suspension notice
  await g.drag(lost.cx, lost.cy, gapCx, gap.cy, 20);
  await g.wait(500);
  s = await g.state();
  g.assert(s.paused === true && s.phase !== 'win' && s.lives === 1, 'paused input is inert: ' + JSON.stringify(s));
  await g.shot('paused');

  // RESUME sits in the pause overlay's right column: (167.7 + 944.6*0.62) .. +220, y 305..345
  await g.click(863, 325);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  await g.wait(600);
  const t3 = await g.levelVar('elapsed');
  g.assert(t3 > t2, 'the clock runs again after resuming: ' + t2 + ' -> ' + t3);

  // ── the intended solution: hand the examiner his word back ─────────────────
  const lost2 = await g.levelVar('lostWord');
  const gap2 = await g.levelVar('gap');
  await g.drag(lost2.cx, lost2.cy, gap2.x + gap2.w / 2, gap2.cy, 30);
  await g.wait(400);
  const filled = await g.levelVar('filled');
  g.assert(filled === true, 'the gap now reads because');
  await g.wait(1600);
  s = await g.state();
  g.assert(s.phase === 'win', 'returning the word wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing: ' + JSON.stringify(s));
  await g.shot('win');
};
