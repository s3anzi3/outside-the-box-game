import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q36 — Do Not Trust the Exam ───────────────────────────────────────────────
// The exam pre-selects an answer and labels it "RECOMMENDED". It's wrong. Blindly
// hitting CONFIRM fails; you have to override the default and pick the truth.
// (Act IV: the system is no longer on your side. The Guide still is.)

const OPTIONS = ['54', '56', '49', '64'];
const RECOMMENDED = 0;   // the exam's (wrong) default
const CORRECT     = 1;   // 7 × 8 = 56

let selected36 = RECOMMENDED;

export const drawLevel36 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'OVERRIDDEN.', 'The exam recommended 54. You knew better: 7 × 8 = 56.', 37);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); selected36 = RECOMMENDED; }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 52px ${displayFont}`;
  ctx.fillText('7  ×  8  =  ?', cx, topBoxY + topBoxHeight * 0.22);

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.16;
  const btnH = topBoxHeight * 0.18;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.40;
  OPTIONS.forEach((label, i) => {
    const bx = startX + i * (btnW + gap);
    const isSel = i === selected36;
    drawChoice(gc, label, bx, btnY, btnW, btnH, () => {
      selected36 = i; gc.render();
    }, { fontSize: 26, fill: isSel ? (state.darkMode ? '#33401e' : '#d6e8b0') : undefined });

    if (i === RECOMMENDED) {
      ctx.fillStyle = '#d4b820';
      ctx.font = `bold 11px ${displayFont}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('RECOMMENDED', bx + btnW / 2, btnY - 16);
    }
    if (isSel) {
      ctx.strokeStyle = '#5bbf6f';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, btnY, btnW, btnH);
    }
  });

  // CONFIRM — submits whatever is selected
  const cW = topBoxWidth * 0.28, cH = 50;
  drawChoice(gc, 'CONFIRM SELECTION', cx - cW / 2, topBoxY + topBoxHeight * 0.70, cW, cH, () => {
    if (selected36 === CORRECT) { state.levelSubPhase = 'win'; }
    else gc.loseLife();
    gc.render();
  }, { fontSize: 16 });

  ctx.fillStyle = t.fgDim;
  ctx.font = `13px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('The exam has already chosen for you. It is wrong.', cx, topBoxY + topBoxHeight * 0.86, topBoxWidth * 0.9);
};
