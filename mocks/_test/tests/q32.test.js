// Q32 Listen: guessing costs a heart; the word is audible only with the paper dial AND the pause-menu SOUND slider at max; then it wins.
const rectOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  const k = 1280 / f.width; return { l: (r.left - f.left) * k, r: (r.right - f.left) * k, y: (r.top + r.height / 2 - f.top) * 860 / f.height, x: (r.left + r.width / 2 - f.left) * k };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const word = await h.eval(() => window.__mock.level.word);
  const shown = await h.eval(() => window.__mock.level.shown);
  const wrong = shown.find(w => w !== word);
  const wb = await rectOf(page, '#word' + wrong);
  await h.click(wb.x, wb.y); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'guess costs a heart');
  h.assert(!(await h.eval(() => window.__mock.level.audible)), 'silent at start');
  const tr = await rectOf(page, '#vtrack'), kn = await rectOf(page, '#vknob');
  await h.drag(kn.x, kn.y, tr.r + 10, kn.y, 20); await h.wait(300);
  h.assert((await h.eval(() => window.__mock.level.dial)) >= 9.6, 'dial at max');
  h.assert(!(await h.eval(() => window.__mock.level.audible)), 'still silent with only the paper dial up');
  await h.shot('dial-max');
  await h.click(1136, 147); await h.wait(250);
  const sl = await rectOf(page, '#soundSlider');
  await h.drag(sl.l + 4, sl.y, sl.r + 12, sl.y, 15); await h.wait(200);
  h.assert((await h.eval(() => window.__mock.volume)) >= 0.99, 'pause-menu slider at 100');
  await h.shot('slider-max');
  await h.eval(() => document.getElementById('resumeBtn').click()); await h.wait(300);
  h.assert(await h.eval(() => window.__mock.level.audible), 'audible with both volumes up');
  await h.wait(1900);
  h.assert((await h.eval(() => window.__mock.level.spoken)) >= 1, 'the word is being spoken on repeat');
  const rb = await rectOf(page, '#word' + word);
  await h.click(rb.x, rb.y); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'the heard word wins');
  await h.shot('win');
};
