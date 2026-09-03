// Q35 Institutional Simon: the chrome plays a sequence; click it back. A wrong click costs a heart and replays. Three rounds win.
const centreOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s); const r = el.getBoundingClientRect(); const f = document.getElementById('frame').getBoundingClientRect();
  return { x: (r.left + r.width / 2 - f.left) * 1280 / f.width, y: (r.top + r.height / 2 - f.top) * 860 / f.height };
}, sel);
const SEL = { logo: '.logo img', qnum: '#qnum', pause: '#pauseBtn', examiner: '#examiner img', hearts: '#heartRow' };

async function waitInput(h, round) {
  for (let i = 0; i < 80; i++) {
    const st = await h.eval(() => ({ s: window.__mock.level.state, r: window.__mock.level.round }));
    if (st.s === 'input' && st.r === round) return;
    await h.wait(250);
  }
  throw new Error('round ' + round + ' never reached input');
}
async function playRound(page, h, round, wrongAt) {
  await waitInput(h, round);
  const seq = await h.eval(() => window.__mock.level.sequence.slice());
  for (let i = 0; i < seq.length; i++) {
    let name = seq[i];
    if (wrongAt === i) { name = Object.keys(SEL).find(k => k !== seq[i]); }
    const c = await centreOf(page, SEL[name]);
    await h.click(c.x, c.y); await h.wait(320);
    if (wrongAt === i) return;
  }
}

module.exports = async (page, h) => {
  // pause is part of the instrument: pressing it before the round does not pause
  await h.wait(800);
  await h.click(1136, 147); await h.wait(200);
  let s = await h.state(); h.assert(!s.paused, 'pause control must not pause on this level');
  await h.shot('watching');

  await playRound(page, h, 0);
  s = await h.state(); h.assert(s.lives === 3, 'round 1 clean');
  await playRound(page, h, 1, 1);             // deliberate mistake in round 2
  await h.wait(600);
  s = await h.state(); h.assert(s.lives === 2, 'wrong click costs a heart: ' + JSON.stringify(s));
  await h.wait(1600);
  await playRound(page, h, 1);                // replay of round 2
  await playRound(page, h, 2);
  await h.wait(1600);
  s = await h.state(); h.assert(s.win, 'three rounds win: ' + JSON.stringify(s));
  await h.shot('win');
};
