import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, roundRect } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen } from './lateralHelpers';

// ── Q36 — Do Not Trust the Exam ───────────────────────────────────────────────
// 7 × 8 with 54 pre-selected and tagged RECOMMENDED BY CORPORATE. Confirming the
// recommendation costs a heart; select 56 and confirm to pass. Quirk: the tag
// slides across to your answer and gains "(revised)".

const OPTIONS = ['54', '56', '49', '64'];
const RECOMMENDED = 0, CORRECT = 1;
let selected36 = RECOMMENDED;
let tagAt36 = 0, tagFrom36 = 0, tagMoveAt36 = 0, revised36 = false, fails36 = 0;

export const drawLevel36 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'OVERRIDDEN.', 'The exam recommended 54. You knew better: 7 × 8 = 56.', 37);
    return;
  }
  if (freshEntry(gc)) { selected36 = RECOMMENDED; tagAt36 = 0; tagFrom36 = 0; tagMoveAt36 = 0; revised36 = false; fails36 = 0; }

  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(52 * s)}px ${displayFont}`;
  ctx.fillText('7  ×  8  =  ?', cx, topBoxY + topBoxHeight * 0.20);

  const n = OPTIONS.length;
  const btnW = 168 * s, btnH = 70 * s, gap = 32 * s;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.44;
  OPTIONS.forEach((label, i) => {
    const bx = startX + i * (btnW + gap);
    const isSel = i === selected36;
    drawChoice(gc, label, bx, btnY, btnW, btnH, () => {
      if (!inputOpen(gc)) return;
      selected36 = i;
      if (i === CORRECT && !revised36) { revised36 = true; tagFrom36 = tagAt36; tagMoveAt36 = performance.now(); say(gc, 'It was always 56. The tag is decorative.'); }
    }, { fontSize: 26, fill: isSel ? (state.darkMode ? 'rgba(95,166,124,0.22)' : 'rgba(62,107,79,0.16)') : undefined });
    if (isSel) { ctx.strokeStyle = t.pass; ctx.lineWidth = 4; roundRect(ctx, bx, btnY, btnW, btnH, 6); ctx.stroke(); }
  });

  // the RECOMMENDED tag, sliding to 56 once selected
  const ease = revised36 ? Math.min(1, (performance.now() - tagMoveAt36) / 450) : 0;
  const e = 1 - Math.pow(1 - ease, 3);
  tagAt36 = revised36 ? tagFrom36 + (1 - tagFrom36) * e : 0;
  const tagX = startX + tagAt36 * (btnW + gap) + btnW / 2;
  ctx.fillStyle = t.seal;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = `bold ${Math.round(10 * s)}px ${monoFont}`;
  ctx.fillText(revised36 ? 'RECOMMENDED BY CORPORATE (REVISED)' : 'RECOMMENDED BY CORPORATE', tagX, btnY - 8 * s);

  drawChoice(gc, 'CONFIRM SELECTION', cx - 150 * s, topBoxY + topBoxHeight * 0.74, 300 * s, 50 * s, () => {
    if (!inputOpen(gc)) return;
    if (selected36 === CORRECT) { state.levelSubPhase = 'win'; gc.render(); return; }
    fails36++;
    wrong(gc);
    say(gc, fails36 === 1 ? 'Corporate has never once multiplied anything.' : 'The recommendation is wrong. Pick what you KNOW is right, then confirm.');
  }, { fontSize: 16 });

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(13 * s)}px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('The exam has already chosen for you. It is wrong.', cx, topBoxY + topBoxHeight * 0.92, topBoxWidth * 0.9);
};
