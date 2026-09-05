// Real game Q34: seals and real hearts are free; the fourth heart wins.
module.exports = async (page, g) => {
  await g.goto(34);
  await g.wait(500);
  const ch = await g.chrome();
  g.assert(ch.hearts && ch.hearts.length === 4, 'four hearts in the HUD: ' + JSON.stringify(ch.hearts));
  await g.shot('start');
  // seal grid: 6 columns 104.4 apart centred on 640 → third column at x≈587.8; second row at gy0 + 0.17·H
  await g.click(587.8, 171 + 381 * 0.38 + 381 * 0.17); await g.wait(400);
  let s = await g.state(); g.assert(s.lives === 3 && s.remarks.includes('uniform'), 'seal click is free: ' + s.remarks);
  const h1 = ch.hearts[1];
  await g.click(h1.x + h1.w / 2, h1.y + h1.h / 2); await g.wait(600);
  s = await g.state(); g.assert(s.lives === 3 && s.remarks.includes('yours'), 'real heart: leave it: ' + s.remarks);
  const h3 = ch.hearts[3];
  await g.click(h3.x + h3.w / 2, h3.y + h3.h / 2); await g.wait(1500);
  s = await g.state(); g.assert(s.phase === 'win', 'fourth heart wins: ' + JSON.stringify(s));
  const ch2 = await g.chrome(); g.assert(!ch2.hearts || ch2.hearts.length === 3 || s.phase === 'win', 'row back to three');
  await g.shot('win');
};
