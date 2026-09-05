// Real game Q9: the Q.9 header label is the answer (was unreachable under the stray text canvas).
module.exports = async (page, g) => {
  await g.goto(9); await g.wait(500);
  const ch = await g.chrome();
  g.assert(ch.qLabel, 'qLabel rect present');
  await g.click(ch.qLabel.x + ch.qLabel.w / 2, ch.qLabel.y + ch.qLabel.h / 2); await g.wait(800);
  const s = await g.state();
  g.assert(s.phase === 'win' || s.level === 10 || s.stamp === 'CORRECT', 'clicking the Q.9 label solves Q9: ' + JSON.stringify(s));
  await g.shot('q9-label');
};
