import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q45 — The Runaway Button ──────────────────────────────────────────────────
// The only button you need flees from your cursor. Chasing it head-on never works;
// the lateral move is to herd it into a corner where it has nowhere left to run.

const FLEE_RADIUS = 150;
const FLEE_SPEED  = 9;
const BTN_W = 150;
const BTN_H = 52;

let bx45 = 0, by45 = 0;
let inited45 = false;
let raf45b = 0;

export const drawLevel45 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf45b);
    drawWinScreen(gc, 'CAUGHT.', 'You stopped chasing and started cornering. That is the whole trick.', 46);
    return;
  }
  if (state.levelSubPhase !== 'active') {
    ensureActive(gc);
    bx45 = cx - BTN_W / 2;
    by45 = topBoxY + topBoxHeight * 0.45;
    inited45 = true;
  }
  if (!inited45) { bx45 = cx - BTN_W / 2; by45 = topBoxY + topBoxHeight * 0.45; inited45 = true; }

  const minX = topBoxX + topBoxWidth * 0.04;
  const maxX = topBoxX + topBoxWidth * 0.96 - BTN_W;
  const minY = topBoxY + topBoxHeight * 0.30;
  const maxY = topBoxY + topBoxHeight * 0.90 - BTN_H;

  const bcx = bx45 + BTN_W / 2;
  const bcy = by45 + BTN_H / 2;
  const dx = bcx - gc.mouseX;
  const dy = bcy - gc.mouseY;
  const dist = Math.hypot(dx, dy);
  if (dist < FLEE_RADIUS && dist > 0.001) {
    const force = (FLEE_RADIUS - dist) / FLEE_RADIUS;
    bx45 += (dx / dist) * FLEE_SPEED * force;
    by45 += (dy / dist) * FLEE_SPEED * force;
    bx45 = Math.max(minX, Math.min(maxX, bx45));
    by45 = Math.max(minY, Math.min(maxY, by45));
  }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('Press SUBMIT to continue.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);
  ctx.fillStyle = t.fgDim;
  ctx.font = `14px ${gc.bodyFont}`;
  ctx.fillText('…if you can. Some things run when you reach for them.', cx, topBoxY + topBoxHeight * 0.21, topBoxWidth * 0.9);

  drawChoice(gc, 'SUBMIT', bx45, by45, BTN_W, BTN_H, () => {
    state.levelSubPhase = 'win'; gc.render();
  }, { fontSize: 22 });

  cancelAnimationFrame(raf45b);
  if (state.currentLevel === 45 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf45b = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 45 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
