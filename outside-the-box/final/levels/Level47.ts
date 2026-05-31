import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q47 — The Illusion ────────────────────────────────────────────────────────
// The Müller-Lyer illusion: two lines of identical length, with arrow-fins that
// make one look longer. The answer is SAME — trust measurement over appearance.

const OPTIONS: { label: string; correct: boolean }[] = [
  { label: 'TOP',    correct: false },
  { label: 'SAME',   correct: true  },
  { label: 'BOTTOM', correct: false },
];

export const drawLevel47 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'IDENTICAL.', 'The fins fool the eye. Measured, the lines are exactly the same.', 48);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('Which line is longer?', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  const lineLen = topBoxWidth * 0.5;
  const fin = 22;
  ctx.strokeStyle = t.fg;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const drawLine = (yc: number, outward: boolean) => {
    const x0 = cx - lineLen / 2, x1 = cx + lineLen / 2;
    ctx.beginPath();
    ctx.moveTo(x0, yc); ctx.lineTo(x1, yc);
    ctx.stroke();
    const d = outward ? 1 : -1;   // outward fins (>—<) look longer; inward (<—>) shorter
    ctx.beginPath();
    ctx.moveTo(x0, yc); ctx.lineTo(x0 + d * fin, yc - fin);
    ctx.moveTo(x0, yc); ctx.lineTo(x0 + d * fin, yc + fin);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 - d * fin, yc - fin);
    ctx.moveTo(x1, yc); ctx.lineTo(x1 - d * fin, yc + fin);
    ctx.stroke();
  };

  drawLine(topBoxY + topBoxHeight * 0.34, true);    // TOP — outward fins
  drawLine(topBoxY + topBoxHeight * 0.52, false);   // BOTTOM — inward fins

  const n = OPTIONS.length;
  const btnW = topBoxWidth * 0.18;
  const btnH = 52;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.72;
  OPTIONS.forEach(({ label, correct }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (correct) { state.levelSubPhase = 'win'; gc.render(); }
      else wrong(gc);
    }, { fontSize: 18 });
  });
};
