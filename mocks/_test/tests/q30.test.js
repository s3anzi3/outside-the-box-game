// Q30 Checkpoint: a wrong colour costs a heart, BLUE wins, the typewriter slips and backspaces.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(5200);
  let s = await h.state(); h.assert(s.remarks.includes('Corporate says') && !s.remarks.includes('BLU'), 'typewriter slipped and covered: ' + s.remarks);
  const red = await centreOf(page, '#ansRED'), blue = await centreOf(page, '#ansBLUE');
  await h.click(red.x, red.y); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 2, 'RED costs a heart');
  await h.shot('wrong');
  await h.click(blue.x, blue.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'BLUE wins');
  await h.shot('win');
};
