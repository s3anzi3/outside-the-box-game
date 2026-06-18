import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';

const CODE_LEN       = 10;
const FLASH_SECS     = 0.75;

// ── Helpers ───────────────────────────────────────────────────────────────────
function genCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += Math.floor(Math.random() * 10);
  return s;
}

// ── Module-level state ────────────────────────────────────────────────────────
let animId22       = 0;
let lastTime22     = 0;
let flashCode22    = '';
let phase22        = '';   // 'waiting' | 'flash' | 'input'
let phaseElapsed22 = 0;
let waitSecs22     = 5;    // randomised on each attempt
let input22        = '';
let listenersAdded22 = false;

function submitAnswer22(gc: GameContext): void {
  if (input22 === flashCode22) {
    gc.state.levelSubPhase = 'win';
    gc.render();
  } else {
    gc.loseLife();
    input22        = '';
    phase22        = 'waiting';
    phaseElapsed22 = 0;
    waitSecs22     = 3 + Math.random() * 5;
    flashCode22    = genCode();
    gc.render();
  }
}

function ensureListeners22(gc: GameContext): void {
  if (listenersAdded22) return;
  listenersAdded22 = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (gc.state.currentLevel !== 22 || gc.state.currentScreen !== 'level') return;
    if (phase22 !== 'input') return;
    if (gc.state.paused || gc.state.controlsOpen || gc.state.gameOver) return;
    if (e.key === 'Backspace') {
      input22 = input22.slice(0, -1);
      gc.render();
    } else if (e.key === 'Enter') {
      if (input22.length === CODE_LEN) submitAnswer22(gc);
    } else if (/^\d$/.test(e.key) && input22.length < CODE_LEN) {
      input22 += e.key;
      gc.render();
    }
  });
}

// ── Draw function ─────────────────────────────────────────────────────────────
export const drawLevel22 = (gc: GameContext) => {
  ensureListeners22(gc);

  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;
  const cy = topBoxY + topBoxHeight * 0.5;

  // ── Win screen ─────────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(animId22);
    if (state.winChimeFor !== 22) { state.winChimeFor = 22; gc.sounds.ui('chime'); }
    ctx.fillStyle    = t.pass;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 44px ${displayFont}`;
    ctx.fillText('CORRECT!', cx, topBoxY + topBoxHeight * 0.34);
    ctx.font      = `20px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    ctx.fillText('Sharp eyes.', cx, topBoxY + topBoxHeight * 0.50);
    drawButton(gc, 'CONTINUE  →', cx - 100, topBoxY + topBoxHeight * 0.65, 200, 48, () => {
      state.currentLevel  = 23;
      state.levelSubPhase = '';
      gc.render();
    });
    return;
  }

  // ── Initialise on fresh entry ──────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    flashCode22    = genCode();
    phase22        = 'waiting';
    phaseElapsed22 = 0;
    waitSecs22     = 3 + Math.random() * 5;
    input22        = '';
    lastTime22     = 0;
    state.winChimeFor = -1;
    state.levelSubPhase = 'active';
  }

  // ── Waiting phase — no hint about timing ──────────────────────────────────
  if (phase22 === 'waiting') {
    ctx.fillStyle    = t.fgDim;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `18px ${bodyFont}`;
    ctx.fillText('Stay alert.', cx, cy);
  }

  // ── Flash phase — giant digits (visible beneath pause overlay) ─────────────
  if (phase22 === 'flash') {
    // Pulsing background highlight so it's obvious something is flashing
    const pulse = 0.08 + 0.06 * Math.sin(Date.now() / 60);
    ctx.fillStyle = state.darkMode
      ? `rgba(255,255,255,${pulse})`
      : `rgba(0,0,0,${pulse})`;
    ctx.fillRect(topBoxX, topBoxY, topBoxWidth, topBoxHeight);

    ctx.fillStyle    = t.fg;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 80px ${displayFont}`;

    const slotW = topBoxWidth / (CODE_LEN + 1);
    for (let i = 0; i < CODE_LEN; i++) {
      const dx = topBoxX + slotW * (i + 1);
      ctx.fillText(flashCode22[i], dx, cy);
    }

    // Small "NOW!" label
    ctx.font      = `bold 14px ${bodyFont}`;
    ctx.fillStyle = t.seal;
    ctx.fillText('MEMORISE NOW', cx, cy + 70);
  }

  // ── Input phase ────────────────────────────────────────────────────────────
  if (phase22 === 'input') {
    ctx.fillStyle    = t.fgMid;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `18px ${bodyFont}`;
    ctx.fillText('Enter the sequence you saw:', cx, cy - 65);

    const boxW  = topBoxWidth * 0.72;
    const boxH  = 64;
    const boxX  = cx - boxW / 2;
    const boxY  = cy - boxH / 2 - 8;
    const slotW = boxW / CODE_LEN;

    ctx.strokeStyle = t.stroke;
    ctx.lineWidth   = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    for (let i = 0; i < CODE_LEN; i++) {
      const sx = boxX + slotW * i;

      // Slot dividers
      if (i > 0) {
        ctx.strokeStyle = t.divider;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(sx, boxY + 6);
        ctx.lineTo(sx, boxY + boxH - 6);
        ctx.stroke();
      }

      const charCx = sx + slotW / 2;

      if (i < input22.length) {
        ctx.fillStyle    = t.fg;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = `bold 34px ${displayFont}`;
        ctx.fillText(input22[i], charCx, boxY + boxH / 2);
      } else if (i === input22.length) {
        // Blinking cursor on next empty slot
        const blink = Math.floor(Date.now() / 530) % 2 === 0;
        if (blink) {
          ctx.strokeStyle = t.fg;
          ctx.lineWidth   = 2;
          ctx.beginPath();
          ctx.moveTo(charCx, boxY + 14);
          ctx.lineTo(charCx, boxY + boxH - 14);
          ctx.stroke();
        }
      } else {
        // Empty slot indicator
        ctx.fillStyle    = t.divider;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = `bold 34px ${displayFont}`;
        ctx.fillText('_', charCx, boxY + boxH / 2 + 8);
      }
    }

    // Submit button (appears when all digits filled)
    if (input22.length === CODE_LEN) {
      drawButton(gc, 'SUBMIT →', cx - 85, boxY + boxH + 18, 170, 46, () => {
        submitAnswer22(gc);
      });
    }

    ctx.fillStyle    = t.fgDim;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `10px ${bodyFont}`;
    const hintY = boxY + boxH + (input22.length === CODE_LEN ? 80 : 22);
    ctx.fillText('type digits 0–9   ·   Backspace to erase   ·   Enter to submit', cx, hintY);
  }

  // ── RAF loop (drives phase timing; dt=0 while paused so flash freezes) ────
  cancelAnimationFrame(animId22);
  if (state.currentLevel === 22 && !state.gameOver && state.levelSubPhase === 'active') {
    animId22 = requestAnimationFrame((ts: number) => {
      if (gc.state.currentLevel !== 22 || gc.state.currentScreen !== 'level') return;
      if (gc.state.levelSubPhase !== 'active') return;

      const rawDt = lastTime22 ? Math.min((ts - lastTime22) / 1000, 0.05) : 0.016;
      lastTime22  = ts;
      // Freeze time while paused — flash stays visible through overlay
      const dt = (gc.state.paused || gc.state.controlsOpen) ? 0 : rawDt;

      if (phase22 === 'waiting' || phase22 === 'flash') {
        phaseElapsed22 += dt;

        if (phase22 === 'waiting' && phaseElapsed22 >= waitSecs22) {
          phase22        = 'flash';
          phaseElapsed22 = 0;
          // Play the first second of "All of the Lights" on every flash
          gc.sounds.play("allOfTheLights", { loop: true, volume: 0.85, restart: true });
          setTimeout(() => gc.sounds.stop("allOfTheLights"), 1000);
        } else if (phase22 === 'flash' && phaseElapsed22 >= FLASH_SECS) {
          phase22        = 'input';
          phaseElapsed22 = 0;
          input22        = '';
        }
      }

      gc.render();
    });
  }
};
