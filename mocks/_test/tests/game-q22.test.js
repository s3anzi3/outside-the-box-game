// Real game Q22 — Did You Catch That.
// A ten digit number flashes for 750ms and then ten empty slots ask for it back.
// Memorising it is the trap and it costs a heart. The pause button freezes the
// flash timer, the digits stay readable in the lower band of the suspension
// notice, and copying them from there wins.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   play area      x 118..1162, y 171..552   (W 1044, H 381, cx 640, cy 361.5)
//   pause button   (1136, 147)
//   pause overlay  pad 0.05W=52.2 -> ox 170.2, oy 223.2, ow 939.6, oh 276.6
//                  RESUME button x 752.8, y 306.2, 220x40 -> centre (862.8, 326.2)
//   SUBMIT button  cx-85, cy+34, 170x46 -> centre (640, 418.5)
module.exports = async (page, g) => {
  const PAUSE = [1136, 147], RESUME = [862.8, 326.2], SUBMIT = [640, 418.5];

  const until = async (fn, ms = 15000, step = 20) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await fn()) return true; await g.wait(step); }
    return false;
  };
  const phase = () => g.levelVar('phase');
  const waitPhase = (p, ms) => until(async () => (await phase()) === p, ms);

  await g.goto(22);
  await g.wait(400);
  let s = await g.state();
  g.assert(s.level === 22 && s.phase === 'active', 'on Q22: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  g.assert(s.remarks.includes('did you catch that'), 'opening remark: ' + s.remarks);
  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three hearts in the HUD: ' + JSON.stringify(ch.hearts));
  g.assert((await phase()) === 'waiting', 'starts in the waiting phase');
  await g.shot('waiting');

  // The mock's ?wait= idea: shorten the random three-to-eight second wait so the
  // flash is reachable in test time. Sticky across attempts via forceWaitMs.
  // flashMs is widened too: the real 750ms window plus real click dispatch
  // latency is too tight for headless timing to land the pause reliably.
  await g.eval(() => { window.__gc.lv.forceWaitMs = 700; window.__gc.lv.waitMs = 700; window.__gc.lv.flashMs = 3000; });
  g.assert((await g.levelVar('waitMs')) === 700, 'the wait override is honoured');

  // ── the conventional trap: try to memorise it, get it wrong, lose a heart ──
  g.assert(await waitPhase('input', 10000), 'the flash comes and goes on its own');
  const missed = await g.levelVar('code');
  g.assert(typeof missed === 'string' && missed.length === 10, 'a ten digit code: ' + missed);
  await g.shot('slots');

  // a candidate who half-caught it types one digit wrong
  const nearMiss = String((Number(missed[0]) + 1) % 10) + missed.slice(1);
  await g.type(nearMiss);
  g.assert((await g.levelVar('input')) === nearMiss, 'the slots take real keystrokes');
  await g.key('Enter');
  await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'a wrong sequence costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT is slammed on the paper: ' + s.stamp);
  g.assert(s.remarks.includes('stop time'), 'hint ladder rung 1: ' + s.remarks);
  g.assert((await phase()) === 'waiting', 'a miss draws a new number and starts over');
  const redrawn = await g.levelVar('code');
  g.assert(typeof redrawn === 'string' && redrawn.length === 10, 'a fresh number is drawn: ' + redrawn);
  g.assert((await g.levelVar('input')) === '', 'the slots are cleared for the retry');
  await g.shot('trap');

  // ── the intended solution: pause mid flash and read the digits at leisure ──
  g.assert(await waitPhase('flash', 10000), 'caught the flash starting');
  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'pausing is free: ' + s.lives);
  g.assert((await phase()) === 'flash', 'suspended mid flash, not after it');
  const cart = await g.eval(() => window.__gc.state.pauseCartouche);
  g.assert(cart === 'Examination Suspended (convenient)', 'the notice admits it: ' + cart);

  // pausing freezes the flash timer: the digits do not time out while suspended
  const t0 = await g.levelVar('elapsed');
  g.assert(typeof t0 === 'number', 'the phase clock is readable: ' + t0);
  await g.wait(1400);
  const t1 = await g.levelVar('elapsed');
  g.assert(t0 === t1, 'the flash timer is frozen while paused: ' + t0 + ' -> ' + t1);
  g.assert((await phase()) === 'flash', 'still mid flash after 1.4s of suspension');
  await g.shot('paused-mid-flash');

  // the candidate copies the number off the suspension notice
  const code = await g.levelVar('code');
  g.assert(code.length === 10, 'the flashed number is still on screen: ' + code);

  await g.click(RESUME[0], RESUME[1]);
  await g.wait(350);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('You paused. I saw.'), 'the examiner saw: ' + s.remarks);

  g.assert(await waitPhase('input', 6000), 'the slots come back after the flash');
  await g.type(code);
  g.assert((await g.levelVar('input')) === code, 'the copied number is typed in: ' + code);
  await g.shot('typed');

  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(600);
  s = await g.state();
  g.assert(s.phase === 'win', 'the copied number wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the win costs nothing: ' + s.lives);
  await g.shot('win');
};
