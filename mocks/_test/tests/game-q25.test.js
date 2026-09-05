// Real game Q25 "Lights Maze".
// Conventional play (run the maze and let the 80 second clock expire) costs a heart.
// The intended play: open the pause menu, switch DARK MODE so the mode gates stop
// being walls, then walk the seeded solution path out of the top of the maze.
// Also proves the pause menu freezes the countdown.

const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const SPEED = 7.5;   // cells per second, from Level25.ts

// ── Layout at 1280x860 (same maths as layout.ts / PauseOverlay.ts) ───────────
const W = 1280, H = 860;
const S = Math.max(0.9, Math.min(Math.min(W / 1280, H / 800), 1.7));
const CONTENT_W = W * 0.82;
const PAPER_X = (W - CONTENT_W) / 2;
const PLAY_X = PAPER_X;
const PLAY_Y = H * 0.142 + Math.round(46 * S);
const PLAY_W = CONTENT_W;
const PLAY_H = H * 0.503 - Math.round(46 * S);
const PAD = PLAY_W * 0.05;
const OX = PLAY_X + PAD, OY = PLAY_Y + PAD, OW = PLAY_W - PAD * 2, OH = PLAY_H - PAD * 2;
const BTN_W = 220, BTN_H = Math.max(40, OH * 0.13), BTN_X = OX + OW * 0.62;
const RESUME_BTN = { x: BTN_X + BTN_W / 2, y: OY + OH * 0.30 + BTN_H / 2 };
const DARK_BTN   = { x: BTN_X + BTN_W / 2, y: OY + OH * 0.30 + (BTN_H + OH * 0.05) * 2 + BTN_H / 2 };
// the in-maze ◐ TOGGLE shortcut: 96x28, 6px inset from the play area's top right
const TOGGLE_BTN = {
  x: PLAY_X + PLAY_W - 6 - Math.round(96 * S) / 2,
  y: PLAY_Y + 6 + Math.round(28 * S) / 2,
};

let held = null;

const lv = (g) => g.eval(() => {
  const L = window.__gc.lv || {};
  return { pos: L.pos, dark: L.dark, toggled: L.toggled, timeLeft: L.timeLeft, gateHits: L.gateHits };
});

async function releaseAll(g) {
  for (const k of Object.values(KEY)) await g.keyUp(k);
  held = null;
}
async function press(g, k) {
  if (held === k) return;
  if (held) await g.keyUp(held);
  await g.keyDown(k);
  held = k;
}

// Straight runs of the solution path: one held key each, so the dot only turns
// when it is actually inside the turning cell.
function segmentsFrom(path, from, to) {
  const segs = [];
  let dr = 0, dc = 0;
  for (let i = from + 1; i <= to; i++) {
    const ndr = path[i][0] - path[i - 1][0], ndc = path[i][1] - path[i - 1][1];
    if (segs.length === 0 || ndr !== dr || ndc !== dc) {
      segs.push({ dr: ndr, dc: ndc, r: path[i][0], c: path[i][1] });
      dr = ndr; dc = ndc;
    } else {
      segs[segs.length - 1].r = path[i][0];
      segs[segs.length - 1].c = path[i][1];
    }
  }
  return segs;
}
function nearestIdx(path, pos, max) {
  let best = 0, bd = 1e9;
  for (let i = 0; i <= max; i++) {
    const d = Math.abs(path[i][1] + 0.5 - pos.x) + Math.abs(path[i][0] + 0.5 - pos.y);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
const atCell = (path, idx, pos, tol) =>
  Math.abs(path[idx][1] + 0.5 - pos.x) < tol && Math.abs(path[idx][0] + 0.5 - pos.y) < tol;

// Short timed taps to settle the dot on a cell centre when a run overshot it.
async function centerOn(g, path, idx) {
  for (let k = 0; k < 5; k++) {
    const st = await lv(g);
    const dx = path[idx][1] + 0.5 - st.pos.x, dy = path[idx][0] + 0.5 - st.pos.y;
    if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) return true;
    const horiz = Math.abs(dx) > Math.abs(dy);
    const err = horiz ? dx : dy;
    const key = horiz ? (dx > 0 ? KEY.right : KEY.left) : (dy > 0 ? KEY.down : KEY.up);
    await g.keyDown(key);
    await g.wait(Math.max(6, Math.abs(err) / SPEED * 1000 - 8));
    await g.keyUp(key);
    held = null;
    await g.wait(20);
  }
  return false;
}

// Walk the dot along the path up to (and including) targetIdx. Each straight
// run is a single held key-down for the distance's worth of travel time (real
// headless CDP timing is too coarse for a tight per-frame poll: short waits
// between synthetic key events don't line up with the page's own render/dt
// cadence and read as false wall-setbacks), then centerOn() taps it onto the
// exact cell so drift never compounds into the next segment.
async function walkTo(g, path, targetIdx, label) {
  for (let attempt = 0; attempt < 8; attempt++) {
    let st = await lv(g);
    if (!st.pos) throw new Error('no player position (' + label + ')');
    const from = nearestIdx(path, st.pos, targetIdx);
    if (from >= targetIdx) {
      if (atCell(path, targetIdx, st.pos, 0.35)) { await releaseAll(g); return; }
      await releaseAll(g);
      if (await centerOn(g, path, targetIdx)) return;
      continue;
    }
    let broke = false;
    for (const sg of segmentsFrom(path, from, targetIdx)) {
      const tx = sg.c + 0.5, ty = sg.r + 0.5;
      const horiz = sg.dc !== 0;
      const sign = horiz ? Math.sign(sg.dc) : Math.sign(sg.dr);
      const key = sg.dc > 0 ? KEY.right : sg.dc < 0 ? KEY.left : sg.dr > 0 ? KEY.down : KEY.up;

      st = await lv(g);
      const start = horiz ? st.pos.x : st.pos.y;
      const dist = sign * ((horiz ? tx : ty) - start);
      if (dist > 0) {
        const holdMs = Math.max(0, dist / SPEED * 1000 - 120);   // undershoot; centerOn finishes it
        await press(g, key);
        await g.wait(holdMs);
        await releaseAll(g);
        await g.wait(40);
      }

      st = await lv(g);
      const perp = horiz ? Math.abs(st.pos.y - ty) : Math.abs(st.pos.x - tx);
      if (perp > 0.55) { broke = true; break; }                 // a real wall knocked it off the run
      const segIdx = path.findIndex(pt => pt[0] === sg.r && pt[1] === sg.c);
      if (segIdx >= 0) await centerOn(g, path, segIdx);
    }
    await releaseAll(g);
    if (!broke) {
      st = await lv(g);
      if (atCell(path, targetIdx, st.pos, 0.35)) return;
      if (await centerOn(g, path, targetIdx)) return;
    }
    await g.wait(80);
  }
  await releaseAll(g);
  throw new Error('stuck walking to ' + label);
}

module.exports = async (page, g) => {
  await g.goto(25);
  await g.wait(400);

  const maze = await g.eval(() => ({
    grid: window.__gc.lv.grid,
    gates: window.__gc.lv.gates,
    path: window.__gc.lv.path,
  }));
  g.assert(maze.path && maze.path.length > 10, 'solution path computed: ' + (maze.path || []).length);
  g.assert(maze.gates.length === 3, 'three mode gates: ' + JSON.stringify(maze.gates));
  await g.shot('start');

  // ── the pause menu freezes the countdown ─────────────────────────────────
  const ch = await g.chrome();
  g.assert(ch.pause, 'pause control rect exposed');
  const PAUSE = { x: ch.pause.x + ch.pause.w / 2, y: ch.pause.y + ch.pause.h / 2 };
  const t0 = (await lv(g)).timeLeft;
  await g.click(PAUSE.x, PAUSE.y);
  await g.wait(1400);
  let s = await g.state();
  g.assert(s.paused, 'the pause control suspended the exam');
  const t1 = (await lv(g)).timeLeft;
  g.assert(Math.abs(t0 - t1) < 0.25, 'countdown frozen while paused: ' + t0 + ' -> ' + t1);
  await g.shot('paused');
  await g.click(RESUME_BTN.x, RESUME_BTN.y);
  await g.wait(300);
  s = await g.state();
  g.assert(!s.paused, 'resumed from the pause menu');
  const t2 = (await lv(g)).timeLeft;
  g.assert(t2 < t1 - 0.1, 'countdown runs again after resume: ' + t1 + ' -> ' + t2);

  // ── the conventional trap: run the maze the honest way and the clock wins ─
  const deadline = Date.now() + 110000;
  while (s.lives === 3 && Date.now() < deadline) {
    await g.wait(2500);
    s = await g.state();
  }
  g.assert(s.lives === 2, 'the expired clock costs a heart: lives=' + s.lives);
  g.assert(s.remarks.indexOf('The clock restarts') >= 0, 'timeout remark: ' + s.remarks);
  g.assert((await lv(g)).timeLeft > 70, 'the clock restarted after taking the heart');
  await g.shot('clock-ran-out');

  // ── the intended solution: flip the lights at every gate that is solid ────
  const gateIdx = [];
  for (let i = 1; i < maze.path.length; i++) {
    const [r, c] = maze.path[i];
    if (maze.grid[r][c] >= 2) gateIdx.push(i);
  }
  g.assert(gateIdx.length === 3, 'three gates lie on the path: ' + JSON.stringify(gateIdx));

  let bumped = false;
  for (const gi of gateIdx) {
    const [gr, gcol] = maze.path[gi];
    const type = maze.grid[gr][gcol];
    await walkTo(g, maze.path, gi - 1, 'the cell before gate ' + gi);
    let st = await lv(g);
    const solid = (type === 2 && st.dark) || (type === 3 && !st.dark);

    if (solid && !bumped) {
      // Walk into it once. A gate is a real wall: it sets you back, costs no
      // heart, and the examiner finally names the trick.
      const [pr, pc] = maze.path[gi - 1];
      const key = gcol > pc ? KEY.right : gcol < pc ? KEY.left : gr > pr ? KEY.down : KEY.up;
      await press(g, key);
      await g.wait(250);
      await releaseAll(g);
      await g.wait(150);
      const hitState = await g.state();
      const hitLv = await lv(g);
      g.assert(hitLv.gateHits >= 1, 'the gate is solid and was struck: ' + JSON.stringify(hitLv));
      g.assert(hitState.lives === 2, 'walking into a wall costs no heart: lives=' + hitState.lives);
      g.assert(hitState.remarks.indexOf('only there in this light') >= 0, 'gate remark: ' + hitState.remarks);
      bumped = true;
      await g.shot('gate-hit');
      await walkTo(g, maze.path, gi - 1, 'back to gate ' + gi);
    }

    if (solid) {
      st = await lv(g);
      if (!st.toggled) {
        // The shortcut is not there yet: the light switch lives in the pause menu.
        await g.click(PAUSE.x, PAUSE.y);
        await g.wait(300);
        await g.click(DARK_BTN.x, DARK_BTN.y);
        // the examiner reaches up for the switch for 400ms
        let dir = null;
        for (let k = 0; k < 4 && dir !== 'up'; k++) {
          dir = await g.eval(() => window.__gc.guideCharDir);
          if (dir !== 'up') await g.wait(60);
        }
        g.assert(dir === 'up', 'the examiner reaches up for the switch: ' + dir);
        const toggled = await g.state();
        g.assert(toggled.remarks.indexOf('Mind the switch') >= 0, 'first-toggle remark: ' + toggled.remarks);
        await g.shot('pause-toggle');
        await g.click(RESUME_BTN.x, RESUME_BTN.y);
        await g.wait(300);
      } else {
        await g.click(TOGGLE_BTN.x, TOGGLE_BTN.y);
        await g.wait(250);
      }
      const after = await lv(g);
      g.assert(after.toggled, 'the ◐ TOGGLE shortcut is unlocked after the first switch');
      const stillSolid = (type === 2 && after.dark) || (type === 3 && !after.dark);
      g.assert(!stillSolid, 'gate ' + gi + ' opened by the light switch');
    }

    await walkTo(g, maze.path, gi, 'through gate ' + gi);
  }

  // ── out through the top ──────────────────────────────────────────────────
  await walkTo(g, maze.path, maze.path.length - 1, 'the exit row');
  await press(g, KEY.up);
  await g.wait(500);
  await releaseAll(g);
  await g.wait(700);

  s = await g.state();
  g.assert(s.phase === 'win', 'reached the exit: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'no further hearts lost solving it: lives=' + s.lives);
  await g.shot('win');
};
