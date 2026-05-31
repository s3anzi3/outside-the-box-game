import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q32 — Crank It to Eleven ──────────────────────────────────────────────────
// A dial labelled "MAX 10". Drag it all the way up — except "all the way" isn't 10.
// The track quietly extends one notch further. You have to push past the maximum.

const MAXVAL = 11;
const WIN_AT = 10.6;        // anything in the 11 notch wins
let raf32 = 0;
let dial32 = 0;

export const drawLevel32 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf32);
    drawWinScreen(gc, 'ELEVEN.', 'The label said 10. "All the way up" was always one notch further.', 33);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); dial32 = 0; }

  // Track geometry — represents 0..MAXVAL
  const trackX = topBoxX + topBoxWidth * 0.12;
  const trackW = topBoxWidth * 0.76;
  const trackY = topBoxY + topBoxHeight * 0.46;
  const trackH = 10;

  // Current value from drag (only while the mouse button is held over the row)
  const rowTop = trackY - 30, rowBot = trackY + 40;
  let value = dial32;
  if (gc.mouseDown && gc.mouseY >= rowTop && gc.mouseY <= rowBot) {
    const frac = Math.max(0, Math.min(1, (gc.mouseX - trackX) / trackW));
    value = frac * MAXVAL;
    dial32 = value;
  }

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('Turn the dial ALL the way up.', cx, topBoxY + topBoxHeight * 0.14, topBoxWidth * 0.9);

  // Track
  ctx.fillStyle = state.darkMode ? '#222' : '#ccc';
  ctx.fillRect(trackX, trackY, trackW, trackH);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(trackX, trackY, trackW, trackH);

  // Tick labels 0..10 (the 11 notch is left unlabeled)
  ctx.fillStyle = t.fgDim;
  ctx.font = `11px ${bodyFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= 10; i++) {
    const tx = trackX + (i / MAXVAL) * trackW;
    ctx.fillRect(tx - 0.5, trackY - 6, 1, 6);
    ctx.fillText(String(i), tx, trackY + trackH + 6);
  }
  // "MAX" marker over 10
  ctx.fillStyle = t.fgMid;
  ctx.font = `bold 11px ${displayFont}`;
  ctx.fillText('MAX', trackX + (10 / MAXVAL) * trackW, trackY - 22);

  // Knob
  const knobX = trackX + (value / MAXVAL) * trackW;
  ctx.fillStyle = value >= WIN_AT ? '#39c46b' : (state.darkMode ? '#eee' : '#222');
  ctx.beginPath();
  ctx.arc(knobX, trackY + trackH / 2, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Value readout
  ctx.fillStyle = t.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `bold 22px ${displayFont}`;
  ctx.fillText(value >= WIN_AT ? '11' : String(Math.floor(value)), cx, topBoxY + topBoxHeight * 0.66);

  ctx.fillStyle = t.fgDim;
  ctx.font = `13px ${bodyFont}`;
  ctx.fillText('Click and drag the knob.', cx, topBoxY + topBoxHeight * 0.78);

  // Win when pushed into the 11 notch
  if (value >= WIN_AT && state.levelSubPhase === 'active') {
    state.levelSubPhase = 'win';
    dial32 = 0;
    gc.sounds.play('correctAnswer', { volume: 0.5 });
    gc.render();
    return;
  }

  // Keep redrawing during a drag so the knob tracks smoothly
  cancelAnimationFrame(raf32);
  if (state.currentLevel === 32 && state.currentScreen === 'level' &&
      gc.mouseDown && !state.paused && !state.gameOver && state.levelSubPhase === 'active') {
    raf32 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 32 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
