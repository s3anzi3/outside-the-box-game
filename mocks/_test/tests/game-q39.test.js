// Real game Q39 — Issued to the Invigilator.
// The paper offers A B C D; every one of them costs a heart while the instruction
// is unissued. The instruction lives in the pause screen: the › button beside the
// INVIGILATOR OVERRIDE box signs it, and only then does D win.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   play area      x 118..1162, y 171..552   (W 1044, H 381)
//   answer row     w 0.1437W=150, h 0.152H=57.9, gap 0.0345W=36, top 171+0.758H=459.8
//                  centres: A 361, B 547, C 733, D 919 at y 488.8
//   pause button   (1136, 147)
//   pause overlay  pad 0.05W=52.2 -> ox 170.2, oy 223.2, ow 939.6, oh 276.6
//                  slider x 301.7, y 372.6, w 220; override box y 410.6 h 38
//                  › button x 533.7..573.7, centre (553.7, 429.6)
//                  RESUME button x 752.8, y 306.2, 220x40 -> centre (862.8, 326.2)
module.exports = async (page, g) => {
  const D = [919, 488.8], A = [361, 488.8];
  const PAUSE = [1136, 147], GO = [553.7, 429.6], BOX = [411, 429.6], RESUME = [862.8, 326.2];

  await g.goto(39);
  await g.wait(500);
  let s = await g.state();
  g.assert(s.level === 39 && s.phase === 'active', 'on Q39: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert((await g.levelVar('issued')) === false, 'starts unissued');
  await g.shot('start');

  // ── the conventional trap: pressing D before it has been issued ────────────
  await g.click(D[0], D[1]);
  await g.wait(250);
  s = await g.state();
  g.assert(s.lives === 2, 'unissued D costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('has not been issued yet'), 'examiner names the problem: ' + s.remarks);
  await g.wait(900);
  s = await g.state();
  g.assert(s.remarks.includes('suspension screen'), 'ladder rung 1: ' + s.remarks);
  await g.shot('trap');

  // a second conventional guess also costs a heart and walks the ladder
  await g.click(A[0], A[1]);
  await g.wait(1000);
  s = await g.state();
  g.assert(s.lives === 1, 'A costs a heart too: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('button beside it'), 'ladder rung 2: ' + s.remarks);

  // ── pausing is free, and it freezes the level clock ────────────────────────
  const before = await g.levelVar('elapsed');
  g.assert(typeof before === 'number' && before > 0, 'level clock is running: ' + before);
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'pausing is free: ' + s.lives);
  const t0 = await g.levelVar('elapsed');
  await g.wait(900);
  const t1 = await g.levelVar('elapsed');
  g.assert(t0 === t1, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);

  const placeholder = await g.eval(() => window.__gc.state.pauseCheatPlaceholder);
  g.assert(placeholder === 'PRESS D · NOT YET ISSUED', 'the override box carries the instruction: ' + placeholder);
  await g.shot('paused');

  // clicking the box says it needs a signature; the button beside it does the work
  await g.click(BOX[0], BOX[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.remarks.includes('It needs a signature'), 'the box points at the button: ' + s.remarks);
  g.assert((await g.levelVar('issued')) === false, 'the box alone does not issue it');
  const stillReadable = await g.eval(() => window.__gc.state.pauseCheatPlaceholder && !window.__gc.state.pauseCheatFocused);
  g.assert(stillReadable === true, 'the instruction stays legible after clicking the box');

  await g.click(GO[0], GO[1]);
  await g.wait(400);
  g.assert((await g.levelVar('issued')) === true, 'the › button issues the instruction');
  const done = await g.eval(() => [window.__gc.state.pauseCheatDone, window.__gc.state.pauseCheatPlaceholder]);
  g.assert(done[0] === true && done[1] === '✓ PRESS D · ISSUED', 'box flips to ISSUED: ' + JSON.stringify(done));
  s = await g.state();
  g.assert(s.remarks.includes('signed it'), 'the examiner confirms: ' + s.remarks);
  g.assert(s.lives === 1, 'issuing is free: ' + s.lives);
  await g.shot('issued');

  // ── resume, then D is a real answer ───────────────────────────────────────
  await g.click(RESUME[0], RESUME[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));

  await g.click(D[0], D[1]);
  await g.wait(600);
  s = await g.state();
  g.assert(s.phase === 'win', 'issued D wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing: ' + s.lives);
  await g.shot('win');
};
