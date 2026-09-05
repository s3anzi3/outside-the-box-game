// Real game Q16 "The Honest Option": the paper says nothing ("Select the correct
// answer", four colours, no further information). The whole answer is leaked in the
// examiner's remarks at the bottom: it is the BLUE one. Any other colour slams
// INCORRECT and costs a heart; BLUE holds the CORRECT slam for 750ms on the
// pause-aware level clock and then wins. Pausing freezes that clock and refuses
// every click on the paper.
//
// Canvas coords at the harness viewport (1280x860), from layout.ts:
//   paperY = 860*0.142 = 122.12, headerH = 46      -> topBoxY = 168.12
//   topBoxHeight = 860*0.503 - 46 = 386.58,  topBoxX = 115.2,  topBoxWidth = 1049.6
// (the play area the brief calls x 118..1162, y 171..552)
const TBX = 115.2, TBY = 168.12, TBW = 1049.6, TBH = 386.58;
const CX = 640;

// four choice cards: w 0.182*TBW, h 0.226*TBH, gap 0.031*TBW, top at TBY + 0.46*TBH
const BW = TBW * 0.182;          // 191.03
const BH = TBH * 0.226;          // 87.37
const GAP = TBW * 0.031;         // 32.54
const TOTW = 4 * BW + 3 * GAP;   // 861.72
const BX0 = CX - TOTW / 2;       // 209.14
const BTN_Y = TBY + TBH * 0.46 + BH / 2;                 // 389.63
const btnX = (i) => BX0 + i * (BW + GAP) + BW / 2;       // 304.65 / 528.22 / 751.78 / 975.35
const RED = [btnX(0), BTN_Y], BLUE = [btnX(1), BTN_Y], YELLOW = [btnX(3), BTN_Y];
// a point inside the RED card that no pause-overlay control sits under
// (the overlay's slider/cheat box start at x 299.9, its buttons at x 753.4)
const RED_SAFE = [250, TBY + TBH * 0.46 + BH * 0.85];    // (250, 420.2)

module.exports = async (page, g) => {
  await g.goto(16);
  await g.wait(500);

  let s = await g.state();
  g.assert(s.phase === 'active', 'level 16 is active: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'three hearts at the start: ' + s.lives);
  g.assert(s.remarks.indexOf('BLUE') >= 0, 'the examiner leaks the answer in his remarks: ' + s.remarks);
  await g.shot('start');

  // the level's own geometry must agree with the coordinates this test clicks
  const cxs = await g.levelVar('btnCX');
  const cy = await g.levelVar('btnCY');
  g.assert(Array.isArray(cxs) && cxs.length === 4, 'four choice cards: ' + JSON.stringify(cxs));
  for (let i = 0; i < 4; i++) {
    g.assert(Math.abs(cxs[i] - btnX(i)) <= 2, 'card ' + i + ' centre ' + cxs[i] + ' vs expected ' + btnX(i).toFixed(1));
  }
  g.assert(Math.abs(cy - BTN_Y) <= 2, 'card row centre ' + cy + ' vs expected ' + BTN_Y.toFixed(1));

  // ── 1. the conventional trap: guessing a colour the exam never named ──────
  await g.click(RED[0], RED[1]);
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'RED costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT stamp on a wrong colour: ' + s.stamp);
  g.assert(s.phase !== 'win', 'RED does not win');
  g.assert((await g.levelVar('fails')) === 1, 'one wrong colour recorded');
  await g.shot('red-costs-heart');

  // a second wrong colour costs another heart (the exam is not being coy)
  await g.click(YELLOW[0], YELLOW[1]);
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 1, 'YELLOW costs a heart too: ' + JSON.stringify(s));
  g.assert(s.phase !== 'win', 'YELLOW does not win');

  // clicking the bare paper between the cards is free
  await g.click(CX, TBY + TBH * 0.85);
  await g.wait(250);
  s = await g.state();
  g.assert(s.lives === 1, 'clicking empty paper is free: lives=' + s.lives);

  // ── 2. pausing freezes the level clock and refuses the paper ──────────────
  const ch = await g.chrome();
  const pause = ch.pause ? [ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2] : [1136, 147];
  await g.click(pause[0], pause[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused, 'the pause control suspended the exam: ' + JSON.stringify(s));

  const t0 = await g.levelVar('elapsed');
  g.assert(typeof t0 === 'number' && t0 > 0, 'the level clock ran before the pause: ' + t0);
  await g.click(RED_SAFE[0], RED_SAFE[1]);     // inside the RED card, no overlay control there
  await g.wait(900);
  const t1 = await g.levelVar('elapsed');
  s = await g.state();
  g.assert(t1 === t0, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);
  g.assert(s.lives === 1, 'a click on the paper is refused while paused: lives=' + s.lives);
  g.assert(s.phase !== 'win', 'nothing is graded while paused: ' + JSON.stringify(s));
  g.assert((await g.levelVar('fails')) === 2, 'no wrong answer was recorded while paused');
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(350);
  s = await g.state();
  g.assert(!s.paused, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  await g.wait(600);
  const t3 = await g.levelVar('elapsed');
  g.assert(t3 > t2, 'the level clock runs again after resuming: ' + t2 + ' -> ' + t3);

  // ── 3. the intended solution: the colour the examiner leaked ──────────────
  await g.click(BLUE[0], BLUE[1]);
  await g.wait(120);
  // the CORRECT slam is held for 750ms of level clock before the win screen; if the
  // pause lands inside that window it must hold there too (timing-tolerant probe)
  await g.click(pause[0], pause[1]);
  await g.wait(900);
  s = await g.state();
  if (s.paused && s.phase !== 'win') {
    const p0 = await g.levelVar('elapsed');
    await g.wait(600);
    const p1 = await g.levelVar('elapsed');
    g.assert(p1 === p0, 'the pending win is frozen with the clock: ' + p0 + ' -> ' + p1);
    g.assert((await g.state()).phase !== 'win', 'the win does not land while paused');
    await g.shot('win-held-by-pause');
  } else {
    console.log('  note: the win landed before the pause could be taken (phase=' + s.phase + ', paused=' + s.paused + ')');
  }
  if ((await g.state()).paused) { await g.key('Escape'); await g.wait(300); }

  await g.wait(1400);
  s = await g.state();
  g.assert(s.phase === 'win', 'BLUE wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing further: lives=' + s.lives);
  g.assert(s.stamp === 'CORRECT', 'CORRECT stamp on the win: ' + s.stamp);
  await g.shot('win');
};
