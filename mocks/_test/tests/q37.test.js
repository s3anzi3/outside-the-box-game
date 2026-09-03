// Q37 Trim Marks: printed buttons cost hearts; dragging a right-hand corner tick widens the paper; the revealed 14 wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height, w: r.width * 1280 / f.width };
}, sel);
const paperW = (h) => h.eval(() => { const r = document.getElementById('paper').getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect(); return r.width * 1280 / f.width; });

module.exports = async (page, h) => {
  await h.wait(500);
  const nine = await centreOf(page, '#ans9');
  await h.click(nine.x, nine.y); await h.wait(300);
  let s = await h.state(); h.assert(s.lives === 2, 'printed button costs a heart');
  const w0 = await paperW(h);
  h.assert(w0 < 1060, 'paper starts at normal width: ' + w0);
  // the 14 is clipped: its centre lies outside the paper, so a click there hits nothing
  const c14 = await centreOf(page, '#ans14');
  h.assert(c14.x > 115 + w0, 'the 14 centre is beyond the trim before dragging');
  await h.shot('trimmed');

  // drag the top-right tick outward
  await h.drag(1165, 122, 1290, 122, 25); await h.wait(300);
  const w1 = await paperW(h);
  h.assert(w1 > w0 + 100, 'paper widened: ' + w0 + ' -> ' + w1);
  await h.shot('untrimmed');
  const c14b = await centreOf(page, '#ans14');
  await h.click(c14b.x, c14b.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, '14 wins: ' + JSON.stringify(s));
  await h.shot('win');
};
