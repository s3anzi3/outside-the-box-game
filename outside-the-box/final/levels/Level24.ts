import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';
import { drawChoice, wrong } from './lateralHelpers';

// ── Decoy buttons scattered around the box (all lose a life) ──────────────────
// Positions are fractions of topBoxWidth / topBoxHeight
const DECOYS: { label: string; fx: number; fy: number; fw: number; fh: number }[] = [
  { label: 'HINT',             fx: 0.02,  fy: 0.04,  fw: 0.14,  fh: 0.09 },
  { label: 'CALCULATE',        fx: 0.84,  fy: 0.04,  fw: 0.14,  fh: 0.09 },
  { label: 'EASY  MODE  ON',   fx: 0.32,  fy: 0.03,  fw: 0.22,  fh: 0.08 },
  { label: 'SHOW STEPS',       fx: 0.01,  fy: 0.40,  fw: 0.18,  fh: 0.09 },
  { label: 'SKIP  →',          fx: 0.83,  fy: 0.40,  fw: 0.15,  fh: 0.09 },
  { label: 'CONFIRM',          fx: 0.29,  fy: 0.71,  fw: 0.20,  fh: 0.11 },
  { label: 'CHECK ANSWER',     fx: 0.02,  fy: 0.74,  fw: 0.20,  fh: 0.09 },
  { label: 'USE CALCULATOR',   fx: 0.76,  fy: 0.74,  fw: 0.22,  fh: 0.09 },
  { label: 'SUBMIT ALL',       fx: 0.22,  fy: 0.87,  fw: 0.55,  fh: 0.10 },
  { label: 'SOLVE',            fx: 0.54,  fy: 0.71,  fw: 0.12,  fh: 0.11 },
];

// ── Answer choices ────────────────────────────────────────────────────────────
const ANSWERS: { label: string; correct: boolean }[] = [
  { label: '25',   correct: false },
  { label: '30',   correct: true  },
  { label: '35',   correct: false },
  { label: '1515', correct: false },
];

// ── Draw ──────────────────────────────────────────────────────────────────────
export const drawLevel24 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Win screen ─────────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'win') {
    if (state.winChimeFor !== 24) { state.winChimeFor = 24; gc.sounds.ui('chime'); }
    ctx.fillStyle    = t.pass;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 44px ${displayFont}`;
    ctx.fillText('CORRECT.', cx, topBoxY + topBoxHeight * 0.34);
    ctx.font      = `20px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    ctx.fillText('15 + 15 = 30.  Well done.', cx, topBoxY + topBoxHeight * 0.50);
    drawButton(gc, 'CONTINUE  →', cx - 100, topBoxY + topBoxHeight * 0.65, 200, 48, () => {
      state.currentLevel  = 25;
      state.levelSubPhase = '';
      gc.render();
    });
    return;
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    state.winChimeFor = -1;
    state.levelSubPhase = 'active';
  }

  // ── Question ──────────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 68px ${displayFont}`;
  ctx.fillText('15  +  15  =  ?', cx, topBoxY + topBoxHeight * 0.30);

  // ── Decoy buttons ─────────────────────────────────────────────────────────────
  DECOYS.forEach(({ label, fx, fy, fw, fh }) => {
    const bx = topBoxX + fx * topBoxWidth;
    const by = topBoxY + fy * topBoxHeight;
    const bw = fw * topBoxWidth;
    const bh = fh * topBoxHeight;
    drawChoice(gc, label, bx, by, bw, bh, () => wrong(gc), { fontSize: 13 });
  });

  // ── 4 answer buttons ──────────────────────────────────────────────────────────
  const ansBtnW   = topBoxWidth  * 0.17;
  const ansBtnH   = 56;
  const ansGap    = topBoxWidth  * 0.03;
  const totalW    = ansBtnW * 4 + ansGap * 3;
  const ansStartX = cx - totalW / 2;
  const ansY      = topBoxY + topBoxHeight * 0.50;

  ANSWERS.forEach(({ label, correct }, i) => {
    const bx = ansStartX + i * (ansBtnW + ansGap);
    drawChoice(gc, label, bx, ansY, ansBtnW, ansBtnH, () => {
      if (correct) state.levelSubPhase = 'win';
      else wrong(gc);
    }, { fontSize: 28 });
  });
};
