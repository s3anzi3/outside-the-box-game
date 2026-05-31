import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q34 — Spot the Imposter ───────────────────────────────────────────────────
// A grid of identical glyphs hides one that's subtly different. Find and click it.
// Pure perception; the imposter's position is randomised each attempt.

const COLS = 8;
const ROWS = 5;
const COMMON   = 'O';
const IMPOSTER = '0';   // a zero hiding among letter O's

let imposter34 = -1;

export const drawLevel34 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'FOUND IT.', 'A single zero hiding among the letter O’s. Sharp eyes.', 35);
    return;
  }
  if (state.levelSubPhase !== 'active') {
    ensureActive(gc);
    imposter34 = Math.floor(Math.random() * COLS * ROWS);
  }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('One of these does not belong. Click it.', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  const gridW = topBoxWidth * 0.78;
  const gridH = topBoxHeight * 0.62;
  const gx = cx - gridW / 2;
  const gy = topBoxY + topBoxHeight * 0.26;
  const cellW = gridW / COLS;
  const cellH = gridH / ROWS;

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(cellH * 0.5)}px ${displayFont}`;
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const bx = gx + col * cellW, by = gy + row * cellH;
    ctx.fillStyle = t.fgMid;
    ctx.fillText(i === imposter34 ? IMPOSTER : COMMON, bx + cellW / 2, by + cellH / 2);
    gc.hitAreas.push({
      x: bx, y: by, w: cellW, h: cellH,
      action: () => {
        if (i === imposter34) { state.levelSubPhase = 'win'; gc.render(); }
        else wrong(gc);
      },
    });
  }
};
