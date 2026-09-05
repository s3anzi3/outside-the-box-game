// Real game Q26 "The Cookie": one hundred real clicks win, the examiner narrates on the
// way, and the squish clock freezes while the exam is paused.
// This level has no heart-costing trap by design (the mock's whole joke is that there is
// no trick, and the examiner says so at 75), so the conventional instinct -- hunting the
// paper for a shortcut instead of clicking -- is asserted to be FREE, not to cost a heart.
// Layout at 1280x860: play area x 118..1162, y 171..552; cookie centre (640, 361.5);
// pause button centre ~ (1136,147).
module.exports = async (page, g) => {
  await g.goto(26);
  await g.wait(600);
  await g.shot('start');

  const COOKIE = { x: 640, y: 171 + 381 * 0.50 };

  let s = await g.state();
  g.assert(s.phase === 'active', 'the level is live: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'three hearts to start: ' + s.lives);
  g.assert(s.remarks.includes('endurance test'), 'opening remark: ' + s.remarks);

  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 3, 'three hearts in the HUD: ' + JSON.stringify(ch.hearts));

  // ── the conventional instinct: look for a shortcut anywhere but the cookie ──
  await g.click(300, 250); await g.wait(80);
  await g.click(950, 230); await g.wait(80);
  await g.click(640, 500); await g.wait(300);
  s = await g.state();
  g.assert(s.lives === 3, 'hunting the paper is free, this level costs no hearts: ' + JSON.stringify(s));
  g.assert(s.phase === 'active', 'still playing: ' + JSON.stringify(s));
  g.assert((await g.levelVar('clicks')) === 0, 'nothing but the cookie counts: ' + (await g.levelVar('clicks')));

  // ── fifty real clicks ──────────────────────────────────────────────────────
  for (let i = 0; i < 50; i++) { await g.click(COOKIE.x, COOKIE.y); await g.wait(15); }
  await g.wait(900);
  s = await g.state();
  g.assert((await g.levelVar('clicks')) === 50, 'counter at 50: ' + (await g.levelVar('clicks')));
  g.assert((await g.levelVar('bites')) === 5, 'five bites taken: ' + (await g.levelVar('bites')));
  g.assert((await g.levelVar('crumbs')) === 20, 'four crumbs per bite: ' + (await g.levelVar('crumbs')));
  g.assert(s.remarks.startsWith('Halfway'), 'narration at 50: ' + s.remarks);
  g.assert(s.lives === 3, 'still three hearts: ' + s.lives);
  await g.shot('halfway');

  // ── the level clock runs, then freezes while paused ────────────────────────
  const tA = await g.levelVar('elapsed');
  await g.wait(1200);
  const tB = await g.levelVar('elapsed');
  g.assert(tB - tA > 0.5, 'the level clock runs while playing: ' + tA + ' -> ' + tB);

  const pz = (await g.chrome()).pause || { x: 1119, y: 130, w: 34, h: 34 };
  await g.click(pz.x + pz.w / 2, pz.y + pz.h / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the pause button paused the exam: ' + JSON.stringify(s));
  const tC = await g.levelVar('elapsed');
  await g.wait(1200);
  const tD = await g.levelVar('elapsed');
  g.assert(Math.abs(tD - tC) < 0.25, 'the level clock freezes while paused: ' + tC + ' -> ' + tD);
  // clicks do not count while the exam is suspended either
  await g.click(COOKIE.x, COOKIE.y); await g.wait(200);
  g.assert((await g.levelVar('clicks')) === 50, 'a paused click is not a click: ' + (await g.levelVar('clicks')));
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === false, 'Escape resumed the exam: ' + JSON.stringify(s));

  // ── clicks 51..99: the examiner admits there is no trick, then chews ────────
  for (let i = 0; i < 49; i++) { await g.click(COOKIE.x, COOKIE.y); await g.wait(15); }
  await g.wait(700);
  s = await g.state();
  g.assert((await g.levelVar('clicks')) === 99, 'counter at 99: ' + (await g.levelVar('clicks')));
  g.assert((await g.levelVar('bites')) === 9, 'nine bites, one per ten clicks: ' + (await g.levelVar('bites')));
  g.assert(s.remarks.startsWith('Ninety-nine'), 'narration at 99: ' + s.remarks);
  const label = await g.eval(() => window.__gc.state.hudHeartsLabel);
  g.assert(label === 'CANDIDATE CHEWING', 'the hearts label reads CANDIDATE CHEWING at 99: ' + label);
  await g.shot('ninety-nine');

  // ── the hundredth click ────────────────────────────────────────────────────
  await g.click(COOKIE.x, COOKIE.y);
  await g.wait(900);
  s = await g.state();
  g.assert(s.phase === 'win', 'one hundred clicks win: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'the cookie never cost a heart: ' + s.lives);
  g.assert(s.stamp === 'CONSUMED', 'the win stamp reads CONSUMED: ' + s.stamp);
  await g.shot('win');

  // ── the win screen advances to Q27 ─────────────────────────────────────────
  await g.click(640, 171 + 381 * 0.64 + 25);
  await g.wait(500);
  s = await g.state();
  g.assert(s.level === 27, 'CONTINUE advances to Q27: ' + JSON.stringify(s));
  await g.shot('next');
};
