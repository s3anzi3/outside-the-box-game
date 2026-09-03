// Q46 Recall: a wrong memory costs a heart; DRAGGED IT wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const w = await centreOf(page, '#ansWAIT'), d = await centreOf(page, '#ansDRAG');
  await h.click(w.x, w.y); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'WAITED costs a heart');
  await h.shot('wrong');
  await h.click(d.x, d.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'DRAGGED IT wins');
  h.assert(await h.has('.minibar'), 'win screen carries the 100% bar');
  await h.shot('win');
};
