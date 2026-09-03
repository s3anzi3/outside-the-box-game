// Q39 v2: D costs a heart until the pause menu's › button issues it; then D wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const D = await centreOf(page, '#ansD');
  await h.click(D.x, D.y); await h.wait(1100);
  let s = await h.state(); h.assert(s.lives === 2 && (await h.events()).includes('remark:That has not been issued yet.'), 'D before issuing costs a heart: ' + s.remarks);
  await h.click(1136, 147); await h.wait(300);
  h.assert((await h.text('#cheatBox')).includes('NOT YET ISSUED'), 'box shows unissued');
  await h.shot('paused-unissued');
  await h.eval(() => document.getElementById('cheatGo').click()); await h.wait(300);
  h.assert((await h.text('#cheatBox')).includes('ISSUED') && !(await h.text('#cheatBox')).includes('NOT'), 'box shows issued');
  await h.shot('paused-issued');
  await h.eval(() => document.getElementById('resumeBtn').click()); await h.wait(200);
  await h.click(D.x, D.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'D wins after issuing');
  await h.shot('win');
};
