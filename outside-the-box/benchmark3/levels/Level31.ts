import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q31 — Hidden in the Dark ──────────────────────────────────────────────────
// The access code is printed in ink that only contrasts in LIGHT mode. In the
// default dark mode it's invisible. Toggle your perspective to read it, then pick
// the matching button. (Act IV: the exam starts hiding things from you.)

const SECRET_INDEX = 2;     // "PICK THE THIRD BUTTON"
const SECRET = 'PICK  THE  THIRD  BUTTON';

export const drawLevel31 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'ACCESS GRANTED.', 'The instruction was always there — just not in this light.', 32);
    return;
  }
  ensureActive(gc);

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('Follow the hidden instruction.', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  // Secret text — visible only in light mode (drawn near-bg in dark mode)
  ctx.fillStyle = state.darkMode ? '#161616' : '#111111';
  ctx.font      = `bold 30px ${displayFont}`;
  ctx.fillText(SECRET, cx, topBoxY + topBoxHeight * 0.30, topBoxWidth * 0.92);

  // Perspective toggle
  const tgW = topBoxWidth * 0.30, tgH = 40;
  drawChoice(gc, state.darkMode ? '◐  SWITCH TO LIGHT' : '◑  SWITCH TO DARK',
    cx - tgW / 2, topBoxY + topBoxHeight * 0.44, tgW, tgH, () => {
      state.darkMode = !state.darkMode; gc.render();
    }, { fontSize: 14 });

  // Four numbered buttons
  const n = 4;
  const btnW = topBoxWidth * 0.16;
  const btnH = topBoxHeight * 0.20;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.62;
  for (let i = 0; i < n; i++) {
    drawChoice(gc, String(i + 1), startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (i === SECRET_INDEX) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 28 });
  }

  ctx.fillStyle = t.fgDim;
  ctx.font = `13px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Tip: some things are only visible from another point of view.', cx, topBoxY + topBoxHeight * 0.86, topBoxWidth * 0.9);
};
