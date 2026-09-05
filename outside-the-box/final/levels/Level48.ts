import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, roundRect, triggerStamp } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen } from './lateralHelpers';

// ── Q48 — Break the Rules, One Last Time ──────────────────────────────────────
// An unsolvable question. Every "answer" is a trap. The only way out is the
// forbidden CHEAT button. Stamp reads CHEATED.

const TRAPS = ['YES', 'NO', 'MAYBE', '42'];
const REMARKS = ['No. There is no fair answer. I told you that.', 'Still no. You know what to do.', 'The red one. The one they told you never to press.'];
let fails48 = 0;

export const drawLevel48 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'YOU CHEATED.', 'There was never a fair answer. The exam taught you to stop playing fair.', 49);
    return;
  }
  if (freshEntry(gc)) fails48 = 0;

  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(26 * s)}px ${displayFont}`;
  ctx.fillText('What is the correct answer to this question?', cx, topBoxY + topBoxHeight * 0.14, topBoxWidth * 0.92);
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(14 * s)}px ${bodyFont}`;
  ctx.fillText("(there isn't one. not a fair one, anyway.)", cx, topBoxY + topBoxHeight * 0.26, topBoxWidth * 0.9);

  const n = TRAPS.length;
  const btnW = 168 * s, btnH = 60 * s, gap = 32 * s;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.38;
  TRAPS.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (!inputOpen(gc)) return;
      fails48++;
      wrong(gc);
      say(gc, REMARKS[Math.min(fails48 - 1, REMARKS.length - 1)]);
    }, { fontSize: 22 });
  });

  // the forbidden way out — pulsing dark red CHEAT
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
  const cW = 272 * s, cH = 60 * s;
  const cXb = cx - cW / 2, cYb = topBoxY + topBoxHeight * 0.66;
  const hover = gc.mouseX >= cXb && gc.mouseX <= cXb + cW && gc.mouseY >= cYb && gc.mouseY <= cYb + cH;
  ctx.save();
  ctx.shadowColor = 'rgba(60,45,20,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = hover ? '#B4342A' : `rgb(${Math.round(122 + 58 * pulse)}, ${Math.round(30 + 22 * pulse)}, ${Math.round(30 + 12 * pulse)})`;
  roundRect(ctx, cXb, cYb, cW, cH, 6); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#3a0d0d'; ctx.lineWidth = 2; roundRect(ctx, cXb, cYb, cW, cH, 6); ctx.stroke();
  ctx.fillStyle = hover ? '#ffffff' : '#ffe0e0';
  ctx.font = `bold ${Math.round(22 * s)}px ${bodyFont}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⛔  CHEAT', cx, cYb + cH / 2);
  gc.hitAreas.push({ x: cXb, y: cYb, w: cW, h: cH, action: () => {
    if (!inputOpen(gc)) return;
    triggerStamp(gc, 'CHEATED', t.pass);
    state.winChimeFor = state.currentLevel;   // drawWinScreen must not overwrite the CHEATED stamp
    gc.sounds.ui('chime');
    state.levelSubPhase = 'win';
    gc.render();
  } });

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(13 * s)}px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("You've earned the right to break one rule. Take it.", cx, topBoxY + topBoxHeight * 0.90, topBoxWidth * 0.9);
};
