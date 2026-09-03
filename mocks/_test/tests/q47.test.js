// Q47 Change the Facts: SAME and a premature TOP cost hearts; drag the top line longer, then TOP wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const same = await centreOf(page, '#ansSAME'), top = await centreOf(page, '#ansTOP');
  await h.click(same.x, same.y); await h.wait(300);
  let s = await h.state(); h.assert(s.lives === 2, 'SAME costs a heart');
  await h.click(top.x, top.y); await h.wait(300);
  s = await h.state(); h.assert(s.lives === 1, 'TOP while equal costs a heart');
  await h.shot('equal');
  // drag the top line's right handle outward (play coords 702,122 → frame 820,293)
  await h.drag(820, 293, 930, 293, 20); await h.wait(300);
  const d = await h.eval(() => (window.__mock.level.lines.top.x2 - window.__mock.level.lines.top.x1));
  h.assert(d > 420, 'top line lengthened: ' + d);
  await h.shot('amended');
  await h.click(top.x, top.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'TOP wins once it is longer: ' + JSON.stringify(s));
  await h.shot('win');
};
