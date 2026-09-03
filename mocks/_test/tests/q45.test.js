// Q45 rework: the button screams and bolts while fresh; once winded it can be cornered and clicked.
const lvl = (h) => h.eval(() => { const L = window.__mock.level; return { x: 118 + L.x, y: 171 + L.y, chased: L.chased, winded: L.winded, bolts: L.bolts, cornered: L.cornered }; });
async function herd(h, maxIter) {
  let still = 0, last = null;
  for (let i = 0; i < maxIter; i++) {
    const p = await lvl(h);
    await h.move(p.x + 75 - 70, p.y + 26 - 40, 4); await h.wait(40);
    if (p.winded) { if (last && Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 0.5) still++; else still = 0; if (still >= 4) return p; }
    last = p;
  }
  return lvl(h);
}
module.exports = async (page, h) => {
  await h.wait(400);
  const p0 = await lvl(h);
  await h.move(p0.x - 5, p0.y + 26, 8); await h.wait(250);
  const p1 = await lvl(h);
  h.assert(Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y) > 10, 'button flees');
  h.assert((await h.events()).includes('scream'), 'it screams on approach');
  await herd(h, 260);
  let L = await lvl(h);
  h.assert(L.bolts >= 1, 'a fresh button bolts when pinned: bolts=' + L.bolts + ' chased=' + Math.round(L.chased));
  await h.shot('bolting');
  for (let round = 0; round < 6 && !(await lvl(h)).winded; round++) await herd(h, 200);
  L = await lvl(h); h.assert(L.winded, 'button gets winded after the chase: chased=' + Math.round(L.chased));
  const p = await herd(h, 200);
  L = await lvl(h); h.assert(L.cornered, 'winded button can be cornered');
  h.assert((await h.text('#submitBtn')).includes('OK OK FINE'), 'label gives up');
  await h.shot('cornered');
  await h.click(p.x + 75, p.y + 26); await h.wait(1200);
  const s = await h.state(); h.assert(s.win, 'clicking the cornered button wins: ' + JSON.stringify(s));
  await h.shot('win');
};
