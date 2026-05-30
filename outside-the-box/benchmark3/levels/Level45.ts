import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q45 — Quick Hands ─────────────────────────────────────────────────────────
// A target keeps jumping around. Tag it GOAL times before the clock runs out.
// Pure reflexes — a skill spike before the final stretch.

const GOAL   = 8;
const TIME   = 9000;
const RADIUS = 26;

let tx45 = 0, ty45 = 0;
let hits45 = 0;
let endTime45 = 0;
let pausedAt45 = 0;
let raf45 = 0;

export const drawLevel45 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  const reposition = () => {
    const padX = topBoxWidth * 0.10;
    tx45 = topBoxX + padX + Math.random() * (topBoxWidth - padX * 2);
    ty45 = topBoxY + topBoxHeight * 0.34 + Math.random() * (topBoxHeight * 0.52);
  };

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf45);
    drawWinScreen(gc, 'QUICK HANDS.', 'Eight tags, no hesitation. Reflexes are a kind of thinking too.', 46);
    return;
  }
  if (state.levelSubPhase !== 'active') {
    ensureActive(gc);
    hits45 = 0; pausedAt45 = 0; reposition();
    endTime45 = Date.now() + TIME;
  }

  // Pause-freeze
  const frozen = state.paused || state.controlsOpen;
  if (frozen) { if (pausedAt45 === 0) pausedAt45 = Date.now(); }
  else if (pausedAt45 > 0) { endTime45 += Date.now() - pausedAt45; pausedAt45 = 0; }

  const ref = pausedAt45 > 0 ? pausedAt45 : Date.now();
  const remaining = Math.max(0, endTime45 - ref);

  // Time up → penalty + restart
  if (remaining <= 0 && state.levelSubPhase === 'active' && !frozen) {
    gc.loseLife();
    hits45 = 0; reposition();
    endTime45 = Date.now() + TIME;
  }

  // Prompt + HUD
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText(`Tag the target  —  ${hits45} / ${GOAL}`, cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  ctx.fillStyle = remaining < 3000 ? '#e23b3b' : t.fgMid;
  ctx.font      = `15px ${bodyFont}`;
  ctx.fillText(`${(remaining / 1000).toFixed(1)}s`, cx, topBoxY + topBoxHeight * 0.20);

  // Target
  ctx.fillStyle = '#e2563b';
  ctx.beginPath();
  ctx.arc(tx45, ty45, RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(tx45, ty45, RADIUS * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2563b';
  ctx.beginPath();
  ctx.arc(tx45, ty45, RADIUS * 0.25, 0, Math.PI * 2);
  ctx.fill();

  gc.hitAreas.push({
    x: tx45 - RADIUS, y: ty45 - RADIUS, w: RADIUS * 2, h: RADIUS * 2,
    action: () => {
      hits45++;
      gc.sounds.play('typing', { volume: 0.4, restart: true });
      if (hits45 >= GOAL) { state.levelSubPhase = 'win'; }
      else reposition();
      gc.render();
    },
  });

  // Loop for the timer
  cancelAnimationFrame(raf45);
  if (state.currentLevel === 45 && state.currentScreen === 'level' &&
      !state.gameOver && state.levelSubPhase === 'active') {
    raf45 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 45 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
