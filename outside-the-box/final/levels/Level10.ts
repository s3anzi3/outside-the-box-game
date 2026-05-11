import { GameContext }  from '../types';
import { getTheme }     from '../theme';
import { getLayout }    from '../layout';
import { drawButton }   from '../renderer';
import Vec2             from '../../../Wolfie2D/DataTypes/Vec2';
import AABB             from '../../../Wolfie2D/DataTypes/Shapes/AABB';
import StateMachine     from '../../../Wolfie2D/DataTypes/State/StateMachine';
import State            from '../../../Wolfie2D/DataTypes/State/State';
import GameEvent        from '../../../Wolfie2D/Events/GameEvent';

// ── Maze dimensions ───────────────────────────────────────────────────────────
// Rooms at odd grid indices, walls between rooms at even indices.
const ROOM_COLS = 17;
const ROOM_ROWS = 13;
const GRID_COLS = ROOM_COLS * 2 + 1;   // 35
const GRID_ROWS = ROOM_ROWS * 2 + 1;   // 27

// Start = bottom-center room, Exit = top-center room
const S_RC = Math.floor(ROOM_COLS / 2);  // 8
const S_RR = ROOM_ROWS - 1;              // 12
const E_RC = Math.floor(ROOM_COLS / 2);  // 8
const E_RR = 0;

const START_GCOL = S_RC * 2 + 1;   // 17
const START_GROW = S_RR * 2 + 1;   // 25
const EXIT_GCOL  = E_RC * 2 + 1;   // 17

// ── Constants ─────────────────────────────────────────────────────────────────
const PLAYER_SPEED  = 7.5;
const PLAYER_HALF   = 0.10;   // tiny dot — 20% of corridor width
const LOOP_CHANCE   = 0.05;   // almost perfect maze, very few shortcuts
const TIMER_SECS    = 45;     // lose a life every 45 s (independent of position)
const HIST_LEN      = 180;    // position history frames (~3 s at 60 fps)
const SETBACK_FRAMES = 90;    // on wall hit: rewind ~1.5 s of progress

// ── Maze generator (iterative DFS + sparse loop pass) ────────────────────────
function generateMaze(): number[][] {
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
      const [nr, nc, dr, dc] = nbrs[Math.floor(Math.random() * nbrs.length)];
      visited[nr][nc] = true;
      grid[r * 2 + 1 + dr][c * 2 + 1 + dc] = 0;
      stack.push([nr, nc]);
    } else {
      stack.pop();
    }
  }

  // Sparse loop pass — 5% of passage walls opened
  for (let r = 1; r < GRID_ROWS - 1; r++) {
    for (let c = 1; c < GRID_COLS - 1; c++) {
      if (grid[r][c] !== 1) continue;
      const isPassage = (r % 2 === 0 && c % 2 === 1) || (r % 2 === 1 && c % 2 === 0);
      if (isPassage && Math.random() < LOOP_CHANCE) grid[r][c] = 0;
    }
  }

  // Exit door at top. Bottom is intentionally sealed — player spawns inside
  // the start room, so leaving an opening there lets them walk around the maze.
  grid[0][EXIT_GCOL] = 0;

  return grid;
}

// ── AABB wall builder ─────────────────────────────────────────────────────────
function buildWalls(grid: number[][]): AABB[] {
  const walls: AABB[] = [];
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      if (grid[r][c] === 1)
        walls.push(new AABB(new Vec2(c + 0.5, r + 0.5), new Vec2(0.5, 0.5)));
  return walls;
}

// ── AABB overlap check — returns true if pos overlaps any wall ────────────────
function hitsWall(pos: Vec2, half: number, walls: AABB[]): boolean {
  for (const w of walls) {
    if (Math.abs(pos.x - w.center.x) < half + w.halfSize.x &&
        Math.abs(pos.y - w.center.y) < half + w.halfSize.y)
      return true;
  }
  return false;
}

// ── Shared state data ─────────────────────────────────────────────────────────
interface MazeData {
  pos:      Vec2;
  startX:   number;
  startY:   number;
  walls:    AABB[];
  keysDown: Set<string>;
  half:     number;
  won:      boolean;
  onWin:    () => void;
  onHitWall: () => void;
  // Rolling position history for setback-on-hit
  histX:    Float32Array;
  histY:    Float32Array;
  histIdx:  number;   // next write slot (unbounded counter)
}

// ── Wolfie2D States ───────────────────────────────────────────────────────────

class MazeWalkState extends State {
  onEnter(_o: Record<string, any>): void {}
  onExit():  Record<string, any> { return {}; }
  handleInput(_e: GameEvent): void {}

  update(dt: number): void {
    const d = (this.parent as MazePlayerSM).data;

    let vx = 0, vy = 0;
    if (d.keysDown.has('ArrowLeft')  || d.keysDown.has('a') || d.keysDown.has('A')) vx = -1;
    if (d.keysDown.has('ArrowRight') || d.keysDown.has('d') || d.keysDown.has('D')) vx =  1;
    if (d.keysDown.has('ArrowUp')    || d.keysDown.has('w') || d.keysDown.has('W')) vy = -1;
    if (d.keysDown.has('ArrowDown')  || d.keysDown.has('s') || d.keysDown.has('S')) vy =  1;
    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    // ── Record current position in history before moving ─────────────────────
    const wi = d.histIdx % HIST_LEN;
    d.histX[wi] = d.pos.x;
    d.histY[wi] = d.pos.y;
    d.histIdx++;

    const spd = PLAYER_SPEED * dt;
    d.pos.x += vx * spd;
    d.pos.y += vy * spd;

    // ── Collision → rewind progress by SETBACK_FRAMES ────────────────────────
    if (hitsWall(d.pos, d.half, d.walls)) {
      const setback = Math.min(SETBACK_FRAMES, d.histIdx);
      const ri = ((d.histIdx - setback) % HIST_LEN + HIST_LEN) % HIST_LEN;
      d.pos.x = d.histX[ri];
      d.pos.y = d.histY[ri];
      d.onHitWall();
    }

    // ── Win: reached top exit door ───────────────────────────────────────────
    if (d.pos.y < 0.9) this.finished('win');
  }
}

class MazeWinState extends State {
  onEnter(_o: Record<string, any>): void {
    const d = (this.parent as MazePlayerSM).data;
    d.won = true;
    d.onWin();
  }
  onExit():  Record<string, any> { return {}; }
  handleInput(_e: GameEvent): void {}
  update(_dt: number): void {}
}

// ── MazePlayerSM — Wolfie2D StateMachine ─────────────────────────────────────
class MazePlayerSM extends StateMachine {
  data: MazeData;
  constructor(data: MazeData) {
    super();
    this.data = data;
    this.addState('walk', new MazeWalkState(this));
    this.addState('win',  new MazeWinState(this));
    this.initialize('walk', {});
  }
}

// ── Module-level game state ───────────────────────────────────────────────────
let animId10    = 0;
let lastTime10  = 0;
let timerEnd10  = 0;   // absolute ms timestamp when next life is lost
let mazeGrid:   number[][] = [];
let mazePlayer: MazePlayerSM | null = null;

// ── Draw function ─────────────────────────────────────────────────────────────
export const drawLevel10 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Win screen ─────────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(animId10);
    ctx.fillStyle    = t.fg;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 44px ${displayFont}`;
    ctx.fillText('EXIT FOUND!', cx, topBoxY + topBoxHeight * 0.34);
    ctx.font      = `20px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    ctx.fillText('You navigated the maze.', cx, topBoxY + topBoxHeight * 0.50);
    drawButton(gc, 'CONTINUE  →', cx - 100, topBoxY + topBoxHeight * 0.65, 200, 48, () => {
      state.currentLevel  = 11;
      state.levelSubPhase = '';
      gc.render();
    });
    return;
  }

  // ── Initialise on fresh entry ──────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    mazeGrid = generateMaze();
    const walls = buildWalls(mazeGrid);
    const sx = START_GCOL + 0.5;
    const sy = START_GROW + 0.5;
    // Pre-fill history with start position so early hits land back at start
    const histX = new Float32Array(HIST_LEN).fill(sx);
    const histY = new Float32Array(HIST_LEN).fill(sy);
    mazePlayer = new MazePlayerSM({
      pos:      new Vec2(sx, sy),
      startX:   sx,
      startY:   sy,
      walls,
      keysDown: gc.keysDown,
      half:     PLAYER_HALF,
      won:      false,
      onWin:    () => { state.levelSubPhase = 'win'; },
      onHitWall: () => { gc.sounds.play("mazeOof", { volume: 0.65 }); },
      histX,
      histY,
      histIdx:  0,
    });
    state.levelSubPhase = 'active';
    lastTime10 = 0;
    timerEnd10 = Date.now() + TIMER_SECS * 1000;
  }

  const cellW = topBoxWidth  / GRID_COLS;
  const cellH = topBoxHeight / GRID_ROWS;
  const ox    = topBoxX;
  const oy    = topBoxY;

  // ── Draw walls ─────────────────────────────────────────────────────────────
  ctx.fillStyle = t.fg;
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      if (mazeGrid[r][c] === 1)
        ctx.fillRect(ox + c * cellW, oy + r * cellH, cellW + 0.5, cellH + 0.5);

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
  if (mazePlayer) {
    const px = ox + mazePlayer.data.pos.x * cellW;
    const py = oy + mazePlayer.data.pos.y * cellH;
    ctx.fillStyle = state.darkMode ? '#88aaff' : '#2244cc';
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, cellW * PLAYER_HALF), 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Countdown timer bar ────────────────────────────────────────────────────
  const remaining = Math.max(0, timerEnd10 - Date.now());
  const progress  = remaining / (TIMER_SECS * 1000);
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
  ctx.fillText('WASD / ↑↓←→  — touch a wall and you restart', cx, barY + barH / 2);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  cancelAnimationFrame(animId10);
  if (state.currentLevel === 10 && !state.paused && !state.gameOver && !state.controlsOpen) {
    animId10 = requestAnimationFrame((ts: number) => {
      if (gc.state.currentLevel !== 10 || gc.state.currentScreen !== 'level') return;

      // ── 30-second countdown — fires independently of wall hits ─────────────
      if (Date.now() >= timerEnd10 && gc.state.levelSubPhase === 'active') {
        timerEnd10 = Date.now() + TIMER_SECS * 1000;  // reset timer, do NOT move player
        gc.loseLife();
        gc.render();
        return;
      }

      const dt = lastTime10 ? Math.min((ts - lastTime10) / 1000, 0.05) : 0.016;
      lastTime10 = ts;
      if (mazePlayer) mazePlayer.update(dt);  // Wolfie2D StateMachine drives player
      gc.render();
    });
  }
};
