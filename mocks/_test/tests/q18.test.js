// Q18 Binary Logic (type-in): "2" costs a heart, "10" wins.
module.exports = async (page, h) => {
  await h.wait(400);
  await page.fill('#answerInput', '2'); await page.press('#answerInput', 'Enter'); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2 && s.remarks.startsWith('Two'), 'two costs a heart: ' + s.remarks);
  await h.shot('two');
  await page.fill('#answerInput', '10'); await h.eval(() => document.getElementById('submitBtn').click()); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'ten wins');
  await h.shot('win');
};
