import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q19 — The Pattern ─────────────────────────────────────────────────────────
// O T T F F S S ?  — these aren't a number sequence, they're the first letters of
// One, Two, Three, Four, Five, Six, Seven. The next is Eight → E.

const SEQUENCE = 'O   T   T   F   F   S   S   ?';
const CHOICES = ['8', 'E', 'T', 'N'];
const CORRECT = 'E';

export const drawLevel19 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'E  FOR  EIGHT.', 'One, Two, Three… they were never numbers. Said out loud, it’s obvious.', 20);
    return;
  }
  ensureActive(gc);

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('Complete the sequence:', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  // The sequence
  ctx.fillStyle    = t.fgMid;
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 54px ${displayFont}`;
  ctx.fillText(SEQUENCE, cx, topBoxY + topBoxHeight * 0.36, topBoxWidth * 0.95);

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
