// Real game Q24 — Easy One.
// "15 + 15 = ?" is exactly what it looks like. The trap is the ten pieces of
// helpful exam software ringing the answers: HINT, CALCULATE, EASY MODE ON,
// SHOW STEPS, SKIP, CONFIRM, CHECK ANSWER, USE CALCULATOR, SUBMIT ALL, SOLVE.
// Every one of them slams INCORRECT and costs a heart, and leaves a graphite
// TRIED tick behind. The solution is to click 30 and stop.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   play area      x 118..1162, y 171..552   (read exactly from g.chrome().play)
//   pause button   (1136, 147)               (also read from g.chrome().pause)
//   pause overlay  pad 0.05W -> RESUME centre ~ (862.8, 326.2)
module.exports = async (page, g) => {
  const DECOYS = [
    { label: 'HINT',           fx: 0.02, fy: 0.04, fw: 0.14, fh: 0.09 },
    { label: 'CALCULATE',      fx: 0.84, fy: 0.04, fw: 0.14, fh: 0.09 },
    { label: 'EASY  MODE  ON', fx: 0.32, fy: 0.03, fw: 0.22, fh: 0.08 },
    { label: 'SHOW STEPS',     fx: 0.01, fy: 0.40, fw: 0.18, fh: 0.09 },
    { label: 'SKIP  →',        fx: 0.83, fy: 0.40, fw: 0.15, fh: 0.09 },
    { label: 'CONFIRM',        fx: 0.29, fy: 0.71, fw: 0.20, fh: 0.11 },
    { label: 'CHECK ANSWER',   fx: 0.02, fy: 0.74, fw: 0.20, fh: 0.09 },
    { label: 'USE CALCULATOR', fx: 0.76, fy: 0.74, fw: 0.22, fh: 0.09 },
    { label: 'SUBMIT ALL',     fx: 0.22, fy: 0.87, fw: 0.55, fh: 0.10 },
    { label: 'SOLVE',          fx: 0.54, fy: 0.71, fw: 0.12, fh: 0.11 },
  ];

  await g.goto(24);
  await g.wait(450);

  let s = await g.state();
  g.assert(s.level === 24 && s.phase === 'active', 'on Q24: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert(s.remarks.includes('This should be an easy one'), 'opening remark: ' + s.remarks);

  const ch = await g.chrome();
  const play = ch.play;
  g.assert(play && play.w > 900, 'play rect from the chrome: ' + JSON.stringify(play));
  g.assert(play.x > 110 && play.x < 125 && play.y > 160 && play.y < 178,
    'play area is where the mock puts it: ' + JSON.stringify(play));

  const decoyCentre = (i) => {
    const d = DECOYS[i];
    return [play.x + (d.fx + d.fw / 2) * play.w, play.y + (d.fy + d.fh / 2) * play.h];
  };
  // answers: 4 buttons 17% wide, 3% gaps, top at 50% of the play area, 56px tall
  const answerCentre = (i) => [
    play.x + play.w / 2 - (0.17 * 4 + 0.03 * 3) / 2 * play.w + i * 0.20 * play.w + 0.085 * play.w,
    play.y + play.h * 0.50 + 28,
  ];
  const PAUSE = ch.pause ? [ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2] : [1136, 147];
  const pad = play.w * 0.05;
  const RESUME = [play.x + pad + (play.w - pad * 2) * 0.62 + 110,
                  play.y + pad + (play.h - pad * 2) * 0.30 + Math.max(40, (play.h - pad * 2) * 0.13) / 2];

  await g.shot('start');

  // ── exploring is free: hovering and right-clicking cost nothing ────────────
  const blank = [play.x + play.w * 0.05, play.y + play.h * 0.60];
  await g.move(decoyCentre(0)[0], decoyCentre(0)[1], 8);
  await g.wait(150);
  await g.rclick(blank[0], blank[1]);
  await g.click(blank[0], blank[1]);
  await g.wait(250);
  s = await g.state();
  g.assert(s.lives === 3 && s.phase === 'active', 'hover / right-click / blank paper are free: ' + JSON.stringify(s));

  // ── 1. the conventional trap: reach for HINT ───────────────────────────────
  await g.click(decoyCentre(0)[0], decoyCentre(0)[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.lives === 2, 'a decoy costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'a decoy slams INCORRECT: ' + s.stamp);
  g.assert(s.remarks.includes('It IS an easy one. You are the one making it hard.'),
    'decoy remark: ' + s.remarks);
  let tried = await g.levelVar('tried');
  g.assert(Array.isArray(tried) && tried.length === 1 && tried[0] === 'HINT',
    'HINT is ticked TRIED: ' + JSON.stringify(tried));
  g.assert((await g.levelVar('decoyHits')) === 1, 'one decoy hit recorded');
  await g.wait(500);
  await g.shot('tried-tick');

  // ── 2. the second conventional trap: pick a number, then CONFIRM it ────────
  await g.click(decoyCentre(5)[0], decoyCentre(5)[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.lives === 1, 'CONFIRM costs a heart too: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Corporate added those buttons'),
    'second rung of the ladder: ' + s.remarks);
  tried = await g.levelVar('tried');
  g.assert(tried.length === 2 && tried.indexOf('CONFIRM') >= 0,
    'CONFIRM is ticked TRIED as well: ' + JSON.stringify(tried));
  await g.wait(500);
  await g.shot('two-ticks');

  // ── 3. pausing freezes the level clock and blocks input ────────────────────
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  const t0 = await g.levelVar('t');
  g.assert(typeof t0 === 'number', 'the level clock is readable: ' + t0);
  await g.wait(900);
  const t1 = await g.levelVar('t');
  g.assert(t0 === t1, 'the level clock is frozen while paused: ' + t0 + ' -> ' + t1);
  // HINT's left edge pokes out past the overlay's 5% margin: clicking it is ignored
  await g.click(play.x + DECOYS[0].fx * play.w + 6, decoyCentre(0)[1]);
  await g.wait(250);
  s = await g.state();
  g.assert(s.lives === 1 && s.paused === true, 'a decoy click while paused is ignored: ' + JSON.stringify(s));
  await g.shot('paused');
  await g.click(RESUME[0], RESUME[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === false, 'RESUME lifts the suspension: ' + JSON.stringify(s));
  const t2 = await g.levelVar('t');
  g.assert(t2 > t1, 'the clock runs again after RESUME: ' + t1 + ' -> ' + t2);

  // ── 4. the solution: click 30 and stop ─────────────────────────────────────
  await g.click(answerCentre(1)[0], answerCentre(1)[1]);
  await g.wait(900);
  s = await g.state();
  g.assert(s.phase === 'win', 'clicking 30 wins: ' + JSON.stringify(s));
  g.assert(s.lives === 1, 'the win costs nothing: ' + s.lives);
  g.assert(s.stamp === 'CORRECT', 'the win stamps CORRECT: ' + s.stamp);
  await g.shot('win');

  // CONTINUE advances to Q25
  await g.click(640, play.y + play.h * 0.64 + Math.max(44, play.h * 0.13) / 2);
  await g.wait(400);
  s = await g.state();
  g.assert(s.level === 25, 'CONTINUE advances to Q25: ' + JSON.stringify(s));
  await g.shot('continue');
};
