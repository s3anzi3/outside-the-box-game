// Q29 Self-Assessment: drag INCORRECT onto the statement (heart), SUBMIT twice (free then heart), drag CORRECT (win).
module.exports = async (page, h) => {
  await h.wait(600);
  let s = await h.state();
  h.assert(s.lives === 3 && !s.win, 'fresh start');

  // stamp centres: INCORRECT at (1186+37, 200+48); the statement box centre ≈ (640, 335)
  await h.drag(1223, 248, 640, 300, 25);
  await h.wait(700);
  s = await h.state();
  h.assert(s.lives === 2, 'INCORRECT stamp on the statement should cost a heart: ' + JSON.stringify(s));
  h.assert((await h.events()).includes('impression:INCORRECT'), 'impression recorded');
  await h.shot('after-incorrect');

  // dropping a stamp off the statement does nothing
  await h.drag(1223, 248, 400, 500, 15);
  await h.wait(500);
  s = await h.state();
  h.assert(s.lives === 2, 'stray drop should be free');

  // submit for grading: first free, second costs
  await h.eval(() => document.getElementById('submitBtn').click());
  await h.wait(300);
  s = await h.state(); h.assert(s.lives === 2, 'first SUBMIT is free');
  await h.eval(() => document.getElementById('submitBtn').click());
  await h.wait(300);
  s = await h.state(); h.assert(s.lives === 1, 'second SUBMIT costs a heart');

  // pause blocks stamping
  await h.click(1136, 147); await h.wait(150);
  await h.drag(1223, 378, 640, 300, 15); await h.wait(300);
  s = await h.state(); h.assert(s.paused && !s.win, 'no stamping while paused');
  await h.eval(() => document.getElementById('resumeBtn').click()); await h.wait(150);

  // CORRECT stamp wins
  await h.drag(1223, 378, 640, 300, 25);
  await h.wait(1600);
  s = await h.state();
  h.assert(s.win === true && s.solved === true, 'CORRECT stamp should win: ' + JSON.stringify(s));
  await h.shot('win');
};
