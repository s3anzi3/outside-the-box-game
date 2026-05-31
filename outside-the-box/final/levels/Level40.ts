import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q40 — Kernel Panic (Act IV climax) ────────────────────────────────────────
// The exam crashes. The only way through is to hold down a forced reboot — a press
// won't do, you must commit and hold. A new "hold" mechanic for the act's climax.

const HOLD_MS = 1800;

let heldMs40   = 0;
let lastFrame40 = 0;
let raf40 = 0;

export const drawLevel40 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf40);
    drawWinScreen(gc, 'REBOOTED.', 'A tap does nothing. You had to commit and hold.', 41);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); heldMs40 = 0; lastFrame40 = 0; }

  const now = Date.now();
  const dt = lastFrame40 ? Math.min(50, now - lastFrame40) : 0;
  lastFrame40 = now;

  // Glitchy title
  const jit = Math.sin(now / 40) > 0.5 ? (Math.random() - 0.5) * 5 : 0;
  ctx.save();
  ctx.translate(jit, 0);
  ctx.fillStyle    = '#e23b3b';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 30px ${displayFont}`;
  ctx.fillText('▓▒ KERNEL PANIC ▒▓', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.95);
  ctx.restore();

  ctx.fillStyle = t.fgMid;
  ctx.font = `16px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('The exam has crashed. Force a reboot — and do not let go.', cx, topBoxY + topBoxHeight * 0.28, topBoxWidth * 0.92);

  // Hold button
  const bw = topBoxWidth * 0.34, bh = topBoxHeight * 0.20;
  const bx = cx - bw / 2, by = topBoxY + topBoxHeight * 0.44;
  const over = gc.mouseX >= bx && gc.mouseX <= bx + bw && gc.mouseY >= by && gc.mouseY <= by + bh;

  // Accumulate / decay the hold
  if (gc.mouseDown && over && !state.paused && !state.controlsOpen) heldMs40 += dt;
  else heldMs40 = Math.max(0, heldMs40 - dt * 2);

  if (heldMs40 >= HOLD_MS && state.levelSubPhase === 'active') {
    state.levelSubPhase = 'win';
    gc.sounds.play('correctAnswer', { volume: 0.5 });
    gc.render();
    return;
  }

  const progress = Math.min(1, heldMs40 / HOLD_MS);
  ctx.fillStyle = over && gc.mouseDown ? '#7a2222' : (state.darkMode ? '#2a1414' : '#e6c4c4');
  ctx.fillRect(bx, by, bw, bh);
  // Progress fill
  ctx.fillStyle = '#39c46b';
  ctx.fillRect(bx, by + bh - 8, bw * progress, 8);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 20px ${displayFont}`;
  ctx.fillText('HOLD TO REBOOT', bx + bw / 2, by + bh / 2);

  // No hit area — a single click must NOT count. Hold is detected via the loop.
  ctx.fillStyle = t.fgDim;
  ctx.font = `13px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${Math.round(progress * 100)}%`, cx, topBoxY + topBoxHeight * 0.70);

  // Continuous loop so holding (with no mouse movement) still registers
  cancelAnimationFrame(raf40);
  if (state.currentLevel === 40 && state.currentScreen === 'level' &&
      !state.gameOver && state.levelSubPhase === 'active') {
    raf40 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 40 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
