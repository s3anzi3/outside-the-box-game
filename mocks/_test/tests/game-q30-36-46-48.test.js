// Real game: the four calm levels I ported by hand (Q30, Q36, Q46, Q48).
module.exports = async (page, g) => {
  // Q30: RED costs a heart, BLUE wins, the typewriter slips and covers
  await g.goto(30); await g.wait(13000);
  let s = await g.state(); g.assert(s.remarks.includes('Corporate says') && !s.remarks.includes('BLU'), 'Q30 typewriter slipped: ' + s.remarks);
  const bw = 160, gap = 36, x0 = 640 - (4 * bw + 3 * gap) / 2, by = 171 + 381 * 0.91 - 30;
  await g.click(x0 + bw / 2, by); await g.wait(400);
  s = await g.state(); g.assert(s.lives === 2, 'Q30 RED costs a heart');
  await g.shot('q30');
  await g.click(x0 + bw + gap + bw / 2, by); await g.wait(600);
  s = await g.state(); g.assert(s.phase === 'win', 'Q30 BLUE wins');

  // Q36: confirming 54 costs a heart; select 56 then confirm wins
  await g.goto(36); await g.wait(300);
  const btnW = 168, gp = 32, sx = 640 - (4 * btnW + 3 * gp) / 2, byy = 171 + 381 * 0.44 + 35;
  await g.click(640, 171 + 381 * 0.74 + 25); await g.wait(400);
  s = await g.state(); g.assert(s.lives === 2, 'Q36 confirming 54 costs a heart');
  await g.click(sx + btnW + gp + btnW / 2, byy); await g.wait(600);
  s = await g.state(); g.assert(s.remarks.includes('decorative'), 'Q36 tag revised remark');
  await g.shot('q36');
  await g.click(640, 171 + 381 * 0.74 + 25); await g.wait(600);
  s = await g.state(); g.assert(s.phase === 'win', 'Q36 56 wins');

  // Q46: WAITED costs a heart; DRAGGED IT wins
  await g.goto(46); await g.wait(300);
  const w46 = 300, gx = 28, y0 = 171 + 381 * 0.5;
  await g.click(640 - w46 - gx / 2 + w46 / 2, y0 + 29); await g.wait(400);
  s = await g.state(); g.assert(s.lives === 2, 'Q46 WAITED costs a heart');
  await g.click(640 - w46 - gx / 2 + w46 / 2, y0 + 58 + 18 + 29); await g.wait(600);
  s = await g.state(); g.assert(s.phase === 'win', 'Q46 DRAGGED IT wins');
  await g.shot('q46');

  // Q48: YES costs a heart; CHEAT wins with the CHEATED stamp
  await g.goto(48); await g.wait(300);
  const tw = 168, tg = 32, tx = 640 - (4 * tw + 3 * tg) / 2;
  await g.click(tx + tw / 2, 171 + 381 * 0.38 + 30); await g.wait(400);
  s = await g.state(); g.assert(s.lives === 2, 'Q48 YES costs a heart');
  await g.click(640, 171 + 381 * 0.66 + 30); await g.wait(300);
  s = await g.state(); g.assert(s.phase === 'win' && s.stamp === 'CHEATED', 'Q48 CHEAT wins with CHEATED stamp: ' + JSON.stringify(s));
  await g.shot('q48');
};
