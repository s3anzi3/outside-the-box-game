// Real game Q42 "Entry Fee": the paper charges one heart to open. A heart lifts out of
// CANDIDATE STANDING and lands in the printed FEE box (standing 3 -> 2, held, not lost).
// The conventional overthink (0 because it is a trick, 2 because it will cost more)
// costs a real heart. The answer is 1, read straight off the fee box, and the fee flies
// home refunded on the win.
//
// Canvas coordinates are the 1280x860 frame coordinates (getLayout at 1280x860):
//   paper          x 115.2..1164.8, y 122.1..554.7, header band 46px
//   play area      x 115.2..1164.8, y 168.1..554.7   (W 1049.6, H 386.6)
//   fee box        w 96 h 78, right inset 54, top inset 26 -> x 1014.8, y 194.1
//   answer row     w 150, h 58, gap 36, bottom inset 0.09H -> top 461.9, centres y 490.9
//                  0 -> x 361, 1 -> x 547, 2 -> x 733, 3 -> x 919
//   pause button   (1136, 146)      RESUME in the suspension notice (863, 326)
module.exports = async (page, g) => {
  const ANS = { '0': [361, 490.9], '1': [547, 490.9], '2': [733, 490.9], '3': [919, 490.9] };
  const PAUSE = [1136, 146], RESUME = [863, 326];

  await g.goto(42);

  // ── pause immediately, inside the 1.4s before the fee is levied ────────────
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(250);
  let s = await g.state();
  g.assert(s.level === 42, 'on Q42: ' + JSON.stringify(s));
  g.assert(s.paused === true, 'pause button suspends the exam: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert(s.remarks.includes('Admission is being processed'), 'opening remark: ' + s.remarks);
  const ch0 = await g.chrome();
  g.assert(ch0.hearts && ch0.hearts.length === 3, 'three hearts in the HUD: ' + JSON.stringify(ch0.hearts));

  const t0 = await g.levelVar('elapsed');
  g.assert(typeof t0 === 'number' && t0 > 0, 'the level clock was running before the pause: ' + t0);
  await g.wait(1500);                       // longer than the 1.4s the fee waits for
  const t1 = await g.levelVar('elapsed');
  g.assert(t1 === t0, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);
  s = await g.state();
  g.assert(s.lives === 3, 'no fee is taken while the exam is suspended: ' + s.lives);
  g.assert((await g.levelVar('phase')) === 'intro', 'the heart has not moved while paused');
  await g.shot('paused');

  await g.click(RESUME[0], RESUME[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('elapsed');
  g.assert(t2 > t1, 'the clock runs again after resuming: ' + t1 + ' -> ' + t2);
  await g.shot('start');

  // ── the fee: one heart leaves the HUD and lands in the FEE box ─────────────
  await g.wait(3600);                       // 1.4s wait + 1s flight + 0.5s beat + 0.6s fade
  s = await g.state();
  g.assert(s.lives === 2, 'the fee costs a heart off CANDIDATE STANDING: ' + JSON.stringify(s));
  g.assert(s.stamp !== 'INCORRECT', 'the fee is a charge, not a mistake: ' + s.stamp);
  g.assert((await g.levelVar('feePaid')) === true, 'the fee heart has landed');
  g.assert((await g.levelVar('phase')) === 'question', 'the question is open');
  const hud = await g.eval(() => [window.__gc.state.hudHiddenHearts, window.__gc.state.hudHeartsLabel]);
  g.assert(JSON.stringify(hud[0]) === '[2]', 'the third slot is drawn empty: ' + JSON.stringify(hud[0]));
  g.assert(hud[1] === 'CANDIDATE STANDING', 'hearts label: ' + hud[1]);
  const box = await g.levelVar('feeBox');
  g.assert(box && box.cx > 1000 && box.cx < 1120 && box.cy > 190 && box.cy < 280,
    'the FEE box sits top right of the play area: ' + JSON.stringify(box));
  g.assert(s.remarks.includes('How many has this item cost you'), 'the examiner asks it: ' + s.remarks);
  await g.shot('fee-paid');

  // the four amounts are where the layout says they are
  const answers = await g.levelVar('answers');
  g.assert(answers && answers.length === 4, 'four amounts offered: ' + JSON.stringify(answers));
  for (const a of answers) {
    const want = ANS[a.label];
    g.assert(want && Math.abs(a.cx - want[0]) < 2 && Math.abs(a.cy - want[1]) < 2,
      'answer ' + a.label + ' at ' + JSON.stringify(a) + ' vs ' + JSON.stringify(want));
  }

  // ── the conventional trap: overthinking it and answering 2 ─────────────────
  await g.click(ANS['2'][0], ANS['2'][1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.lives === 1, 'the wrong count costs a real heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'stamped incorrect: ' + s.stamp);
  await g.wait(800);
  s = await g.state();
  g.assert(s.remarks.includes('The fee is in the box on the paper'), 'first ladder rung: ' + s.remarks);
  g.assert((await g.levelVar('fails')) === 1, 'one failure recorded');
  await g.shot('trap');

  // ── the intended solution: 1, read straight off the fee box ────────────────
  await g.click(ANS['1'][0], ANS['1'][1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.phase === 'active' && s.lives === 1, 'the fee flies home before the win: ' + JSON.stringify(s));
  g.assert((await g.levelVar('phase')) === 'refunding', 'the refund is in flight');
  await g.shot('refunding');

  await g.wait(1500);                       // the 1s return flight plus a margin
  s = await g.state();
  g.assert(s.phase === 'win', 'one wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the fee is refunded on the win: ' + JSON.stringify(s));
  const hud2 = await g.eval(() => window.__gc.state.hudHiddenHearts);
  g.assert(JSON.stringify(hud2) === '[]', 'the empty slot is filled again: ' + JSON.stringify(hud2));
  const ch1 = await g.chrome();
  g.assert(ch1.hearts && ch1.hearts.length === 3, 'the row is back to three: ' + JSON.stringify(ch1.hearts));
  await g.shot('win');
};
