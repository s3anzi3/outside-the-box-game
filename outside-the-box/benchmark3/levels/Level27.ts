import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q27 — Steady Hand ─────────────────────────────────────────────────────────
// A marker sweeps a bar. Hit STOP while it sits in the green zone. A reaction /
// timing test — the green band is generous, but the marker is quick.

const PERIOD = 1400;        // ms for a full left→right→left sweep
const ZONE_LO = 0.42;       // green zone bounds (fraction of bar)
const ZONE_HI = 0.58;

let start27 = 0;
let raf27   = 0;

export const drawLevel27 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf27);
    drawWinScreen(gc, 'STEADY.', 'Right in the green. Timing is its own kind of thinking.', 28);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); start27 = Date.now(); }

  // Marker position (ping-pong 0..1)
  const phase = ((Date.now() - start27) % PERIOD) / PERIOD;     // 0..1
  const pos   = phase < 0.5 ? phase * 2 : 2 - phase * 2;        // 0→1→0

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('Stop the marker in the green.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  // Bar
  const barW = topBoxWidth * 0.7;
  const barH = topBoxHeight * 0.16;
  const barX = cx - barW / 2;
  const barY = topBoxY + topBoxHeight * 0.36;
  ctx.fillStyle = state.darkMode ? '#1a1a1a' : '#dddddd';
  ctx.fillRect(barX, barY, barW, barH);

  // Green zone
  ctx.fillStyle = 'rgba(70, 200, 90, 0.55)';
  ctx.fillRect(barX + barW * ZONE_LO, barY, barW * (ZONE_HI - ZONE_LO), barH);

  // Border
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(barX, barY, barW, barH);

  // Marker
  const mx = barX + barW * pos;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.fillRect(mx - 4, barY - 8, 8, barH + 16);
  ctx.strokeRect(mx - 4, barY - 8, 8, barH + 16);

  // STOP button
  const btnW = topBoxWidth * 0.24;
  const btnH = 54;
  drawChoice(gc, 'STOP', cx - btnW / 2, topBoxY + topBoxHeight * 0.66, btnW, btnH, () => {
    const livePhase = ((Date.now() - start27) % PERIOD) / PERIOD;
    const livePos   = livePhase < 0.5 ? livePhase * 2 : 2 - livePhase * 2;
    if (livePos >= ZONE_LO && livePos <= ZONE_HI) {
      state.levelSubPhase = 'win';
    } else {
      gc.loseLife();
    }
    gc.render();
  }, { fontSize: 26, fill: '#3a7a45', textColor: '#ffffff' });

  // Animation loop
  cancelAnimationFrame(raf27);
  if (state.currentLevel === 27 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf27 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 27 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
