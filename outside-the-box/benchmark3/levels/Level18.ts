import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q18 — Binary Logic ────────────────────────────────────────────────────────
// "1 + 1 = ?" — trivially 2, unless you read the fine print: all values are in
// base 2, where 1 + 1 = 10.

const CHOICES = ['0', '2', '10', '11'];
const CORRECT = '10';

export const drawLevel18 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'In base 2, one plus one is 10. You checked the fine print.', 19);
    return;
  }
  ensureActive(gc);

  // The "easy" question
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 72px ${displayFont}`;
  ctx.fillText('1  +  1  =  ?', cx, topBoxY + topBoxHeight * 0.28);

  // The easy-to-miss fine print
  ctx.fillStyle    = t.fgDim;
  ctx.font         = `15px ${bodyFont}`;
  ctx.fillText('( all values in this question are expressed in base 2 )', cx, topBoxY + topBoxHeight * 0.46, topBoxWidth * 0.9);

  // Answer buttons
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
