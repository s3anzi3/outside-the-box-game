import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, drawButton, triggerStamp } from '../renderer';
import { drawChoice, wrong, freshEntry, say, inputOpen } from './lateralHelpers';

// ── Q46 — Recall (callback to Q11's loading bar that froze at 99%) ────────────
// Calm level. Quirks: a frozen 99% memento on the paper, and a tiny bar at 100%
// on the win screen captioned "Still 100%. You are welcome."

const OPTIONS: Array<[string, string]> = [['WAITED IT OUT', 'WAIT'], ['PRESSED RETRY', 'RETRY'], ['DRAGGED IT', 'DRAG'], ['REFRESHED THE PAGE', 'REFRESH']];

const drawMiniBar = (gc: GameContext, x: number, y: number, w: number, pct: number, color: string, label: string, caption: string) => {
  const { ctx, state, monoFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(9 * s)}px ${monoFont}`;
  ctx.fillText(label, x + w / 2, y);
  ctx.strokeStyle = t.stroke; ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y + 8 * s, w, 8 * s);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 9 * s, (w - 2) * pct, 6 * s);
  ctx.fillStyle = t.fgDim;
  ctx.fillText(caption, x + w / 2, y + 26 * s);
};

export const drawLevel46 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    if (state.winChimeFor !== state.currentLevel) { state.winChimeFor = state.currentLevel; gc.sounds.ui('chime'); triggerStamp(gc, 'CORRECT', t.pass); }
    ctx.fillStyle = t.pass; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(42 * s)}px ${displayFont}`;
    ctx.fillText('YOU DRAGGED IT.', cx, topBoxY + topBoxHeight * 0.26, w * 0.7);
    ctx.font = `${Math.round(18 * s)}px ${bodyFont}`; ctx.fillStyle = t.fgMid;
    ctx.fillText('The loading bar was never going to finish on its own. You did.', cx, topBoxY + topBoxHeight * 0.42, w * 0.62);
    drawMiniBar(gc, cx - 110 * s, topBoxY + topBoxHeight * 0.55, 220 * s, 1, t.pass, 'LOADING', '100% · STILL 100%. YOU ARE WELCOME.');
    drawButton(gc, 'CONTINUE  →', cx - 110, topBoxY + topBoxHeight * 0.74, 220, Math.max(44, topBoxHeight * 0.13), () => {
      state.currentLevel = 47; state.levelSubPhase = ''; gc.render();
    }, 18);
    return;
  }
  freshEntry(gc);

  drawMiniBar(gc, topBoxX + topBoxWidth - 150 * s, topBoxY + 22 * s, 120 * s, 0.99, t.accent, 'EXHIBIT Q.11', '99%');

  ctx.fillStyle = t.fgDim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(13 * s)}px ${gc.monoFont}`;
  ctx.fillText('M E M O R Y   C H E C K', cx, topBoxY + topBoxHeight * 0.09);
  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(27 * s)}px ${displayFont}`;
  ctx.fillText('Cast your mind back to Question 11. The loading bar that refused to finish.', cx, topBoxY + topBoxHeight * 0.24, topBoxWidth * 0.8);
  ctx.fillText('How did you beat it?', cx, topBoxY + topBoxHeight * 0.36, topBoxWidth * 0.8);

  const bw = 300 * s, bh = 58 * s, gx = 28 * s, gy = 18 * s;
  const x0 = cx - bw - gx / 2, y0 = topBoxY + topBoxHeight * 0.50;
  OPTIONS.forEach(([label, id], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    drawChoice(gc, label, x0 + col * (bw + gx), y0 + row * (bh + gy), bw, bh, () => {
      if (!inputOpen(gc)) return;
      if (id === 'DRAG') { state.levelSubPhase = 'win'; gc.render(); return; }
      wrong(gc);
      say(gc, id === 'RETRY' ? 'Retry cost you a heart then too. Some people never learn.' : 'It never finished on its own. You know that.');
    }, { fontSize: 19 });
  });
};
