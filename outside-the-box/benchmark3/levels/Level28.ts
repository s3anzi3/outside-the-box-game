import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q28 — The Runaway Button ──────────────────────────────────────────────────
// The only button you need flees from your cursor. Chasing it head-on never works;
// the lateral move is to herd it into a corner where it has nowhere left to run.

const FLEE_RADIUS = 150;
const FLEE_SPEED  = 9;
const BTN_W = 150;
const BTN_H = 52;

let bx28 = 0, by28 = 0;
let inited28 = false;
let raf28 = 0;

export const drawLevel28 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf28);
    drawWinScreen(gc, 'CAUGHT.', 'You stopped chasing and started cornering. That is the whole trick.', 29);
    return;
  }
  if (state.levelSubPhase !== 'active') {
    ensureActive(gc);
    bx28 = cx - BTN_W / 2;
    by28 = topBoxY + topBoxHeight * 0.45;
    inited28 = true;
  }
  if (!inited28) { bx28 = cx - BTN_W / 2; by28 = topBoxY + topBoxHeight * 0.45; inited28 = true; }

  // Movement bounds (inside the box)
  const minX = topBoxX + topBoxWidth * 0.04;
  const maxX = topBoxX + topBoxWidth * 0.96 - BTN_W;
  const minY = topBoxY + topBoxHeight * 0.30;
  const maxY = topBoxY + topBoxHeight * 0.90 - BTN_H;

  // Flee from the cursor
  const bcx = bx28 + BTN_W / 2;
  const bcy = by28 + BTN_H / 2;
  const dx = bcx - gc.mouseX;
  const dy = bcy - gc.mouseY;
  const dist = Math.hypot(dx, dy);
  if (dist < FLEE_RADIUS && dist > 0.001) {
    const force = (FLEE_RADIUS - dist) / FLEE_RADIUS;   // stronger when closer
    bx28 += (dx / dist) * FLEE_SPEED * force;
    by28 += (dy / dist) * FLEE_SPEED * force;
    bx28 = Math.max(minX, Math.min(maxX, bx28));
    by28 = Math.max(minY, Math.min(maxY, by28));
  }

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('Press SUBMIT to continue.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);
  ctx.fillStyle = t.fgDim;
  ctx.font = `14px ${gc.bodyFont}`;
  ctx.fillText('…if you can. Some things run when you reach for them.', cx, topBoxY + topBoxHeight * 0.21, topBoxWidth * 0.9);

  // The fleeing button
  drawChoice(gc, 'SUBMIT', bx28, by28, BTN_W, BTN_H, () => {
    state.levelSubPhase = 'win'; gc.render();
  }, { fontSize: 22 });

  // Animation loop — runs continuously so the button keeps reacting
  cancelAnimationFrame(raf28);
  if (state.currentLevel === 28 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf28 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 28 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
