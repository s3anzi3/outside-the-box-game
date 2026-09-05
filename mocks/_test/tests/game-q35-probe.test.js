const lv = async (g) => JSON.stringify({ phase: await g.levelVar('phase'), round: await g.levelVar('round'), idx: await g.levelVar('idx'), lives: (await g.state()).lives });
const waitInput = async (g, round) => { for (let i = 0; i < 100; i++) { if ((await g.levelVar('phase')) === 'input' && (await g.levelVar('round')) === round) return true; await g.wait(200); } return false; };
module.exports = async (page, g) => {
  await g.goto(35); await g.wait(500);
  await waitInput(g, 0);
  const seq = await g.levelVar('seq'); console.log('seq', JSON.stringify(seq));
  const KEYS = ['logo', 'qnum', 'pause', 'examiner', 'hearts'];
  const pt = async (name) => { const ch = await g.chrome(); const r = { logo: ch.logo, qnum: ch.qLabel, pause: ch.pause, examiner: ch.examiner, hearts: ch.heartsRow }[name]; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  const wrongName = KEYS.find(k => k !== seq[0]);
  let p = await pt(wrongName); await g.click(p.x, p.y); await g.wait(320);
  console.log('after wrong', wrongName, await lv(g));
  console.log('waitInput(0):', await waitInput(g, 0), await lv(g), 'seq now', JSON.stringify(await g.levelVar('seq')));
  const seq2 = await g.levelVar('seq');
  for (let i = 0; i < seq2.length; i++) { p = await pt(seq2[i]); await g.click(p.x, p.y); await g.wait(320); console.log('after', seq2[i], await lv(g)); }
  console.log('waitInput(1):', await waitInput(g, 1), await lv(g));
};
