// Q25 Lights Maze: walk the solution path with keys, toggle mode at each gate, prove the maze is solvable; pause freezes the timer.
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
async function level(h) { return h.eval(() => ({ pos: window.__mock.level.pos, dark: window.__mock.dark, toggled: window.__mock.level.toggled, timer: window.__mock.level.timerLeft, won: window.__mock.level.won })); }
async function toggle(h) {
  const L = await level(h);
  if (!L.toggled) { await h.click(1136, 147); await h.wait(120); await h.eval(() => document.getElementById('darkBtn').click()); await h.wait(120); await h.eval(() => document.getElementById('resumeBtn').click()); }
  else { await h.eval(() => document.getElementById('toggleBtn').click()); }
  await h.wait(80);
}
async function moveTo(h, tc, tr) {
  // hold one key until the dot reaches the target cell centre (tolerance 0.12 cells)
  for (let guard = 0; guard < 400; guard++) {
    const L = await level(h);
    const dx = (tc + 0.5) - L.pos.x, dy = (tr + 0.5) - L.pos.y;
    if (Math.abs(dx) < 0.12 && Math.abs(dy) < 0.12) { await h.keyUp(KEY.up); await h.keyUp(KEY.down); await h.keyUp(KEY.left); await h.keyUp(KEY.right); return; }
    const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? KEY.right : KEY.left) : (dy > 0 ? KEY.down : KEY.up);
    await h.keyDown(k); await h.wait(16);
    for (const o of Object.values(KEY)) if (o !== k) await h.keyUp(o);
  }
  throw new Error('stuck heading to ' + tc + ',' + tr);
}
module.exports = async (page, h) => {
  await h.wait(500);
  await h.click(640, 360); // focus the frame
  // pause freezes the timer
  const t0 = (await level(h)).timer;
  await h.click(1136, 147); await h.wait(700);
  const t1 = (await level(h)).timer;
  h.assert(Math.abs(t0 - t1) < 0.2, 'timer frozen while paused: ' + t0 + ' -> ' + t1);
  await h.eval(() => document.getElementById('resumeBtn').click()); await h.wait(100);
  await h.shot('start');

  const path = await h.eval(() => window.__mock.level.solutionPath);
  const grid = await h.eval(() => window.__mock.level.grid);
  h.assert(path.length > 10, 'solution path computed: ' + path.length);
  let oofSeen = false;
  for (let i = 1; i < path.length; i++) {
    const [r, c] = path[i];
    const t = grid[r][c];
    if (t === 2 || t === 3) {
      const L = await level(h);
      const solid = (t === 2 && L.dark) || (t === 3 && !L.dark);
      if (!oofSeen && solid) {
        // walk into it once on purpose to prove the gate is solid and costs nothing but a setback
        await moveTo(h, c, r).catch(() => {});
        const ev = await h.events(); h.assert(ev.includes('oof'), 'gate hit registers an oof'); oofSeen = true;
        await h.shot('gate-hit');
      }
      const L2 = await level(h);
      if ((t === 2 && L2.dark) || (t === 3 && !L2.dark)) await toggle(h);
    }
    await moveTo(h, c, r);
  }
  await h.keyDown(KEY.up); await h.wait(400); await h.keyUp(KEY.up);
  await h.wait(1200);
  const s = await h.state();
  h.assert(s.win, 'reached the exit: ' + JSON.stringify(s));
  await h.shot('win');
};
