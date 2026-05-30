import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q41 — Anagram ─────────────────────────────────────────────────────────────
// Unscramble the letters. Only one option is a real word.

const SCRAMBLED = 'D   L   R   O   W';
const OPTIONS: { label: string; correct: boolean }[] = [
  { label: 'WORLD', correct: true  },
  { label: 'WORDL', correct: false },
  { label: 'DROWL', correct: false },
  { label: 'LWORD', correct: false },
];

export const drawLevel41 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'WORLD.', 'The only arrangement that spells anything real.', 42);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('Unscramble the letters.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  ctx.fillStyle = t.fgMid;
  ctx.font      = `bold 52px ${displayFont}`;
  ctx.fillText(SCRAMBLED, cx, topBoxY + topBoxHeight * 0.32, topBoxWidth * 0.92);

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.18;
  const btnH = 54;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.62;
  OPTIONS.forEach(({ label, correct }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (correct) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 22 });
  });
};
