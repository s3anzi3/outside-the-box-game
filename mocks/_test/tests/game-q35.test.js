// Real game Q35 "Institutional Simon": the chrome performs the sequence, you click the
// furniture back. A wrong piece costs a heart and replays the round; three rounds win.
// The pause control is part of the instrument today and refuses to suspend the exam.
const KEYS = ['logo', 'qnum', 'pause', 'examiner', 'hearts'];

// chrome rect for each instrument key, as a click point
const pointFor = async (g, name) => {
  const ch = await g.chrome();
  const r = { logo: ch.logo, qnum: ch.qLabel, pause: ch.pause, examiner: ch.examiner, hearts: ch.heartsRow }[name];
  if (!r) throw new Error('no chrome rect for ' + name + ': ' + JSON.stringify(ch));
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

const waitInput = async (g, round) => {
  for (let i = 0; i < 100; i++) {
    const phase = await g.levelVar('phase');
    const r = await g.levelVar('round');
    if (phase === 'input' && r === round) return;
    await g.wait(200);
  }
  throw new Error('round ' + round + ' never reached YOUR TURN');
};

// Click the whole sequence of the current round. wrongAt = beat index to fumble on purpose.
const playRound = async (g, round, wrongAt) => {
  await waitInput(g, round);
  const seq = await g.levelVar('seq');
  for (let i = 0; i < seq.length; i++) {
    let name = seq[i];
    if (wrongAt === i) name = KEYS.find((k) => k !== seq[i]);
    const p = await pointFor(g, name);
    await g.click(p.x, p.y);
    await g.wait(320);
    if (wrongAt === i) return;
  }
};

module.exports = async (page, g) => {
  await g.goto(35);
  await g.wait(700);

  let s = await g.state();
  g.assert(s.remarks.includes('attention to detail'), 'opening remark: ' + s.remarks);
  await g.shot('watching');

  // ── the pause control is repurposed: pressing it must not suspend the exam ──
  const pausePt = await pointFor(g, 'pause');
  g.assert(Math.abs(pausePt.x - 1136) < 24 && Math.abs(pausePt.y - 147) < 24,
    'pause control sits in the header band: ' + JSON.stringify(pausePt));
  await g.click(pausePt.x, pausePt.y);
  await g.wait(400);
  s = await g.state();
  g.assert(!s.paused, 'pause control must not pause on this level: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('I disabled it'), 'examiner explains the dead pause: ' + s.remarks);

  // ── a suspension still freezes the level clock (there is no in-level way to ──
  // ── reach it here, so the suspension is forced; Escape resumes with real input) ──
  const before = await g.levelVar('elapsed');
  await g.eval(() => { window.__gc.state.paused = true; window.__gc.render(); });
  await g.wait(900);
  const during = await g.levelVar('elapsed');
  g.assert(Math.abs(during - before) < 120, 'the level clock freezes while suspended (one frame of drift allowed): ' + before + ' -> ' + during);
  await g.shot('suspended');
  await g.key('Escape');
  await g.wait(500);
  s = await g.state();
  g.assert(!s.paused, 'Escape resumes');
  const after = await g.levelVar('elapsed');
  g.assert(after > during, 'the level clock runs again after resuming: ' + during + ' -> ' + after);

  // ── the trap: clicking a piece that did not glow costs a heart and replays ──
  console.log('pre-wrong lv', JSON.stringify({ phase: await g.levelVar('phase'), round: await g.levelVar('round'), seq: await g.levelVar('seq'), idx: await g.levelVar('idx') }), 'state', JSON.stringify(await g.state()));
  await playRound(g, 0, 0);
  await g.wait(600);
  console.log('post-wrong lives', (await g.state()).lives, 'stamp', (await g.state()).stamp); console.log('post-wrong lv', JSON.stringify({ phase: await g.levelVar('phase'), round: await g.levelVar('round'), idx: await g.levelVar('idx') }), 'hits', JSON.stringify(await g.eval(() => window.__gc.hitAreas.length)));
  s = await g.state();
  g.assert(s.lives === 2, 'a wrong piece of furniture costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT stamp slams: ' + s.stamp);
  g.assert(s.remarks.includes('not the instrument'), 'first hint rung: ' + s.remarks);
  g.assert((await g.levelVar('round')) === 0, 'the same round replays');
  await g.shot('wrong');

  // ── the intended solution: repeat the chrome sequence, three rounds ──
  await playRound(g, 0);
  await playRound(g, 1);
  await playRound(g, 2);
  await g.wait(1200);
  s = await g.state();
  g.assert(s.phase === 'win', 'three rounds of institutional Simon win: ' + JSON.stringify(s) + ' lv=' + JSON.stringify({ phase: await g.levelVar('phase'), round: await g.levelVar('round'), idx: await g.levelVar('idx'), seq: await g.levelVar('seq') }));
  g.assert(s.lives === 2, 'no further hearts lost: ' + s.lives);
  await g.shot('win');
};
