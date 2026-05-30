import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q13 — Count Again ─────────────────────────────────────────────────────────
// The famous "count the F's" sentence. Most people answer 3 — they skip the F in
// every "OF" because the brain reads it as a "V" sound. The true count is 6.

// Canonical sentence — exactly six F's (three of them inside "OF").
const SENTENCE = [
  'FINISHED FILES ARE THE RESULT OF',
  'YEARS OF SCIENTIFIC STUDY COMBINED',
  'WITH THE EXPERIENCE OF YEARS.',
];
const CHOICES = ['3', '4', '5', '6'];
const CORRECT = '6';

export const drawLevel13 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'SIX.', 'Three of them hide inside the word "OF". Most people never see them.', 14);
    return;
  }
  ensureActive(gc);

  // Question
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('How many times does the letter  F  appear?', cx, topBoxY + topBoxHeight * 0.08, topBoxWidth * 0.9);

  // The sentence
  ctx.font      = `bold 26px ${bodyFont}`;
  ctx.fillStyle = t.fgMid;
  const sgap = topBoxHeight * 0.11;
  let sy = topBoxY + topBoxHeight * 0.28;
  for (const line of SENTENCE) { ctx.fillText(line, cx, sy, topBoxWidth * 0.92); sy += sgap; }

  // Answer buttons
  const btnW = topBoxWidth * 0.15;
  const btnH = 54;
  const gap  = topBoxWidth * 0.03;
  const totW = CHOICES.length * btnW + (CHOICES.length - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.74;
  CHOICES.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (label === CORRECT) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 26 });
  });
};
