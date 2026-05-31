import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q17 — Do Nothing ──────────────────────────────────────────────────────────
// A big flashing START button and a ticking clock scream at you to ACT. Clicking
// anything costs a life and resets the clock. The lateral move — after Q4 trained
// you to spam-click — is to sit still. Let the timer reach zero and you pass.

const WAIT_MS = 7000;

let endTime17  = 0;
let pausedAt17 = 0;
let raf17      = 0;

export const drawLevel17 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf17);
    drawWinScreen(gc, 'STILLNESS.', 'Not every alarm needs answering. You did nothing — perfectly.', 18);
    return;
  }

  // Fresh entry
  if (state.levelSubPhase !== 'active') {
    ensureActive(gc);
    endTime17  = Date.now() + WAIT_MS;
    pausedAt17 = 0;
  }

  // Pause-freeze the clock
  const frozen = state.paused || state.controlsOpen;
  if (frozen) {
    if (pausedAt17 === 0) pausedAt17 = Date.now();
  } else if (pausedAt17 > 0) {
    endTime17 += Date.now() - pausedAt17;
    pausedAt17 = 0;
  }

  // While paused, measure against the freeze instant so the clock can't tick down.
  const ref = pausedAt17 > 0 ? pausedAt17 : Date.now();
  const remaining = Math.max(0, endTime17 - ref);
  const secs = Math.ceil(remaining / 1000);

  // Win when the clock runs out without a wrong click (never while paused)
  if (remaining <= 0 && state.levelSubPhase === 'active' && !frozen) {
    state.levelSubPhase = 'win';
    gc.sounds.play('correctAnswer', { volume: 0.5 });
    gc.render();
    return;
  }

  // Urgent prompt
  ctx.fillStyle    = '#e23b3b';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 30px ${displayFont}`;
  ctx.fillText('QUICK!  PRESS START BEFORE TIME RUNS OUT!', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.92);

  // Countdown
  ctx.fillStyle = secs <= 3 ? '#e23b3b' : t.fgMid;
  ctx.font      = `bold 52px ${displayFont}`;
  ctx.fillText(`${secs}`, cx, topBoxY + topBoxHeight * 0.30);

  // Flashing START button (the trap)
  const flash = 0.5 + 0.5 * Math.sin(Date.now() / 140);
  const btnW = topBoxWidth * 0.30;
  const btnH = topBoxHeight * 0.24;
  const btnX = cx - btnW / 2;
  const btnY = topBoxY + topBoxHeight * 0.52;
  drawChoice(gc, 'START', btnX, btnY, btnW, btnH, () => {
    gc.loseLife();
    endTime17 = Date.now() + WAIT_MS;  // punish + reset
    gc.render();
  }, { fontSize: 34, fill: `rgba(${Math.round(180 + 60 * flash)}, 40, 40, 1)`, textColor: '#ffffff' });

  // Quiet hint
  ctx.fillStyle    = t.fgDim;
  ctx.font         = `14px ${bodyFont}`;
  ctx.textBaseline = 'top';
  ctx.fillText('…or don’t.', cx, topBoxY + topBoxHeight * 0.84);

  // Animation loop
  cancelAnimationFrame(raf17);
  if (state.currentLevel === 17 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf17 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 17 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
