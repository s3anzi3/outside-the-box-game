// Real game Q29: drag INCORRECT stamp onto the statement (heart), SUBMIT twice (free then heart), drag CORRECT (win).
module.exports = async (page, g) => {
  await g.goto(29);
  await g.wait(400);
  await g.shot('start');
  // stamps sit on the desk right of the paper: paper right edge 1165, +20 → x 1185..1259; INCORRECT at y 122+80, CORRECT at y 122+210 (s=1)
  const inc = { x: 1185 + 37, y: 122 + 80 + 48 }, cor = { x: 1185 + 37, y: 122 + 210 + 48 };
  const statement = { x: 640, y: 171 + 381 * 0.2 + 381 * 0.15 };
  await g.drag(inc.x, inc.y, statement.x, statement.y - 40, 25); await g.wait(600);
  let s = await g.state(); g.assert(s.lives === 2, 'INCORRECT stamp costs a heart: ' + JSON.stringify(s));
  await g.shot('incorrect');
  await g.drag(inc.x, inc.y, 400, 500, 12); await g.wait(400);
  s = await g.state(); g.assert(s.lives === 2, 'stray drop is free');
  // SUBMIT FOR GRADING button: centre (640, 171 + 381*0.76 + 22)
  await g.click(640, 171 + 381 * 0.76 + 22); await g.wait(300);
  s = await g.state(); g.assert(s.lives === 2 && s.remarks.includes('on break'), 'first submit is free: ' + s.remarks);
  await g.click(640, 171 + 381 * 0.76 + 22); await g.wait(300);
  s = await g.state(); g.assert(s.lives === 1, 'second submit costs a heart');
  await g.drag(cor.x, cor.y, statement.x, statement.y - 40, 25); await g.wait(1500);
  s = await g.state(); g.assert(s.phase === 'win', 'CORRECT stamp wins: ' + JSON.stringify(s));
  await g.shot('win');
};
