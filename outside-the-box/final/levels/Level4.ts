import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { roundRect, uiScale } from '../renderer';
import { wrong, drawWinScreen } from './lateralHelpers';

const WINDOW_DURATION = 500;  // ms the click window stays open

let animFrameId4    = 0;
let windowStart     = 0;
let windowEnd       = 0;
let timerDuration   = 0;

const scheduleAttempt = (timerEnd: number, duration: number) => {
  // Window opens at a random point where remaining time is between 1s and 15s
  // Capped so there's always at least 1s after the window for the player to miss
  const maxRemaining = Math.min(duration - 1000, 15000);
  const minRemaining = 1000;
  const remainingWhenOpen = minRemaining + Math.random() * (maxRemaining - minRemaining);
  windowStart = timerEnd - remainingWhenOpen;
  windowEnd   = windowStart + WINDOW_DURATION;
};

const newAttempt = (): number => {
  // Random total timer between 2s (minimum to fit window) and 20s
  return 2000 + Math.random() * 18000;
};

export const drawLevel4 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const cx = w / 2;
  const t  = getTheme(state);
  const s  = uiScale(ctx);

  if (state.levelSubPhase === "win") {
    cancelAnimationFrame(animFrameId4);
    drawWinScreen(gc, "RIGHT ON TIME.",
      "Noise is not urgency. You waited for the real window instead of the loud one.", 5);
    return;
  }

  // Initialise on fresh entry
  if (state.levelSubPhase !== "active") {
    timerDuration        = newAttempt();
    state.levelTimerEnd  = Date.now() + timerDuration;
    state.levelSubPhase  = "active";
    scheduleAttempt(state.levelTimerEnd, timerDuration);
  }

  const now       = Date.now();
  const remaining = Math.max(0, state.levelTimerEnd - now);
  const progress  = remaining / timerDuration;
  const seconds   = Math.ceil(remaining / 1000);
  const inWindow  = now >= windowStart && now <= windowEnd;

  // Timer expired without a successful click → lose life, reset
  if (remaining <= 0 && state.currentLevel === 4) {
    cancelAnimationFrame(animFrameId4);
    timerDuration        = newAttempt();
    state.levelTimerEnd  = Date.now() + timerDuration;
    scheduleAttempt(state.levelTimerEnd, timerDuration);
    gc.loseLife();
    return;
  }

  // Schedule next frame
  cancelAnimationFrame(animFrameId4);
  animFrameId4 = requestAnimationFrame(() => {
    if (state.currentLevel === 4 && !state.paused && !state.gameOver && !state.controlsOpen) {
      gc.render();
    }
  });

  // ── Big countdown ────────────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.font         = `bold ${Math.round(topBoxHeight * 0.32)}px ${displayFont}`;
  ctx.fillText(`${seconds}`, cx, topBoxY + topBoxHeight * 0.32);

  // ── Progress bar ─────────────────────────────────────────────────────────
  const barW = topBoxWidth * 0.58;
  const barH = 14;
  const barX = cx - barW / 2;
  const barY = topBoxY + topBoxHeight * 0.56;

  ctx.strokeStyle = t.hairline;
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  const fillProgress = Math.max(0, Math.min(1, progress));
  const barColor = fillProgress > 0.5
    ? `hsl(120, 70%, 45%)`
    : fillProgress > 0.25
      ? `hsl(${Math.round(fillProgress * 2 * 120)}, 70%, 45%)`
      : `hsl(0, 70%, 45%)`;
  ctx.fillStyle = barColor;
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * fillProgress, barH - 2);

  // ── Button ───────────────────────────────────────────────────────────────
  // Size the button to its widest label so the text never overflows.
  const btnFont = `bold ${Math.round(22 * s)}px ${gc.bodyFont}`;
  ctx.font = btnFont;
  const labelW = Math.max(ctx.measureText("CLICK ME QUICKLY").width, ctx.measureText("CLICK NOW!").width);
  const btnW = Math.max(260, Math.round(labelW + 56 * s));
  const btnH = Math.round(54 * s);
  const btnX = cx - btnW / 2;
  const btnY = topBoxY + topBoxHeight * 0.68;

  ctx.save();
  ctx.shadowColor = state.darkMode ? "rgba(0,0,0,0.4)" : "rgba(60,45,20,0.22)";
  ctx.shadowBlur = inWindow ? 18 : 8;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, btnX, btnY, btnW, btnH, 6);
  ctx.fillStyle = inWindow ? t.pass : t.danger;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = inWindow ? "#2f7d52" : "#7a2420";
  ctx.lineWidth   = 2.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 6);
  ctx.stroke();
  ctx.fillStyle    = "#F7F1E3";
  ctx.font         = btnFont;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(inWindow ? "CLICK NOW!" : "CLICK ME QUICKLY", cx, btnY + btnH / 2);

  if (inWindow) {
    gc.hitAreas.push({
      x: btnX, y: btnY, w: btnW, h: btnH,
      action: () => {
        cancelAnimationFrame(animFrameId4);
        state.levelTimerEnd  = 0;
        state.levelSubPhase  = "win";
        gc.render();
      },
    });
  } else {
    gc.hitAreas.push({
      x: btnX, y: btnY, w: btnW, h: btnH,
      action: () => {
        timerDuration        = newAttempt();
        state.levelTimerEnd  = Date.now() + timerDuration;
        scheduleAttempt(state.levelTimerEnd, timerDuration);
        wrong(gc);
      },
    });
  }
};
