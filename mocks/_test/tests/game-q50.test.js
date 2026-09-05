// Real game Q50 — Your Name.
// The final item asks "What is your name?" and the only accepted answer is the
// name the candidate registered at Q1 (the harness registers "Box"). Typing a
// real-sounding name is the conventional trap: INCORRECT, a heart, cleared field.
// The right name opens the CORRECT screen (with the examiner's last remark) and
// then the certificate, whose serial line records the standing at completion.
//
// Canvas coordinates are the 1280x860 frame coordinates.
//   paper        x 115.2..1164.8, y 122.1..554.7, header band 46px
//   play area    x 115.2..1164.8, y 168.1..554.7   (W 1049.6, H 386.6)
//   name field   w 0.5W = 524.8, h 50.3, top 168.1 + 0.46H = 345.9
//                                                  -> centre (640, 371.1)
//   SUBMIT       w 220, h 46.4, top 168.1 + 0.66H = 423.3
//                                                  -> centre (640, 446.5)
//   pause button (1135.8, 145.1)  (read from g.chrome().pause when present)
//   VIEW CERTIFICATE  w 300, h 60.2, top 0.62h = 533.2   -> centre (640, 563.3)
//   MAIN MENU (cert)  w 240, h 49.9, top 705.7           -> centre (640, 730.6)
module.exports = async (page, g) => {
  const FIELD = [640, 371.1];
  const SUBMIT = [640, 446.5];
  const VIEW_CERT = [640, 563.3];

  await g.goto(50);
  await g.wait(500);
  let s = await g.state();
  g.assert(s.level === 50 && s.phase === 'active', 'on Q50: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'starts on three hearts: ' + s.lives);
  const registered = await g.levelVar('registered');
  g.assert(registered === 'Box', 'the registered name is the one typed at Q1: ' + registered);
  g.assert((await g.levelVar('typed')) === '', 'the field starts empty: ' + (await g.levelVar('typed')));

  // the pause control only exists while the question is on the paper
  const chrome = await g.chrome();
  const PAUSE = chrome.pause
    ? [chrome.pause.x + chrome.pause.w / 2, chrome.pause.y + chrome.pause.h / 2]
    : [1135.8, 145.1];
  await g.shot('start');

  // ── the conventional trap: answer with your own name ──────────────────────
  await g.click(FIELD[0], FIELD[1]);
  await g.wait(150);
  g.assert((await g.levelVar('focused')) === true, 'clicking the field focuses it');
  await g.type('Sean');
  await g.wait(250);
  g.assert((await g.levelVar('typed')) === 'Sean', 'real typing reaches the field: ' + (await g.levelVar('typed')));

  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(450);
  s = await g.state();
  g.assert(s.lives === 2, 'answering with your own name costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'the INCORRECT stamp slams: ' + s.stamp);
  g.assert(s.remarks.includes('That is not the name you gave me'),
    'the examiner has it written down: ' + s.remarks);
  g.assert((await g.levelVar('typed')) === '', 'the field is cleared: ' + (await g.levelVar('typed')));
  g.assert((await g.levelVar('fails')) === 1, 'one fail recorded: ' + (await g.levelVar('fails')));
  await g.shot('trap');

  // ── suspending the exam freezes the level clock and the field ─────────────
  await g.click(FIELD[0], FIELD[1]);
  await g.wait(150);
  const running = await g.levelVar('t');
  g.assert(typeof running === 'number' && running > 0, 'the level clock is running: ' + running);

  await g.click(PAUSE[0], PAUSE[1]);
  await g.wait(400);
  s = await g.state();
  g.assert(s.paused === true, 'the exam is suspended: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'pausing is free: ' + s.lives);
  const t0 = await g.levelVar('t');
  await g.wait(900);
  const t1 = await g.levelVar('t');
  g.assert(t0 === t1, 'the level clock is frozen while suspended: ' + t0 + ' -> ' + t1);

  await g.type('zz');
  await g.wait(250);
  g.assert((await g.levelVar('typed')) === '', 'the field takes nothing while suspended: ' + (await g.levelVar('typed')));
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(500);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  const t2 = await g.levelVar('t');
  g.assert(t2 > t1, 'the clock runs again once resumed: ' + t1 + ' -> ' + t2);

  // ── the intended solution: the name registered at the very beginning ──────
  await g.click(FIELD[0], FIELD[1]);
  await g.wait(150);
  await g.type('Box');
  await g.wait(250);
  g.assert((await g.levelVar('typed')) === 'Box', 'the registered name is typed in: ' + (await g.levelVar('typed')));

  await g.click(SUBMIT[0], SUBMIT[1]);
  await g.wait(600);
  s = await g.state();
  g.assert(s.phase === 'win', 'the registered name wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the win costs nothing: ' + s.lives);
  g.assert(s.remarks.includes('Certified.') && s.remarks.includes('not a real certificate'),
    "the examiner's last remark lands on the CORRECT screen: " + s.remarks);
  await g.wait(2200);   // let the closing remark finish typing
  await g.shot('win');

  // ── the certificate ───────────────────────────────────────────────────────
  await g.click(VIEW_CERT[0], VIEW_CERT[1]);
  await g.wait(700);
  s = await g.state();
  g.assert(s.phase === 'certificate', 'VIEW CERTIFICATE opens the diploma: ' + JSON.stringify(s));
  g.assert((await g.levelVar('tier')) === 'gold', 'a level-select run is inside the gold window: ' + (await g.levelVar('tier')));
  g.assert((await g.levelVar('standing')) === 2,
    'the serial line records the standing at completion: ' + (await g.levelVar('standing')));
  g.assert(s.lives === 2, 'the certificate costs nothing: ' + s.lives);
  await g.shot('certificate');
};
