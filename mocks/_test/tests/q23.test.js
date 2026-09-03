// Q23 Truth Table: the right conclusion with a wrong table only nudges; a wrong conclusion costs a heart; correct table + conclusion wins.
module.exports = async (page, h) => {
  await h.wait(400);
  await h.eval(() => document.getElementById('opt2').click()); await h.wait(1200);
  let s = await h.state(); h.assert(s.lives === 3 && s.remarks.includes('disagrees'), 'empty table nudges, no heart: ' + s.remarks);
  await h.eval(() => document.getElementById('opt0').click()); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 2, 'wrong conclusion costs a heart');
  const ANSWER = [['T', 'T', 'T'], ['F', 'T', 'F'], ['T', 'F', 'F'], ['T', 'T', 'T']];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) {
    const clicks = ANSWER[r][i] === 'T' ? 1 : 2;
    for (let k = 0; k < clicks; k++) await h.eval(([r, i]) => document.getElementById('c' + r + i).click(), [r, i]);
  }
  h.assert((await h.text('#c11')) === 'T' && (await h.text('#c10')) === 'F', 'cells cycle to the right values');
  await h.shot('filled');
  await h.eval(() => document.getElementById('opt2').click()); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'correct table and conclusion win');
  h.assert((await h.events()).includes('stamp:CASE CLOSED'), 'stamp reads CASE CLOSED');
  await h.shot('win');
};
