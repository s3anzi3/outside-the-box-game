import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q35 — Lateral Riddle ──────────────────────────────────────────────────────
// A classic misdirection riddle. The answer is a keyboard.

const RIDDLE = [
  'I have keys, but open no locks.',
  'I have space, but no room.',
  'You can enter, but cannot go inside.',
];
const OPTIONS: { label: string; correct: boolean }[] = [
  { label: 'A HOUSE',    correct: false },
  { label: 'A KEYBOARD', correct: true  },
  { label: 'A PIANO',    correct: false },
  { label: 'A MAP',      correct: false },
];

export const drawLevel35 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'A KEYBOARD.', 'Keys, space, enter — all there, none of them literal.', 36);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('What am I?', cx, topBoxY + topBoxHeight * 0.09);

  ctx.fillStyle = t.fgMid;
  ctx.font      = `20px ${bodyFont}`;
  RIDDLE.forEach((line, i) => {
    ctx.fillText(line, cx, topBoxY + topBoxHeight * (0.24 + i * 0.10), topBoxWidth * 0.9);
  });

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.20;
  const btnH = 52;
  const gap  = topBoxWidth * 0.025;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.66;
  OPTIONS.forEach(({ label, correct }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (correct) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 16 });
  });
};
