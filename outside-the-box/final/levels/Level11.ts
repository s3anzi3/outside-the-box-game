import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q11 — Loading… 99% ────────────────────────────────────────────────────────
// The exam "compiles your results": a realistic, stuttering progress bar that
// loads believably... then freezes at 99% forever. Waiting does nothing; RETRY
// just resets it and costs a life. The lateral move is to grab the bar's handle
// and drag the final 1% to 100% yourself.

// Realistic, non-linear load curve — keyframes of [elapsedMs, percent].
// Uneven slopes + flat pauses make it feel like a real loading bar.
const CURVE: [number, number][] = [
  [0, 0], [300, 41], [650, 41], [1150, 63], [1400, 63],
  [1850, 76], [2150, 84], [2300, 84], [2800, 92], [3500, 97], [4300, 99],
];
const STUCK_PCT = 0.99;
const WIN_AT    = 0.997;

let fill11    = 0;     // 0..1
let grabbed11 = false; // true once the player takes manual control
let start11   = 0;
let raf11     = 0;

const curveFill = (elapsed: number): number => {
  if (elapsed <= CURVE[0][0]) return CURVE[0][1] / 100;
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [t0, v0] = CURVE[i];
    const [t1, v1] = CURVE[i + 1];
    if (elapsed >= t0 && elapsed <= t1) {
      const f = t1 === t0 ? 1 : (elapsed - t0) / (t1 - t0);
      return (v0 + (v1 - v0) * f) / 100;
    }
  }
  return STUCK_PCT;   // held at 99% forever
};

const statusFor = (pct: number): string => {
  if (pct < 0.40) return 'Initializing…';
  if (pct < 0.64) return 'Verifying your answers…';
  if (pct < 0.80) return 'Calculating your percentile…';
  if (pct < 0.97) return 'Finalizing your certificate…';
  return 'Almost there…';
};

export const drawLevel11 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf11);
    drawWinScreen(gc, 'DONE.', 'Turns out the last 1% was always yours to finish.', 12);
    return;
  }
  if (state.levelSubPhase !== 'active') {
    ensureActive(gc);
    fill11 = 0; grabbed11 = false; start11 = Date.now();
  }

  // Bar geometry
  const barW = topBoxWidth * 0.66;
  const barH = 26;
  const barX = cx - barW / 2;
  const barY = topBoxY + topBoxHeight * 0.46;

  // ── Auto-load until the player takes the wheel ──────────────────────────────
  const elapsed = Date.now() - start11;
  if (!grabbed11) fill11 = curveFill(elapsed);

  // ── Drag handling: grab the handle / bar and pull ───────────────────────────
  const bandTop = barY - 22, bandBot = barY + barH + 22;
  if (gc.mouseDown && gc.mouseY >= bandTop && gc.mouseY <= bandBot &&
      gc.mouseX >= barX - 30 && gc.mouseX <= barX + barW + 30) {
    grabbed11 = true;
    fill11 = Math.max(0, Math.min(1, (gc.mouseX - barX) / barW));
  }

  // ── Win when dragged to the end ─────────────────────────────────────────────
  if (fill11 >= WIN_AT && state.levelSubPhase === 'active') {
    state.levelSubPhase = 'win';
    gc.sounds.play('correctAnswer', { volume: 0.5 });
    gc.render();
    return;
  }

  const stuck = !grabbed11 && elapsed > CURVE[CURVE.length - 1][0] + 200;
  const pct = Math.round(fill11 * 100);

  // ── Heading + cycling status ────────────────────────────────────────────────
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  const dots = '.'.repeat(1 + (Math.floor(Date.now() / 400) % 3));
  ctx.fillText('Compiling your results' + dots, cx, topBoxY + topBoxHeight * 0.20, topBoxWidth * 0.9);

  ctx.fillStyle = t.fgDim;
  ctx.font      = `15px ${bodyFont}`;
  ctx.fillText(grabbed11 ? 'Finishing up…' : statusFor(fill11), cx, topBoxY + topBoxHeight * 0.32, topBoxWidth * 0.9);

  // ── Track ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = state.darkMode ? '#1c1c1c' : '#d6d6d6';
  ctx.fillRect(barX, barY, barW, barH);
  // Fill
  ctx.fillStyle = '#39a05a';
  ctx.fillRect(barX, barY, barW * fill11, barH);
  // Border
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);

  // ── Handle (grip) at the fill edge ──────────────────────────────────────────
  const hx = barX + barW * fill11;
  ctx.fillStyle = stuck || grabbed11 ? '#e2c25b' : (state.darkMode ? '#eee' : '#222');
  ctx.fillRect(hx - 7, barY - 8, 14, barH + 16);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(hx - 7, barY - 8, 14, barH + 16);
  ctx.strokeStyle = state.darkMode ? '#333' : '#fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - 2, barY - 3); ctx.lineTo(hx - 2, barY + barH + 3);
  ctx.moveTo(hx + 2, barY - 3); ctx.lineTo(hx + 2, barY + barH + 3);
  ctx.stroke();

  // ── Percentage ──────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 30px ${displayFont}`;
  ctx.fillText(`${pct}%`, cx, barY + barH + 18);

  // ── Once it's clearly stuck, nudge the player + offer the RETRY trap ─────────
  if (stuck) {
    ctx.fillStyle = t.fgDim;
    ctx.font      = `13px ${bodyFont}`;
    ctx.fillText('(it is not going to finish on its own.)', cx, topBoxY + topBoxHeight * 0.74, topBoxWidth * 0.9);

    const rW = topBoxWidth * 0.18, rH = 38;
    drawChoice(gc, 'RETRY', cx - rW / 2, topBoxY + topBoxHeight * 0.82, rW, rH, () => {
      // The "turn it off and on again" reflex — resets the load and costs a life.
      gc.loseLife();
      fill11 = 0; grabbed11 = false; start11 = Date.now();
      gc.render();
    }, { fontSize: 15 });
  }

  // ── Animation loop ──────────────────────────────────────────────────────────
  cancelAnimationFrame(raf11);
  if (state.currentLevel === 11 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf11 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 11 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
