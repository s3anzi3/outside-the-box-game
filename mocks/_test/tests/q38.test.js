// Q38 The Other Button: first left click costs a heart, later left clicks are free, right click wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const b = await centreOf(page, '#theButton');
  await h.click(b.x, b.y); await h.wait(300);
  let s = await h.state(); h.assert(s.lives === 2, 'first left click costs a heart');
  await h.click(b.x, b.y); await h.wait(900);
  s = await h.state(); h.assert(s.lives === 2 && s.remarks.includes('Still'), 'second left click is free with escalation: ' + s.remarks);
  await h.click(b.x, b.y); await h.wait(900);
  s = await h.state(); h.assert(s.remarks.includes('two buttons'), 'third hint names the mouse');
  await h.shot('left-clicked');
  await h.rclick(b.x, b.y); await h.wait(1300);
  s = await h.state(); h.assert(s.win, 'right click wins: ' + JSON.stringify(s));
  await h.shot('win');
};
