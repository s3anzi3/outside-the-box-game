// Q48 The Cheat: traps cost hearts; CHEAT wins with a CHEATED stamp.
module.exports = async (page, h) => {
  await h.wait(400);
  await h.eval(() => document.getElementById('trapYES').click()); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'YES costs a heart');
  await h.eval(() => document.getElementById('trap42').click()); await h.wait(400);
  s = await h.state(); h.assert(s.lives === 1, '42 costs a heart');
  await h.shot('traps');
  await h.eval(() => document.getElementById('cheatBtn').click()); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'CHEAT wins');
  h.assert((await h.events()).includes('stamp:CHEATED'), 'stamp reads CHEATED');
  await h.shot('win');
};
