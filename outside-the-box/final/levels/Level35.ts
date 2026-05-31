import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q35 — Pattern Recall (Simon) ──────────────────────────────────────────────
// The exam flashes a sequence across four panels; repeat it back. A memory/focus
// test.

const SEQ_LEN  = 4;
const SHOW_ON  = 520;   // ms a panel stays lit
const SHOW_GAP = 240;   // ms dark between panels
const LEAD_IN  = 600;   // ms pause before the sequence starts

const PANELS = [
  { on: '#e25b5b', off: '#5a2a2a' },
  { on: '#5bbf6f', off: '#244a2c' },
  { on: '#5b8fe2', off: '#26334a' },
  { on: '#e2c25b', off: '#4a4124' },
];

let seq35: number[] = [];
let phase35: 'show' | 'input' = 'show';
let phaseStart35 = 0;
let inputPos35 = 0;
let raf35 = 0;

const newSequence = () => {
  seq35 = Array.from({ length: SEQ_LEN }, () => Math.floor(Math.random() * 4));
  phase35 = 'show';
  phaseStart35 = Date.now();
  inputPos35 = 0;
};

export const drawLevel35 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight, topBoxWidth } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf35);
    drawWinScreen(gc, 'RECALLED.', 'Focus confirmed. You held the pattern.', 36);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); newSequence(); }

  let lit = -1;
  if (phase35 === 'show') {
    const elapsed = Date.now() - phaseStart35 - LEAD_IN;
    if (elapsed < 0) {
      lit = -1;
    } else {
      const step = Math.floor(elapsed / (SHOW_ON + SHOW_GAP));
      if (step >= seq35.length) {
        phase35 = 'input';
        inputPos35 = 0;
      } else if (elapsed % (SHOW_ON + SHOW_GAP) < SHOW_ON) {
        lit = seq35[step];
      }
    }
  }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText(phase35 === 'show' ? 'Watch carefully…' : 'Now repeat the pattern.',
    cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  ctx.font = `14px ${bodyFont}`;
  ctx.fillStyle = t.fgDim;
  ctx.fillText(
    phase35 === 'input' ? `${inputPos35} / ${seq35.length}` : ' ',
    cx, topBoxY + topBoxHeight * 0.20);

  const gridW = topBoxWidth * 0.46;
  const gridH = topBoxHeight * 0.56;
  const gx = cx - gridW / 2;
  const gy = topBoxY + topBoxHeight * 0.28;
  const gap = topBoxWidth * 0.02;
  const cellW = (gridW - gap) / 2;
  const cellH = (gridH - gap) / 2;

  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const bx = gx + col * (cellW + gap);
    const by = gy + row * (cellH + gap);
    ctx.fillStyle = (i === lit) ? PANELS[i].on : PANELS[i].off;
    ctx.fillRect(bx, by, cellW, cellH);
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, cellW, cellH);

    if (phase35 === 'input') {
      gc.hitAreas.push({
        x: bx, y: by, w: cellW, h: cellH,
        action: () => {
          if (seq35[inputPos35] === i) {
            inputPos35++;
            gc.sounds.play('typing', { volume: 0.4, restart: true });
            if (inputPos35 >= seq35.length) { state.levelSubPhase = 'win'; }
          } else {
            gc.loseLife();
            newSequence();
          }
          gc.render();
        },
      });
    }
  }

  cancelAnimationFrame(raf35);
  if (state.currentLevel === 35 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver &&
      state.levelSubPhase === 'active' && phase35 === 'show') {
    raf35 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 35 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
