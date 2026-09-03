// Q34 The Fourth Heart: seals and real hearts are free, the fake fourth heart wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);

module.exports = async (page, h) => {
  await h.wait(500);
  const n = await h.eval(() => document.getElementById('heartRow').children.length);
  h.assert(n === 4, 'four hearts shown');
  const seal = await centreOf(page, '.seal[data-i="9"]');
  await h.click(seal.x, seal.y); await h.wait(300);
  let s = await h.state(); h.assert(s.lives === 3 && !s.win, 'seal click is free');
  const real = await centreOf(page, '#heartRow .hp:nth-child(2)');
  await h.click(real.x, real.y); await h.wait(600);
  s = await h.state(); h.assert(s.lives === 3 && s.remarks.includes('yours'), 'real heart: leave it');
  await h.shot('before');
  const fake = await centreOf(page, '#fakeHeart');
  await h.click(fake.x, fake.y); await h.wait(1500);
  s = await h.state(); h.assert(s.win, 'fake heart wins: ' + JSON.stringify(s));
  h.assert((await h.eval(() => document.getElementById('heartRow').children.length)) === 3, 'row back to three');
  await h.shot('win');
};
