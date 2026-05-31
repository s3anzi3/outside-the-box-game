import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q30 — Halfway Checkpoint ──────────────────────────────────────────────────
// The midpoint of the exam. A breather and a callback: back on Q16 the Exam Guide
// quietly told you to pick BLUE. Were you listening? Rewards memory + pays off the
// "guide is on your side" thread before Act IV destabilizes the exam.

const CORRECT = 'BLUE';
const OPTIONS: { label: string; fill: string; text: string }[] = [
  { label: 'RED',    fill: '#c63b3b', text: '#ffffff' },
  { label: 'BLUE',   fill: '#3b6fc6', text: '#ffffff' },
  { label: 'GREEN',  fill: '#39a05a', text: '#ffffff' },
  { label: 'YELLOW', fill: '#d9b62e', text: '#1a1a1a' },
];

export const drawLevel30 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'YOU REMEMBERED.', 'Halfway there. Twenty-five questions left — and they get stranger.', 31);
    return;
  }
  ensureActive(gc);

  // Checkpoint banner
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 13px ${displayFont}`;
  ctx.fillText('— CHECKPOINT · QUESTION 30 OF 50 —', cx, topBoxY + topBoxHeight * 0.08);

  ctx.fillStyle = t.fg;
  ctx.font      = `bold 24px ${displayFont}`;
  ctx.fillText('Halfway. Let us see if you have been paying attention.', cx, topBoxY + topBoxHeight * 0.18, topBoxWidth * 0.92);

  ctx.fillStyle = t.fgMid;
  ctx.font      = `18px ${bodyFont}`;
  ctx.fillText('Back on Question 16, I quietly told you which answer to pick.', cx, topBoxY + topBoxHeight * 0.31, topBoxWidth * 0.92);
  ctx.fillText('Which color was it?', cx, topBoxY + topBoxHeight * 0.39, topBoxWidth * 0.92);

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.18;
  const btnH = topBoxHeight * 0.20;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.55;
  OPTIONS.forEach(({ label, fill, text }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (label === CORRECT) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 20, fill, textColor: text });
  });
};
