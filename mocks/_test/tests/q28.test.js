// Q28 FRODRICK.EXE: real shots reduce boss HP; pause freezes the fight; the boss can be killed (HP shortened via M.test).
async function lvl(h) { return h.eval(() => { const L = window.__mock.level; return { hp: L.hp, landed: L.hitsLanded, taken: L.hitsTaken, phase: L.phase, running: L.running }; }); }
module.exports = async (page, h) => {
  await h.wait(600);
  await h.click(640, 360);                      // focus
  await h.keyDown(' ');
  let L0 = await lvl(h);
  for (let i = 0; i < 40; i++) {               // fire while tracking the boss horizontally with A/D
    const bx = await h.eval(() => window.__mock.level.bossX), px = await h.eval(() => window.__mock.level.playerX);
    const k = bx + 75 > px + 20 ? 'd' : 'a';
    await h.keyDown(k); await h.wait(100); await h.keyUp(k);
    const L = await lvl(h); if (L.landed >= 3) break;
  }
  await h.keyUp(' ');
  let L1 = await lvl(h);
  h.assert(L1.landed >= 1 && L1.hp < L0.hp, 'shots land and reduce HP: ' + JSON.stringify(L1));
  await h.shot('fighting');
  // pause freezes the fight
  await h.click(1136, 147); await h.wait(150);
  const hpA = (await lvl(h)).hp; await h.keyDown(' '); await h.wait(700); await h.keyUp(' ');
  const hpB = (await lvl(h)).hp; h.assert(hpA === hpB, 'no hits while paused');
  await h.eval(() => document.getElementById('resumeBtn').click()); await h.wait(150);
  // shorten the fight and finish it with real shots
  await h.eval(() => window.__mock.test.setBossHP(10));
  await h.keyDown(' ');
  for (let i = 0; i < 120; i++) {
    const bx = await h.eval(() => window.__mock.level.bossX), px = await h.eval(() => window.__mock.level.playerX);
    const k = bx + 75 > px + 20 ? 'd' : 'a';
    await h.keyDown(k); await h.wait(80); await h.keyUp(k);
    const s = await h.state(); if (s.win || s.ended) break;
  }
  await h.keyUp(' '); await h.wait(1200);
  const s = await h.state(); h.assert(s.win, 'boss defeated: ' + JSON.stringify(s) + ' ' + JSON.stringify(await lvl(h)));
  await h.shot('win');
};
