// Q26 The Cookie: one hundred real clicks win; the examiner narrates on the way; no hearts lost.
module.exports = async (page, h) => {
  await h.wait(400);
  const c = { x: 640, y: 171 + 381 * 0.5 };
  for (let i = 0; i < 50; i++) { await h.click(c.x, c.y); await h.wait(15); }
  await h.wait(900);
  let s = await h.state(); h.assert(s.remarks.startsWith('Halfway'), 'narration at 50: ' + s.remarks);
  h.assert((await h.text('#counter')) === '50 / 100', 'counter at 50');
  h.assert((await h.eval(() => document.querySelectorAll('#biteg circle').length)) === 5, 'five bites taken');
  await h.shot('halfway');
  for (let i = 0; i < 50; i++) { await h.click(c.x, c.y); await h.wait(15); }
  await h.wait(1300);
  s = await h.state(); h.assert(s.win && s.lives === 3, 'hundred wins: ' + JSON.stringify(s));
  h.assert((await h.events()).includes('stamp:CONSUMED'), 'stamp reads CONSUMED');
  await h.shot('win');
};
