import { GameContext }  from '../types';
import { getTheme }     from '../theme';
import { getLayout }    from '../layout';
import { drawButton }   from '../renderer';
import Vec2             from '../../../Wolfie2D/DataTypes/Vec2';
import AABB             from '../../../Wolfie2D/DataTypes/Shapes/AABB';
import StateMachine     from '../../../Wolfie2D/DataTypes/State/StateMachine';
import State            from '../../../Wolfie2D/DataTypes/State/State';
import GameEvent        from '../../../Wolfie2D/Events/GameEvent';

// ── Seeded RNG (Xorshift32) ───────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

// ── Maze dimensions ───────────────────────────────────────────────────────────
const ROOM_COLS = 11;
const ROOM_ROWS = 8;
const GRID_COLS = ROOM_COLS * 2 + 1;   // 23
const GRID_ROWS = ROOM_ROWS * 2 + 1;   // 17

const S_RC = Math.floor(ROOM_COLS / 2);   // 5
const S_RR = ROOM_ROWS - 1;              // 7
const E_RC = Math.floor(ROOM_COLS / 2);   // 5
const E_RR = 0;

const START_GCOL = S_RC * 2 + 1;   // 11
const START_GROW = S_RR * 2 + 1;   // 15
const EXIT_GCOL  = E_RC * 2 + 1;   // 11

// ── Wall types ────────────────────────────────────────────────────────────────
// 0 = open passage
// 1 = always visible wall (neutral)
// 2 = dark-mode wall: visible in dark mode, INVISIBLE in light mode
// 3 = light-mode wall: visible in light mode, INVISIBLE in dark mode

// ── Static maze generation (seeded — same every time) ─────────────────────────
function generateStaticMaze(): number[][] {
  const rng = makeRng(0xC0FFEE42);

  const grid: number[][] = Array.from({ length: GRID_ROWS }, () =>
    new Array(GRID_COLS).fill(1)
  );

  // Open all room cells
  for (let r = 0; r < ROOM_ROWS; r++)
    for (let c = 0; c < ROOM_COLS; c++)
      grid[r * 2 + 1][c * 2 + 1] = 0;

  // Iterative DFS
  const visited: boolean[][] = Array.from({ length: ROOM_ROWS }, () =>
    new Array(ROOM_COLS).fill(false)
  );
  const stack: [number, number][] = [[S_RR, S_RC]];
  visited[S_RR][S_RC] = true;

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const nbrs: [number, number, number, number][] = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROOM_ROWS && nc >= 0 && nc < ROOM_COLS && !visited[nr][nc])
        nbrs.push([nr, nc, dr, dc]);
    }
    if (nbrs.length > 0) {
      const idx = Math.floor(rng() * nbrs.length);
      const [nr, nc, dr, dc] = nbrs[idx];
      visited[nr][nc] = true;
      grid[r * 2 + 1 + dr][c * 2 + 1 + dc] = 0;
      stack.push([nr, nc]);
    } else {
      stack.pop();
    }
  }

  // Exit door at top. Bottom is intentionally sealed — player spawns inside
  // the start room, so leaving an opening there lets them walk around the maze.
  grid[0][EXIT_GCOL] = 0;

  // Place 3 mode-toggle gates along the unique solution path. Alternating
  // types force the player to switch dark/light three times to reach the exit.
  // (Player starts in dark, so first gate is dark-blocking.)
  const path = findSolutionPath(grid);
  const passages = path.filter(([r, c]) =>
    (r % 2 === 0 && c % 2 === 1) || (r % 2 === 1 && c % 2 === 0)
  );
  if (passages.length >= 3) {
    const gateTypes = [2, 3, 2];
    const gateFracs = [0.25, 0.50, 0.75];
    for (let i = 0; i < 3; i++) {
      const [r, c] = passages[Math.floor(passages.length * gateFracs[i])];
      grid[r][c] = gateTypes[i];
    }
  }

  return grid;
}

// BFS the unique solution path through grid==0 cells from the start room to
// the topmost room on the exit column.
function findSolutionPath(grid: number[][]): Array<[number, number]> {
  const visited: boolean[][] = Array.from({ length: GRID_ROWS }, () =>
    new Array(GRID_COLS).fill(false)
  );
  const parent: Array<Array<[number, number] | null>> =
    Array.from({ length: GRID_ROWS }, () =>
      new Array<[number, number] | null>(GRID_COLS).fill(null)
    );
  const queue: Array<[number, number]> = [[START_GROW, START_GCOL]];
  visited[START_GROW][START_GCOL] = true;
  const TARGET_R = 1;
  const TARGET_C = EXIT_GCOL;
  let reached = false;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === TARGET_R && c === TARGET_C) { reached = true; break; }
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
      if (grid[nr][nc] !== 0 || visited[nr][nc]) continue;
      visited[nr][nc] = true;
      parent[nr][nc] = [r, c];
      queue.push([nr, nc]);
    }
  }

  const path: Array<[number, number]> = [];
  let cur: [number, number] | null = reached ? [TARGET_R, TARGET_C] : null;
  while (cur) {
    path.unshift(cur);
    cur = parent[cur[0]][cur[1]];
  }
  return path;
}

// Pre-compute once at module load — always the same maze
const STATIC_MAZE: number[][] = generateStaticMaze();

// Walls are mode-dependent: type 1 is always solid, type 2 is solid only in
// dark mode, type 3 is solid only in light mode. We pre-build one wall list
// per mode and swap which one the player collides against each frame.
function buildStaticWallsForMode(darkMode: boolean): AABB[] {
  const walls: AABB[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = STATIC_MAZE[r][c];
      const solid = cell === 1 ||
                    (cell === 2 && darkMode) ||
                    (cell === 3 && !darkMode);
      if (solid) walls.push(new AABB(new Vec2(c + 0.5, r + 0.5), new Vec2(0.5, 0.5)));
    }
  }
  return walls;
}

const STATIC_WALLS_DARK:  AABB[] = buildStaticWallsForMode(true);
const STATIC_WALLS_LIGHT: AABB[] = buildStaticWallsForMode(false);

// ── Constants ─────────────────────────────────────────────────────────────────
const PLAYER_SPEED25 = 7.5;
const PLAYER_HALF25  = 0.10;
const TIMER_SECS25   = 80;
const HIST_LEN25     = 150;
const SETBACK25      = 90;

// ── Wall collision check ───────────────────────────────────────────────────────
function hitsWall25(pos: Vec2, half: number, walls: AABB[]): boolean {
  for (const w of walls) {
    if (Math.abs(pos.x - w.center.x) < half + w.halfSize.x &&
        Math.abs(pos.y - w.center.y) < half + w.halfSize.y)
      return true;
  }
  return false;
}

// ── Shared state data ─────────────────────────────────────────────────────────
interface Maze25Data {
  pos:      Vec2;
  walls:    AABB[];
  keysDown: Set<string>;
  half:     number;
  won:      boolean;
  onWin:    () => void;
  onHitWall: () => void;
  histX:    Float32Array;
  histY:    Float32Array;
  histIdx:  number;
}

// ── Wolfie2D States ───────────────────────────────────────────────────────────
class Walk25State extends State {
  onEnter(_o: Record<string, any>): void {}
  onExit():  Record<string, any> { return {}; }
  handleInput(_e: GameEvent): void {}

  update(dt: number): void {
    const d = (this.parent as Player25SM).data;

    let vx = 0, vy = 0;
    if (d.keysDown.has('ArrowLeft')  || d.keysDown.has('a') || d.keysDown.has('A')) vx = -1;
    if (d.keysDown.has('ArrowRight') || d.keysDown.has('d') || d.keysDown.has('D')) vx =  1;
    if (d.keysDown.has('ArrowUp')    || d.keysDown.has('w') || d.keysDown.has('W')) vy = -1;
    if (d.keysDown.has('ArrowDown')  || d.keysDown.has('s') || d.keysDown.has('S')) vy =  1;
    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    const wi = d.histIdx % HIST_LEN25;
    d.histX[wi] = d.pos.x;
    d.histY[wi] = d.pos.y;
    d.histIdx++;

    const spd = PLAYER_SPEED25 * dt;
    d.pos.x += vx * spd;
    d.pos.y += vy * spd;

    if (hitsWall25(d.pos, d.half, d.walls)) {
      const setback = Math.min(SETBACK25, d.histIdx);
      const ri = ((d.histIdx - setback) % HIST_LEN25 + HIST_LEN25) % HIST_LEN25;
      d.pos.x = d.histX[ri];
      d.pos.y = d.histY[ri];
      d.onHitWall();
    }

    if (d.pos.y < 0.9) this.finished('win');
  }
}

class Win25State extends State {
  onEnter(_o: Record<string, any>): void {
    const d = (this.parent as Player25SM).data;
    d.won = true;
    d.onWin();
  }
  onExit():  Record<string, any> { return {}; }
  handleInput(_e: GameEvent): void {}
  update(_dt: number): void {}
}

class Player25SM extends StateMachine {
  data: Maze25Data;
  constructor(data: Maze25Data) {
    super();
    this.data = data;
    this.addState('walk', new Walk25State(this));
    this.addState('win',  new Win25State(this));
    this.initialize('walk', {});
  }
}

// ── Module-level state ────────────────────────────────────────────────────────
let animId25              = 0;
let lastTime25            = 0;
let timerEnd25            = 0;
let player25: Player25SM | null = null;
let pausedAt25            = 0;        // Date.now() when paused; 0 = not paused
let hasToggledDarkMode25  = false;    // true once player changes mode via pause menu
let prevDarkMode25: boolean | null = null;  // to detect mode change

// ── Draw function ─────────────────────────────────────────────────────────────
export const drawLevel25 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Initialise on fresh entry ──────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    const sx = START_GCOL + 0.5;
    const sy = START_GROW + 0.5;
    const histX = new Float32Array(HIST_LEN25).fill(sx);
    const histY = new Float32Array(HIST_LEN25).fill(sy);
    player25 = new Player25SM({
      pos:      new Vec2(sx, sy),
      walls:    state.darkMode ? STATIC_WALLS_DARK : STATIC_WALLS_LIGHT,
      keysDown: gc.keysDown,
      half:     PLAYER_HALF25,
      won:      false,
      onWin:    () => {
        gc.sounds.play("correctAnswer", { volume: 0.55 });
        cancelAnimationFrame(animId25);
        state.currentLevel  = 26;
        state.levelSubPhase = '';
      },
      onHitWall: () => { gc.sounds.play("mazeOof", { volume: 0.65 }); },
      histX,
      histY,
      histIdx:  0,
    });
    state.levelSubPhase      = 'active';
    lastTime25               = 0;
    timerEnd25               = Date.now() + TIMER_SECS25 * 1000;
    pausedAt25               = 0;
    hasToggledDarkMode25     = false;
    prevDarkMode25           = state.darkMode;
  }

  // ── Pause-timer freeze ────────────────────────────────────────────────────
  if (state.levelSubPhase === 'active') {
    if (state.paused || state.controlsOpen) {
      if (pausedAt25 === 0) pausedAt25 = Date.now();
    } else if (pausedAt25 > 0) {
      timerEnd25 += Date.now() - pausedAt25;
      pausedAt25  = 0;
    }
  }

  // ── Detect first dark-mode toggle (must come from pause menu before button shown) ──
  if (state.levelSubPhase === 'active' && !hasToggledDarkMode25) {
    if (prevDarkMode25 !== null && state.darkMode !== prevDarkMode25) {
      hasToggledDarkMode25 = true;
    }
  }
  prevDarkMode25 = state.darkMode;

  const cellW = topBoxWidth  / GRID_COLS;
  const cellH = topBoxHeight / GRID_ROWS;
  const ox    = topBoxX;
  const oy    = topBoxY;

  // ── Draw walls (type-dependent visibility) ─────────────────────────────────
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = STATIC_MAZE[r][c];
      if (cell === 0) continue;

      let visible = false;
      if (cell === 1) {
        // Always visible — use theme color
        ctx.fillStyle = t.fg;
        visible = true;
      } else if (cell === 2) {
        // Visible only in dark mode
        if (state.darkMode) {
          ctx.fillStyle = t.fg;
          visible = true;
        }
      } else if (cell === 3) {
        // Visible only in light mode
        if (!state.darkMode) {
          ctx.fillStyle = t.fg;
          visible = true;
        }
      }

      if (visible) {
        ctx.fillRect(ox + c * cellW, oy + r * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }

  // ── Exit glow ──────────────────────────────────────────────────────────────
  const exitPx = ox + (EXIT_GCOL + 0.5) * cellW;
  const exitPy = oy + 0.5 * cellH;
  const pulse  = 0.5 + 0.5 * Math.sin(Date.now() / 380);
  ctx.fillStyle = `rgba(40, 210, 80, ${0.5 + pulse * 0.45})`;
  ctx.beginPath();
  ctx.arc(exitPx, exitPy, cellW * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // ── Entry arrow ────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(cellH * 1.1)}px ${displayFont}`;
  ctx.fillText('▲', ox + (START_GCOL + 0.5) * cellW, oy + (GRID_ROWS - 0.5) * cellH);

  // ── Player dot ─────────────────────────────────────────────────────────────
  if (player25) {
    const px = ox + player25.data.pos.x * cellW;
    const py = oy + player25.data.pos.y * cellH;
    ctx.fillStyle = state.darkMode ? '#88aaff' : '#2244cc';
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, cellW * PLAYER_HALF25), 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Toggle button (top-right of maze) — only after first pause-menu toggle ──
  if (hasToggledDarkMode25) {
    const btnW  = 90;
    const btnH  = 28;
    const btnX  = ox + topBoxWidth - btnW - 6;
    const btnY  = oy + 6;
    ctx.fillStyle   = state.darkMode ? '#333355' : '#ddddcc';
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth   = 1.5;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle    = t.fg;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 12px ${bodyFont}`;
    ctx.fillText('◐  TOGGLE', btnX + btnW / 2, btnY + btnH / 2);
    gc.hitAreas.push({
      x: btnX, y: btnY, w: btnW, h: btnH,
      action: () => {
        state.darkMode = !state.darkMode;
        gc.render();
      },
    });
  }

  // ── Countdown timer bar ────────────────────────────────────────────────────
  const remaining = Math.max(0, timerEnd25 - Date.now());
  const progress  = remaining / (TIMER_SECS25 * 1000);
  const barW      = topBoxWidth * 0.38;
  const barH      = 5;
  const barX      = cx - barW / 2;
  const barY      = oy + topBoxHeight - 14;

  ctx.strokeStyle = t.divider;
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  const secs    = Math.ceil(remaining / 1000);
  const urgency = progress < 0.33;
  ctx.fillStyle = urgency ? `hsl(0,70%,50%)` : `hsl(${Math.round(progress * 120)},70%,45%)`;
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * progress, barH - 2);

  ctx.fillStyle    = urgency ? '#ff4444' : t.fgDim;
  ctx.font         = `bold 10px ${bodyFont}`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${secs}s`, barX - 4, barY + barH / 2);

  // ── Controls hint ──────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.font         = `10px ${bodyFont}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WASD / ↑↓←→  — toggle light/dark to reveal hidden walls', cx, barY + barH / 2);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  cancelAnimationFrame(animId25);
  if (state.currentLevel === 25 && !state.paused && !state.gameOver && !state.controlsOpen) {
    animId25 = requestAnimationFrame((ts: number) => {
      if (gc.state.currentLevel !== 25 || gc.state.currentScreen !== 'level') return;

      if (Date.now() >= timerEnd25 && gc.state.levelSubPhase === 'active') {
        timerEnd25 = Date.now() + TIMER_SECS25 * 1000;
        gc.loseLife();
        gc.render();
        return;
      }

      const dt = lastTime25 ? Math.min((ts - lastTime25) / 1000, 0.05) : 0.016;
      lastTime25 = ts;
      if (player25) {
        player25.data.walls = state.darkMode ? STATIC_WALLS_DARK : STATIC_WALLS_LIGHT;
        player25.update(dt);
      }
      gc.render();
    });
  }
};
