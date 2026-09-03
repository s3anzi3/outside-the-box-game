// Q43 Ghost Continue: REFRESH costs a heart and dims the ghost; the ghost CONTINUE wins; the examiner speaks late.
module.exports = async (page, h) => {
  await h.wait(600);
  let s = await h.state(); h.assert(s.remarks.trim() === '|', 'examiner silent at start: ' + JSON.stringify(s.remarks));
  const op0 = await h.eval(() => getComputedStyle(document.getElementById('ghost')).opacity);
  await h.eval(() => document.getElementById('refreshBtn').click()); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 2, 'REFRESH costs a heart');
  const op1 = await h.eval(() => getComputedStyle(document.getElementById('ghost')).opacity);
  h.assert(Number(op1) < Number(op0), 'ghost fainter after refresh: ' + op0 + ' -> ' + op1);
  await h.shot('ghost');
  await h.wait(8200);
  s = await h.state(); h.assert(s.remarks.includes('...'), 'examiner offers ... after 8 s');
  await h.click(640, 171 + 381 * 0.65); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'ghost CONTINUE wins: ' + JSON.stringify(s));
  await h.shot('win');
};
