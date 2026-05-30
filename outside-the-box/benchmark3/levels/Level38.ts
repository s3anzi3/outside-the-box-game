import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q38 — What Comes Next ─────────────────────────────────────────────────────
// An arrow rotates 90° clockwise each step: → ↓ ← ?  The next is ↑.

const SEQUENCE = ['→', '↓', '←', '?'];
const OPTIONS: { label: string; correct: boolean }[] = [
  { label: '↑', correct: true  },   // up — continues the clockwise turn
  { label: '→', correct: false },
  { label: '↓', correct: false },
  { label: '←', correct: false },
];

export const drawLevel38 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'Each arrow turns 90° clockwise. After ← comes ↑.', 39);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('What comes next?', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  // Sequence
  const seqY = topBoxY + topBoxHeight * 0.36;
  const spacing = topBoxWidth * 0.13;
  const seqStart = cx - spacing * (SEQUENCE.length - 1) / 2;
  ctx.textBaseline = 'middle';
  SEQUENCE.forEach((g, i) => {
    ctx.fillStyle = g === '?' ? t.fgDim : t.fg;
    ctx.font = `bold 64px ${displayFont}`;
    ctx.fillText(g, seqStart + i * spacing, seqY);
  });

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.15;
  const btnH = topBoxHeight * 0.22;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.60;
  OPTIONS.forEach(({ label, correct }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (correct) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 40 });
  });
};
