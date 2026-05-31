import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q46 — Recall ──────────────────────────────────────────────────────────────
// Long ago, on Q11, a single word was buried in the fine print. Did it stick?

const OPTIONS: { label: string; correct: boolean }[] = [
  { label: 'PROTOCOL',  correct: false },
  { label: 'PINEAPPLE', correct: true  },
  { label: 'PAPERWORK', correct: false },
  { label: 'PASSWORD',  correct: false },
];

export const drawLevel46 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'PINEAPPLE.', 'Buried in the fine print on Q11. You were paying attention all along.', 47);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 23px ${displayFont}`;
  ctx.fillText('Back on Question 11, one word was hidden in the fine print.', cx, topBoxY + topBoxHeight * 0.16, topBoxWidth * 0.92);
  ctx.fillStyle = t.fgMid;
  ctx.font      = `bold 22px ${displayFont}`;
  ctx.fillText('What was it?', cx, topBoxY + topBoxHeight * 0.30);

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.20;
  const btnH = 54;
  const gap  = topBoxWidth * 0.025;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.58;
  OPTIONS.forEach(({ label, correct }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (correct) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 17 });
  });
};
