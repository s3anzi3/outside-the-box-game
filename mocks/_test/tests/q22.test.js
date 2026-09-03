// Q22 Did You Catch That: a wrong sequence costs a heart; pausing mid-flash keeps the digits readable; typing them back wins.
// Run with the mock URL ?wait=1200 (the harness passes the file path; the level also honours M.level.waitMs).
async function waitPhase(h, phase, ms) { for (let i = 0; i < ms / 50; i++) { if ((await h.eval(() => window.__mock.level.phase)) === phase) return true; await h.wait(50); } return false; }
module.exports = async (page, h) => {
  await h.eval(() => { window.__mock.level.waitMs = 1200; });
  h.assert(await waitPhase(h, 'flash', 3000), 'flash starts');
  h.assert(await waitPhase(h, 'input', 2000), 'input phase follows the flash');
  await h.click(640, 360);
  const code = await h.eval(() => window.__mock.level.code);
  const wrong = code[0] === '0' ? '1111111111' : '0000000000';
  await h.type(wrong); await h.key('Enter'); await h.wait(500);
  let s = await h.state(); h.assert(s.lives === 2, 'wrong sequence costs a heart');
  await h.eval(() => { window.__mock.level.waitMs = 1200; });
  h.assert(await waitPhase(h, 'flash', 3000), 'second flash');
  await h.click(1136, 147); await h.wait(150);            // pause mid-flash
  s = await h.state(); h.assert(s.paused, 'paused');
  const z = await h.eval(() => getComputedStyle(document.getElementById('flashrow')).zIndex);
  h.assert(Number(z) >= 8, 'digits sit above the pause notice: z=' + z);
  const shown = await h.eval(() => document.getElementById('digits').textContent);
  const code2 = await h.eval(() => window.__mock.level.code);
  h.assert(shown === code2, 'digits readable while paused');
  await h.shot('paused-flash');
  await h.wait(1200);
  h.assert((await h.eval(() => window.__mock.level.phase)) === 'flash', 'flash timer frozen while paused');
  await h.eval(() => document.getElementById('resumeBtn').click());
  h.assert(await waitPhase(h, 'input', 2000), 'input after resume');
  await h.type(code2); await h.wait(200);
  await h.shot('typed');
  await h.key('Enter'); await h.wait(1200);
  s = await h.state(); h.assert(s.win, 'typing the code wins: ' + JSON.stringify(s));
  await h.shot('win');
};
