import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, uiScale } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, wrong, levelClock } from './lateralHelpers';

// ── Q11 — Loading… 99% ────────────────────────────────────────────────────────
// The exam "compiles your results": the bar loads with a believable, stuttering
// rhythm, then freezes at 99% forever. Waiting does nothing, ever. About three
// seconds after it sticks, an embossed RETRY button fades in: pressing it slams
// INCORRECT, costs a heart and starts the load over from 0%.
// The real answer is to grab the handle at the edge of the fill (it turns
// antique gold once the bar is stuck) and drag the last 1% across the line.
// Q46 later quizzes the player on how they beat this level, so the drag has to
// stay memorable: the cursor never turns into a pointer over the bar, because
// the drag must be discovered rather than advertised.

// Realistic, non-linear load curve — keyframes of [elapsedMs, percent].
// Uneven slopes + flat pauses make it feel like a real loading bar.
const CURVE: [number, number][] = [
  [0, 0], [300, 41], [650, 41], [1150, 63], [1400, 63],
  [1850, 76], [2150, 84], [2300, 84], [2800, 92], [3500, 97], [4300, 99],
];
const STUCK_PCT   = 0.99;
const WIN_AT      = 0.997;
const FREEZE_MS   = CURVE[CURVE.length - 1][0];   // 4300
const RETRY_DELAY = 3000;                         // trap button appears ~3s after the freeze
const FADE_MS     = 600;                          // the mock's .6s opacity transition

// The examiner keeps her one line until the trap has been sprung; each RETRY
// press pushes her one rung further without ever naming the handle.
const LADDER = [
  'Give it a minute, maybe.',
  'Same bar. Same ninety-nine. I did warn you about the minute.',
  'It is not going to finish. Not by itself, and not by asking twice.',
];

let fill11    = 0;      // 0..1
let grabbed11 = false;  // true once the player takes manual control (auto-load never returns)
let retries11 = 0;
let retryAlpha11 = 0;   // 0..1 fade of the trap button
const clock11 = { last: 0, elapsed: 0 };

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
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'DONE.', 'Turns out the last 1% was always yours to finish.', 12);
    return;
  }
  if (freshEntry(gc)) {
    fill11 = 0; grabbed11 = false; retries11 = 0; retryAlpha11 = 0;
    clock11.last = 0; clock11.elapsed = 0;
    say(gc, LADDER[0]);
  }

  // Pause-aware clock: the load, the dots and the trap timer all freeze with it.
  const { dt, elapsed } = levelClock(gc, clock11);
  const elapsedMs = elapsed * 1000;
  const open = inputOpen(gc);

  // ── Auto-load until the player takes the wheel ──────────────────────────────
  if (!grabbed11) fill11 = curveFill(elapsedMs);

  // ── Geometry: 66% wide bar, 26 tall, at 40% of the play area ────────────────
  const barW = topBoxWidth * 0.66;
  const barH = 26 * s;
  const barX = cx - barW / 2;
  const barY = topBoxY + topBoxHeight * 0.40;

  // ── Drag: the band reaches 30px past each end and 22px above/below ──────────
  if (open && gc.mouseDown &&
      gc.mouseY >= barY - 22 * s && gc.mouseY <= barY + barH + 22 * s &&
      gc.mouseX >= barX - 30 * s && gc.mouseX <= barX + barW + 30 * s) {
    grabbed11 = true;
    fill11 = Math.max(0, Math.min(1, (gc.mouseX - barX) / barW));
  }

  // ── Win when the last 1% is dragged across the line ─────────────────────────
  if (fill11 >= WIN_AT && state.levelSubPhase === 'active') {
    state.levelSubPhase = 'win';
    drawWinScreen(gc, 'DONE.', 'Turns out the last 1% was always yours to finish.', 12);
    return;
  }

  const stuck = !grabbed11 && elapsedMs > FREEZE_MS + 200;
  const pct   = Math.round(fill11 * 100);

  // ── Heading + cycling status ────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold ${Math.round(26 * s)}px ${displayFont}`;
  const dots = '.'.repeat(1 + (Math.floor(elapsedMs / 400) % 3));
  ctx.fillText('Compiling your results' + dots, cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  ctx.fillStyle = t.fgDim;
  ctx.font      = `${Math.round(15 * s)}px ${bodyFont}`;
  ctx.fillText(grabbed11 ? 'Finishing up…' : statusFor(fill11), cx, topBoxY + topBoxHeight * 0.24, topBoxWidth * 0.9);

  // ── Track / fill / border ───────────────────────────────────────────────────
  ctx.fillStyle = t.hairline;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = t.pass;
  ctx.fillRect(barX, barY, barW * fill11, barH);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);

  // ── Handle (grip) at the fill edge; antique gold once it is stuck/held ──────
  const hx = barX + barW * fill11;
  const hw = 14 * s, hh = barH + 16 * s, hy = barY - 8 * s;
  ctx.fillStyle = stuck || grabbed11 ? t.seal : t.ink;
  ctx.fillRect(hx - hw / 2, hy, hw, hh);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(hx - hw / 2, hy, hw, hh);
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - 1.5 * s, hy + 5 * s); ctx.lineTo(hx - 1.5 * s, hy + hh - 5 * s);
  ctx.moveTo(hx + 1.5 * s, hy + 5 * s); ctx.lineTo(hx + 1.5 * s, hy + hh - 5 * s);
  ctx.stroke();

  // ── Percentage ──────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold ${Math.round(30 * s)}px ${displayFont}`;
  ctx.fillText(`${pct}%`, cx, topBoxY + topBoxHeight * 0.53);

  // ── THE TRAP: RETRY fades in ~3s after the freeze ───────────────────────────
  const retryOn = !grabbed11 && elapsedMs >= FREEZE_MS + RETRY_DELAY;
  const step = (dt * 1000) / FADE_MS;
  retryAlpha11 = retryOn
    ? Math.min(1, retryAlpha11 + step)
    : Math.max(0, retryAlpha11 - step);

  if (retryAlpha11 > 0.005) {
    const rw = 150 * s, rh = 52 * s;
    const rx = cx - rw / 2, ry = topBoxY + topBoxHeight * 0.71;
    const before = gc.hitAreas.length;
    ctx.save();
    ctx.globalAlpha = retryAlpha11;
    drawButton(gc, 'RETRY', rx, ry, rw, rh, () => {
      if (!inputOpen(gc) || grabbed11) return;
      // Slams INCORRECT, costs a heart, and starts the load over from 0%.
      retries11++;
      wrong(gc);
      fill11 = 0;
      clock11.elapsed = 0;
      retryAlpha11 = 0;
      if (!gc.state.gameOver) say(gc, LADDER[Math.min(retries11, LADDER.length - 1)]);
    }, 20);
    ctx.restore();
    // Visible while fading out, but only clickable while it is actually "on".
    if (!retryOn) gc.hitAreas.length = before;
  }

  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    fill: fill11, pct, t: elapsed, grabbed: grabbed11, stuck,
    retryOn, retryAlpha: retryAlpha11, retries: retries11,
    barX, barY, barW, barH,
  };
};
