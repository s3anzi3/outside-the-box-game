import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q39 — Lights Out ──────────────────────────────────────────────────────────
// A 2×2 grid. Clicking a tile toggles it AND its orthogonal neighbours. Turn every
// tile ON. (Clicking all four, in any order, solves it — but figuring that out is
// the puzzle.)

const NEIGHBORS: number[][] = [
  [1, 2],   // 0 top-left  → right, down
  [0, 3],   // 1 top-right → left, down
  [0, 3],   // 2 bot-left  → up, right
  [1, 2],   // 3 bot-right → left, up
];

let lights39 = [false, false, false, false];

export const drawLevel39 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'ALL LIT.', 'Each click flips a tile and its neighbours. Hitting all four does it.', 40);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); lights39 = [false, false, false, false]; }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('Turn every panel ON.', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);
  ctx.fillStyle = t.fgDim;
  ctx.font = `14px ${bodyFont}`;
  ctx.fillText('A click flips that panel and the ones next to it.', cx, topBoxY + topBoxHeight * 0.19, topBoxWidth * 0.9);

  const gs = topBoxHeight * 0.50;
  const gx = cx - gs / 2;
  const gy = topBoxY + topBoxHeight * 0.28;
  const gap = gs * 0.06;
  const cell = (gs - gap) / 2;

  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = gx + col * (cell + gap);
    const by = gy + row * (cell + gap);
    ctx.fillStyle = lights39[i] ? '#f0d050' : (state.darkMode ? '#1c1c1c' : '#cfcfcf');
    ctx.fillRect(bx, by, cell, cell);
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, cell, cell);

    gc.hitAreas.push({
      x: bx, y: by, w: cell, h: cell,
      action: () => {
        lights39[i] = !lights39[i];
        NEIGHBORS[i].forEach((j) => { lights39[j] = !lights39[j]; });
        gc.sounds.play('typing', { volume: 0.4, restart: true });
        if (lights39.every(Boolean)) state.levelSubPhase = 'win';
        gc.render();
      },
    });
  }
};
