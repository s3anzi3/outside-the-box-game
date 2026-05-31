import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q16 — The Honest Option ───────────────────────────────────────────────────
// The question gives no information at all. The only clue is in the Exam Guide's
// speech (LEVEL_DATA Q16) — which quietly tells you to pick BLUE. Rewards the
// player who finally reads the narration, and advances the "guide helps you" beat.

const CORRECT = 'BLUE';
const OPTIONS: { label: string; fill: string; text: string }[] = [
  { label: 'RED',    fill: '#c63b3b', text: '#ffffff' },
  { label: 'BLUE',   fill: '#3b6fc6', text: '#ffffff' },
  { label: 'GREEN',  fill: '#39a05a', text: '#ffffff' },
  { label: 'YELLOW', fill: '#d9b62e', text: '#1a1a1a' },
];

export const drawLevel16 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'You listened to the one voice that was actually on your side.', 17);
    return;
  }
  ensureActive(gc);

  // Deliberately information-free prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 28px ${displayFont}`;
  ctx.fillText('Select the correct answer.', cx, topBoxY + topBoxHeight * 0.14, topBoxWidth * 0.9);

  ctx.font      = `15px ${gc.bodyFont}`;
  ctx.fillStyle = t.fgDim;
  ctx.fillText('(no further information will be provided by the exam)', cx, topBoxY + topBoxHeight * 0.28, topBoxWidth * 0.9);

  // Four colored options
  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.18;
  const btnH = topBoxHeight * 0.22;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.50;
  OPTIONS.forEach(({ label, fill, text }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (label === CORRECT) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 20, fill, textColor: text });
  });
};
