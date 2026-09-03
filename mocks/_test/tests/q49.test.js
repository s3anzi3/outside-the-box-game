// Q49 randomised lock: three random callback clues; a wrong code costs a heart; dialling the drawn code wins.
module.exports = async (page, h) => {
  await h.wait(400);
  const code = await h.eval(() => window.__mock.level.code.slice());
  const clues = await h.eval(() => window.__mock.level.clues.slice());
  h.assert(code.length === 3 && clues.length === 3 && new Set(clues).size === 3, 'three distinct clues drawn: ' + JSON.stringify(clues));
  h.assert((await h.text('#clues')).includes(clues[1].slice(0, 12)), 'clues rendered');
  // a wrong code (all zeros unless the code is all zeros)
  if (!(code[0] === 0 && code[1] === 0 && code[2] === 0)) {
    await h.eval(() => document.getElementById('submitBtn').click()); await h.wait(400);
    h.assert((await h.state()).lives === 2, 'wrong code costs a heart');
  }
  for (let i = 0; i < 3; i++) for (let k = 0; k < code[i]; k++) await h.eval((i) => document.getElementById('up' + i).click(), i);
  await h.wait(200);
  h.assert((await h.text('#caption')).includes('COMBINATION'), 'caption flips when the code is set');
  await h.shot('set');
  await h.eval(() => document.getElementById('submitBtn').click()); await h.wait(1200);
  const s = await h.state(); h.assert(s.win, 'drawn code wins: ' + JSON.stringify(code));
  await h.shot('win');
};
