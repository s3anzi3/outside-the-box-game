import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';

const BTN_W  = 240;
const BTN_H  = Math.round(BTN_W * (215 / 1060));
const DOT_R  = 5;
const FLEE_R = 260;   // radius at which repulsion starts
const FORCE  = 2800;  // repulsion acceleration (units/sec²)
const DAMP   = 0.72;  // velocity damping per frame (0–1, lower = more drag)

let btnX  = -1;
let btnY  = -1;
let btnVX = 0;
let btnVY = 0;
let animId5   = 0;
let wasFleeing = false;

function resetBtn() {
  btnX  = -1;
  btnY  = -1;
  btnVX = 0;
  btnVY = 0;
  wasFleeing = false;
}

export const drawLevel5 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t = getTheme(state);

  // Initialise button at centre on fresh entry
  if (state.levelSubPhase !== "active") {
    resetBtn();
    state.levelSubPhase = "active";
  }
  if (btnX < 0) {
    btnX = topBoxX + topBoxWidth  * 0.5 - BTN_W / 2;
    btnY = topBoxY + topBoxHeight * 0.42 - BTN_H / 2;
  }

  // ── Velocity-based flee from cursor ──────────────────────────────────────
  // Skip entirely when not actively playing — pause/controls/game-over overlays
  // still trigger re-renders on mouse move, and we don't want the scream then.
  const interactive = !state.paused && !state.controlsOpen && !state.gameOver;
  const btnCX = btnX + BTN_W / 2;
  const btnCY = btnY + BTN_H / 2;
  const dx    = gc.mouseX - btnCX;
  const dy    = gc.mouseY - btnCY;
  const dist  = Math.sqrt(dx * dx + dy * dy);
  const dt    = 1 / 60;   // assume ~60fps for the physics step

  const isFleeing = interactive && dist < FLEE_R && dist > 1;
  if (isFleeing) {
    // Repulsion force gets stronger the closer the cursor is
    const mag = FORCE * Math.pow((FLEE_R - dist) / FLEE_R, 1.5) * dt;
    btnVX -= (dx / dist) * mag;
    btnVY -= (dy / dist) * mag;
    // Play sound on the leading edge of each new approach
    if (!wasFleeing) {
      gc.sounds.play("clickDontClick", { volume: 0.6 });
    }
  }
  wasFleeing = isFleeing;

  if (interactive) {
    // Apply damping and integrate
    btnVX *= DAMP;
    btnVY *= DAMP;
    btnX  += btnVX * dt;
    btnY  += btnVY * dt;

    // Clamp inside box with a bounce
    const pad = 16;
    const minX = topBoxX + pad;
    const maxX = topBoxX + topBoxWidth  - pad - BTN_W;
    const minY = topBoxY + pad;
    const maxY = topBoxY + topBoxHeight - pad - BTN_H;

    if (btnX < minX) { btnX = minX; btnVX = Math.abs(btnVX) * 0.4; }
    if (btnX > maxX) { btnX = maxX; btnVX = -Math.abs(btnVX) * 0.4; }
    if (btnY < minY) { btnY = minY; btnVY = Math.abs(btnVY) * 0.4; }
    if (btnY > maxY) { btnY = maxY; btnVY = -Math.abs(btnVY) * 0.4; }
  }

  // ── Draw button ───────────────────────────────────────────────────────────
  const hovered = gc.mouseX >= btnX && gc.mouseX <= btnX + BTN_W &&
                  gc.mouseY >= btnY && gc.mouseY <= btnY + BTN_H;

  if (gc.levelBGLoaded) {
    ctx.drawImage(gc.levelBGImg, 326, 132, 888, 810, btnX, btnY, BTN_W, BTN_H);
  } else {
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth   = 3;
    ctx.strokeRect(btnX, btnY, BTN_W, BTN_H);
  }
  ctx.fillStyle    = "#1a1a1a";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.font         = `bold ${Math.round(BTN_H * 0.42)}px ${displayFont}`;
  ctx.fillText(hovered ? "DONT CLICK" : "CLICK ME", btnX + BTN_W / 2, btnY + BTN_H / 2);

  gc.hitAreas.push({
    x: btnX, y: btnY, w: BTN_W, h: BTN_H,
    action: () => { gc.loseLife(); },
  });

  // ── RAF loop — keep animating while on this level ─────────────────────────
  cancelAnimationFrame(animId5);
  if (state.currentLevel === 5 && !state.paused && !state.gameOver && !state.controlsOpen) {
    animId5 = requestAnimationFrame(() => {
      if (state.currentLevel === 5 && !state.paused && !state.gameOver && !state.controlsOpen) {
        gc.render();
      }
    });
  }

  // ── Hidden target dot ─────────────────────────────────────────────────────
  const dotCX = topBoxX + topBoxWidth  * 0.87;
  const dotCY = topBoxY + topBoxHeight * 0.76;

  ctx.fillStyle = state.darkMode ? "#1e1e1e" : "#e8e8e8";
  ctx.beginPath();
  ctx.arc(dotCX, dotCY, DOT_R, 0, Math.PI * 2);
  ctx.fill();

  gc.hitAreas.push({
    x: dotCX - 18, y: dotCY - 18, w: 36, h: 36,
    noCursor: true,
    action: () => {
      cancelAnimationFrame(animId5);
      resetBtn();
      state.currentLevel  = 6;
      state.levelSubPhase = "";
      state.levelTimerEnd = 0;
      gc.render();
    },
  });
};
