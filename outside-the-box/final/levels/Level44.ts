import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q44 — Whodunit ────────────────────────────────────────────────────────────
// A small deduction. Read the clues, eliminate, and name the culprit. Only Cleo
// fits: the theft was in the morning, Ada was in a meeting, Ben was away.

const CLUES = [
  'Someone took the last stapler this MORNING.',
  'Ada was in an all-morning meeting, witnessed by ten people.',
  'Ben has been on vacation in another country all week.',
  'Cleo clocked in early and was seen near the supply closet.',
];
const OPTIONS: { label: string; correct: boolean }[] = [
  { label: 'ADA',  correct: false },
  { label: 'BEN',  correct: false },
  { label: 'CLEO', correct: true  },
  { label: 'NOBODY', correct: false },
];

export const drawLevel44 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CASE CLOSED.', 'Ada was in a meeting, Ben was abroad. Only Cleo had the chance.', 45);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('Who took the stapler?', cx, topBoxY + topBoxHeight * 0.07, topBoxWidth * 0.9);

  ctx.fillStyle = t.fgMid;
  ctx.font      = `16px ${bodyFont}`;
  ctx.textAlign = 'left';
  const lx = topBoxX + topBoxWidth * 0.12;
  CLUES.forEach((line, i) => {
    ctx.fillText('•  ' + line, lx, topBoxY + topBoxHeight * (0.20 + i * 0.09), topBoxWidth * 0.78);
  });

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.17;
  const btnH = 50;
  const gap  = topBoxWidth * 0.025;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.70;
  OPTIONS.forEach(({ label, correct }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (correct) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 18 });
  });
};
