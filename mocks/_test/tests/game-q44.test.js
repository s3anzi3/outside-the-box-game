// Real game Q44 "Sign the Confession": accusing a suspect costs a heart (the conventional
// trap), pausing freezes the signature timer, and signing the line wins with a CONFESSED stamp.
//
// Layout at 1280x860 (s = 1): play area x 118..1162, y 171..552.
//   cards  y = PY + PH*0.46, 220x82, gap 28, centred → ADA 392, BEN 640, CLEO 888 (centre y ≈ 387)
//   form   y = PY + PH*0.78; the signature line's rect is also exposed on __gc.lv.
const PY = 171, PH = 381;

module.exports = async (page, g) => {
  await g.goto(44);
  await g.wait(600);
  await g.shot('start');

  let s = await g.state();
  g.assert(s.lives === 3, 'starts on three hearts: ' + JSON.stringify(s));
  g.assert(s.phase === 'active', 'level is active: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('workplace mystery'), 'opening remark: ' + s.remarks);

  // ── the conventional trap: accuse a suspect ────────────────────────────────
  const cardY = PY + PH * 0.46 + 41;
  await g.click(392, cardY);          // ADA
  await g.wait(350);
  s = await g.state();
  g.assert(s.lives === 2, 'accusing ADA costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT stamp on accusation: ' + s.stamp);
  await g.wait(800);
  s = await g.state();
  g.assert(s.remarks.includes('in a meeting'), 'ladder rung 1: ' + s.remarks);
  await g.shot('accused');

  await g.click(888, cardY);          // CLEO
  await g.wait(1300);
  s = await g.state();
  g.assert(s.lives === 1, 'second accusation costs a second heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('paddle was frozen'), 'ladder rung 2: ' + s.remarks);

  // ── the intended solution: sign the line ──────────────────────────────────
  const sigX = await g.levelVar('sigX');
  const sigY = await g.levelVar('sigY');
  const sigW = await g.levelVar('sigW');
  const sigH = await g.levelVar('sigH');
  g.assert(typeof sigX === 'number' && typeof sigW === 'number', 'signature line rect exposed: ' + JSON.stringify([sigX, sigY, sigW, sigH]));
  const sigCx = sigX + sigW / 2, sigCy = sigY + sigH / 2;
  g.assert(sigCx > 118 && sigCx < 1162 && sigCy > PY && sigCy < 552, 'signature line sits in the play area: ' + sigCx + ',' + sigCy);

  await g.click(sigCx, sigCy);
  await g.wait(80);
  g.assert(await g.levelVar('signed'), 'clicking the line starts the signature');

  // ── pausing freezes the signature/win timer ───────────────────────────────
  const ch = await g.chrome();
  const pb = ch.pause ? { x: ch.pause.x + ch.pause.w / 2, y: ch.pause.y + ch.pause.h / 2 } : { x: 1136, y: 147 };
  await g.click(pb.x, pb.y);
  await g.wait(200);
  s = await g.state();
  g.assert(s.paused === true, 'pause button paused the exam: ' + JSON.stringify(s));
  g.assert(s.phase === 'active', 'paused before the win fired: ' + JSON.stringify(s));

  const e1 = await g.levelVar('elapsed');
  const p1 = await g.levelVar('sigProgress');
  await g.wait(900);
  const e2 = await g.levelVar('elapsed');
  const p2 = await g.levelVar('sigProgress');
  g.assert(e1 === e2, 'level clock frozen while paused: ' + e1 + ' -> ' + e2);
  g.assert(p1 === p2, 'signature reveal frozen while paused: ' + p1 + ' -> ' + p2);
  s = await g.state();
  g.assert(s.phase === 'active', 'win timer frozen while paused: ' + JSON.stringify(s));
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(200);
  s = await g.state();
  g.assert(s.paused === false, 'Escape resumed the exam: ' + JSON.stringify(s));

  await g.wait(1600);
  s = await g.state();
  g.assert(s.phase === 'win', 'signing the line wins: ' + JSON.stringify(s));
  g.assert(s.stamp === 'CONFESSED', 'the paper is stamped CONFESSED: ' + s.stamp);
  g.assert(s.lives === 1, 'signing costs nothing: ' + JSON.stringify(s));
  await g.shot('win');
};
