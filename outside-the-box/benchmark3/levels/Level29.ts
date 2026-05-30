import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q29 — Order of Operations ─────────────────────────────────────────────────
// 2 + 2 × 2. Read left to right and you get 8. Remember multiplication binds first
// and it is 6. The "obvious" sequential answer is the trap.

const CHOICES = ['4', '6', '8', '16'];
const CORRECT = '6';

export const drawLevel29 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'Multiplication before addition. 2 + (2 × 2) = 6.', 30);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 66px ${displayFont}`;
  ctx.fillText('2  +  2  ×  2  =  ?', cx, topBoxY + topBoxHeight * 0.30);

  ctx.fillStyle = t.fgDim;
  ctx.font      = `15px ${bodyFont}`;
  ctx.fillText('No calculator. No left-to-right shortcuts.', cx, topBoxY + topBoxHeight * 0.47, topBoxWidth * 0.9);

  const n = CHOICES.length;
  const btnW = topBoxWidth * 0.15;
  const btnH = 56;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.62;
  CHOICES.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (label === CORRECT) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 26 });
  });
};
