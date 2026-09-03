// Q19 The Pattern (type-in): lowercase e and 8 cost hearts; capital E wins.
module.exports = async (page, h) => {
  await h.wait(400);
  await page.fill('#answerInput', 'e'); await page.press('#answerInput', 'Enter'); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2 && s.remarks.startsWith('Case matters'), 'lowercase e costs a heart: ' + s.remarks);
  await page.fill('#answerInput', '8'); await page.press('#answerInput', 'Enter'); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 1, '8 costs a heart');
  await h.shot('wrong');
  await page.fill('#answerInput', 'E'); await h.eval(() => document.getElementById('submitBtn').click()); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'capital E wins');
  await h.shot('win');
};
