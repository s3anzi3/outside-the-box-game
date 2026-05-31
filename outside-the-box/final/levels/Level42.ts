import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q42 — Trick Arithmetic ────────────────────────────────────────────────────
// "How many times can you subtract 5 from 25?" Once — after that you're subtracting
// from 20, not 25.

const CHOICES = ['1', '4', '5', '0'];
const CORRECT = '1';

export const drawLevel42 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'ONCE.', 'After the first subtraction it’s 20, not 25. The question never changes.', 43);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('How many times can you', cx, topBoxY + topBoxHeight * 0.16, topBoxWidth * 0.9);
  ctx.fillText('subtract 5 from 25?', cx, topBoxY + topBoxHeight * 0.28, topBoxWidth * 0.9);

  const n = CHOICES.length;
  const btnW = topBoxWidth * 0.15;
  const btnH = 56;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.55;
  CHOICES.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (label === CORRECT) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 26 });
  });
};
