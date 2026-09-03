// Q36 Recommended: confirming the default costs a heart; selecting 56 moves the tag; confirming 56 wins.
module.exports = async (page, h) => {
  await h.wait(400);
  await h.eval(() => document.getElementById('confirmBtn').click()); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'confirming 54 costs a heart');
  await h.shot('confirmed-default');
  await h.eval(() => document.getElementById('opt56').click()); await h.wait(700);
  h.assert((await h.text('#rectag')).includes('REVISED'), 'tag revised');
  await h.shot('revised');
  await h.eval(() => document.getElementById('confirmBtn').click()); await h.wait(1200);
  s = await h.state(); h.assert(s.win, '56 confirmed wins');
  await h.shot('win');
};
