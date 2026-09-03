// Q31 Lights Out: dark presses are free, theme toggle is a misdirect, the logo bulb lights the paper, C wins, A costs a heart.
const centre = (page, sel) => page.evaluate((s) => {
  const r = document.querySelector(s).getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);

module.exports = async (page, h) => {
  await h.wait(500);
  const A = await centre(page, '#ansA'), C = await centre(page, '#ansC');
  await h.click(C.x, C.y); await h.wait(300);
  let s = await h.state();
  h.assert(s.lives === 3 && !s.win, 'pressing in the dark is free and does not win: ' + JSON.stringify(s));

  // pause menu theme toggle changes the hall, not the paper
  await h.click(1136, 147); await h.wait(150);
  await h.eval(() => document.getElementById('darkBtn').click()); await h.wait(1200);
  h.assert((await h.state()).remarks.includes('hall'), 'toggle remark');
  const lit = await h.eval(() => document.getElementById('play').classList.contains('lit'));
  h.assert(!lit, 'theme toggle must not light the paper');
  await h.eval(() => document.getElementById('resumeBtn').click()); await h.wait(150);
  await h.eval(() => window.__mock.toggleDark());
  await h.shot('dark-paper');

  // the bulb in the logo
  await h.click(650, 36); await h.wait(900);
  h.assert(await h.eval(() => document.getElementById('play').classList.contains('lit')), 'bulb click lights the paper');
  await h.shot('lit');

  await h.click(A.x, A.y); await h.wait(300);
  s = await h.state(); h.assert(s.lives === 2, 'A costs a heart once lit');
  await h.click(C.x, C.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'C wins: ' + JSON.stringify(s));
  await h.shot('win');
};
