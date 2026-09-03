// Q44 Sign the Confession: accusing a suspect costs a heart; clicking the signature line signs and wins with a CONFESSED stamp.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const ada = await centreOf(page, '#cardADA');
  await h.click(ada.x, ada.y); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'accusing Ada costs a heart');
  await h.shot('accused');
  const line = await centreOf(page, '#sigline');
  await h.click(line.x, line.y); await h.wait(2600);
  s = await h.state(); h.assert(s.win, 'signature wins: ' + JSON.stringify(s));
  h.assert((await h.events()).includes('stamp:CONFESSED'), 'stamp reads CONFESSED');
  await h.shot('win');
};
