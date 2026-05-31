import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q43 — Spot the Difference ─────────────────────────────────────────────────
// Two identical color grids — except one tile on the right is a different color.
// Click that tile.

const COLS = 6, ROWS = 4;
const PALETTE = ['#e25b5b', '#5bbf6f', '#5b8fe2', '#e2c25b', '#b06fe2', '#e2843b'];

let colors43: string[] = [];
let diffIndex43 = -1;
let diffColor43 = '';

const regen = () => {
  colors43 = Array.from({ length: COLS * ROWS }, () => PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  diffIndex43 = Math.floor(Math.random() * COLS * ROWS);
  do { diffColor43 = PALETTE[Math.floor(Math.random() * PALETTE.length)]; }
  while (diffColor43 === colors43[diffIndex43]);
};

export const drawLevel43 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'SPOTTED.', 'One tile out of forty-eight, off by a shade. Nicely done.', 44);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); regen(); }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('One tile on the right grid is different. Click it.', cx, topBoxY + topBoxHeight * 0.09, topBoxWidth * 0.92);

  const gridW = topBoxWidth * 0.40;
  const gridH = topBoxHeight * 0.55;
  const gapMid = topBoxWidth * 0.06;
  const leftX  = cx - gapMid / 2 - gridW;
  const rightX = cx + gapMid / 2;
  const gy = topBoxY + topBoxHeight * 0.26;
  const cw = gridW / COLS, ch = gridH / ROWS;

  const drawGrid = (ox: number, isRight: boolean) => {
    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS, row = Math.floor(i / COLS);
      const bx = ox + col * cw, by = gy + row * ch;
      ctx.fillStyle = (isRight && i === diffIndex43) ? diffColor43 : colors43[i];
      ctx.fillRect(bx, by, cw - 2, ch - 2);
      if (isRight) {
        gc.hitAreas.push({
          x: bx, y: by, w: cw - 2, h: ch - 2,
          action: () => {
            if (i === diffIndex43) { state.levelSubPhase = 'win'; gc.render(); }
            else wrong(gc);
          },
        });
      }
    }
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 2, gy - 2, gridW, gridH);
  };

  drawGrid(leftX, false);
  drawGrid(rightX, true);
};
