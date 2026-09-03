module.exports = {
  q: 25,
  title: 'OtB · Q.25 Lights Maze Mock (current theme)',
  h1: 'Q.25 · Lights Maze · FAITHFUL PORT',
  sub: `Fully playable. An exact port of Level25.ts: the same seeded maze (11×8 rooms, seed C0FFEE42), the same three gates placed at a quarter, half and three quarters of the unique solution path, alternating between dark-only and light-only walls. WASD or the arrows move the dot at the real speed; a wall hit plays the oof shake and sets you back ninety frames along your own trail; the 80 second timer costs a heart and restarts when it runs out. The trick, faithful to the real build: open the pause menu and switch DARK MODE to change which gates are solid. After your first switch a ◐ TOGGLE shortcut appears in the corner of the maze. Restyled like the Q10 maze mock: ink walls, oxblood dot, pass-green exit. Pause freezes the timer and the dot. Small jokes: the examiner reaches up for the switch (turns UP) on every toggle and is captioned EXAMINER (UNLIT) in the dark. The test proves the maze is solvable by walking the computed path with key presses and toggling at each gate.`,
  css: `
  #mazeCv{position:absolute; left:0; top:0; width:100%; height:100%; display:block;}
  #mazeCv.oof{animation:oof .18s ease-out 1;}
  @keyframes oof{0%{transform:translate(0,0)} 30%{transform:translate(-3px,1px)} 60%{transform:translate(3px,-1px)} 100%{transform:translate(0,0)}}
  .togglebtn{position:absolute; right:6px; top:6px; width:96px; height:28px; font-family:var(--body); font-weight:bold; font-size:12px; background:var(--bg); color:var(--ink);
    border:1.5px solid var(--seal); cursor:pointer; display:none; z-index:4;}
  .togglebtn.show{display:block;}
  .timerlbl{position:absolute; left:0; right:0; bottom:18px; text-align:center; font-family:var(--body); font-size:10px; color:var(--fgDim); pointer-events:none;}
`,
  html: `
      <canvas id="mazeCv" width="1044" height="381"></canvas>
      <button class="togglebtn" id="toggleBtn">◐&nbsp; TOGGLE</button>
      <div class="timerlbl" id="timerlbl">WASD / ↑↓←→ &nbsp; toggle light/dark to reveal hidden walls</div>
`,
  js: `
M.q = 25; M.next = 26; M.nextName = 'The Cookie';
/* ── exact port of the seeded generator ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xFFFFFFFF; }; }
const ROOM_COLS = 11, ROOM_ROWS = 8, GRID_COLS = ROOM_COLS * 2 + 1, GRID_ROWS = ROOM_ROWS * 2 + 1;
const S_RC = Math.floor(ROOM_COLS / 2), S_RR = ROOM_ROWS - 1;
const START_GCOL = S_RC * 2 + 1, START_GROW = S_RR * 2 + 1, EXIT_GCOL = S_RC * 2 + 1;
function findSolutionPath(grid) {
  const visited = Array.from({ length: GRID_ROWS }, () => new Array(GRID_COLS).fill(false));
  const parent = Array.from({ length: GRID_ROWS }, () => new Array(GRID_COLS).fill(null));
  const queue = [[START_GROW, START_GCOL]]; visited[START_GROW][START_GCOL] = true;
  let reached = false;
  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === 1 && c === EXIT_GCOL) { reached = true; break; }
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
      if (grid[nr][nc] !== 0 || visited[nr][nc]) continue;
      visited[nr][nc] = true; parent[nr][nc] = [r, c]; queue.push([nr, nc]);
    }
  }
  const path = []; let cur = reached ? [1, EXIT_GCOL] : null;
  while (cur) { path.unshift(cur); cur = parent[cur[0]][cur[1]]; }
  return path;
}
function generateStaticMaze() {
  const rng = makeRng(0xC0FFEE42);
  const grid = Array.from({ length: GRID_ROWS }, () => new Array(GRID_COLS).fill(1));
  for (let r = 0; r < ROOM_ROWS; r++) for (let c = 0; c < ROOM_COLS; c++) grid[r * 2 + 1][c * 2 + 1] = 0;
  const visited = Array.from({ length: ROOM_ROWS }, () => new Array(ROOM_COLS).fill(false));
  const stack = [[S_RR, S_RC]]; visited[S_RR][S_RC] = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1]; const nbrs = [];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < ROOM_ROWS && nc >= 0 && nc < ROOM_COLS && !visited[nr][nc]) nbrs.push([nr, nc, dr, dc]); }
    if (nbrs.length) { const [nr, nc, dr, dc] = nbrs[Math.floor(rng() * nbrs.length)]; visited[nr][nc] = true; grid[r * 2 + 1 + dr][c * 2 + 1 + dc] = 0; stack.push([nr, nc]); }
    else stack.pop();
  }
  grid[0][EXIT_GCOL] = 0;
  const path = findSolutionPath(grid);
  const passages = path.filter(([r, c]) => (r % 2 === 0 && c % 2 === 1) || (r % 2 === 1 && c % 2 === 0));
  const gates = [];
  if (passages.length >= 3) { const types = [2, 3, 2], fr = [0.25, 0.5, 0.75]; for (let i = 0; i < 3; i++) { const [r, c] = passages[Math.floor(passages.length * fr[i])]; grid[r][c] = types[i]; gates.push({ r, c, type: types[i] }); } }
  return { grid, gates };
}
const { grid: GRID, gates: GATES } = generateStaticMaze();
const solidAt = (r, c, dark) => { const t = GRID[r][c]; return t === 1 || (t === 2 && dark) || (t === 3 && !dark); };

/* ── constants from the source ── */
const SPEED = 7.5, HALF = 0.10, TIMER_SECS = 80, HIST_LEN = 150, SETBACK = 90;
const cv = $('mazeCv'), ctx = cv.getContext('2d');
const cellW = 1044 / GRID_COLS, cellH = 381 / GRID_ROWS;
M.level = { grid: GRID, gates: GATES, pos: { x: START_GCOL + 0.5, y: START_GROW + 0.5 }, solutionPath: findSolutionPath(GRID.map(row => row.map(t => (t === 2 || t === 3) ? 0 : t))), keys: new Set(), hist: [], histIdx: 0, timerLeft: TIMER_SECS, toggled: false, gateHits: 0, won: false };
for (let i = 0; i < HIST_LEN; i++) M.level.hist.push({ x: M.level.pos.x, y: M.level.pos.y });

function hitsWall(pos) {
  const c0 = Math.max(0, Math.floor(pos.x - HALF)), c1 = Math.min(GRID_COLS - 1, Math.floor(pos.x + HALF));
  const r0 = Math.max(0, Math.floor(pos.y - HALF)), r1 = Math.min(GRID_ROWS - 1, Math.floor(pos.y + HALF));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (solidAt(r, c, M.dark)) return { r, c };
  return null;
}
document.addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault(); M.level.keys.add(e.key); });
document.addEventListener('keyup', (e) => M.level.keys.delete(e.key));
window.addEventListener('blur', () => M.level.keys.clear());

let last = 0;
function frame(ts) {
  const L = M.level;
  const rawDt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016; last = ts;
  const dt = (M.paused || M.solved || M.ended) ? 0 : rawDt;
  if (dt > 0) {
    L.timerLeft -= dt;
    if (L.timerLeft <= 0) { L.timerLeft = TIMER_SECS; M.wrong('Time. The clock restarts. So do you, in a sense.'); }
    const k = L.keys; let vx = 0, vy = 0;
    if (k.has('ArrowLeft') || k.has('a') || k.has('A')) vx = -1;
    if (k.has('ArrowRight') || k.has('d') || k.has('D')) vx = 1;
    if (k.has('ArrowUp') || k.has('w') || k.has('W')) vy = -1;
    if (k.has('ArrowDown') || k.has('s') || k.has('S')) vy = 1;
    if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
    const wi = L.histIdx % HIST_LEN; L.hist[wi] = { x: L.pos.x, y: L.pos.y }; L.histIdx++;
    L.pos.x += vx * SPEED * dt; L.pos.y += vy * SPEED * dt;
    const hit = hitsWall(L.pos);
    if (hit) {
      const back = Math.min(SETBACK, L.histIdx); const ri = ((L.histIdx - back) % HIST_LEN + HIST_LEN) % HIST_LEN;
      L.pos = { x: L.hist[ri].x, y: L.hist[ri].y };
      M.events.push('oof'); cv.classList.remove('oof'); void cv.offsetWidth; cv.classList.add('oof');
      if (GRID[hit.r][hit.c] >= 2 && L.gateHits++ === 0) M.retype('That wall is only there in this light.');
    }
    if (L.pos.y < 0.9 && !L.won) { L.won = true; M.win('THROUGH.', 'Three of those walls only ever existed in one of the two rooms.'); }
  }
  draw(ts);
  requestAnimationFrame(frame);
}
function draw(ts) {
  const cs = getComputedStyle($('frame'));
  const ink = cs.getPropertyValue('--ink').trim(), dim = cs.getPropertyValue('--fgDim').trim(), accent = cs.getPropertyValue('--accent').trim(), hair = cs.getPropertyValue('--hairline').trim(), danger = cs.getPropertyValue('--danger').trim();
  ctx.clearRect(0, 0, 1044, 381);
  ctx.fillStyle = ink;
  for (let r = 0; r < GRID_ROWS; r++) for (let c = 0; c < GRID_COLS; c++) if (GRID[r][c] && solidAt(r, c, M.dark)) ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
  const pulse = 0.5 + 0.5 * Math.sin(ts / 380);
  ctx.fillStyle = 'rgba(62,107,79,' + (0.45 + pulse * 0.45) + ')'; ctx.beginPath(); ctx.arc((EXIT_GCOL + 0.5) * cellW, 0.5 * cellH, cellW * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dim; ctx.font = 'bold ' + Math.round(cellH * 1.1) + 'px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▲', (START_GCOL + 0.5) * cellW, (GRID_ROWS - 0.5) * cellH);
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(M.level.pos.x * cellW, M.level.pos.y * cellH, 5, 0, Math.PI * 2); ctx.fill();
  // timer bar
  const prog = Math.max(0, M.level.timerLeft / TIMER_SECS), barW = 1044 * 0.38, barX = (1044 - barW) / 2, barY = 381 - 14;
  ctx.strokeStyle = hair; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, 5);
  const urgent = prog < 0.33; ctx.fillStyle = urgent ? danger : 'hsl(' + Math.round(prog * 120) + ',50%,42%)'; ctx.fillRect(barX + 1, barY + 1, (barW - 2) * prog, 3);
  ctx.fillStyle = urgent ? danger : dim; ctx.font = 'bold 10px Helvetica, Arial'; ctx.textAlign = 'right'; ctx.fillText(Math.ceil(M.level.timerLeft) + 's', barX - 4, barY + 2.5);
}
requestAnimationFrame(frame);

// the trick: toggle via the pause menu; the shortcut appears after the first toggle
const who = document.querySelector('#examiner .who');
M.onDark = (dark) => {
  if (!M.level.toggled) { M.level.toggled = true; $('toggleBtn').classList.add('show'); M.events.push('toggled'); }
  who.textContent = dark ? 'EXAMINER (UNLIT)' : 'EXAMINER';
  $('examinerImg').src = '../public/assets/Player/Player_Up.png'; setTimeout(() => $('examinerImg').src = '../public/assets/Player/Player_Down.png', 400);
};
$('toggleBtn').onclick = () => { if (!M.paused) M.toggleDark(); };
M.retype('Some walls are only visible under the right conditions. Toggle your perspective to navigate.');
`,
};
