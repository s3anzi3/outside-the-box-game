// Q42 Entry Fee: a heart flies onto the paper (lives 2), a wrong count costs a real heart, 1 refunds and wins.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
module.exports = async (page, h) => {
  await h.wait(3400);
  let s = await h.state(); h.assert(s.lives === 2, 'fee charged: ' + JSON.stringify(s));
  h.assert(await h.has('#feeHeart'), 'heart sits in the fee box');
  await h.shot('fee-paid');
  const two = await centreOf(page, '#ans2'), one = await centreOf(page, '#ans1');
  await h.click(two.x, two.y); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 1, 'wrong count costs a real heart');
  await h.click(one.x, one.y); await h.wait(2200);
  s = await h.state(); h.assert(s.win && s.lives === 2, 'one wins and the fee is refunded: ' + JSON.stringify(s));
  h.assert(!(await h.has('#feeHeart')), 'fee heart returned');
  await h.shot('win');
};
