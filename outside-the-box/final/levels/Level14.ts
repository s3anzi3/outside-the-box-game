import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q14 — Backwards Day ───────────────────────────────────────────────────────
// The instruction is rendered horizontally mirrored. Read normally it is gibberish;
// flip your perspective (a mirror, or tilt your head) and it says which box to click.

const INSTRUCTION = 'CLICK  THE  THIRD  BOX';
const CORRECT_INDEX = 2; // third box (0-based)

export const drawLevel14 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'You read it the other way around.', 15);
    return;
  }
  ensureActive(gc);

  // Small note (also mirrored, for flavor) — drawn normally so the player isn't lost
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `16px ${gc.bodyFont}`;
  ctx.fillText('Display fault: text is reversed.', cx, topBoxY + topBoxHeight * 0.09);

  // Mirrored instruction
  const my = topBoxY + topBoxHeight * 0.30;
  ctx.save();
  ctx.translate(cx, my);
  ctx.scale(-1, 1);
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 40px ${displayFont}`;
  ctx.fillText(INSTRUCTION, 0, 0);
  ctx.restore();

  // Four boxes labelled 1–4 (normal orientation)
  const n = 4;
  const boxW = topBoxWidth * 0.16;
  const boxH = topBoxHeight * 0.26;
  const gap  = topBoxWidth * 0.04;
  const totW = n * boxW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const boxY = topBoxY + topBoxHeight * 0.55;
  for (let i = 0; i < n; i++) {
    drawChoice(gc, String(i + 1), startX + i * (boxW + gap), boxY, boxW, boxH, () => {
      if (i === CORRECT_INDEX) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 32 });
  }
};
