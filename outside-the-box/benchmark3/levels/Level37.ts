import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q37 — Count the Squares ───────────────────────────────────────────────────
// A 3×3 grid. "How many squares?" The instinctive answer is 9 (the little ones).
// But 2×2 blocks (4) and the whole 3×3 (1) count too → 14.

const CHOICES = ['9', '13', '14', '16'];
const CORRECT = '14';

export const drawLevel37 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'FOURTEEN.', 'Nine small, four 2×2 blocks, one big one. 9 + 4 + 1 = 14.', 38);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('How many squares are in this figure?', cx, topBoxY + topBoxHeight * 0.08, topBoxWidth * 0.9);

  // 3×3 grid
  const gs = topBoxHeight * 0.40;
  const gx = cx - gs / 2;
  const gy = topBoxY + topBoxHeight * 0.22;
  const cell = gs / 3;
  ctx.strokeStyle = t.fg;
  ctx.lineWidth = 3;
  for (let i = 0; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(gx + i * cell, gy); ctx.lineTo(gx + i * cell, gy + gs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy + i * cell); ctx.lineTo(gx + gs, gy + i * cell); ctx.stroke();
  }

  const n = CHOICES.length;
  const btnW = topBoxWidth * 0.15;
  const btnH = 54;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.78;
  CHOICES.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (label === CORRECT) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 24 });
  });
};
