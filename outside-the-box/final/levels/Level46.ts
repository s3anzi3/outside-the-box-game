import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q46 — Recall ──────────────────────────────────────────────────────────────
// Way back on Q11, the "results" loading bar froze at 99%. How did you get past it?

const OPTIONS: { label: string; correct: boolean }[] = [
  { label: 'WAITED IT OUT',   correct: false },
  { label: 'CLICKED RETRY',   correct: false },
  { label: 'DRAGGED IT',      correct: true  },
  { label: 'REBOOTED',        correct: false },
];

export const drawLevel46 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'YOU DRAGGED IT.', 'The loading bar was never going to finish on its own. You did.', 47);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 23px ${displayFont}`;
  ctx.fillText('Back on Question 11, the results bar froze at 99%.', cx, topBoxY + topBoxHeight * 0.16, topBoxWidth * 0.92);
  ctx.fillStyle = t.fgMid;
  ctx.font      = `bold 22px ${displayFont}`;
  ctx.fillText('How did you finish it?', cx, topBoxY + topBoxHeight * 0.30);

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.21;
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
