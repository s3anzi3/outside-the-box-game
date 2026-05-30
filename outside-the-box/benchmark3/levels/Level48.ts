import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q48 — Break the Rules, One Last Time ──────────────────────────────────────
// An unsolvable question. Every "answer" is a trap. The payoff of the whole exam:
// the only way out is to do the forbidden thing on purpose — cheat. Callback to the
// Q20 override and Q21's "you need to cheat for once."

const TRAPS = ['YES', 'NO', 'MAYBE', '42'];
let raf48 = 0;

export const drawLevel48 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf48);
    drawWinScreen(gc, 'YOU CHEATED.', 'There was never a fair answer. The exam taught you to stop playing fair.', 49);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('What is the correct answer to this question?', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.92);
  ctx.fillStyle = t.fgDim;
  ctx.font = `14px ${bodyFont}`;
  ctx.fillText('(there isn’t one. not a fair one, anyway.)', cx, topBoxY + topBoxHeight * 0.22, topBoxWidth * 0.9);

  // Trap answers
  const n = TRAPS.length;
  const btnW = topBoxWidth * 0.16;
  const btnH = topBoxHeight * 0.16;
  const gap  = topBoxWidth * 0.03;
  const totW = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.36;
  TRAPS.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => wrong(gc), { fontSize: 22 });
  });

  // The forbidden way out — pulsing CHEAT
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 260);
  const cW = topBoxWidth * 0.26, cH = topBoxHeight * 0.16;
  const cXb = cx - cW / 2, cYb = topBoxY + topBoxHeight * 0.66;
  drawChoice(gc, '⛔  CHEAT', cXb, cYb, cW, cH, () => {
    state.levelSubPhase = 'win';
    gc.sounds.play('correctAnswer', { volume: 0.5 });
    gc.render();
  }, { fontSize: 22, fill: `rgba(${Math.round(120 + 60 * pulse)}, 30, 30, 1)`, textColor: '#ffe0e0' });

  ctx.fillStyle = t.fgDim;
  ctx.font = `13px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('You’ve earned the right to break one rule. Take it.', cx, topBoxY + topBoxHeight * 0.86, topBoxWidth * 0.9);

  cancelAnimationFrame(raf48);
  if (state.currentLevel === 48 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf48 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 48 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
