import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q15 — Outside the Box ─────────────────────────────────────────────────────
// Every "exit" inside the exam frame is a decoy. The real exit is rendered OUTSIDE
// the box, in the page margin. The title of the whole game is the hint.

const DECOYS = ['EXIT', 'SUBMIT', 'FINISH', 'DOOR'];

export const drawLevel15 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'OUT.', 'The exit was never inside the box. That is the whole point.', 16);
    return;
  }
  ensureActive(gc);

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('Find the way out.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  // Decoy exits scattered inside the box
  const spots = [
    { fx: 0.10, fy: 0.42 }, { fx: 0.62, fy: 0.40 },
    { fx: 0.20, fy: 0.70 }, { fx: 0.58, fy: 0.72 },
  ];
  const dW = topBoxWidth * 0.20, dH = 46;
  DECOYS.forEach((label, i) => {
    const bx = topBoxX + spots[i].fx * topBoxWidth;
    const by = topBoxY + spots[i].fy * topBoxHeight;
    drawChoice(gc, label, bx, by, dW, dH, () => wrong(gc), { fontSize: 18 });
  });

  // The REAL exit — out in the right-hand margin, outside the frame.
  const marginX  = topBoxX + topBoxWidth;
  const marginW  = w - marginX;
  const realW    = Math.min(marginW * 0.78, 96);
  const realH    = 44;
  const realX    = marginX + (marginW - realW) / 2;
  const realY    = topBoxY + topBoxHeight / 2 - realH / 2;

  // A small arrow pointing out of the box toward it
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('→', topBoxX + topBoxWidth + (realX - (topBoxX + topBoxWidth)) / 2, realY + realH / 2);

  drawChoice(gc, 'EXIT', realX, realY, realW, realH, () => {
    state.levelSubPhase = 'win'; gc.render();
  }, { fontSize: 18, fill: t.bg });
};
