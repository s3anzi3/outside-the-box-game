// Q40 Hold to Reboot: a tap does nothing; a short hold drains; a full 1.8 s hold reboots.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(400);
  const b = await centreOf(page, '#holdBtn');
  await h.click(b.x, b.y); await h.wait(400);
  let s = await h.state(); h.assert(!s.win && s.lives === 3, 'a tap does nothing');
  h.assert((await h.events()).includes('tap'), 'tap logged');
  await h.down(b.x, b.y); await h.wait(900);
  h.assert(await h.eval(() => document.getElementById('frame').classList.contains('rebooting')), 'chrome reboots while holding');
  await h.shot('holding');
  await h.up(); await h.wait(700);
  const held = await h.eval(() => window.__mock.level.held); h.assert(held < 400, 'release drains the hold: ' + held);
  await h.down(b.x, b.y); await h.wait(2200); await h.up(); await h.wait(1000);
  s = await h.state(); h.assert(s.win, 'full hold reboots: ' + JSON.stringify(s));
  await h.shot('win');
};
