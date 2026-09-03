// Q33 Misplaced: accusing a word costs a heart, clicking "because" is free, wrong drop costs, dropping "because" in the gap wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);

module.exports = async (page, h) => {
  await h.wait(2600); // line 1 finishes typing (about 90 chars × 22 ms)
  h.assert(await h.has('#gap'), 'gap rendered in the remarks');
  const cert = await centreOf(page, '.w[data-w="certifies"]');
  const bec = await centreOf(page, '.w[data-w="because"]');
  const gap = await centreOf(page, '#gap');

  await h.click(cert.x, cert.y); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'accusing a normal word costs a heart');
  await h.click(bec.x, bec.y); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 2, 'clicking because is free');
  await h.shot('accused');

  await h.drag(cert.x, cert.y, gap.x, gap.y, 25); await h.wait(500);
  s = await h.state(); h.assert(s.lives === 1, 'wrong word in the gap costs a heart');

  await h.drag(bec.x, bec.y, 400, 450, 10); await h.wait(300);
  s = await h.state(); h.assert(s.lives === 1 && !s.win, 'stray drop is free');

  await h.drag(bec.x, bec.y, gap.x, gap.y, 25); await h.wait(1800);
  s = await h.state(); h.assert(s.win, 'because in the gap wins: ' + JSON.stringify(s));
  h.assert((await h.text('#gap')).includes('because'), 'gap filled');
  await h.shot('win');
};
